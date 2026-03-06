require("dotenv").config();
const { createAdminBooking } = require('./controllers/bookingController');
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Room = require('./models/Room');

const req = {
  body: {
    roomId: '1',
    checkIn: new Date().toISOString(),
    checkOut: new Date(Date.now() + 86400000).toISOString(),
    guestDetails: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      adults: 2,
      children: 0
    },
    pricing: {
      perNight: 100,
      nights: 1,
      total: 100
    },
    paymentStatus: 'paid',
    paymentMethod: 'cash'
  },
  user: { email: 'admin@test.com' }
};

const res = {
  status: function(s) {
    console.log("Status:", s);
    return this;
  },
  json: function(j) {
    console.log("JSON:", j);
    process.exit(0);
  }
};

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log("Connected DB");
    const room = await Room.findOne();
    if(room) req.body.roomId = room.id || room._id;
    await createAdminBooking(req, res);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
