<?php

defined('ABSPATH') || exit;

function lrsd_sf_register_school_meta_box() {
    add_meta_box(
        'lrsd_sf_school_editor',
        __('School Data Editor', 'lrsd-school-facilities'),
        'lrsd_sf_render_school_meta_box',
        'lr_school',
        'normal',
        'high'
    );
}

// ─── Field Map ────────────────────────────────────────────────────────────────

function lrsd_sf_get_simple_field_map() {
    return [
        // ── Core
        'schoolName'      => ['label' => 'School Name',       'path' => ['schoolName'],       'type' => 'text',   'section' => 'core'],
        'schoolType'      => ['label' => 'School Type',       'path' => ['schoolType'],        'type' => 'text',   'section' => 'core'],
        'headerImage'     => ['label' => 'Header Image',      'path' => ['headerImage'],       'type' => 'media',  'section' => 'core'],
        'address'         => ['label' => 'Address',           'path' => ['address'],           'type' => 'text',   'section' => 'core'],
        'phone'           => ['label' => 'Phone',             'path' => ['phone'],             'type' => 'text',   'section' => 'core'],
        'familyOfSchools' => ['label' => 'Family of Schools', 'path' => ['familyOfSchools'],   'type' => 'select', 'options_key' => 'familyOfSchools', 'section' => 'core'],
        'schoolLevel'     => ['label' => 'School Level',      'path' => ['schoolLevel'],       'type' => 'select', 'options_key' => 'schoolLevel',     'section' => 'core'],
        'grades'          => ['label' => 'Grades',            'path' => ['grades'],            'type' => 'text',   'section' => 'core'],
        'program'         => ['label' => 'Program',           'path' => ['program'],           'type' => 'select', 'options_key' => 'program',         'section' => 'core'],
        // ── Enrolment
        'enrolment_capacity' => ['label' => 'Classroom Capacity',  'path' => ['enrolment', 'capacity'], 'type' => 'int',  'section' => 'enrolment'],
        'enrolment_current'  => ['label' => 'Current Enrolment',   'path' => ['enrolment', 'current'],  'type' => 'int',  'section' => 'enrolment'],
        // ── Details
        'details_built'   => ['label' => 'Year Built',        'path' => ['details', 'Built'],  'type' => 'int',  'section' => 'details'],
        'details_size'    => ['label' => 'Building Size',     'path' => ['details', 'Size'],   'type' => 'text', 'section' => 'details'],
        'details_modular' => ['label' => 'Modular Rooms',     'path' => ['details', 'Modular'],'type' => 'int',  'section' => 'details'],
        // ── Building
        'building_air_conditioning' => ['label' => 'Air Conditioning', 'path' => ['building', 'Air Conditioning'], 'type' => 'text', 'section' => 'building'],
        'building_heating'          => ['label' => 'Heating',          'path' => ['building', 'Heating'],          'type' => 'text', 'section' => 'building'],
        'building_led_lighting'     => ['label' => 'LED Lighting',     'path' => ['building', 'LED Lighting'],     'type' => 'text', 'section' => 'building'],
        // ── Transportation
        'transportation_parking_spots' => ['label' => 'Parking Spots', 'path' => ['transportation', 'Parking spots'], 'type' => 'text',   'section' => 'transportation'],
        'transportation_bus_loop'      => ['label' => 'Bus Loop',       'path' => ['transportation', 'Bus Loop'],      'type' => 'select', 'options_key' => 'busLoop', 'section' => 'transportation'],
        // ── Accessibility
        'accessibility_girls_washrooms'     => ['label' => "Girls' Washrooms",          'path' => ['accessibility', "Girls' washrooms"],                 'type' => 'int',    'section' => 'accessibility'],
        'accessibility_boys_washrooms'      => ['label' => "Boys' Washrooms",           'path' => ['accessibility', "Boys' washrooms"],                  'type' => 'int',    'section' => 'accessibility'],
        'accessibility_gender_neutral'      => ['label' => 'Gender Neutral Washrooms',  'path' => ['accessibility', 'Gender neutral washrooms'],         'type' => 'int',    'section' => 'accessibility'],
        'accessibility_universal_washroom'  => ['label' => 'Universal Washroom',        'path' => ['accessibility', 'Universal Washroom'],               'type' => 'text',   'section' => 'accessibility'],
        'accessibility_elevator'            => ['label' => 'Elevator',                  'path' => ['accessibility', 'Elevator'],                         'type' => 'select', 'options_key' => 'elevator', 'section' => 'accessibility'],
        'accessibility_parking_stalls'      => ['label' => 'Accessible Parking Stalls', 'path' => ['accessibility', 'Accessible parking stalls'],        'type' => 'int',    'section' => 'accessibility'],
        'accessibility_accessible_entrance' => ['label' => 'Accessible Entrance',       'path' => ['accessibility', 'Accessible entrance'],              'type' => 'text',   'section' => 'accessibility'],
        'accessibility_door_operators'      => ['label' => 'Auto Entrance Door Ops',    'path' => ['accessibility', 'Automatic entrance door operators'], 'type' => 'text',   'section' => 'accessibility'],
        // ── Catchment
        'catchment_migration' => ['label' => 'Catchment Migration', 'path' => ['catchment', 'migration'], 'type' => 'text', 'section' => 'catchment'],
        'catchment_map'       => ['label' => 'Catchment Map',       'path' => ['catchment', 'map'],       'type' => 'media', 'section' => 'catchment'],
    ];
}

// ─── Render Helpers ───────────────────────────────────────────────────────────

function lrsd_sf_render_section_header($id, $label, $open = true) {
    $aria = $open ? 'true' : 'false';
    ?>
    <div class="lrsd-sf-section-header" data-target="<?php echo esc_attr($id); ?>" aria-expanded="<?php echo esc_attr($aria); ?>">
        <span class="lrsd-sf-section-label"><?php echo esc_html($label); ?></span>
        <span class="lrsd-sf-section-toggle"></span>
    </div>
    <div id="<?php echo esc_attr($id); ?>" class="lrsd-sf-section-body<?php echo $open ? ' is-open' : ''; ?>">
    <?php
}

