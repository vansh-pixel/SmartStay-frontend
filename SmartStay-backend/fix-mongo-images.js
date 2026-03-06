const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./models/Room');

dotenv.config();

const replacements = {
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511": "/about-hotel.png",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6": "/luxury-interior.png",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85": "/cozy-standard-room.png",
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14": "/luxury-room.png",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688": "/pool-side.png",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461": "/presidential-penthouse.png",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop": "/presidential-penthouse.png",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop": "/pool-side.png",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop": "/cozy-standard-room.png",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2074&auto=format&fit=crop": "/luxury-interior.png",
  "https://images.unsplash.com/photo-1533619239233-6280475a634a?q=80&w=2070&auto=format&fit=crop": "/family-garden-suite.png",
  "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1974&auto=format&fit=crop": "/cozy-standard-room.png"
};

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const rooms = await Room.find({});
    
    for (let room of rooms) {
        let changed = false;
        if (room.image && replacements[room.image]) {
            room.image = replacements[room.image];
            changed = true;
        }
        
        if (room.images && room.images.length > 0) {
            for (let i = 0; i < room.images.length; i++) {
                let img = room.images[i];
                if (img.url && replacements[img.url]) {
                    room.images[i].url = replacements[img.url];
                    changed = true;
                }
            }
        }
        
        if (changed) {
            await Room.updateOne({ _id: room._id }, { image: room.image, images: room.images });
            console.log(`Updated room ${room.name}`);
        }
    }
    
    console.log("Done");
    process.exit(0);
};

run();
