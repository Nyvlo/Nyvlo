const sharp = require('sharp');
const fs = require('fs');

async function fixTransparency() {
    const input = '/home/wesley/Documentos/projetos/OminiZap/web-interface/public/assets/logo_final.png';
    const output = '/home/wesley/Documentos/projetos/OminiZap/web-interface/public/assets/logo_fixed.png';

    console.log('Cleaning logo background...');

    const image = sharp(input);
    const { width, height } = await image.metadata();

    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Check if pixel is white or light grey (typical for checkerboard)
        // White: 255, 255, 255
        // Grey: 192, 192, 192 or similar
        // We look for pixels where R, G, B are very close to each other and high intensity
        const isGreyish = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
        const isBright = r > 180 && g > 180 && b > 180;

        if (isGreyish && isBright) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
    }

    await sharp(data, { raw: info })
        .png()
        .toFile(output);

    console.log('Logo fixed and saved to:', output);
}

fixTransparency().catch(console.error);
