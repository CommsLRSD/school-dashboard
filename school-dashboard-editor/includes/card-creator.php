<?php

defined('ABSPATH') || exit;

function lrsd_sf_get_card_type_registry() {
    return [
        'details_list' => [
            'key'           => 'details_list',
            'label'         => __('Detail List', 'lrsd-school-facilities'),
            'description'   => __('Label/value rows for structured details.', 'lrsd-school-facilities'),
            'defaultValues' => [
                'title'    => __('Detail Card', 'lrsd-school-facilities'),
                'noteMode' => 'inline',
                'items'    => [
                    ['label' => __('Label', 'lrsd-school-facilities'), 'value' => __('Value', 'lrsd-school-facilities')],
                ],
            ],
            'limits' => ['maxItems' => 8, 'maxLabelLength' => 60, 'maxValueLength' => 120],
        ],
        'simple_list' => [
            'key'           => 'simple_list',
            'label'         => __('Simple List', 'lrsd-school-facilities'),
            'description'   => __('Single-column list rows.', 'lrsd-school-facilities'),
            'defaultValues' => [
                'title'    => __('List Card', 'lrsd-school-facilities'),
                'noteMode' => 'inline',
                'items'    => [
                    ['label' => '', 'value' => __('List item', 'lrsd-school-facilities')],
                ],
            ],
            'limits' => ['maxItems' => 12, 'maxValueLength' => 120],
        ],
        'highlight' => [
            'key'           => 'highlight',
            'label'         => __('Highlight Stat', 'lrsd-school-facilities'),
            'description'   => __('One large value and a label.', 'lrsd-school-facilities'),
            'defaultValues' => [
                'title'    => __('Highlight', 'lrsd-school-facilities'),
                'noteMode' => 'inline',
                'items'    => [
                    ['label' => __('Label', 'lrsd-school-facilities'), 'value' => '—'],
                ],
            ],
            'limits' => ['maxItems' => 1, 'maxLabelLength' => 60, 'maxValueLength' => 40],
        ],
        'stat' => [
            'key'           => 'stat',
            'label'         => __('Stats Grid', 'lrsd-school-facilities'),
            'description'   => __('Multi-stat KPI card.', 'lrsd-school-facilities'),
            'defaultValues' => [
                'title'    => __('Stats', 'lrsd-school-facilities'),
                'noteMode' => 'inline',
                'items'    => [
                    ['label' => __('Metric', 'lrsd-school-facilities'), 'value' => '—'],
                    ['label' => __('Metric', 'lrsd-school-facilities'), 'value' => '—'],
                ],
            ],
            'limits' => ['maxItems' => 4, 'maxLabelLength' => 60, 'maxValueLength' => 40],
        ],
        'image' => [
            'key'           => 'image',
            'label'         => __('Image Feature', 'lrsd-school-facilities'),
            'description'   => __('Image card with optional overlay and link.', 'lrsd-school-facilities'),
            'defaultValues' => [
                'title'            => __('Image Card', 'lrsd-school-facilities'),
                'noteMode'         => 'inline',
                'imageUrl'         => '',
                'imageLink'        => '',
                'imageOverlayText' => '',
                'imageSize'        => 'standard',
                'items'            => [],
            ],
            'limits' => ['maxOverlayLength' => 90],
        ],
    ];
}

function lrsd_sf_card_creator_generate_id() {
    return 'custom_' . sanitize_key((string) wp_generate_uuid4());
}

