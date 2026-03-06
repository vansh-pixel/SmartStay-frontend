const fs = require('fs');
const path = require('path');

const hotelDataPath = path.join(__dirname, 'data', 'hotelData.json');
let hotelData = fs.readFileSync(hotelDataPath, 'utf8');

// Replace specific Unsplash URLs with local equivalents
const replacements = {
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511": "/about-hotel.png",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6": "/luxury-interior.png",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85": "/cozy-standard-room.png",
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14": "/luxury-room.png",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688": "/pool-side.png",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461": "/presidential-penthouse.png"
};

for (const [unsplash, local] of Object.entries(replacements)) {
  hotelData = hotelData.split(unsplash).join(local);
}

fs.writeFileSync(hotelDataPath, hotelData, 'utf8');
console.log('Updated hotelData.json');

const seedRoomsPath = path.join(__dirname, 'scripts', 'seedNewRooms.js');
let seedRooms = fs.readFileSync(seedRoomsPath, 'utf8');

seedRooms = seedRooms.replace(/https:\/\/images\.unsplash\.com\/photo-1631049307264-da0ec9d70304\?q=80&w=2070&auto=format&fit=crop/g, '/presidential-penthouse.png');
seedRooms = seedRooms.replace(/https:\/\/images\.unsplash\.com\/photo-1582719478250-c89cae4dc85b\?q=80&w=2070&auto=format&fit=crop/g, '/pool-side.png');
seedRooms = seedRooms.replace(/https:\/\/images\.unsplash\.com\/photo-1590490360182-c33d57733427\?q=80&w=2074&auto=format&fit=crop/g, '/cozy-standard-room.png');
seedRooms = seedRooms.replace(/https:\/\/images\.unsplash\.com\/photo-1566665797739-1674de7a421a\?q=80&w=2074&auto=format&fit=crop/g, '/luxury-interior.png');
seedRooms = seedRooms.replace(/https:\/\/images\.unsplash\.com\/photo-1533619239233-6280475a634a\?q=80&w=2070&auto=format&fit=crop/g, '/family-garden-suite.png');
seedRooms = seedRooms.replace(/https:\/\/images\.unsplash\.com\/photo-1595576508898-0ad5c879a061\?q=80&w=1974&auto=format&fit=crop/g, '/cozy-standard-room.png');

fs.writeFileSync(seedRoomsPath, seedRooms, 'utf8');
console.log('Updated seedNewRooms.js');

const seedHallsPath = path.join(__dirname, 'scripts', 'seedHalls.js');
let seedHalls = fs.readFileSync(seedHallsPath, 'utf8');

seedHalls = seedHalls.replace(/https:\/\/images\.unsplash\.com\/photo-1519167758481-83f550bb49b3\?q=80&w=2074&auto=format&fit=crop/g, '/grand-ballroom.png');
seedHalls = seedHalls.replace(/https:\/\/images\.unsplash\.com\/photo-1431540015161-0bf868a2d407\?q=80&w=2070&auto=format&fit=crop/g, '/executive-boardroom.png');
seedHalls = seedHalls.replace(/https:\/\/images\.unsplash\.com\/photo-1505236858219-8359eb29e329\?q=80&w=1924&auto=format&fit=crop/g, '/crystal-banquet.png');

fs.writeFileSync(seedHallsPath, seedHalls, 'utf8');
console.log('Updated seedHalls.js');
