const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('../models/Room');

dotenv.config();

const listRooms = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const rooms = await Room.find({});
    console.log('--- ROOMS IN DB ---');
    rooms.forEach(room => {
      console.log(`Name: ${room.name} | Custom ID: ${room.id} (${typeof room.id}) | _id: ${room._id}`);
    });
    console.log('-------------------');

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

listRooms();
