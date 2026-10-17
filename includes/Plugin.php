<?php
namespace D8Terminal;
if (!defined('ABSPATH')) { exit; }

final class Plugin
{
    public const VERSION = '2.0.0';
    private string $file;
    private bool $rendered = false;

    public function __construct(string $file) { $this->file = $file; }

    public function boot(): void
    {
        add_action('wp_enqueue_scripts', [$this, 'assets']);
        add_action('wp_footer', [$this, 'render']);
        do_action('d8_terminal_loaded', $this);
    }

    public function enabled(): bool
    {
        return !is_admin() && !is_feed() && (bool) apply_filters('d8_terminal_enabled', true);
    }

    public function assets(): void
    {
        if (!$this->enabled()) { return; }
        wp_enqueue_style('d8-terminal-style', plugin_dir_url($this->file) . 'css/style.css', [], self::VERSION);
        wp_enqueue_script('d8-terminal-script', plugin_dir_url($this->file) . 'js/script.js', [], self::VERSION, true);
        $config = [
            'restUrl' => esc_url_raw(rest_url('wp/v2/')),
            'siteTitle' => wp_strip_all_tags(get_bloginfo('name')),
            'siteDescription' => wp_strip_all_tags(get_bloginfo('description')),
            'initialCommand' => is_singular('post') ? 'cat ' . get_queried_object_id() : '',
        ];
        if (is_category()) { $config['initialCommand'] = 'posts ' . get_queried_object_id(); }
        wp_localize_script('d8-terminal-script', 'd8TerminalConfig', apply_filters('d8_terminal_config', $config));
        // Extensions enqueue their own scripts with d8-terminal-script as a dependency.
        do_action('d8_terminal_enqueue', 'd8-terminal-script');
    }

    public function render(): void
    {
        if ($this->rendered || !$this->enabled()) { return; }
        $this->rendered = true;
        ?>
        <aside id="d8-terminal" aria-label="<?php esc_attr_e('Site terminal', 'd8-linux-terminal-widget'); ?>">
            <section class="d8-panel" id="d8-terminal-panel" aria-label="<?php esc_attr_e('Terminal console', 'd8-linux-terminal-widget'); ?>" hidden>
                <header class="d8-header"><span class="d8-lights" aria-hidden="true">● ● ●</span><span>d8 / terminal</span><button type="button" class="d8-close" aria-label="<?php esc_attr_e('Close terminal', 'd8-linux-terminal-widget'); ?>">×</button></header>
                <div class="d8-output" role="log" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
                <form class="d8-prompt" autocomplete="off"><label for="d8-terminal-input">visitor ~ $</label><input id="d8-terminal-input" name="command" type="text" maxlength="500" spellcheck="false" autocapitalize="off" aria-label="<?php esc_attr_e('Terminal command', 'd8-linux-terminal-widget'); ?>" placeholder="Type help to get started"><button type="submit" aria-label="<?php esc_attr_e('Run command', 'd8-linux-terminal-widget'); ?>">↵</button></form>
                <footer class="d8-hint">TAB autocomplete · ↑↓ history · ESC close</footer>
            </section>
            <button type="button" class="d8-toggle" aria-expanded="false" aria-controls="d8-terminal-panel"><span aria-hidden="true">&gt;_</span> Terminal</button>
        </aside>
        <?php
    }
}
