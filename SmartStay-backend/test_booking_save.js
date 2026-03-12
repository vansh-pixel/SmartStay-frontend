require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const { createBooking } = require('./controllers/bookingController');

async function testBooking() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // Mock request and response
    const req = {
      body: {
        roomId: "1", 
// Assuming this ID exists or use a real one
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        guestDetails: {
          fullName: "Test User",
          email: "vanshmamtora17@gmail.com",
          phone: "1234567890"
        },
        pricing: {
          basePrice: 1000,
          total: 1200,
          nights: 1
        }
      },
      user: { _id: new mongoose.Types.ObjectId() }
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log("Response:", data);
      }
    };

    await createBooking(req, res);
    process.exit(0);
  } catch (err) {
    console.error("Test Failed:", err);
    process.exit(1);
  }
}

testBooking();
