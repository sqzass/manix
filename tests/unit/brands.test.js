const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveChannel, applyBrand, CHANNELS } = require('../../scripts/brands.js');

test('resolveChannel returns nightly channel', () => {
    const ch = resolveChannel('nightly');
    assert.equal(ch.brand, 'Lumen');
    assert.equal(CHANNELS.nightly.brand, 'Lumen');
});

test('resolveChannel returns main channel', () => {
    const ch = resolveChannel('main');
    assert.equal(ch.brand, 'Manix');
});

test('resolveChannel throws on unknown channel', () => {
    assert.throws(() => resolveChannel('bogus'), { code: 'EINVCHANNEL' });
});

test('applyBrand rewrites manifest name/description/title', () => {
    const manifest = { name: 'Lumen', description: 'Lumen - nightly.', action: { default_title: 'Lumen' } };
    const configText = 'brand: "Lumen"\nchannel: "nightly"\n';
    const { next, nextConfig } = applyBrand(manifest, configText, CHANNELS.main, 'main');
    assert.equal(next.name, 'Manix');
    assert.equal(next.description, 'Manix - main - stable release.');
    assert.equal(next.action.default_title, 'Manix');
    assert.equal(nextConfig, 'brand: "Manix"\nchannel: "main"\n');
});