function lrsd_sf_render_section_footer() {
    echo '</div><!-- /.lrsd-sf-section-body -->';
}

function lrsd_sf_get_custom_card_item_label(array $item, $index) {
    $label = sanitize_text_field((string) ($item['label'] ?? ''));
    if ($label !== '') {
        return $label;
    }
    return sprintf(
        /* translators: %d: field position */
        __('Field %d', 'lrsd-school-facilities'),
        (int) $index + 1
    );
}

function lrsd_sf_render_custom_card_value_control($name, array $item, $value, $id) {
    $value_type = sanitize_key((string) ($item['valueType'] ?? 'text'));
    $value = (string) $value;

    if ($value_type === 'number') {
        echo '<input type="number" step="any" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" class="regular-text" />';
        return;
    }

    if ($value_type === 'dropdown') {
        $options = isset($item['options']) && is_array($item['options']) ? array_values($item['options']) : [];
        $options = array_values(array_filter(array_map('sanitize_text_field', $options), static function ($option) {
            return $option !== '';
        }));
        if ($value !== '' && !in_array($value, $options, true)) {
            $options[] = $value;
        }
        echo '<select id="' . esc_attr($id) . '" name="' . esc_attr($name) . '">';
        echo '<option value="">' . esc_html__('— Select —', 'lrsd-school-facilities') . '</option>';
        foreach ($options as $option) {
            echo '<option value="' . esc_attr($option) . '"' . selected($value, $option, false) . '>' . esc_html($option) . '</option>';
        }
        echo '</select>';
        return;
    }

    echo '<input type="text" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" class="regular-text" />';
}

function lrsd_sf_collect_posted_custom_card_values($posted_values, array $global_custom_cards) {
    $posted_values = is_array($posted_values) ? $posted_values : [];
    $custom_values = [];

    foreach ($global_custom_cards as $card) {
        if (!is_array($card)) {
            continue;
        }
        $card_id = sanitize_key((string) ($card['id'] ?? ''));
        if ($card_id === '') {
            continue;
        }

        $raw_entry = isset($posted_values[$card_id]) && is_array($posted_values[$card_id]) ? $posted_values[$card_id] : [];
        $entry = [];
        $card_type = sanitize_key((string) ($card['cardType'] ?? 'details_list'));

        if ($card_type === 'image') {
            $entry['imageUrl'] = esc_url_raw((string) ($raw_entry['imageUrl'] ?? ''));
            $entry['imageLink'] = esc_url_raw((string) ($raw_entry['imageLink'] ?? ''));
            $entry['imageOverlayText'] = sanitize_text_field((string) ($raw_entry['imageOverlayText'] ?? ''));
        } else {
            $items = isset($card['items']) && is_array($card['items']) ? array_values($card['items']) : [];
            $raw_values = isset($raw_entry['itemValues']) && is_array($raw_entry['itemValues']) ? $raw_entry['itemValues'] : [];
            $entry_items = [];

            foreach ($items as $index => $item) {
                if (!is_array($item)) {
                    continue;
                }
                $label = sanitize_text_field((string) ($item['label'] ?? ''));
                $value = sanitize_text_field((string) ($raw_values[$index] ?? ''));
                $entry_items[] = [
                    'label' => $label,
                    'value' => $value,
                ];
            }
            $entry['items'] = $entry_items;
        }

        $entry['notes'] = sanitize_textarea_field((string) ($raw_entry['notes'] ?? ''));
        $has_content = false;

        foreach ($entry as $entry_value) {
            if (is_array($entry_value)) {
                foreach ($entry_value as $nested) {
                    if (is_array($nested)) {
                        if (trim((string) ($nested['value'] ?? '')) !== '') {
                            $has_content = true;
                            break 2;
                        }
                    } elseif (trim((string) $nested) !== '') {
                        $has_content = true;
                        break 2;
                    }
                }
            } elseif (trim((string) $entry_value) !== '') {
                $has_content = true;
                break;
            }
        }

        if ($has_content) {
            $custom_values[$card_id] = $entry;
        }
    }

    return $custom_values;
}

function lrsd_sf_render_field_row($field_key, $field, $value, $dropdown_options) {
    $id    = esc_attr($field_key);
    $name  = 'lrsd_sf_fields[' . esc_attr($field_key) . ']';
    $label = esc_html($field['label']);
    ?>
    <tr>
        <th scope="row"><label for="<?php echo $id; ?>"><?php echo $label; ?></label></th>
        <td>
        <?php
        switch ($field['type']) {
            case 'select':
                $opts = $dropdown_options[$field['options_key']] ?? [];
                // Ensure current value is always visible
                if ($value !== '' && !in_array((string)$value, $opts, true)) {
                    $opts[] = (string)$value;
                }

                $nonce_val = wp_create_nonce('lrsd_sf_custom_option_nonce');
                ?>
                <div class="lrsd-sf-select-wrap">
                    <select id="<?php echo $id; ?>" name="<?php echo esc_attr($name); ?>" class="lrsd-sf-select">
                        <option value=""><?php esc_html_e('— Select —', 'lrsd-school-facilities'); ?></option>
                        <?php foreach ($opts as $opt) : ?>
                            <option value="<?php echo esc_attr($opt); ?>"<?php selected((string)$value, $opt); ?>><?php echo esc_html($opt); ?></option>
                        <?php endforeach; ?>
                    </select>
                    <button type="button" class="button lrsd-sf-add-option-btn"
                        data-option-key="<?php echo esc_attr($field['options_key']); ?>"
                        data-target-select="<?php echo $id; ?>"
                        data-nonce="<?php echo esc_attr($nonce_val); ?>"
                        title="<?php esc_attr_e('Add a custom option to this dropdown', 'lrsd-school-facilities'); ?>">
                        <?php esc_html_e('+ Custom', 'lrsd-school-facilities'); ?>
                    </button>
                    <?php if ($field['options_key'] === 'familyOfSchools') : ?>
                        <span class="description" style="display:block;margin-top:4px;"><?php esc_html_e('When adding a custom Family of Schools, you will be asked for its catchment map path so the dashboard can display the correct map.', 'lrsd-school-facilities'); ?></span>
                    <?php endif; ?>
                </div>
                <?php
                break;

            case 'media':
                ?>
                <div class="lrsd-sf-media-wrap">
                    <input type="text" id="<?php echo $id; ?>" name="<?php echo esc_attr($name); ?>"
                           value="<?php echo esc_attr((string)$value); ?>"
                           class="regular-text lrsd-sf-media-input" />
                    <button type="button" class="button lrsd-sf-media-btn"
                            data-target="<?php echo $id; ?>">
                        <?php esc_html_e('Choose Media', 'lrsd-school-facilities'); ?>
                    </button>
                    <?php if ($value) : ?>
                        <span class="description" style="display:block;margin-top:4px;"><?php echo esc_html($value); ?></span>
                    <?php endif; ?>
                </div>
                <?php
                break;

            case 'int':
                echo '<input type="number" id="' . $id . '" name="' . esc_attr($name) . '" value="' . esc_attr((string)(int)$value) . '" class="small-text" />';
                break;

            default: // text
                echo '<input type="text" id="' . $id . '" name="' . esc_attr($name) . '" value="' . esc_attr((string)$value) . '" class="regular-text" />';
        }
        ?>
        </td>
    </tr>
    <?php
}

