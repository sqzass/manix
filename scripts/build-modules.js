const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'modules');
const DEST = path.join(ROOT, 'extension', 'modules');

function copyFile(src, dest) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

function build() {
    if (!fs.existsSync(SRC)) {
        console.error(`Source modules dir not found: ${SRC}`);
        process.exit(1);
    }

    // Clean destination
    if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true });
    fs.mkdirSync(DEST, { recursive: true });

    const aggregated = {};

    const modDirs = fs.readdirSync(SRC, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    for (const modId of modDirs) {
        const modSrc = path.join(SRC, modId);
        const modManifestPath = path.join(modSrc, 'manifest.json');

        if (!fs.existsSync(modManifestPath)) {
            console.warn(`Skipping ${modId}: no manifest.json`);
            continue;
        }

        const modManifest = JSON.parse(fs.readFileSync(modManifestPath, 'utf8'));

        // Each manifest.json is keyed by module id
        const [modKey] = Object.keys(modManifest);
        const modDef = modManifest[modKey];
        modDef.id = modDef.id || modKey;

        // Copy module files into extension/modules/<id>/
        const modDest = path.join(DEST, modDef.id);
        fs.mkdirSync(modDest, { recursive: true });

        for (const file of fs.readdirSync(modSrc, { withFileTypes: true })) {
            if (file.isDirectory()) continue;
            copyFile(path.join(modSrc, file.name), path.join(modDest, file.name));
        }

        // If module has src/, copy its contents flat into the module dir
        const srcDir = path.join(modSrc, 'src');
        if (fs.existsSync(srcDir)) {
            for (const file of fs.readdirSync(srcDir, { withFileTypes: true })) {
                if (file.isDirectory()) continue;
                copyFile(path.join(srcDir, file.name), path.join(modDest, file.name));
            }
        }

        aggregated[modDef.id] = modDef;
        console.log(`compiled module → ${modDef.id} (${modDef.type})`);
    }

    // Write aggregated module manifest
    fs.writeFileSync(
        path.join(DEST, 'manifest.json'),
        JSON.stringify({ modules: aggregated }, null, 2) + '\n'
    );

    console.log(`\n${Object.keys(aggregated).length} module(s) compiled → ${DEST}`);
}

build();
