const fs = require('fs');
const path = require('path');

const CHANNELS = {
    nightly: { brand: 'Lumen', tagline: 'nightly - every push lands here' },
    main: { brand: 'Manix', tagline: 'main - stable release' },
};

function resolveChannel(target) {
    const ch = CHANNELS[target];
    if (!ch) {
        const err = new Error(`usage: node scripts/brands.js <${Object.keys(CHANNELS).join('|')}>`);
        err.code = 'EINVCHANNEL';
        throw err;
    }
    return ch;
}

function applyBrand(manifest, configText, channel, target) {
    const next = { ...manifest };
    next.name = channel.brand;
    next.description = `${channel.brand} - ${channel.tagline}.`;
    if (next.action) next.action.default_title = channel.brand;

    const nextConfig = configText
        .replace(/brand:\s*"[^"]*"/, `brand: "${channel.brand}"`)
        .replace(/channel:\s*"[^"]*"/, `channel: "${target}"`);
    return { next, nextConfig };
}

function writeFiles(root, manifest, configText, channel, target) {
    const manifestPath = path.join(root, 'extension', 'manifest.json');
    const configPath = path.join(root, 'extension', 'js', 'config.js');
    const { next, nextConfig } = applyBrand(manifest, configText, channel, target);
    fs.writeFileSync(manifestPath, JSON.stringify(next, null, 2) + '\n');
    fs.writeFileSync(configPath, nextConfig);
    console.log(`rebranded → ${channel.brand} (${target})`);
}

function main(argv) {
    const target = argv[2];
    const channel = resolveChannel(target);
    const root = path.join(__dirname, '..');
    const manifestPath = path.join(root, 'extension', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const configPath = path.join(root, 'extension', 'js', 'config.js');
    const configText = fs.readFileSync(configPath, 'utf8');
    writeFiles(root, manifest, configText, channel, target);
}

if (require.main === module) {
    try {
        main(process.argv);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

module.exports = { CHANNELS, resolveChannel, applyBrand, writeFiles, main };
