

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
console.log("Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Error loading .env:", result.error);
}

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log("MONGO_URI:", uri ? uri.substring(0, 20) + "..." : "undefined");
    if (!uri) throw new Error("MONGO_URI is not defined");
    
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};



const fs = require('fs');

const debugBookings = async () => {
  await connectDB();

  const output = { rooms: [], bookings: [] };

  console.log("--- Fetching Rooms ---");
  const rooms = await Room.find({});
  console.log(`Found ${rooms.length} rooms.`);
  output.rooms = rooms.map(r => ({ name: r.name, id: r.id, _id: r._id }));

  console.log("\n--- Fetching Bookings ---");
  const bookings = await Booking.find({});
  console.log(`Found ${bookings.length} bookings.`);
  
  output.bookings = bookings.map(b => ({
    _id: b._id,
    room: b.room,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    status: b.status
  }));

  fs.writeFileSync('bookings_dump.json', JSON.stringify(output, null, 2));
  console.log("Dump written to bookings_dump.json");
  process.exit();
};


debugBookings();
