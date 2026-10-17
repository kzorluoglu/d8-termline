const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const source = fs.readFileSync('js/script.js', 'utf8');
function setup(restUrl = 'https://example.com/wp-json/wp/v2/') {
    const dom = new JSDOM(`<aside id="d8-terminal"><section class="d8-panel" hidden><button class="d8-close"></button><div class="d8-output"></div><form><input><button></button></form></section><button class="d8-toggle"></button></aside>`, { url: 'https://example.com/', runScripts: 'outside-only' });
    const w = dom.window; w.d8TerminalConfig = { restUrl, siteTitle: '<img src=x onerror=alert(1)>', siteDescription: 'Test' };
    const requests = [];
    w.fetch = async (url, options) => {
        requests.push({ url: String(url), options });
        return { ok: true, headers: { get: () => '2' }, json: async () => [{ id: 7, title: { rendered: '<img src=x onerror=alert(1)>Article' }, date: '2026-10-17', status: 'publish', content: { rendered: '<script>alert(1)</script><p>Safe text</p>' }, link: 'javascript:alert(1)' }] };
    };
    w.eval(source); w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    const root = w.document.querySelector('#d8-terminal'); root.querySelector('.d8-toggle').click();
    async function run(command) { root.querySelector('input').value = command; root.querySelector('form').dispatchEvent(new w.Event('submit', { cancelable: true })); await new Promise(r => setTimeout(r, 10)); }
    return { dom, w, root, requests, run };
}
test('command parser, registry and unsafe URLs', () => {
    const { dom, w } = setup(); const api = w.D8Terminal;
    assert.deepEqual(Array.from(api.tokenize('search "two words" 2 5')), ['search', 'two words', '2', '5']);
    assert.throws(() => api.tokenize('search "open'));
    assert.throws(() => api.registerCommand('help', { execute() {} }));
    assert.throws(() => api.positive('0', 1)); assert.throws(() => api.positive('51', 10, 50));
    assert.equal(api.safeUrl('javascript:alert(1)'), null); assert.equal(api.safeUrl('data:text/html,test'), null);
    dom.window.close();
});
test('untrusted commands, site metadata and article content cannot create executable DOM', async () => {
    const { dom, root, run, requests } = setup();
    await run('<img src=x onerror=alert(1)>'); await run('cat 7');
    assert.equal(root.querySelectorAll('img,script,iframe').length, 0);
    assert.equal(root.querySelectorAll('a').length, 0);
    assert.match(root.textContent, /Safe text/);
    assert.equal(requests[0].options.credentials, 'omit');
    dom.window.close();
});
test('search encodes query, validates pagination and generates working next page', async () => {
    const { dom, root, run, requests } = setup();
    await run('search "hello & world" 1 5');
    const url = new URL(requests[0].url);
    assert.equal(url.searchParams.get('search'), 'hello & world'); assert.equal(url.searchParams.get('per_page'), '5');
    [...root.querySelectorAll('.d8-output button')].find(b => b.textContent === 'Next →').click();
    await new Promise(r => setTimeout(r, 10)); assert.equal(new URL(requests[1].url).searchParams.get('page'), '2');
    await run('ls 1 51'); assert.equal(requests.length, 2);
    dom.window.close();
});
test('plain permalinks preserve rest_route and cross-origin API is blocked', async () => {
    const first = setup('https://example.com/?rest_route=/wp/v2/'); await first.run('ls');
    assert.equal(new URL(first.requests[0].url).searchParams.get('rest_route'), '/wp/v2/posts'); first.dom.window.close();
    const second = setup('https://evil.example/wp-json/wp/v2/'); await second.run('ls'); assert.equal(second.requests.length, 0); second.dom.window.close();
});
test('close returns focus and reopening does not duplicate welcome output', () => {
    const { dom, root, w } = setup(); const before = root.querySelector('.d8-output').childElementCount;
    root.querySelector('.d8-close').click(); assert.equal(w.document.activeElement, root.querySelector('.d8-toggle'));
    root.querySelector('.d8-toggle').click(); assert.equal(root.querySelector('.d8-output').childElementCount, before); dom.window.close();
});
