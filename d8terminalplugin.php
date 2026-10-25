<?php
/**
 * Plugin Name: D8 Termline
 * Plugin URI: https://github.com/kzorluoglu/d8-pardus-terminal
 * Description: An extensible, accessible terminal for exploring public WordPress content.
 * Version: 2.0.4
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: d8devs
 * Author URI: https://d8devs.com
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * License: GPL-2.0-or-later
 * Text Domain: d8-termline
 */
if (!defined('ABSPATH')) { exit; }
require_once __DIR__ . '/includes/Plugin.php';
add_action('plugins_loaded', static function () {
    (new \D8Terminal\Plugin(__FILE__))->boot();
});
