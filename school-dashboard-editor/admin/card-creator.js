/* global lrsdSfCardCreator */
(function ($) {
    'use strict';

    if (typeof lrsdSfCardCreator === 'undefined') {
        return;
    }

    var data = {
        registry: {},
        icons: [],
        cards: [],
        currentIndex: -1,
        previewReady: false,
        workspaceOpen: false,
    };

    var ui = {};
    var previewFallbacks = {
        blankValue: '—',
        metricLabel: 'Metric',
        listItem: 'List item',
        detailLabel: 'Label',
        detailValue: 'Value',
    };
    var previewLayout = {
        minFrameHeight: 420,
        statMinWidth: 112,
    };

    function getI18n(key, fallback) {
        return (lrsdSfCardCreator.i18n && lrsdSfCardCreator.i18n[key]) || fallback || key;
    }

    function generateCardId() {
        if (!(window.crypto && window.crypto.getRandomValues)) {
            return '';
        }
        var bytes = new Uint32Array(2);
        window.crypto.getRandomValues(bytes);
        var rand = bytes[0].toString(36) + bytes[1].toString(36);
        return 'custom_' + Date.now() + '_' + rand;
    }

    function showStatus(message, type) {
        var $status = ui.status;
        $status.removeClass('is-error is-success is-info').addClass(type ? 'is-' + type : 'is-info').text(message || '').show();
    }

    function hideStatus() {
        ui.status.hide().text('');
    }

    function defaultCardForType(type) {
        var schema = data.registry[type] || {};
        var defaults = $.extend(true, {}, schema.defaultValues || {});
        var generatedId = generateCardId();
        return {
            id: generatedId,
            title: defaults.title || getI18n('unsavedCardFallback', 'Unsaved card'),
            icon: (data.icons[0] || 'public/icon/details.svg'),
            cardType: type,
            noteMode: defaults.noteMode || 'inline',
            noteTitle: '',
            notes: '',
            items: Array.isArray(defaults.items) ? defaults.items : [],
            imageUrl: defaults.imageUrl || '',
            imageLink: defaults.imageLink || '',
            imageOverlayText: defaults.imageOverlayText || '',
            imageSize: defaults.imageSize || 'standard',
        };
    }

    function toEditableCards(state) {
        var cards = [];
        (state.globalCards || []).forEach(function (card) {
            cards.push({
                card: $.extend(true, {}, card),
                previousAssignment: { scope: 'global', schoolIds: [] },
            });
        });
        cards.sort(function (a, b) {
            var left = (a.card.title || a.card.id || '').toLowerCase();
            var right = (b.card.title || b.card.id || '').toLowerCase();
            return left.localeCompare(right);
        });
        return cards;
    }

    function loadCardData() {
        showStatus(getI18n('loading', 'Loading…'), 'info');
        $.post(lrsdSfCardCreator.ajaxUrl, {
            action: 'lrsd_sf_card_creator_load',
            nonce: lrsdSfCardCreator.nonce,
        }).done(function (response) {
            if (!response || !response.success) {
                showStatus(getI18n('loadError', 'Failed to load card data.'), 'error');
                return;
            }
            data.registry = response.data.registry || {};
            data.icons = response.data.icons || [];
            data.cards = toEditableCards(response.data.state || {});
            renderTypeOptions();
            renderCardOptions();
            renderCardList();
            initPreviewFrame();
            closeWorkspace();
            hideStatus();
        }).fail(function () {
            showStatus(getI18n('loadError', 'Failed to load card data.'), 'error');
        });
    }

    function renderTypeOptions() {
        var options = Object.keys(data.registry).map(function (key) {
            return '<option value="' + escapeHtml(key) + '">' + escapeHtml(data.registry[key].label || key) + '</option>';
        }).join('');
        ui.cardType.html(options);
    }

    function cardDisplayLabel(entry) {
        var card = entry.card || {};
        return card.title || card.id || getI18n('unsavedCardFallback', 'Unsaved card');
    }

    function renderCardOptions() {
        var options = data.cards.map(function (entry, index) {
            var selected = (index === data.currentIndex) ? ' selected' : '';
            return '<option value="' + index + '"' + selected + '>' + cardDisplayLabel(entry) + '</option>';
        }).join('');
        ui.cardSelect.html(options);
    }

    function renderCardList() {
        if (!data.cards.length) {
            ui.cardList.html('<li class="lrsd-sf-card-list-empty">' + escapeHtml(getI18n('noCardsYet', 'No cards yet. Click New Card to create one.')) + '</li>');
            return;
        }
        var html = data.cards.map(function (entry, index) {
            var card = entry.card || {};
            var title = card.title || card.id || getI18n('unsavedCardFallback', 'Unsaved card');
            return '' +
                '<li class="lrsd-sf-card-list-item">' +
                    '<button type="button" class="button button-link lrsd-sf-card-open lrsd-sf-card-edit-inline" data-index="' + String(index) + '">' + escapeHtml(title) + '</button>' +
                    '<div class="lrsd-sf-card-list-actions">' +
                        '<button type="button" class="button button-small lrsd-sf-card-edit-inline" data-index="' + String(index) + '">' + escapeHtml(getI18n('editCard', 'Edit')) + '</button>' +
                        '<button type="button" class="button button-small button-link-delete lrsd-sf-card-delete-inline" data-index="' + String(index) + '">' + escapeHtml(getI18n('deleteCard', 'Delete')) + '</button>' +
                    '</div>' +
                '</li>';
        }).join('');
        ui.cardList.html(html);
    }

    function getCurrentEntry() {
        if (data.currentIndex < 0 || data.currentIndex >= data.cards.length) {
            return null;
        }
        return data.cards[data.currentIndex];
    }

    function selectCurrentCard() {
        var entry = getCurrentEntry();
        if (!entry) {
            return;
        }
        var card = entry.card;
        // If the card's icon is a full URL (media library pick), ensure it's in the grid
        if (card.icon && isAbsoluteUrl(card.icon)) {
            ensureIconInRegistry(card.icon);
        }
        ui.cardSelect.val(String(data.currentIndex));
        ui.title.val(card.title || '');
        ui.cardType.val(card.cardType || Object.keys(data.registry)[0] || 'details_list');
        ui.icon.val(card.icon || '');
        ui.noteMode.val(card.noteMode || 'inline');
        ui.noteTitle.val(card.noteTitle || '');
        ui.notes.val(card.notes || '');
        setNoteFieldsExpanded(false);
        renderDynamicFields(card);
        syncJsonFromCard();
        renderPreview();
    }

    function persistFormToCurrent() {
        var entry = getCurrentEntry();
        if (!entry) {
            return;
        }
        var card = entry.card;
        card.title = ui.title.val().trim();
        card.cardType = ui.cardType.val();
        card.icon = ui.icon.val().trim();
        card.noteMode = ui.noteMode.val();
        card.noteTitle = ui.noteTitle.val().trim();
        card.notes = ui.notes.val();

        if (card.cardType === 'image') {
            card.imageUrl = $('#lrsd-sf-card-image-url').val() || '';
            card.imageLink = $('#lrsd-sf-card-image-link').val() || '';
            card.imageOverlayText = $('#lrsd-sf-card-image-overlay').val() || '';
            card.imageSize = $('#lrsd-sf-card-image-size').val() || 'standard';
            card.items = [];
        } else {
            var existingItems = Array.isArray(card.items) ? card.items : [];
            card.items = [];
            ui.dynamicFields.find('.lrsd-sf-item-row').each(function (rowIdx) {
                var $row = $(this);
                var label = ($row.find('.lrsd-sf-item-label').val() || '').trim();
                var valueType = ($row.find('.lrsd-sf-item-value-type').val() || 'text');
                var options = (($row.find('.lrsd-sf-item-options').val() || '').split(',').map(function (option) {
                    return option.trim();
                })).filter(Boolean);
                var existingValue = (existingItems[rowIdx] && existingItems[rowIdx].value) || '';
                if (!label && !(valueType === 'dropdown' && options.length)) {
                    return;
                }
                card.items.push({ label: label, value: existingValue, valueType: valueType, options: options });
            });
        }
        renderCardOptions();
        syncJsonFromCard();
        renderPreview();
    }

    function renderDynamicFields(card) {
        var cardType = card.cardType;
        var schema = data.registry[cardType] || {};
        var limits = schema.limits || {};
        ui.dynamicFields.empty();

        if (cardType === 'image') {
            var imageHtml = '' +
                '<div class="lrsd-sf-form-row"><label for="lrsd-sf-card-image-url">Image URL</label><div class="lrsd-sf-media-input-wrap"><input type="text" id="lrsd-sf-card-image-url" class="regular-text" value="' + escapeHtml(card.imageUrl || '') + '"><button type="button" class="button" id="lrsd-sf-image-media-library">From Media Library</button></div></div>' +
                '<div class="lrsd-sf-form-row"><label for="lrsd-sf-card-image-link">Image Link (optional)</label><input type="text" id="lrsd-sf-card-image-link" class="regular-text" value="' + escapeHtml(card.imageLink || '') + '"></div>' +
                '<div class="lrsd-sf-form-row"><label for="lrsd-sf-card-image-overlay">Overlay Text</label><input type="text" id="lrsd-sf-card-image-overlay" class="regular-text" maxlength="' + (limits.maxOverlayLength || 90) + '" value="' + escapeHtml(card.imageOverlayText || '') + '"></div>' +
                '<div class="lrsd-sf-form-row"><label for="lrsd-sf-card-image-size">Image Size</label><select id="lrsd-sf-card-image-size"><option value="standard">Standard</option><option value="wide">Wide</option></select></div>';
            ui.dynamicFields.html(imageHtml);
            $('#lrsd-sf-card-image-size').val(card.imageSize || 'standard');
            ui.dynamicFields.find('input,select').on('input change', persistFormToCurrent);
            ui.dynamicFields.find('#lrsd-sf-image-media-library').on('click', openCardImageMediaPicker);
            return;
        }

        var maxItems = limits.maxItems || 8;
        var items = Array.isArray(card.items) ? card.items.slice() : [];
        if (!items.length) {
            items.push({ label: '', value: '' });
        }

        var rowHint = getI18n('maxRowsHint', 'Recommended max %d rows to preserve card height.').replace('%d', String(maxItems));
        var rows = '<div class="lrsd-sf-row-limit-hint">' + escapeHtml(rowHint) + '</div>' +
            '<div id="lrsd-sf-item-rows"></div><p><button type="button" class="button" id="lrsd-sf-item-add">+ Add Row</button></p>';
        ui.dynamicFields.html(rows);

        function rowHtml(item, idx) {
            var isSimpleList = cardType === 'simple_list';
            var labelPlaceholder = isSimpleList ? 'Item text' : 'Label';
            // For simple_list, item text was historically stored in value; fall back to it when label is empty
            var labelValue = item.label || (isSimpleList ? item.value || '' : '');
            var valueType = item.valueType || 'text';
            var optionsText = Array.isArray(item.options) ? item.options.join(', ') : '';
            return '<div class="lrsd-sf-item-row" data-index="' + idx + '">' +
                '<input type="text" class="regular-text lrsd-sf-item-label" maxlength="' + (limits.maxLabelLength || 60) + '" placeholder="' + labelPlaceholder + '" value="' + escapeHtml(labelValue) + '">' +
                '<select class="lrsd-sf-item-value-type"><option value="text"' + (valueType === 'text' ? ' selected' : '') + '>Text</option><option value="number"' + (valueType === 'number' ? ' selected' : '') + '>Number</option><option value="dropdown"' + (valueType === 'dropdown' ? ' selected' : '') + '>Dropdown</option></select>' +
                '<input type="text" class="regular-text lrsd-sf-item-options" placeholder="Dropdown options (comma separated)" value="' + escapeHtml(optionsText) + '"' + (valueType === 'dropdown' ? '' : ' style="display:none"') + '>' +
                '<button type="button" class="button lrsd-sf-item-up">↑</button>' +
                '<button type="button" class="button lrsd-sf-item-down">↓</button>' +
                '<button type="button" class="button lrsd-sf-item-remove">✕</button>' +
            '</div>';
        }

        function refreshRows() {
            var html = items.map(rowHtml).join('');
            $('#lrsd-sf-item-rows').html(html);
            $('#lrsd-sf-item-rows').find('input,select').on('input change', function () {
                var $row = $(this).closest('.lrsd-sf-item-row');
                var idx = Number($row.data('index'));
                var selectedType = $row.find('.lrsd-sf-item-value-type').val() || 'text';
                items[idx] = {
                    label: $row.find('.lrsd-sf-item-label').val() || '',
                    value: (items[idx] && items[idx].value) || '',
                    valueType: selectedType,
                    options: (($row.find('.lrsd-sf-item-options').val() || '').split(',').map(function (option) {
                        return option.trim();
                    })).filter(Boolean),
                };
                $row.find('.lrsd-sf-item-options').toggle(selectedType === 'dropdown');
                card.items = items;
                persistFormToCurrent();
            });
        }

        refreshRows();

        ui.dynamicFields.on('click', '#lrsd-sf-item-add', function () {
            if (items.length >= maxItems) {
                showStatus(getI18n('maxRowsReached', 'Maximum rows reached for this card type.'), 'error');
                return;
            }
            items.push({ label: '', value: '' });
            card.items = items;
            refreshRows();
            persistFormToCurrent();
        });

        ui.dynamicFields.on('click', '.lrsd-sf-item-remove', function () {
            var idx = Number($(this).closest('.lrsd-sf-item-row').data('index'));
            items.splice(idx, 1);
            if (!items.length) {
                items.push({ label: '', value: '' });
            }
            card.items = items;
            refreshRows();
            persistFormToCurrent();
        });

        ui.dynamicFields.on('click', '.lrsd-sf-item-up, .lrsd-sf-item-down', function () {
            var idx = Number($(this).closest('.lrsd-sf-item-row').data('index'));
            var next = $(this).hasClass('lrsd-sf-item-up') ? idx - 1 : idx + 1;
            if (next < 0 || next >= items.length) {
                return;
            }
            var tmp = items[idx];
            items[idx] = items[next];
            items[next] = tmp;
            card.items = items;
            refreshRows();
            persistFormToCurrent();
        });
    }

    function validateCurrentCard() {
        var entry = getCurrentEntry();
        if (!entry) return getI18n('loadError', 'No card selected.');
        var card = entry.card;

        if (!card.title) {
            return getI18n('titleRequired', 'Card title is required.');
        }
        if (!card.icon) {
            return getI18n('iconRequired', 'Select an icon.');
        }
        // Allow both registry paths and media library full URLs
        if (!isAbsoluteUrl(card.icon) && $.inArray(card.icon, data.icons) === -1) {
            return getI18n('iconNotAllowed', 'Icon must be selected from the icon registry.');
        }
        var schema = data.registry[card.cardType];
        if (!schema) {
            return getI18n('invalidCardType', 'Invalid card type.');
        }
        var maxItems = ((schema.limits || {}).maxItems) || 8;
        if (card.cardType !== 'image') {
            if (!Array.isArray(card.items) || !card.items.length) {
                return getI18n('addAtLeastOneRow', 'Add at least one row.');
            }
            if (card.items.length > maxItems) {
                return getI18n('tooManyRows', 'Too many rows for this card type.');
            }
        }
        return '';
    }

    function saveCurrentCard() {
        persistFormToCurrent();
        var error = validateCurrentCard();
        if (error) {
            showStatus(error, 'error');
            return;
        }
        var entry = getCurrentEntry();
        $.post(lrsdSfCardCreator.ajaxUrl, {
            action: 'lrsd_sf_card_creator_save',
            nonce: lrsdSfCardCreator.nonce,
            payload: JSON.stringify({
                card: entry.card,
            }),
        }).done(function (response) {
            if (!response || !response.success) {
                showStatus((response && response.data && response.data.message) || getI18n('saveError', 'Could not save card.'), 'error');
                return;
            }
            var savedId = entry.card.id;
            data.cards = toEditableCards(response.data.state || {});
            data.currentIndex = data.cards.findIndex(function (candidate) {
                return candidate.card && candidate.card.id === savedId;
            });
            if (data.currentIndex < 0) {
                data.currentIndex = 0;
            }
            renderCardOptions();
            renderCardList();
            selectCurrentCard();
            showStatus(response.data.message || getI18n('saveSuccess', 'Card saved.'), 'success');
            closeWorkspace();
        }).fail(function () {
            showStatus(getI18n('saveError', 'Could not save card.'), 'error');
        });
    }

    function deleteCardByIndex(index) {
        if (index < 0 || index >= data.cards.length) return;
        var entry = data.cards[index];
        var activeEntry = getCurrentEntry();
        var activeCardId = activeEntry && activeEntry.card ? activeEntry.card.id : '';
        var deletedCardId = entry && entry.card ? entry.card.id : '';

        if (!window.confirm(getI18n('deleteConfirm', 'Delete this card?'))) {
            return;
        }

        $.post(lrsdSfCardCreator.ajaxUrl, {
            action: 'lrsd_sf_card_creator_delete',
            nonce: lrsdSfCardCreator.nonce,
            payload: JSON.stringify({
                cardId: entry.card.id,
            }),
        }).done(function (response) {
            if (!response || !response.success) {
                showStatus((response && response.data && response.data.message) || getI18n('deleteFailed', 'Delete failed.'), 'error');
                return;
            }
            data.cards = toEditableCards(response.data.state || {});

            if (activeCardId && activeCardId !== deletedCardId) {
                data.currentIndex = data.cards.findIndex(function (candidate) {
                    return candidate.card && candidate.card.id === activeCardId;
                });
                if (data.currentIndex < 0 && data.cards.length) {
                    data.currentIndex = 0;
                }
            }

            renderCardOptions();
            renderCardList();
            if (!activeCardId || activeCardId === deletedCardId) {
                closeWorkspace();
            } else if (data.workspaceOpen && data.currentIndex >= 0) {
                selectCurrentCard();
            }
            showStatus(response.data.message || getI18n('deleteSuccess', 'Card deleted.'), 'success');
        }).fail(function () {
            showStatus(getI18n('deleteFailed', 'Delete failed.'), 'error');
        });
    }

    function deleteCurrentCard() {
        deleteCardByIndex(data.currentIndex);
    }

    function duplicateCurrentCard() {
        persistFormToCurrent();
        var entry = getCurrentEntry();
        if (!entry) return;
        var cloned = $.extend(true, {}, entry);
        var newId = generateCardId();
        if (!newId) {
            showStatus(getI18n('secureIdRequired', 'Secure ID generation is unavailable in this browser.'), 'error');
            return;
        }
        cloned.card.id = newId;
        cloned.card.title = (cloned.card.title || getI18n('unsavedCardFallback', 'Card')) + ' ' + getI18n('duplicateSuffix', 'Copy');
        cloned.previousAssignment = { scope: '', schoolIds: [] };
        data.cards.push(cloned);
        data.currentIndex = data.cards.length - 1;
        renderCardOptions();
        renderCardList();
        openWorkspace();
        selectCurrentCard();
    }

    function newCard() {
        if (data.workspaceOpen) {
            persistFormToCurrent();
        }
        var type = ui.cardType.val() || Object.keys(data.registry)[0] || 'details_list';
        var nextCard = defaultCardForType(type);
        if (!nextCard.id) {
            showStatus(getI18n('secureIdRequired', 'Secure ID generation is unavailable in this browser.'), 'error');
            return;
        }
        data.cards.push({
            card: nextCard,
            previousAssignment: { scope: '', schoolIds: [] },
        });
        data.currentIndex = data.cards.length - 1;
        renderCardOptions();
        renderCardList();
        openWorkspace();
        selectCurrentCard();
    }

    function resetCurrentCardDefaults() {
        var entry = getCurrentEntry();
        if (!entry) return;
        var type = entry.card.cardType || (Object.keys(data.registry)[0] || 'details_list');
        var defaults = defaultCardForType(type);
        entry.card = $.extend(true, {}, entry.card, defaults, {
            id: entry.card.id,
            title: entry.card.title || defaults.title,
            icon: entry.card.icon || defaults.icon,
            cardType: type,
        });
        renderCardOptions();
        renderCardList();
        selectCurrentCard();
    }

    function syncJsonFromCard() {
        var entry = getCurrentEntry();
        if (!entry) return;
        ui.json.val(JSON.stringify(entry.card, null, 2));
    }

    function applyJsonToForm() {
        var entry = getCurrentEntry();
        if (!entry) return;
        var parsed;
        try {
            parsed = JSON.parse(ui.json.val());
        } catch (e) {
            showStatus(getI18n('jsonInvalid', 'JSON invalid.'), 'error');
            return;
        }
        if (!parsed || typeof parsed !== 'object') {
            showStatus(getI18n('jsonInvalid', 'JSON invalid.'), 'error');
            return;
        }
        parsed.cardType = parsed.cardType || entry.card.cardType;
        if (!data.registry[parsed.cardType]) {
            showStatus(getI18n('jsonUnknownType', 'Unknown card type in JSON.'), 'error');
            return;
        }
        entry.card = $.extend(true, {}, entry.card, parsed);
        selectCurrentCard();
        showStatus(getI18n('jsonApplied', 'JSON applied to form.'), 'success');
    }

    function isAbsoluteUrl(str) {
        return /^https?:\/\//.test(str);
    }

    function getTrustedUrl(url) {
        var value = String(url || '');
        var parsed;
        if (!value) {
            return '';
        }
        try {
            parsed = new window.URL(value, window.location.origin);
        } catch (error) {
            return '';
        }
        if (!/^https?:$/.test(parsed.protocol) || parsed.origin !== window.location.origin) {
            return '';
        }
        return parsed.href;
    }

    function getAssetBaseUrl() {
        return getTrustedUrl(lrsdSfCardCreator.assetBaseUrl) || getTrustedUrl(lrsdSfCardCreator.siteUrl) || '';
    }

    function resolveAssetUrl(path) {
        var assetPath = String(path || '');
        var baseUrl = getAssetBaseUrl();
        if (!assetPath) {
            return '';
        }
        if (isAbsoluteUrl(assetPath)) {
            return getTrustedUrl(assetPath);
        }
        if (/^data:|^blob:/.test(assetPath)) {
            return assetPath;
        }
        if (!baseUrl) {
            return '';
        }
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        return baseUrl + assetPath.replace(/^\/+/, '');
    }

    function iconLabel(iconPath) {
        // Strip query string and fragment for media library URLs, then extract the filename without extension
        var clean = iconPath.replace(/[?#].*$/, '');
        var filename = clean.replace(/^.*\//, '') || clean;
        return filename.replace(/\.[^.]+$/, '') || iconPath;
    }

    function ensureIconInRegistry(url) {
        if (url && $.inArray(url, data.icons) === -1) {
            data.icons.unshift(url);
        }
    }

    function renderIconGrid(filterText) {
        var q = (filterText || '').toLowerCase();
        var icons = data.icons.filter(function (iconPath) {
            return !q || iconPath.toLowerCase().indexOf(q) !== -1;
        });
        var html = icons.map(function (iconPath) {
            var safePath = escapeHtml(iconPath);
            var imgSrc = escapeHtml(resolveAssetUrl(iconPath));
            var label = escapeHtml(iconLabel(iconPath));
            return '<button type="button" class="lrsd-sf-icon-option" data-icon="' + safePath + '">' +
                '<img src="' + imgSrc + '" alt="" loading="lazy"><span>' + label + '</span></button>';
        }).join('');
        ui.iconGrid.html(html || '<p class="description">' + escapeHtml(getI18n('noIconsFound', 'No icons found.')) + '</p>');
    }

    function openIconPicker() {
        ui.iconModal.prop('hidden', false);
        renderIconGrid('');
        ui.iconSearch.val('').focus();
    }

    function closeIconPicker() {
        ui.iconModal.prop('hidden', true);
    }

    function openMediaLibraryPicker() {
        if (!window.wp || !window.wp.media) {
            showStatus(getI18n('mediaLibraryUnavailable', 'Media library is not available. Please reload the page and try again.'), 'error');
            return;
        }
        var frame = window.wp.media({
            title: getI18n('mediaLibraryTitle', 'Choose Icon from Media Library'),
            button: { text: getI18n('mediaLibraryButton', 'Use as Icon') },
            multiple: false,
        });
        frame.on('select', function () {
            var attachment = frame.state().get('selection').first().toJSON();
            var url = attachment.url || '';
            if (!url) {
                return;
            }
            ensureIconInRegistry(url);
            ui.icon.val(url);
            closeIconPicker();
            persistFormToCurrent();
        });
        frame.open();
    }

    function openCardImageMediaPicker() {
        if (!window.wp || !window.wp.media) {
            showStatus(getI18n('mediaLibraryUnavailable', 'Media library is not available. Please reload the page and try again.'), 'error');
            return;
        }
        var frame = window.wp.media({
            title: getI18n('mediaLibraryImageTitle', 'Choose Image from Media Library'),
            button: { text: getI18n('mediaLibraryImageButton', 'Use Image') },
            multiple: false,
        });
        frame.on('select', function () {
            var attachment = frame.state().get('selection').first().toJSON();
            var url = attachment.url || '';
            if (!url) {
                return;
            }
            $('#lrsd-sf-card-image-url').val(url);
            persistFormToCurrent();
        });
        frame.open();
    }

    function openWorkspace() {
        data.workspaceOpen = true;
        ui.workspace.prop('hidden', false);
    }

    function closeWorkspace() {
        data.workspaceOpen = false;
        data.currentIndex = -1;
        ui.workspace.prop('hidden', true);
        ui.cardSelect.val('');
        renderPreviewEmpty();
    }

    function openCardByIndex(index) {
        if (!Number.isFinite(index) || index < 0 || index >= data.cards.length) {
            return;
        }
        data.currentIndex = index;
        renderCardOptions();
        openWorkspace();
        selectCurrentCard();
    }

    function renderPreviewEmpty() {
        var iframe = ui.previewFrame.get(0);
        if (!iframe || !iframe.contentWindow || !data.previewReady) return;
        var root = iframe.contentDocument && iframe.contentDocument.getElementById('card-preview-root');
        if (!root) return;
        root.className = 'preview-empty';
        root.innerHTML = escapeHtml(getI18n('previewEmpty', 'Select or create a card to preview it.'));
        resizePreviewFrame();
    }

    function setNoteFieldsExpanded(isExpanded) {
        var expanded = !!isExpanded;
        ui.noteFields.prop('hidden', !expanded);
        ui.noteToggle.text(expanded ? getI18n('editNote', 'Edit Note') : getI18n('addNote', 'Add Note'));
    }

    function initPreviewFrame() {
        var iframeDoc = '' +
            '<!doctype html><html><head><meta charset="utf-8">' +
            '<style>' +
            'body{margin:0;padding:20px;background:linear-gradient(180deg,#f7f8fb 0%,#eef3f8 100%);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1d2327;}' +
            '.preview-shell{max-width:392px;margin:0 auto;}' +
            '.preview-card{background:#fff;border:1px solid #d7dce3;border-radius:18px;box-shadow:0 14px 36px rgba(15,23,42,.10);overflow:hidden;}' +
            '.preview-header{display:flex;align-items:center;gap:12px;padding:18px 18px 14px;border-bottom:1px solid #eef1f5;}' +
            '.preview-icon{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#eef4ff,#f5f8ff);display:flex;align-items:center;justify-content:center;overflow:hidden;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(56,88,233,.08);}' +
            '.preview-icon img{width:24px;height:24px;display:block;object-fit:contain;}' +
            '.preview-icon-fallback{font-size:18px;font-weight:600;color:#3858e9;line-height:1;}' +
            '.preview-title-wrap{min-width:0;flex:1;}' +
            '.preview-type{display:inline-block;margin-bottom:6px;padding:3px 9px;border-radius:999px;background:#f4f6fb;color:#55606d;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;}' +
            '.preview-title{margin:0;font-size:18px;line-height:1.3;}' +
            '.preview-body{padding:18px;display:grid;gap:14px;}' +
            '.preview-detail-list,.preview-simple-list{list-style:none;margin:0;padding:0;display:grid;gap:9px;}' +
            '.preview-detail-row,.preview-simple-row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:11px 13px;border-radius:13px;background:#f6f7fb;}' +
            '.preview-detail-label{font-weight:600;color:#2c3338;}' +
            '.preview-detail-value{color:#50575e;text-align:right;}' +
            '.preview-highlight{padding:24px 16px;border-radius:16px;background:linear-gradient(135deg,#3858e9,#5aa9ff);color:#fff;text-align:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.18);}' +
            '.preview-highlight-value{font-size:32px;font-weight:700;line-height:1.1;}' +
            '.preview-highlight-label{margin-top:6px;font-size:13px;opacity:.9;}' +
            '.preview-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(' + String(previewLayout.statMinWidth) + 'px,1fr));gap:10px;}' +
            '.preview-stat{padding:12px;border-radius:14px;background:#f6f7f7;min-height:76px;display:flex;flex-direction:column;justify-content:space-between;}' +
            '.preview-stat-label{font-size:12px;color:#50575e;}' +
            '.preview-stat-value{font-size:24px;font-weight:700;line-height:1.2;color:#1d2327;}' +
            '.preview-image{position:relative;min-height:220px;border-radius:16px;background:linear-gradient(135deg,#dcdcde,#c3c4c7);overflow:hidden;display:flex;align-items:flex-end;justify-content:flex-start;}' +
            '.preview-image img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}' +
            '.preview-image-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#50575e;font-weight:600;letter-spacing:.02em;}' +
            '.preview-image-overlay{position:relative;margin:14px;padding:10px 12px;border-radius:12px;background:rgba(29,35,39,.72);color:#fff;font-size:14px;max-width:calc(100% - 28px);}' +
            '.preview-note{padding:12px 14px;border-radius:14px;background:#f0f6fc;color:#1d2327;font-size:13px;line-height:1.5;}' +
            '.preview-note strong{display:block;margin-bottom:4px;}' +
            '.preview-note-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:12px 14px;border:1px solid #d7dce3;border-radius:14px;background:#fff;color:#1d2327;font:600 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 22px rgba(15,23,42,.06);}' +
            '.preview-note-toggle-copy{display:flex;align-items:center;gap:10px;min-width:0;text-align:left;}' +
            '.preview-note-toggle-icon{width:28px;height:28px;border-radius:999px;background:#f0f6fc;color:#3858e9;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex:0 0 auto;}' +
            '.preview-note-toggle-label{color:#55606d;font-weight:500;}' +
            '.preview-empty{padding:24px 16px;border:1px dashed #c3c4c7;border-radius:14px;text-align:center;color:#646970;background:#fff;}' +
            '<\/style>' +
            '<\/head><body>' +
            '<main class="preview-shell"><div id="card-preview-root" class="preview-empty">Preview loading…<\/div><\/main>' +
            '<\/body><\/html>';

        data.previewReady = false;
        ui.previewFrame.off('load.lrsdSfCardCreator').on('load.lrsdSfCardCreator', function () {
            data.previewReady = true;
            renderPreview();
        });
        ui.previewFrame.attr('srcdoc', iframeDoc);
    }

    function resizePreviewFrame() {
        var iframe = ui.previewFrame.get(0);
        if (!iframe || !iframe.contentDocument) {
            return;
        }

        var doc = iframe.contentDocument;
        var docEl = doc.documentElement;
        var body = doc.body;
        var nextHeight = Math.max(
            body ? body.scrollHeight : 0,
            body ? body.offsetHeight : 0,
            docEl ? docEl.scrollHeight : 0,
            docEl ? docEl.offsetHeight : 0,
            previewLayout.minFrameHeight
        );

        ui.previewFrame.css('height', String(nextHeight + 8) + 'px');
    }

    function getPreviewTypeLabel(cardType) {
        var schema = data.registry[cardType] || {};
        return schema.label || (cardType ? cardType : getI18n('previewTypeFallback', 'Card'));
    }

    function isValidPreviewItem(item) {
        if (!item) {
            return false;
        }

        var hasLabel = String(item.label ?? '').trim() !== '';
        var hasValue = String(item.value ?? '').trim() !== '';
        return hasLabel || hasValue;
    }

    function formatPreviewText(text) {
        return escapeHtml(text).replace(/\n/g, '<br>');
    }

    function getPreviewItems(card) {
        return Array.isArray(card.items) ? card.items.filter(isValidPreviewItem) : [];
    }

    function buildPreviewIcon(card) {
        var iconUrl = resolveAssetUrl(card.icon || '');
        if (iconUrl) {
            return '<div class="preview-icon"><img src="' + escapeHtml(iconUrl) + '" alt=""><\/div>';
        }

        return '<div class="preview-icon"><span class="preview-icon-fallback">' + escapeHtml((card.title || 'C').charAt(0).toUpperCase()) + '<\/span><\/div>';
    }

    function buildPreviewNotes(card) {
        var notes = String(card.notes || '').trim();
        if (!notes) {
            return '';
        }

        var rawNoteTitle = String(card.noteTitle || '').trim();
        var noteTitle = rawNoteTitle || getI18n('previewNoteFallback', 'Card note');
        if ((card.noteMode || 'inline') === 'flip') {
            return '<div class="preview-note-toggle"><span class="preview-note-toggle-copy"><span class="preview-note-toggle-icon">i<\/span><span><strong>' + escapeHtml(noteTitle) + '<\/strong><span class="preview-note-toggle-label">' + escapeHtml(getI18n('previewFlipNoteHint', 'Flip note button shown on the live card')) + '<\/span><\/span><\/span><span aria-hidden="true">→<\/span><\/div>';
        }
        return '<div class="preview-note"><strong>' + escapeHtml(noteTitle) + '<\/strong>' + formatPreviewText(notes) + '<\/div>';
    }

    function buildPreviewBody(card) {
        var cardType = card.cardType || 'details_list';
        var items = getPreviewItems(card);

        if (cardType === 'image') {
            var imageUrl = resolveAssetUrl(card.imageUrl || '');
            var overlayText = String(card.imageOverlayText || '').trim();
            return '<div class="preview-image">' +
                (imageUrl ? '<img src="' + escapeHtml(imageUrl) + '" alt="">' : '<div class="preview-image-placeholder">Image preview<\/div>') +
                (overlayText ? '<div class="preview-image-overlay">' + escapeHtml(overlayText) + '<\/div>' : '') +
                '<\/div>' +
                buildPreviewNotes(card);
        }

        if (cardType === 'highlight') {
            var highlightItem = items[0] || {};
            return '<div class="preview-highlight">' +
                '<div class="preview-highlight-value">' + escapeHtml(highlightItem.value || previewFallbacks.blankValue) + '<\/div>' +
                '<div class="preview-highlight-label">' + escapeHtml(highlightItem.label || previewFallbacks.detailValue) + '<\/div>' +
                '<\/div>' +
                buildPreviewNotes(card);
        }

        if (cardType === 'stat') {
            var statMarkup = (items.length ? items : [{ label: previewFallbacks.metricLabel, value: previewFallbacks.blankValue }]).map(function (item) {
                return '<div class="preview-stat">' +
                    '<div class="preview-stat-label">' + escapeHtml(item.label || previewFallbacks.metricLabel) + '<\/div>' +
                    '<div class="preview-stat-value">' + escapeHtml(item.value || previewFallbacks.blankValue) + '<\/div>' +
                    '<\/div>';
            }).join('');
            return '<div class="preview-stats">' + statMarkup + '<\/div>' + buildPreviewNotes(card);
        }

        if (cardType === 'simple_list') {
            var simpleMarkup = (items.length ? items : [{ value: previewFallbacks.listItem }]).map(function (item) {
                return '<li class="preview-simple-row"><span>' + escapeHtml(item.value || item.label || previewFallbacks.listItem) + '<\/span><\/li>';
            }).join('');
            return '<ul class="preview-simple-list">' + simpleMarkup + '<\/ul>' + buildPreviewNotes(card);
        }

        var detailMarkup = (items.length ? items : [{ label: previewFallbacks.detailLabel, value: previewFallbacks.detailValue }]).map(function (item) {
            return '<li class="preview-detail-row"><span class="preview-detail-label">' + escapeHtml(item.label || previewFallbacks.detailLabel) + '<\/span><span class="preview-detail-value">' + escapeHtml(item.value || previewFallbacks.detailValue) + '<\/span><\/li>';
        }).join('');
        return '<ul class="preview-detail-list">' + detailMarkup + '<\/ul>' + buildPreviewNotes(card);
    }

    function buildPreviewMarkup(card) {
        return '<article class="preview-card">' +
            '<header class="preview-header">' +
            buildPreviewIcon(card) +
            '<div class="preview-title-wrap">' +
            '<span class="preview-type">' + escapeHtml(getPreviewTypeLabel(card.cardType)) + '<\/span>' +
            '<h2 class="preview-title">' + escapeHtml(card.title || getI18n('unsavedCardFallback', 'Unsaved card')) + '<\/h2>' +
            '<\/div>' +
            '<\/header>' +
            '<div class="preview-body">' + buildPreviewBody(card) + '<\/div>' +
            '<\/article>';
    }

    function renderPreview() {
        var entry = getCurrentEntry();
        var iframe = ui.previewFrame.get(0);
        if (!iframe || !iframe.contentWindow || !data.previewReady) return;
        var root = iframe.contentDocument && iframe.contentDocument.getElementById('card-preview-root');
        if (!root) return;
        if (!entry) {
            root.className = 'preview-empty';
            root.innerHTML = escapeHtml(getI18n('previewEmpty', 'Select or create a card to preview it.'));
            return;
        }
        root.className = '';
        root.innerHTML = buildPreviewMarkup(entry.card);
        resizePreviewFrame();
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function bindEvents() {
        ui.cardSelect.on('change', function () {
            if (data.workspaceOpen) {
                persistFormToCurrent();
            }
            var nextIndex = Number($(this).val());
            if (!Number.isFinite(nextIndex) || nextIndex < 0 || nextIndex >= data.cards.length) {
                return;
            }
            openCardByIndex(nextIndex);
            hideStatus();
        });

        ui.cardType.on('change', function () {
            var entry = getCurrentEntry();
            if (!entry) return;
            var type = $(this).val();
            var defaults = defaultCardForType(type);
            entry.card.cardType = type;
            entry.card.items = defaults.items;
            entry.card.imageUrl = defaults.imageUrl || '';
            entry.card.imageLink = defaults.imageLink || '';
            entry.card.imageOverlayText = defaults.imageOverlayText || '';
            entry.card.imageSize = defaults.imageSize || 'standard';
            renderDynamicFields(entry.card);
            persistFormToCurrent();
        });

        ui.title.on('input', persistFormToCurrent);
        ui.icon.on('input', persistFormToCurrent);
        ui.noteMode.on('change', persistFormToCurrent);
        ui.noteTitle.on('input', persistFormToCurrent);
        ui.notes.on('input', persistFormToCurrent);
        ui.noteToggle.on('click', function () {
            setNoteFieldsExpanded(ui.noteFields.prop('hidden'));
        });

        ui.btnSave.on('click', saveCurrentCard);
        ui.btnDelete.on('click', deleteCurrentCard);
        ui.btnDuplicate.on('click', duplicateCurrentCard);
        ui.btnReset.on('click', resetCurrentCardDefaults);
        ui.btnNew.on('click', newCard);
        ui.btnClose.on('click', closeWorkspace);
        ui.btnApplyJson.on('click', applyJsonToForm);

        ui.btnIconOpen.on('click', openIconPicker);
        ui.btnIconClose.on('click', closeIconPicker);
        ui.btnIconMedia.on('click', openMediaLibraryPicker);
        ui.iconSearch.on('input', function () { renderIconGrid($(this).val()); });
        ui.iconGrid.on('click', '.lrsd-sf-icon-option', function () {
            ui.icon.val($(this).data('icon'));
            closeIconPicker();
            persistFormToCurrent();
        });
        ui.iconModal.on('click', function (event) {
            if (event.target === ui.iconModal.get(0)) {
                closeIconPicker();
            }
        });

        ui.cardList.on('click', '.lrsd-sf-card-open, .lrsd-sf-card-edit-inline', function () {
            if (data.workspaceOpen) {
                persistFormToCurrent();
            }
            openCardByIndex(Number($(this).data('index')));
            hideStatus();
        });

        ui.cardList.on('click', '.lrsd-sf-card-delete-inline', function () {
            deleteCardByIndex(Number($(this).data('index')));
        });
    }

    $(function () {
        ui.cardSelect = $('#lrsd-sf-card-select');
        ui.btnNew = $('#lrsd-sf-card-new');
        ui.btnDuplicate = $('#lrsd-sf-card-duplicate');
        ui.btnReset = $('#lrsd-sf-card-reset');
        ui.btnDelete = $('#lrsd-sf-card-delete');
        ui.btnSave = $('.lrsd-sf-card-save-action');
        ui.btnClose = $('#lrsd-sf-card-close, .lrsd-sf-card-close-action');
        ui.status = $('#lrsd-sf-card-status');
        ui.workspace = $('#lrsd-sf-card-workspace');
        ui.cardList = $('#lrsd-sf-card-list');
        ui.title = $('#lrsd-sf-card-title');
        ui.cardType = $('#lrsd-sf-card-type');
        ui.icon = $('#lrsd-sf-card-icon');
        ui.noteToggle = $('#lrsd-sf-note-toggle');
        ui.noteFields = $('#lrsd-sf-note-fields');
        ui.noteMode = $('#lrsd-sf-card-note-mode');
        ui.noteTitle = $('#lrsd-sf-card-note-title');
        ui.notes = $('#lrsd-sf-card-notes');
        ui.dynamicFields = $('#lrsd-sf-card-dynamic-fields');
        ui.json = $('#lrsd-sf-card-json');
        ui.btnApplyJson = $('#lrsd-sf-apply-json');
        ui.previewFrame = $('#lrsd-sf-card-preview-frame');
        ui.iconModal = $('#lrsd-sf-icon-picker-modal');
        ui.btnIconOpen = $('#lrsd-sf-icon-picker-open');
        ui.btnIconClose = $('#lrsd-sf-icon-picker-close');
        ui.btnIconMedia = $('#lrsd-sf-icon-media-library');
        ui.iconSearch = $('#lrsd-sf-icon-search');
        ui.iconGrid = $('#lrsd-sf-icon-grid');

        bindEvents();
        loadCardData();
    });
})(jQuery);
