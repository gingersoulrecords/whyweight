<?php

/**
 * Plugin Name: WhyWeight
 * Plugin URI: https://yourwebsite.com/why-weight
 * Description: A WordPress plugin using jQuery and Swiper.js
 * Version: 1.0.2
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * Text Domain: why-weight
 * License: GPL v2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('WHY_WEIGHT_VERSION', '1.0.2');
define('WHY_WEIGHT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WHY_WEIGHT_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include files
require_once WHY_WEIGHT_PLUGIN_DIR . 'includes/enqueue.php';

// Hook enqueue function
add_action('wp_enqueue_scripts', 'why_weight_enqueue_scripts');
