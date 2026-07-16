<?php
/**
 * Plugin Name: LRSD School Facilities
 * Description: Manage LRSD school facilities data in WordPress and expose it for the dashboard.
 * Version: 0.2.0
 * Author: LRSD
 */

defined('ABSPATH') || exit;

define('LRSD_SF_VERSION', '0.2.0');
define('LRSD_SF_PLUGIN_FILE', __FILE__);
define('LRSD_SF_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LRSD_SF_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once LRSD_SF_PLUGIN_DIR . 'includes/helpers.php';
require_once LRSD_SF_PLUGIN_DIR . 'includes/post-types.php';
require_once LRSD_SF_PLUGIN_DIR . 'includes/importer.php';
require_once LRSD_SF_PLUGIN_DIR . 'includes/exporter.php';
require_once LRSD_SF_PLUGIN_DIR . 'includes/rest-api.php';
require_once LRSD_SF_PLUGIN_DIR . 'includes/bulk-update.php';
require_once LRSD_SF_PLUGIN_DIR . 'admin/admin-page.php';
require_once LRSD_SF_PLUGIN_DIR . 'admin/school-editor.php';
require_once LRSD_SF_PLUGIN_DIR . 'admin/card-editor.php';

add_action('init', 'lrsd_sf_register_post_type');
add_action('rest_api_init', 'lrsd_sf_register_rest_routes');
add_action('admin_menu', 'lrsd_sf_register_admin_pages');
add_action('admin_post_lrsd_sf_import', 'lrsd_sf_handle_import');
add_action('admin_post_lrsd_sf_export', 'lrsd_sf_handle_export');
add_action('admin_post_lrsd_sf_bulk_update', 'lrsd_sf_handle_bulk_update');
add_action('admin_post_lrsd_sf_save_global_cards', 'lrsd_sf_handle_save_global_cards');
add_action('wp_ajax_lrsd_sf_add_custom_option', 'lrsd_sf_ajax_add_custom_option');
add_action('add_meta_boxes_lr_school', 'lrsd_sf_register_school_meta_box');
add_action('save_post_lr_school', 'lrsd_sf_save_school_meta', 10, 2);
add_action('admin_enqueue_scripts', 'lrsd_sf_enqueue_admin_assets');
add_action('admin_notices', 'lrsd_sf_render_editor_notice');

register_activation_hook(__FILE__, function () {
    lrsd_sf_register_post_type();
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function () {
    flush_rewrite_rules();
});
