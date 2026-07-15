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

// ─── Meta Box Render ──────────────────────────────────────────────────────────

function lrsd_sf_render_school_meta_box(WP_Post $post) {
    $school_data     = lrsd_sf_normalize_school_data(get_post_meta($post->ID, 'lrsd_school_data', true));
    $field_map       = lrsd_sf_get_simple_field_map();
    $dropdown_options= lrsd_sf_get_dropdown_options();
    $all_card_types  = lrsd_sf_get_all_card_types();

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

    // Custom cards
    $custom_cards = lrsd_sf_get_nested_value($school_data, ['customCards'], []);
    if (!is_array($custom_cards)) { $custom_cards = []; }

    // Card order: saved order + any new standard cards + any custom card IDs
    $saved_order   = lrsd_sf_get_nested_value($school_data, ['cardOrder'], []);
    $default_order = array_keys($all_card_types);
    $custom_ids    = array_column($custom_cards, 'id');

    if (!is_array($saved_order) || empty($saved_order)) {
        $card_order = array_merge($default_order, $custom_ids);
    } else {
        // Merge: keep saved order, append any new standard cards or custom cards not yet present
        $card_order = $saved_order;
        foreach (array_merge($default_order, $custom_ids) as $ct) {
            if (!in_array($ct, $card_order, true)) {
                $card_order[] = $ct;
            }
        }
        // Remove IDs that no longer exist (e.g. deleted custom card)
        $valid_ids = array_merge($default_order, $custom_ids);
        $card_order = array_values(array_filter($card_order, static function ($card_id) use ($valid_ids) {
            return in_array($card_id, $valid_ids, true);
        }));
    }

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

        <!-- ── Custom Cards ────────────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-custom-cards', __('Custom Cards', 'lrsd-school-facilities')); ?>
        <p class="description" style="margin:8px 0 12px;"><?php esc_html_e('Add extra info cards that appear on the school dashboard. Each card can have a title, icon, category label, key–value items, and optional notes.', 'lrsd-school-facilities'); ?></p>
        <div id="lrsd-sf-custom-cards">
        <?php foreach ($custom_cards as $i => $card) :
            $card_id    = esc_attr($card['id']    ?? 'custom_' . $i);
            $card_title = esc_attr($card['title'] ?? '');
            $card_icon  = esc_attr($card['icon']  ?? '');
            $card_cat   = esc_attr($card['category'] ?? '');
            $card_notes = esc_textarea($card['notes'] ?? '');
            $card_items = is_array($card['items'] ?? null) ? $card['items'] : [];
        ?>
            <div class="lrsd-sf-custom-card" data-card-id="<?php echo $card_id; ?>">
                <div class="lrsd-sf-custom-card-header">
                    <span class="lrsd-sf-card-drag dashicons dashicons-move" title="<?php esc_attr_e('Drag to reorder', 'lrsd-school-facilities'); ?>"></span>
                    <strong class="lrsd-sf-card-name"><?php echo esc_html($card['title'] ?? __('(Untitled Card)', 'lrsd-school-facilities')); ?></strong>
                    <button type="button" class="button lrsd-sf-remove-card" title="<?php esc_attr_e('Remove card', 'lrsd-school-facilities'); ?>">✕</button>
                </div>
                <table class="form-table" role="presentation"><tbody>
                    <tr>
                        <th><label><?php esc_html_e('Card Title', 'lrsd-school-facilities'); ?></label></th>
                        <td><input type="text" class="regular-text lrsd-sf-card-title" value="<?php echo $card_title; ?>" data-field="title" /></td>
                    </tr>
                    <tr>
                        <th><label><?php esc_html_e('Icon', 'lrsd-school-facilities'); ?></label></th>
                        <td>
                            <div class="lrsd-sf-media-wrap">
                                <input type="text" class="regular-text lrsd-sf-media-input lrsd-sf-card-icon" value="<?php echo $card_icon; ?>" data-field="icon" id="lrsd-card-icon-<?php echo $card_id; ?>" />
                                <button type="button" class="button lrsd-sf-media-btn" data-target="lrsd-card-icon-<?php echo $card_id; ?>"><?php esc_html_e('Choose Media', 'lrsd-school-facilities'); ?></button>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th><label><?php esc_html_e('Category Label', 'lrsd-school-facilities'); ?></label></th>
                        <td><input type="text" class="regular-text lrsd-sf-card-category" value="<?php echo $card_cat; ?>" data-field="category" /></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Items', 'lrsd-school-facilities'); ?></th>
                        <td>
                            <div class="lrsd-sf-items-list">
                            <?php foreach ($card_items as $item) : ?>
                                <div class="lrsd-sf-item-row">
                                    <input type="text" class="lrsd-sf-item-label" value="<?php echo esc_attr($item['label'] ?? ''); ?>" placeholder="<?php esc_attr_e('Label', 'lrsd-school-facilities'); ?>" />
                                    <input type="text" class="lrsd-sf-item-value" value="<?php echo esc_attr($item['value'] ?? ''); ?>" placeholder="<?php esc_attr_e('Value', 'lrsd-school-facilities'); ?>" />
                                    <button type="button" class="button lrsd-sf-remove-item">✕</button>
                                </div>
                            <?php endforeach; ?>
                            </div>
                            <button type="button" class="button lrsd-sf-add-item"><?php esc_html_e('+ Add Item', 'lrsd-school-facilities'); ?></button>
                        </td>
                    </tr>
                    <tr>
                        <th><label><?php esc_html_e('Notes (optional)', 'lrsd-school-facilities'); ?></label></th>
                        <td><textarea class="large-text lrsd-sf-card-notes" rows="2" data-field="notes"><?php echo $card_notes; ?></textarea></td>
                    </tr>
                </tbody></table>
            </div><!-- /.lrsd-sf-custom-card -->
        <?php endforeach; ?>
        </div><!-- /#lrsd-sf-custom-cards -->
        <p style="margin-top:10px;">
            <button type="button" class="button button-primary" id="lrsd-sf-add-card"><?php esc_html_e('+ Add Card', 'lrsd-school-facilities'); ?></button>
        </p>
        <input type="hidden" id="lrsd_sf_custom_cards_json" name="lrsd_sf_custom_cards_json" value="<?php echo esc_attr(wp_json_encode($custom_cards, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); ?>" />
        <?php lrsd_sf_render_section_footer(); ?>

        <!-- ── Card Display Order ───────────────────────────────── -->
        <?php lrsd_sf_render_section_header('lrsd-sec-card-order', __('Card Display Order', 'lrsd-school-facilities')); ?>
        <p class="description" style="margin:8px 0 12px;"><?php esc_html_e('Drag to reorder how cards appear on the school dashboard.', 'lrsd-school-facilities'); ?></p>
        <ul id="lrsd-sf-card-order">
        <?php
        // Build label map (standard + custom)
        $card_labels = $all_card_types;
        foreach ($custom_cards as $cc) {
            $card_labels[$cc['id'] ?? ''] = esc_html($cc['title'] ?? __('Custom Card', 'lrsd-school-facilities'));
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

    // ── Custom cards ─────────────────────────────────────────────────────────
    $custom_cards_raw = isset($_POST['lrsd_sf_custom_cards_json'])
        ? trim(wp_unslash($_POST['lrsd_sf_custom_cards_json']))
        : '';

    if ($custom_cards_raw !== '') {
        $custom_cards = json_decode($custom_cards_raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($custom_cards)) {
            // Sanitize each card
            $sanitized_cards = [];
            foreach ($custom_cards as $card) {
                if (!is_array($card)) continue;
                $s_card = [
                    'id'       => sanitize_key($card['id'] ?? 'custom_' . wp_generate_password(6, false)),
                    'title'    => sanitize_text_field($card['title'] ?? ''),
                    'icon'     => sanitize_text_field($card['icon'] ?? ''),
                    'category' => sanitize_text_field($card['category'] ?? ''),
                    'notes'    => sanitize_textarea_field($card['notes'] ?? ''),
                    'items'    => [],
                ];
                if (is_array($card['items'] ?? null)) {
                    foreach ($card['items'] as $item) {
                        if (!is_array($item)) continue;
                        $s_card['items'][] = [
                            'label' => sanitize_text_field($item['label'] ?? ''),
                            'value' => sanitize_text_field($item['value'] ?? ''),
                        ];
                    }
                }
                $sanitized_cards[] = $s_card;
            }
            $school_data['customCards'] = $sanitized_cards;
        }
    }

    // ── Card order ───────────────────────────────────────────────────────────
    $card_order_raw = isset($_POST['lrsd_sf_card_order_json'])
        ? trim(wp_unslash($_POST['lrsd_sf_card_order_json']))
        : '';

    if ($card_order_raw !== '') {
        $card_order = json_decode($card_order_raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($card_order)) {
            $school_data['cardOrder'] = array_values(array_map('sanitize_key', $card_order));
        }
    }

    // ── School ID ─────────────────────────────────────────────────────────────
    $school_id = isset($school_data['id']) ? sanitize_text_field((string)$school_data['id']) : '';
    if ($school_id === '') {
        $school_id = get_post_meta($post_id, 'lrsd_school_id', true);
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
