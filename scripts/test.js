const fs = require('fs');
const path = require('path');

function runChecks(root) {
    const errors = [];
    const extensionPath = path.join(root, 'extension');

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
    if (!fs.existsSync(swPath)) errors.push('extension/js/background.js not found');

    const popupPath = path.join(extensionPath, 'popup.html');
    if (!fs.existsSync(popupPath)) errors.push('popup.html not found');

    const pkgPath = path.join(root, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        for (const script of ['test', 'build']) {
            if (!pkg.scripts?.[script]) errors.push(`package.json missing "${script}" script`);
        }
    }

    for (const file of ['brands.js', 'lint.js']) {
        if (!fs.existsSync(path.join(root, 'scripts', file))) errors.push(`scripts/${file} not found`);
    }

    return errors;
}

function main() {
    const root = path.join(__dirname, '..');
    const errors = runChecks(root);
    if (errors.length > 0) {
        console.log(errors.join('\n'));
        process.exit(1);
    } else {
        console.log('all checks passed');
        process.exit(0);
    }
}

if (require.main === module) main();

module.exports = { runChecks };