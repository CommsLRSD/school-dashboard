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

    // ── Top two items: Update by School & Update by Category ──────────────────

    add_submenu_page(
        'lrsd-school-facilities',
        __('Update by School', 'lrsd-school-facilities'),
        __('Update by School', 'lrsd-school-facilities'),
        'edit_posts',
        'edit.php?post_type=lr_school'
    );

    add_submenu_page(
        'lrsd-school-facilities',
        __('Update by Category', 'lrsd-school-facilities'),
        __('Update by Category', 'lrsd-school-facilities'),
        'manage_options',
        'lrsd-school-facilities-bulk',
        'lrsd_sf_render_bulk_update_page'
    );

    // ── Remaining items ───────────────────────────────────────────────────────

    add_submenu_page(
        'lrsd-school-facilities',
        __('Import / Export', 'lrsd-school-facilities'),
        __('Import / Export', 'lrsd-school-facilities'),
        'manage_options',
        'lrsd-school-facilities',
        'lrsd_sf_render_import_export_page'
    );

    add_submenu_page(
        'lrsd-school-facilities',
        __('Card Editor', 'lrsd-school-facilities'),
        __('Card Editor', 'lrsd-school-facilities'),
        'manage_options',
        'lrsd-school-facilities-cards',
        'lrsd_sf_render_card_editor_page'
    );

    add_submenu_page(
        'lrsd-school-facilities',
        __('Advanced JSON Editor', 'lrsd-school-facilities'),
        __('Advanced JSON Editor', 'lrsd-school-facilities'),
        'manage_options',
        'lrsd-school-facilities-advanced',
        'lrsd_sf_render_advanced_editor_page'
    );
}

function lrsd_sf_enqueue_admin_assets($hook_suffix) {
    $is_school_editor = (strpos((string)$hook_suffix, 'lrsd-school-facilities') !== false || get_post_type() === 'lr_school');
    if (!$is_school_editor) {
        return;
    }

    wp_enqueue_style(
        'lrsd-sf-admin',
        LRSD_SF_PLUGIN_URL . 'admin/admin.css',
        [],
        LRSD_SF_VERSION
    );

    // jQuery UI sortable (bundled with WP admin)
    wp_enqueue_script('jquery-ui-sortable');

    wp_enqueue_script(
        'lrsd-sf-admin',
        LRSD_SF_PLUGIN_URL . 'admin/admin.js',
        ['jquery', 'jquery-ui-sortable'],
        LRSD_SF_VERSION,
        true
    );

    // Pass AJAX URL and nonces to JS
    wp_localize_script('lrsd-sf-admin', 'lrsdSfAdmin', [
        'ajaxUrl'          => admin_url('admin-ajax.php'),
        'customOptionNonce'=> wp_create_nonce('lrsd_sf_custom_option_nonce'),
        'isFosKey'         => 'familyOfSchools',
        'displayTypes'     => lrsd_sf_get_custom_card_display_types(),
        'i18n'             => [
            'chooseMedia'       => __('Choose or Upload Media', 'lrsd-school-facilities'),
            'useMedia'          => __('Use this file', 'lrsd-school-facilities'),
            'newOption'         => __('Enter the new option value:', 'lrsd-school-facilities'),
            'fosCatchmentHint'  => __('Enter the catchment map file path for this Family of Schools (e.g. public/maps/my-fos-map.svg). Leave blank if not applicable.', 'lrsd-school-facilities'),
            'saved'             => __('Saved.', 'lrsd-school-facilities'),
            'error'             => __('An error occurred. Please try again.', 'lrsd-school-facilities'),
            'confirmBulk'       => __('Save changes to all schools in this category?', 'lrsd-school-facilities'),
            'untitledCard'      => __('(Untitled Card)', 'lrsd-school-facilities'),
            'allSchoolsLabel'   => __('Update by School', 'lrsd-school-facilities'),
            'addSubcategory'    => __('+ Add Subcategory', 'lrsd-school-facilities'),
            'labelPlaceholder'  => __('Label / subcategory name', 'lrsd-school-facilities'),
            'kvLabel'           => __('Label', 'lrsd-school-facilities'),
            'kvYear'            => __('Year', 'lrsd-school-facilities'),
            'kvValue'           => __('Value', 'lrsd-school-facilities'),
            'kvTextValue'       => __('Text value', 'lrsd-school-facilities'),
            'removeRow'         => __('Remove row', 'lrsd-school-facilities'),
        ],
    ]);

    // Enqueue WP media only on the school editor screen and card editor page, not on the bulk update page
    if (get_post_type() === 'lr_school' || strpos((string)$hook_suffix, 'lrsd-school-facilities-cards') !== false) {
        wp_enqueue_media();
    }
}

