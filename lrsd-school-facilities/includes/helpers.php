<?php

defined('ABSPATH') || exit;

/**
 * Dataset keys reserved for global/non-school data.
 */
function lrsd_sf_get_reserved_dataset_keys() {
    return ['lastUpdated', 'fosMapLookup', 'globalCustomCards'];
}

/**
 * True when a key is one of the reserved non-school dataset keys.
 */
function lrsd_sf_is_reserved_dataset_key($key) {
    return in_array((string) $key, lrsd_sf_get_reserved_dataset_keys(), true);
}

/**
 * Find a school post ID by stable school ID.
 */
function lrsd_sf_find_school_post_by_id($school_id) {
    $school_id = sanitize_text_field((string) $school_id);
    if ($school_id === '') {
        return 0;
    }

    $posts = get_posts([
        'post_type'      => 'lr_school',
        'post_status'    => 'any',
        'posts_per_page' => 1,
        'fields'         => 'ids',
        'meta_query'     => [
            [
                'key'   => 'lrsd_school_id',
                'value' => $school_id,
            ],
        ],
        'no_found_rows'  => true,
    ]);

    return empty($posts) ? 0 : (int) $posts[0];
}

/**
 * Normalize stored school data into an array.
 */
function lrsd_sf_normalize_school_data($raw_data) {
    if (is_array($raw_data)) {
        return $raw_data;
    }

    if (is_string($raw_data) && $raw_data !== '') {
        $decoded = json_decode($raw_data, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
    }

    return [];
}

/**
 * Build dataset in the same JSON shape as the original static file.
 */
function lrsd_sf_get_school_dataset() {
    $dataset = [
        'lastUpdated'       => get_option('lrsd_schools_last_updated', ''),
        'fosMapLookup'      => lrsd_sf_get_fos_catchment_map(),
        'globalCustomCards' => lrsd_sf_get_global_custom_cards(),
    ];

    $posts = get_posts([
        'post_type'      => 'lr_school',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'title',
        'order'          => 'ASC',
        'no_found_rows'  => true,
    ]);

    foreach ($posts as $post) {
        $school_id = get_post_meta($post->ID, 'lrsd_school_id', true);
        $school_id = sanitize_text_field((string) $school_id);
        if ($school_id === '' || lrsd_sf_is_reserved_dataset_key($school_id)) {
            continue;
        }

        $school_data = lrsd_sf_normalize_school_data(get_post_meta($post->ID, 'lrsd_school_data', true));
        if (empty($school_data) || !is_array($school_data)) {
            continue;
        }

        // Skip schools with a blank school name to prevent empty sidebar entries.
        $school_name = trim((string) ($school_data['schoolName'] ?? ''));
        if ($school_name === '') {
            continue;
        }

        $dataset[$school_id] = $school_data;
    }

    return $dataset;
}

/**
 * Get nested value from an array path.
 */
function lrsd_sf_get_nested_value($data, array $path, $default = '') {
    $current = $data;

    foreach ($path as $segment) {
        if (!is_array($current) || !array_key_exists($segment, $current)) {
            return $default;
        }
        $current = $current[$segment];
    }

    return $current;
}

/**
 * Set nested value in an array path.
 */
function lrsd_sf_set_nested_value(array &$data, array $path, $value) {
    if (empty($path)) {
        return false;
    }

    $current    = &$data;
    $last_index = count($path) - 1;

    foreach ($path as $index => $segment) {
        if ($index === $last_index) {
            $current[$segment] = $value;
            return true;
        }

        if (!isset($current[$segment])) {
            $current[$segment] = [];
        } elseif (!is_array($current[$segment])) {
            return false;
        }

        $current = &$current[$segment];
    }

    return false;
}

/**
 * Set notice transient for the current user.
 */
function lrsd_sf_set_editor_notice($message, $type = 'success') {
    $user_id = get_current_user_id();
    if (!$user_id) {
        return;
    }

    set_transient(
        'lrsd_sf_editor_notice_' . $user_id,
        [
            'message' => wp_kses_post($message),
            'type'    => sanitize_key($type),
        ],
        MINUTE_IN_SECONDS
    );
}

/**
 * Set notice transient for the import/export admin page.
 */
function lrsd_sf_set_admin_notice($message, $type = 'success') {
    $user_id = get_current_user_id();
    if (!$user_id) {
        return;
    }

    set_transient(
        'lrsd_sf_admin_notice_' . $user_id,
        [
            'message' => wp_kses_post($message),
            'type'    => sanitize_key($type),
        ],
        MINUTE_IN_SECONDS
    );
}

/**
 * Read and clear the current user's admin notice.
 */
function lrsd_sf_get_admin_notice() {
    $user_id = get_current_user_id();
    if (!$user_id) {
        return null;
    }

    $key    = 'lrsd_sf_admin_notice_' . $user_id;
    $notice = get_transient($key);
    if ($notice) {
        delete_transient($key);
    }

    return $notice ?: null;
}

/**
 * Encode school data for storage in post meta.
 */
function lrsd_sf_encode_school_data(array $school_data) {
    return wp_slash(wp_json_encode($school_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

/**
 * Clear cached dataset used by REST responses.
 */
function lrsd_sf_flush_dataset_cache() {
    delete_transient('lrsd_sf_rest_dataset');
}

/**
 * Dropdown option lists for select fields, merged with custom user-added options.
 */
function lrsd_sf_get_dropdown_options() {
    $defaults = [
        'familyOfSchools' => [
            'BÉLIVEAU FOS',
            'DAKOTA FOS',
            'GLENLAWN FOS',
            'J.H. BRUNS FOS',
            'JEANNE-SAUVÉ FOS',
            'NELSON MCINTYRE FOS',
            'WINDSOR PARK FOS',
            'Other',
        ],
        'schoolLevel' => [
            'Elementary School',
            'High School',
        ],
        'program' => [
            'English Program',
            'French Immersion',
            'French Immersion & Middle Immersion',
            'French Immersion Program',
            'Technical Vocational',
        ],
        'busLoop' => [
            'YES',
            'NO',
            'N/A',
            'Required',
            'Inaccessible',
            'Joint use agreement with neighbouring facility',
        ],
        'elevator' => [
            'YES',
            'NO',
            'n/a',
            'Full',
            'Required',
        ],
    ];

    $custom = get_option('lrsd_sf_custom_dropdown_options', []);
    if (is_array($custom)) {
        foreach ($custom as $key => $extra) {
            if (isset($defaults[$key]) && is_array($extra)) {
                $defaults[$key] = array_values(array_unique(array_merge($defaults[$key], $extra)));
            }
        }
    }

    return $defaults;
}

/**
 * Returns the Family of Schools → catchment-map-file lookup, merged with any custom entries.
 * This is also included in the REST dataset so the dashboard can use it dynamically.
 */
function lrsd_sf_get_fos_catchment_map() {
    $defaults = [
        'J.H. BRUNS FOS'      => 'public/maps/bruns-fos-map.svg',
        'BÉLIVEAU FOS'        => 'public/maps/beliveau-fos-map.svg',
        'WINDSOR PARK FOS'    => 'public/maps/wpc-fos-map.svg',
        'JEANNE-SAUVÉ FOS'    => 'public/maps/cjs-fos-map.svg',
        'DAKOTA FOS'          => 'public/maps/dakota-fos-map.svg',
        'GLENLAWN FOS'        => 'public/maps/glenlawn-fos-map.svg',
        'NELSON MCINTYRE FOS' => 'public/maps/nms-fos-map.svg',
    ];
    $custom = get_option('lrsd_sf_fos_catchment_maps', []);
    if (is_array($custom)) {
        $defaults = array_merge($defaults, $custom);
    }
    return $defaults;
}

/**
 * Returns global custom card templates (shared across all schools).
 */
function lrsd_sf_get_global_custom_cards() {
    $cards = get_option('lrsd_sf_global_custom_cards', []);
    return is_array($cards) ? array_values($cards) : [];
}

/**
 * Returns available display types for custom cards.
 */
function lrsd_sf_get_custom_card_display_types() {
    return [
        'list' => __('Key–Value List', 'lrsd-school-facilities'),
        'stat' => __('Stats / Highlights', 'lrsd-school-facilities'),
    ];
}

/**
 * Returns the list of all standard card type IDs with human-readable labels.
 */
function lrsd_sf_get_all_card_types() {
    return [
        'school_header'       => __('Header / School Photo', 'lrsd-school-facilities'),
        'details'             => __('Details', 'lrsd-school-facilities'),
        'additions'           => __('Additions', 'lrsd-school-facilities'),
        'enrolment_capacity'  => __('Enrolment & Capacity', 'lrsd-school-facilities'),
        'history'             => __('Historic Enrolment', 'lrsd-school-facilities'),
        'projection'          => __('Projected Enrolment', 'lrsd-school-facilities'),
        'building_systems'    => __('Building Systems', 'lrsd-school-facilities'),
        'accessibility'       => __('Accessibility', 'lrsd-school-facilities'),
        'playground'          => __('Playground', 'lrsd-school-facilities'),
        'transportation'      => __('Transportation', 'lrsd-school-facilities'),
        'childcare'           => __('Childcare & BLAST', 'lrsd-school-facilities'),
        'catchment_map'       => __('Catchment Map', 'lrsd-school-facilities'),
        'projects_provincial' => __('Provincial Projects', 'lrsd-school-facilities'),
        'projects_local'      => __('Local Projects', 'lrsd-school-facilities'),
    ];
}

/**
 * AJAX: Add a custom option to a dropdown.
 */
function lrsd_sf_ajax_add_custom_option() {
    check_ajax_referer('lrsd_sf_custom_option_nonce', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => __('Permission denied.', 'lrsd-school-facilities')], 403);
    }

    $option_key = isset($_POST['option_key']) ? sanitize_key($_POST['option_key']) : '';
    $option_val = isset($_POST['option_val']) ? sanitize_text_field(wp_unslash($_POST['option_val'])) : '';
    $map_path   = isset($_POST['map_path'])   ? sanitize_text_field(wp_unslash($_POST['map_path']))   : '';

    $valid_keys = ['familyOfSchools', 'schoolLevel', 'program', 'busLoop', 'elevator'];
    if (!in_array($option_key, $valid_keys, true) || $option_val === '') {
        wp_send_json_error(['message' => __('Invalid data.', 'lrsd-school-facilities')], 400);
    }

    $custom = get_option('lrsd_sf_custom_dropdown_options', []);
    if (!is_array($custom)) {
        $custom = [];
    }
    if (!isset($custom[$option_key])) {
        $custom[$option_key] = [];
    }
    if (!in_array($option_val, $custom[$option_key], true)) {
        $custom[$option_key][] = $option_val;
    }
    update_option('lrsd_sf_custom_dropdown_options', $custom);

    // If this is a new FOS option with a catchment map path, store it.
    if ($option_key === 'familyOfSchools' && $map_path !== '') {
        $maps = get_option('lrsd_sf_fos_catchment_maps', []);
        if (!is_array($maps)) {
            $maps = [];
        }
        $maps[$option_val] = $map_path;
        update_option('lrsd_sf_fos_catchment_maps', $maps);
    }

    wp_send_json_success(['option_val' => $option_val]);
}

/**
 * admin-post: Save global custom card templates from the Card Editor page.
 */
function lrsd_sf_handle_save_global_cards() {
    check_admin_referer('lrsd_sf_save_global_cards_action', 'lrsd_sf_save_global_cards_nonce');

    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to perform this action.', 'lrsd-school-facilities'));
    }

    $raw = isset($_POST['lrsd_sf_global_cards_json'])
        ? trim(wp_unslash($_POST['lrsd_sf_global_cards_json']))
        : '';

    $cards = [];
    if ($raw !== '') {
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            foreach ($decoded as $card) {
                if (!is_array($card)) {
                    continue;
                }
                $s_card = [
                    'id'       => sanitize_key($card['id'] ?? ('custom_' . wp_generate_password(6, false))),
                    'title'    => sanitize_text_field($card['title'] ?? ''),
                    'icon'     => sanitize_text_field($card['icon'] ?? ''),
                    'category' => sanitize_text_field($card['category'] ?? ''),
                    'cardType' => in_array($card['cardType'] ?? 'list', ['list', 'stat'], true) ? $card['cardType'] : 'list',
                    'items'    => [],
                    'notes'    => sanitize_textarea_field($card['notes'] ?? ''),
                ];
                if (is_array($card['items'] ?? null)) {
                    foreach ($card['items'] as $item) {
                        if (!is_array($item)) {
                            continue;
                        }
                        $s_card['items'][] = [
                            'label' => sanitize_text_field($item['label'] ?? ''),
                        ];
                    }
                }
                if ($s_card['id'] !== '') {
                    $cards[] = $s_card;
                }
            }
        }
    }

    update_option('lrsd_sf_global_custom_cards', $cards);
    lrsd_sf_push_version_history(__('Card templates save', 'lrsd-school-facilities'));
    lrsd_sf_flush_dataset_cache();
    lrsd_sf_set_admin_notice(__('Global card templates saved.', 'lrsd-school-facilities'), 'success');

    wp_safe_redirect(add_query_arg(['page' => 'lrsd-school-facilities-cards'], admin_url('admin.php')));
    exit;
}
