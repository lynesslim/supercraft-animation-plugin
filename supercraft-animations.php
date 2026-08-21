<?php
/**
 * Plugin Name: Superanimate GSAP Elementor
 * Description: GSAP-based animation presets with Elementor controls.
 * Version: 0.6.0
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

// Set GitHub Personal Access Token if defined in wp-config.php or saved in settings (prevents 403 rate limit errors)
$githubToken = defined('SUPERCRAFT_GITHUB_TOKEN') ? SUPERCRAFT_GITHUB_TOKEN : get_option('supercraft_github_token', '');
if (!empty($githubToken)) {
    $supercraftUpdateChecker->setAuthentication($githubToken);
}


