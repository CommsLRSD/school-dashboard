/* global wp, lrsdSfAdmin */
(function ($) {
    'use strict';

    var i18n = (typeof lrsdSfAdmin !== 'undefined') ? (lrsdSfAdmin.i18n || {}) : {};

    // ── Helpers ────────────────────────────────────────────────────────────────

    function uniqueId() {
        return 'custom_' + Math.random().toString(36).substr(2, 8);
    }

    /**
     * Clear any inline `height` styles jQuery UI sortable may have set on card
     * elements, then refresh the sortable so newly added/removed cards are
     * included correctly.
     *
     * @param {jQuery} $container - The sortable container (e.g. #lrsd-sf-custom-cards)
     * @param {string} childSelector - Selector for sortable children to reset
     */
    function clearSortableHeights($container, childSelector) {
        $container.find(childSelector).css('height', '');
        if ($container.data('ui-sortable')) {
            $container.sortable('refresh');
        }
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

    var displayTypes = (lrsdSfAdmin && lrsdSfAdmin.displayTypes) ? lrsdSfAdmin.displayTypes : {};
    var noteModes = (lrsdSfAdmin && lrsdSfAdmin.noteModes) ? lrsdSfAdmin.noteModes : { inline: 'Show note below the card', flip: 'Show note on the back of the card' };
    var valueTypes = (lrsdSfAdmin && lrsdSfAdmin.valueTypes) ? lrsdSfAdmin.valueTypes : { text: 'Plain text', number: 'Number', select: 'Custom dropdown' };
    var imageSizes = (lrsdSfAdmin && lrsdSfAdmin.imageSizes) ? lrsdSfAdmin.imageSizes : { standard: 'Standard', wide: 'Wider' };

    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function parseMaybeJson(raw, fallback) {
        if (!raw) {
            return fallback;
        }
        try {
            return JSON.parse(raw);
        } catch (err) {
            return fallback;
        }
    }

    function normalizeCardType(cardType) {
        var aliases = {
            list: 'details_list',
            two_column: 'details_list',
            single_list: 'simple_list',
            one_column: 'simple_list',
            number: 'highlight',
        };
        cardType = String(cardType || 'details_list');
        if (aliases[cardType]) {
            cardType = aliases[cardType];
        }
        return displayTypes[cardType] ? cardType : 'details_list';
    }

    function normalizeItem(item) {
        item = item || {};
        var options = item.options;
        if (!Array.isArray(options)) {
            if (typeof options === 'string' && options.trim()) {
                options = options.split(/\r?\n/).map(function (opt) { return opt.trim(); }).filter(Boolean);
            } else {
                options = [];
            }
        }
        return {
            label: item.label || '',
            value: item.value || '',
            valueType: valueTypes[item.valueType] ? item.valueType : 'text',
            options: options,
        };
    }

    function normalizeCard(card) {
        card = card || {};
        var normalized = {
            id: card.id || uniqueId(),
            title: card.title || '',
            icon: card.icon || '',
            category: card.category || '',
            cardType: normalizeCardType(card.cardType || card.displayType),
            notes: card.notes || '',
            noteMode: noteModes[card.noteMode] ? card.noteMode : 'inline',
            noteTitle: card.noteTitle || '',
            imageUrl: card.imageUrl || '',
            imageSize: imageSizes[card.imageSize] ? card.imageSize : 'standard',
            imageOverlayText: card.imageOverlayText || '',
            imageLink: card.imageLink || '',
            items: Array.isArray(card.items) ? card.items.map(normalizeItem) : [],
        };

        if (normalized.cardType === 'highlight' && normalized.items.length === 0) {
            normalized.items.push(normalizeItem({ label: '', value: '' }));
        }

        return normalized;
    }

    var cardTemplates = [
        {
            id: 'tpl_large_number',
            label: 'Large Number',
            usedBy: 'Best for enrolment- or capacity-style highlights',
            cardType: 'highlight',
            items: [{ label: 'Current Enrolment', value: '450' }],
        },
        {
            id: 'tpl_simple_list',
            label: 'Simple List',
            usedBy: 'Best for playground-style one-column lists',
            cardType: 'simple_list',
            items: [{ label: 'Play structure' }, { label: 'Basketball court' }, { label: 'Garden space' }],
        },
        {
            id: 'tpl_accessibility',
            label: 'Accessibility List',
            usedBy: 'Two-column list with optional dropdown values',
            cardType: 'details_list',
            items: [
                { label: 'Elevator', value: 'YES', valueType: 'select', options: ['YES', 'NO', 'Required'] },
                { label: 'Accessible entrance', value: 'Main office', valueType: 'text' },
            ],
        },
        {
            id: 'tpl_building_systems',
            label: 'Building Systems List',
            usedBy: 'Two-column list for text or number values',
            cardType: 'details_list',
            items: [
                { label: 'Heating', value: 'Boiler', valueType: 'text' },
                { label: 'Parking spots', value: '42', valueType: 'number' },
            ],
        },
        {
            id: 'tpl_highlights_grid',
            label: 'Highlights Grid',
            usedBy: 'Several bold values in a single card',
            cardType: 'stat',
            items: [{ label: 'Classrooms', value: '24' }, { label: 'Portables', value: '2' }, { label: 'Gyms', value: '1' }],
        },
        {
            id: 'tpl_image',
            label: 'Image Card',
            usedBy: 'Catchment-map-style image with optional overlay and link',
            cardType: 'image',
            imageOverlayText: 'Catchment Map',
            imageSize: 'standard',
            items: [],
        },
    ];

    function buildSelectOptions(optionsMap, selected) {
        var html = '';
        $.each(optionsMap, function (key, label) {
            html += '<option value="' + esc(key) + '"' + (String(key) === String(selected) ? ' selected' : '') + '>' + esc(label) + '</option>';
        });
        return html;
    }

    function buildValueInputControl(item, context) {
        var value = item.value || '';
        var placeholder = context === 'global' ? (i18n.placeholderValue || 'Placeholder value') : (i18n.schoolValue || 'Value');
        if (item.valueType === 'select' && item.options.length) {
            var optionsHtml = '<option value=""></option>';
            item.options.forEach(function (opt) {
                optionsHtml += '<option value="' + esc(opt) + '"' + (opt === value ? ' selected' : '') + '>' + esc(opt) + '</option>';
            });
            return '<select class="lrsd-sf-item-value">' + optionsHtml + '</select>';
        }
        var inputType = item.valueType === 'number' ? 'number' : 'text';
        return '<input type="' + inputType + '" class="lrsd-sf-item-value" value="' + esc(value) + '" placeholder="' + esc(placeholder) + '" />';
    }

    function buildItemRowHtml(item, context, cardType) {
        item = normalizeItem(item);
        if (cardType === 'simple_list') {
            return '<div class="lrsd-sf-item-row" data-value-type="text">' +
                '<input type="text" class="regular-text lrsd-sf-item-label lrsd-sf-item-label--wide" value="' + esc(item.label || item.value) + '" placeholder="List item" />' +
                '<button type="button" class="button lrsd-sf-remove-item">\u2715</button>' +
            '</div>';
        }

        var typeControls = '';
        if (cardType === 'details_list') {
            typeControls =
                '<div class="lrsd-sf-item-settings">' +
                    '<select class="lrsd-sf-item-valuetype">' + buildSelectOptions(valueTypes, item.valueType) + '</select>' +
                    '<textarea class="lrsd-sf-item-options" rows="2" placeholder="' + esc(i18n.dropdownOptions || 'Dropdown options (one per line)') + '"' + (item.valueType === 'select' ? '' : ' style="display:none;"') + '>' + esc(item.options.join('\n')) + '</textarea>' +
                '</div>';
        }

        return '<div class="lrsd-sf-item-row" data-value-type="' + esc(item.valueType) + '">' +
            '<input type="text" class="lrsd-sf-item-label" value="' + esc(item.label) + '" placeholder="' + (cardType === 'highlight' ? 'Value label' : 'Label') + '" />' +
            buildValueInputControl(item, context) +
            typeControls +
            '<button type="button" class="button lrsd-sf-remove-item">\u2715</button>' +
        '</div>';
    }

    function buildItemsEditorHtml(card, context) {
        var items = Array.isArray(card.items) ? card.items : [];
        if (!items.length && card.cardType !== 'image') {
            items = [normalizeItem({})];
        }
        var rowsHtml = items.map(function (item) {
            return buildItemRowHtml(item, context, card.cardType);
        }).join('');
        var addLabel = card.cardType === 'highlight' ? '+ Set Value' : '+ Add Row';
        var hideAdd = card.cardType === 'highlight' && items.length >= 1;
        return '<div class="lrsd-sf-items-list">' + rowsHtml + '</div>' +
            '<button type="button" class="button lrsd-sf-add-item"' + (hideAdd ? ' style="display:none;"' : '') + '>' + addLabel + '</button>';
    }

    function buildPreviewThumbHtml(card) {
        card = normalizeCard(card);
        if (card.cardType === 'image') {
            return '<div class="lrsd-sf-tpl-thumb lrsd-sf-tpl-thumb--image"><span>' + esc(card.imageOverlayText || card.title || 'Image') + '</span></div>';
        }
        if (card.cardType === 'highlight') {
            var firstItem = card.items[0] || {};
            return '<div class="lrsd-sf-tpl-thumb lrsd-sf-tpl-thumb--highlight"><strong>' + esc(firstItem.value || '450') + '</strong><span>' + esc(firstItem.label || 'Value') + '</span></div>';
        }
        if (card.cardType === 'stat') {
            return '<div class="lrsd-sf-tpl-thumb lrsd-sf-tpl-thumb--stat"><span>24</span><span>2</span><span>1</span></div>';
        }
        if (card.cardType === 'simple_list') {
            return '<div class="lrsd-sf-tpl-thumb lrsd-sf-tpl-thumb--list"><span></span><span></span><span></span></div>';
        }
        return '<div class="lrsd-sf-tpl-thumb lrsd-sf-tpl-thumb--details"><span></span><span></span></div>';
    }

    function buildTemplatePickerHtml(context) {
        var rows = cardTemplates.map(function (tpl) {
            var normalized = normalizeCard(tpl);
            var typeBadge = '<span class="lrsd-sf-tpl-badge lrsd-sf-tpl-badge--' + esc(normalized.cardType) + '">' + esc(displayTypes[normalized.cardType] || normalized.cardType) + '</span>';
            return '<div class="lrsd-sf-tpl-option" data-tpl-id="' + esc(tpl.id) + '" data-context="' + esc(context) + '" role="button" tabindex="0">' +
                buildPreviewThumbHtml(normalized) +
                '<div class="lrsd-sf-tpl-name">' + esc(tpl.label) + ' ' + typeBadge + '</div>' +
                '<div class="lrsd-sf-tpl-used-by">' + esc(tpl.usedBy) + '</div>' +
            '</div>';
        }).join('');

        return '<div class="lrsd-sf-tpl-picker" data-context="' + esc(context) + '">' +
            '<div class="lrsd-sf-tpl-picker-header">' +
                '<strong>Choose a card format</strong>' +
                '<button type="button" class="button lrsd-sf-tpl-cancel">&times; Cancel</button>' +
            '</div>' +
            '<div class="lrsd-sf-tpl-options">' + rows + '</div>' +
        '</div>';
    }

    function buildCardPreviewHtml(card) {
        card = normalizeCard(card);
        var titleHtml = esc(card.title || (i18n.untitledCard || '(Untitled Card)'));
        var bodyHtml = '';
        var noteBadge = card.notes ? '<div class="lrsd-sf-preview-note-mode">' + esc(card.noteMode === 'flip' ? 'Note on back' : 'Note below card') + '</div>' : '';

        if (card.cardType === 'image') {
            bodyHtml = '<div class="lrsd-sf-preview-image-card lrsd-sf-preview-image-card--' + esc(card.imageSize) + '">' +
                '<div class="lrsd-sf-preview-image-fill">' + esc(card.imageOverlayText || 'Image preview') + '</div>' +
            '</div>';
        } else if (card.cardType === 'highlight') {
            var highlightItem = card.items[0] || {};
            bodyHtml = '<div class="lrsd-sf-preview-highlight">' +
                '<span class="lrsd-sf-preview-highlight-value">' + esc(highlightItem.value || '—') + '</span>' +
                '<span class="lrsd-sf-preview-highlight-label">' + esc(highlightItem.label || '') + '</span>' +
            '</div>';
        } else if (card.cardType === 'stat') {
            var statItems = card.items.filter(function (item) { return item.label || item.value; });
            if (!statItems.length) {
                bodyHtml = '<p class="lrsd-sf-preview-empty">No rows yet.</p>';
            } else {
                bodyHtml = '<div class="lrsd-sf-preview-stats">' + statItems.map(function (item) {
                    return '<div class="lrsd-sf-preview-stat"><span class="lrsd-sf-preview-stat-value">' + esc(item.value || '—') + '</span><span class="lrsd-sf-preview-stat-label">' + esc(item.label || '') + '</span></div>';
                }).join('') + '</div>';
            }
        } else if (card.cardType === 'simple_list') {
            var simpleItems = card.items.filter(function (item) { return item.label || item.value; });
            bodyHtml = simpleItems.length
                ? '<div class="lrsd-sf-preview-simple-list">' + simpleItems.map(function (item) { return '<div class="lrsd-sf-preview-bullet-row"><span class="lrsd-sf-preview-bullet"></span><span>' + esc(item.label || item.value) + '</span></div>'; }).join('') + '</div>'
                : '<p class="lrsd-sf-preview-empty">No rows yet.</p>';
        } else {
            var listItems = card.items.filter(function (item) { return item.label || item.value; });
            bodyHtml = listItems.length
                ? '<div class="lrsd-sf-preview-list">' + listItems.map(function (item) { return '<div class="lrsd-sf-preview-row"><span class="lrsd-sf-preview-label">' + esc(item.label || '') + '</span><span class="lrsd-sf-preview-value">' + esc(item.value || '—') + '</span></div>'; }).join('') + '</div>'
                : '<p class="lrsd-sf-preview-empty">No rows yet.</p>';
        }

        return '<div class="lrsd-sf-card-preview">' +
            '<div class="lrsd-sf-preview-header"><span class="lrsd-sf-preview-title">' + titleHtml + '</span></div>' +
            '<div class="lrsd-sf-preview-body">' + bodyHtml + noteBadge + '</div>' +
        '</div>';
    }

    function buildEditableCardHtml(card, context, previewVisible) {
        card = normalizeCard(card);
        var isGlobal = context === 'global';
        var wrapperClass = isGlobal ? 'lrsd-sf-global-card-template' : 'lrsd-sf-custom-card';
        var iconFieldId = (isGlobal ? 'lrsd-gct-icon-' : 'lrsd-card-icon-') + card.id;
        var previewClasses = 'lrsd-sf-card-preview-wrap' + (isGlobal ? ' lrsd-sf-global-preview-wrap' : '');
        var previewStyle = previewVisible ? '' : 'display:none;';
        var previewButtonClass = isGlobal ? 'lrsd-sf-toggle-global-preview' : 'lrsd-sf-toggle-preview';
        var removeButtonClass = isGlobal ? 'lrsd-sf-remove-global-card' : 'lrsd-sf-remove-card';
        var noteHelp = isGlobal ? 'Placeholder note shown until a school overrides it.' : 'Optional note for this card.';
        var itemsRowLabel = card.cardType === 'simple_list' ? 'List Items' : (card.cardType === 'image' ? 'Image Settings' : 'Rows');
        var imageFields = '<div class="lrsd-sf-image-fields">' +
            '<div class="lrsd-sf-media-wrap"><input type="text" id="' + iconFieldId + '-image" class="regular-text lrsd-sf-card-image-url-input" value="' + esc(card.imageUrl) + '" placeholder="' + esc(i18n.imageUrl || 'Image file') + '" /><button type="button" class="button lrsd-sf-media-btn" data-target="' + iconFieldId + '-image">Choose Media</button></div>' +
            '<p><input type="text" class="regular-text lrsd-sf-card-image-overlay-input" value="' + esc(card.imageOverlayText) + '" placeholder="' + esc(i18n.imageOverlayText || 'Overlay text') + '" /></p>' +
            '<p><input type="url" class="regular-text lrsd-sf-card-image-link-input" value="' + esc(card.imageLink) + '" placeholder="' + esc(i18n.imageLink || 'Click-through link') + '" /></p>' +
            '<p><select class="lrsd-sf-card-image-size-select">' + buildSelectOptions(imageSizes, card.imageSize) + '</select></p>' +
        '</div>';

        return '<div class="' + wrapperClass + '" data-card-id="' + esc(card.id) + '" data-context="' + esc(context) + '">' +
            '<div class="lrsd-sf-custom-card-header">' +
                '<span class="lrsd-sf-card-drag dashicons dashicons-move" title="Drag to reorder"></span>' +
                '<strong class="lrsd-sf-card-name">' + esc(card.title || (i18n.untitledCard || '(Untitled Card)')) + '</strong>' +
                (isGlobal ? '<span class="lrsd-sf-global-badge">' + esc(i18n.allSchoolsLabel || 'All Schools') + '</span>' : '') +
                '<button type="button" class="button ' + previewButtonClass + '" title="Toggle card preview">' + esc(previewVisible ? (i18n.hidePreview || 'Hide Preview') : (i18n.showPreview || 'Show Preview')) + '</button>' +
                '<button type="button" class="button ' + removeButtonClass + '" title="Remove card">\u2715</button>' +
            '</div>' +
            '<div class="' + previewClasses + '" style="' + previewStyle + '">' + buildCardPreviewHtml(card) + '</div>' +
            '<table class="form-table" role="presentation"><tbody>' +
                '<tr><th>Card Title</th><td><input type="text" class="regular-text lrsd-sf-card-title-input" value="' + esc(card.title) + '" /></td></tr>' +
                '<tr><th>Card Type</th><td><select class="lrsd-sf-card-type-select">' + buildSelectOptions(displayTypes, card.cardType) + '</select></td></tr>' +
                '<tr><th>Icon</th><td><div class="lrsd-sf-media-wrap"><input type="text" id="' + iconFieldId + '" class="regular-text lrsd-sf-media-input lrsd-sf-card-icon-input" value="' + esc(card.icon) + '" /><button type="button" class="button lrsd-sf-media-btn" data-target="' + iconFieldId + '">Choose Media</button></div></td></tr>' +
                '<tr><th>Category Label</th><td><input type="text" class="regular-text lrsd-sf-card-category-input" value="' + esc(card.category) + '" /></td></tr>' +
                '<tr class="lrsd-sf-card-items-row"><th>' + itemsRowLabel + '</th><td>' + (card.cardType === 'image' ? imageFields : buildItemsEditorHtml(card, context)) + '</td></tr>' +
                '<tr><th>Note Display</th><td><select class="lrsd-sf-card-note-mode-select">' + buildSelectOptions(noteModes, card.noteMode) + '</select></td></tr>' +
                '<tr><th>Note Title</th><td><input type="text" class="regular-text lrsd-sf-card-note-title-input" value="' + esc(card.noteTitle) + '" placeholder="' + esc(i18n.noteTitle || 'Note title') + '" /></td></tr>' +
                '<tr><th>Note</th><td><textarea class="large-text lrsd-sf-card-notes-input" rows="3">' + esc(card.notes) + '</textarea><p class="description">' + esc(noteHelp) + '</p></td></tr>' +
            '</tbody></table>' +
        '</div>';
    }

    function readEditorCardFromDom($card) {
        var cardType = normalizeCardType($card.find('.lrsd-sf-card-type-select').val() || 'details_list');
        var card = normalizeCard({
            id: $card.data('card-id') || uniqueId(),
            title: $card.find('.lrsd-sf-card-title-input').val() || '',
            icon: $card.find('.lrsd-sf-card-icon-input').val() || '',
            category: $card.find('.lrsd-sf-card-category-input').val() || '',
            cardType: cardType,
            noteMode: $card.find('.lrsd-sf-card-note-mode-select').val() || 'inline',
            noteTitle: $card.find('.lrsd-sf-card-note-title-input').val() || '',
            notes: $card.find('.lrsd-sf-card-notes-input').val() || '',
            imageUrl: $card.find('.lrsd-sf-card-image-url-input').val() || '',
            imageSize: $card.find('.lrsd-sf-card-image-size-select').val() || 'standard',
            imageOverlayText: $card.find('.lrsd-sf-card-image-overlay-input').val() || '',
            imageLink: $card.find('.lrsd-sf-card-image-link-input').val() || '',
            items: [],
        });

        $card.find('.lrsd-sf-item-row').each(function () {
            var $row = $(this);
            var options = ($row.find('.lrsd-sf-item-options').val() || '').split(/\r?\n/).map(function (opt) { return opt.trim(); }).filter(Boolean);
            card.items.push(normalizeItem({
                label: $row.find('.lrsd-sf-item-label').val() || '',
                value: $row.find('.lrsd-sf-item-value').val() || '',
                valueType: $row.find('.lrsd-sf-item-valuetype').val() || 'text',
                options: options,
            }));
        });

        if (cardType === 'simple_list') {
            card.items = card.items.map(function (item) {
                item.value = '';
                item.valueType = 'text';
                item.options = [];
                return item;
            });
        }

        if (cardType === 'highlight' && card.items.length > 1) {
            card.items = [card.items[0]];
        }

        return card;
    }

    function refreshCardPreview($card) {
        var $preview = $card.find('.lrsd-sf-card-preview-wrap');
        if (!$preview.length) {
            return;
        }
        $preview.html(buildCardPreviewHtml(readEditorCardFromDom($card)));
    }

    function rerenderEditableCard($card) {
        var context = $card.data('context') || ($card.hasClass('lrsd-sf-global-card-template') ? 'global' : 'school');
        var previewVisible = $card.find('.lrsd-sf-card-preview-wrap:visible').length > 0;
        var card = readEditorCardFromDom($card);
        var replacement = $(buildEditableCardHtml(card, context, previewVisible));
        $card.replaceWith(replacement);
        if (context === 'school') {
            $('#lrsd-sf-card-order .lrsd-sf-order-item[data-card-id="' + card.id + '"] .lrsd-sf-order-label').text(card.title || (i18n.untitledCard || '(Untitled Card)'));
        }
    }

    function renderEditableCardCollection($container, cards, context) {
        if (!$container.length) {
            return;
        }
        var html = (cards || []).map(function (card) {
            return buildEditableCardHtml(normalizeCard(card), context, false);
        }).join('');
        $container.html(html);
    }

    function readTemplateById(tplId) {
        for (var i = 0; i < cardTemplates.length; i++) {
            if (cardTemplates[i].id === tplId) {
                return normalizeCard($.extend(true, {}, cardTemplates[i], { id: uniqueId(), title: cardTemplates[i].label }));
            }
        }
        return null;
    }

    function initCustomCards() {
        var schoolCards = parseMaybeJson($('#lrsd_sf_custom_cards_json').val(), []);
        renderEditableCardCollection($('#lrsd-sf-custom-cards'), schoolCards, 'school');
        renderGlobalCardValues();

        $(document).on('click', '#lrsd-sf-add-card', function () {
            var $container = $('#lrsd-sf-custom-cards');
            $('.lrsd-sf-tpl-picker').remove();
            $container.before(buildTemplatePickerHtml('school'));
        });

        $(document).on('click', '.lrsd-sf-tpl-cancel', function () {
            $(this).closest('.lrsd-sf-tpl-picker').remove();
        });

        $(document).on('click keypress', '.lrsd-sf-tpl-option', function (e) {
            if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) {
                return;
            }
            var tpl = readTemplateById($(this).data('tpl-id'));
            var context = $(this).data('context');
            if (!tpl) {
                return;
            }
            $(this).closest('.lrsd-sf-tpl-picker').remove();
            if (context === 'global') {
                $('#lrsd-sf-global-cards').append(buildEditableCardHtml(tpl, 'global', false));
                clearSortableHeights($('#lrsd-sf-global-cards'), '.lrsd-sf-global-card-template');
            } else {
                $('#lrsd-sf-custom-cards').append(buildEditableCardHtml(tpl, 'school', false));
                addCardToOrder(tpl.id, tpl.title || (i18n.untitledCard || '(Untitled Card)'));
                clearSortableHeights($('#lrsd-sf-custom-cards'), '.lrsd-sf-custom-card');
            }
        });

        $(document).on('click', '.lrsd-sf-remove-card', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card');
            var cardId = $card.data('card-id');
            $card.remove();
            removeCardFromOrder(cardId);
            clearSortableHeights($('#lrsd-sf-custom-cards'), '.lrsd-sf-custom-card');
        });

        $(document).on('click', '.lrsd-sf-add-item', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card, .lrsd-sf-global-card-template');
            var card = readEditorCardFromDom($card);
            if (card.cardType === 'highlight') {
                card.items = [normalizeItem({ label: '', value: '' })];
            } else {
                card.items.push(normalizeItem({}));
            }
            var replacement = $(buildEditableCardHtml(card, $card.data('context') || 'school', $card.find('.lrsd-sf-card-preview-wrap:visible').length > 0));
            $card.replaceWith(replacement);
        });

        $(document).on('click', '.lrsd-sf-remove-item', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card, .lrsd-sf-global-card-template');
            $(this).closest('.lrsd-sf-item-row').remove();
            rerenderEditableCard($card);
        });

        $(document).on('input', '.lrsd-sf-card-title-input', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card, .lrsd-sf-global-card-template');
            var title = $(this).val() || (i18n.untitledCard || '(Untitled Card)');
            $card.find('.lrsd-sf-card-name').text(title);
            $('#lrsd-sf-card-order .lrsd-sf-order-item[data-card-id="' + $card.data('card-id') + '"] .lrsd-sf-order-label').text(title);
            refreshCardPreview($card);
        });

        $(document).on('input change', '.lrsd-sf-card-icon-input, .lrsd-sf-card-category-input, .lrsd-sf-card-note-mode-select, .lrsd-sf-card-note-title-input, .lrsd-sf-card-notes-input, .lrsd-sf-item-label, .lrsd-sf-item-value, .lrsd-sf-card-image-url-input, .lrsd-sf-card-image-overlay-input, .lrsd-sf-card-image-link-input, .lrsd-sf-card-image-size-select', function () {
            refreshCardPreview($(this).closest('.lrsd-sf-custom-card, .lrsd-sf-global-card-template'));
        });

        $(document).on('change', '.lrsd-sf-card-type-select, .lrsd-sf-item-valuetype', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card, .lrsd-sf-global-card-template');
            rerenderEditableCard($card);
        });

        $(document).on('change', '.lrsd-sf-item-options', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card, .lrsd-sf-global-card-template');
            rerenderEditableCard($card);
        });

        $(document).on('click', '.lrsd-sf-toggle-preview, .lrsd-sf-toggle-global-preview', function () {
            var $card = $(this).closest('.lrsd-sf-custom-card, .lrsd-sf-global-card-template');
            var $preview = $card.find('.lrsd-sf-card-preview-wrap');
            if ($preview.is(':visible')) {
                $preview.slideUp(150);
                $(this).text(i18n.showPreview || 'Show Preview');
            } else {
                refreshCardPreview($card);
                $preview.slideDown(150);
                $(this).text(i18n.hidePreview || 'Hide Preview');
            }
        });

        $('#lrsd-sf-custom-cards').sortable({
            handle: '.lrsd-sf-card-drag',
            cursor: 'grab',
            tolerance: 'pointer',
            stop: function () {
                clearSortableHeights($('#lrsd-sf-custom-cards'), '.lrsd-sf-custom-card');
            },
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

    function buildGlobalValueInput(item, currentValue) {
        currentValue = currentValue || '';
        if (item.valueType === 'select' && item.options.length) {
            var html = '<select class="regular-text lrsd-sf-gcv-item-value" data-label="' + esc(item.label || '') + '"><option value=""></option>';
            item.options.forEach(function (opt) {
                html += '<option value="' + esc(opt) + '"' + (opt === currentValue ? ' selected' : '') + '>' + esc(opt) + '</option>';
            });
            html += '</select>';
            return html;
        }
        var inputType = item.valueType === 'number' ? 'number' : 'text';
        return '<input type="' + inputType + '" class="regular-text lrsd-sf-gcv-item-value" data-label="' + esc(item.label || '') + '" value="' + esc(currentValue) + '" placeholder="' + esc(i18n.schoolValue || 'Value for this school') + '" />';
    }

    function buildGlobalCardValueEditorHtml(template, schoolValues) {
        template = normalizeCard(template);
        schoolValues = schoolValues || {};
        var valueMap = {};
        if (Array.isArray(schoolValues.items)) {
            schoolValues.items.forEach(function (item) {
                valueMap[item.label || ''] = item.value || '';
            });
        }

        var bodyHtml = '';
        if (template.cardType === 'image') {
            bodyHtml =
                '<tr><th>Image file</th><td><div class="lrsd-sf-media-wrap"><input type="text" id="lrsd-sf-gcv-image-' + esc(template.id) + '" class="regular-text lrsd-sf-gcv-image-url" value="' + esc(schoolValues.imageUrl || '') + '" placeholder="' + esc(template.imageUrl || (i18n.imageUrl || 'Image file')) + '" /><button type="button" class="button lrsd-sf-media-btn" data-target="lrsd-sf-gcv-image-' + esc(template.id) + '">Choose Media</button></div></td></tr>' +
                '<tr><th>Overlay text</th><td><input type="text" class="regular-text lrsd-sf-gcv-image-overlay" value="' + esc(schoolValues.imageOverlayText || '') + '" placeholder="' + esc(template.imageOverlayText || (i18n.imageOverlayText || 'Overlay text')) + '" /></td></tr>' +
                '<tr><th>Click-through link</th><td><input type="url" class="regular-text lrsd-sf-gcv-image-link" value="' + esc(schoolValues.imageLink || '') + '" placeholder="' + esc(template.imageLink || (i18n.imageLink || 'Click-through link')) + '" /></td></tr>';
        } else if (template.cardType === 'simple_list') {
            bodyHtml = template.items.map(function (item, index) {
                var label = item.label || ('Item ' + (index + 1));
                return '<tr><th>' + esc('Item ' + (index + 1)) + '</th><td><input type="text" class="regular-text lrsd-sf-gcv-item-value" data-label="' + esc(label) + '" value="' + esc(valueMap[label] || '') + '" placeholder="' + esc(item.label || item.value || 'List item') + '" /></td></tr>';
            }).join('');
        } else {
            bodyHtml = template.items.map(function (item) {
                var label = item.label || '';
                return '<tr><th>' + esc(label || 'Value') + '</th><td>' + buildGlobalValueInput(item, valueMap[label] || '') + '</td></tr>';
            }).join('');
        }

        bodyHtml += '<tr><th>Note</th><td><textarea class="large-text lrsd-sf-gcv-notes" rows="3" placeholder="Optional school-specific note">' + esc(schoolValues.notes || '') + '</textarea></td></tr>';

        return '<div class="lrsd-sf-global-card-data" data-card-id="' + esc(template.id) + '" data-card-type="' + esc(template.cardType) + '">' +
            '<h4 class="lrsd-sf-gcv-title"><span class="lrsd-sf-global-badge">' + esc(i18n.allSchoolsLabel || 'All Schools') + '</span>' + esc(template.title || (i18n.untitledCard || '(Untitled Card)')) + '</h4>' +
            '<table class="form-table" role="presentation"><tbody>' + bodyHtml + '</tbody></table>' +
        '</div>';
    }

    function renderGlobalCardValues() {
        var $container = $('#lrsd-sf-global-card-values');
        if (!$container.length) {
            return;
        }
        var globalCards = parseMaybeJson($container.attr('data-global-cards-json'), []);
        var schoolValues = parseMaybeJson($('#lrsd_sf_custom_card_values_json').val(), {});
        var html = globalCards.map(function (template) {
            return buildGlobalCardValueEditorHtml(template, schoolValues[template.id] || {});
        }).join('');
        $container.html(html);
    }

    function serializeGlobalCardValues() {
        if (!$('#lrsd_sf_custom_card_values_json').length) {
            return;
        }
        var values = {};
        $('.lrsd-sf-global-card-data').each(function () {
            var cardId = $(this).data('card-id');
            if (!cardId) {
                return;
            }
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
                imageUrl: $(this).find('.lrsd-sf-gcv-image-url').val() || '',
                imageOverlayText: $(this).find('.lrsd-sf-gcv-image-overlay').val() || '',
                imageLink: $(this).find('.lrsd-sf-gcv-image-link').val() || '',
            };
        });
        $('#lrsd_sf_custom_card_values_json').val(JSON.stringify(values));
    }

    // ── Card Editor Page (global card templates) ──────────────────────────────

    function initCardEditorPage() {
        if (!$('#lrsd-sf-global-cards').length) {
            return;
        }

        var globalCards = parseMaybeJson($('#lrsd_sf_global_cards_json').val(), []);
        renderEditableCardCollection($('#lrsd-sf-global-cards'), globalCards, 'global');

        $(document).on('click', '.lrsd-sf-remove-global-card', function () {
            $(this).closest('.lrsd-sf-global-card-template').remove();
        });

        $('#lrsd-sf-global-cards').sortable({
            handle: '.lrsd-sf-card-drag',
            cursor: 'grab',
            tolerance: 'pointer',
            stop: function () {
                // Clear any inline heights sortable may have set
                clearSortableHeights($('#lrsd-sf-global-cards'), '.lrsd-sf-global-card-template');
            },
        });

        $('#lrsd-sf-card-editor-form').on('submit', function () {
            serializeGlobalCards();
        });
    }

    function serializeGlobalCards() {
        var cards = [];
        $('#lrsd-sf-global-cards .lrsd-sf-global-card-template').each(function () {
            cards.push(readEditorCardFromDom($(this)));
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
            cards.push(readEditorCardFromDom($(this)));
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
        initKeyValueRows();
        initCardEditorPage();
        initAdvancedEditor();
    });

})(jQuery);
