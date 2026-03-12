const EventHall = require('../models/EventHall');
const EventBooking = require('../models/EventBooking');
const asyncHandler = require('express-async-handler');

// @desc    Get all halls
// @route   GET /api/halls
const getHalls = asyncHandler(async (req, res) => {
  const halls = await EventHall.find({});
  res.json(halls);
});

// @desc    Get hall by ID
// @route   GET /api/halls/:id
const getHallById = asyncHandler(async (req, res) => {
  const hall = await EventHall.findOne({ id: req.params.id });
  if (hall) {
    res.json(hall);
  } else {
    res.status(404);
    throw new Error('Hall not found');
  }
});

// @desc    Create an event booking
// @route   POST /api/halls/book
const createEventBooking = asyncHandler(async (req, res) => {
  const { hallId, eventDate, eventType, guestDetails, pricing } = req.body;

  const hall = await EventHall.findOne({ id: hallId });
  if (!hall) {
    res.status(404);
    throw new Error('Hall not found');
  }

  const booking = await EventBooking.create({
    hall: hall._id,
    user: req.user._id,
    guestDetails,
    eventDate,
    eventType,
    pricing
  });

  res.status(201).json(booking);
});

// @desc    Get user's event bookings
// @route   GET /api/halls/my-bookings
const getMyEventBookings = asyncHandler(async (req, res) => {
  const bookings = await EventBooking.find({ user: req.user._id }).populate('hall');
  res.json(bookings);
});

// @desc    Get booked dates for an event hall
// @route   GET /api/halls/availability/:hallId
const getBookedDates = asyncHandler(async (req, res) => {
  const { hallId } = req.params;

  const mongoose = require('mongoose');
  // 1. Try finding it as a MongoDB ObjectId first
  let hall = null;
  if (mongoose.Types.ObjectId.isValid(hallId)) {
    hall = await EventHall.findById(hallId);
  }

  // 2. Try finding hall by string custom ID
  if (!hall) {
    hall = await EventHall.findOne({ id: String(hallId) });
  }
  
  if (!hall) {
    console.log("❌ Hall not found for availability check:", hallId);
    return res.status(404).json({ message: 'Hall not found' });
  }

  // Find all non-cancelled, future bookings for this hall
  const bookings = await EventBooking.find({
    hall: hall._id,
    status: { $ne: 'cancelled' },
    eventDate: { $gte: new Date(new Date().setHours(0,0,0,0)) } // Midnight today onwards
  }).select('eventDate');

  res.json(bookings);
});

// @desc    Update an event booking (Admin)
// @route   PUT /api/halls/bookings/:id
const updateEventBooking = asyncHandler(async (req, res) => {
  const booking = await EventBooking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Event booking not found');
  }

  // Update fields if provided
  booking.status = req.body.status || booking.status;
  
  const updatedBooking = await booking.save();
  res.json(updatedBooking);
});

module.exports = {
  getHalls,
  getHallById,
  createEventBooking,
  getMyEventBookings,
  getBookedDates,
  updateEventBooking
};