function lrsd_sf_get_card_creator_icon_registry() {
    $defaults = [
        'public/icon/details.svg',
        'public/icon/additions.svg',
        'public/icon/enrolment.svg',
        'public/icon/capacity.svg',
        'public/icon/utilization.svg',
        'public/icon/enrolment-charts.svg',
        'public/icon/building-systems.svg',
        'public/icon/accessibility.svg',
        'public/icon/playground.svg',
        'public/icon/play-structure.svg',
        'public/icon/transportation.svg',
        'public/icon/childcare.svg',
        'public/icon/catchment-map.svg',
        'public/icon/provincial-funded.svg',
        'public/icon/local-funded.svg',
        'public/icon/soccer.svg',
        'public/icon/baseball.svg',
        'public/icon/basketball.svg',
        'public/icon/volleyball.svg',
        'public/icon/slide.svg',
        'public/icon/climbing.svg',
        'public/icon/nature.svg',
        'public/icon/info.svg',
    ];

    $icon_dirs = [
        dirname(LRSD_SF_PLUGIN_DIR) . '/public/icon',
        dirname(LRSD_SF_PLUGIN_DIR, 2) . '/public/icon',
    ];
    foreach ($icon_dirs as $icons_dir) {
        if (!is_dir($icons_dir)) {
            continue;
        }
        $files = glob($icons_dir . '/*.svg');
        if (is_array($files)) {
            foreach ($files as $file) {
                $defaults[] = 'public/icon/' . basename($file);
            }
        }
        break;
    }

    $defaults = array_values(array_unique(array_filter($defaults, 'is_string')));
    sort($defaults);

    return $defaults;
}

function lrsd_sf_get_card_creator_school_rows() {
    $rows  = [];
    $posts = lrsd_sf_get_editable_school_posts();

    foreach ($posts as $post) {
        $school_id = sanitize_text_field((string) get_post_meta($post->ID, 'lrsd_school_id', true));
        if ($school_id === '' || lrsd_sf_is_reserved_dataset_key($school_id)) {
            continue;
        }

        $school_data = lrsd_sf_normalize_school_data(get_post_meta($post->ID, 'lrsd_school_data', true));
        $name = trim((string) ($school_data['schoolName'] ?? $post->post_title));
        if ($name === '') {
            $name = $school_id;
        }

        $rows[] = [
            'postId' => (int) $post->ID,
            'id'     => $school_id,
            'name'   => $name,
        ];
    }

    return $rows;
}

function lrsd_sf_get_card_creator_cards_state() {
    $global_cards = lrsd_sf_get_global_custom_cards();
    $schools      = lrsd_sf_get_card_creator_school_rows();
    $school_cards = [];

    foreach ($schools as $school_row) {
        $school_data = lrsd_sf_normalize_school_data(get_post_meta($school_row['postId'], 'lrsd_school_data', true));
        $cards       = isset($school_data['customCards']) && is_array($school_data['customCards']) ? $school_data['customCards'] : [];

        foreach ($cards as $card) {
            $card_id = sanitize_key((string) ($card['id'] ?? ''));
            if ($card_id === '') {
                continue;
            }

            if (!isset($school_cards[$card_id])) {
                $school_cards[$card_id] = [
                    'card'      => $card,
                    'schoolIds' => [],
                    'conflict'  => false,
                ];
            } else {
                $existing = wp_json_encode($school_cards[$card_id]['card']);
                $incoming = wp_json_encode($card);
                if ($existing !== $incoming) {
                    $school_cards[$card_id]['conflict'] = true;
                }
            }

            $school_cards[$card_id]['schoolIds'][] = $school_row['id'];
        }
    }

    $school_cards = array_values(array_map(static function ($entry) {
        $entry['schoolIds'] = array_values(array_unique($entry['schoolIds']));
        sort($entry['schoolIds']);
        return $entry;
    }, $school_cards));

    usort($school_cards, static function ($a, $b) {
        $title_a = strtolower((string) ($a['card']['title'] ?? $a['card']['id'] ?? ''));
        $title_b = strtolower((string) ($b['card']['title'] ?? $b['card']['id'] ?? ''));
        return strcmp($title_a, $title_b);
    });

    return [
        'globalCards' => array_values($global_cards),
        'schoolCards' => $school_cards,
    ];
}

