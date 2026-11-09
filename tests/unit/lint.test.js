const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { runLint, checkJsFiles } = require('../../scripts/lint.js');

const root = path.join(__dirname, '../..');

test('runLint reports no issues on the real repo', () => {
    const issues = runLint(root);
    assert.equal(issues.length, 0, JSON.stringify(issues));
});

test('checkJsFiles flags console.log without // DEBUG', () => {
    const tmp = path.join(os.tmpdir(), `manix-lint-test-${Date.now()}.js`);
    fs.writeFileSync(tmp, 'const x = 1;\nconsole.log("nope");\n');
    try {
        const issues = checkJsFiles([tmp]);
        assert.equal(issues.length, 1);
        assert.ok(issues[0].includes('console.log'));
    } finally {
        fs.rmSync(tmp, { force: true });
    }
});

test('checkJsFiles tolerates // DEBUG console.log', () => {
    const tmp = path.join(os.tmpdir(), `manix-lint-test-${Date.now()}.js`);
    fs.writeFileSync(tmp, 'console.log("keep", foo); // DEBUG\n');
    try {
        const issues = checkJsFiles([tmp]);
        assert.equal(issues.length, 0);
    } finally {
        fs.rmSync(tmp, { force: true });
    }
});
