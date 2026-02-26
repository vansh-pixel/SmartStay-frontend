const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g., "executive-suite"
  name: { type: String, required: true },
  price: { type: String }, // Keep as string for display like "$299"
  basePrice: { type: Number, required: true }, // Use this for calculations
  image: { type: String },
  description: { type: String },
  size: { type: String },
  bedType: { type: String },
  maxGuests: { type: Number },
  amenities: [{
    label: String,
    icon: String
  }],
  images: [{
    type: { type: String }, // e.g., "main", "bathroom"
    url: String,
    label: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);