const Review = require('../models/Review');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getReviews = async (req, res) => {
  try {
    // Fetch latest 6 reviews
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .limit(6);
      
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private (Logged in users only)
const createReview = async (req, res) => {
  const { quote, rating } = req.body;

  try {
    // 1. Check if user already submitted a review (Optional spam prevention)
    const alreadyReviewed = await Review.findOne({ user: req.user._id });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed us!' });
    }

    // 2. Create the review
    const review = await Review.create({
      user: req.user._id,
      name: req.user.name,   // We get name automatically from the logged-in user
      email: req.user.email, // We get email automatically
      quote,
      rating: Number(rating) || 5
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReviews, createReview };