/**
 * Normalize enrolment series into editable year/value rows.
 */
function lrsd_sf_normalize_enrolment_series_points($series) {
    $labels = is_array($series['labels'] ?? null) ? array_values($series['labels']) : [];
    $values = is_array($series['values'] ?? null) ? array_values($series['values']) : [];
    $count  = max(count($labels), count($values));
    $points = [];

    for ($index = 0; $index < $count; $index++) {
        $label = isset($labels[$index]) ? trim((string) $labels[$index]) : '';
        $value = isset($values[$index]) && is_numeric($values[$index]) ? (int) $values[$index] : 0;
        if ($label === '') {
            continue;
        }
        $points[] = ['label' => $label, 'value' => $value];
    }

    if (empty($points)) {
        $points[] = ['label' => '', 'value' => ''];
    }

    return $points;
}

/**
 * Parse posted year/value rows into enrolment series arrays.
 */
function lrsd_sf_parse_posted_enrolment_series_points($labels_raw, $values_raw) {
    $labels_raw = is_array($labels_raw) ? $labels_raw : [];
    $values_raw = is_array($values_raw) ? $values_raw : [];
    $count      = max(count($labels_raw), count($values_raw));
    $labels     = [];
    $values     = [];

    for ($index = 0; $index < $count; $index++) {
        $label = sanitize_text_field(trim((string)($labels_raw[$index] ?? '')));
        $value_text = trim((string)($values_raw[$index] ?? ''));
        if ($label === '') {
            continue;
        }
        $labels[] = $label;
        $values[] = is_numeric($value_text) ? (int)$value_text : 0;
    }

    return [
        'labels' => $labels,
        'values' => $values,
    ];
}

// ─── Meta Box Render ──────────────────────────────────────────────────────────

