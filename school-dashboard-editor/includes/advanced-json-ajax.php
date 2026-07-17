<?php

defined('ABSPATH') || exit;

// ─── Constants ────────────────────────────────────────────────────────────────

define('LRSD_SF_ADV_MAX_HISTORY', 20);
define('LRSD_SF_ADV_HISTORY_OPTION', 'lrsd_sf_json_version_history');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the stored version history array (newest first).
 */
function lrsd_sf_get_json_version_history() {
    $raw = get_option(LRSD_SF_ADV_HISTORY_OPTION, []);
    return is_array($raw) ? $raw : [];
}

/**
 * Import a full dataset array (as produced by lrsd_sf_get_school_dataset) into
 * individual school posts, mirroring lrsd_sf_handle_import.
 *
 * @param  array  $decoded  Decoded JSON dataset.
 * @return array{created:int,updated:int,errors:int}
 */
function lrsd_sf_import_dataset(array $decoded) {
    $last_updated = '';
    if (isset($decoded['lastUpdated']) && is_scalar($decoded['lastUpdated'])) {
        $last_updated = sanitize_text_field((string)$decoded['lastUpdated']);
    }

    $created = 0;
    $updated = 0;
    $errors  = 0;

    $skip_keys = lrsd_sf_get_reserved_dataset_keys();
    $global_custom_cards = [];

    if (isset($decoded['globalCustomCards']) && is_array($decoded['globalCustomCards'])) {
        $global_custom_cards = $decoded['globalCustomCards'];
    }

    foreach ($decoded as $key => $school) {
        if (lrsd_sf_is_reserved_dataset_key($key)) {
            continue;
        }
        if (!is_array($school)) {
            continue;
        }

        $school_id = '';
        if (isset($school['id']) && is_scalar($school['id'])) {
            $school_id = sanitize_text_field((string)$school['id']);
        }
        if ($school_id === '' && is_string($key)) {
            $school_id = sanitize_text_field($key);
        }
        if ($school_id === '') {
            continue;
        }

        $school['id'] = $school_id;
        $school       = lrsd_sf_normalize_school_dashboard_data($school, $global_custom_cards);

        $school_name = isset($school['schoolName']) && is_scalar($school['schoolName'])
            ? sanitize_text_field((string)$school['schoolName'])
            : $school_id;

        $post_data = [
            'post_type'   => 'lr_school',
            'post_status' => 'publish',
            'post_title'  => $school_name,
        ];

        $existing_id = lrsd_sf_find_school_post_by_id($school_id);

        if ($existing_id) {
            $post_data['ID'] = $existing_id;
            $result = wp_update_post($post_data, true);
            if (!is_wp_error($result)) {
                update_post_meta($existing_id, 'lrsd_school_id', $school_id);
                update_post_meta($existing_id, 'lrsd_school_data', lrsd_sf_encode_school_data($school));
                $updated++;
            } else {
                $errors++;
            }
        } else {
            $result = wp_insert_post($post_data, true);
            if (!is_wp_error($result) && $result > 0) {
                update_post_meta($result, 'lrsd_school_id', $school_id);
                update_post_meta($result, 'lrsd_school_data', lrsd_sf_encode_school_data($school));
                $created++;
            } else {
                $errors++;
            }
        }
    }

    // Update fosMapLookup custom maps
    if (isset($decoded['fosMapLookup']) && is_array($decoded['fosMapLookup'])) {
        $defaults = [
            'J.H. BRUNS FOS', 'BÉLIVEAU FOS', 'WINDSOR PARK FOS',
            'JEANNE-SAUVÉ FOS', 'DAKOTA FOS', 'GLENLAWN FOS', 'NELSON MCINTYRE FOS',
        ];
        $custom_maps = [];
        foreach ($decoded['fosMapLookup'] as $fos_name => $path) {
            if (!in_array($fos_name, $defaults, true) && is_string($path)) {
                $custom_maps[sanitize_text_field($fos_name)] = sanitize_text_field($path);
            }
        }
        update_option('lrsd_sf_fos_catchment_maps', $custom_maps);
    }

    // Update global custom cards
    if (isset($decoded['globalCustomCards'])) {
        update_option('lrsd_sf_global_custom_cards', $global_custom_cards);
    }

    if ($last_updated === '') {
        $last_updated = wp_date('Y-m-d');
    }
    update_option('lrsd_schools_last_updated', $last_updated);
    lrsd_sf_flush_dataset_cache();

    return ['created' => $created, 'updated' => $updated, 'errors' => $errors];
}