function lrsd_sf_card_creator_find_school_post($school_id) {
    return lrsd_sf_find_school_post_by_id($school_id);
}

function lrsd_sf_card_creator_upsert_card(array $cards, array $card) {
    $card_id = sanitize_key((string) ($card['id'] ?? ''));
    if ($card_id === '') {
        return $cards;
    }

    $updated = false;
    foreach ($cards as $index => $existing) {
        if (sanitize_key((string) ($existing['id'] ?? '')) === $card_id) {
            $cards[$index] = $card;
            $updated = true;
            break;
        }
    }

    if (!$updated) {
        $cards[] = $card;
    }

    return array_values($cards);
}

function lrsd_sf_card_creator_remove_card(array $cards, $card_id) {
    $card_id = sanitize_key((string) $card_id);
    if ($card_id === '') {
        return $cards;
    }

    return array_values(array_filter($cards, static function ($card) use ($card_id) {
        return sanitize_key((string) ($card['id'] ?? '')) !== $card_id;
    }));
}

function lrsd_sf_card_creator_apply_card_order(array $school_data, $card_id, $should_have) {
    $card_id    = sanitize_key((string) $card_id);
    $card_order = isset($school_data['cardOrder']) && is_array($school_data['cardOrder']) ? $school_data['cardOrder'] : [];
    $card_order = array_values(array_filter(array_map(static function ($id) {
        return sanitize_key((string) $id);
    }, $card_order)));

    if ($card_id === '') {
        return $school_data;
    }

    if ($should_have) {
        if (!in_array($card_id, $card_order, true)) {
            $card_order[] = $card_id;
        }
    } else {
        $card_order = array_values(array_filter($card_order, static function ($id) use ($card_id) {
            return $id !== $card_id;
        }));
    }

    $school_data['cardOrder'] = $card_order;
    return $school_data;
}

function lrsd_sf_card_creator_normalize_media_url($url) {
    $url = esc_url_raw((string) $url);
    if ($url === '') {
        return '';
    }

    $parts = wp_parse_url($url);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        return '';
    }
    if (!in_array(strtolower((string) $parts['scheme']), ['http', 'https'], true)) {
        return '';
    }

    $normalized = $parts['scheme'] . '://' . $parts['host'];
    if (!empty($parts['port'])) {
        $normalized .= ':' . (int) $parts['port'];
    }
    $normalized .= $parts['path'] ?? '';

    return $normalized;
}

function lrsd_sf_card_creator_get_attachment_id_from_url($url) {
    $normalized_url = lrsd_sf_card_creator_normalize_media_url($url);
    if ($normalized_url === '') {
        return 0;
    }

    $attachment_id = attachment_url_to_postid($normalized_url);
    if ($attachment_id > 0) {
        return (int) $attachment_id;
    }

    $uploads = wp_get_upload_dir();
    $baseurl = isset($uploads['baseurl']) ? untrailingslashit((string) $uploads['baseurl']) : '';
    $url_parts = wp_parse_url($normalized_url);
    $base_parts = wp_parse_url($baseurl);
    $url_path = is_array($url_parts) ? (string) ($url_parts['path'] ?? '') : '';
    $base_path = is_array($base_parts) ? (string) ($base_parts['path'] ?? '') : '';
    $base_path = $base_path === '' ? '' : trailingslashit(untrailingslashit($base_path));

    if (
        $baseurl !== '' &&
        is_array($url_parts) &&
        is_array($base_parts) &&
        !empty($url_parts['host']) &&
        !empty($base_parts['host']) &&
        strtolower((string) $url_parts['host']) === strtolower((string) $base_parts['host']) &&
        $base_path !== '' &&
        strpos($url_path, $base_path) === 0
    ) {
        $relative_path = ltrim(substr($url_path, strlen($base_path)), '/');
        $relative_path = wp_normalize_path(rawurldecode($relative_path));

        if ($relative_path !== '' && validate_file($relative_path) === 0) {
            $filetype = wp_check_filetype($relative_path);
            if (($filetype['ext'] ?? '') !== 'svg' || ($filetype['type'] ?? '') !== 'image/svg+xml') {
                return 0;
            }

            $attachments = get_posts([
                'post_type'      => 'attachment',
                'fields'         => 'ids',
                'posts_per_page' => 1,
                'no_found_rows'  => true,
                'meta_key'       => '_wp_attached_file',
                'meta_value'     => $relative_path,
            ]);

            if (!empty($attachments[0])) {
                return (int) $attachments[0];
            }
        }
    }

    return 0;
}

