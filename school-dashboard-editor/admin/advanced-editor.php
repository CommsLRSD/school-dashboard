<?php

defined('ABSPATH') || exit;

// ─── Page Renderer ────────────────────────────────────────────────────────────

function lrsd_sf_render_advanced_editor_page() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'lrsd-school-facilities'));
    }

    $notice  = lrsd_sf_get_admin_notice();
    $dataset = lrsd_sf_get_school_dataset();
    $history = lrsd_sf_get_json_version_history();

    // Build display JSON: top-level meta keys first, then schools sorted A-Z
    $display = [];
    foreach (['lastUpdated', 'fosMapLookup', 'globalCustomCards'] as $meta_key) {
        if (array_key_exists($meta_key, $dataset)) {
            $display[$meta_key] = $dataset[$meta_key];
        }
    }

    $schools = [];
    foreach ($dataset as $key => $value) {
        if (in_array($key, ['lastUpdated', 'fosMapLookup', 'globalCustomCards'], true)) {
            continue;
        }
        if (!is_array($value)) {
            continue;
        }
        $schools[$key] = $value;
    }

    // Sort schools alphabetically by schoolName, falling back to key
    uasort($schools, static function ($a, $b) {
        $name_a = strtolower(trim((string)($a['schoolName'] ?? '')));
        $name_b = strtolower(trim((string)($b['schoolName'] ?? '')));
        if ($name_a === '') { $name_a = 'zzz'; }
        if ($name_b === '') { $name_b = 'zzz'; }
        return strcmp($name_a, $name_b);
    });

    foreach ($schools as $key => $value) {
        $display[$key] = $value;
    }

    $json_pretty = wp_json_encode($display, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    ?>
    <div class="wrap lrsd-sf-wrap lrsd-sf-adv-wrap">
        <h1><?php esc_html_e('Advanced JSON Editor', 'lrsd-school-facilities'); ?></h1>

        <?php if (!empty($notice['message'])) : ?>
            <div class="notice notice-<?php echo esc_attr(($notice['type'] ?? 'success') === 'success' ? 'success' : 'error'); ?> is-dismissible">
                <p><?php echo wp_kses_post($notice['message']); ?></p>
            </div>
        <?php endif; ?>

        <p class="description" style="margin-bottom:16px;">
            <?php esc_html_e('Edit the full JSON below. Schools are sorted A–Z by default. Click "Save & Publish" to apply changes to all school records. The previous state is automatically saved to version history before each save.', 'lrsd-school-facilities'); ?>
        </p>

        <!-- ── JSON Editor ──────────────────────────────────────────────────── -->
        <div class="lrsd-sf-adv-editor-card">
            <div class="lrsd-sf-adv-editor-toolbar">
                <span class="lrsd-sf-adv-toolbar-title">
                    <?php esc_html_e('Full Schools JSON', 'lrsd-school-facilities'); ?>
                </span>
                <div class="lrsd-sf-adv-toolbar-actions">
                    <button type="button" id="lrsd-sf-adv-copy" class="button">
                        <?php esc_html_e('Copy to Clipboard', 'lrsd-school-facilities'); ?>
                    </button>
                    <button type="button" id="lrsd-sf-adv-format" class="button">
                        <?php esc_html_e('Format JSON', 'lrsd-school-facilities'); ?>
                    </button>
                </div>
            </div>

            <div id="lrsd-sf-adv-status" class="lrsd-sf-adv-status" aria-live="polite"></div>

            <div class="lrsd-sf-adv-save-bar lrsd-sf-adv-save-bar--top">
                <button type="button" class="button button-primary button-large lrsd-sf-adv-save-action">
                    <?php esc_html_e('Save &amp; Publish', 'lrsd-school-facilities'); ?>
                </button>
                <span class="spinner lrsd-sf-adv-spinner" style="float:none;margin:0 8px;"></span>
                <span class="description"><?php esc_html_e('Publish updates from here or from the bottom action bar.', 'lrsd-school-facilities'); ?></span>
            </div>

            <textarea
                id="lrsd-sf-adv-json"
                class="lrsd-sf-adv-json-editor code"
                spellcheck="false"
                autocorrect="off"
                autocapitalize="off"
                aria-label="<?php esc_attr_e('Full Schools JSON Editor', 'lrsd-school-facilities'); ?>"
            ><?php echo esc_textarea($json_pretty); ?></textarea>

            <div class="lrsd-sf-adv-save-bar">
                <button type="button" class="button button-primary button-large lrsd-sf-adv-save-action">
                    <?php esc_html_e('Save &amp; Publish', 'lrsd-school-facilities'); ?>
                </button>
                <span class="spinner lrsd-sf-adv-spinner" style="float:none;margin:0 8px;"></span>
                <span class="description"><?php esc_html_e('Saving will update all school records and push the current dataset live.', 'lrsd-school-facilities'); ?></span>
            </div>
        </div>

        <!-- ── Version History ──────────────────────────────────────────────── -->
        <div class="lrsd-sf-adv-history-card">
            <h2 class="lrsd-sf-adv-history-heading">
                <?php esc_html_e('Version History', 'lrsd-school-facilities'); ?>
            </h2>
            <p class="description" style="margin-bottom:12px;">
                <?php esc_html_e('The last 20 saves are kept. Click "Restore" to load a previous version into the editor, then save to apply it.', 'lrsd-school-facilities'); ?>
            </p>

            <?php if (empty($history)) : ?>
                <p class="lrsd-sf-adv-no-history">
                    <?php esc_html_e('No version history yet. History is created automatically when you save.', 'lrsd-school-facilities'); ?>
                </p>
            <?php else : ?>
                <table class="widefat striped lrsd-sf-adv-history-table">
                    <thead>
                        <tr>
                            <th><?php esc_html_e('#', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Saved', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Label', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Schools', 'lrsd-school-facilities'); ?></th>
                            <th><?php esc_html_e('Actions', 'lrsd-school-facilities'); ?></th>
                        </tr>
                    </thead>
                    <tbody id="lrsd-sf-adv-history-rows">
                    <?php foreach ($history as $i => $ver) :
                        $ts        = (int)($ver['timestamp'] ?? 0);
                        $label     = esc_html($ver['label'] ?? __('(unlabelled)', 'lrsd-school-facilities'));
                        $num_shown = (int)($ver['schoolCount'] ?? 0);
                        $date_str  = $ts ? wp_date('Y-m-d H:i', $ts) : '—';
                    ?>
                        <tr>
                            <td class="lrsd-sf-adv-ver-num"><?php echo esc_html($i + 1); ?></td>
                            <td class="lrsd-sf-adv-ver-date"><?php echo esc_html($date_str); ?></td>
                            <td class="lrsd-sf-adv-ver-label"><?php echo $label; ?></td>
                            <td class="lrsd-sf-adv-ver-count"><?php echo esc_html($num_shown); ?></td>
                            <td>
                                <button type="button"
                                        class="button lrsd-sf-adv-restore-btn"
                                        data-version="<?php echo esc_attr($i); ?>"
                                        title="<?php esc_attr_e('Load this version into the editor', 'lrsd-school-facilities'); ?>">
                                    <?php esc_html_e('Restore', 'lrsd-school-facilities'); ?>
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>

            <p id="lrsd-sf-adv-restore-note" class="lrsd-sf-adv-restore-note" style="display:none;">
                <?php esc_html_e('Version loaded into the editor. Review the JSON, then click "Save & Publish" to apply it.', 'lrsd-school-facilities'); ?>
            </p>
        </div>
    </div>

    <?php
    // Pass data to JS
    wp_localize_script('lrsd-sf-admin', 'lrsdSfAdv', [
        'ajaxUrl'      => admin_url('admin-ajax.php'),
        'saveNonce'    => wp_create_nonce('lrsd_sf_adv_save'),
        'restoreNonce' => wp_create_nonce('lrsd_sf_adv_restore'),
        'history'      => array_map(static function ($ver) {
            return [
                'timestamp'   => (int)($ver['timestamp']   ?? 0),
                'label'       => (string)($ver['label']    ?? ''),
                'schoolCount' => (int)($ver['schoolCount'] ?? 0),
                'json'        => (string)($ver['json']     ?? ''),
            ];
        }, $history),
        'i18n' => [
            'saving'        => __('Saving…', 'lrsd-school-facilities'),
            'saved'         => __('Saved & published successfully.', 'lrsd-school-facilities'),
            'errorGeneric'  => __('An error occurred. Please try again.', 'lrsd-school-facilities'),
            'errorJson'     => __('Invalid JSON – please fix errors before saving.', 'lrsd-school-facilities'),
            'copied'        => __('Copied to clipboard.', 'lrsd-school-facilities'),
            'formatted'     => __('JSON formatted.', 'lrsd-school-facilities'),
            'restoreLoaded' => __('Version loaded. Review and save to apply.', 'lrsd-school-facilities'),
            'confirmRestore'=> __('Load this version into the editor? Unsaved changes will be lost.', 'lrsd-school-facilities'),
        ],
    ]);
}
