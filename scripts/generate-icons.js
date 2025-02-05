const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { width: 192, height: 192, name: 'icon-192x192.png' },
  { width: 384, height: 384, name: 'icon-384x384.png' },
  { width: 512, height: 512, name: 'icon-512x512.png' },
  { width: 72, height: 72, name: 'badge-72x72.png' },
];

const sourceIcon = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(sourceIcon)
        .resize(size.width, size.height)
        .toFile(path.join(outputDir, size.name));
      
      console.log(`Generated ${size.name}`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
