import sharp from 'sharp';
import path from 'path';

async function removeBackground() {
    const inputPath = '/home/wesley/Documentos/projetos/OminiZap/web-interface/public/assets/logo_final.png';
    const outputPath = '/home/wesley/Documentos/projetos/OminiZap/web-interface/public/assets/logo_cleaned.png';

    try {
        const image = sharp(inputPath);
        const { width, height } = await image.metadata();

        // Convert to RGBA and remove the specific grey/white checkerboard
        // This is a naive approach, might need adjustment depending on the exact colors
        await image
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Detect grey/white checkerboard (usually around 200-255 range for all channels)
                    // and make it transparent. This is a bit risky but we can try.
                    // Or we can just use the generate_image tool better.
                }
            });

        // Actually, let's try a better prompt for generate_image or use a dedicated tool if I had one.
        // Since I'm an agent, I'll try to use generate_image with a REMAINDER that it's a FAKE grid.
    } catch (err) {
        console.error(err);
    }
}
