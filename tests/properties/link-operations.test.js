const fc = require('fast-check');
const installPage = require('../../test-utils/page');
const name = fc.fullUnicodeString({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0 && s.trim().length <= 50);
const whitespace = fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { maxLength: 20 }).map(a => a.join(''));
function reset() { localStorage.clear(); App.QuickLinksManager.init(); }
beforeEach(() => { installPage(); reset(); });

test('Property 13: Link Creation - Requirement 10.1', () => {
    fc.assert(fc.property(name, fc.webUrl(), (value, url) => {
        reset();
        expect(App.QuickLinksManager.addLink(value, url)).toBe(true);
        const link = App.QuickLinksManager.getLinks()[0];
        expect(link).toEqual({ id: expect.any(String), name: value.trim(), url: new URL(url).href, createdAt: Date.now() });
        expect(App.Storage.get('dashboard_links')).toEqual([link]);
    }), { numRuns: 100 });
});

test('Property 8: Link List Growth Invariant - Requirements 10.2, 12.1', () => {
    fc.assert(fc.property(fc.array(name, { minLength: 1, maxLength: 8 }), fc.nat(), (values, index) => {
        reset();
        values.forEach((value, i) => {
            App.QuickLinksManager.addLink(value, 'example.com');
            expect(App.QuickLinksManager.getLinks()).toHaveLength(i + 1);
        });
        const links = App.QuickLinksManager.getLinks();
        const removed = links[index % links.length];
        App.QuickLinksManager.deleteLink(removed.id);
        expect(App.QuickLinksManager.getLinks()).toEqual(links.filter(l => l.id !== removed.id));
        expect(document.querySelectorAll('.link-item')).toHaveLength(values.length - 1);
        expect(App.Storage.get('dashboard_links')).toEqual(App.QuickLinksManager.getLinks());
    }), { numRuns: 100 });
});

test('Property 14: Link Input Validation - Requirement 10.4', () => {
    fc.assert(fc.property(name, whitespace, (value, blank) => {
        reset();
        expect(App.QuickLinksManager.addLink(blank, 'example.com')).toBe(false);
        expect(App.QuickLinksManager.addLink(value, blank)).toBe(false);
        expect(App.QuickLinksManager.getLinks()).toEqual([]);
        expect(localStorage.getItem('dashboard_links')).toBeNull();
    }), { numRuns: 100 });
});

test('Property 16: Link Button Text Mapping - Requirement 11.2', () => {
    fc.assert(fc.property(fc.array(name, { maxLength: 8 }), values => {
        reset(); values.forEach(value => App.QuickLinksManager.addLink(value, 'example.com'));
        expect(Array.from(document.querySelectorAll('.link-button'), b => b.textContent))
            .toEqual(values.map(value => value.trim().slice(0, 50)));
    }), { numRuns: 100 });
});

test.each(['example.com', 'example.com:8080/path', '//example.com/path'])('normalizes %s to HTTPS', url => {
    expect(App.QuickLinksManager.addLink('Example', url)).toBe(true);
    expect(App.QuickLinksManager.getLinks()[0].url.startsWith('https://')).toBe(true);
});

test.each(['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'ftp://example.com', 'https://', 'bad host', 'https://user:password@example.com'])('rejects unsafe or malformed URL %s', url => {
    expect(App.QuickLinksManager.addLink('Example', url)).toBe(false);
    expect(App.QuickLinksManager.getLinks()).toEqual([]);
    expect(document.getElementById('link-url').validationMessage).toBe('Please enter a valid URL');
});