// ─── Import / Export Page ─────────────────────────────────────────────────────

function lrsd_sf_render_import_export_page() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'lrsd-school-facilities'));
    }

    $notice       = lrsd_sf_get_admin_notice();
    $school_count = wp_count_posts('lr_school');
    $pub_count    = isset($school_count->publish) ? (int)$school_count->publish : 0;
    $last_updated = get_option('lrsd_schools_last_updated', '');
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
            echo esc_html(sprintf(
                /* translators: %d: number of school records */
                __('Current school records: %d', 'lrsd-school-facilities'),
                $pub_count
            ));
            if ($last_updated) {
                echo ' &mdash; ';
                echo esc_html(sprintf(
                    /* translators: %s: date */
                    __('Last updated: %s', 'lrsd-school-facilities'),
                    $last_updated
                ));
            }
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
                <h2><?php esc_html_e('Generate &amp; Download JSON', 'lrsd-school-facilities'); ?></h2>
                <p><?php esc_html_e('Export all current school records as a JSON file. Use this to back up data or update the live dashboard file.', 'lrsd-school-facilities'); ?></p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="lrsd_sf_export" />
                    <?php wp_nonce_field('lrsd_sf_export_action', 'lrsd_sf_export_nonce'); ?>
                    <button type="submit" class="button button-primary"><?php esc_html_e('Generate &amp; Download JSON', 'lrsd-school-facilities'); ?></button>
                </form>
            </div>
        </div>
    </div>
    <?php
}

// ─── Bulk Update Page ─────────────────────────────────────────────────────────

