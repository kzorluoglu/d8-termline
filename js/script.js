/* D8 Terminal public API. Extensions are trusted site code; output is always text. */
(() => {
    'use strict';
    const commands = new Map();
    function registerCommand(name, definition) {
        if (!/^[a-z][a-z0-9-]{0,31}$/.test(name) || !definition || typeof definition.execute !== 'function') throw new TypeError('Invalid command');
        if (commands.has(name)) throw new Error('Command already registered');
        commands.set(name, Object.freeze({ ...definition }));
        return () => commands.delete(name);
    }
    function tokenize(line) {
        const tokens = []; let value = ''; let quote = ''; let started = false; let escaped = false;
        for (const char of line.trim()) {
            if (escaped) { value += char; escaped = false; started = true; continue; }
            if (char === '\\') { escaped = true; started = true; continue; }
            if (quote) { if (char === quote) quote = ''; else value += char; }
            else if (char === '"' || char === "'") { quote = char; started = true; }
            else if (/\s/.test(char)) { if (started) { tokens.push(value); value = ''; started = false; } }
            else { value += char; started = true; }
        }
        if (quote || escaped) throw new Error('Close the quoted text or escape sequence first.');
        if (started) tokens.push(value);
        return tokens;
    }
    function positive(value, fallback, max = 10000) {
        if (value === undefined) return fallback;
        if (!/^[1-9]\d*$/.test(value) || Number(value) > max) throw new Error(`Use a number between 1 and ${max}.`);
        return Number(value);
    }
    function safeUrl(value) {
        try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
        catch { return null; }
    }
    const api = Object.freeze({ registerCommand, tokenize, positive, safeUrl, version: '2.0.0' });
    window.D8Terminal = api;

    function mount() {
        const root = document.getElementById('d8-terminal');
        if (!root || !window.d8TerminalConfig) return;
        const config = window.d8TerminalConfig;
        const panel = root.querySelector('.d8-panel');
        const output = root.querySelector('.d8-output');
        const input = root.querySelector('input');
        const toggle = root.querySelector('.d8-toggle');
        const form = root.querySelector('form');
        let busy = false; let initialized = false; let cursor = 0; let draft = '';
        const history = [];
        const plain = (html) => new DOMParser().parseFromString(String(html ?? ''), 'text/html').body.textContent || '';
        function print(value, kind = '') {
            const line = document.createElement('div');
            line.className = `d8-line ${kind}`;
            line.textContent = String(value ?? '');
            output.append(line);
            while (output.childElementCount > 300) output.firstElementChild.remove();
            output.scrollTop = output.scrollHeight;
            return line;
        }
        function link(label, href) {
            const url = safeUrl(href);
            if (!url) return;
            const a = document.createElement('a');
            a.textContent = label; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
            print('').append(a);
        }
        function button(label, command) {
            const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
            b.addEventListener('click', () => execute(command)); print('').append(b);
        }
        async function request(resource, params = {}) {
            if (!/^(posts(?:\/[1-9]\d*)?|categories)$/.test(resource)) throw new Error('Unsupported resource.');
            const base = new URL(config.restUrl, window.location.href);
            if (base.origin !== window.location.origin) throw new Error('The REST API must use the site origin.');
            const url = new URL(base);
            // rest_url supports both pretty permalinks and ?rest_route= installations.
            if (url.searchParams.has('rest_route')) url.searchParams.set('rest_route', url.searchParams.get('rest_route').replace(/\/$/, '') + '/' + resource);
            else url.pathname = url.pathname.replace(/\/$/, '') + '/' + resource;
            for (const [key, value] of Object.entries({ context: 'view', ...params })) url.searchParams.set(key, String(value));
            const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
            try {
                const response = await fetch(url, { credentials: 'omit', signal: controller.signal, redirect: 'error', headers: { Accept: 'application/json' } });
                if (!response.ok) throw new Error(response.status === 404 ? 'Content not found.' : `Request failed (${response.status}). Check the page number or try again.`);
                return { data: await response.json(), pages: Number(response.headers.get('X-WP-TotalPages')) || 0 };
            } finally { clearTimeout(timeout); }
        }
        async function list(params, page, perPage, makeCommand) {
            const result = await request('posts', { ...params, page, per_page: perPage, _fields: 'id,title,link,date', status: 'publish' });
            if (!result.data.length) { print('No posts found.'); return; }
            for (const post of result.data) button(`${post.id}  ${plain(post.title.rendered)}  ·  ${post.date.slice(0, 10)}`, `cat ${post.id}`);
            print(`Page ${page} of ${result.pages}`);
            if (page > 1) button('← Previous', makeCommand(page - 1));
            if (page < result.pages) button('Next →', makeCommand(page + 1));
        }
        const context = Object.freeze({ print, link, request, config: Object.freeze({ ...config }) });
        function builtin(name, usage, description, execute) { registerCommand(name, { usage, description, execute }); }
        builtin('help', 'help', 'Show available commands', () => {
            for (const [name, command] of commands) print(`${command.usage || name} — ${command.description || ''}`);
        });
        builtin('clear', 'clear', 'Clear the console', () => output.replaceChildren());
        builtin('about', 'about', 'About this site', () => { print(config.siteTitle, 'd8-title'); print(config.siteDescription); });
        builtin('ls', 'ls [page] [per_page]', 'Browse published articles', async (args) => {
            const page = positive(args[0], 1); const size = positive(args[1], 10, 50);
            await list({}, page, size, p => `ls ${p} ${size}`);
        });
        builtin('search', 'search "query" [page] [per_page]', 'Search articles; quote multiword queries when paginating', async (args) => {
            if (!args.length || !args[0].trim()) throw new Error('Usage: search "query" [page] [per_page]');
            let size = 10; let page = 1;
            if (args.length > 1 && /^\d+$/.test(args.at(-1))) {
                const last = args.pop();
                if (args.length > 1 && /^\d+$/.test(args.at(-1))) { size = positive(last, 10, 50); page = positive(args.pop(), 1); }
                else page = positive(last, 1);
            }
            const query = args.join(' ');
            await list({ search: query }, page, size, p => `search ${JSON.stringify(query)} ${p} ${size}`);
        });
        builtin('posts', 'posts <category-id> [page] [per_page]', 'Browse a category', async (args) => {
            const id = positive(args[0], undefined, 2147483647);
            if (!id) throw new Error('Provide a category ID.');
            const page = positive(args[1], 1); const size = positive(args[2], 10, 50);
            await list({ categories: id }, page, size, p => `posts ${id} ${p} ${size}`);
        });
        builtin('categories', 'categories [page]', 'Browse categories', async (args) => {
            const page = positive(args[0], 1);
            const result = await request('categories', { page, per_page: 50, hide_empty: true, _fields: 'id,name,count' });
            if (!result.data.length) print('No categories found.');
            for (const category of result.data) button(`${category.id}  ${plain(category.name)} (${category.count})`, `posts ${category.id}`);
            if (page > 1) button('← Previous', `categories ${page - 1}`);
            if (page < result.pages) button('Next →', `categories ${page + 1}`);
        });
        builtin('cat', 'cat <post-id or slug>', 'Read an article as plain text', async (args) => {
            if (!args.length) throw new Error('Provide a post ID or slug.');
            const identifier = args.join(' ');
            const fields = 'id,title,content,link,status';
            const result = /^\d+$/.test(identifier)
                ? await request(`posts/${positive(identifier, undefined, 2147483647)}`, { _fields: fields })
                : await request('posts', { slug: identifier, per_page: 1, status: 'publish', _fields: fields });
            const post = Array.isArray(result.data) ? result.data[0] : result.data;
            if (!post || post.status !== 'publish') throw new Error('Public article not found.');
            print(plain(post.title.rendered), 'd8-title');
            print(plain(post.content.rendered).slice(0, 80000));
            link('Read original ↗', post.link);
        });
        async function execute(line) {
            if (busy || !line.trim()) return;
            if (line.length > 500) { print('Command is too long.', 'd8-error'); return; }
            busy = true; input.disabled = true; output.setAttribute('aria-busy', 'true');
            history.push(line); if (history.length > 100) history.shift(); cursor = history.length; draft = '';
            input.value = ''; print(`visitor ~ $ ${line}`, 'd8-echo');
            try {
                const [name, ...args] = tokenize(line);
                const command = commands.get(name);
                if (!command) throw new Error(`Unknown command: ${name}. Type help.`);
                await command.execute(args, context);
            } catch (error) { print(error.name === 'AbortError' ? 'Request timed out. Try again.' : error.message, 'd8-error'); }
            finally {
                busy = false; input.disabled = false; output.setAttribute('aria-busy', 'false');
                if (!panel.hidden && root.contains(document.activeElement)) input.focus();
                output.scrollTop = output.scrollHeight;
            }
        }
        function open(show) {
            panel.hidden = !show; toggle.setAttribute('aria-expanded', String(show));
            if (show) {
                input.focus();
                if (!initialized) {
                    initialized = true; print(config.siteTitle, 'd8-title'); print(config.siteDescription);
                    print('Explore the site from your keyboard. Type help for commands.');
                    if (config.initialCommand) execute(config.initialCommand);
                }
            } else toggle.focus();
        }
        toggle.addEventListener('click', () => open(panel.hidden));
        root.querySelector('.d8-close').addEventListener('click', () => open(false));
        root.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); open(false); } });
        form.addEventListener('submit', event => { event.preventDefault(); execute(input.value); });
        input.addEventListener('keydown', event => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault(); if (cursor === history.length) draft = input.value;
                cursor = Math.max(0, Math.min(history.length, cursor + (event.key === 'ArrowUp' ? -1 : 1)));
                input.value = history[cursor] ?? draft;
            }
            if (event.key === 'Tab' && input.value && !/\s/.test(input.value)) {
                const matches = [...commands.keys()].filter(name => name.startsWith(input.value));
                if (matches.length) { event.preventDefault(); if (matches.length === 1) input.value = matches[0] + ' '; else print(matches.join('  ')); }
            }
        });
        document.dispatchEvent(new CustomEvent('d8terminal:ready', { detail: api }));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