/**
 * Snapshot the current live dataset into version history (newest first, capped at max).
 *
 * @param  string  $label  Human-readable label for this snapshot.
 */
function lrsd_sf_push_version_history($label = '') {
    $dataset     = lrsd_sf_get_school_dataset();
    $json        = wp_json_encode($dataset, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    // Count school entries (exclude meta keys)
    $school_count = 0;
    foreach ($dataset as $key => $val) {
        if (!in_array($key, ['lastUpdated', 'fosMapLookup', 'globalCustomCards'], true) && is_array($val)) {
            $school_count++;
        }
    }

    $entry = [
        'timestamp'   => time(),
        'label'       => $label !== '' ? $label : wp_date('Y-m-d H:i:s'),
        'schoolCount' => $school_count,
        'json'        => $json,
    ];

    $history = lrsd_sf_get_json_version_history();
    array_unshift($history, $entry);
    $history = array_slice($history, 0, LRSD_SF_ADV_MAX_HISTORY);
    update_option(LRSD_SF_ADV_HISTORY_OPTION, $history);
}

// ─── AJAX: Save ───────────────────────────────────────────────────────────────

function lrsd_sf_ajax_adv_save() {
    check_ajax_referer('lrsd_sf_adv_save', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => __('Permission denied.', 'lrsd-school-facilities')], 403);
    }

    $raw = isset($_POST['json']) ? trim(wp_unslash($_POST['json'])) : '';
    if ($raw === '') {
        wp_send_json_error(['message' => __('No JSON provided.', 'lrsd-school-facilities')], 400);
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        wp_send_json_error([
            'message' => sprintf(
                /* translators: %s: JSON error message */
                __('Invalid JSON: %s', 'lrsd-school-facilities'),
                json_last_error_msg()
            ),
        ], 400);
    }

    // Snapshot current live state into history BEFORE applying changes
    lrsd_sf_push_version_history(wp_date('Y-m-d H:i:s'));

    // Apply the submitted JSON
    $result = lrsd_sf_import_dataset($decoded);

    // Rebuild version history display data for the response
    $history = lrsd_sf_get_json_version_history();
    $history_display = array_map(static function ($ver) {
        return [
            'timestamp'   => (int)($ver['timestamp']   ?? 0),
            'label'       => (string)($ver['label']    ?? ''),
            'schoolCount' => (int)($ver['schoolCount'] ?? 0),
        ];
    }, $history);

    wp_send_json_success([
        'message' => sprintf(
            /* translators: 1: updated, 2: created, 3: errors */
            __('Saved. Updated: %1$d, Created: %2$d, Errors: %3$d.', 'lrsd-school-facilities'),
            $result['updated'],
            $result['created'],
            $result['errors']
        ),
        'history' => $history_display,
    ]);
}
add_action('wp_ajax_lrsd_sf_adv_save', 'lrsd_sf_ajax_adv_save');

// ─── AJAX: Get Version ────────────────────────────────────────────────────────

function lrsd_sf_ajax_adv_get_version() {
    check_ajax_referer('lrsd_sf_adv_restore', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => __('Permission denied.', 'lrsd-school-facilities')], 403);
    }

    $index = isset($_POST['version']) ? (int)$_POST['version'] : -1;
    if ($index < 0) {
        wp_send_json_error(['message' => __('Invalid version index.', 'lrsd-school-facilities')], 400);
    }

    $history = lrsd_sf_get_json_version_history();
    if (!isset($history[$index])) {
        wp_send_json_error(['message' => __('Version not found.', 'lrsd-school-facilities')], 404);
    }

    $ver  = $history[$index];
    $json = (string)($ver['json'] ?? '');

    // Re-pretty-print if it's compact JSON
    $decoded = json_decode($json, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $json = wp_json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    wp_send_json_success([
        'json'  => $json,
        'label' => (string)($ver['label'] ?? ''),
    ]);
}
add_action('wp_ajax_lrsd_sf_adv_get_version', 'lrsd_sf_ajax_adv_get_version');
