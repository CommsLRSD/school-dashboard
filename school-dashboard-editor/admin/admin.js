/* global wp, lrsdSfAdmin */
(function ($) {
    'use strict';

    var i18n = (typeof lrsdSfAdmin !== 'undefined') ? (lrsdSfAdmin.i18n || {}) : {};

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

    var mediaFrames = {};

    function initMediaPicker() {
        $(document).on('click', '.lrsd-sf-media-btn', function (e) {
            e.preventDefault();

            if (typeof wp === 'undefined' || !wp.media) {
                // WP media library not available (e.g. bulk update page)
                return;
            }

            var targetId = $(this).data('target');
            var mediaLibraryType = $(this).data('media-library-type') || '';
            var frameKey = mediaLibraryType || '__default';
            var frame = mediaFrames[frameKey];

            if (!frame) {
                var mediaFrameArgs = {
                    title: i18n.chooseMedia || 'Choose or Upload Media',
                    button: { text: i18n.useMedia || 'Use this file' },
                    multiple: false,
                };
                if (mediaLibraryType) {
                    mediaFrameArgs.library = { type: mediaLibraryType };
                }
                frame = wp.media(mediaFrameArgs);
                frame.on('select', function () {
                    var attachment = frame.state().get('selection').first().toJSON();
                    var $target = frame.lrsdSfTarget;
                    if ($target && $target.length) {
                        $target.val(attachment.url);
                        $target.siblings('.description').text(attachment.url);
                    }
                });
                mediaFrames[frameKey] = frame;
            }

            frame.lrsdSfTarget = $('#' + targetId);
            frame.open();
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
                        // Add a delete chip to every select-wrap that shares this option key
                        // (only if this chip doesn't already exist for this value)
                        $('select[data-option-key="' + optKey + '"]').each(function () {
                            var $wrap = $(this).closest('.lrsd-sf-select-wrap');
                            var $list = $wrap.find('.lrsd-sf-custom-opts-list');
                            var chipExists = false;
                            $list.find('.lrsd-sf-delete-option-btn').each(function () {
                                if ($(this).data('option-val') === addedVal) { chipExists = true; }
                            });
                            if (!chipExists) {
                                if (!$list.length) {
                                    $list = $('<div class="lrsd-sf-custom-opts-list"></div>');
                                    $wrap.append($list);
                                }
                                var $deleteBtn = $('<button type="button" class="lrsd-sf-delete-option-btn" title="Remove this custom option">&times;</button>')
                                    .attr('data-option-key', optKey)
                                    .attr('data-option-val', addedVal);
                                var $chip = $('<span class="lrsd-sf-custom-opt-chip"></span>')
                                    .append($('<span>').text(addedVal))
                                    .append($deleteBtn);
                                $list.append($chip);
                            }
                        });
                    } else {
                        alert(i18n.error || 'An error occurred. Please try again.');
                    }
                }
            ).fail(function () {
                alert(i18n.error || 'An error occurred. Please try again.');
            });
        });
    }

    // ── Delete Custom Dropdown Options ────────────────────────────────────────

    function initDeleteCustomOption() {
        $(document).on('click', '.lrsd-sf-delete-option-btn', function (e) {
            e.preventDefault();
            var $btn   = $(this);
            var optKey = $btn.data('option-key');
            var optVal = $btn.data('option-val');
            var nonce  = lrsdSfAdmin ? lrsdSfAdmin.deleteOptionNonce : '';

            if (!confirm(i18n.confirmDeleteOption || 'Remove this custom option from all dropdowns? This cannot be undone.')) {
                return;
            }

            $.post(
                lrsdSfAdmin.ajaxUrl,
                {
                    action:     'lrsd_sf_delete_custom_option',
                    nonce:      nonce,
                    option_key: optKey,
                    option_val: optVal,
                },
                function (response) {
                    if (response.success) {
                        // Remove option from every matching select on the page
                        $('select[data-option-key="' + optKey + '"]').each(function () {
                            var $sel = $(this);
                            if ($sel.val() === optVal) {
                                $sel.val('');
                            }
                            $sel.find('option[value="' + optVal + '"]').remove();
                        });
                        // Remove all matching chips on the page
                        $('.lrsd-sf-delete-option-btn[data-option-key="' + optKey + '"][data-option-val="' + optVal + '"]')
                            .closest('.lrsd-sf-custom-opt-chip').remove();
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

    // ── Bulk Update Confirmation ───────────────────────────────────────────────

    function initBulkUpdate() {
        $('.lrsd-sf-bulk-save-action').on('click', function (e) {
            if (!confirm(i18n.confirmBulk || 'Save changes to all schools in this category?')) {
                e.preventDefault();
            }
        });
    }

    function initKeyValueRows() {
        $(document).on('click', '.lrsd-sf-add-kv-row', function () {
            var $btn = $(this);
            var labelName = $btn.data('label-name') || '';
            var valueName = $btn.data('value-name') || '';
            var rawValueType = $btn.data('value-type');
            var valueType = rawValueType === 'number' ? 'number' : 'text';
            if (!labelName || !valueName) {
                return;
            }

            var labelAria = i18n.kvLabel || 'Label';
            if (labelName.toLowerCase().indexOf('year') !== -1) {
                labelAria = i18n.kvYear || 'Year';
            }
            var valueAria = valueType === 'number' ? (i18n.kvValue || 'Value') : ((i18n.kvTextValue || i18n.kvValue) || 'Text value');
            var removeAria = i18n.removeRow || 'Remove row';

            var rowHtml =
                '<tr class="lrsd-sf-kv-row">' +
                    '<td><input type="text" class="regular-text" name="' + labelName + '" aria-label="' + labelAria + '" value="" /></td>' +
                    '<td><input type="' + valueType + '" class="' + (valueType === 'number' ? 'small-text' : 'regular-text') + '" name="' + valueName + '" aria-label="' + valueAria + '" value="" /></td>' +
                    '<td><button type="button" class="button lrsd-sf-remove-kv-row" aria-label="' + removeAria + '">&#x2715;</button></td>' +
                '</tr>';

            $btn.siblings('.lrsd-sf-kv-table').find('.lrsd-sf-kv-rows').append(rowHtml);
        });

        $(document).on('click', '.lrsd-sf-remove-kv-row', function () {
            $(this).closest('.lrsd-sf-kv-row').remove();
        });
    }

    // ── Advanced JSON Editor ───────────────────────────────────────────────────

    function initAdvancedEditor() {
        var $editor    = $('#lrsd-sf-adv-json');
        var $saveBtn   = $('.lrsd-sf-adv-save-action');
        var $spinner   = $('.lrsd-sf-adv-spinner');
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

    // ── Pre-submit Serialization ───────────────────────────────────────────────

    function initPreSubmit() {
        $('form#post').on('submit', function () {
            serializeCardOrder();
        });
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    $(function () {
        initSections();
        initMediaPicker();
        initCustomDropdownOptions();
        initDeleteCustomOption();
        initCardOrderSortable();
        initPreSubmit();
        initBulkUpdate();
        initKeyValueRows();
        initAdvancedEditor();
    });

})(jQuery);
