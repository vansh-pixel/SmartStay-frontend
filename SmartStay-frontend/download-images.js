const fs = require('fs');
const https = require('https');
const http = require('http');

const download = (url, dest, cb) => {
  const lib = url.startsWith('https') ? https : http;
  const file = fs.createWriteStream(dest);
  const request = lib.get(url, { rejectUnauthorized: false }, function(response) {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      // Handle redirects
      return download(response.headers.location, dest, cb);
    }
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
    });
  }).on('error', function(err) {
    fs.unlink(dest, () => {});
    if (cb) cb(err.message);
  });
};

// Use generic reliable placeholder images instead of Unsplash
const images = [
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=SmartStay+About+Hotel', dest: 'public/about-hotel.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=SmartStay+Luxury+Interior', dest: 'public/luxury-interior.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Presidential+Penthouse', dest: 'public/presidential-penthouse.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Family+Garden+Suite', dest: 'public/family-garden-suite.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Cozy+Standard+Room', dest: 'public/cozy-standard-room.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Maldives+Resort', dest: 'public/maldives.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Pool+Side', dest: 'public/pool-side.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Luxury+Room', dest: 'public/luxury-room.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Grand+Ballroom', dest: 'public/grand-ballroom.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Executive+Boardroom', dest: 'public/executive-boardroom.png' },
  { url: 'https://placehold.co/1920x1080/4f46e5/FFFFFF/png?text=Crystal+Banquet', dest: 'public/crystal-banquet.png' }
];

Promise.all(images.map(img => new Promise((resolve, reject) => {
  console.log(`Downloading ${img.dest}...`);
  download(img.url, img.dest, (err) => {
    if (err) {
      console.error(`Failed ${img.dest}:`, err);
      resolve(); 
    } else {
      console.log(`Success ${img.dest}`);
      resolve();
    }
  });
}))).then(() => console.log('All downloads finished.'));
