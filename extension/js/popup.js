(() => {
    'use strict';

    const cfg = self.APP_CONFIG || { brand: 'Manix', channel: 'main', version: '0.0.0', defaultAccent: 'lavender' };

    const ACCENTS = {
        'lavender': '#b3a0f0',
        'red': '#e5484d',
        'pink': '#ef7bb0',
        'dark pink': '#d6336c',
        'blue': '#4a7dff',
        'purple': '#8250df',
        'white': '#ffffff',
        'grey': '#808080',
        'teal': '#22b8cf',
        'indigo': '#563d7c',
    };

    const hasExt = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;
    const store = {
        get(k) {
            return hasExt
                ? new Promise(res => chrome.storage.sync.get(k, o => res(o[k])))
                : Promise.resolve(localStorage.getItem('manix:' + k));
        },
        set(k, v) {
            if (hasExt) return new Promise(res => chrome.storage.sync.set({ [k]: v }, res));
            localStorage.setItem('manix:' + k, v);
            return Promise.resolve();
        },
    };

    const $ = s => document.querySelector(s);
    const rootEl = document.documentElement;
    const body = document.body;

    $('#brandName').textContent = cfg.brand.toUpperCase();
    $('#channelTag').textContent = cfg.channel;
    $('#verTag').textContent = 'v' + cfg.version;
    $('#kvChannel').textContent = cfg.channel + ' · ' + cfg.brand;
    $('#kvBuild').textContent = cfg.version;
    $('#footBrand').textContent = cfg.brand.toLowerCase();
    document.title = cfg.brand;

    function setAccent(name, save) {
        const hex = ACCENTS[name] || ACCENTS[cfg.defaultAccent];
        rootEl.style.setProperty('--accent', hex);
        for (const b of document.querySelectorAll('.swatch'))
            b.setAttribute('aria-checked', String(b.dataset.accent === name));
        $('#accentName').textContent = name;
        if (save) store.set('accent', name);
    }

    function setTheme(t, save) {
        rootEl.dataset.theme = t;
        $('#themeSeg').dataset.active = t;
        for (const b of document.querySelectorAll('.seg-opt'))
            b.setAttribute('aria-checked', String(b.dataset.themeOpt === t));
        if (save) store.set('theme', t);
    }

    const rail = $('#rail');
    const pct = rail.querySelector('.pct');
    let beads = [];

    function buildRail() {
        const count = Math.max(5, Math.min(11, Math.round(body.scrollHeight / 120)));
        if (rail.querySelectorAll('i').length !== count) {
            rail.querySelectorAll('i').forEach(n => n.remove());
            for (let i = 0; i < count; i++) {
                const b = document.createElement('i');
                b.style.animationDelay = i * 35 + 'ms';
                rail.insertBefore(b, pct);
            }
        }
        beads = [...rail.querySelectorAll('i')];
        paintRail();
    }

    function paintRail() {
        const sh = body.scrollHeight, vh = body.clientHeight, st = body.scrollTop;
        const p = Math.max(0, Math.min(1, (st + vh) / sh));
        beads.forEach((b, i) => {
            const f = Math.max(0, Math.min(1, p * beads.length - i));
            b.style.setProperty('--f', f.toFixed(3));
            b.classList.toggle('full', f >= 0.999);
        });
        pct.textContent = Math.round(p * 100) + '%';
        $('#masthead').classList.toggle('scrolled', st > 4);
    }

    window.addEventListener('scroll', paintRail, { passive: true });

    for (const head of document.querySelectorAll('.block-head')) {
        head.addEventListener('click', () => {
            const block = head.closest('.block');
            const wasOpen = block.classList.contains('open');
            for (const b of document.querySelectorAll('.block.open')) {
                b.classList.remove('open');
                b.querySelector('.block-head').setAttribute('aria-expanded', 'false');
            }
            if (!wasOpen) {
                block.classList.add('open');
                head.setAttribute('aria-expanded', 'true');
            }
            setTimeout(buildRail, 500);
        });
    }

    for (const b of document.querySelectorAll('.swatch'))
        b.addEventListener('click', () => setAccent(b.dataset.accent, true));
    for (const b of document.querySelectorAll('.seg-opt'))
        b.addEventListener('click', () => setTheme(b.dataset.themeOpt, true));

    (async () => {
        const [accent, theme] = await Promise.all([store.get('accent'), store.get('theme')]);
        setAccent(ACCENTS[accent] ? accent : cfg.defaultAccent, false);
        setTheme(theme === 'light' ? 'light' : 'dark', false);
        buildRail();
    })();

    window.addEventListener('load', buildRail);
})();