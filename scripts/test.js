const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const extensionPath = path.join(root, 'extension');

let errors = [];

const manifestPath = path.join(extensionPath, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
    errors.push('manifest.json not found');
} else {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (!manifest.name || !manifest.version) {
            errors.push('manifest.json missing required fields (name, version)');
        }
    } catch (e) {
        errors.push(`manifest.json is invalid JSON: ${e.message}`);
    }
}

const swPath = path.join(extensionPath, 'js', 'background.js');
if (!fs.existsSync(swPath)) {
    errors.push('extension/js/background.js not found');
}

const popupPath = path.join(extensionPath, 'popup.html');
if (!fs.existsSync(popupPath)) {
    errors.push('popup.html not found');
}

const pkgPath = path.join(root, 'package.json');
if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const requiredScripts = ['test', 'build'];
    for (const script of requiredScripts) {
        if (!pkg.scripts[script]) {
            errors.push(`package.json missing "${script}" script`);
        }
    }
}

const requiredScripts = ['brands.js'];
for (const file of requiredScripts) {
    if (!fs.existsSync(path.join(extensionPath, '..', 'scripts', file))) {
        errors.push(`scripts/${file} not found`);
    }
}

if (errors.length > 0) {
    console.log(errors.join('\n'));
    process.exit(1);
} else {
    console.log('all checks passed');
    process.exit(0);
}