function lrsd_sf_render_school_meta_box(WP_Post $post) {
    $school_data     = lrsd_sf_normalize_school_data(get_post_meta($post->ID, 'lrsd_school_data', true));
    if (empty($school_data)) {
        $school_data = lrsd_sf_get_blank_school_data(lrsd_sf_generate_school_id($post->ID));
    }
    $field_map       = lrsd_sf_get_simple_field_map();
    $dropdown_options= lrsd_sf_get_dropdown_options();
    $all_card_types  = lrsd_sf_get_all_card_types();
    $global_custom_cards = lrsd_sf_get_global_custom_cards();
    $global_custom_card_ids = array_values(array_filter(array_map(static function ($card) {
        return sanitize_key((string) ($card['id'] ?? ''));
    }, $global_custom_cards)));
    $custom_card_values = isset($school_data['customCardValues']) && is_array($school_data['customCardValues'])
        ? $school_data['customCardValues']
        : [];

    // Playground lines
    $playground_lines = implode("\n", (array)lrsd_sf_get_nested_value($school_data, ['playground'], []));

    // Projects
    $project_paths = [
        'projects_provincial_requested'  => ['projects', 'provincial', 'requested'],
        'projects_provincial_inProgress' => ['projects', 'provincial', 'inProgress'],
        'projects_provincial_completed'  => ['projects', 'provincial', 'completed'],
        'projects_local_requested'       => ['projects', 'local', 'requested'],
        'projects_local_inProgress'      => ['projects', 'local', 'inProgress'],
        'projects_local_completed'       => ['projects', 'local', 'completed'],
    ];

    $history_points    = lrsd_sf_normalize_enrolment_series_points(lrsd_sf_get_nested_value($school_data, ['enrolment', 'history'], []));
    $projection_points = lrsd_sf_normalize_enrolment_series_points(lrsd_sf_get_nested_value($school_data, ['enrolment', 'projection'], []));
    $additions         = lrsd_sf_get_nested_value($school_data, ['additions'], []);
    if (!is_array($additions)) {
        $additions = [];
    }
    if (empty($additions)) {
        $additions[] = ['year' => '', 'size' => ''];
    }
    $childcare = lrsd_sf_get_nested_value($school_data, ['childcare'], []);
    if (!is_array($childcare)) {
        $childcare = [];
    }

    // Card order: no school-specific custom IDs are used in this screen.
    $saved_order = lrsd_sf_get_nested_value($school_data, ['cardOrder'], []);
    $school_custom_card_ids = [];
    $card_order  = lrsd_sf_normalize_card_order($saved_order, $school_custom_card_ids, $global_custom_card_ids);

    $last_updated = get_option('lrsd_schools_last_updated', '');

    wp_nonce_field('lrsd_sf_save_school', 'lrsd_sf_school_nonce');
    ?>
    <div class="lrsd-sf-editor">

        <?php if ($last_updated) : ?>
        <p class="lrsd-sf-last-updated">
            <?php
            echo esc_html(
                sprintf(
                    /* translators: %s: date */
                    __('Last updated: %s — this date updates automatically on every save.', 'lrsd-school-facilities'),
                    $last_updated
                )
            );
            ?>
        </p>
        <?php endif; ?>

        <!-- ── Core Info ───────────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-core', __('Core Info', 'lrsd-school-facilities'), true); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach ($field_map as $fk => $field) {
            if (($field['section'] ?? '') !== 'core') continue;
            $val = lrsd_sf_get_nested_value($school_data, $field['path'], '');
            lrsd_sf_render_field_row($fk, $field, $val, $dropdown_options);
        }
        ?>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Enrolment & Capacity ────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-enrolment', __('Enrolment & Capacity', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach ($field_map as $fk => $field) {
            if (($field['section'] ?? '') !== 'enrolment') continue;
            $val = lrsd_sf_get_nested_value($school_data, $field['path'], '');
            lrsd_sf_render_field_row($fk, $field, $val, $dropdown_options);
        }
        ?>
            <tr>
                <th scope="row"><?php esc_html_e('Historic Enrolment', 'lrsd-school-facilities'); ?></th>
                <td>
                    <div class="lrsd-sf-kv-list">
                        <table class="lrsd-sf-kv-table" role="presentation">
                            <thead><tr><th scope="col"><?php esc_html_e('Year', 'lrsd-school-facilities'); ?></th><th scope="col"><?php esc_html_e('Value', 'lrsd-school-facilities'); ?></th><th scope="col"></th></tr></thead>
                            <tbody class="lrsd-sf-kv-rows">
                            <?php foreach ($history_points as $point) : ?>
                                <tr class="lrsd-sf-kv-row">
                                    <td><input type="text" class="regular-text" name="lrsd_sf_enrolment_history_labels[]" aria-label="<?php esc_attr_e('Historic enrolment year', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($point['label'] ?? '')); ?>" /></td>
                                    <td><input type="number" class="small-text" name="lrsd_sf_enrolment_history_values[]" aria-label="<?php esc_attr_e('Historic enrolment value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($point['value'] ?? '')); ?>" /></td>
                                    <td><button type="button" class="button lrsd-sf-remove-kv-row" aria-label="<?php esc_attr_e('Remove historic enrolment row', 'lrsd-school-facilities'); ?>">&#x2715;</button></td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                        <button type="button" class="button lrsd-sf-add-kv-row" data-label-name="lrsd_sf_enrolment_history_labels[]" data-value-name="lrsd_sf_enrolment_history_values[]" data-value-type="number"><?php esc_html_e('+ Add Data Point', 'lrsd-school-facilities'); ?></button>
                    </div>
                </td>
            </tr>
            <tr>
                <th scope="row"><?php esc_html_e('Projected Enrolment', 'lrsd-school-facilities'); ?></th>
                <td>
                    <div class="lrsd-sf-kv-list">
                        <table class="lrsd-sf-kv-table" role="presentation">
                            <thead><tr><th scope="col"><?php esc_html_e('Year', 'lrsd-school-facilities'); ?></th><th scope="col"><?php esc_html_e('Value', 'lrsd-school-facilities'); ?></th><th scope="col"></th></tr></thead>
                            <tbody class="lrsd-sf-kv-rows">
                            <?php foreach ($projection_points as $point) : ?>
                                <tr class="lrsd-sf-kv-row">
                                    <td><input type="text" class="regular-text" name="lrsd_sf_enrolment_projection_labels[]" aria-label="<?php esc_attr_e('Projected enrolment year', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($point['label'] ?? '')); ?>" /></td>
                                    <td><input type="number" class="small-text" name="lrsd_sf_enrolment_projection_values[]" aria-label="<?php esc_attr_e('Projected enrolment value', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($point['value'] ?? '')); ?>" /></td>
                                    <td><button type="button" class="button lrsd-sf-remove-kv-row" aria-label="<?php esc_attr_e('Remove projected enrolment row', 'lrsd-school-facilities'); ?>">&#x2715;</button></td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                        <button type="button" class="button lrsd-sf-add-kv-row" data-label-name="lrsd_sf_enrolment_projection_labels[]" data-value-name="lrsd_sf_enrolment_projection_values[]" data-value-type="number"><?php esc_html_e('+ Add Data Point', 'lrsd-school-facilities'); ?></button>
                    </div>
                </td>
            </tr>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Building Details ────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-details', __('Building Details', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach ($field_map as $fk => $field) {
            if (($field['section'] ?? '') !== 'details') continue;
            $val = lrsd_sf_get_nested_value($school_data, $field['path'], '');
            lrsd_sf_render_field_row($fk, $field, $val, $dropdown_options);
        }
        ?>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Additions ───────────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-additions', __('Additions', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
            <tr>
                <th scope="row"><?php esc_html_e('Building Additions', 'lrsd-school-facilities'); ?></th>
                <td>
                    <div class="lrsd-sf-kv-list">
                        <table class="lrsd-sf-kv-table" role="presentation">
                            <thead><tr><th scope="col"><?php esc_html_e('Year', 'lrsd-school-facilities'); ?></th><th scope="col"><?php esc_html_e('Size', 'lrsd-school-facilities'); ?></th><th scope="col"></th></tr></thead>
                            <tbody class="lrsd-sf-kv-rows">
                            <?php foreach ($additions as $addition) : ?>
                                <tr class="lrsd-sf-kv-row">
                                    <td><input type="text" class="regular-text" name="lrsd_sf_additions_year[]" aria-label="<?php esc_attr_e('Addition year', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($addition['year'] ?? '')); ?>" /></td>
                                    <td><input type="text" class="regular-text" name="lrsd_sf_additions_size[]" aria-label="<?php esc_attr_e('Addition size', 'lrsd-school-facilities'); ?>" value="<?php echo esc_attr((string)($addition['size'] ?? '')); ?>" /></td>
                                    <td><button type="button" class="button lrsd-sf-remove-kv-row" aria-label="<?php esc_attr_e('Remove addition row', 'lrsd-school-facilities'); ?>">&#x2715;</button></td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                        <button type="button" class="button lrsd-sf-add-kv-row" data-label-name="lrsd_sf_additions_year[]" data-value-name="lrsd_sf_additions_size[]"><?php esc_html_e('+ Add Addition', 'lrsd-school-facilities'); ?></button>
                    </div>
                </td>
            </tr>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Building Systems ────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-building', __('Building Systems', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach ($field_map as $fk => $field) {
            if (($field['section'] ?? '') !== 'building') continue;
            $val = lrsd_sf_get_nested_value($school_data, $field['path'], '');
            lrsd_sf_render_field_row($fk, $field, $val, $dropdown_options);
        }
        ?>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Transportation ──────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-transportation', __('Transportation', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach ($field_map as $fk => $field) {
            if (($field['section'] ?? '') !== 'transportation') continue;
            $val = lrsd_sf_get_nested_value($school_data, $field['path'], '');
            lrsd_sf_render_field_row($fk, $field, $val, $dropdown_options);
        }
        ?>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Accessibility ───────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-accessibility', __('Accessibility', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach ($field_map as $fk => $field) {
            if (($field['section'] ?? '') !== 'accessibility') continue;
            $val = lrsd_sf_get_nested_value($school_data, $field['path'], '');
            lrsd_sf_render_field_row($fk, $field, $val, $dropdown_options);
        }
        ?>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Playground ──────────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-playground', __('Playground', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
            <tr>
                <th scope="row"><label for="playground_lines"><?php esc_html_e('Playground Items (one per line)', 'lrsd-school-facilities'); ?></label></th>
                <td>
                    <textarea id="playground_lines" name="lrsd_sf_playground_lines" rows="7" class="large-text code"><?php echo esc_textarea($playground_lines); ?></textarea>
                    <p class="description"><?php esc_html_e('Enter each piece of playground equipment or feature on its own line.', 'lrsd-school-facilities'); ?></p>
                </td>
            </tr>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Childcare ───────────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-childcare', __('Childcare & BLAST', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
            <tr>
                <th scope="row"><label for="lrsd_sf_childcare_infant"><?php esc_html_e('Infant (0-23 months)', 'lrsd-school-facilities'); ?></label></th>
                <td><input type="text" id="lrsd_sf_childcare_infant" class="regular-text" name="lrsd_sf_childcare[Infant (0-23 months)]" value="<?php echo esc_attr((string)($childcare['Infant (0-23 months)'] ?? '')); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="lrsd_sf_childcare_preschool"><?php esc_html_e('Pre-school (2-6 years)', 'lrsd-school-facilities'); ?></label></th>
                <td><input type="text" id="lrsd_sf_childcare_preschool" class="regular-text" name="lrsd_sf_childcare[Pre-school (2-6 years)]" value="<?php echo esc_attr((string)($childcare['Pre-school (2-6 years)'] ?? '')); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="lrsd_sf_childcare_schoolage5"><?php esc_html_e('School-age (5+ years)', 'lrsd-school-facilities'); ?></label></th>
                <td><input type="text" id="lrsd_sf_childcare_schoolage5" class="regular-text" name="lrsd_sf_childcare[School-age (5+ years)]" value="<?php echo esc_attr((string)($childcare['School-age (5+ years)'] ?? '')); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="lrsd_sf_childcare_schoolage"><?php esc_html_e('School-age (7+ years)', 'lrsd-school-facilities'); ?></label></th>
                <td><input type="text" id="lrsd_sf_childcare_schoolage" class="regular-text" name="lrsd_sf_childcare[School-age (7+ years)]" value="<?php echo esc_attr((string)($childcare['School-age (7+ years)'] ?? '')); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="lrsd_sf_childcare_specialneeds"><?php esc_html_e('Special Needs (12+ years)', 'lrsd-school-facilities'); ?></label></th>
                <td><input type="text" id="lrsd_sf_childcare_specialneeds" class="regular-text" name="lrsd_sf_childcare[Special Needs (12+ years)]" value="<?php echo esc_attr((string)($childcare['Special Needs (12+ years)'] ?? '')); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="lrsd_sf_childcare_blast"><?php esc_html_e('BLAST', 'lrsd-school-facilities'); ?></label></th>
                <td><input type="text" id="lrsd_sf_childcare_blast" class="regular-text" name="lrsd_sf_childcare[BLAST]" value="<?php echo esc_attr((string)($childcare['BLAST'] ?? '')); ?>" /></td>
            </tr>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Catchment ───────────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-catchment', __('Catchment', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach ($field_map as $fk => $field) {
            if (($field['section'] ?? '') !== 'catchment') continue;
            $val = lrsd_sf_get_nested_value($school_data, $field['path'], '');
            lrsd_sf_render_field_row($fk, $field, $val, $dropdown_options);
        }
        ?>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Projects – Provincial ───────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-projects-prov', __('Projects — Provincial', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach (['projects_provincial_requested' => 'Requested', 'projects_provincial_inProgress' => 'In Progress', 'projects_provincial_completed' => 'Completed'] as $pk => $plabel) :
            $lines = implode("\n", (array)lrsd_sf_get_nested_value($school_data, $project_paths[$pk], []));
        ?>
            <tr>
                <th scope="row"><label for="<?php echo esc_attr($pk); ?>"><?php echo esc_html($plabel); ?></label></th>
                <td><textarea id="<?php echo esc_attr($pk); ?>" name="lrsd_sf_projects[<?php echo esc_attr($pk); ?>]" rows="4" class="large-text code"><?php echo esc_textarea($lines); ?></textarea></td>
            </tr>
        <?php endforeach; ?>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Projects – Local ────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-projects-local', __('Projects — Local', 'lrsd-school-facilities')); ?>
        <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
        <?php
        foreach (['projects_local_requested' => 'Requested', 'projects_local_inProgress' => 'In Progress', 'projects_local_completed' => 'Completed'] as $pk => $plabel) :
            $lines = implode("\n", (array)lrsd_sf_get_nested_value($school_data, $project_paths[$pk], []));
        ?>
            <tr>
                <th scope="row"><label for="<?php echo esc_attr($pk); ?>"><?php echo esc_html($plabel); ?></label></th>
                <td><textarea id="<?php echo esc_attr($pk); ?>" name="lrsd_sf_projects[<?php echo esc_attr($pk); ?>]" rows="4" class="large-text code"><?php echo esc_textarea($lines); ?></textarea></td>
            </tr>
        <?php endforeach; ?>
        </tbody></table>
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Card Display Order ───────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-card-order', __('Card Display Order', 'lrsd-school-facilities')); ?>
        <p class="description" style="margin:8px 0 12px;"><?php esc_html_e('Drag to reorder how cards appear on the school dashboard.', 'lrsd-school-facilities'); ?></p>
        <ul id="lrsd-sf-card-order">
        <?php
        // Build label map (standard cards only)
        $card_labels = $all_card_types;
        foreach ($global_custom_cards as $custom_card) {
            if (!is_array($custom_card)) {
                continue;
            }
            $custom_id = sanitize_key((string) ($custom_card['id'] ?? ''));
            if ($custom_id === '') {
                continue;
            }
            $custom_title = sanitize_text_field((string) ($custom_card['title'] ?? ''));
            $card_labels[$custom_id] = $custom_title !== '' ? $custom_title : $custom_id;
        }
        foreach ($card_order as $ct) :
            if (!isset($card_labels[$ct])) continue;
        ?>
            <li class="lrsd-sf-order-item" data-card-id="<?php echo esc_attr($ct); ?>">
                <span class="dashicons dashicons-menu" title="<?php esc_attr_e('Drag to reorder', 'lrsd-school-facilities'); ?>"></span>
                <span class="lrsd-sf-order-label"><?php echo esc_html($card_labels[$ct]); ?></span>
            </li>
        <?php endforeach; ?>
        </ul>
        <input type="hidden" id="lrsd_sf_card_order_json" name="lrsd_sf_card_order_json" value="<?php echo esc_attr(wp_json_encode($card_order, JSON_UNESCAPED_SLASHES)); ?>" />
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Custom Cards (Global Templates) ───────────────────── -->
        <?php if (!empty($global_custom_cards)) : ?>
        <?php lrsd_sf_render_section_header('lrsd-sec-custom-cards', __('Custom Cards', 'lrsd-school-facilities')); ?>
        <?php foreach ($global_custom_cards as $custom_index => $custom_card) :
            if (!is_array($custom_card)) {
                continue;
            }
            $custom_card_id = sanitize_key((string) ($custom_card['id'] ?? ''));
            if ($custom_card_id === '') {
                continue;
            }
            $custom_card_title = sanitize_text_field((string) ($custom_card['title'] ?? ''));
            $custom_card_title = $custom_card_title !== '' ? $custom_card_title : $custom_card_id;
            $custom_card_type = sanitize_key((string) ($custom_card['cardType'] ?? 'details_list'));
            $custom_value_entry = isset($custom_card_values[$custom_card_id]) && is_array($custom_card_values[$custom_card_id])
                ? $custom_card_values[$custom_card_id]
                : [];
        ?>
            <h3 style="margin:16px 0 8px;"><?php echo esc_html($custom_card_title); ?></h3>
            <table class="form-table lrsd-sf-editor-table" role="presentation"><tbody>
                <?php if ($custom_card_type === 'image') : ?>
                    <tr>
                        <th scope="row"><label for="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_image_url'); ?>"><?php esc_html_e('Image URL', 'lrsd-school-facilities'); ?></label></th>
                        <td>
                            <div class="lrsd-sf-media-wrap">
                                <input type="text" id="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_image_url'); ?>" name="<?php echo esc_attr('lrsd_sf_custom_card_values[' . $custom_card_id . '][imageUrl]'); ?>" value="<?php echo esc_attr((string) ($custom_value_entry['imageUrl'] ?? '')); ?>" class="regular-text lrsd-sf-media-input" />
                                <button type="button" class="button lrsd-sf-media-btn" data-target="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_image_url'); ?>"><?php esc_html_e('Choose Media', 'lrsd-school-facilities'); ?></button>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_image_link'); ?>"><?php esc_html_e('Image Link', 'lrsd-school-facilities'); ?></label></th>
                        <td><input type="text" id="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_image_link'); ?>" name="<?php echo esc_attr('lrsd_sf_custom_card_values[' . $custom_card_id . '][imageLink]'); ?>" value="<?php echo esc_attr((string) ($custom_value_entry['imageLink'] ?? '')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_image_overlay'); ?>"><?php esc_html_e('Overlay Text', 'lrsd-school-facilities'); ?></label></th>
                        <td><input type="text" id="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_image_overlay'); ?>" name="<?php echo esc_attr('lrsd_sf_custom_card_values[' . $custom_card_id . '][imageOverlayText]'); ?>" value="<?php echo esc_attr((string) ($custom_value_entry['imageOverlayText'] ?? '')); ?>" class="regular-text" /></td>
                    </tr>
                <?php else :
                    $custom_items = isset($custom_card['items']) && is_array($custom_card['items']) ? array_values($custom_card['items']) : [];
                    $custom_item_values = isset($custom_value_entry['items']) && is_array($custom_value_entry['items']) ? array_values($custom_value_entry['items']) : [];
                    foreach ($custom_items as $item_index => $item) :
                        if (!is_array($item)) {
                            continue;
                        }
                        $field_label = lrsd_sf_get_custom_card_item_label($item, $item_index);
                        $field_value = isset($custom_item_values[$item_index]['value']) ? $custom_item_values[$item_index]['value'] : '';
                        $field_id = 'lrsd_custom_' . $custom_index . '_' . $item_index;
                        $field_name = 'lrsd_sf_custom_card_values[' . $custom_card_id . '][itemValues][' . $item_index . ']';
                    ?>
                    <tr>
                        <th scope="row"><label for="<?php echo esc_attr($field_id); ?>"><?php echo esc_html($field_label); ?></label></th>
                        <td><?php lrsd_sf_render_custom_card_value_control($field_name, $item, $field_value, $field_id); ?></td>
                    </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_notes'); ?>"><?php esc_html_e('Notes', 'lrsd-school-facilities'); ?></label></th>
                    <td><textarea id="<?php echo esc_attr('lrsd_custom_' . $custom_index . '_notes'); ?>" name="<?php echo esc_attr('lrsd_sf_custom_card_values[' . $custom_card_id . '][notes]'); ?>" rows="3" class="large-text"><?php echo esc_textarea((string) ($custom_value_entry['notes'] ?? '')); ?></textarea></td>
                </tr>
            </tbody></table>
        <?php endforeach; ?>
        <?php lrsd_sf_render_section_footer(); ?>
        <?php endif; ?>

        <!-- ── Advanced JSON ────────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-advanced', __('Advanced — Full JSON', 'lrsd-school-facilities'), false); ?>
        <p class="description" style="margin:8px 0 8px;"><?php esc_html_e('The full school JSON. Edit directly only if necessary — form fields above take precedence on save.', 'lrsd-school-facilities'); ?></p>
        <textarea name="lrsd_sf_advanced_json" rows="18" class="large-text code"><?php echo esc_textarea(wp_json_encode($school_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); ?></textarea>
        <?php lrsd_sf_render_section_footer(); ?>

    </div><!-- /.lrsd-sf-editor -->
    <?php
}