function lrsd_sf_is_media_library_icon($url) {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }

    $normalized_url = lrsd_sf_card_creator_normalize_media_url($url);
    if ($normalized_url === '') {
        return false;
    }

    $site_host = wp_parse_url(home_url(), PHP_URL_HOST);
    $icon_host = wp_parse_url($normalized_url, PHP_URL_HOST);
    if (!$site_host || !$icon_host || strtolower((string) $site_host) !== strtolower((string) $icon_host)) {
        return false;
    }

    return lrsd_sf_card_creator_get_attachment_id_from_url($normalized_url) > 0;
}

function lrsd_sf_card_creator_validate_card_type($card_type, array $registry) {
    $card_type = sanitize_key((string) $card_type);
    return isset($registry[$card_type]) ? $card_type : '';
}

function lrsd_sf_card_creator_sanitize_card(array $raw_card, array $registry, array $icons) {
    $card_type = lrsd_sf_card_creator_validate_card_type($raw_card['cardType'] ?? '', $registry);
    if ($card_type === '') {
        return new WP_Error('invalid_card_type', __('Invalid card type selected.', 'lrsd-school-facilities'));
    }

    $card_id = sanitize_key((string) ($raw_card['id'] ?? ''));
    if ($card_id === '') {
        $card_id = lrsd_sf_card_creator_generate_id();
    }
    if ($card_id === 'custom_') {
        $card_id = lrsd_sf_card_creator_generate_id();
    } elseif (strpos($card_id, 'custom_') !== 0) {
        $card_id = 'custom_' . trim($card_id, '_');
    }

    $title = sanitize_text_field((string) ($raw_card['title'] ?? ''));
    if ($title === '') {
        return new WP_Error('missing_title', __('Card title is required.', 'lrsd-school-facilities'));
    }

    $icon_raw = (string) ($raw_card['icon'] ?? '');
    // Validate icon: either a registered registry path or a valid media library attachment URL
    if (filter_var($icon_raw, FILTER_VALIDATE_URL)) {
        // Full URL — must be a valid attachment from this site's media library
        $icon = esc_url_raw($icon_raw);
        if ($icon === '' || !lrsd_sf_is_media_library_icon($icon)) {
            return new WP_Error('invalid_icon', __('Select a valid icon from the icon picker.', 'lrsd-school-facilities'));
        }
    } else {
        $icon = sanitize_text_field($icon_raw);
        if ($icon === '' || !in_array($icon, $icons, true)) {
            return new WP_Error('invalid_icon', __('Select a valid icon from the icon picker.', 'lrsd-school-facilities'));
        }
    }

    $schema      = $registry[$card_type];
    $limits      = $schema['limits'] ?? [];
    $max_items   = isset($limits['maxItems']) ? (int) $limits['maxItems'] : 8;
    $max_label   = isset($limits['maxLabelLength']) ? (int) $limits['maxLabelLength'] : 60;
    $max_value   = isset($limits['maxValueLength']) ? (int) $limits['maxValueLength'] : 120;
    $max_overlay = isset($limits['maxOverlayLength']) ? (int) $limits['maxOverlayLength'] : 90;

    $items_raw = isset($raw_card['items']) && is_array($raw_card['items']) ? $raw_card['items'] : [];
    $items     = [];
    foreach ($items_raw as $item) {
        if (!is_array($item)) {
            continue;
        }
        $label = sanitize_text_field((string) ($item['label'] ?? ''));
        $value = sanitize_text_field((string) ($item['value'] ?? ''));
        if ($label === '' && $value === '') {
            continue;
        }
        $items[] = [
            'label' => mb_substr($label, 0, $max_label),
            'value' => mb_substr($value, 0, $max_value),
        ];
    }

    if (count($items) > $max_items) {
        return new WP_Error(
            'too_many_items',
            sprintf(
                /* translators: %d: max number of rows */
                __('This card type supports up to %d rows.', 'lrsd-school-facilities'),
                $max_items
            )
        );
    }

    if (in_array($card_type, ['highlight', 'stat', 'details_list', 'simple_list'], true) && empty($items)) {
        return new WP_Error('missing_items', __('Add at least one row for this card type.', 'lrsd-school-facilities'));
    }

    $note_mode  = (($raw_card['noteMode'] ?? 'inline') === 'flip') ? 'flip' : 'inline';
    $note_title = sanitize_text_field((string) ($raw_card['noteTitle'] ?? ''));
    $notes      = sanitize_textarea_field((string) ($raw_card['notes'] ?? ''));

    $sanitized = [
        'id'       => $card_id,
        'title'    => mb_substr($title, 0, 80),
        'icon'     => $icon,
        'cardType' => $card_type,
        'noteMode' => $note_mode,
        'noteTitle' => mb_substr($note_title, 0, 80),
        'notes'    => mb_substr($notes, 0, 800),
        'items'    => array_values($items),
    ];

    if ($card_type === 'image') {
        $sanitized['imageUrl']         = esc_url_raw((string) ($raw_card['imageUrl'] ?? ''));
        $sanitized['imageLink']        = esc_url_raw((string) ($raw_card['imageLink'] ?? ''));
        $sanitized['imageOverlayText'] = mb_substr(sanitize_text_field((string) ($raw_card['imageOverlayText'] ?? '')), 0, $max_overlay);
        $sanitized['imageSize']        = (($raw_card['imageSize'] ?? 'standard') === 'wide') ? 'wide' : 'standard';
        $sanitized['items']            = [];
    }

    return $sanitized;
}

