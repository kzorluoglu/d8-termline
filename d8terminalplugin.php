<?php
/**
 * Plugin Name: D8 Linux Terminal Widget
 * Plugin URI: https://github.com/kzorluoglu/d8terminal-wp-plugin
 * Update URI: https://github.com/kzorluoglu/d8terminal-wp-plugin
 * Description: An extensible, accessible terminal for exploring public WordPress content.
 * Version: 2.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: d8devs
 * License: GPL-2.0-or-later
 * Text Domain: d8-linux-terminal-widget
 */
if (!defined('ABSPATH')) { exit; }
require_once __DIR__ . '/includes/Plugin.php';
add_action('plugins_loaded', static function () {
    (new \D8Terminal\Plugin(__FILE__))->boot();
});
