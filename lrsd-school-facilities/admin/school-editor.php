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

function lrsd_sf_render_school_meta_box(WP_Post $post) {
    $school_data = lrsd_sf_normalize_school_data(get_post_meta($post->ID, 'lrsd_school_data', true));

    $field_map = lrsd_sf_get_simple_field_map();
    $playground_lines = implode("\n", (array) lrsd_sf_get_nested_value($school_data, ['playground'], []));

    $project_paths = [
        'projects_provincial_requested' => ['projects', 'provincial', 'requested'],
        'projects_provincial_inProgress' => ['projects', 'provincial', 'inProgress'],
        'projects_provincial_completed' => ['projects', 'provincial', 'completed'],
        'projects_local_requested' => ['projects', 'local', 'requested'],
        'projects_local_inProgress' => ['projects', 'local', 'inProgress'],
        'projects_local_completed' => ['projects', 'local', 'completed'],
    ];

    wp_nonce_field('lrsd_sf_save_school', 'lrsd_sf_school_nonce');
    ?>
    <p><?php esc_html_e('Use the common fields below for quick updates. The full JSON remains the source of truth.', 'lrsd-school-facilities'); ?></p>

    <table class="form-table lrsd-sf-editor-table" role="presentation">
        <tbody>
            <?php foreach ($field_map as $field_key => $field) : ?>
                <?php $value = lrsd_sf_get_nested_value($school_data, $field['path'], ''); ?>
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr($field_key); ?>"><?php echo esc_html($field['label']); ?></label></th>
                    <td>
                        <input
                            type="text"
                            class="regular-text"
                            id="<?php echo esc_attr($field_key); ?>"
                            name="lrsd_sf_fields[<?php echo esc_attr($field_key); ?>]"
                            value="<?php echo esc_attr((string) $value); ?>"
                        />
                    </td>
                </tr>
            <?php endforeach; ?>

            <tr>
                <th scope="row"><label for="playground_lines"><?php esc_html_e('Playground (one item per line)', 'lrsd-school-facilities'); ?></label></th>
                <td><textarea id="playground_lines" name="lrsd_sf_playground_lines" rows="5" class="large-text code"><?php echo esc_textarea($playground_lines); ?></textarea></td>
            </tr>

            <?php foreach ($project_paths as $project_key => $path) : ?>
                <?php $project_lines = implode("\n", (array) lrsd_sf_get_nested_value($school_data, $path, [])); ?>
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr($project_key); ?>"><?php echo esc_html(str_replace('_', ' ', ucfirst($project_key))); ?></label></th>
                    <td><textarea id="<?php echo esc_attr($project_key); ?>" name="lrsd_sf_projects[<?php echo esc_attr($project_key); ?>]" rows="4" class="large-text code"><?php echo esc_textarea($project_lines); ?></textarea></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <p><strong><?php esc_html_e('Advanced full school JSON', 'lrsd-school-facilities'); ?></strong></p>
    <textarea name="lrsd_sf_advanced_json" rows="18" class="large-text code"><?php echo esc_textarea(wp_json_encode($school_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); ?></textarea>
    <p class="description">
        <?php esc_html_e('If needed, edit the full JSON directly. The JSON must remain valid.', 'lrsd-school-facilities'); ?>
        <?php esc_html_e('TODO: future versions can replace these text areas with polished repeatable field UIs.', 'lrsd-school-facilities'); ?>
    </p>
    <?php
}

function lrsd_sf_get_simple_field_map() {
    return [
        'schoolName' => ['label' => 'School Name', 'path' => ['schoolName'], 'type' => 'text'],
        'schoolType' => ['label' => 'School Type', 'path' => ['schoolType'], 'type' => 'text'],
        'headerImage' => ['label' => 'Header Image', 'path' => ['headerImage'], 'type' => 'text'],
        'address' => ['label' => 'Address', 'path' => ['address'], 'type' => 'text'],
        'phone' => ['label' => 'Phone', 'path' => ['phone'], 'type' => 'text'],
        'familyOfSchools' => ['label' => 'Family of Schools', 'path' => ['familyOfSchools'], 'type' => 'text'],
        'schoolLevel' => ['label' => 'School Level', 'path' => ['schoolLevel'], 'type' => 'text'],
        'grades' => ['label' => 'Grades', 'path' => ['grades'], 'type' => 'text'],
        'program' => ['label' => 'Program', 'path' => ['program'], 'type' => 'text'],
        'enrolment_capacity' => ['label' => 'Enrolment Capacity', 'path' => ['enrolment', 'capacity'], 'type' => 'int'],
        'enrolment_current' => ['label' => 'Enrolment Current', 'path' => ['enrolment', 'current'], 'type' => 'int'],
        'details_built' => ['label' => 'Details Built', 'path' => ['details', 'Built'], 'type' => 'int'],
        'details_size' => ['label' => 'Details Size', 'path' => ['details', 'Size'], 'type' => 'text'],
        'details_modular' => ['label' => 'Details Modular', 'path' => ['details', 'Modular'], 'type' => 'int'],
        'building_air_conditioning' => ['label' => 'Building Air Conditioning', 'path' => ['building', 'Air Conditioning'], 'type' => 'text'],
        'building_heating' => ['label' => 'Building Heating', 'path' => ['building', 'Heating'], 'type' => 'text'],
        'building_led_lighting' => ['label' => 'Building LED Lighting', 'path' => ['building', 'LED Lighting'], 'type' => 'text'],
        'catchment_migration' => ['label' => 'Catchment Migration', 'path' => ['catchment', 'migration'], 'type' => 'text'],
        'transportation_parking_spots' => ['label' => 'Transportation Parking Spots', 'path' => ['transportation', 'Parking spots'], 'type' => 'text'],
        'transportation_bus_loop' => ['label' => 'Transportation Bus Loop', 'path' => ['transportation', 'Bus Loop'], 'type' => 'text'],
    ];
}

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

    $simple_fields = isset($_POST['lrsd_sf_fields']) && is_array($_POST['lrsd_sf_fields'])
        ? wp_unslash($_POST['lrsd_sf_fields'])
        : [];

    foreach (lrsd_sf_get_simple_field_map() as $field_key => $field) {
        if (!array_key_exists($field_key, $simple_fields)) {
            continue;
        }

        $raw_value = $simple_fields[$field_key];
        $value     = '';

        if ($field['type'] === 'int') {
            $value = is_numeric($raw_value) ? (int) $raw_value : 0;
        } else {
            $value = sanitize_text_field((string) $raw_value);
        }

        lrsd_sf_set_nested_value($school_data, $field['path'], $value);
    }

    if (!empty($_POST['lrsd_sf_playground_lines'])) {
        $playground_lines = explode("\n", sanitize_textarea_field(wp_unslash($_POST['lrsd_sf_playground_lines'])));
        $playground_lines = array_values(array_filter(array_map('trim', $playground_lines), static function ($line) {
            return $line !== '';
        }));
        lrsd_sf_set_nested_value($school_data, ['playground'], $playground_lines);
    }

    $project_paths = [
        'projects_provincial_requested' => ['projects', 'provincial', 'requested'],
        'projects_provincial_inProgress' => ['projects', 'provincial', 'inProgress'],
        'projects_provincial_completed' => ['projects', 'provincial', 'completed'],
        'projects_local_requested' => ['projects', 'local', 'requested'],
        'projects_local_inProgress' => ['projects', 'local', 'inProgress'],
        'projects_local_completed' => ['projects', 'local', 'completed'],
    ];

    $posted_projects = isset($_POST['lrsd_sf_projects']) && is_array($_POST['lrsd_sf_projects'])
        ? wp_unslash($_POST['lrsd_sf_projects'])
        : [];

    foreach ($project_paths as $project_key => $path) {
        if (!array_key_exists($project_key, $posted_projects)) {
            continue;
        }

        $lines = explode("\n", sanitize_textarea_field((string) $posted_projects[$project_key]));
        $lines = array_values(array_filter(array_map('trim', $lines), static function ($line) {
            return $line !== '';
        }));

        lrsd_sf_set_nested_value($school_data, $path, $lines);
    }

    $school_id = isset($school_data['id']) ? sanitize_text_field((string) $school_data['id']) : '';
    if ($school_id === '') {
        $school_id = get_post_meta($post_id, 'lrsd_school_id', true);
    }

    if ($school_id !== '') {
        update_post_meta($post_id, 'lrsd_school_id', $school_id);
    }

    update_post_meta($post_id, 'lrsd_school_data', wp_slash(wp_json_encode($school_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)));

    $new_title = isset($school_data['schoolName']) ? sanitize_text_field((string) $school_data['schoolName']) : '';
    if ($new_title !== '' && $new_title !== $post->post_title) {
        remove_action('save_post_lr_school', 'lrsd_sf_save_school_meta', 10);
        wp_update_post([
            'ID'         => $post_id,
            'post_title' => $new_title,
        ]);
        add_action('save_post_lr_school', 'lrsd_sf_save_school_meta', 10, 2);
    }

    update_option('lrsd_schools_last_updated', wp_date('Y-m-d'));
    lrsd_sf_set_editor_notice(__('School record saved successfully.', 'lrsd-school-facilities'), 'success');
}

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