function lrsd_sf_card_creator_update_school_record($school_id, callable $mutator) {
    $post_id = lrsd_sf_card_creator_find_school_post($school_id);
    if (!$post_id) {
        return;
    }

    $school_data = lrsd_sf_normalize_school_data(get_post_meta($post_id, 'lrsd_school_data', true));
    if (!is_array($school_data)) {
        $school_data = [];
    }

    $updated_data = $mutator($school_data);
    if (!is_array($updated_data)) {
        return;
    }

    $updated_data = lrsd_sf_normalize_school_dashboard_data($updated_data, lrsd_sf_get_global_custom_cards());
    update_post_meta($post_id, 'lrsd_school_data', lrsd_sf_encode_school_data($updated_data));
}

function lrsd_sf_ajax_card_creator_load() {
    check_ajax_referer('lrsd_sf_card_creator_nonce', 'nonce');

    if (!current_user_can('edit_posts')) {
        wp_send_json_error(['message' => __('Permission denied.', 'lrsd-school-facilities')], 403);
    }

    wp_send_json_success([
        'registry' => lrsd_sf_get_card_type_registry(),
        'icons'    => lrsd_sf_get_card_creator_icon_registry(),
        'schools'  => array_map(static function ($row) {
            return ['id' => $row['id'], 'name' => $row['name']];
        }, lrsd_sf_get_card_creator_school_rows()),
        'state'    => lrsd_sf_get_card_creator_cards_state(),
    ]);
}
add_action('wp_ajax_lrsd_sf_card_creator_load', 'lrsd_sf_ajax_card_creator_load');

