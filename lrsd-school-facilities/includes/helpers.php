<?php

defined('ABSPATH') || exit;

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
        'lastUpdated' => get_option('lrsd_schools_last_updated', ''),
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
        if ($school_id === '') {
            continue;
        }

        $school_data = lrsd_sf_normalize_school_data(get_post_meta($post->ID, 'lrsd_school_data', true));
        if (empty($school_data) || !is_array($school_data)) {
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
