const fs = require('fs');
const https = require('https');

const download = (url, dest, cb) => {
  const file = fs.createWriteStream(dest);
  https.get(url, {
    rejectUnauthorized: false,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  }, function(response) {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
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

const images = [
  { url: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/about-hotel.png' },
  { url: 'https://images.pexels.com/photos/2733918/pexels-photo-2733918.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/luxury-interior.png' },
  { url: 'https://images.pexels.com/photos/3315291/pexels-photo-3315291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/presidential-penthouse.png' },
  { url: 'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/family-garden-suite.png' },
  { url: 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/cozy-standard-room.png' },
  { url: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/maldives.png' },
  { url: 'https://images.pexels.com/photos/3120613/pexels-photo-3120613.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/pool-side.png' },
  { url: 'https://images.pexels.com/photos/648019/pexels-photo-648019.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/luxury-room.png' },
  { url: 'https://images.pexels.com/photos/103124/pexels-photo-103124.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/grand-ballroom.png' },
  { url: 'https://images.pexels.com/photos/1181414/pexels-photo-1181414.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/executive-boardroom.png' },
  { url: 'https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', dest: 'public/crystal-banquet.png' }
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
