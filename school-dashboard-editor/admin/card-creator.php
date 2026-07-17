<?php

defined('ABSPATH') || exit;

function lrsd_sf_render_card_creator_page() {
    if (!current_user_can('edit_posts')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'lrsd-school-facilities'));
    }
    ?>
    <div class="wrap lrsd-sf-wrap lrsd-sf-card-creator-wrap">
        <h1><?php esc_html_e('Card Creator', 'lrsd-school-facilities'); ?></h1>
        <p class="description">
            <?php esc_html_e('Create, preview, duplicate, and save dashboard cards. Global cards appear on every school; Select Schools cards appear only on the schools you choose.', 'lrsd-school-facilities'); ?>
        </p>

        <div id="lrsd-sf-card-creator" class="lrsd-sf-card-creator-app">
            <div class="lrsd-sf-creator-topbar">
                <button type="button" class="button button-primary" id="lrsd-sf-card-new-global"><?php esc_html_e('New Global Card', 'lrsd-school-facilities'); ?></button>
                <button type="button" class="button" id="lrsd-sf-card-new-select"><?php esc_html_e('New Select Schools Card', 'lrsd-school-facilities'); ?></button>
            </div>

            <div id="lrsd-sf-card-status" class="lrsd-sf-card-status" aria-live="polite"></div>

            <section class="lrsd-sf-creator-panel lrsd-sf-card-browser-panel">
                <h2><?php esc_html_e('Saved Cards', 'lrsd-school-facilities'); ?></h2>
                <p class="description"><?php esc_html_e('Edit or delete cards directly from this list, or create a new card above.', 'lrsd-school-facilities'); ?></p>
                <div class="lrsd-sf-card-columns">
                    <div class="lrsd-sf-card-column">
                        <h3 class="lrsd-sf-card-column-title"><?php esc_html_e('Global Cards', 'lrsd-school-facilities'); ?></h3>
                        <p class="description lrsd-sf-card-column-desc"><?php esc_html_e('Visible on all schools.', 'lrsd-school-facilities'); ?></p>
                        <ul id="lrsd-sf-card-list-global" class="lrsd-sf-card-list"></ul>
                    </div>
                    <div class="lrsd-sf-card-column">
                        <h3 class="lrsd-sf-card-column-title"><?php esc_html_e('Select School Cards', 'lrsd-school-facilities'); ?></h3>
                        <p class="description lrsd-sf-card-column-desc"><?php esc_html_e('Visible only on chosen schools.', 'lrsd-school-facilities'); ?></p>
                        <ul id="lrsd-sf-card-list-select" class="lrsd-sf-card-list"></ul>
                    </div>
                </div>
            </section>

            <div id="lrsd-sf-card-workspace" class="lrsd-sf-card-workspace" hidden>
                <div class="lrsd-sf-creator-topbar lrsd-sf-creator-workspace-topbar">
                    <div class="lrsd-sf-creator-toolbar-group lrsd-sf-creator-toolbar-group--grow">
                        <label for="lrsd-sf-card-select" class="screen-reader-text"><?php esc_html_e('Select card', 'lrsd-school-facilities'); ?></label>
                        <select id="lrsd-sf-card-select" class="lrsd-sf-card-select"></select>
                    </div>
                    <div class="lrsd-sf-creator-toolbar-group">
                        <button type="button" class="button" id="lrsd-sf-card-duplicate"><?php esc_html_e('Duplicate', 'lrsd-school-facilities'); ?></button>
                        <button type="button" class="button" id="lrsd-sf-card-reset"><?php esc_html_e('Reset to Defaults', 'lrsd-school-facilities'); ?></button>
                        <button type="button" class="button button-link-delete" id="lrsd-sf-card-delete"><?php esc_html_e('Delete', 'lrsd-school-facilities'); ?></button>
                        <button type="button" class="button button-primary lrsd-sf-card-save-action" id="lrsd-sf-card-save"><?php esc_html_e('Save Card', 'lrsd-school-facilities'); ?></button>
                        <button type="button" class="button" id="lrsd-sf-card-close"><?php esc_html_e('Close', 'lrsd-school-facilities'); ?></button>
                    </div>
                </div>

                <div class="lrsd-sf-creator-layout">
                <section class="lrsd-sf-creator-panel lrsd-sf-creator-form-panel">
                    <h2><?php esc_html_e('Card Setup', 'lrsd-school-facilities'); ?></h2>
                    <div class="lrsd-sf-form-row">
                        <label for="lrsd-sf-card-title"><?php esc_html_e('Title', 'lrsd-school-facilities'); ?></label>
                        <input type="text" id="lrsd-sf-card-title" class="regular-text" maxlength="80" />
                    </div>

                    <div class="lrsd-sf-form-row">
                        <label for="lrsd-sf-card-type"><?php esc_html_e('Card Type', 'lrsd-school-facilities'); ?></label>
                        <select id="lrsd-sf-card-type"></select>
                    </div>

                    <div class="lrsd-sf-form-row lrsd-sf-scope-row">
                        <label><?php esc_html_e('Visibility', 'lrsd-school-facilities'); ?></label>
                        <div class="lrsd-sf-scope-options">
                            <label class="lrsd-sf-scope-option">
                                <input type="radio" name="lrsd-sf-card-scope" id="lrsd-sf-scope-global" value="global">
                                <span><?php esc_html_e('Global — visible on all schools', 'lrsd-school-facilities'); ?></span>
                            </label>
                            <label class="lrsd-sf-scope-option">
                                <input type="radio" name="lrsd-sf-card-scope" id="lrsd-sf-scope-select" value="select">
                                <span><?php esc_html_e('Select Schools — visible only on chosen schools', 'lrsd-school-facilities'); ?></span>
                            </label>
                        </div>
                    </div>

                    <div id="lrsd-sf-school-picker" class="lrsd-sf-school-picker" hidden>
                        <label><?php esc_html_e('Schools', 'lrsd-school-facilities'); ?></label>
                        <p class="description"><?php esc_html_e('Choose one or more schools this card will appear on.', 'lrsd-school-facilities'); ?></p>
                        <div class="lrsd-sf-school-picker-actions">
                            <button type="button" class="button-link" id="lrsd-sf-school-picker-all"><?php esc_html_e('Select All', 'lrsd-school-facilities'); ?></button>
                            <span class="lrsd-sf-school-picker-sep">·</span>
                            <button type="button" class="button-link" id="lrsd-sf-school-picker-none"><?php esc_html_e('Deselect All', 'lrsd-school-facilities'); ?></button>
                        </div>
                        <div id="lrsd-sf-school-picker-list" class="lrsd-sf-school-picker-list"></div>
                    </div>

                    <div class="lrsd-sf-form-row">
                        <label for="lrsd-sf-card-icon"><?php esc_html_e('Icon', 'lrsd-school-facilities'); ?></label>
                        <div class="lrsd-sf-icon-input-wrap">
                            <input type="text" id="lrsd-sf-card-icon" class="regular-text" readonly />
                            <button type="button" class="button" id="lrsd-sf-icon-picker-open"><?php esc_html_e('Pick Icon', 'lrsd-school-facilities'); ?></button>
                        </div>
                        <p class="description"><?php esc_html_e('Choose from the dashboard icon registry or upload from the Media Library.', 'lrsd-school-facilities'); ?></p>
                    </div>

                    <div class="lrsd-sf-form-row lrsd-sf-note-builder">
                        <button type="button" class="button" id="lrsd-sf-note-toggle"><?php esc_html_e('Add Note', 'lrsd-school-facilities'); ?></button>
                        <div id="lrsd-sf-note-fields" class="lrsd-sf-note-fields" hidden>
                            <label for="lrsd-sf-card-note-mode"><?php esc_html_e('Note Mode', 'lrsd-school-facilities'); ?></label>
                            <select id="lrsd-sf-card-note-mode">
                                <option value="inline"><?php esc_html_e('Inline note', 'lrsd-school-facilities'); ?></option>
                                <option value="flip"><?php esc_html_e('Flip card note', 'lrsd-school-facilities'); ?></option>
                            </select>
                            <label for="lrsd-sf-card-note-title"><?php esc_html_e('Note Title', 'lrsd-school-facilities'); ?></label>
                            <input type="text" id="lrsd-sf-card-note-title" class="regular-text" maxlength="80" />
                            <label for="lrsd-sf-card-notes"><?php esc_html_e('Notes', 'lrsd-school-facilities'); ?></label>
                            <textarea id="lrsd-sf-card-notes" rows="3"></textarea>
                        </div>
                    </div>

                    <div class="lrsd-sf-form-row">
                        <h3><?php esc_html_e('Content Fields', 'lrsd-school-facilities'); ?></h3>
                        <div id="lrsd-sf-card-dynamic-fields"></div>
                    </div>

                    <details class="lrsd-sf-form-row">
                        <summary><?php esc_html_e('Advanced JSON', 'lrsd-school-facilities'); ?></summary>
                        <p class="description"><?php esc_html_e('Power-user mode. JSON is validated against the card schema before save.', 'lrsd-school-facilities'); ?></p>
                        <textarea id="lrsd-sf-card-json" rows="12" class="code"></textarea>
                        <p>
                            <button type="button" class="button" id="lrsd-sf-apply-json"><?php esc_html_e('Apply JSON to Form', 'lrsd-school-facilities'); ?></button>
                        </p>
                    </details>
                </section>

                <section class="lrsd-sf-creator-panel lrsd-sf-creator-preview-panel">
                    <h2><?php esc_html_e('Preview', 'lrsd-school-facilities'); ?></h2>
                    <p class="description"><?php esc_html_e('Preview shows a simplified layout for the selected card type.', 'lrsd-school-facilities'); ?></p>
                    <iframe id="lrsd-sf-card-preview-frame" class="lrsd-sf-card-preview-frame" title="<?php esc_attr_e('Card preview', 'lrsd-school-facilities'); ?>"></iframe>
                </section>
                </div>
                <div class="lrsd-sf-creator-bottombar">
                    <p class="lrsd-sf-creator-bottombar-copy"><?php esc_html_e('Save buttons are available at both the top and bottom so you can keep moving quickly.', 'lrsd-school-facilities'); ?></p>
                    <div class="lrsd-sf-creator-toolbar-group">
                        <button type="button" class="button button-primary lrsd-sf-card-save-action"><?php esc_html_e('Save Card', 'lrsd-school-facilities'); ?></button>
                        <button type="button" class="button lrsd-sf-card-close-action"><?php esc_html_e('Close', 'lrsd-school-facilities'); ?></button>
                    </div>
                </div>
            </div>
        </div>

        <div id="lrsd-sf-icon-picker-modal" class="lrsd-sf-icon-picker-modal" hidden>
            <div class="lrsd-sf-icon-picker-dialog">
                <div class="lrsd-sf-icon-picker-header">
                    <h2><?php esc_html_e('Choose Icon', 'lrsd-school-facilities'); ?></h2>
                    <div class="lrsd-sf-icon-picker-actions">
                        <button type="button" class="button" id="lrsd-sf-icon-media-library"><?php esc_html_e('From Media Library', 'lrsd-school-facilities'); ?></button>
                        <button type="button" class="button-link" id="lrsd-sf-icon-picker-close"><?php esc_html_e('Close', 'lrsd-school-facilities'); ?> &#x2715;</button>
                    </div>
                </div>
                <input type="search" id="lrsd-sf-icon-search" placeholder="<?php esc_attr_e('Search icons…', 'lrsd-school-facilities'); ?>" />
                <div id="lrsd-sf-icon-grid" class="lrsd-sf-icon-grid"></div>
            </div>
        </div>
    </div>
    <?php
}