// ─── Save Handler ─────────────────────────────────────────────────────────────

function lrsd_sf_save_school_meta($post_id, WP_Post $post) {
    if (!isset($_POST['lrsd_sf_school_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['lrsd_sf_school_nonce'])), 'lrsd_sf_save_school')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $advanced_json = isset($_POST['lrsd_sf_advanced_json']) ? wp_unslash($_POST['lrsd_sf_advanced_json']) : '';
    $advanced_json = is_string($advanced_json) ? trim($advanced_json) : '';

    $school_data = json_decode($advanced_json, true);
    if ($advanced_json === '' || json_last_error() !== JSON_ERROR_NONE || !is_array($school_data)) {
        lrsd_sf_set_editor_notice(__('JSON validation error: please provide valid school JSON before saving.', 'lrsd-school-facilities'), 'error');
        return;
    }

    // ── Snapshot current state into version history BEFORE applying changes ─────
    $school_name_label = isset($_POST['lrsd_sf_fields']['schoolName'])
        ? sanitize_text_field(wp_unslash($_POST['lrsd_sf_fields']['schoolName']))
        : $post->post_title;
    lrsd_sf_push_version_history(
        sprintf(
            /* translators: %s: school name */
            __('School save: %s', 'lrsd-school-facilities'),
            $school_name_label
        )
    );

    // ── Apply simple fields ──────────────────────────────────────────────────
    $simple_fields = isset($_POST['lrsd_sf_fields']) && is_array($_POST['lrsd_sf_fields'])
        ? wp_unslash($_POST['lrsd_sf_fields'])
        : [];

    foreach (lrsd_sf_get_simple_field_map() as $field_key => $field) {
        if (!array_key_exists($field_key, $simple_fields)) {
            continue;
        }

        $raw_value = $simple_fields[$field_key];

        if ($field['type'] === 'int') {
            $value = is_numeric($raw_value) ? (int)$raw_value : 0;
        } elseif ($field['type'] === 'select' || $field['type'] === 'text' || $field['type'] === 'media') {
            $value = sanitize_text_field((string)$raw_value);
        } else {
            $value = sanitize_text_field((string)$raw_value);
        }

        lrsd_sf_set_nested_value($school_data, $field['path'], $value);
    }

    // ── Playground ───────────────────────────────────────────────────────────
    if (isset($_POST['lrsd_sf_playground_lines'])) {
        $playground_lines = explode("\n", sanitize_textarea_field(wp_unslash($_POST['lrsd_sf_playground_lines'])));
        $playground_lines = array_values(array_filter(array_map('trim', $playground_lines), static function ($line) {
            return $line !== '';
        }));
        lrsd_sf_set_nested_value($school_data, ['playground'], $playground_lines);
    }

    // ── Projects ─────────────────────────────────────────────────────────────
    $project_paths = [
        'projects_provincial_requested'  => ['projects', 'provincial', 'requested'],
        'projects_provincial_inProgress' => ['projects', 'provincial', 'inProgress'],
        'projects_provincial_completed'  => ['projects', 'provincial', 'completed'],
        'projects_local_requested'       => ['projects', 'local', 'requested'],
        'projects_local_inProgress'      => ['projects', 'local', 'inProgress'],
        'projects_local_completed'       => ['projects', 'local', 'completed'],
    ];

    $posted_projects = isset($_POST['lrsd_sf_projects']) && is_array($_POST['lrsd_sf_projects'])
        ? wp_unslash($_POST['lrsd_sf_projects'])
        : [];

    foreach ($project_paths as $project_key => $path) {
        if (!array_key_exists($project_key, $posted_projects)) {
            continue;
        }
        $lines = explode("\n", sanitize_textarea_field((string)$posted_projects[$project_key]));
        $lines = array_values(array_filter(array_map('trim', $lines), static function ($line) { return $line !== ''; }));
        lrsd_sf_set_nested_value($school_data, $path, $lines);
    }

    // ── Enrolment history/projection series ──────────────────────────────────
    if (isset($_POST['lrsd_sf_enrolment_history_labels']) || isset($_POST['lrsd_sf_enrolment_history_values'])) {
        $history_labels = isset($_POST['lrsd_sf_enrolment_history_labels']) && is_array($_POST['lrsd_sf_enrolment_history_labels'])
            ? wp_unslash($_POST['lrsd_sf_enrolment_history_labels'])
            : [];
        $history_values = isset($_POST['lrsd_sf_enrolment_history_values']) && is_array($_POST['lrsd_sf_enrolment_history_values'])
            ? wp_unslash($_POST['lrsd_sf_enrolment_history_values'])
            : [];
        $history_series = lrsd_sf_parse_posted_enrolment_series_points($history_labels, $history_values);
        lrsd_sf_set_nested_value($school_data, ['enrolment', 'history'], $history_series);
    }

    if (isset($_POST['lrsd_sf_enrolment_projection_labels']) || isset($_POST['lrsd_sf_enrolment_projection_values'])) {
        $projection_labels = isset($_POST['lrsd_sf_enrolment_projection_labels']) && is_array($_POST['lrsd_sf_enrolment_projection_labels'])
            ? wp_unslash($_POST['lrsd_sf_enrolment_projection_labels'])
            : [];
        $projection_values = isset($_POST['lrsd_sf_enrolment_projection_values']) && is_array($_POST['lrsd_sf_enrolment_projection_values'])
            ? wp_unslash($_POST['lrsd_sf_enrolment_projection_values'])
            : [];
        $projection_series = lrsd_sf_parse_posted_enrolment_series_points($projection_labels, $projection_values);
        lrsd_sf_set_nested_value($school_data, ['enrolment', 'projection'], $projection_series);
    }

    // ── Additions ────────────────────────────────────────────────────────────
    if (isset($_POST['lrsd_sf_additions_year']) || isset($_POST['lrsd_sf_additions_size'])) {
        $years = isset($_POST['lrsd_sf_additions_year']) && is_array($_POST['lrsd_sf_additions_year'])
            ? wp_unslash($_POST['lrsd_sf_additions_year'])
            : [];
        $sizes = isset($_POST['lrsd_sf_additions_size']) && is_array($_POST['lrsd_sf_additions_size'])
            ? wp_unslash($_POST['lrsd_sf_additions_size'])
            : [];
        $count = max(count($years), count($sizes));
        $additions = [];
        for ($index = 0; $index < $count; $index++) {
            $year = sanitize_text_field(trim((string)($years[$index] ?? '')));
            $size = sanitize_text_field(trim((string)($sizes[$index] ?? '')));
            if ($year === '' && $size === '') {
                continue;
            }
            $additions[] = [
                'year' => $year,
                'size' => $size,
            ];
        }
        lrsd_sf_set_nested_value($school_data, ['additions'], $additions);
    }

    // ── Childcare ────────────────────────────────────────────────────────────
    if (isset($_POST['lrsd_sf_childcare']) && is_array($_POST['lrsd_sf_childcare'])) {
        $childcare_raw = wp_unslash($_POST['lrsd_sf_childcare']);
        $labels = lrsd_sf_get_childcare_labels();
        $childcare = [];
        foreach ($labels as $label) {
            $childcare[$label] = sanitize_text_field((string)($childcare_raw[$label] ?? ''));
        }
        lrsd_sf_set_nested_value($school_data, ['childcare'], $childcare);
    }

    // ── Global custom card values ────────────────────────────────────────────
    $global_custom_cards = lrsd_sf_get_global_custom_cards();
    $posted_custom_card_values = isset($_POST['lrsd_sf_custom_card_values']) && is_array($_POST['lrsd_sf_custom_card_values'])
        ? wp_unslash($_POST['lrsd_sf_custom_card_values'])
        : [];
    $school_data['customCardValues'] = lrsd_sf_collect_posted_custom_card_values($posted_custom_card_values, $global_custom_cards);

    // ── Card order ───────────────────────────────────────────────────────────
    $card_order_raw = isset($_POST['lrsd_sf_card_order_json'])
        ? trim(wp_unslash($_POST['lrsd_sf_card_order_json']))
        : '';

    if ($card_order_raw !== '') {
        $card_order = json_decode($card_order_raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($card_order)) {
            $school_data['cardOrder'] = lrsd_sf_normalize_card_order(
                $card_order,
                [],
                array_values(array_filter(array_map(static function ($card) {
                    return sanitize_key((string) ($card['id'] ?? ''));
                }, $global_custom_cards)))
            );
        }
    }

    $school_data = lrsd_sf_normalize_school_dashboard_data($school_data, $global_custom_cards);

    // ── School ID ─────────────────────────────────────────────────────────────
    $school_id = isset($school_data['id']) ? sanitize_text_field((string)$school_data['id']) : '';
    if ($school_id === '') {
        $school_id = get_post_meta($post_id, 'lrsd_school_id', true);
    }
    if ($school_id === '') {
        $school_id = lrsd_sf_generate_school_id($post_id);
        $school_data['id'] = $school_id;
    }
    if ($school_id !== '') {
        update_post_meta($post_id, 'lrsd_school_id', $school_id);
    }

    // ── Save ─────────────────────────────────────────────────────────────────
    update_post_meta($post_id, 'lrsd_school_data', lrsd_sf_encode_school_data($school_data));

    // ── Auto-update post title ────────────────────────────────────────────────
    $new_title = isset($school_data['schoolName']) ? sanitize_text_field((string)$school_data['schoolName']) : '';
    if ($new_title !== '' && $new_title !== $post->post_title) {
        remove_action('save_post_lr_school', 'lrsd_sf_save_school_meta', 10);
        wp_update_post(['ID' => $post_id, 'post_title' => $new_title]);
        add_action('save_post_lr_school', 'lrsd_sf_save_school_meta', 10, 2);
    }

    // ── Auto-update last-updated date ─────────────────────────────────────────
    update_option('lrsd_schools_last_updated', wp_date('Y-m-d'));
    lrsd_sf_flush_dataset_cache();
    lrsd_sf_set_editor_notice(__('School record saved successfully.', 'lrsd-school-facilities'), 'success');
}

// ─── Editor Notice ────────────────────────────────────────────────────────────

function lrsd_sf_render_editor_notice() {
    global $pagenow;

    if ($pagenow !== 'post.php' || get_post_type() !== 'lr_school') {
        return;
    }

    $user_id = get_current_user_id();
    if (!$user_id) {
        return;
    }

    $notice = get_transient('lrsd_sf_editor_notice_' . $user_id);
    if (!$notice || empty($notice['message'])) {
        return;
    }

    delete_transient('lrsd_sf_editor_notice_' . $user_id);
    $type = ($notice['type'] ?? 'success') === 'error' ? 'error' : 'success';
    ?>
    <div class="notice notice-<?php echo esc_attr($type); ?> is-dismissible">
        <p><?php echo wp_kses_post($notice['message']); ?></p>
    </div>
    <?php
}
