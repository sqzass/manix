'use strict';

const UA_DEFAULT = null;
const GEO_DEFAULT = null;

const UA_HEADER = 'user-agent';

chrome.runtime.onInstalled.addListener(({ reason }) => {
    console.info(`[manix] onInstalled · ${reason}`);
});

/**
 * Module effects registry. Keys are module IDs.
 * Each effect is applied via chrome.declarativeNetRequest or chrome.scripting.
 */
const effects = new Map();

function setUARule(ua) {
    const id = 1;
    const rule = {
        id,
        priority: 1,
        action: {
            type: 'modifyHeaders',
            responseHeaders: [],
            requestHeaders: [
                { header: UA_HEADER, operation: 'set', value: ua }
            ]
        },
        condition: {
            urlFilter: '<all_urls>',
            resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'fetch']
        }
    };
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [id],
        addRules: [rule]
    });
}

function clearUARule() {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1]
    });
}

function injectGeolocation(tabId, lat, lon) {
    const code = `
        (() => {
            const _geo = navigator.geolocation;
            const pos = { coords: { latitude: ${lat}, longitude: ${lon}, accuracy: 10 }, timestamp: Date.now() };
            navigator.geolocation = new Proxy(_geo, {
                get(target, prop) {
                    if (prop === 'getCurrentPosition') return (cb) => cb(pos);
                    if (prop === 'watchPosition') return (cb) => { cb(1); return 1; };
                    if (prop === 'clearWatch') return () => {};
                    return target[prop];
                }
            });
        })();
    `;
    chrome.scripting.executeScript({
        target: { tabId },
        files: []
    }).then(() => {
        chrome.scripting.executeScript({
            target: { tabId },
            func: (lat, lon) => {
                const pos = { coords: { latitude: lat, longitude: lon, accuracy: 10 }, timestamp: Date.now() };
                const _geo = navigator.geolocation;
                navigator.geolocation = new Proxy(_geo, {
                    get(target, prop) {
                        if (prop === 'getCurrentPosition') return (cb) => cb(pos);
                        if (prop === 'watchPosition') return (cb) => { cb(1); return 1; };
                        if (prop === 'clearWatch') return () => {};
                        return target[prop];
                    }
                });
            },
            args: [lat, lon]
        });
    }).catch(() => {});
}

function clearGeolocation(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            delete navigator.geolocation;
        }
    }).catch(() => {});
}

function applyEffect(mod) {
    if (mod.type === 'ua' && mod.config && mod.config.userAgent) {
        effects.set(mod.id, { type: 'ua', value: mod.config.userAgent });
        setUARule(mod.config.userAgent);
    }
    if (mod.type === 'geolocation' && mod.config) {
        effects.set(mod.id, { type: 'geolocation', value: mod.config });
    }
}

function removeEffect(id) {
    const eff = effects.get(id);
    if (!eff) return;
    effects.delete(id);
    if (eff.type === 'ua') {
        const remaining = [...effects.values()].find(e => e.type === 'ua');
        if (remaining) setUARule(remaining.value);
        else clearUARule();
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'applyModule') {
        applyEffect(msg.module);
        sendResponse({ ok: true });
    }
    if (msg.action === 'removeModule') {
        removeEffect(msg.id);
        sendResponse({ ok: true });
    }
    if (msg.action === 'getEffects') {
        sendResponse({ effects: Object.fromEntries(effects) });
    }
    return true;
});
