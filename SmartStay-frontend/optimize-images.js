const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') && ![
    'apple-icon.png', 'icon-dark-32x32.png', 'icon-light-32x32.png', 'placeholder-logo.png'
].includes(f));

const convert = async () => {
  for (const file of files) {
    const filePath = path.join(dir, file);
    const tempPath = filePath + '.tmp';
    console.log('Optimizing', file);
    await sharp(filePath)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toFile(tempPath);
      
    fs.renameSync(tempPath, filePath);
  }
  console.log('Done optimizing');
}

convert();