function lrsd_sf_render_bulk_update_page() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'lrsd-school-facilities'));
    }

    $notice   = lrsd_sf_get_admin_notice();
    $category = isset($_GET['bulk_category']) ? sanitize_key($_GET['bulk_category']) : 'enrolment';

    $categories = [
        'enrolment'      => __('Enrolment & Capacity', 'lrsd-school-facilities'),
        'history'        => __('Historic Enrolment', 'lrsd-school-facilities'),
        'projection'     => __('Projected Enrolment', 'lrsd-school-facilities'),
        'additions'      => __('Additions', 'lrsd-school-facilities'),
        'playground'     => __('Playground', 'lrsd-school-facilities'),
        'building'       => __('Building Systems', 'lrsd-school-facilities'),
        'accessibility'  => __('Accessibility', 'lrsd-school-facilities'),
        'transportation' => __('Transportation', 'lrsd-school-facilities'),
        'childcare'      => __('Childcare & BLAST', 'lrsd-school-facilities'),
        'details'        => __('Building Details', 'lrsd-school-facilities'),
        'catchment'      => __('Catchment', 'lrsd-school-facilities'),
    ];

    // Validate selected category
    if (!array_key_exists($category, $categories)) {
        $category = 'enrolment';
    }

    $field_map   = lrsd_sf_get_simple_field_map();
    $cat_fields  = array_filter($field_map, static function ($field) use ($category) {
        return ($field['section'] ?? '') === $category;
    });

    $is_playground = $category === 'playground';
    $is_series     = in_array($category, ['history', 'projection'], true);
    $is_additions  = $category === 'additions';
    $is_childcare  = $category === 'childcare';

    // Get all published schools sorted alphabetically
    $posts = get_posts([
        'post_type'      => 'lr_school',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'title',
        'order'          => 'ASC',
        'no_found_rows'  => true,
    ]);

    ?>
    <div class="wrap lrsd-sf-wrap">
        <h1><?php esc_html_e('Update by Category', 'lrsd-school-facilities'); ?></h1>

        <?php if (!empty($notice['message'])) : ?>
            <div class="notice notice-<?php echo esc_attr(($notice['type'] ?? 'success') === 'success' ? 'success' : 'error'); ?> is-dismissible">
                <p><?php echo wp_kses_post($notice['message']); ?></p>
            </div>
        <?php endif; ?>

        <!-- Category tabs -->
        <nav class="lrsd-sf-bulk-tabs">
            <?php foreach ($categories as $cat_key => $cat_label) : ?>
                <a href="<?php echo esc_url(add_query_arg(['page' => 'lrsd-school-facilities-bulk', 'bulk_category' => $cat_key], admin_url('admin.php'))); ?>"
                   class="lrsd-sf-bulk-tab<?php echo $cat_key === $category ? ' is-active' : ''; ?>">
                    <?php echo esc_html($cat_label); ?>
                </a>
            <?php endforeach; ?>
        </nav>

        <p class="description" style="margin: 12px 0 16px;">
            <?php echo esc_html(sprintf(
                /* translators: %s: category label */
                __('Editing: %s — update values for all schools below, then click "Save All Changes".', 'lrsd-school-facilities'),
                $categories[$category]
            )); ?>
        </p>

        <?php if (empty($posts)) : ?>
            <p><?php esc_html_e('No published school records found. Import a JSON file first.', 'lrsd-school-facilities'); ?></p>
        <?php else : ?>

        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" id="lrsd-sf-bulk-form">
            <input type="hidden" name="action" value="lrsd_sf_bulk_update" />
            <input type="hidden" name="bulk_category" value="<?php echo esc_attr($category); ?>" />
            <?php wp_nonce_field('lrsd_sf_bulk_update_action', 'lrsd_sf_bulk_update_nonce'); ?>

            <table class="lrsd-sf-bulk-table widefat striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('School', 'lrsd-school-facilities'); ?></th>
                        <?php if ($is_playground) : ?>
                            <th><?php esc_html_e('Playground Items (one per line)', 'lrsd-school-facilities'); ?></th>
                        <?php elseif ($is_series) : ?>
                            <th><?php esc_html_e('Year / Value Data Points', 'lrsd-school-facilities'); ?></th>
                        <?php elseif ($is_additions) : ?>
                            <th><?php esc_html_e('Year / Size Additions', 'lrsd-school-facilities'); ?></th>
                        <?php elseif ($is_childcare) : ?>
                            <th><?php esc_html_e('Infant (0-23 months)', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Pre-school (2-6 years)', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('School-age (7+ years)', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('BLAST', 'lrsd-school-facilities'); ?></th>
                        <?php else : ?>
                            <?php foreach ($cat_fields as $fk => $field) : ?>
                                <th><?php echo esc_html($field['label']); ?></th>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($posts as $school_post) :
                    $sid    = get_post_meta($school_post->ID, 'lrsd_school_id', true);
                    if (!$sid || lrsd_sf_is_reserved_dataset_key($sid)) continue;
                    $sdata  = lrsd_sf_normalize_school_data(get_post_meta($school_post->ID, 'lrsd_school_data', true));
                    $row_id = sanitize_key($sid);
                ?>
                    <tr>
                        <td class="lrsd-sf-bulk-school-name">
                            <a href="<?php echo esc_url(get_edit_post_link($school_post->ID)); ?>"><?php echo esc_html($school_post->post_title); ?></a>
                        </td>
                        <?php if ($is_playground) :
                            $pg_lines = implode("\n", (array)lrsd_sf_get_nested_value($sdata, ['playground'], []));
                        ?>
                            <td>
                                <textarea name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][playground_lines]"
                                          rows="4" class="large-text"><?php echo esc_textarea($pg_lines); ?></textarea>
                            </td>
                        <?php elseif ($is_series) :
                            $series_key = $category === 'history' ? 'history' : 'projection';
                            $points = lrsd_sf_normalize_enrolment_series_points(lrsd_sf_get_nested_value($sdata, ['enrolment', $series_key], []));
                        ?>
                            <td>
                                <div class="lrsd-sf-kv-list">
                                    <table class="lrsd-sf-kv-table" role="presentation">
                                        <thead><tr><th scope="col"><?php esc_html_e('Year', 'lrsd-school-facilities'); ?></th><th scope="col"><?php esc_html_e('Value', 'lrsd-school-facilities'); ?></th><th scope="col"></th></tr></thead>
                                        <tbody class="lrsd-sf-kv-rows">
                                        <?php foreach ($points as $point) : ?>
                                            <tr class="lrsd-sf-kv-row">
                                                <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][enrolment_labels][]" aria-label="<?php esc_attr_e('Enrolment year', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($point['label'] ?? '')); ?>" /></td>
                                                <td><input type="number" class="small-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][enrolment_values][]" aria-label="<?php esc_attr_e('Enrolment value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($point['value'] ?? '')); ?>" /></td>
                                                <td><button type="button" class="button lrsd-sf-remove-kv-row" aria-label="<?php esc_attr_e('Remove enrolment row', 'lrsd-school-facilities'); ?>">&#x2715;</button></td>
                                            </tr>
                                        <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                    <button type="button" class="button lrsd-sf-add-kv-row" data-label-name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][enrolment_labels][]" data-value-name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][enrolment_values][]" data-value-type="number"><?php esc_html_e('+ Add Data Point', 'lrsd-school-facilities'); ?></button>
                                </div>
                            </td>
                        <?php elseif ($is_additions) :
                            $additions = lrsd_sf_get_nested_value($sdata, ['additions'], []);
                            if (!is_array($additions) || empty($additions)) {
                                $additions = [['year' => '', 'size' => '']];
                            }
                        ?>
                            <td>
                                <div class="lrsd-sf-kv-list">
                                    <table class="lrsd-sf-kv-table" role="presentation">
                                        <thead><tr><th scope="col"><?php esc_html_e('Year', 'lrsd-school-facilities'); ?></th><th scope="col"><?php esc_html_e('Size', 'lrsd-school-facilities'); ?></th><th scope="col"></th></tr></thead>
                                        <tbody class="lrsd-sf-kv-rows">
                                        <?php foreach ($additions as $addition) : ?>
                                            <tr class="lrsd-sf-kv-row">
                                                <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][additions_year][]" aria-label="<?php esc_attr_e('Addition year', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($addition['year'] ?? '')); ?>" /></td>
                                                <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][additions_size][]" aria-label="<?php esc_attr_e('Addition size', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($addition['size'] ?? '')); ?>" /></td>
                                                <td><button type="button" class="button lrsd-sf-remove-kv-row" aria-label="<?php esc_attr_e('Remove addition row', 'lrsd-school-facilities'); ?>">&#x2715;</button></td>
                                            </tr>
                                        <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                    <button type="button" class="button lrsd-sf-add-kv-row" data-label-name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][additions_year][]" data-value-name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][additions_size][]"><?php esc_html_e('+ Add Addition', 'lrsd-school-facilities'); ?></button>
                                </div>
                            </td>
                        <?php elseif ($is_childcare) :
                            $childcare = lrsd_sf_get_nested_value($sdata, ['childcare'], []);
                            if (!is_array($childcare)) {
                                $childcare = [];
                            }
                        ?>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][childcare][Infant (0-23 months)]" aria-label="<?php esc_attr_e('Infant childcare value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($childcare['Infant (0-23 months)'] ?? '')); ?>" /></td>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][childcare][Pre-school (2-6 years)]" aria-label="<?php esc_attr_e('Pre-school childcare value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($childcare['Pre-school (2-6 years)'] ?? '')); ?>" /></td>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][childcare][School-age (7+ years)]" aria-label="<?php esc_attr_e('School-age childcare value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($childcare['School-age (7+ years)'] ?? '')); ?>" /></td>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][childcare][BLAST]" aria-label="<?php esc_attr_e('BLAST childcare value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($childcare['BLAST'] ?? '')); ?>" /></td>
                        <?php else : ?>
                            <?php foreach ($cat_fields as $fk => $field) :
                                $val  = lrsd_sf_get_nested_value($sdata, $field['path'], '');
                                $name = 'lrsd_bulk_schools[' . esc_attr($row_id) . '][' . esc_attr($fk) . ']';
                            ?>
                                 <td>
                                <?php if ($field['type'] === 'int') : ?>
                                    <input type="number" class="small-text" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr((string)(int)$val); ?>" />
                                <?php elseif ($field['type'] === 'select') :
                                    $opts = (lrsd_sf_get_dropdown_options())[$field['options_key']] ?? [];
                                    if ($val !== '' && !in_array((string)$val, $opts, true)) { $opts[] = (string)$val; }
                                    $bulk_select_id = 'bulk-' . esc_attr($row_id) . '-' . esc_attr($fk);
                                ?>
                                    <div class="lrsd-sf-select-wrap">
                                        <select id="<?php echo $bulk_select_id; ?>"
                                                name="<?php echo esc_attr($name); ?>"
                                                data-option-key="<?php echo esc_attr($field['options_key']); ?>">
                                            <option value=""><?php esc_html_e('— Select —', 'lrsd-school-facilities'); ?></option>
                                            <?php foreach ($opts as $opt) : ?>
                                                <option value="<?php echo esc_attr($opt); ?>"<?php selected((string)$val, $opt); ?>><?php echo esc_html($opt); ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                        <button type="button" class="button lrsd-sf-add-option-btn"
                                            data-option-key="<?php echo esc_attr($field['options_key']); ?>"
                                            data-target-select="<?php echo $bulk_select_id; ?>"
                                            title="<?php esc_attr_e('Add a custom option to this dropdown', 'lrsd-school-facilities'); ?>">
                                            <?php esc_html_e('+ Custom', 'lrsd-school-facilities'); ?>
                                        </button>
                                    </div>
                                <?php else : ?>
                                    <input type="text" class="regular-text" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr((string)$val); ?>" />
                                <?php endif; ?>
                                </td>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>

            <p style="margin-top: 16px;">
                <button type="submit" class="button button-primary" id="lrsd-sf-bulk-save">
                    <?php esc_html_e('Save All Changes', 'lrsd-school-facilities'); ?>
                </button>
            </p>
        </form>

        <?php endif; ?>
    </div>
    <?php
}
