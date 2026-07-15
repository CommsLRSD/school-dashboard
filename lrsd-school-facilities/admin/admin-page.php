<?php

defined('ABSPATH') || exit;

function lrsd_sf_register_admin_pages() {
    add_menu_page(
        __('School Facilities', 'lrsd-school-facilities'),
        __('School Facilities', 'lrsd-school-facilities'),
        'edit_posts',
        'lrsd-school-facilities',
        'lrsd_sf_render_import_export_page',
        'dashicons-building',
        58
    );

    add_submenu_page(
        'lrsd-school-facilities',
        __('Import/Export', 'lrsd-school-facilities'),
        __('Import/Export', 'lrsd-school-facilities'),
        'manage_options',
        'lrsd-school-facilities',
        'lrsd_sf_render_import_export_page'
    );

    add_submenu_page(
        'lrsd-school-facilities',
        __('All Schools', 'lrsd-school-facilities'),
        __('All Schools', 'lrsd-school-facilities'),
        'edit_posts',
        'edit.php?post_type=lr_school'
    );
}

function lrsd_sf_enqueue_admin_assets($hook_suffix) {
    if (strpos((string) $hook_suffix, 'lrsd-school-facilities') === false && get_post_type() !== 'lr_school') {
        return;
    }

    wp_enqueue_style(
        'lrsd-sf-admin',
        LRSD_SF_PLUGIN_URL . 'admin/admin.css',
        [],
        LRSD_SF_VERSION
    );

    wp_enqueue_script(
        'lrsd-sf-admin',
        LRSD_SF_PLUGIN_URL . 'admin/admin.js',
        ['jquery'],
        LRSD_SF_VERSION,
        true
    );
}

function lrsd_sf_render_import_export_page() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'lrsd-school-facilities'));
    }

    $notice = lrsd_sf_get_admin_notice();
    $school_count = wp_count_posts('lr_school');
    $published_count = isset($school_count->publish) ? (int) $school_count->publish : 0;
    ?>
    <div class="wrap lrsd-sf-wrap">
        <h1><?php esc_html_e('LRSD School Facilities', 'lrsd-school-facilities'); ?></h1>

        <?php if (!empty($notice['message'])) : ?>
            <div class="notice notice-<?php echo esc_attr(($notice['type'] ?? 'success') === 'success' ? 'success' : 'error'); ?> is-dismissible">
                <p><?php echo wp_kses_post($notice['message']); ?></p>
            </div>
        <?php endif; ?>

        <p>
            <?php
            echo esc_html(
                sprintf(
                    /* translators: %d: number of school records */
                    __('Current school records: %d', 'lrsd-school-facilities'),
                    $published_count
                )
            );
            ?>
        </p>

        <div class="lrsd-sf-grid">
            <div class="lrsd-sf-card">
                <h2><?php esc_html_e('Import School JSON', 'lrsd-school-facilities'); ?></h2>
                <p><?php esc_html_e('Upload the existing schools JSON file to create or update school records.', 'lrsd-school-facilities'); ?></p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="lrsd_sf_import" />
                    <?php wp_nonce_field('lrsd_sf_import_action', 'lrsd_sf_import_nonce'); ?>
                    <input type="file" name="lrsd_school_json" accept="application/json,.json" required />
                    <p>
                        <button type="submit" class="button button-primary"><?php esc_html_e('Import JSON', 'lrsd-school-facilities'); ?></button>
                    </p>
                </form>
            </div>

            <div class="lrsd-sf-card">
                <h2><?php esc_html_e('Export School JSON', 'lrsd-school-facilities'); ?></h2>
                <p><?php esc_html_e('Download the current school records as a JSON backup file.', 'lrsd-school-facilities'); ?></p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="lrsd_sf_export" />
                    <?php wp_nonce_field('lrsd_sf_export_action', 'lrsd_sf_export_nonce'); ?>
                    <button type="submit" class="button button-secondary"><?php esc_html_e('Export JSON', 'lrsd-school-facilities'); ?></button>
                </form>
            </div>
        </div>
    </div>
    <?php
}
