const mongoose = require('mongoose');

const eventHallSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g., "grand-ballroom"
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Banquet Hall', 'Meeting Room', 'Conference Center', 'Ceremony Space']
  },
  pricePerDay: { type: Number, required: true },
  priceDisplay: { type: String }, // e.g., "₹50,000"
  capacity: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  amenities: [String],
  images: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('EventHall', eventHallSchema);