function lrsd_sf_ajax_card_creator_save() {
    check_ajax_referer('lrsd_sf_card_creator_nonce', 'nonce');

    if (!current_user_can('edit_posts')) {
        wp_send_json_error(['message' => __('Permission denied.', 'lrsd-school-facilities')], 403);
    }

    $payload = isset($_POST['payload']) ? json_decode(wp_unslash($_POST['payload']), true) : [];
    if (!is_array($payload)) {
        wp_send_json_error(['message' => __('Invalid payload.', 'lrsd-school-facilities')], 400);
    }

    $registry = lrsd_sf_get_card_type_registry();
    $icons    = lrsd_sf_get_card_creator_icon_registry();
    $card     = lrsd_sf_card_creator_sanitize_card((array) ($payload['card'] ?? []), $registry, $icons);
    if (is_wp_error($card)) {
        wp_send_json_error(['message' => $card->get_error_message()], 400);
    }

    $card_id = sanitize_key((string) $card['id']);
    $assignment = is_array($payload['assignment'] ?? null) ? $payload['assignment'] : [];
    $scope      = (($assignment['scope'] ?? 'global') === 'school') ? 'school' : 'global';
    $school_ids = isset($assignment['schoolIds']) && is_array($assignment['schoolIds']) ? $assignment['schoolIds'] : [];
    $school_ids = array_values(array_unique(array_filter(array_map('sanitize_text_field', $school_ids))));

    if ($scope === 'school' && empty($school_ids)) {
        wp_send_json_error(['message' => __('Select at least one school for school-specific cards.', 'lrsd-school-facilities')], 400);
    }

    $previous      = is_array($payload['previousAssignment'] ?? null) ? $payload['previousAssignment'] : [];
    $prev_scope_raw = (string) ($previous['scope'] ?? '');
    if ($prev_scope_raw === 'school') {
        $prev_scope = 'school';
    } elseif ($prev_scope_raw === 'global') {
        $prev_scope = 'global';
    } else {
        $prev_scope = '';
    }
    $prev_school_ids = isset($previous['schoolIds']) && is_array($previous['schoolIds']) ? $previous['schoolIds'] : [];
    $prev_school_ids = array_values(array_unique(array_filter(array_map('sanitize_text_field', $prev_school_ids))));

    if ($prev_scope === 'global') {
        $global_cards = lrsd_sf_get_global_custom_cards();
        $global_cards = lrsd_sf_card_creator_remove_card($global_cards, $card_id);
        update_option('lrsd_sf_global_custom_cards', $global_cards);
    }

    if ($prev_scope === 'school') {
        foreach ($prev_school_ids as $school_id) {
            lrsd_sf_card_creator_update_school_record($school_id, static function ($school_data) use ($card_id) {
                $existing_cards = isset($school_data['customCards']) && is_array($school_data['customCards']) ? $school_data['customCards'] : [];
                $school_data['customCards'] = lrsd_sf_card_creator_remove_card($existing_cards, $card_id);
                if (isset($school_data['customCardValues'][$card_id])) {
                    unset($school_data['customCardValues'][$card_id]);
                }
                return lrsd_sf_card_creator_apply_card_order($school_data, $card_id, false);
            });
        }
    }

    if ($scope === 'global') {
        $global_cards = lrsd_sf_get_global_custom_cards();
        $global_cards = lrsd_sf_card_creator_upsert_card($global_cards, $card);
        update_option('lrsd_sf_global_custom_cards', $global_cards);

        foreach (lrsd_sf_get_card_creator_school_rows() as $school_row) {
            lrsd_sf_card_creator_update_school_record($school_row['id'], static function ($school_data) use ($card_id) {
                return lrsd_sf_card_creator_apply_card_order($school_data, $card_id, true);
            });
        }
    } else {
        foreach ($school_ids as $school_id) {
            lrsd_sf_card_creator_update_school_record($school_id, static function ($school_data) use ($card, $card_id) {
                $existing_cards = isset($school_data['customCards']) && is_array($school_data['customCards']) ? $school_data['customCards'] : [];
                $school_data['customCards'] = lrsd_sf_card_creator_upsert_card($existing_cards, $card);
                return lrsd_sf_card_creator_apply_card_order($school_data, $card_id, true);
            });
        }
    }

    update_option('lrsd_schools_last_updated', wp_date('Y-m-d'));
    lrsd_sf_flush_dataset_cache();

    wp_send_json_success([
        'message' => __('Card saved successfully.', 'lrsd-school-facilities'),
        'state'   => lrsd_sf_get_card_creator_cards_state(),
    ]);
}
add_action('wp_ajax_lrsd_sf_card_creator_save', 'lrsd_sf_ajax_card_creator_save');

