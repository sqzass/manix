const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const extensionPath = path.join(root, 'extension');

const issues = [];

const jsFiles = [];
function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath);
        } else if (entry.name.endsWith('.js') && !entry.name.includes('test')) {
            jsFiles.push(fullPath);
        }
    }
}
walkDir(path.join(extensionPath, 'js'));

for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('console.log') && !lines[i].includes('// DEBUG')) {
            issues.push(`{file}:${i + 1}: console.log found - consider removing or replacing with debugging statement`);
        }
    }
}

const manifestPath = path.join(extensionPath, 'manifest.json');
if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.manifest_version) {
        issues.push('manifest.json missing manifest_version field');
    }
    if (!manifest.name) {
        issues.push('manifest.json missing name field');
    }
}

const configPath = path.join(extensionPath, 'js', 'config.js');
if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    if (!configContent.includes('brand')) {
        issues.push('extension/js/config.js missing brand field');
    }
    if (!configContent.includes('channel')) {
        issues.push('extension/js/config.js missing channel field');
    }
}

if (issues.length > 0) {
    console.log('Linting issues found:');
    console.log(issues.join('\n'));
    process.exit(1);
} else {
    console.log('Linting passed - no issues found');
    process.exit(0);
}