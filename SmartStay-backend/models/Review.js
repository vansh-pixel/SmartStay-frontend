const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  quote: { // This matches your frontend 'quote'
    type: String,
    required: [true, 'Please add a comment']
  },
  rating: {
    type: Number,
    required: true,
    default: 5,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);