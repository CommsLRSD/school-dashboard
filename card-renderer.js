(function (window) {
  'use strict';

  function sanitizeHTML(str) {
    if (str === null || str === undefined) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function createFlippableCard(cardClasses, frontContent, backTitle, backIcon, backContent, infoType) {
    var backContentHTML = Array.isArray(backContent)
      ? backContent.map(function (p) { return '<p>' + p + '</p>'; }).join('')
      : '<p>' + backContent + '</p>';

    return '<div class="data-card ' + cardClasses + '" data-flippable="true" data-info-type="' + infoType + '">' +
      '<div class="card-flip-container">' +
        '<div class="card-face card-face-front">' + frontContent + '</div>' +
        '<div class="card-face card-face-back">' +
          '<div class="card-back-header">' +
            '<div class="card-back-title-wrapper">' +
              '<img src="' + backIcon + '" alt="" class="card-back-icon">' +
              '<h3 class="card-back-title">' + backTitle + '</h3>' +
            '</div>' +
            '<button class="card-back-close" aria-label="Close information">' +
              '<img src="public/icon/lightbox-close.svg" alt="" class="card-back-close-icon">' +
            '</button>' +
          '</div>' +
          '<div class="card-back-content">' + backContentHTML + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderCustomCardHtml(template, schoolValues, sizeClass) {
    var iconSrc = template.icon || 'public/icon/details.svg';
    var title = sanitizeHTML(template.title || 'Custom Card');
    var rawType = template.cardType || 'details_list';
    // Backward compatibility for legacy imported custom cards that stored cardType "list"
    // before the explicit registry normalized this to "details_list".
    // Keep this mapping indefinitely because existing historical JSON exports can still include it.
    var cardType = rawType === 'list' ? 'details_list' : rawType;
    var noteMode = template.noteMode === 'flip' ? 'flip' : 'inline';
    var noteTitle = sanitizeHTML(template.noteTitle || ((template.title || 'Custom Card') + ' Note'));

    var items = Array.isArray(template.items) ? template.items.map(function (item) {
      return {
        label: item.label || '',
        value: item.value || '',
        valueType: item.valueType || 'text',
        options: Array.isArray(item.options) ? item.options : [],
      };
    }) : [];

    if (schoolValues && Array.isArray(schoolValues.items) && schoolValues.items.length > 0) {
      var valMap = {};
      schoolValues.items.forEach(function (si) {
        valMap[si.label || ''] = si.value || '';
      });
      items = items.map(function (ti) {
        var key = ti.label || '';
        return {
          label: key,
          value: Object.prototype.hasOwnProperty.call(valMap, key) ? valMap[key] : (ti.value || ''),
          valueType: ti.valueType || 'text',
          options: ti.options || [],
        };
      });
    }

    var notesText = (schoolValues && schoolValues.notes) ? schoolValues.notes : (template.notes || '');
    var notesInlineHtml = notesText && noteMode !== 'flip'
      ? '<div class="tile-footnote-static">' + sanitizeHTML(notesText) + '</div>'
      : '';
    var noteButton = notesText && noteMode === 'flip'
      ? '<button class="info-icon-btn" data-info-type="' + sanitizeHTML(template.id || template.title || 'custom-card') + '" aria-label="Show note information"><img src="public/icon/info.svg" alt=""></button>'
      : '';
    var noteBackHtml = sanitizeHTML(notesText || '').replace(/\n/g, '<br>');
    var infoType = sanitizeHTML(template.id || template.title || 'custom-card');

    if (cardType === 'image') {
      var imageUrl = sanitizeHTML((schoolValues && schoolValues.imageUrl) || template.imageUrl || '');
      var overlayText = sanitizeHTML((schoolValues && schoolValues.imageOverlayText) || template.imageOverlayText || '');
      var imageLink = sanitizeHTML((schoolValues && schoolValues.imageLink) || template.imageLink || '');
      var imageAlt = overlayText || title;
      var imageBody = imageUrl
        ? '<img src="' + imageUrl + '" alt="' + imageAlt + '" class="custom-image-card-image">'
        : '<div class="custom-image-card-placeholder">No image added.</div>';
      var imageContent =
        '<div class="card-header"><img src="' + iconSrc + '" alt="" class="card-header-icon"><h2 class="card-title">' + title + '</h2></div>' +
        '<div class="card-body"><div class="custom-image-card-frame ' + (template.imageSize === 'wide' ? 'custom-image-card-frame--wide' : '') + '">' +
        (imageLink ? '<a href="' + imageLink + '" class="custom-image-card-link">' : '') + imageBody +
        (overlayText ? '<div class="custom-image-card-overlay">' + overlayText + '</div>' : '') +
        (imageLink ? '</a>' : '') + '</div>' + noteButton + notesInlineHtml + '</div>';
      var imageClass = ('list-card custom-image-card ' + (sizeClass || '') + ' ' + (template.imageSize === 'wide' ? 'tile-double-width' : '')).trim();
      return notesText && noteMode === 'flip'
        ? createFlippableCard(imageClass, imageContent, noteTitle, iconSrc, noteBackHtml, infoType)
        : '<div class="data-card ' + imageClass + '">' + imageContent + '</div>';
    }

    if (cardType === 'highlight') {
      var highlightItem = items[0] || {};
      var frontHighlight =
        '<div class="card-header"><img src="' + iconSrc + '" alt="" class="card-header-icon"><h2 class="card-title">' + title + '</h2></div>' +
        '<div class="card-body"><div class="stat-value">' + sanitizeHTML(highlightItem.value || '—') + '</div><div class="stat-label">' + sanitizeHTML(highlightItem.label || '') + '</div>' + noteButton + notesInlineHtml + '</div>';
      return notesText && noteMode === 'flip'
        ? createFlippableCard('stat-card ' + (sizeClass || ''), frontHighlight, noteTitle, iconSrc, noteBackHtml, infoType)
        : '<div class="data-card stat-card ' + (sizeClass || '') + '">' + frontHighlight + '</div>';
    }

    if (cardType === 'stat') {
      var statItems = items.map(function (it) {
        return '<div class="stat-item"><div class="stat-item-label">' + sanitizeHTML(it.label || '') + '</div><div class="stat-item-value">' + sanitizeHTML(it.value || '—') + '</div></div>';
      }).join('') || '<div class="stat-item"><div class="stat-item-value">—</div></div>';
      var frontStat =
        '<div class="card-header"><img src="' + iconSrc + '" alt="" class="card-header-icon"><h2 class="card-title">' + title + '</h2></div>' +
        '<div class="card-body"><div class="stats-grid">' + statItems + '</div>' + noteButton + notesInlineHtml + '</div>';
      return notesText && noteMode === 'flip'
        ? createFlippableCard('stat-card ' + (sizeClass || ''), frontStat, noteTitle, iconSrc, noteBackHtml, infoType)
        : '<div class="data-card stat-card ' + (sizeClass || '') + '">' + frontStat + '</div>';
    }

    if (cardType === 'simple_list') {
      var listValues = items.map(function (it) { return sanitizeHTML(it.value || it.label || ''); }).filter(Boolean);
      var markup = listValues.length
        ? listValues.map(function (it) {
          return '<li class="detail-item detail-item-single"><span class="detail-label detail-label-full">' + it + '</span></li>';
        }).join('')
        : '<li class="detail-item">No data available.</li>';
      var frontSimple =
        '<div class="card-header"><img src="' + iconSrc + '" alt="" class="card-header-icon"><h2 class="card-title">' + title + '</h2></div>' +
        '<div class="card-body"><ul class="detail-list">' + markup + '</ul>' + noteButton + notesInlineHtml + '</div>';
      return notesText && noteMode === 'flip'
        ? createFlippableCard('list-card ' + (sizeClass || ''), frontSimple, noteTitle, iconSrc, noteBackHtml, infoType)
        : '<div class="data-card list-card ' + (sizeClass || '') + '">' + frontSimple + '</div>';
    }

    var listItems = items.map(function (it) {
      return '<li class="detail-item"><span class="detail-label">' + sanitizeHTML(it.label || '') + '</span><span class="detail-value">' + sanitizeHTML(it.value || '') + '</span></li>';
    }).join('') || '<li class="detail-item">No data available.</li>';
    var frontDetails =
      '<div class="card-header"><img src="' + iconSrc + '" alt="" class="card-header-icon"><h2 class="card-title">' + title + '</h2></div>' +
      '<div class="card-body"><ul class="detail-list">' + listItems + '</ul>' + noteButton + notesInlineHtml + '</div>';
    return notesText && noteMode === 'flip'
      ? createFlippableCard('list-card ' + (sizeClass || ''), frontDetails, noteTitle, iconSrc, noteBackHtml, infoType)
      : '<div class="data-card list-card ' + (sizeClass || '') + '">' + frontDetails + '</div>';
  }

  window.LrsdCardRenderer = {
    renderCustomCardHtml: renderCustomCardHtml,
  };
})(window);
