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
    $display_types = lrsd_sf_get_custom_card_display_types();
    ?>
    <div class="wrap lrsd-sf-wrap">
        <h1><?php esc_html_e('Card Editor — Global Card Templates', 'lrsd-school-facilities'); ?></h1>

        <?php if (!empty($notice['message'])) : ?>
            <div class="notice notice-<?php echo esc_attr(($notice['type'] ?? 'success') === 'success' ? 'success' : 'error'); ?> is-dismissible">
                <p><?php echo wp_kses_post($notice['message']); ?></p>
            </div>
        <?php endif; ?>

        <p class="description" style="max-width:640px;margin-bottom:16px;">
            <?php esc_html_e('Define card templates that appear on every school\'s dashboard. Set the card title, display type, icon, and subcategory names (labels) here. Per-school data values are entered in each school\'s individual editor under "Global Cards — School Data".', 'lrsd-school-facilities'); ?>
        </p>

        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" id="lrsd-sf-card-editor-form">
            <input type="hidden" name="action" value="lrsd_sf_save_global_cards" />
            <?php wp_nonce_field('lrsd_sf_save_global_cards_action', 'lrsd_sf_save_global_cards_nonce'); ?>

            <!-- Global cards repeater -->
            <div id="lrsd-sf-global-cards">
            <?php foreach ($global_cards as $i => $card) :
                $card_id    = esc_attr($card['id']       ?? 'custom_' . $i);
                $card_title = esc_attr($card['title']    ?? '');
                $card_icon  = esc_attr($card['icon']     ?? '');
                $card_cat   = esc_attr($card['category'] ?? '');
                $card_type  = $card['cardType'] ?? 'list';
                $card_notes = esc_textarea($card['notes'] ?? '');
                $card_items = is_array($card['items'] ?? null) ? $card['items'] : [];
            ?>
                <div class="lrsd-sf-global-card-template" data-card-id="<?php echo $card_id; ?>">
                    <div class="lrsd-sf-custom-card-header">
                        <span class="lrsd-sf-card-drag dashicons dashicons-move" title="<?php esc_attr_e('Drag to reorder', 'lrsd-school-facilities'); ?>"></span>
                        <strong class="lrsd-sf-card-name"><?php echo esc_html($card['title'] ?? __('(Untitled Card)', 'lrsd-school-facilities')); ?></strong>
                        <span class="lrsd-sf-global-badge"><?php esc_html_e('All Schools', 'lrsd-school-facilities'); ?></span>
                        <button type="button" class="button lrsd-sf-remove-global-card" title="<?php esc_attr_e('Remove template', 'lrsd-school-facilities'); ?>">&#x2715;</button>
                    </div>
                    <table class="form-table" role="presentation"><tbody>
                        <tr>
                            <th><label><?php esc_html_e('Card Title', 'lrsd-school-facilities'); ?></label></th>
                            <td><input type="text" class="regular-text lrsd-sf-gct-title" value="<?php echo $card_title; ?>" data-field="title" /></td>
                        </tr>
                        <tr>
                            <th><label><?php esc_html_e('Display Type', 'lrsd-school-facilities'); ?></label></th>
                            <td>
                                <select class="lrsd-sf-gct-cardtype" data-field="cardType">
                                    <?php foreach ($display_types as $type_key => $type_label) : ?>
                                        <option value="<?php echo esc_attr($type_key); ?>"<?php selected($card_type, $type_key); ?>><?php echo esc_html($type_label); ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <p class="description"><?php esc_html_e('How items are visually displayed on the dashboard.', 'lrsd-school-facilities'); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th><label><?php esc_html_e('Icon', 'lrsd-school-facilities'); ?></label></th>
                            <td>
                                <div class="lrsd-sf-media-wrap">
                                    <input type="text" class="regular-text lrsd-sf-media-input lrsd-sf-gct-icon" value="<?php echo $card_icon; ?>" data-field="icon" id="lrsd-gct-icon-<?php echo $card_id; ?>" />
                                    <button type="button" class="button lrsd-sf-media-btn" data-target="lrsd-gct-icon-<?php echo $card_id; ?>"><?php esc_html_e('Choose Media', 'lrsd-school-facilities'); ?></button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th><label><?php esc_html_e('Category Label', 'lrsd-school-facilities'); ?></label></th>
                            <td><input type="text" class="regular-text lrsd-sf-gct-category" value="<?php echo $card_cat; ?>" data-field="category" /></td>
                        </tr>
                        <tr>
                            <th><?php esc_html_e('Subcategory Names', 'lrsd-school-facilities'); ?></th>
                            <td>
                                <p class="description" style="margin-bottom:8px;"><?php esc_html_e('These are the row labels. Each school will fill in its own values for these labels.', 'lrsd-school-facilities'); ?></p>
                                <div class="lrsd-sf-label-list">
                                <?php foreach ($card_items as $item) : ?>
                                    <div class="lrsd-sf-label-row">
                                        <input type="text" class="regular-text lrsd-sf-label-text" value="<?php echo esc_attr($item['label'] ?? ''); ?>" placeholder="<?php esc_attr_e('Label / subcategory name', 'lrsd-school-facilities'); ?>" />
                                        <button type="button" class="button lrsd-sf-remove-label">&#x2715;</button>
                                    </div>
                                <?php endforeach; ?>
                                </div>
                                <button type="button" class="button lrsd-sf-add-label"><?php esc_html_e('+ Add Subcategory', 'lrsd-school-facilities'); ?></button>
                            </td>
                        </tr>
                        <tr>
                            <th><label><?php esc_html_e('Card Notes (optional)', 'lrsd-school-facilities'); ?></label></th>
                            <td><textarea class="large-text lrsd-sf-gct-notes" rows="2" data-field="notes"><?php echo $card_notes; ?></textarea>
                            <p class="description"><?php esc_html_e('A default footnote shown below the card on all schools (individual schools cannot override this).', 'lrsd-school-facilities'); ?></p></td>
                        </tr>
                    </tbody></table>
                </div><!-- /.lrsd-sf-global-card-template -->
            <?php endforeach; ?>
            </div><!-- /#lrsd-sf-global-cards -->

            <p style="margin-top:12px;">
                <button type="button" class="button button-secondary" id="lrsd-sf-add-global-card">
                    <?php esc_html_e('+ Add Global Card', 'lrsd-school-facilities'); ?>
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
