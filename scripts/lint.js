const fs = require('fs');
const path = require('path');

function walkDir(dir, fileFilter) {
    const results = [];
    function recurse(current) {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) recurse(fullPath);
            else if (fileFilter(entry.name)) results.push(fullPath);
        }
    }
    recurse(dir);
    return results;
}

function checkJsFiles(jsFiles) {
    const issues = [];
    for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('console.log') && !lines[i].includes('// DEBUG')) {
                issues.push(`${file}:${i + 1}: console.log found - consider removing or replacing with a debugging statement`);
            }
        }
    }
    return issues;
}

function checkManifest(manifestPath) {
    const issues = [];
    if (!fs.existsSync(manifestPath)) {
        issues.push('manifest.json not found');
        return issues;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.manifest_version) issues.push('manifest.json missing manifest_version field');
    if (!manifest.name) issues.push('manifest.json missing name field');
    return issues;
}

function checkConfig(configPath) {
    const issues = [];
    if (!fs.existsSync(configPath)) {
        issues.push('extension/js/config.js not found');
        return issues;
    }
    const content = fs.readFileSync(configPath, 'utf8');
    if (!content.includes('brand')) issues.push('extension/js/config.js missing brand field');
    if (!content.includes('channel')) issues.push('extension/js/config.js missing channel field');
    return issues;
}

function runLint(root) {
    const extensionPath = path.join(root, 'extension');
    const issues = [];
    const jsFiles = walkDir(path.join(extensionPath, 'js'), (name) => name.endsWith('.js') && !name.includes('test'));
    issues.push(...checkJsFiles(jsFiles));
    issues.push(...checkManifest(path.join(extensionPath, 'manifest.json')));
    issues.push(...checkConfig(path.join(extensionPath, 'js', 'config.js')));
    return issues;
}

function main() {
    const root = path.join(__dirname, '..');
    const issues = runLint(root);
    if (issues.length > 0) {
        console.log('Linting issues found:');
        console.log(issues.join('\n'));
        process.exit(1);
    } else {
        console.log('Linting passed - no issues found');
        process.exit(0);
    }
}

if (require.main === module) main();

module.exports = { walkDir, checkJsFiles, checkManifest, checkConfig, runLint };