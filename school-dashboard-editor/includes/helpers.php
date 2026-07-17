<?php

defined('ABSPATH') || exit;

/**
 * Dataset keys reserved for global/non-school data.
 */
function lrsd_sf_get_reserved_dataset_keys() {
    return ['lastUpdated', 'fosMapLookup', 'globalCustomCards'];
}

/**
 * Normalize dataset keys for case-insensitive reserved-key checks.
 *
 * Reserved dataset keys are synthetic metadata buckets, not user-created school
 * IDs. Normalizing to lowercase alphanumerics is safe here because we only use
 * this helper to match that tiny fixed reserved-key list.
 */
function lrsd_sf_normalize_dataset_key($key) {
    return strtolower(preg_replace('/[^a-z0-9]/i', '', (string) $key));
}

/**
 * True when a key is one of the reserved non-school dataset keys.
 */
function lrsd_sf_is_reserved_dataset_key($key) {
    static $reserved = null;

    if ($reserved === null) {
        $reserved = array_map('lrsd_sf_normalize_dataset_key', lrsd_sf_get_reserved_dataset_keys());
    }

    return in_array(lrsd_sf_normalize_dataset_key($key), $reserved, true);
}

/**
 * Determine whether a post should be treated as an editable school record.
 */
function lrsd_sf_is_valid_school_post($post) {
    if (!$post instanceof WP_Post || $post->post_type !== 'lr_school') {
        return false;
    }

    $school_id = get_post_meta($post->ID, 'lrsd_school_id', true);
    if ($school_id !== '' && lrsd_sf_is_reserved_dataset_key($school_id)) {
        return false;
    }

    if ($school_id === '' && lrsd_sf_is_reserved_dataset_key($post->post_title)) {
        return false;
    }

    $school_data = lrsd_sf_normalize_school_data(get_post_meta($post->ID, 'lrsd_school_data', true));
    $school_name = lrsd_sf_get_school_display_name($school_data, $post->post_title);

    return $school_name !== '';
}

/**
 * Resolve the admin-facing school label, falling back to the post title.
 */
function lrsd_sf_get_school_display_name($school_data, $fallback_title = '') {
    $school_data = is_array($school_data) ? $school_data : [];
    $school_name = trim((string) ($school_data['schoolName'] ?? ''));
    if ($school_name !== '') {
        return $school_name;
    }

    return trim((string) $fallback_title);
}

/**
 * Fetch school posts suitable for the Update by School admin page.
 *
 * @return WP_Post[]
 */
