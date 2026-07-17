<?php

defined('ABSPATH') || exit;

if (!defined('LRSD_SF_MAX_RENDERER_SOURCE_SIZE_BYTES')) {
    define('LRSD_SF_MAX_RENDERER_SOURCE_SIZE_BYTES', 200000);
}

function lrsd_sf_register_admin_pages() {
    add_menu_page(
        __('School Dashboard Editor', 'lrsd-school-facilities'),
        __('School Dashboard Editor', 'lrsd-school-facilities'),
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
        'lrsd-school-facilities-schools',
        'lrsd_sf_render_school_list_page'
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
        __('Card Creator', 'lrsd-school-facilities'),
        __('Card Creator', 'lrsd-school-facilities'),
        'edit_posts',
        'lrsd-school-facilities-card-creator',
        'lrsd_sf_render_card_creator_page'
    );

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
        'i18n'             => [
            'chooseMedia'       => __('Choose or Upload Media', 'lrsd-school-facilities'),
            'useMedia'          => __('Use this file', 'lrsd-school-facilities'),
            'newOption'         => __('Enter the new option value:', 'lrsd-school-facilities'),
            'fosCatchmentHint'  => __('Enter the catchment map file path for this Family of Schools (e.g. public/maps/my-fos-map.svg). Leave blank if not applicable.', 'lrsd-school-facilities'),
            'saved'             => __('Saved.', 'lrsd-school-facilities'),
            'error'             => __('An error occurred. Please try again.', 'lrsd-school-facilities'),
            'confirmBulk'       => __('Save changes to all schools in this category?', 'lrsd-school-facilities'),
            'addSubcategory'    => __('+ Add Subcategory', 'lrsd-school-facilities'),
            'labelPlaceholder'  => __('Label / subcategory name', 'lrsd-school-facilities'),
            'kvLabel'           => __('Label', 'lrsd-school-facilities'),
            'kvYear'            => __('Year', 'lrsd-school-facilities'),
            'kvValue'           => __('Value', 'lrsd-school-facilities'),
            'kvTextValue'       => __('Text value', 'lrsd-school-facilities'),
            'removeRow'         => __('Remove row', 'lrsd-school-facilities'),
        ],
    ]);

    // Enqueue WP media only on the school editor screen, not on the bulk update page
    if (get_post_type() === 'lr_school') {
        wp_enqueue_media();
    }

    if ($hook_suffix === 'school-dashboard-editor_page_lrsd-school-facilities-card-creator') {
        wp_enqueue_media();
        wp_enqueue_script(
            'lrsd-sf-card-creator',
            LRSD_SF_PLUGIN_URL . 'admin/card-creator.js',
            ['jquery'],
            LRSD_SF_VERSION,
            true
        );

        $renderer_url           = '';
        $asset_base_url         = home_url('/');
        $frontend_styles_url    = home_url('/styles.css');
        $plugin_parent_url      = trailingslashit(dirname(untrailingslashit(LRSD_SF_PLUGIN_URL)));
        $plugin_grandparent_url = trailingslashit(dirname(dirname(untrailingslashit(LRSD_SF_PLUGIN_URL))));
        $renderer_candidates = [
            [
                'path'     => dirname(LRSD_SF_PLUGIN_DIR) . '/card-renderer.js',
                'base_url' => $plugin_parent_url,
            ],
            [
                'path'     => dirname(LRSD_SF_PLUGIN_DIR, 2) . '/card-renderer.js',
                'base_url' => $plugin_grandparent_url,
            ],
        ];
        foreach ($renderer_candidates as $renderer_path) {
            if (file_exists($renderer_path['path']) && is_readable($renderer_path['path'])) {
                $asset_base_url      = esc_url_raw($renderer_path['base_url']);
                $frontend_styles_url = esc_url_raw($renderer_path['base_url'] . 'styles.css');
                $renderer_url        = esc_url_raw($renderer_path['base_url'] . 'card-renderer.js');
                break;
            }
        }

        wp_localize_script('lrsd-sf-card-creator', 'lrsdSfCardCreator', [
            'ajaxUrl'          => admin_url('admin-ajax.php'),
            'nonce'            => wp_create_nonce('lrsd_sf_card_creator_nonce'),
            'siteUrl'          => home_url('/'),
            'assetBaseUrl'     => $asset_base_url,
            'frontendStylesUrl'=> $frontend_styles_url,
            'rendererUrl'      => $renderer_url,
            'i18n'             => [
                'loading'             => __('Loading card data…', 'lrsd-school-facilities'),
                'loadError'           => __('Failed to load card data.', 'lrsd-school-facilities'),
                'saveSuccess'         => __('Card saved.', 'lrsd-school-facilities'),
                'saveError'           => __('Could not save card.', 'lrsd-school-facilities'),
                'deleteConfirm'       => __('Delete this card?', 'lrsd-school-facilities'),
                'deleteSuccess'       => __('Card deleted.', 'lrsd-school-facilities'),
                'jsonInvalid'         => __('JSON is invalid for the selected schema.', 'lrsd-school-facilities'),
                'schoolRequired'      => __('Select at least one school for school-specific cards.', 'lrsd-school-facilities'),
                'titleRequired'       => __('Card title is required.', 'lrsd-school-facilities'),
                'iconRequired'        => __('Select an icon before saving.', 'lrsd-school-facilities'),
                'iconNotAllowed'      => __('Icon must be selected from the icon registry.', 'lrsd-school-facilities'),
                'invalidCardType'     => __('Invalid card type.', 'lrsd-school-facilities'),
                'addAtLeastOneRow'    => __('Add at least one row.', 'lrsd-school-facilities'),
                'tooManyRows'         => __('Too many rows for this card type.', 'lrsd-school-facilities'),
                'maxRowsHint'         => __('Recommended max %d rows to preserve card height.', 'lrsd-school-facilities'),
                'jsonUnknownType'     => __('Unknown card type in JSON.', 'lrsd-school-facilities'),
                'jsonApplied'         => __('JSON applied to form.', 'lrsd-school-facilities'),
                'maxRowsReached'      => __('Maximum rows reached for this card type.', 'lrsd-school-facilities'),
                'deleteFailed'        => __('Delete failed.', 'lrsd-school-facilities'),
                'noIconsFound'        => __('No icons found.', 'lrsd-school-facilities'),
                'secureIdRequired'    => __('Secure ID generation is unavailable in this browser.', 'lrsd-school-facilities'),
                'duplicateSuffix'     => __('Copy', 'lrsd-school-facilities'),
                'unsavedCardFallback' => __('Unsaved card', 'lrsd-school-facilities'),
                'globalLabel'         => __('Global', 'lrsd-school-facilities'),
                'schoolLabel'         => __('School-specific', 'lrsd-school-facilities'),
                'mediaLibraryTitle'   => __('Choose Icon from Media Library', 'lrsd-school-facilities'),
                'mediaLibraryButton'  => __('Use as Icon', 'lrsd-school-facilities'),
                'mediaLibraryUnavailable' => __('Media library is not available. Please reload the page and try again.', 'lrsd-school-facilities'),
            ],
        ]);
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
        <h1><?php esc_html_e('School Dashboard Editor', 'lrsd-school-facilities'); ?></h1>

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

// ─── Update by School Page ────────────────────────────────────────────────────

function lrsd_sf_render_school_list_page() {
    if (!current_user_can('edit_posts')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'lrsd-school-facilities'));
    }

    $posts = lrsd_sf_get_editable_school_posts();
    ?>
    <div class="wrap lrsd-sf-wrap">
        <h1><?php esc_html_e('Update by School', 'lrsd-school-facilities'); ?></h1>

        <?php if (empty($posts)) : ?>
            <p><?php esc_html_e('No published school records found. Import a JSON file first.', 'lrsd-school-facilities'); ?></p>
        <?php else : ?>

        <div class="lrsd-sf-school-list-toolbar">
            <input type="search" id="lrsd-sf-school-search"
                   placeholder="<?php esc_attr_e('Search schools…', 'lrsd-school-facilities'); ?>"
                   class="lrsd-sf-school-search-input"
                   aria-label="<?php esc_attr_e('Search schools', 'lrsd-school-facilities'); ?>" />
            <span id="lrsd-sf-school-count" class="lrsd-sf-school-count">
                <?php
                echo esc_html(sprintf(
                    /* translators: %d: number of schools */
                    _n('%d school', '%d schools', count($posts), 'lrsd-school-facilities'),
                    count($posts)
                ));
                ?>
            </span>
        </div>

        <div class="lrsd-sf-school-table-wrap">
            <table class="widefat striped lrsd-sf-school-table" id="lrsd-sf-school-table">
                <thead>
                    <tr>
                        <th><?php esc_html_e('School', 'lrsd-school-facilities'); ?></th>
                        <th><?php esc_html_e('Type', 'lrsd-school-facilities'); ?></th>
                        <th><?php esc_html_e('Level', 'lrsd-school-facilities'); ?></th>
                        <th><?php esc_html_e('Family of Schools', 'lrsd-school-facilities'); ?></th>
                        <th><?php esc_html_e('Action', 'lrsd-school-facilities'); ?></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($posts as $school_post) :
                    $school_level = get_post_meta($school_post->ID, 'lrsd_school_data', true);
                    $sdata = lrsd_sf_normalize_school_data($school_level);
                    $school_name = trim((string) ($sdata['schoolName'] ?? $school_post->post_title));
                    $school_type = $sdata['schoolType'] ?? '';
                    $school_level_label = $sdata['schoolLevel'] ?? '';
                    $family_of_schools = $sdata['familyOfSchools'] ?? '';
                    $edit_url = get_edit_post_link($school_post->ID);
                    $search_index = strtolower(implode(' ', [$school_name, $school_type, $school_level_label, $family_of_schools]));
                ?>
                    <tr class="lrsd-sf-school-row" data-school-search="<?php echo esc_attr($search_index); ?>">
                        <td><a href="<?php echo esc_url($edit_url); ?>"><?php echo esc_html($school_name); ?></a></td>
                        <td><?php echo esc_html($school_type ?: '—'); ?></td>
                        <td><?php echo esc_html($school_level_label ?: '—'); ?></td>
                        <td><?php echo esc_html($family_of_schools ?: '—'); ?></td>
                        <td><a class="button button-secondary" href="<?php echo esc_url($edit_url); ?>"><?php esc_html_e('Edit School', 'lrsd-school-facilities'); ?></a></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <p id="lrsd-sf-school-no-results" class="lrsd-sf-school-no-results" style="display:none;">
            <?php esc_html_e('No schools match your search.', 'lrsd-school-facilities'); ?>
        </p>

        <script>
        (function() {
            var searchInput = document.getElementById('lrsd-sf-school-search');
            var table       = document.getElementById('lrsd-sf-school-table');
            var noResults   = document.getElementById('lrsd-sf-school-no-results');
            var countEl     = document.getElementById('lrsd-sf-school-count');
            var totalCount  = <?php echo (int) count($posts); ?>;

            if (!searchInput || !table) return;

            searchInput.addEventListener('input', function() {
                var query   = this.value.toLowerCase().trim();
                var rows    = table.querySelectorAll('.lrsd-sf-school-row');
                var visible = 0;

                rows.forEach(function(row) {
                    var value = row.getAttribute('data-school-search') || '';
                    var show = !query || value.indexOf(query) !== -1;
                    row.style.display = show ? '' : 'none';
                    if (show) visible++;
                });

                table.style.display = visible === 0 ? 'none' : '';
                noResults.style.display = (visible === 0) ? '' : 'none';

                if (query) {
                    countEl.textContent = visible + ' / ' + totalCount + ' <?php echo esc_js(__('schools', 'lrsd-school-facilities')); ?>';
                } else {
                    countEl.textContent = totalCount + ' <?php echo esc_js(_n('school', 'schools', count($posts), 'lrsd-school-facilities')); ?>';
                }
            });
        })();
        </script>

        <?php endif; ?>
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
        'details'              => __('Building Details', 'lrsd-school-facilities'),
        'additions'            => __('Additions', 'lrsd-school-facilities'),
        'enrolment'            => __('Enrolment & Capacity', 'lrsd-school-facilities'),
        'projection'           => __('Projected Enrolment', 'lrsd-school-facilities'),
        'history'              => __('Historic Enrolment', 'lrsd-school-facilities'),
        'building'             => __('Building Systems', 'lrsd-school-facilities'),
        'accessibility'        => __('Accessibility', 'lrsd-school-facilities'),
        'playground'           => __('Playground', 'lrsd-school-facilities'),
        'transportation'       => __('Transportation', 'lrsd-school-facilities'),
        'childcare'            => __('Childcare & BLAST', 'lrsd-school-facilities'),
        'catchment'            => __('Catchment', 'lrsd-school-facilities'),
        'projects_provincial'  => __('Provincially Funded Capital Projects', 'lrsd-school-facilities'),
        'projects_local'       => __('Locally Funded Capital Projects', 'lrsd-school-facilities'),
    ];

    // Validate selected category
    if (!array_key_exists($category, $categories)) {
        $category = 'details';
    }

    $field_map   = lrsd_sf_get_simple_field_map();
    $cat_fields  = array_filter($field_map, static function ($field) use ($category) {
        return ($field['section'] ?? '') === $category;
    });

    $is_playground = $category === 'playground';
    $is_series     = in_array($category, ['history', 'projection'], true);
    $is_additions  = $category === 'additions';
    $is_childcare  = $category === 'childcare';
    $is_projects   = in_array($category, ['projects_provincial', 'projects_local'], true);

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
                        <?php elseif ($is_projects) : ?>
                            <th><?php esc_html_e('Requested', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('In Progress', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Completed', 'lrsd-school-facilities'); ?></th>
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
                        <?php elseif ($is_projects) :
                            $proj_type = ($category === 'projects_provincial') ? 'provincial' : 'local';
                            $req_lines  = implode("\n", (array)lrsd_sf_get_nested_value($sdata, ['projects', $proj_type, 'requested'],   []));
                            $prog_lines = implode("\n", (array)lrsd_sf_get_nested_value($sdata, ['projects', $proj_type, 'inProgress'],  []));
                            $comp_lines = implode("\n", (array)lrsd_sf_get_nested_value($sdata, ['projects', $proj_type, 'completed'],   []));
                            $pk_req  = 'projects_' . $proj_type . '_requested';
                            $pk_prog = 'projects_' . $proj_type . '_inProgress';
                            $pk_comp = 'projects_' . $proj_type . '_completed';
                        ?>
                            <td><textarea name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][<?php echo esc_attr($pk_req); ?>]"
                                          rows="4" class="large-text"><?php echo esc_textarea($req_lines); ?></textarea></td>
                            <td><textarea name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][<?php echo esc_attr($pk_prog); ?>]"
                                          rows="4" class="large-text"><?php echo esc_textarea($prog_lines); ?></textarea></td>
                            <td><textarea name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][<?php echo esc_attr($pk_comp); ?>]"
                                          rows="4" class="large-text"><?php echo esc_textarea($comp_lines); ?></textarea></td>
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
