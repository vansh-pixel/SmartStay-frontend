const mongoose = require('mongoose');

const eventBookingSchema = new mongoose.Schema({
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventHall',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guestDetails: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventType: {
    type: String,
    required: true
  },
  pricing: {
    basePrice: Number,
    taxes: Number,
    total: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'checked-in', 'checked-out'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EventBooking', eventBookingSchema);
