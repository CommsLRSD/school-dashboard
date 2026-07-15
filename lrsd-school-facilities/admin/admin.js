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
                $header.attr('aria-expanded', 'true'); // "true" = collapsed
            } else {
                $body.addClass('is-open').slideDown(180);
                $header.attr('aria-expanded', 'false'); // "false" = open
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
                        // Add option to all selects with this option key on the page
                        $('select[data-option-key="' + optKey + '"], #' + targetSelectId).each(function () {
                            var $sel = $(this);
                            // Check if already present
                            if ($sel.find('option[value="' + CSS.escape(newVal) + '"]').length === 0) {
                                $sel.append($('<option>').val(newVal).text(newVal));
                            }
                        });
                        // Also add it to the current target and select it
                        if ($select.find('option[value="' + CSS.escape(newVal) + '"]').length === 0) {
                            $select.append($('<option>').val(newVal).text(newVal));
                        }
                        $select.val(newVal);
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

    function buildCardHtml(id, title, icon, category, notes, items) {
        id       = id       || uniqueId();
        title    = title    || '';
        icon     = icon     || '';
        category = category || '';
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
            $('#lrsd-sf-card-order .lrsd-sf-order-item[data-card-id="' + cardId + '"]').contents().last()[0].nodeValue = ' ' + title;
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
                    '<span class="dashicons dashicons-menu"></span> ' + esc(label) +
                '</li>'
            );
        }
        serializeCardOrder();
    }

    function removeCardFromOrder(cardId) {
        $('#lrsd-sf-card-order .lrsd-sf-order-item[data-card-id="' + cardId + '"]').remove();
        serializeCardOrder();
    }

    // ── Pre-submit Serialization ───────────────────────────────────────────────

    function initPreSubmit() {
        $('form#post').on('submit', function () {
            serializeCustomCards();
            serializeCardOrder();
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

    // ── Init ──────────────────────────────────────────────────────────────────

    $(function () {
        initSections();
        initMediaPicker();
        initCustomDropdownOptions();
        initCardOrderSortable();
        initCustomCards();
        initPreSubmit();
        initBulkUpdate();
    });

})(jQuery);
