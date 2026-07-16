<?php

defined('ABSPATH') || exit;

/**
 * Render the Card Editor admin page.
 * Allows administrators to create and manage global custom card templates
 * that appear on all schools (with per-school values edited in the school editor).
 */
function lrsd_sf_render_card_editor_page() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'lrsd-school-facilities'));
    }

    $notice       = lrsd_sf_get_admin_notice();
    $global_cards = lrsd_sf_get_global_custom_cards();
    ?>
    <div class="wrap lrsd-sf-wrap">
        <h1><?php esc_html_e('Card Editor — Global Card Templates', 'lrsd-school-facilities'); ?></h1>

        <?php if (!empty($notice['message'])) : ?>
            <div class="notice notice-<?php echo esc_attr(($notice['type'] ?? 'success') === 'success' ? 'success' : 'error'); ?> is-dismissible">
                <p><?php echo wp_kses_post($notice['message']); ?></p>
            </div>
        <?php endif; ?>

        <p class="description" style="max-width:640px;margin-bottom:16px;">
            <?php esc_html_e('Define shared card templates that appear on every school. Build them almost the same way as school-only custom cards, but use placeholder/default values here; each school can then enter its own final values in the school editor.', 'lrsd-school-facilities'); ?>
        </p>

        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" id="lrsd-sf-card-editor-form">
            <input type="hidden" name="action" value="lrsd_sf_save_global_cards" />
            <?php wp_nonce_field('lrsd_sf_save_global_cards_action', 'lrsd_sf_save_global_cards_nonce'); ?>

            <div id="lrsd-sf-global-cards"></div>

            <p style="margin-top:12px;">
                <button type="button" class="button button-secondary" id="lrsd-sf-add-global-card">
                    <?php esc_html_e('+ Duplicate from Card Format', 'lrsd-school-facilities'); ?>
                </button>
            </p>

            <!-- Serialized JSON submitted on save -->
            <input type="hidden" id="lrsd_sf_global_cards_json" name="lrsd_sf_global_cards_json" value="<?php echo esc_attr(wp_json_encode($global_cards, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); ?>" />

            <p class="submit">
                <button type="submit" class="button button-primary" id="lrsd-sf-save-global-cards">
                    <?php esc_html_e('Save Card Templates', 'lrsd-school-facilities'); ?>
                </button>
            </p>
        </form>
    </div><!-- /.wrap -->
    <?php
}
