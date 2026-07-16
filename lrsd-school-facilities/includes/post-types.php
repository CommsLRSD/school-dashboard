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
add_filter('parent_file', static function ($parent_file) {
    global $post_type;
    if ($post_type === 'lr_school') {
        return 'lrsd-school-facilities';
    }
    return $parent_file;
});

add_filter('submenu_file', static function ($submenu_file) {
    global $post_type;
    if ($post_type === 'lr_school') {
        return 'edit.php?post_type=lr_school';
    }
    return $submenu_file;
});
