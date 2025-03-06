<?php

/**
 * Script enqueuing for WhyWeight plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enqueue scripts for the frontend
 */
function why_weight_enqueue_scripts()
{
    // Only load on front-end, not in admin
    if (is_admin()) {
        return;
    }

    // Only load on singular posts or pages
    if (!is_singular()) {
        return;
    }

    // Enqueue Swiper CSS (local file)
    wp_enqueue_style(
        'swiper-css',
        WHY_WEIGHT_PLUGIN_URL . 'css/vendor/swiper/swiper-bundle.min.css',
        [],
        WHY_WEIGHT_VERSION
    );

    wp_enqueue_style(
        'why-weight-custom-css',
        WHY_WEIGHT_PLUGIN_URL . 'css/frontend.css',
        ['swiper-css'],
        WHY_WEIGHT_VERSION
    );

    // Make sure jQuery is loaded
    wp_enqueue_script('jquery');

    // Enqueue Swiper JS (local file)
    wp_enqueue_script(
        'swiper-js',
        WHY_WEIGHT_PLUGIN_URL . 'js/vendor/swiper/swiper-bundle.min.js',
        [],
        WHY_WEIGHT_VERSION,
        true
    );

    // Enqueue our frontend script
    wp_enqueue_script(
        'why-weight-frontend',
        WHY_WEIGHT_PLUGIN_URL . 'js/frontend.js',
        ['jquery', 'swiper-js'],
        WHY_WEIGHT_VERSION,
        true
    );
}
