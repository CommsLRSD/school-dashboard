<?php

defined('ABSPATH') || exit;

/**
 * Handle bulk-update form submission.
 *
 * Accepts a POST from the Bulk Update admin page and applies category-specific
 * field edits to every school that was included in the form.
 */
function lrsd_sf_handle_bulk_update() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to bulk-update school data.', 'lrsd-school-facilities'));
    }

    check_admin_referer('lrsd_sf_bulk_update_action', 'lrsd_sf_bulk_update_nonce');

    $category = isset($_POST['bulk_category']) ? sanitize_key($_POST['bulk_category']) : '';
    $schools  = isset($_POST['lrsd_bulk_schools']) && is_array($_POST['lrsd_bulk_schools'])
        ? wp_unslash($_POST['lrsd_bulk_schools'])
        : [];

    if (empty($category) || empty($schools)) {
        lrsd_sf_set_admin_notice(__('No data submitted.', 'lrsd-school-facilities'), 'error');
        wp_safe_redirect(lrsd_sf_bulk_redirect_url($category));
        exit;
    }

    // Snapshot current state into version history before applying bulk changes
    lrsd_sf_push_version_history(
        sprintf(
            /* translators: %s: category name */
            __('Bulk update: %s', 'lrsd-school-facilities'),
            $category
        )
    );

    $field_map = lrsd_sf_get_simple_field_map();
    // Only process fields belonging to the submitted category
    $cat_fields = array_filter($field_map, static function ($field) use ($category) {
        return ($field['section'] ?? '') === $category;
    });

    $playground_categories = ['playground'];
    $series_categories = ['history', 'projection'];
    $project_paths = [
        'projects_provincial_requested'  => ['projects', 'provincial', 'requested'],
        'projects_provincial_inProgress' => ['projects', 'provincial', 'inProgress'],
        'projects_provincial_completed'  => ['projects', 'provincial', 'completed'],
        'projects_local_requested'       => ['projects', 'local', 'requested'],
        'projects_local_inProgress'      => ['projects', 'local', 'inProgress'],
        'projects_local_completed'       => ['projects', 'local', 'completed'],
    ];

    $updated = 0;

    foreach ($schools as $school_id_key => $field_values) {
        $school_id_key = sanitize_text_field((string)$school_id_key);
        if (lrsd_sf_is_reserved_dataset_key($school_id_key)) {
            continue;
        }
        $post_id = lrsd_sf_find_school_post_by_id($school_id_key);
        if (!$post_id) {
            continue;
        }

        $school_data = lrsd_sf_normalize_school_data(get_post_meta($post_id, 'lrsd_school_data', true));
        if (empty($school_data)) {
            continue;
        }

        // Apply simple fields for the current category
        foreach ($cat_fields as $field_key => $field) {
            if (!array_key_exists($field_key, $field_values)) {
                continue;
            }
            $raw = $field_values[$field_key];
            if ($field['type'] === 'int') {
                $val = is_numeric($raw) ? (int)$raw : 0;
            } else {
                $val = sanitize_text_field((string)$raw);
            }
            lrsd_sf_set_nested_value($school_data, $field['path'], $val);
        }

        // Playground (special textarea handling)
        if (in_array($category, $playground_categories, true) && isset($field_values['playground_lines'])) {
            $lines = explode("\n", sanitize_textarea_field((string)$field_values['playground_lines']));
            $lines = array_values(array_filter(array_map('trim', $lines), static function ($line) { return $line !== ''; }));
            lrsd_sf_set_nested_value($school_data, ['playground'], $lines);
        }

        if (in_array($category, $series_categories, true)) {
            $labels_raw = isset($field_values['enrolment_labels']) && is_array($field_values['enrolment_labels'])
                ? $field_values['enrolment_labels']
                : [];
            $values_raw = isset($field_values['enrolment_values']) && is_array($field_values['enrolment_values'])
                ? $field_values['enrolment_values']
                : [];
            $series = lrsd_sf_parse_posted_enrolment_series_points($labels_raw, $values_raw);
            lrsd_sf_set_nested_value($school_data, ['enrolment', $category], $series);
        }

        if ($category === 'additions') {
            $years_raw = isset($field_values['additions_year']) && is_array($field_values['additions_year'])
                ? $field_values['additions_year']
                : [];
            $sizes_raw = isset($field_values['additions_size']) && is_array($field_values['additions_size'])
                ? $field_values['additions_size']
                : [];
            $count = max(count($years_raw), count($sizes_raw));
            $additions = [];
            for ($index = 0; $index < $count; $index++) {
                $year = sanitize_text_field(trim((string)($years_raw[$index] ?? '')));
                $size = sanitize_text_field(trim((string)($sizes_raw[$index] ?? '')));
                if ($year === '' && $size === '') {
                    continue;
                }
                $additions[] = [
                    'year' => $year,
                    'size' => $size,
                ];
            }
            lrsd_sf_set_nested_value($school_data, ['additions'], $additions);
        }

        if ($category === 'childcare') {
            $labels = lrsd_sf_get_childcare_labels();
            $childcare_raw = isset($field_values['childcare']) && is_array($field_values['childcare'])
                ? $field_values['childcare']
                : [];
            $childcare = [];
            foreach ($labels as $label) {
                $childcare[$label] = sanitize_text_field((string)($childcare_raw[$label] ?? ''));
            }
            lrsd_sf_set_nested_value($school_data, ['childcare'], $childcare);
        }

        // Projects (when category is projects_provincial or projects_local)
        foreach ($project_paths as $pk => $path) {
            if (!array_key_exists($pk, $field_values)) {
                continue;
            }
            $lines = explode("\n", sanitize_textarea_field((string)$field_values[$pk]));
            $lines = array_values(array_filter(array_map('trim', $lines), static function ($line) { return $line !== ''; }));
            lrsd_sf_set_nested_value($school_data, $path, $lines);
        }

        update_post_meta($post_id, 'lrsd_school_data', lrsd_sf_encode_school_data($school_data));
        $updated++;
    }

    update_option('lrsd_schools_last_updated', wp_date('Y-m-d'));
    lrsd_sf_flush_dataset_cache();

    lrsd_sf_set_admin_notice(
        sprintf(
            /* translators: %d: number of schools updated */
            __('Bulk update complete. %d school(s) updated.', 'lrsd-school-facilities'),
            $updated
        ),
        'success'
    );

    wp_safe_redirect(lrsd_sf_bulk_redirect_url($category));
    exit;
}

function lrsd_sf_bulk_redirect_url($category = '') {
    $args = ['page' => 'lrsd-school-facilities-bulk'];
    if ($category !== '') {
        $args['bulk_category'] = $category;
    }
    return add_query_arg($args, admin_url('admin.php'));
}
