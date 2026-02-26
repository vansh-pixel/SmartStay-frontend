const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const EventHall = require('../models/EventHall');

dotenv.config({ path: path.join(__dirname, '../.env') });

const halls = [
  {
    id: "grand-ballroom",
    name: "Royal Grand Ballroom",
    type: "Banquet Hall",
    pricePerDay: 150000,
    priceDisplay: "₹1,50,000",
    capacity: 500,
    description: "Our largest and most luxurious space, perfect for grand weddings, gala dinners, and major corporate events.",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2074&auto=format&fit=crop",
    amenities: ["Grand Stage", "Premium Sound", "HD Projector", "VIP Lounge", "Gourmet Catering"],
    images: []
  },
  {
    id: "executive-boardroom",
    name: "Executive Boardroom",
    type: "Meeting Room",
    pricePerDay: 25000,
    priceDisplay: "₹25,000",
    capacity: 20,
    description: "A sophisticated space designed for high-level meetings, equipped with the latest conferencing technology.",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=2070&auto=format&fit=crop",
    amenities: ["4K Video Conferencing", "Gigabit Wi-Fi", "Coffee Station", "Digital Whiteboard"],
    images: []
  },
  {
    id: "crystal-banquet",
    name: "Crystal Banquet Hall",
    type: "Banquet Hall",
    pricePerDay: 75000,
    priceDisplay: "₹75,000",
    capacity: 200,
    description: "An elegant space with crystal chandeliers, ideal for engagement parties, birthdays, and medium-sized gatherings.",
    image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=1924&auto=format&fit=crop",
    amenities: ["Decoration Support", "Dance Floor", "Music System", "Kitchen Access"],
    images: []
  }
];

const seedHalls = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    for (const hallData of halls) {
      await EventHall.findOneAndUpdate(
        { id: hallData.id },
        hallData,
        { upsert: true, new: true }
      );
      console.log(`✨ Seeded/Updated: ${hallData.name}`);
    }

    console.log('🎉 Hall seeding complete!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedHalls();
