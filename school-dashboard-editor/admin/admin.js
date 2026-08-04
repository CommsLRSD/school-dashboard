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
                mediaFrames[frameKey] = frame;
            }

            if (frame.lrsdSfSelectHandler) {
                frame.off('select', frame.lrsdSfSelectHandler);
            }
            var $target = $('#' + targetId);
            frame.lrsdSfSelectHandler = function () {
                var attachment = frame.state().get('selection').first().toJSON();
                if ($target && $target.length) {
                    $target.val(attachment.url);
                    $target.siblings('.description').text(attachment.url);
                }
            };
            frame.on('select', frame.lrsdSfSelectHandler);
            frame.open();
        });
    }

    // ── Custom Dropdown Options ────────────────────────────────────────────────

    function initCustomDropdownOptions() {
        var modalHtml = '' +
            '<div id="lrsd-sf-custom-option-modal" class="lrsd-sf-custom-option-modal" hidden>' +
                '<div class="lrsd-sf-custom-option-dialog" role="dialog" aria-modal="true" aria-labelledby="lrsd-sf-custom-option-title">' +
                    '<div class="lrsd-sf-custom-option-header">' +
                        '<div>' +
                            '<h2 id="lrsd-sf-custom-option-title"></h2>' +
                            '<p id="lrsd-sf-custom-option-intro"></p>' +
                        '</div>' +
                        '<button type="button" class="lrsd-sf-custom-option-close" aria-label="' + (i18n.closeDialog || 'Close dialog') + '">&times;</button>' +
                    '</div>' +
                    '<form class="lrsd-sf-custom-option-form">' +
                        '<div>' +
                            '<label for="lrsd-sf-custom-option-input"></label>' +
                            '<input type="text" id="lrsd-sf-custom-option-input" class="regular-text" />' +
                        '</div>' +
                        '<div class="lrsd-sf-custom-option-map-wrap" hidden>' +
                            '<label for="lrsd-sf-custom-option-map"></label>' +
                            '<input type="text" id="lrsd-sf-custom-option-map" class="regular-text" />' +
                        '</div>' +
                        '<div class="lrsd-sf-custom-option-actions">' +
                            '<button type="submit" class="button button-primary lrsd-sf-custom-option-save"></button>' +
                            '<button type="button" class="button button-secondary lrsd-sf-custom-option-cancel" hidden></button>' +
                        '</div>' +
                    '</form>' +
                    '<div class="lrsd-sf-custom-option-list"></div>' +
                '</div>' +
            '</div>';
        var $modal = $('#lrsd-sf-custom-option-modal');
        if (!$modal.length) {
            $('body').append(modalHtml);
            $modal = $('#lrsd-sf-custom-option-modal');
        }
        var state = {
            optionKey: '',
            targetSelectId: '',
            editingValue: '',
            customOptions: [],
            maps: {}
        };
        var $title = $('#lrsd-sf-custom-option-title');
        var $intro = $('#lrsd-sf-custom-option-intro');
        var $form = $modal.find('.lrsd-sf-custom-option-form');
        var $inputLabel = $form.find('label[for="lrsd-sf-custom-option-input"]');
        var $input = $('#lrsd-sf-custom-option-input');
        var $mapWrap = $form.find('.lrsd-sf-custom-option-map-wrap');
        var $mapLabel = $form.find('label[for="lrsd-sf-custom-option-map"]');
        var $mapInput = $('#lrsd-sf-custom-option-map');
        var $saveBtn = $form.find('.lrsd-sf-custom-option-save');
        var $cancelBtn = $form.find('.lrsd-sf-custom-option-cancel');
        var $list = $modal.find('.lrsd-sf-custom-option-list');

        function escapeAttr(value) {
            return $('<div>').text(value || '').html();
        }

        function optionExists($sel, val) {
            var found = false;
            $sel.find('option').each(function () {
                if ($(this).val() === val) { found = true; }
            });
            return found;
        }

        function syncOptionsAcrossSelects(optKey, oldVal, newVal, removeOld) {
            $('select[data-option-key="' + optKey + '"]').each(function () {
                var $sel = $(this);
                if (removeOld && oldVal) {
                    if ($sel.val() === oldVal) {
                        $sel.val('');
                    }
                    $sel.find('option').filter(function () { return $(this).val() === oldVal; }).remove();
                }
                if (newVal && !optionExists($sel, newVal)) {
                    $sel.append($('<option>').val(newVal).text(newVal));
                }
                if (oldVal && newVal && $sel.val() === oldVal) {
                    $sel.val(newVal);
                }
            });
        }

        function renderList() {
            $list.empty();
            if (!state.customOptions.length) {
                $list.append($('<p class="lrsd-sf-custom-option-empty"></p>').text(i18n.noCustomOptions || 'No custom options yet.'));
                return;
            }
            state.customOptions.forEach(function (optionVal) {
                var mapText = state.optionKey === (lrsdSfAdmin ? lrsdSfAdmin.isFosKey : 'familyOfSchools') ? (state.maps[optionVal] || '') : '';
                var html = '' +
                    '<div class="lrsd-sf-custom-option-item">' +
                        '<div>' +
                            '<strong>' + escapeAttr(optionVal) + '</strong>' +
                            (mapText ? '<span class="lrsd-sf-custom-option-item-meta">' + escapeAttr(mapText) + '</span>' : '') +
                        '</div>' +
                        '<div class="lrsd-sf-custom-option-item-actions">' +
                            '<button type="button" class="button button-secondary lrsd-sf-edit-option-btn" data-option-val="' + escapeAttr(optionVal) + '">' + (i18n.editOption || 'Edit option') + '</button>' +
                            '<button type="button" class="button lrsd-sf-btn-danger lrsd-sf-delete-option-btn" data-option-val="' + escapeAttr(optionVal) + '">' + (i18n.deleteOption || 'Delete') + '</button>' +
                        '</div>' +
                    '</div>';
                $list.append(html);
            });
        }

        function resetForm() {
            state.editingValue = '';
            $input.val('');
            $mapInput.val('');
            $inputLabel.text(i18n.newOption || 'New option');
            $saveBtn.text(i18n.addOption || 'Add Option');
            $cancelBtn.prop('hidden', true);
        }

        function openModal($btn) {
            state.optionKey = $btn.data('option-key');
            state.targetSelectId = $btn.data('target-select');
            state.customOptions = ($btn.data('custom-options') || []).slice();
            state.maps = $.extend({}, $btn.data('custom-maps') || {});
            $title.text(i18n.customOptionsTitle || 'Manage Custom Options');
            $intro.text(i18n.customOptionsIntro || 'Add, edit, or delete custom dropdown options for this field.');
            $inputLabel.text(i18n.newOption || 'New option');
            $mapLabel.text(i18n.fosMapLabel || 'Catchment map path');
            $mapInput.attr('placeholder', i18n.fosMapPlaceholder || 'public/maps/my-fos-map.svg');
            $mapWrap.prop('hidden', state.optionKey !== (lrsdSfAdmin ? lrsdSfAdmin.isFosKey : 'familyOfSchools'));
            resetForm();
            renderList();
            $modal.prop('hidden', false);
            $input.trigger('focus');
        }

        function closeModal() {
            $modal.prop('hidden', true);
            resetForm();
        }

        $(document).on('click', '.lrsd-sf-add-option-btn', function (e) {
            e.preventDefault();
            openModal($(this));
        });

        $form.on('submit', function (e) {
            e.preventDefault();
            var value = ($input.val() || '').trim();
            var mapPath = ($mapInput.val() || '').trim();
            var nonce = lrsdSfAdmin ? lrsdSfAdmin.customOptionNonce : '';
            var $targetSelect = $('#' + state.targetSelectId);
            if (!value) {
                alert(i18n.customOptionRequired || 'Enter an option value before saving.');
                return;
            }
            $.post(
                lrsdSfAdmin.ajaxUrl,
                {
                    action: state.editingValue ? 'lrsd_sf_update_custom_option' : 'lrsd_sf_add_custom_option',
                    nonce: nonce,
                    option_key: state.optionKey,
                    option_val: value,
                    old_option_val: state.editingValue,
                    new_option_val: value,
                    map_path: mapPath
                },
                function (response) {
                    if (response.success) {
                        var oldVal = response.data.old_option_val || '';
                        var addedVal = response.data.option_val;
                        if (state.editingValue) {
                            state.customOptions = state.customOptions.map(function (item) {
                                return item === oldVal ? addedVal : item;
                            });
                            if (state.optionKey === (lrsdSfAdmin ? lrsdSfAdmin.isFosKey : 'familyOfSchools')) {
                                if (oldVal && oldVal !== addedVal) {
                                    delete state.maps[oldVal];
                                }
                                if (mapPath) {
                                    state.maps[addedVal] = mapPath;
                                } else {
                                    delete state.maps[addedVal];
                                }
                            }
                            syncOptionsAcrossSelects(state.optionKey, oldVal, addedVal, true);
                        } else {
                            state.customOptions.push(addedVal);
                            state.customOptions = state.customOptions.filter(function (item, index, arr) {
                                return arr.indexOf(item) === index;
                            });
                            if (state.optionKey === (lrsdSfAdmin ? lrsdSfAdmin.isFosKey : 'familyOfSchools') && mapPath) {
                                state.maps[addedVal] = mapPath;
                            }
                            syncOptionsAcrossSelects(state.optionKey, '', addedVal, false);
                        }
                        $targetSelect.val(addedVal);
                        renderList();
                        resetForm();
                    } else {
                        alert((response.data && response.data.message) || i18n.error || 'An error occurred. Please try again.');
                    }
                }
            ).fail(function () {
                alert(i18n.error || 'An error occurred. Please try again.');
            });
        });

        $cancelBtn.on('click', function () {
            resetForm();
        });

        $(document).on('click', '.lrsd-sf-edit-option-btn', function () {
            var optionVal = $(this).data('option-val');
            state.editingValue = optionVal;
            $inputLabel.text(i18n.editOption || 'Edit option');
            $input.val(optionVal);
            $mapInput.val(state.maps[optionVal] || '');
            $saveBtn.text(i18n.saveOption || 'Save Changes');
            $cancelBtn.text(i18n.cancelEdit || 'Cancel').prop('hidden', false);
            $input.trigger('focus');
        });

        $(document).on('click', '.lrsd-sf-delete-option-btn', function () {
            var optionVal = $(this).data('option-val');
            var nonce = lrsdSfAdmin ? lrsdSfAdmin.deleteOptionNonce : '';
            if (!window.confirm((i18n.confirmDeleteTitle || 'Delete Custom Option') + '\n\n' + (i18n.confirmDeleteBody || 'Are you sure you want to delete this custom option?'))) {
                return;
            }
            $.post(
                lrsdSfAdmin.ajaxUrl,
                {
                    action: 'lrsd_sf_delete_custom_option',
                    nonce: nonce,
                    option_key: state.optionKey,
                    option_val: optionVal
                },
                function (response) {
                    if (response.success) {
                        state.customOptions = state.customOptions.filter(function (item) { return item !== optionVal; });
                        delete state.maps[optionVal];
                        syncOptionsAcrossSelects(state.optionKey, optionVal, '', true);
                        renderList();
                        if (state.editingValue === optionVal) {
                            resetForm();
                        }
                    } else {
                        alert((response.data && response.data.message) || i18n.error || 'An error occurred. Please try again.');
                    }
                }
            ).fail(function () {
                alert(i18n.error || 'An error occurred. Please try again.');
            });
        });

        $modal.on('click', function (e) {
            if (e.target === $modal[0]) {
                closeModal();
            }
        });
        $modal.find('.lrsd-sf-custom-option-close').on('click', closeModal);
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && !$modal.prop('hidden')) {
                closeModal();
            }
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
        initCardOrderSortable();
        initPreSubmit();
        initBulkUpdate();
        initKeyValueRows();
        initAdvancedEditor();
    });

})(jQuery);
