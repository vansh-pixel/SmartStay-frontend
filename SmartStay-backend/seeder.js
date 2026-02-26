require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors');
const fs = require('fs');

// Load Models
const Room = require('./models/Room');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    // 1. Read File
    const fileContent = fs.readFileSync(`${__dirname}/data/hotelData.json`, 'utf-8');
    let roomsData = JSON.parse(fileContent);

    // 2. FIX: Check if data is wrapped in a "rooms" key
    if (roomsData.rooms) {
      roomsData = roomsData.rooms;
    }

    // 3. FIX: Check if it's an array
    if (!Array.isArray(roomsData)) {
      throw new Error("Data is not an array! Check hotelData.json structure.");
    }

    // 4. FIX: Map fields to match Schema (price -> basePrice)
    const formattedRooms = roomsData.map(room => {
      return {
        ...room,
        // If Schema needs 'basePrice' but JSON has 'price', map it:
        basePrice: room.basePrice || room.price || 0,
        // Ensure ID is present
        id: room.id,
        name: room.name
      };
    });

    // 5. Clear & Insert
    await Room.deleteMany();
    console.log('Old Data Destroyed...'.red.inverse);

    await Room.insertMany(formattedRooms);
    console.log('Data Imported!'.green.inverse);

    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await Room.deleteMany();
    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}







// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const fs = require('fs');
// const colors = require('colors'); // Optional: for colored console logs
// const Room = require('./models/Room');

// dotenv.config();

// // Connect to DB
// mongoose.connect(process.env.MONGO_URI);

// // Read JSON file
// const jsonFile = JSON.parse(
//   fs.readFileSync(`${__dirname}/data/hotelData.json`, 'utf-8')
// );

// // Import Data
// const importData = async () => {
//   try {
//     // 1. Clear existing rooms to avoid duplicates
//     await Room.deleteMany();

//     // 2. Insert the "rooms" array from your JSON
//     await Room.insertMany(jsonFile.rooms);

//     console.log('Data Imported Successfully!'.green.inverse);
//     process.exit();
//   } catch (error) {
//     console.error(`${error}`.red.inverse);
//     process.exit(1);
//   }
// };

// // Destroy Data (Optional helper)
// const destroyData = async () => {
//   try {
//     await Room.deleteMany();
//     console.log('Data Destroyed!'.red.inverse);
//     process.exit();
//   } catch (error) {
//     console.error(`${error}`.red.inverse);
//     process.exit(1);
//   }
// };

// // Check command line arguments
// if (process.argv[2] === '-d') {
//   destroyData();
// } else {
//   importData();
// }