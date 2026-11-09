const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { runChecks } = require('../../scripts/test.js');

const root = path.join(__dirname, '../..');

test('runChecks reports no errors on the real repo', () => {
    const errors = runChecks(root);
    assert.equal(errors.length, 0, JSON.stringify(errors));
});

test('runChecks catches a missing manifest', () => {
    const errors = runChecks(osTmpDir());
    assert.ok(errors.length > 0);
    assert.ok(errors.some((e) => e.includes('manifest.json')));
});

function osTmpDir() {
    return require('node:os').tmpdir();
}
