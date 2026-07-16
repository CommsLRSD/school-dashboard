<?php

defined('ABSPATH') || exit;

function lrsd_sf_handle_export() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to export school data.', 'lrsd-school-facilities'));
    }

    check_admin_referer('lrsd_sf_export_action', 'lrsd_sf_export_nonce');

    $dataset = lrsd_sf_get_school_dataset();
    $json    = wp_json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($json === false) {
        wp_die(esc_html__('Failed to generate export JSON.', 'lrsd-school-facilities'));
    }

    $filename = 'schools-export-' . wp_date('Y-m-d') . '.json';

    nocache_headers();
    header('Content-Description: File Transfer');
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename=' . $filename);
    header('Expires: 0');

    echo $json; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    exit;
}
