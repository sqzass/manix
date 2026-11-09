const fs = require('fs');
const path = require('path');

const CHANNELS = {
    nightly: { brand: 'Lumen', tagline: 'nightly - every push lands here' },
    beta: { brand: 'Manix', tagline: 'beta - stable, may still break' },
    main: { brand: 'Manix', tagline: 'main - stable' },
};

const target = process.argv[2];
const ch = CHANNELS[target];
if (!ch) {
    console.error(`usage: node scripts/brand.js <${Object.keys(CHANNELS).join('|')}>`);
    process.exit(1);
}

const root = path.join(__dirname, '..');

const manifestPath = path.join(root, 'extension', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.name = ch.brand;
manifest.description = `${ch.brand} - ${ch.tagline}.`;
if (manifest.action) manifest.action.default_title = ch.brand;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const configPath = path.join(root, 'extension', 'js', 'config.js');
let config = fs.readFileSync(configPath, 'utf8');
config = config
    .replace(/brand:\s*"[^"]*"/, `brand: "${ch.brand}"`)
    .replace(/channel:\s*"[^"]*"/, `channel: "${target}"`);
fs.writeFileSync(configPath, config);

console.log(`rebranded → ${ch.brand} (${target})`);