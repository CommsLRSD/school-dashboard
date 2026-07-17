/* global lrsdSfCardCreator */
(function ($) {
    'use strict';

    if (typeof lrsdSfCardCreator === 'undefined') {
        return;
    }

    var data = {
        registry: {},
        icons: [],
        schools: [],
        cards: [],
        currentIndex: -1,
    };

    var ui = {};

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
                assignment: { scope: 'global', schoolIds: [] },
                previousAssignment: { scope: 'global', schoolIds: [] },
                conflict: false,
            });
        });
        (state.schoolCards || []).forEach(function (entry) {
            cards.push({
                card: $.extend(true, {}, entry.card || {}),
                assignment: { scope: 'school', schoolIds: (entry.schoolIds || []).slice() },
                previousAssignment: { scope: 'school', schoolIds: (entry.schoolIds || []).slice() },
                conflict: !!entry.conflict,
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
            data.schools = response.data.schools || [];
            data.cards = toEditableCards(response.data.state || {});
            if (!data.cards.length) {
                var firstType = Object.keys(data.registry)[0] || 'details_list';
                data.cards.push({
                    card: defaultCardForType(firstType),
                    assignment: { scope: 'global', schoolIds: [] },
                    previousAssignment: { scope: '', schoolIds: [] },
                    conflict: false,
                });
            }
            data.currentIndex = 0;
            renderTypeOptions();
            renderSchoolOptions();
            renderCardOptions();
            selectCurrentCard();
            initPreviewFrame();
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

    function renderSchoolOptions() {
        var options = data.schools.map(function (school) {
            return '<option value="' + escapeHtml(school.id) + '">' + escapeHtml(school.name) + '</option>';
        }).join('');
        ui.schoolSelect.html(options);
    }

    function cardDisplayLabel(entry) {
        var card = entry.card || {};
        var base = card.title || card.id || getI18n('unsavedCardFallback', 'Unsaved card');
        var scope = entry.assignment.scope === 'school' ? getI18n('schoolLabel', 'School-specific') : getI18n('globalLabel', 'Global');
        return base + ' (' + scope + ')';
    }

    function renderCardOptions() {
        var options = data.cards.map(function (entry, index) {
            var selected = (index === data.currentIndex) ? ' selected' : '';
            var conflict = entry.conflict ? ' ⚠' : '';
            return '<option value="' + index + '"' + selected + '>' + cardDisplayLabel(entry) + conflict + '</option>';
        }).join('');
        ui.cardSelect.html(options);
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
        // If the card's icon is a full URL (media library pick) not yet in the registry, add it
        if (card.icon && isAbsoluteUrl(card.icon) && $.inArray(card.icon, data.icons) === -1) {
            data.icons.unshift(card.icon);
        }
        ui.cardSelect.val(String(data.currentIndex));
        ui.title.val(card.title || '');
        ui.cardType.val(card.cardType || Object.keys(data.registry)[0] || 'details_list');
        ui.icon.val(card.icon || '');
        ui.noteMode.val(card.noteMode || 'inline');
        ui.noteTitle.val(card.noteTitle || '');
        ui.notes.val(card.notes || '');
        ui.scope.filter('[value="' + entry.assignment.scope + '"]').prop('checked', true);
        ui.schoolWrap.toggle(entry.assignment.scope === 'school');
        ui.schoolSelect.val(entry.assignment.schoolIds || []);
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

        var scope = ui.scope.filter(':checked').val() || 'global';
        entry.assignment.scope = scope;
        entry.assignment.schoolIds = scope === 'school' ? (ui.schoolSelect.val() || []) : [];

        if (card.cardType === 'image') {
            card.imageUrl = $('#lrsd-sf-card-image-url').val() || '';
            card.imageLink = $('#lrsd-sf-card-image-link').val() || '';
            card.imageOverlayText = $('#lrsd-sf-card-image-overlay').val() || '';
            card.imageSize = $('#lrsd-sf-card-image-size').val() || 'standard';
            card.items = [];
        } else {
            card.items = [];
            ui.dynamicFields.find('.lrsd-sf-item-row').each(function () {
                var $row = $(this);
                var label = ($row.find('.lrsd-sf-item-label').val() || '').trim();
                var value = ($row.find('.lrsd-sf-item-value').val() || '').trim();
                if (!label && !value) {
                    return;
                }
                card.items.push({ label: label, value: value });
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
                '<div class="lrsd-sf-form-row"><label for="lrsd-sf-card-image-url">Image URL</label><input type="text" id="lrsd-sf-card-image-url" class="regular-text" value="' + escapeHtml(card.imageUrl || '') + '"></div>' +
                '<div class="lrsd-sf-form-row"><label for="lrsd-sf-card-image-link">Image Link (optional)</label><input type="text" id="lrsd-sf-card-image-link" class="regular-text" value="' + escapeHtml(card.imageLink || '') + '"></div>' +
                '<div class="lrsd-sf-form-row"><label for="lrsd-sf-card-image-overlay">Overlay Text</label><input type="text" id="lrsd-sf-card-image-overlay" class="regular-text" maxlength="' + (limits.maxOverlayLength || 90) + '" value="' + escapeHtml(card.imageOverlayText || '') + '"></div>' +
                '<div class="lrsd-sf-form-row"><label for="lrsd-sf-card-image-size">Image Size</label><select id="lrsd-sf-card-image-size"><option value="standard">Standard</option><option value="wide">Wide</option></select></div>';
            ui.dynamicFields.html(imageHtml);
            $('#lrsd-sf-card-image-size').val(card.imageSize || 'standard');
            ui.dynamicFields.find('input,select').on('input change', persistFormToCurrent);
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
            var showLabel = cardType !== 'simple_list';
            return '<div class="lrsd-sf-item-row" data-index="' + idx + '">' +
                (showLabel ? '<input type="text" class="regular-text lrsd-sf-item-label" maxlength="' + (limits.maxLabelLength || 60) + '" placeholder="Label" value="' + escapeHtml(item.label || '') + '">' : '<input type="hidden" class="lrsd-sf-item-label" value="">') +
                '<input type="text" class="regular-text lrsd-sf-item-value" maxlength="' + (limits.maxValueLength || 120) + '" placeholder="' + (showLabel ? 'Value' : 'Item text') + '" value="' + escapeHtml(item.value || '') + '">' +
                '<button type="button" class="button lrsd-sf-item-up">↑</button>' +
                '<button type="button" class="button lrsd-sf-item-down">↓</button>' +
                '<button type="button" class="button lrsd-sf-item-remove">✕</button>' +
            '</div>';
        }

        function refreshRows() {
            var html = items.map(rowHtml).join('');
            $('#lrsd-sf-item-rows').html(html);
            $('#lrsd-sf-item-rows').find('input').on('input', function () {
                var $row = $(this).closest('.lrsd-sf-item-row');
                var idx = Number($row.data('index'));
                items[idx] = {
                    label: $row.find('.lrsd-sf-item-label').val() || '',
                    value: $row.find('.lrsd-sf-item-value').val() || '',
                };
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
        if (entry.assignment.scope === 'school' && !(entry.assignment.schoolIds || []).length) {
            return getI18n('schoolRequired', 'Select at least one school.');
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
                assignment: entry.assignment,
                previousAssignment: entry.previousAssignment || { scope: '', schoolIds: [] },
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
            selectCurrentCard();
            showStatus(response.data.message || getI18n('saveSuccess', 'Card saved.'), 'success');
        }).fail(function () {
            showStatus(getI18n('saveError', 'Could not save card.'), 'error');
        });
    }

    function deleteCurrentCard() {
        var entry = getCurrentEntry();
        if (!entry) return;
        if (!window.confirm(getI18n('deleteConfirm', 'Delete this card?'))) {
            return;
        }
        $.post(lrsdSfCardCreator.ajaxUrl, {
            action: 'lrsd_sf_card_creator_delete',
            nonce: lrsdSfCardCreator.nonce,
            payload: JSON.stringify({
                cardId: entry.card.id,
                assignment: entry.assignment,
            }),
        }).done(function (response) {
            if (!response || !response.success) {
                showStatus((response && response.data && response.data.message) || getI18n('deleteFailed', 'Delete failed.'), 'error');
                return;
            }
            data.cards = toEditableCards(response.data.state || {});
            if (!data.cards.length) {
                var firstType = Object.keys(data.registry)[0] || 'details_list';
                data.cards.push({
                    card: defaultCardForType(firstType),
                    assignment: { scope: 'global', schoolIds: [] },
                    previousAssignment: { scope: '', schoolIds: [] },
                    conflict: false,
                });
            }
            data.currentIndex = 0;
            renderCardOptions();
            selectCurrentCard();
            showStatus(response.data.message || getI18n('deleteSuccess', 'Card deleted.'), 'success');
        }).fail(function () {
            showStatus(getI18n('deleteFailed', 'Delete failed.'), 'error');
        });
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
        selectCurrentCard();
    }

    function newCard() {
        persistFormToCurrent();
        var type = ui.cardType.val() || Object.keys(data.registry)[0] || 'details_list';
        var nextCard = defaultCardForType(type);
        if (!nextCard.id) {
            showStatus(getI18n('secureIdRequired', 'Secure ID generation is unavailable in this browser.'), 'error');
            return;
        }
        data.cards.push({
            card: nextCard,
            assignment: { scope: 'global', schoolIds: [] },
            previousAssignment: { scope: '', schoolIds: [] },
            conflict: false,
        });
        data.currentIndex = data.cards.length - 1;
        renderCardOptions();
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

    function renderIconGrid(filterText) {
        var q = (filterText || '').toLowerCase();
        var icons = data.icons.filter(function (iconPath) {
            return !q || iconPath.toLowerCase().indexOf(q) !== -1;
        });
        var html = icons.map(function (iconPath) {
            var safePath = escapeHtml(iconPath);
            // Full URLs (media library picks) are used as-is; relative paths get siteUrl prepended
            var imgSrc = isAbsoluteUrl(iconPath) ? safePath : escapeHtml(lrsdSfCardCreator.siteUrl + iconPath);
            var label = escapeHtml(iconPath.replace(/^.*\//, '').replace(/\.[^.]+$/, ''));
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
            if ($.inArray(url, data.icons) === -1) {
                data.icons.unshift(url);
            }
            ui.icon.val(url);
            closeIconPicker();
            persistFormToCurrent();
        });
        frame.open();
    }

    function initPreviewFrame() {
        var iframeDoc = '' +
            '<!doctype html><html><head><meta charset="utf-8">' +
            '<base href="' + escapeHtml(lrsdSfCardCreator.siteUrl) + '">' +
            '<link rel="stylesheet" href="' + escapeHtml(lrsdSfCardCreator.frontendStylesUrl) + '">' +
            '<style>body{margin:0;padding:1rem;background:#f5f6f8}.card-grid{grid-template-columns:minmax(300px, 420px);grid-auto-rows:280px}.data-card{opacity:1;animation:none}</style>' +
            '</head><body><main class="card-grid" id="card-grid"></main>' +
            '<script>' + (lrsdSfCardCreator.rendererSource || '') + '</script>' +
            '<script>window.addEventListener("message",function(event){if(!event.data||event.data.type!=="render-card"){return;}var payload=event.data.payload||{};var root=document.getElementById("card-grid");if(!window.LrsdCardRenderer||!window.LrsdCardRenderer.renderCustomCardHtml){root.innerHTML="<p>Renderer unavailable.</p>";return;}root.innerHTML=window.LrsdCardRenderer.renderCustomCardHtml(payload.card||{},null,payload.sizeClass||"");});</script>' +
            '</body></html>';
        ui.previewFrame.attr('srcdoc', iframeDoc);
    }

    function getPreviewSizeClass(cardType) {
        if (['details_list'].indexOf(cardType) !== -1) return 'tile-double-height';
        if (cardType === 'image') return 'tile-double-width';
        return '';
    }

    function renderPreview() {
        var entry = getCurrentEntry();
        if (!entry) return;
        var iframe = ui.previewFrame.get(0);
        if (!iframe || !iframe.contentWindow) return;
        iframe.contentWindow.postMessage({
            type: 'render-card',
            payload: {
                card: entry.card,
                sizeClass: getPreviewSizeClass(entry.card.cardType),
            },
        }, '*');
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
            persistFormToCurrent();
            var nextIndex = Number($(this).val());
            if (!Number.isFinite(nextIndex) || nextIndex < 0 || nextIndex >= data.cards.length) {
                return;
            }
            data.currentIndex = nextIndex;
            selectCurrentCard();
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
        ui.scope.on('change', function () {
            ui.schoolWrap.toggle(ui.scope.filter(':checked').val() === 'school');
            persistFormToCurrent();
        });
        ui.schoolSelect.on('change', persistFormToCurrent);

        ui.btnSave.on('click', saveCurrentCard);
        ui.btnDelete.on('click', deleteCurrentCard);
        ui.btnDuplicate.on('click', duplicateCurrentCard);
        ui.btnReset.on('click', resetCurrentCardDefaults);
        ui.btnNew.on('click', newCard);
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
    }

    $(function () {
        ui.cardSelect = $('#lrsd-sf-card-select');
        ui.btnNew = $('#lrsd-sf-card-new');
        ui.btnDuplicate = $('#lrsd-sf-card-duplicate');
        ui.btnReset = $('#lrsd-sf-card-reset');
        ui.btnDelete = $('#lrsd-sf-card-delete');
        ui.btnSave = $('#lrsd-sf-card-save');
        ui.status = $('#lrsd-sf-card-status');
        ui.title = $('#lrsd-sf-card-title');
        ui.cardType = $('#lrsd-sf-card-type');
        ui.icon = $('#lrsd-sf-card-icon');
        ui.noteMode = $('#lrsd-sf-card-note-mode');
        ui.noteTitle = $('#lrsd-sf-card-note-title');
        ui.notes = $('#lrsd-sf-card-notes');
        ui.scope = $('input[name="lrsd_sf_card_scope"]');
        ui.schoolWrap = $('#lrsd-sf-school-picker-wrap');
        ui.schoolSelect = $('#lrsd-sf-card-schools');
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
