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
        $renderer_inline_script = '';
        $asset_base_url         = home_url('/');
        $frontend_styles_url    = home_url('/styles.css');
        $get_parent_url         = static function ($url, $levels = 1) {
            $parent_url = untrailingslashit($url);
            for ($i = 0; $i < max(1, (int) $levels); $i++) {
                $parent_url = dirname($parent_url);
            }
            return trailingslashit($parent_url);
        };
        $asset_parent_url      = $get_parent_url(LRSD_SF_PLUGIN_URL, 1);
        $asset_grandparent_url = $get_parent_url(LRSD_SF_PLUGIN_URL, 2);

        // Search for card-renderer.js: plugin parent/grandparent dirs first (dev/monorepo
        // layout where the plugin lives inside the frontend project), then fall back to the
        // plugin's own admin directory in case it was copied there for standalone installs.
        $renderer_candidates = [
            [
                'path'     => dirname(LRSD_SF_PLUGIN_DIR) . '/card-renderer.js',
                'base_url' => $asset_parent_url,
            ],
            [
                'path'     => dirname(LRSD_SF_PLUGIN_DIR, 2) . '/card-renderer.js',
                'base_url' => $asset_grandparent_url,
            ],
            [
                'path'     => LRSD_SF_PLUGIN_DIR . 'admin/card-renderer.js',
                'base_url' => LRSD_SF_PLUGIN_URL . 'admin/',
            ],
        ];
        foreach ($renderer_candidates as $renderer_candidate) {
            if (
                file_exists($renderer_candidate['path']) &&
                is_readable($renderer_candidate['path']) &&
                filesize($renderer_candidate['path']) < LRSD_SF_MAX_RENDERER_SOURCE_SIZE_BYTES
            ) {
                $content = file_get_contents($renderer_candidate['path']); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
                if ($content !== false) {
                    $renderer_inline_script = $content;
                    $asset_base_url         = esc_url_raw($renderer_candidate['base_url']);
                    $frontend_styles_url    = esc_url_raw($renderer_candidate['base_url'] . 'styles.css');
                    $renderer_url           = esc_url_raw($renderer_candidate['base_url'] . 'card-renderer.js');
                }
                break;
            }
        }

        // When the renderer file cannot be found on disk (e.g. standalone WP plugin install
        // where the frontend app is deployed separately), fall back to the site-root URL so
        // the iframe can still try to load the script at runtime.
        if ('' === $renderer_url) {
            $renderer_url = esc_url_raw(home_url('/card-renderer.js'));
        }

        wp_localize_script('lrsd-sf-card-creator', 'lrsdSfCardCreator', [
            'ajaxUrl'              => admin_url('admin-ajax.php'),
            'nonce'                => wp_create_nonce('lrsd_sf_card_creator_nonce'),
            'siteUrl'              => home_url('/'),
            'assetBaseUrl'         => $asset_base_url,
            'frontendStylesUrl'    => $frontend_styles_url,
            'rendererUrl'          => $renderer_url,
            'rendererInlineScript' => $renderer_inline_script,
            'i18n'                 => [
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
                'noCardsYet'          => __('No cards yet. Click New Card to create one.', 'lrsd-school-facilities'),
                'secureIdRequired'    => __('Secure ID generation is unavailable in this browser.', 'lrsd-school-facilities'),
                'duplicateSuffix'     => __('Copy', 'lrsd-school-facilities'),
                'unsavedCardFallback' => __('Unsaved card', 'lrsd-school-facilities'),
                'mediaLibraryTitle'   => __('Choose Icon from Media Library', 'lrsd-school-facilities'),
                'mediaLibraryButton'  => __('Use as Icon', 'lrsd-school-facilities'),
                'mediaLibraryImageTitle' => __('Choose Image from Media Library', 'lrsd-school-facilities'),
                'mediaLibraryImageButton' => __('Use Image', 'lrsd-school-facilities'),
                'mediaLibraryUnavailable' => __('Media library is not available. Please reload the page and try again.', 'lrsd-school-facilities'),
                'previewEmpty'        => __('Select or create a card to preview it.', 'lrsd-school-facilities'),
                'addNote'             => __('Add Note', 'lrsd-school-facilities'),
                'editNote'            => __('Edit Note', 'lrsd-school-facilities'),
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
    $create_school_url = wp_nonce_url(
        admin_url('admin-post.php?action=lrsd_sf_create_school'),
        'lrsd_sf_create_school'
    );
    $notice = lrsd_sf_get_admin_notice();
    ?>
    <div class="wrap lrsd-sf-wrap">
        <h1><?php esc_html_e('Update by School', 'lrsd-school-facilities'); ?></h1>
        <a href="<?php echo esc_url($create_school_url); ?>" class="page-title-action"><?php esc_html_e('Add New School', 'lrsd-school-facilities'); ?></a>

        <?php if (!empty($notice['message'])) : ?>
            <div class="notice notice-<?php echo esc_attr(($notice['type'] ?? 'success') === 'success' ? 'success' : 'error'); ?> is-dismissible">
                <p><?php echo wp_kses_post($notice['message']); ?></p>
            </div>
        <?php endif; ?>

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
                    $school_name = lrsd_sf_get_school_display_name($sdata, $school_post->post_title);
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
                        <td>
                            <a class="button button-secondary" href="<?php echo esc_url($edit_url); ?>"><?php esc_html_e('Edit School', 'lrsd-school-facilities'); ?></a>
                        </td>
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

function lrsd_sf_handle_create_school() {
    if (!current_user_can('edit_posts')) {
        wp_die(esc_html__('You do not have permission to create school records.', 'lrsd-school-facilities'));
    }

    check_admin_referer('lrsd_sf_create_school');

    $post_id = wp_insert_post([
        'post_type'   => 'lr_school',
        'post_status' => 'publish',
        'post_title'  => __('New School', 'lrsd-school-facilities'),
    ], true);

    if (is_wp_error($post_id) || $post_id <= 0) {
        lrsd_sf_set_admin_notice(__('Could not create the new school record. Please try again.', 'lrsd-school-facilities'), 'error');
        wp_safe_redirect(admin_url('admin.php?page=lrsd-school-facilities-schools'));
        exit;
    }

    wp_update_post([
        'ID'         => $post_id,
        'post_title' => sprintf(
            /* translators: %d: school post ID */
            __('New School %d', 'lrsd-school-facilities'),
            (int) $post_id
        ),
    ]);

    $school_id = lrsd_sf_generate_school_id($post_id);
    update_post_meta($post_id, 'lrsd_school_id', $school_id);
    update_post_meta($post_id, 'lrsd_school_data', lrsd_sf_encode_school_data(lrsd_sf_get_blank_school_data($school_id)));

    lrsd_sf_set_editor_notice(__('New school created. Fill in the blank fields and save when ready.', 'lrsd-school-facilities'), 'success');

    $edit_url = get_edit_post_link($post_id, 'raw');
    wp_safe_redirect($edit_url ? $edit_url : admin_url('post.php?post=' . (int) $post_id . '&action=edit'));
    exit;
}

// ─── Delete School Handler ────────────────────────────────────────────────────

function lrsd_sf_handle_delete_school() {
    if (!current_user_can('delete_posts')) {
        wp_die(esc_html__('You do not have permission to delete school records.', 'lrsd-school-facilities'));
    }

    $post_id = isset($_GET['post_id']) ? (int) $_GET['post_id'] : 0;
    if ($post_id <= 0) {
        wp_die(esc_html__('Invalid school record.', 'lrsd-school-facilities'));
    }

    check_admin_referer('lrsd_sf_delete_school_' . $post_id);

    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'lr_school') {
        lrsd_sf_set_admin_notice(__('School record not found.', 'lrsd-school-facilities'), 'error');
        wp_safe_redirect(admin_url('admin.php?page=lrsd-school-facilities-schools'));
        exit;
    }

    if (!lrsd_sf_is_valid_school_post($post)) {
        lrsd_sf_set_admin_notice(__('This record cannot be deleted from here.', 'lrsd-school-facilities'), 'error');
        wp_safe_redirect(admin_url('admin.php?page=lrsd-school-facilities-schools'));
        exit;
    }

    $school_data = lrsd_sf_normalize_school_data(get_post_meta($post_id, 'lrsd_school_data', true));
    $school_name = lrsd_sf_get_school_display_name($school_data, $post->post_title);

    $trashed = wp_trash_post($post_id);
    if (!$trashed) {
        lrsd_sf_set_admin_notice(__('Could not delete the school record. Please try again.', 'lrsd-school-facilities'), 'error');
        wp_safe_redirect(admin_url('admin.php?page=lrsd-school-facilities-schools'));
        exit;
    }

    lrsd_sf_flush_dataset_cache();

    lrsd_sf_set_admin_notice(
        sprintf(
            /* translators: %s: school name */
            __('"%s" has been deleted and removed from the web app.', 'lrsd-school-facilities'),
            $school_name
        ),
        'success'
    );

    wp_safe_redirect(admin_url('admin.php?page=lrsd-school-facilities-schools'));
    exit;
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
    $global_custom_cards = lrsd_sf_get_global_custom_cards();
    $custom_card_lookup = [];
    foreach ($global_custom_cards as $custom_card) {
        if (!is_array($custom_card)) {
            continue;
        }
        $custom_id = sanitize_key((string) ($custom_card['id'] ?? ''));
        if ($custom_id === '') {
            continue;
        }
        $custom_title = sanitize_text_field((string) ($custom_card['title'] ?? ''));
        $categories[$custom_id] = sprintf(
            /* translators: %s: custom card title */
            __('Custom: %s', 'lrsd-school-facilities'),
            $custom_title !== '' ? $custom_title : $custom_id
        );
        $custom_card_lookup[$custom_id] = $custom_card;
    }

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
    $is_custom_card = isset($custom_card_lookup[$category]);
    $selected_custom_card = $is_custom_card ? $custom_card_lookup[$category] : null;

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

            <div class="lrsd-sf-page-actions lrsd-sf-page-actions--top">
                <p class="lrsd-sf-page-actions-copy"><?php esc_html_e('Save &amp; publish from either action bar—top or bottom.', 'lrsd-school-facilities'); ?></p>
                <button type="submit" class="button button-primary lrsd-sf-bulk-save-action">
                    <?php esc_html_e('Save All Changes', 'lrsd-school-facilities'); ?>
                </button>
            </div>

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
                            <th><?php esc_html_e('School-age (5+ years)', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('School-age (7+ years)', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Special Needs (12+ years)', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('BLAST', 'lrsd-school-facilities'); ?></th>
                        <?php elseif ($is_projects) : ?>
                            <th><?php esc_html_e('Requested', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('In Progress', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Completed', 'lrsd-school-facilities'); ?></th>
                        <?php elseif ($is_custom_card) :
                            $custom_type = sanitize_key((string) ($selected_custom_card['cardType'] ?? 'details_list'));
                            if ($custom_type === 'image') :
                        ?>
                            <th><?php esc_html_e('Image URL', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Image Link', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Overlay Text', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Notes', 'lrsd-school-facilities'); ?></th>
                            <?php else :
                                $custom_items = isset($selected_custom_card['items']) && is_array($selected_custom_card['items']) ? array_values($selected_custom_card['items']) : [];
                                foreach ($custom_items as $custom_item_index => $custom_item) :
                                    if (!is_array($custom_item)) {
                                        continue;
                                    }
                                    $custom_label = sanitize_text_field((string) ($custom_item['label'] ?? ''));
                                    if ($custom_label === '') {
                                        $custom_label = sprintf(
                                            /* translators: %d: field number */
                                            __('Field %d', 'lrsd-school-facilities'),
                                            (int) $custom_item_index + 1
                                        );
                                    }
                            ?>
                                <th><?php echo esc_html($custom_label); ?></th>
                                <?php endforeach; ?>
                                <th><?php esc_html_e('Notes', 'lrsd-school-facilities'); ?></th>
                            <?php endif; ?>
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
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][childcare][School-age (5+ years)]" aria-label="<?php esc_attr_e('School-age 5+ childcare value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($childcare['School-age (5+ years)'] ?? '')); ?>" /></td>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][childcare][School-age (7+ years)]" aria-label="<?php esc_attr_e('School-age childcare value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($childcare['School-age (7+ years)'] ?? '')); ?>" /></td>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][childcare][Special Needs (12+ years)]" aria-label="<?php esc_attr_e('Special needs childcare value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($childcare['Special Needs (12+ years)'] ?? '')); ?>" /></td>
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
                        <?php elseif ($is_custom_card) :
                            $custom_entry = isset($sdata['customCardValues'][$category]) && is_array($sdata['customCardValues'][$category]) ? $sdata['customCardValues'][$category] : [];
                            $custom_type = sanitize_key((string) ($selected_custom_card['cardType'] ?? 'details_list'));
                            if ($custom_type === 'image') :
                        ?>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][custom_image_url]" value="<?php echo esc_attr((string) ($custom_entry['imageUrl'] ?? '')); ?>" /></td>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][custom_image_link]" value="<?php echo esc_attr((string) ($custom_entry['imageLink'] ?? '')); ?>" /></td>
                            <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][custom_image_overlay]" value="<?php echo esc_attr((string) ($custom_entry['imageOverlayText'] ?? '')); ?>" /></td>
                            <td><textarea name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][custom_notes]" rows="3" class="large-text"><?php echo esc_textarea((string) ($custom_entry['notes'] ?? '')); ?></textarea></td>
                            <?php else :
                                $custom_items = isset($selected_custom_card['items']) && is_array($selected_custom_card['items']) ? array_values($selected_custom_card['items']) : [];
                                $custom_item_values = isset($custom_entry['items']) && is_array($custom_entry['items']) ? array_values($custom_entry['items']) : [];
                                foreach ($custom_items as $custom_item_index => $custom_item) :
                                    if (!is_array($custom_item)) {
                                        continue;
                                    }
                                    $custom_value = isset($custom_item_values[$custom_item_index]['value']) ? (string) $custom_item_values[$custom_item_index]['value'] : '';
                                    $custom_value_type = sanitize_key((string) ($custom_item['valueType'] ?? 'text'));
                                    if ($custom_value_type === 'number') :
                            ?>
                                <td><input type="number" step="any" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][custom_item_values][<?php echo esc_attr((string) $custom_item_index); ?>]" value="<?php echo esc_attr($custom_value); ?>" /></td>
                                    <?php elseif ($custom_value_type === 'dropdown') :
                                        $custom_options = isset($custom_item['options']) && is_array($custom_item['options']) ? array_values($custom_item['options']) : [];
                                        $custom_options = array_values(array_filter(
                                            array_map('sanitize_text_field', $custom_options),
                                            static function ($option) {
                                                return $option !== '';
                                            }
                                        ));
                                        if ($custom_value !== '' && !in_array($custom_value, $custom_options, true)) {
                                            $custom_options[] = $custom_value;
                                        }
                                    ?>
                                <td>
                                    <select name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][custom_item_values][<?php echo esc_attr((string) $custom_item_index); ?>]">
                                        <option value=""><?php esc_html_e('— Select —', 'lrsd-school-facilities'); ?></option>
                                        <?php foreach ($custom_options as $custom_option) : ?>
                                            <option value="<?php echo esc_attr($custom_option); ?>"<?php selected($custom_value, $custom_option); ?>><?php echo esc_html($custom_option); ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>
                                    <?php else : ?>
                                <td><input type="text" class="regular-text" name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][custom_item_values][<?php echo esc_attr((string) $custom_item_index); ?>]" value="<?php echo esc_attr($custom_value); ?>" /></td>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                                <td><textarea name="lrsd_bulk_schools[<?php echo esc_attr($row_id); ?>][custom_notes]" rows="3" class="large-text"><?php echo esc_textarea((string) ($custom_entry['notes'] ?? '')); ?></textarea></td>
                            <?php endif; ?>
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

            <div class="lrsd-sf-page-actions lrsd-sf-page-actions--bottom">
                <p class="lrsd-sf-page-actions-copy"><?php esc_html_e('Save &amp; publish from either action bar—top or bottom.', 'lrsd-school-facilities'); ?></p>
                <button type="submit" class="button button-primary lrsd-sf-bulk-save-action">
                    <?php esc_html_e('Save All Changes', 'lrsd-school-facilities'); ?>
                </button>
            </div>
        </form>

        <?php endif; ?>
    </div>
    <?php
}
