<?php

defined('ABSPATH') || exit;

function lrsd_sf_register_post_type() {
    $labels = [
        'name'               => __('School Facilities', 'lrsd-school-facilities'),
        'singular_name'      => __('School Facility', 'lrsd-school-facilities'),
        'menu_name'          => __('School Facilities', 'lrsd-school-facilities'),
        'add_new_item'       => __('Add New School', 'lrsd-school-facilities'),
        'edit_item'          => __('Edit School', 'lrsd-school-facilities'),
        'new_item'           => __('New School', 'lrsd-school-facilities'),
        'view_item'          => __('View School', 'lrsd-school-facilities'),
        'search_items'       => __('Search Schools', 'lrsd-school-facilities'),
        'not_found'          => __('No schools found', 'lrsd-school-facilities'),
        'not_found_in_trash' => __('No schools found in Trash', 'lrsd-school-facilities'),
    ];

    register_post_type('lr_school', [
        'labels'             => $labels,
        'public'             => false,
        'show_ui'            => true,
        'show_in_menu'       => false,
        'show_in_rest'       => true,
        'supports'           => ['title'],
        'has_archive'        => false,
        'publicly_queryable' => false,
        'exclude_from_search'=> true,
        'capability_type'    => 'post',
        'map_meta_cap'       => true,
        'menu_position'      => 58,
    ]);
}

/**
 * Ensure the correct parent menu and submenu are highlighted when editing
 * a school post (lr_school), since the post type is not auto-added to the menu.
 */
function lrsd_sf_parent_menu_highlight($parent_file) {
    global $post_type;
    if ($post_type === 'lr_school') {
        return 'lrsd-school-facilities';
    }
    return $parent_file;
}
add_filter('parent_file', 'lrsd_sf_parent_menu_highlight');

function lrsd_sf_submenu_highlight($submenu_file) {
    global $post_type;
    if ($post_type === 'lr_school') {
        return 'edit.php?post_type=lr_school';
    }
    return $submenu_file;
}
add_filter('submenu_file', 'lrsd_sf_submenu_highlight');

/**
 * Force the Update by School list table to load alphabetically by school title.
 */
function lrsd_sf_default_school_admin_sort($query) {
    if (!is_admin() || !$query->is_main_query()) {
        return;
    }

    global $pagenow;
    if ($pagenow !== 'edit.php') {
        return;
    }

    $post_type = $query->get('post_type');
    if ($post_type !== 'lr_school') {
        return;
    }

    $query->set('orderby', 'title');
    $query->set('order', 'ASC');

    $meta_query = $query->get('meta_query');
    if (!is_array($meta_query)) {
        $meta_query = [];
    }
    $meta_query[] = [
        'relation' => 'OR',
        [
            'key'     => 'lrsd_school_id',
            'compare' => 'NOT EXISTS',
        ],
        [
            'key'     => 'lrsd_school_id',
            'value'   => array_merge(lrsd_sf_get_reserved_dataset_keys(), ['fosMAPLookup']),
            'compare' => 'NOT IN',
        ],
    ];
    $query->set('meta_query', $meta_query);
}
add_action('pre_get_posts', 'lrsd_sf_default_school_admin_sort');

/**
 * Remove non-school dataset records from the native school list table.
 */
function lrsd_sf_filter_school_admin_posts($posts, $query) {
    if (!is_admin() || !$query->is_main_query()) {
        return $posts;
    }

    global $pagenow;
    if ($pagenow !== 'edit.php' || $query->get('post_type') !== 'lr_school') {
        return $posts;
    }

    return array_values(array_filter($posts, 'lrsd_sf_is_valid_school_post'));
}
add_filter('the_posts', 'lrsd_sf_filter_school_admin_posts', 10, 2);

/**
 * Remove bulk actions from Update by School list table.
 */
function lrsd_sf_remove_school_bulk_actions($actions) {
    return [];
}
add_filter('bulk_actions-edit-lr_school', 'lrsd_sf_remove_school_bulk_actions');

/**
 * Remove date-based filter dropdown from Update by School list table.
 */
function lrsd_sf_remove_school_month_filter($months, $post_type) {
    if ($post_type === 'lr_school') {
        return [];
    }
    return $months;
}
add_filter('months_dropdown_results', 'lrsd_sf_remove_school_month_filter', 10, 2);

/**
 * Hide extra filtering controls in Update by School list table.
 */
function lrsd_sf_hide_school_list_filters() {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || $screen->id !== 'edit-lr_school') {
        return;
    }
    ?>
    <style>
        .edit-php.post-type-lr_school .subsubsub,
        .edit-php.post-type-lr_school .search-box,
        .edit-php.post-type-lr_school .tablenav .actions.bulkactions,
        .edit-php.post-type-lr_school .tablenav .actions select[name="action"],
        .edit-php.post-type-lr_school .tablenav .actions select[name="action2"] {
            display: none !important;
        }
    </style>
    <?php
}
add_action('admin_head-edit.php', 'lrsd_sf_hide_school_list_filters');