function lrsd_sf_get_editable_school_posts() {
    $posts = get_posts([
        'post_type'      => 'lr_school',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'title',
        'order'          => 'ASC',
        'no_found_rows'  => true,
    ]);

    return array_values(array_filter($posts, 'lrsd_sf_is_valid_school_post'));
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
    $global_custom_cards = lrsd_sf_get_global_custom_cards();
    $dataset = [
        'lastUpdated'       => get_option('lrsd_schools_last_updated', ''),
        'fosMapLookup'      => lrsd_sf_get_fos_catchment_map(),
        'globalCustomCards' => $global_custom_cards,
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

        $dataset[$school_id] = lrsd_sf_normalize_school_dashboard_data($school_data, $global_custom_cards);
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
 * Generate a stable internal school ID.
 *
 * Persisted posts use their numeric post ID for easier debugging and repeatable
 * exports. Unsaved/temporary contexts fall back to a sanitized UUID so blank
 * editor state can still render with a valid placeholder ID.
 */
function lrsd_sf_generate_school_id($post_id = 0) {
    $post_id = (int) $post_id;
    if ($post_id > 0) {
        return 'school-' . $post_id;
    }

    return 'school-' . sanitize_key((string) wp_generate_uuid4());
}

/**
 * Build the blank school structure used for newly created records.
 */
function lrsd_sf_get_blank_school_data($school_id = '') {
    $school_id = sanitize_key((string) $school_id);
    if ($school_id === '') {
        $school_id = lrsd_sf_generate_school_id();
    }

    $childcare = [];
    foreach (lrsd_sf_get_childcare_labels() as $label) {
        $childcare[$label] = 0;
    }

    return [
        'id'          => $school_id,
        'schoolType'  => '',
        'headerImage' => '',
        'address'     => '',
        'phone'       => '',
        'enrolment'   => [
            'capacity'   => 0,
            'current'    => 0,
            'projection' => ['labels' => [], 'values' => []],
            'history'    => ['labels' => [], 'values' => []],
        ],
        'details' => [
            'Built'   => 0,
            'Size'    => '',
            'Modular' => 0,
        ],
        'additions' => [],
        'building'  => [
            'Air Conditioning' => '',
            'Heating'          => '',
            'LED Lighting'     => '',
        ],
        'catchment' => [
            'migration'   => '',
            'description' => '',
            'map'         => '',
        ],
        'transportation' => [
            'Parking spots' => '',
            'Bus Loop'      => '',
        ],
        'accessibility' => [
            "Girls' washrooms"                 => 0,
            "Boys' washrooms"                  => 0,
            'Gender neutral washrooms'         => 0,
            'Universal Washroom'               => '',
            'Elevator'                         => '',
            'Accessible parking stalls'        => 0,
            'Accessible entrance'              => '',
            'Automatic entrance door operators' => '',
        ],
        'playground' => [],
        'childcare'  => $childcare,
        'projects'   => [
            'provincial' => [
                'requested'  => [],
                'inProgress' => [],
                'completed'  => [],
            ],
            'local' => [
                'requested'  => [],
                'inProgress' => [],
                'completed'  => [],
            ],
        ],
        'familyOfSchools'  => '',
        'schoolLevel'      => '',
        'grades'           => '',
        'program'          => '',
        'cardOrder'        => lrsd_sf_get_default_dashboard_card_order(),
        'customCards'      => [],
        'customCardValues' => [],
    ];
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
 * Returns the standard dashboard card order used by the frontend.
 *
 * Keep this list in sync with DEFAULT_SCHOOL_CARD_TYPES in /app.js so the
 * editor, importer/exporter, and public dashboard all render cards the same way.
 */
function lrsd_sf_get_default_dashboard_card_order() {
    return [
        'school_header',
        'details',
        'additions',
        'enrolment',
        'capacity',
        'utilization',
        'projection',
        'history',
        'building_systems',
        'accessibility',
        'playground',
        'transportation',
        'childcare',
        'catchment_map',
        'projects_provincial',
        'projects_local',
    ];
}

/**
 * Legacy card-order IDs that should expand to the current dashboard cards.
 */
function lrsd_sf_get_legacy_card_order_map() {
    return [
        'enrolment_capacity' => ['enrolment', 'capacity', 'utilization'],
    ];
}

/**
 * Normalize a school card order array.
 *
 * Converts legacy combined cards to the current separate dashboard cards,
 * removes deleted custom cards, and appends any missing standard/custom cards.
 */
function lrsd_sf_normalize_card_order($card_order, array $school_custom_ids = [], array $global_card_ids = []) {
    $default_order  = lrsd_sf_get_default_dashboard_card_order();
    $valid_ids      = array_merge($default_order, $school_custom_ids, $global_card_ids);
    $legacy_map     = lrsd_sf_get_legacy_card_order_map();
    $normalized     = [];
    $source_order   = is_array($card_order) ? $card_order : [];

    foreach ($source_order as $card_id) {
        $card_id = sanitize_key((string) $card_id);
        if ($card_id === '') {
            continue;
        }

        $mapped_ids = $legacy_map[$card_id] ?? [$card_id];
        foreach ($mapped_ids as $mapped_id) {
            if (in_array($mapped_id, $valid_ids, true) && !in_array($mapped_id, $normalized, true)) {
                $normalized[] = $mapped_id;
            }
        }
    }

    foreach ($valid_ids as $card_id) {
        if (!in_array($card_id, $normalized, true)) {
            $normalized[] = $card_id;
        }
    }

    return $normalized;
}

/**
 * Normalize stored school dashboard metadata for export/rendering.
 */
function lrsd_sf_normalize_school_dashboard_data(array $school_data, array $global_custom_cards = []) {
    $has_card_order   = isset($school_data['cardOrder']) && is_array($school_data['cardOrder']);
    $global_card_ids  = array_column($global_custom_cards, 'id');
    $school_card_ids  = [];
    $school_cards_raw = isset($school_data['customCards']) && is_array($school_data['customCards']) ? $school_data['customCards'] : [];

    foreach ($school_cards_raw as $school_card) {
        if (!is_array($school_card)) {
            continue;
        }

        $card_id = sanitize_key((string) ($school_card['id'] ?? ''));
        if ($card_id !== '') {
            $school_card_ids[] = $card_id;
        }
    }

    if ($has_card_order) {
        $school_data['cardOrder'] = lrsd_sf_normalize_card_order(
            $school_data['cardOrder'],
            array_values(array_unique($school_card_ids)),
            $global_card_ids
        );
    } else {
        unset($school_data['cardOrder']);
    }

    return $school_data;
}

function lrsd_sf_get_childcare_labels() {
    return [
        'Infant (0-23 months)',
        'Pre-school (2-6 years)',
        'School-age (5+ years)',
        'School-age (7+ years)',
        'Special Needs (12+ years)',
        'BLAST',
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
        'enrolment'           => __('Enrolment', 'lrsd-school-facilities'),
        'capacity'            => __('Capacity', 'lrsd-school-facilities'),
        'utilization'         => __('Utilization', 'lrsd-school-facilities'),
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
