// Static demo: answers the app's API calls from bundled files. Creating, deleting and planning are disabled.
(() => {
  const DEMO = 'This is just a demo, so creating new lessons is disabled. Open one of the two lessons in the Library to watch and play with it.';
  const realFetch = window.fetch.bind(window);
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const disabled = () => json({ detail: DEMO, message: DEMO, error: { code: 'DEMO', message: DEMO } }, 403);
  const route = (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return null;
    const method = ((init && init.method) || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
    if (method !== 'GET') return Promise.resolve(disabled());
    const p = url.pathname;
    if (p === '/api/me') return Promise.resolve(json({ user: null }));
    if (p === '/api/videos') return realFetch('/data/videos.json');
    let m = p.match(/^\/api\/videos\/([a-f0-9-]{36})$/);
    if (m) return realFetch(`/data/${m[1]}.json`);
    if (/^\/api\/videos\/[a-f0-9-]{36}\/scene-requests$/.test(p)) return Promise.resolve(json([]));
    return Promise.resolve(json({ detail: 'Not available in this demo.' }, 404));
  };
  window.fetch = (input, init) => route(input, init) || realFetch(input, init);

  // Lesson pages subscribe to live progress; the demo lessons are finished, so send the manifest once.
  const RealEventSource = window.EventSource;
  window.EventSource = class extends EventTarget {
    constructor(url) {
      const m = new URL(url, location.href).pathname.match(/^\/api\/videos\/([a-f0-9-]{36})\/events$/);
      if (!m) return new RealEventSource(url);
      super(); this.url = url; this.readyState = 0; this.onerror = null; this.onmessage = null; this.onopen = null;
      realFetch(`/data/${m[1]}.json`).then(r => { if (!r.ok) throw new Error(); return r.text(); })
        .then(text => { if (this.readyState === 2) return; this.readyState = 1; this.dispatchEvent(new MessageEvent('manifest', { data: text })); })
        .catch(() => { if (this.readyState !== 2) this.dispatchEvent(new MessageEvent('deleted', { data: '' })); });
    }
    close() { this.readyState = 2; }
  };

  const badge = () => {
    if (document.getElementById('demo-badge')) return;
    const el = document.createElement('div');
    el.id = 'demo-badge';
    el.textContent = 'Demo · creating lessons is disabled';
    el.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;padding:6px 12px;border-radius:999px;font:600 12px/1.3 system-ui,sans-serif;background:#1f1d2b;color:#fff;opacity:.88;pointer-events:none';
    document.body.appendChild(el);
  };
  if (document.body) badge(); else document.addEventListener('DOMContentLoaded', badge);
})();
