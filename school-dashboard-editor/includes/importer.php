<?php

defined('ABSPATH') || exit;

function lrsd_sf_handle_import() {

    if (!current_user_can('manage_options')) {
        wp_die(
            esc_html__(
                'You do not have permission to import school data.',
                'lrsd-school-facilities'
            )
        );
    }

    check_admin_referer(
        'lrsd_sf_import_action',
        'lrsd_sf_import_nonce'
    );

    if (empty($_FILES['lrsd_school_json']['tmp_name'])) {
        lrsd_sf_redirect_import_result(
            'error',
            __('No file was uploaded.', 'lrsd-school-facilities')
        );
    }

    $file = $_FILES['lrsd_school_json'];

    if (!isset($file['name'])) {
        lrsd_sf_redirect_import_result(
            'error',
            __('Invalid upload.', 'lrsd-school-facilities')
        );
    }

    $file_name = sanitize_file_name($file['name']);

    /*
     * Only require the filename to end in .json.
     * Many hosts report JSON uploads as application/octet-stream.
     */
    $extension = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    if ($extension !== 'json') {
        lrsd_sf_redirect_import_result(
            'error',
            __('Please upload a valid JSON file.', 'lrsd-school-facilities')
        );
    }

    $raw_json = file_get_contents($file['tmp_name']);

    if ($raw_json === false || trim($raw_json) === '') {
        lrsd_sf_redirect_import_result(
            'error',
            __('Uploaded file is empty or unreadable.', 'lrsd-school-facilities')
        );
    }

    $decoded = json_decode($raw_json, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        lrsd_sf_redirect_import_result(
            'error',
            __('Invalid JSON format.', 'lrsd-school-facilities')
        );
    }

    $last_updated = '';

    if (
        isset($decoded['lastUpdated']) &&
        is_scalar($decoded['lastUpdated'])
    ) {
        $last_updated = sanitize_text_field(
            (string) $decoded['lastUpdated']
        );
    }

    $created = 0;
    $updated = 0;

    foreach ($decoded as $key => $school) {

        if (lrsd_sf_is_reserved_dataset_key($key)) {
            continue;
        }

        if (!is_array($school)) {
            continue;
        }

        $school_id = '';

        if (
            isset($school['id']) &&
            is_scalar($school['id'])
        ) {
            $school_id = sanitize_text_field(
                (string) $school['id']
            );
        }

        if ($school_id === '' && is_string($key)) {
            $school_id = sanitize_text_field($key);
        }

        if ($school_id === '') {
            continue;
        }

        $school['id'] = $school_id;

        $school_name =
            isset($school['schoolName']) &&
            is_scalar($school['schoolName'])
                ? sanitize_text_field(
                    (string) $school['schoolName']
                )
                : $school_id;

        $post_data = [
            'post_type'   => 'lr_school',
            'post_status' => 'publish',
            'post_title'  => $school_name,
        ];

        $existing_post_id = lrsd_sf_find_school_post_by_id(
            $school_id
        );

        if ($existing_post_id) {

            $post_data['ID'] = $existing_post_id;

            $result = wp_update_post(
                $post_data,
                true
            );

            if (!is_wp_error($result)) {

                update_post_meta(
                    $existing_post_id,
                    'lrsd_school_id',
                    $school_id
                );

                update_post_meta(
                    $existing_post_id,
                    'lrsd_school_data',
                    lrsd_sf_encode_school_data($school)
                );

                $updated++;
            }

        } else {

            $result = wp_insert_post(
                $post_data,
                true
            );

            if (
                !is_wp_error($result) &&
                $result > 0
            ) {

                update_post_meta(
                    $result,
                    'lrsd_school_id',
                    $school_id
                );

                update_post_meta(
                    $result,
                    'lrsd_school_data',
                    lrsd_sf_encode_school_data($school)
                );

                $created++;
            }
        }
    }

    if ($last_updated === '') {
        $last_updated = wp_date('Y-m-d');
    }

    update_option(
        'lrsd_schools_last_updated',
        $last_updated
    );

    lrsd_sf_flush_dataset_cache();

    $message = sprintf(
        __('Import complete. Created: %1$d. Updated: %2$d.', 'lrsd-school-facilities'),
        $created,
        $updated
    );

    lrsd_sf_redirect_import_result(
        'success',
        $message
    );
}

function lrsd_sf_redirect_import_result($status, $message) {

    lrsd_sf_set_admin_notice(
        wp_strip_all_tags((string) $message),
        $status
    );

    $redirect_url = add_query_arg(
        [
            'page' => 'lrsd-school-facilities',
        ],
        admin_url('admin.php')
    );

    wp_safe_redirect($redirect_url);
    exit;
}
