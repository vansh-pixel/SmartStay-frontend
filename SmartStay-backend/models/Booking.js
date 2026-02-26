const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  // We link to a registered user if they are logged in, but keep it optional
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  guestDetails: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    specialRequests: { type: String }
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  // We store the full pricing snapshot so we know exactly what they paid
  pricing: {
    basePrice: Number,
    nights: Number,
    serviceFee: Number,
    taxes: Number,
    total: Number
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'checked-in', 'checked-out'],
    default: 'confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'paid' // Since your frontend simulates a successful payment
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);