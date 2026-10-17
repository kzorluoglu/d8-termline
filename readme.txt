=== D8 Pardus Terminal ===
Contributors: kzorluoglu
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 8.0
Tags: terminal, keyboard, accessibility, posts
Stable tag: 2.0.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

An extensible, accessible console for public WordPress content.

== Description ==
D8 Pardus Terminal adds a compact, keyboard-operated console to your site's frontend. Visitors can browse categories, list and search published posts, and read articles as plain text without leaving the page.

Commands include help, about, clear, ls, search, categories, posts and cat. Use Tab for completion, arrow keys for session history and Escape to close. Developers can register additional commands using documented PHP hooks and a JavaScript API.

This is a public-content browser, not a server terminal. It provides no shell, PHP editor, arbitrary code execution, file manager or database editing. All scripts and styles are bundled locally. It makes no third-party service requests and includes no telemetry, tracking or paid feature gates. Requests use your site's public WordPress REST API. Command history is kept in memory only and disappears on page reload.

The appearance is inspired by classic Pardus desktops. This independent project is not affiliated with, endorsed by, or an official product of the Pardus project. No Pardus logos or desktop assets are included.

Source and developer documentation: https://github.com/kzorluoglu/d8terminal-wp-plugin

== Installation ==
1. Upload the d8-pardus-terminal directory to wp-content/plugins, or upload the ZIP using Plugins > Add New.
2. Activate D8 Pardus Terminal.
3. Open a public page and select the terminal button. Type help to see commands.

== Frequently Asked Questions ==
= Does this run server commands? =
No. Commands browse public WordPress content using the site's REST API. They do not execute operating system commands.

= Does it expose private posts or user information? =
Requests omit authentication credentials and request published posts only. The widget does not collect visitor IP addresses or server information.

= Does it require an external service? =
No. The REST API must be available on the same origin as the website. No account or API key is required.

= Can developers extend it? =
Yes. See readme.md for the command registry and PHP hooks. Extension scripts are trusted site code and should be reviewed like other plugins.

== Changelog ==
= 2.0.3 =
* Rename to D8 Pardus Terminal and prepare the WordPress.org distribution.
* Align the translation domain and add installation, privacy and license documentation.

= 2.0.2 =
* Use the original release name, Pardus 1.0, throughout the interface.
= 2.0.1 =
* Rename to Pardus 2005 Terminal and introduce a compact classic terminal appearance.
= 2.0.0 =
* Replace unsafe HTML output with text-only rendering and validated links.
* Remove server and visitor metadata exposure.
* Add command registry, extension hooks, request boundaries and timeouts.
* Modernize responsive interface, keyboard navigation, history and completion.
* Fix search, article slugs and pagination. See readme.md for migration notes.
