(() => {
    'use strict';

    const ModuleSystem = {
        API: {
            accents: new Map(),
            fonts: new Map(),
            registerAccent(id, hex) {
                this.accents.set(id, hex);
            },
            registerFont(id, family) {
                this.fonts.set(id, family);
            }
        },

        _manifest: [],
        _enabled: new Set(),

        async init(manifestUrl) {
            try {
                const stored = await new Promise((res) => {
                    chrome.storage.sync.get('enabledModules', res);
                });
                this._enabled = new Set((stored && stored.enabledModules) || []);
            } catch (e) {
                // storage unavailable in this context
            }

            let base = manifestUrl;
            try {
                base = new URL('.', manifestUrl).href;
            } catch (e) { /* keep raw url */ }

            try {
                const resp = await fetch(manifestUrl);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                this._manifest = (data.modules || []).map((m) => ({
                    ...m,
                    css: m.css ? new URL(m.css, base).href : null,
                    js: m.js ? new URL(m.js, base).href : null,
                }));
            } catch (e) {
                console.error('[modules] manifest load failed:', e.message);
                return;
            }

            for (const id of this._enabled) {
                const mod = this._manifest.find(m => m.id === id);
                if (mod) await this._load(mod);
            }
        },

        get modules() { return this._manifest; },
        isEnabled(id) { return this._enabled.has(id); },

        async toggle(id) {
            const mod = this._manifest.find(m => m.id === id);
            if (!mod) return false;

            if (this._enabled.has(id)) {
                this._enabled.delete(id);
                this._unload(id);
            } else {
                this._enabled.add(id);
                await this._load(mod);
            }

            try {
                await new Promise((res) => {
                    chrome.storage.sync.set({ enabledModules: [...this._enabled] }, res);
                });
            } catch (e) { /* storage unavailable */ }

            return this._enabled.has(id);
        },

        _load(mod) {
            return new Promise((resolve) => {
                let done = 0;
                const total = (mod.css ? 1 : 0) + (mod.js ? 1 : 0);
                if (total === 0) { resolve(); return; }
                const check = () => { if (++done >= total) resolve(); };

                if (mod.css) {
                    const link = document.createElement('link');
                    link.id = `mod-css-${mod.id}`;
                    link.rel = 'stylesheet';
                    link.href = mod.css;
                    link.onload = check;
                    link.onerror = check;
                    document.head.appendChild(link);
                }

                if (mod.js) {
                    const script = document.createElement('script');
                    script.id = `mod-js-${mod.id}`;
                    script.src = mod.js;
                    script.onload = check;
                    script.onerror = check;
                    document.head.appendChild(script);
                }
            });
        },

        _unload(id) {
            const css = document.getElementById(`mod-css-${id}`);
            if (css) css.remove();
            const js = document.getElementById(`mod-js-${id}`);
            if (js) js.remove();
        }
    };

    self.ModuleSystem = ModuleSystem;
})();
