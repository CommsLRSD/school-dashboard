/* global wp, lrsdSfAdmin */
(function ($) {
    'use strict';

    var i18n = (typeof lrsdSfAdmin !== 'undefined') ? (lrsdSfAdmin.i18n || {}) : {};

    // ── Helpers ────────────────────────────────────────────────────────────────

    function uniqueId() {
        return 'custom_' + Math.random().toString(36).substr(2, 8);
    }

    // ── Section Accordion ──────────────────────────────────────────────────────

    function initSections() {
        $(document).on('click', '.lrsd-sf-section-header', function () {
            var $header = $(this);
            var targetId = $header.data('target');
            var $body = $('#' + targetId);
            var isOpen = $body.hasClass('is-open');

            if (isOpen) {
                $body.removeClass('is-open').slideUp(180);
                $header.attr('aria-expanded', 'false');
            } else {
                $body.addClass('is-open').slideDown(180);
                $header.attr('aria-expanded', 'true');
            }
        });

        // Ensure closed sections start hidden
        $('.lrsd-sf-section-body:not(.is-open)').hide();
    }

    // ── Media Picker ──────────────────────────────────────────────────────────

    var mediaFrame = null;
    var $mediaTarget = null;

    function initMediaPicker() {
        $(document).on('click', '.lrsd-sf-media-btn', function (e) {
            e.preventDefault();

            if (typeof wp === 'undefined' || !wp.media) {
                // WP media library not available (e.g. bulk update page)
                return;
            }

            var targetId = $(this).data('target');
            $mediaTarget = $('#' + targetId);

            if (mediaFrame) {
                mediaFrame.open();
                return;
            }

            mediaFrame = wp.media({
                title: i18n.chooseMedia || 'Choose or Upload Media',
                button: { text: i18n.useMedia || 'Use this file' },
                multiple: false,
            });

            mediaFrame.on('select', function () {
                var attachment = mediaFrame.state().get('selection').first().toJSON();
                if ($mediaTarget && $mediaTarget.length) {
                    $mediaTarget.val(attachment.url);
                    $mediaTarget.siblings('.description').text(attachment.url);
                }
                // Reset so next open picks the right target
                mediaFrame = null;
            });

            mediaFrame.open();
        });
    }

    // ── Custom Dropdown Options ────────────────────────────────────────────────

    function initCustomDropdownOptions() {
        $(document).on('click', '.lrsd-sf-add-option-btn', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var optKey = $btn.data('option-key');
            var nonce  = $btn.data('nonce') || (lrsdSfAdmin ? lrsdSfAdmin.customOptionNonce : '');
            var targetSelectId = $btn.data('target-select');
            var $select = $('#' + targetSelectId);

            var newVal = prompt(i18n.newOption || 'Enter the new option value:');
            if (!newVal || !newVal.trim()) {
                return;
            }
            newVal = newVal.trim();

            var mapPath = '';
            if (optKey === (lrsdSfAdmin ? lrsdSfAdmin.isFosKey : 'familyOfSchools')) {
                mapPath = prompt(i18n.fosCatchmentHint || 'Enter the catchment map file path (e.g. public/maps/my-fos-map.svg). Leave blank if not applicable.') || '';
                mapPath = mapPath.trim();
            }

            $.post(
                lrsdSfAdmin.ajaxUrl,
                {
                    action: 'lrsd_sf_add_custom_option',
                    nonce: nonce,
                    option_key: optKey,
                    option_val: newVal,
                    map_path: mapPath,
                },
                function (response) {
                    if (response.success) {
                        var addedVal = response.data.option_val;
                        // Helper: check if option value already exists in a select
                        function optionExists($sel, val) {
                            var found = false;
                            $sel.find('option').each(function () {
                                if ($(this).val() === val) { found = true; }
                            });
                            return found;
                        }
                        // Add option to all selects sharing this option key on the page
                        $('select[data-option-key="' + optKey + '"]').each(function () {
                            if (!optionExists($(this), addedVal)) {
                                $(this).append($('<option>').val(addedVal).text(addedVal));
                            }
                        });
                        // Ensure it is in the target select and select it
                        if (!optionExists($select, addedVal)) {
                            $select.append($('<option>').val(addedVal).text(addedVal));
                        }
                        $select.val(addedVal);
                    } else {
                        alert(i18n.error || 'An error occurred. Please try again.');
                    }
                }
            ).fail(function () {
                alert(i18n.error || 'An error occurred. Please try again.');
            });
        });
    }

    // ── Card Order Sortable ────────────────────────────────────────────────────

    function initCardOrderSortable() {
        var $list = $('#lrsd-sf-card-order');
        if (!$list.length) {
            return;
        }

        $list.sortable({
            handle: '.dashicons-menu',
            axis: 'y',
            cursor: 'grab',
            tolerance: 'pointer',
            update: function () {
                serializeCardOrder();
            },
        });
    }

    function serializeCardOrder() {
        var order = [];
        $('#lrsd-sf-card-order .lrsd-sf-order-item').each(function () {
            order.push($(this).data('card-id'));
        });
        $('#lrsd_sf_card_order_json').val(JSON.stringify(order));
    }

    // ── Custom Cards Repeater ─────────────────────────────────────────────────

    function buildDisplayTypeOptions(selected) {
        var types = (lrsdSfAdmin && lrsdSfAdmin.displayTypes) ? lrsdSfAdmin.displayTypes : { list: 'Key\u2013Value List', stat: 'Stats / Highlights' };
        var html = '';
        $.each(types, function (key, label) {
            html += '<option value="' + esc(key) + '"' + (key === selected ? ' selected' : '') + '>' + esc(label) + '</option>';
        });
        return html;
    }

    function buildCardHtml(id, title, icon, category, cardType, notes, items) {
        id       = id       || uniqueId();
        title    = title    || '';
        icon     = icon     || '';
        category = category || '';
        cardType = cardType || 'list';
        notes    = notes    || '';
        items    = items    || [];

        var iconFieldId = 'lrsd-card-icon-' + id;

        var itemsHtml = items.map(function (item) {
            return buildItemRowHtml(item.label || '', item.value || '');
        }).join('');

        return '<div class="lrsd-sf-custom-card" data-card-id="' + id + '">' +
            '<div class="lrsd-sf-custom-card-header">' +
                '<span class="lrsd-sf-card-drag dashicons dashicons-move" title="Drag to reorder"></span>' +
                '<strong class="lrsd-sf-card-name">' + (title || (i18n.untitledCard || '(Untitled Card)')) + '</strong>' +
                '<button type="button" class="button lrsd-sf-remove-card" title="Remove card">\u2715</button>' +
            '</div>' +
            '<table class="form-table" role="presentation"><tbody>' +
                '<tr><th>Title</th><td>' +
                    '<input type="text" class="regular-text lrsd-sf-card-title" value="' + esc(title) + '" data-field="title" />' +
                '</td></tr>' +
                '<tr><th>Display Type</th><td>' +
                    '<select class="lrsd-sf-card-cardtype" data-field="cardType">' +
                        buildDisplayTypeOptions(cardType) +
                    '</select>' +
                '</td></tr>' +
                '<tr><th>Icon</th><td>' +
                    '<div class="lrsd-sf-media-wrap">' +
                        '<input type="text" id="' + iconFieldId + '" class="regular-text lrsd-sf-media-input lrsd-sf-card-icon" value="' + esc(icon) + '" data-field="icon" />' +
                        '<button type="button" class="button lrsd-sf-media-btn" data-target="' + iconFieldId + '">Choose Media</button>' +
                    '</div>' +
                '</td></tr>' +
                '<tr><th>Category Label</th><td>' +
                    '<input type="text" class="regular-text lrsd-sf-card-category" value="' + esc(category) + '" data-field="category" />' +
                '</td></tr>' +
                '<tr><th>Items</th><td>' +
                    '<div class="lrsd-sf-items-list">' + itemsHtml + '</div>' +
                    '<button type="button" class="button lrsd-sf-add-item">+ Add Item</button>' +
                '</td></tr>' +
                '<tr><th>Notes (optional)</th><td>' +
                    '<textarea class="large-text lrsd-sf-card-notes" rows="2" data-field="notes">' + esc(notes) + '</textarea>' +
                '</td></tr>' +
            '</tbody></table>' +
        '</div>';
    }

    function buildItemRowHtml(label, value) {
        return '<div class="lrsd-sf-item-row">' +
            '<input type="text" class="lrsd-sf-item-label" value="' + esc(label) + '" placeholder="Label" />' +
            '<input type="text" class="lrsd-sf-item-value" value="' + esc(value) + '" placeholder="Value" />' +
            '<button type="button" class="button lrsd-sf-remove-item">\u2715</button>' +
        '</div>';
    }

    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function initCustomCards() {
        // Add card
        $('#lrsd-sf-add-card').on('click', function () {
            var id  = uniqueId();
            var html = buildCardHtml(id);
            $('#lrsd-sf-custom-cards').append(html);
            addCardToOrder(id, i18n.untitledCard || '(Untitled Card)');
        });

        // Remove card
        $(document).on('click', '.lrsd-sf-remove-card', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card');
            var cardId = $card.data('card-id');
            $card.remove();
            removeCardFromOrder(cardId);
        });

        // Remove item
        $(document).on('click', '.lrsd-sf-remove-item', function () {
            $(this).closest('.lrsd-sf-item-row').remove();
        });

        // Add item row
        $(document).on('click', '.lrsd-sf-add-item', function () {
            $(this).siblings('.lrsd-sf-items-list').append(buildItemRowHtml('', ''));
        });

        // Update card name in header as user types
        $(document).on('input', '.lrsd-sf-card-title', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card');
            var title = $(this).val() || (i18n.untitledCard || '(Untitled Card)');
            $card.find('.lrsd-sf-card-name').text(title);

            // Update label in card order list
            var cardId = $card.data('card-id');
            $('#lrsd-sf-card-order .lrsd-sf-order-item[data-card-id="' + cardId + '"] .lrsd-sf-order-label').text(title);
        });

        // Make custom cards sortable
        $('#lrsd-sf-custom-cards').sortable({
            handle: '.lrsd-sf-card-drag',
            cursor: 'grab',
            tolerance: 'pointer',
        });
    }

    function addCardToOrder(cardId, label) {
        var $list = $('#lrsd-sf-card-order');
        if (!$list.length) return;

        var existing = $list.find('[data-card-id="' + cardId + '"]');
        if (!existing.length) {
            $list.append(
                '<li class="lrsd-sf-order-item" data-card-id="' + cardId + '">' +
                    '<span class="dashicons dashicons-menu"></span>' +
                    '<span class="lrsd-sf-order-label">' + esc(label) + '</span>' +
                '</li>'
            );
        }
        serializeCardOrder();
    }

    function removeCardFromOrder(cardId) {
        $('#lrsd-sf-card-order .lrsd-sf-order-item[data-card-id="' + cardId + '"]').remove();
        serializeCardOrder();
    }

    // ── Global Card Values (school editor) ────────────────────────────────────

    function serializeGlobalCardValues() {
        if (!$('#lrsd_sf_custom_card_values_json').length) {
            return;
        }
        var values = {};
        $('.lrsd-sf-global-card-data').each(function () {
            var cardId = $(this).data('card-id');
            if (!cardId) return;
            var items = [];
            $(this).find('.lrsd-sf-gcv-item-value').each(function () {
                items.push({
                    label: $(this).data('label') || '',
                    value: $(this).val() || '',
                });
            });
            values[cardId] = {
                items: items,
                notes: $(this).find('.lrsd-sf-gcv-notes').val() || '',
            };
        });
        $('#lrsd_sf_custom_card_values_json').val(JSON.stringify(values));
    }

    // ── Card Editor Page (global card templates) ──────────────────────────────

    function buildLabelRowHtml(label) {
        return '<div class="lrsd-sf-label-row">' +
            '<input type="text" class="regular-text lrsd-sf-label-text" value="' + esc(label) + '" placeholder="' + esc(i18n.labelPlaceholder || 'Label / subcategory name') + '" />' +
            '<button type="button" class="button lrsd-sf-remove-label">\u2715</button>' +
        '</div>';
    }

    function buildGlobalCardHtml(id, title, icon, category, cardType, notes) {
        id       = id       || uniqueId();
        title    = title    || '';
        icon     = icon     || '';
        category = category || '';
        cardType = cardType || 'list';
        notes    = notes    || '';

        var iconFieldId = 'lrsd-gct-icon-' + id;

        return '<div class="lrsd-sf-global-card-template" data-card-id="' + id + '">' +
            '<div class="lrsd-sf-custom-card-header">' +
                '<span class="lrsd-sf-card-drag dashicons dashicons-move" title="Drag to reorder"></span>' +
                '<strong class="lrsd-sf-card-name">' + (title || (i18n.untitledCard || '(Untitled Card)')) + '</strong>' +
                '<span class="lrsd-sf-global-badge">' + esc(i18n.allSchoolsLabel || 'All Schools') + '</span>' +
                '<button type="button" class="button lrsd-sf-remove-global-card" title="Remove template">\u2715</button>' +
            '</div>' +
            '<table class="form-table" role="presentation"><tbody>' +
                '<tr><th>Card Title</th><td>' +
                    '<input type="text" class="regular-text lrsd-sf-gct-title" value="' + esc(title) + '" data-field="title" />' +
                '</td></tr>' +
                '<tr><th>Display Type</th><td>' +
                    '<select class="lrsd-sf-gct-cardtype" data-field="cardType">' +
                        buildDisplayTypeOptions(cardType) +
                    '</select>' +
                '</td></tr>' +
                '<tr><th>Icon</th><td>' +
                    '<div class="lrsd-sf-media-wrap">' +
                        '<input type="text" id="' + iconFieldId + '" class="regular-text lrsd-sf-media-input lrsd-sf-gct-icon" value="' + esc(icon) + '" data-field="icon" />' +
                        '<button type="button" class="button lrsd-sf-media-btn" data-target="' + iconFieldId + '">Choose Media</button>' +
                    '</div>' +
                '</td></tr>' +
                '<tr><th>Category Label</th><td>' +
                    '<input type="text" class="regular-text lrsd-sf-gct-category" value="' + esc(category) + '" data-field="category" />' +
                '</td></tr>' +
                '<tr><th>Subcategory Names</th><td>' +
                    '<p class="description" style="margin-bottom:8px;">These are the row labels. Each school fills in its own values.</p>' +
                    '<div class="lrsd-sf-label-list"></div>' +
                    '<button type="button" class="button lrsd-sf-add-label">' + esc(i18n.addSubcategory || '+ Add Subcategory') + '</button>' +
                '</td></tr>' +
                '<tr><th>Card Notes (optional)</th><td>' +
                    '<textarea class="large-text lrsd-sf-gct-notes" rows="2" data-field="notes">' + esc(notes) + '</textarea>' +
                '</td></tr>' +
            '</tbody></table>' +
        '</div>';
    }

    function initCardEditorPage() {
        if (!$('#lrsd-sf-global-cards').length) {
            return;
        }

        // Add new global card
        $('#lrsd-sf-add-global-card').on('click', function () {
            var id   = uniqueId();
            var html = buildGlobalCardHtml(id);
            $('#lrsd-sf-global-cards').append(html);
        });

        // Remove global card template
        $(document).on('click', '.lrsd-sf-remove-global-card', function () {
            $(this).closest('.lrsd-sf-global-card-template').remove();
        });

        // Update card name in header as user types title
        $(document).on('input', '.lrsd-sf-gct-title', function () {
            var $card = $(this).closest('.lrsd-sf-global-card-template');
            var title = $(this).val() || (i18n.untitledCard || '(Untitled Card)');
            $card.find('.lrsd-sf-card-name').text(title);
        });

        // Add label row
        $(document).on('click', '.lrsd-sf-add-label', function () {
            $(this).siblings('.lrsd-sf-label-list').append(buildLabelRowHtml(''));
        });

        // Remove label row
        $(document).on('click', '.lrsd-sf-remove-label', function () {
            $(this).closest('.lrsd-sf-label-row').remove();
        });

        // Make global cards sortable (reorder)
        $('#lrsd-sf-global-cards').sortable({
            handle: '.lrsd-sf-card-drag',
            cursor: 'grab',
            tolerance: 'pointer',
        });

        // Serialize on submit
        $('#lrsd-sf-card-editor-form').on('submit', function () {
            serializeGlobalCards();
        });
    }

    function serializeGlobalCards() {
        var cards = [];
        $('#lrsd-sf-global-cards .lrsd-sf-global-card-template').each(function () {
            var $card = $(this);
            var id    = $card.data('card-id') || uniqueId();
            var items = [];
            $card.find('.lrsd-sf-label-row .lrsd-sf-label-text').each(function () {
                var label = $(this).val() || '';
                if (label) {
                    items.push({ label: label });
                }
            });
            cards.push({
                id:       id,
                title:    $card.find('.lrsd-sf-gct-title').val() || '',
                icon:     $card.find('.lrsd-sf-gct-icon').val() || '',
                category: $card.find('.lrsd-sf-gct-category').val() || '',
                cardType: $card.find('.lrsd-sf-gct-cardtype').val() || 'list',
                items:    items,
                notes:    $card.find('.lrsd-sf-gct-notes').val() || '',
            });
        });
        $('#lrsd_sf_global_cards_json').val(JSON.stringify(cards));
    }

    // ── Pre-submit Serialization ───────────────────────────────────────────────

    function initPreSubmit() {
        $('form#post').on('submit', function () {
            serializeCustomCards();
            serializeCardOrder();
            serializeGlobalCardValues();
        });
    }

    function serializeCustomCards() {
        var cards = [];
        $('#lrsd-sf-custom-cards .lrsd-sf-custom-card').each(function () {
            var $card = $(this);
            var id    = $card.data('card-id') || uniqueId();
            var items = [];
            $card.find('.lrsd-sf-item-row').each(function () {
                var label = $(this).find('.lrsd-sf-item-label').val() || '';
                var value = $(this).find('.lrsd-sf-item-value').val() || '';
                if (label || value) {
                    items.push({ label: label, value: value });
                }
            });
            cards.push({
                id:       id,
                title:    $card.find('.lrsd-sf-card-title').val() || '',
                icon:     $card.find('.lrsd-sf-card-icon').val() || '',
                category: $card.find('.lrsd-sf-card-category').val() || '',
                cardType: $card.find('.lrsd-sf-card-cardtype').val() || 'list',
                notes:    $card.find('.lrsd-sf-card-notes').val() || '',
                items:    items,
            });
        });
        $('#lrsd_sf_custom_cards_json').val(JSON.stringify(cards));
    }

    // ── Bulk Update Confirmation ───────────────────────────────────────────────

    function initBulkUpdate() {
        $('#lrsd-sf-bulk-save').on('click', function (e) {
            if (!confirm(i18n.confirmBulk || 'Save changes to all schools in this category?')) {
                e.preventDefault();
            }
        });
    }

    // ── Advanced JSON Editor ───────────────────────────────────────────────────

    function initAdvancedEditor() {
        var $editor    = $('#lrsd-sf-adv-json');
        var $saveBtn   = $('#lrsd-sf-adv-save');
        var $spinner   = $('#lrsd-sf-adv-spinner');
        var $status    = $('#lrsd-sf-adv-status');
        var $copyBtn   = $('#lrsd-sf-adv-copy');
        var $fmtBtn    = $('#lrsd-sf-adv-format');
        var $restoreNote = $('#lrsd-sf-adv-restore-note');

        if (!$editor.length) {
            return;
        }

        var adv = (typeof lrsdSfAdv !== 'undefined') ? lrsdSfAdv : {};
        var advI18n = adv.i18n || {};

        function showStatus(msg, type) {
            $status
                .text(msg)
                .attr('class', 'lrsd-sf-adv-status lrsd-sf-adv-status--' + (type || 'info'))
                .show();
        }

        function clearStatus() {
            $status.hide().text('');
        }

        // ── Validate JSON silently, return parsed object or null
        function parseJson(text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                return null;
            }
        }

        // ── Format / Prettify
        $fmtBtn.on('click', function () {
            var parsed = parseJson($editor.val());
            if (!parsed) {
                showStatus(advI18n.errorJson || 'Invalid JSON – please fix errors before saving.', 'error');
                return;
            }
            $editor.val(JSON.stringify(parsed, null, 2));
            showStatus(advI18n.formatted || 'JSON formatted.', 'success');
        });

        // ── Copy to clipboard
        $copyBtn.on('click', function () {
            var text = $editor.val();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    showStatus(advI18n.copied || 'Copied to clipboard.', 'success');
                });
            } else {
                $editor.select();
                document.execCommand('copy');
                showStatus(advI18n.copied || 'Copied to clipboard.', 'success');
            }
        });

        // ── Save & Publish
        $saveBtn.on('click', function () {
            clearStatus();
            var parsed = parseJson($editor.val());
            if (!parsed) {
                showStatus(advI18n.errorJson || 'Invalid JSON – please fix errors before saving.', 'error');
                return;
            }

            $saveBtn.prop('disabled', true);
            $spinner.addClass('is-active');
            showStatus(advI18n.saving || 'Saving…', 'info');

            $.post(
                adv.ajaxUrl || (typeof lrsdSfAdmin !== 'undefined' ? lrsdSfAdmin.ajaxUrl : ''),
                {
                    action: 'lrsd_sf_adv_save',
                    nonce:  adv.saveNonce || '',
                    json:   JSON.stringify(parsed),
                },
                function (resp) {
                    $saveBtn.prop('disabled', false);
                    $spinner.removeClass('is-active');
                    if (resp && resp.success) {
                        showStatus(resp.data.message || (advI18n.saved || 'Saved & published successfully.'), 'success');
                        // Refresh history table
                        if (resp.data.history && resp.data.history.length) {
                            refreshHistoryTable(resp.data.history);
                        }
                    } else {
                        var errMsg = (resp && resp.data && resp.data.message)
                            ? resp.data.message
                            : (advI18n.errorGeneric || 'An error occurred. Please try again.');
                        showStatus(errMsg, 'error');
                    }
                }
            ).fail(function () {
                $saveBtn.prop('disabled', false);
                $spinner.removeClass('is-active');
                showStatus(advI18n.errorGeneric || 'An error occurred. Please try again.', 'error');
            });
        });

        // ── Restore version (load into editor)
        $(document).on('click', '.lrsd-sf-adv-restore-btn', function () {
            var idx = $(this).data('version');
            if (!confirm(advI18n.confirmRestore || 'Load this version into the editor? Unsaved changes will be lost.')) {
                return;
            }

            // Try in-memory history first
            var history = adv.history || [];
            if (history[idx] && history[idx].json) {
                var parsed2 = parseJson(history[idx].json);
                var pretty  = parsed2 ? JSON.stringify(parsed2, null, 2) : history[idx].json;
                $editor.val(pretty);
                $restoreNote.show();
                showStatus(advI18n.restoreLoaded || 'Version loaded. Review and save to apply.', 'success');
                $('html, body').animate({ scrollTop: $editor.offset().top - 60 }, 300);
                return;
            }

            // Fallback: fetch via AJAX
            $.post(
                adv.ajaxUrl || (typeof lrsdSfAdmin !== 'undefined' ? lrsdSfAdmin.ajaxUrl : ''),
                {
                    action:  'lrsd_sf_adv_get_version',
                    nonce:   adv.restoreNonce || '',
                    version: idx,
                },
                function (resp) {
                    if (resp && resp.success && resp.data.json) {
                        $editor.val(resp.data.json);
                        $restoreNote.show();
                        showStatus(advI18n.restoreLoaded || 'Version loaded. Review and save to apply.', 'success');
                        $('html, body').animate({ scrollTop: $editor.offset().top - 60 }, 300);
                    } else {
                        showStatus(advI18n.errorGeneric || 'An error occurred. Please try again.', 'error');
                    }
                }
            ).fail(function () {
                showStatus(advI18n.errorGeneric || 'An error occurred. Please try again.', 'error');
            });
        });

        // ── Refresh history table rows after a save
        function refreshHistoryTable(history) {
            var $tbody = $('#lrsd-sf-adv-history-rows');
            if (!$tbody.length) {
                return;
            }

            // Update in-memory copy so future restores work without page reload
            if (adv) {
                // Shift: the previous first entry (now at index 1) already has json
                // The new entry at index 0 doesn't have json in display data, so
                // we need to keep the previous history items shifted
                var oldHistory = adv.history ? adv.history.slice() : [];
                var newEntry = history[0];
                // newEntry from server has no json (display only); keep old json entries
                adv.history = history.map(function (h, i) {
                    return {
                        timestamp:   h.timestamp,
                        label:       h.label,
                        schoolCount: h.schoolCount,
                        json:        (oldHistory[i - 1] && i > 0) ? oldHistory[i - 1].json : (oldHistory[i] ? oldHistory[i].json : ''),
                    };
                });
            }

            var rows = '';
            history.forEach(function (ver, idx) {
                var date = ver.timestamp
                    ? new Date(ver.timestamp * 1000).toISOString().replace('T', ' ').slice(0, 16)
                    : '—';
                rows += '<tr>' +
                    '<td class="lrsd-sf-adv-ver-num">' + (idx + 1) + '</td>' +
                    '<td class="lrsd-sf-adv-ver-date">' + escHtml(date) + '</td>' +
                    '<td class="lrsd-sf-adv-ver-label">' + escHtml(ver.label || '') + '</td>' +
                    '<td class="lrsd-sf-adv-ver-count">' + (ver.schoolCount || 0) + '</td>' +
                    '<td><button type="button" class="button lrsd-sf-adv-restore-btn" data-version="' + idx + '">' +
                    'Restore</button></td>' +
                    '</tr>';
            });
            $tbody.html(rows);
            // Show the table card (in case it was hidden by "no history" message)
            $('.lrsd-sf-adv-no-history').hide();
            $tbody.closest('table').show();
        }

        function escHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    $(function () {
        initSections();
        initMediaPicker();
        initCustomDropdownOptions();
        initCardOrderSortable();
        initCustomCards();
        initPreSubmit();
        initBulkUpdate();
        initCardEditorPage();
        initAdvancedEditor();
    });

})(jQuery);
