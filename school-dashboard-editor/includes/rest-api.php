<?php

defined('ABSPATH') || exit;

function lrsd_sf_register_rest_routes() {
    register_rest_route('lrsd/v1', '/schools', [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'lrsd_sf_rest_get_schools',
        'permission_callback' => '__return_true',
    ]);
}

function lrsd_sf_rest_get_schools(WP_REST_Request $request) {
    $cached = get_transient('lrsd_sf_rest_dataset');
    $data   = is_array($cached) ? $cached : lrsd_sf_get_school_dataset();

    if (!is_array($cached)) {
        set_transient('lrsd_sf_rest_dataset', $data, 5 * MINUTE_IN_SECONDS);
    }

    $response = rest_ensure_response($data);
    $response->header('Cache-Control', 'public, max-age=300');

    return $response;
}
