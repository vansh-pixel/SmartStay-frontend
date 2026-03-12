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

const sendEmail = require('../utils/sendEmail');

// @desc    Create an event booking
// @route   POST /api/halls/book
const createEventBooking = asyncHandler(async (req, res) => {
  console.log("----------------------------------------------");
  console.log("🔔 INCOMING EVENT BOOKING REQUEST:");
  console.log("Body:", JSON.stringify(req.body, null, 2));

  const { hallId, eventDate, eventType, guestDetails, pricing } = req.body;

  if (!hallId) {
    res.status(400);
    throw new Error('hallId is required');
  }

  if (!guestDetails || !guestDetails.email) {
    res.status(400);
    throw new Error('Guest email is required');
  }

  const hall = await EventHall.findOne({ id: hallId });
  if (!hall) {
    console.log(`❌ Hall with id ${hallId} not found`);
    res.status(404);
    throw new Error('Hall not found');
  }
  console.log("✅ Hall found:", hall.name);

  // Check if already booked
  const existingBooking = await EventBooking.findOne({
    hall: hall._id,
    eventDate: new Date(eventDate),
    status: { $ne: 'cancelled' }
  });

  if (existingBooking) {
    res.status(400);
    throw new Error('Hall is already booked for this date');
  }

  const booking = await EventBooking.create({
    hall: hall._id,
    user: req.user ? req.user._id : null, 
    guestDetails: {
      fullName: guestDetails.fullName,
      email: guestDetails.email,
      phone: guestDetails.phone || 'N/A'
    },
    eventDate,
    eventType,
    pricing: {
      basePrice: pricing.basePrice || 0,
      taxes: pricing.taxes || 0,
      total: pricing.total
    },
    status: 'confirmed'
  });

  console.log("🎉 Event Booking Created Successfully:", booking._id);

  // 📧 Send Confirmation Email
  try {
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #f97316; padding: 20px; text-align: center; color: white;">
          <h1>Event Confirmed!</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi <strong>${guestDetails.fullName}</strong>,</p>
          <p>Your booking for <strong>${hall.name}</strong> has been confirmed.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> #${booking._id.toString().slice(-6).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
            <p><strong>Event Type:</strong> ${eventType}</p>
            <p><strong>Total Paid:</strong> ₹${(pricing.total || 0).toLocaleString()}</p>
          </div>
          <p>Thank you for choosing SmartStay for your special event!</p>
        </div>
        <div style="background-color: #333; padding: 15px; text-align: center; color: #ccc; font-size: 12px;">
          SmartStay Hotel | Downtown City Center
        </div>
      </div>
    `;

    await sendEmail({
      email: guestDetails.email,
      subject: `Event Booking Confirmed #${booking._id.toString().slice(-6).toUpperCase()}`,
      message: emailMessage
    });
    console.log(`📧 Event Confirmation Email sent to ${guestDetails.email}`);
  } catch (emailErr) {
    console.error("❌ Event Email sending failed:", emailErr.message);
  }

  res.status(201).json({
    success: true,
    bookingId: booking._id,
    message: 'Event booking confirmed'
  });
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
