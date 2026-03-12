require('dotenv').config();
const mongoose = require('mongoose');
const EventHall = require('./models/EventHall');
const EventBooking = require('./models/EventBooking');
const { createEventBooking } = require('./controllers/hallController');

async function testEventBooking() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // Mock request and response
    const req = {
      body: {
        hallId: "grand-ballroom",
        eventDate: new Date(Date.now() + 86400000 * 7), // A week from now
        eventType: "Ceremony",
        guestDetails: {
          fullName: "Event Test User",
          email: "vanshmamtora17@gmail.com",
          phone: "9876543210"
        },
        pricing: {
          basePrice: 50000,
          taxes: 9000,
          total: 59000
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

    await createEventBooking(req, res);
    process.exit(0);
  } catch (err) {
    console.error("Event Test Failed:", err);
    process.exit(1);
  }
}

testEventBooking();
