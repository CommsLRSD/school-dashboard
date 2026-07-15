<?php

defined('ABSPATH') || exit;

function lrsd_sf_register_rest_routes() {
    register_rest_route('lrsd/v1', '/schools', [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'lrsd_sf_rest_get_schools',
        'permission_callback' => '__return_true',
    ]);
}

function lrsd_sf_rest_get_schools(WP_REST_Request $_request) {
    return rest_ensure_response(lrsd_sf_get_school_dataset());
}
