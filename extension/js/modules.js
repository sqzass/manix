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
        _base: 'modules/',

        async init(base = 'modules/') {
            this._base = base;
            try {
                const stored = await new Promise((res) => {
                    chrome.storage.sync.get('enabledModules', res);
                });
                this._enabled = new Set((stored && stored.enabledModules) || []);
            } catch (e) { /* storage unavailable in this context */ }

            try {
                const resp = await fetch(`${base}manifest.json`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                this._manifest = Object.entries(data.modules || {}).map(([id, m]) => ({
                    id,
                    ...m,
                    css: m.css ? `${base}${m.css}` : null,
                    js: m.js ? `${base}${m.js}` : null
                }));
            } catch (e) {
                console.error('[modules] manifest load failed:', e.message);
                return;
            }

            for (const id of this._enabled) {
                const mod = this._manifest.find(m => m.id === id);
                if (mod) await this.enable(mod);
            }
        },

        get modules() { return this._manifest; },
        isEnabled(id) { return this._enabled.has(id); },

        async enable(mod) {
            if (this._enabled.has(mod.id)) return true;
            this._enabled.add(mod.id);

            if (mod.css) {
                const link = document.createElement('link');
                link.id = `mod-css-${mod.id}`;
                link.rel = 'stylesheet';
                link.href = mod.css;
                document.head.appendChild(link);
            }
            if (mod.js) {
                const script = document.createElement('script');
                script.id = `mod-js-${mod.id}`;
                script.src = mod.js;
                document.head.appendChild(script);
            }

            try {
                await new Promise((res) => {
                    chrome.storage.sync.set({ enabledModules: [...this._enabled] }, res);
                });
            } catch (e) { /* storage unavailable */ }

            try {
                await new Promise((res) => {
                    chrome.runtime.sendMessage({ action: 'applyModule', module: mod }, res);
                });
            } catch (e) { /* background may not be ready */ }

            return true;
        },

        async disable(id) {
            if (!this._enabled.has(id)) return false;
            this._enabled.delete(id);

            const css = document.getElementById(`mod-css-${id}`);
            if (css) css.remove();
            const js = document.getElementById(`mod-js-${id}`);
            if (js) js.remove();

            try {
                await new Promise((res) => {
                    chrome.storage.sync.set({ enabledModules: [...this._enabled] }, res);
                });
            } catch (e) { /* storage unavailable */ }

            try {
                await new Promise((res) => {
                    chrome.runtime.sendMessage({ action: 'removeModule', id }, res);
                });
            } catch (e) { /* background may not be ready */ }

            return false;
        },

        async toggle(id) {
            if (this.isEnabled(id)) return await this.disable(id);
            const mod = this._manifest.find(m => m.id === id);
            if (!mod) return false;
            return await this.enable(mod);
        }
    };

    self.ModuleSystem = ModuleSystem;
})();

