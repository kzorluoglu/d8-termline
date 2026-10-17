# D8 Terminal 2.0

A dependency-free WordPress frontend console for public articles. Requires WordPress 6.0+ and PHP 8.0+. Install the plugin directory and activate it. Existing installations keep the same main PHP file and activation record.

Commands: `help`, `about`, `clear`, `ls [page] [per_page]`, `cat <id or slug>`, `search "query" [page] [per_page]`, `categories [page]`, `posts <category-id> [page] [per_page]`. Page sizes are limited to 50. Use arrow keys for session history, Tab for command completion, Escape to close.

## Extension API

Enqueue extension scripts after the core script:

```php
add_action('d8_terminal_enqueue', function ($handle) {
    wp_enqueue_script('my-terminal-commands', plugins_url('commands.js', __FILE__), [$handle], '1.0', true);
});
```

```js
// Runs in a dependent script. Register immediately; no DOM event is required.
const unregister = D8Terminal.registerCommand('hello', {
    usage: 'hello [name]',
    description: 'Greet a visitor',
    execute(args, { print, link }) {
        print(`Hello ${args.join(' ') || 'visitor'}`);
        link('Our website', 'https://example.com');
    }
});
```

Names must match `[a-z][a-z0-9-]{0,31}`; duplicates are rejected. The return value unregisters the command. Handlers may return a Promise. Context provides `print(text)`, `link(label, httpUrl)`, `request(resource, params)` and frozen public `config`. Resources are limited to posts, numeric post IDs and categories. The `d8terminal:ready` document event signals that the UI is mounted. The API is available immediately after the core script executes.

PHP hooks: `d8_terminal_enabled` (boolean), `d8_terminal_config` (public configuration), `d8_terminal_loaded` (Plugin instance), `d8_terminal_enqueue` (script handle). Disable via `add_filter('d8_terminal_enabled', '__return_false');`. Style with scoped CSS variables `--d8-bg`, `--d8-text`, `--d8-accent` on `#d8-terminal`.

## Security and privacy

All output uses DOM text nodes. Articles are intentionally displayed as plain text; the original article link preserves access to rich formatting. HTTP/HTTPS links only; no inline handlers, HTML output API, eval, shell execution, custom server endpoint, database writes or third-party runtime dependencies. Requests omit credentials and reject redirects and cross-origin REST URLs. Only public WordPress REST resources are used, including for signed-in visitors. Server metadata and visitor IP addresses are no longer exposed by this plugin. History stays in memory and is bounded; output and article size are bounded; requests time out after 12 seconds and command execution is serialized.

Extensions are trusted site JavaScript and must be reviewed like any plugin. These controls do not secure WordPress core, other plugins, the server or compromised extension code. Report vulnerabilities privately to the repository owner; avoid public exploit details before a fix is available.

## Development

`npm ci && npm test` runs DOM integration tests for injection, REST boundaries, parsing, search pagination and keyboard focus. `php -l d8terminalplugin.php` and `php -l includes/Plugin.php` check PHP syntax. Node dependencies are development-only; deploy only the PHP, includes, js and css files.

2.0 replaces undocumented global services with `window.D8Terminal`. Existing third-party scripts using `commandService` must migrate. The old six commands remain supported; `search` now accepts multiword queries and pagination correctly. The widget no longer auto-runs commands on every reopen.

License: GPL-2.0-or-later.
