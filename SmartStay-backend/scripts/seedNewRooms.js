const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Room = require('../models/Room');

// Use path to get .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const newRooms = [
  {
    id: "4",
    name: "Presidential Penthouse",
    price: "₹85,000",
    basePrice: 85000,
    image: "/presidential-penthouse.png",
    description: "The crown jewel of SmartStay. This top-floor penthouse features a private infinity pool, massive terrace, and personal butler service.",
    size: "150 sqm",
    bedType: "California King + 2 Queen Beds",
    maxGuests: 6,
    amenities: [
      { label: "Private Pool", icon: "pool" },
      { label: "Butler Service", icon: "butler" },
      { label: "Jacuzzi", icon: "jacuzzi" },
      { label: "Rooftop Terrace", icon: "terrace" },
      { label: "Full Kitchen", icon: "kitchen" },
      { label: "Smart Home System", icon: "smarthome" }
    ],
    images: [
      { type: "main", url: "/presidential-penthouse.png", label: "Living Area" },
      { type: "pool", url: "/pool-side.png", label: "Private Pool" },
      { type: "bedroom", url: "/cozy-standard-room.png", label: "Master Bedroom" }
    ]
  },
  {
    id: "5",
    name: "Family Garden Suite",
    price: "₹35,000",
    basePrice: 35000,
    image: "/pool-side.png",
    description: "A perfect retreat for families, featuring direct access to our lush tropical gardens and a dedicated play area for children.",
    size: "75 sqm",
    bedType: "2 Queen Beds + Sofa Bed",
    maxGuests: 5,
    amenities: [
      { label: "Garden Access", icon: "garden" },
      { label: "Kitchenette", icon: "kitchen" },
      { label: "Kid Friendly", icon: "kids" },
      { label: "Patio", icon: "patio" },
      { label: "Free Wi-Fi", icon: "wifi" }
    ],
    images: [
      { type: "main", url: "/luxury-interior.png", label: "Room View" },
      { type: "garden", url: "/family-garden-suite.png", label: "Garden View" }
    ]
  },
  {
    id: "6",
    name: "Cozy Standard Room",
    price: "₹12,000",
    basePrice: 12000,
    image: "/cozy-standard-room.png",
    description: "A compact yet stylish room designed for solo travelers or couples looking for a comfortable and budget-friendly stay.",
    size: "25 sqm",
    bedType: "Queen Bed",
    maxGuests: 2,
    amenities: [
      { label: "Free Wi-Fi", icon: "wifi" },
      { label: "Air Conditioning", icon: "ac" },
      { label: "Work Desk", icon: "desk" },
      { label: "Smart TV", icon: "tv" }
    ],
    images: [
      { type: "main", url: "/cozy-standard-room.png", label: "Room Overview" }
    ]
  }
];

const seedRooms = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    for (const roomData of newRooms) {
      const exists = await Room.findOne({ id: roomData.id });
      if (exists) {
        console.log(`⚠️ Room with ID ${roomData.id} already exists. Skipping.`);
        continue;
      }
      await Room.create(roomData);
      console.log(`✨ Added ${roomData.name}`);
    }

    console.log('🎉 Seeding complete!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding rooms:', error.message);
    process.exit(1);
  }
};

seedRooms();
