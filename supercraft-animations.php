<?php
/**
 * Plugin Name: Superanimate GSAP Elementor
 * Description: GSAP-based animation presets with Elementor controls.
 * Version: 0.3.6
 * Author: Supercraft
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'includes/config.php';
require_once plugin_dir_path(__FILE__) . 'includes/validation.php';
require_once plugin_dir_path(__FILE__) . 'includes/render-attributes.php';
require_once plugin_dir_path(__FILE__) . 'includes/assets.php';
require_once plugin_dir_path(__FILE__) . 'includes/elementor-controls.php';
require_once plugin_dir_path(__FILE__) . 'includes/admin.php';

// Initialize Plugin Update Checker for automatic GitHub updates
require_once plugin_dir_path(__FILE__) . 'includes/plugin-update-checker/plugin-update-checker.php';
$supercraftUpdateChecker = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
    'https://github.com/lynesslim/supercraft-animation-plugin/',
    __FILE__,
    'supercraft-animation-plugin'
);
$supercraftUpdateChecker->setBranch('main');