function lrsd_sf_ajax_card_creator_delete() {
    check_ajax_referer('lrsd_sf_card_creator_nonce', 'nonce');

    if (!current_user_can('edit_posts')) {
        wp_send_json_error(['message' => __('Permission denied.', 'lrsd-school-facilities')], 403);
    }

    $payload = isset($_POST['payload']) ? json_decode(wp_unslash($_POST['payload']), true) : [];
    if (!is_array($payload)) {
        wp_send_json_error(['message' => __('Invalid payload.', 'lrsd-school-facilities')], 400);
    }

    $card_id    = sanitize_key((string) ($payload['cardId'] ?? ''));
    $assignment = is_array($payload['assignment'] ?? null) ? $payload['assignment'] : [];
    $scope      = (($assignment['scope'] ?? 'global') === 'school') ? 'school' : 'global';
    $school_ids = isset($assignment['schoolIds']) && is_array($assignment['schoolIds']) ? $assignment['schoolIds'] : [];
    $school_ids = array_values(array_unique(array_filter(array_map('sanitize_text_field', $school_ids))));

    if ($card_id === '') {
        wp_send_json_error(['message' => __('Card ID is required.', 'lrsd-school-facilities')], 400);
    }

    if ($scope === 'global') {
        $global_cards = lrsd_sf_get_global_custom_cards();
        $global_cards = lrsd_sf_card_creator_remove_card($global_cards, $card_id);
        update_option('lrsd_sf_global_custom_cards', $global_cards);

        foreach (lrsd_sf_get_card_creator_school_rows() as $school_row) {
            lrsd_sf_card_creator_update_school_record($school_row['id'], static function ($school_data) use ($card_id) {
                if (isset($school_data['customCardValues'][$card_id])) {
                    unset($school_data['customCardValues'][$card_id]);
                }
                return lrsd_sf_card_creator_apply_card_order($school_data, $card_id, false);
            });
        }
    } else {
        foreach ($school_ids as $school_id) {
            lrsd_sf_card_creator_update_school_record($school_id, static function ($school_data) use ($card_id) {
                $existing_cards = isset($school_data['customCards']) && is_array($school_data['customCards']) ? $school_data['customCards'] : [];
                $school_data['customCards'] = lrsd_sf_card_creator_remove_card($existing_cards, $card_id);
                if (isset($school_data['customCardValues'][$card_id])) {
                    unset($school_data['customCardValues'][$card_id]);
                }
                return lrsd_sf_card_creator_apply_card_order($school_data, $card_id, false);
            });
        }
    }

    update_option('lrsd_schools_last_updated', wp_date('Y-m-d'));
    lrsd_sf_flush_dataset_cache();

    wp_send_json_success([
        'message' => __('Card deleted.', 'lrsd-school-facilities'),
        'state'   => lrsd_sf_get_card_creator_cards_state(),
    ]);
}
add_action('wp_ajax_lrsd_sf_card_creator_delete', 'lrsd_sf_ajax_card_creator_delete');
