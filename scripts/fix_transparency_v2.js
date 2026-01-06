const sharp = require('sharp');
const fs = require('fs');

async function fixTransparency() {
    const input = '/home/wesley/Documentos/projetos/OminiZap/web-interface/public/assets/logo_final.png';
    const output = '/home/wesley/Documentos/projetos/OminiZap/web-interface/public/assets/logo_final.png'; // Overwrite with fixed version

    console.log('Applying advanced background cleaning...');

    const image = sharp(input);
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // This pattern detects both white (#FFF) and light grey (#CCC/#EEE) common in grids
        const isWhite = r > 240 && g > 240 && b > 240;
        const isLightGrey = r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10;

        // We only want to remove the grid, so we check if the pixel is part of the "background"
        // Most of the logo parts are either dark blue, green or light blue.
        // Let's refine the "to-remove" logic:
        if (isWhite || isLightGrey) {
            // Let's check if it's NOT part of the logo components (brain icon is light green)
            // Brain icon green is roughly (120, 190, 100) - definitely not grey/white
            data[i + 3] = 0;
        }
    }

    await sharp(data, { raw: info })
        .png()
        .toFile('/home/wesley/Documentos/projetos/OminiZap/web-interface/public/assets/logo_clean_final.png');

    fs.copyFileSync('/home/wesley/Documentos/projetos/OminiZap/web-interface/public/assets/logo_clean_final.png', input);
    console.log('Logo cleaned successfully.');
}

fixTransparency().catch(console.error);
