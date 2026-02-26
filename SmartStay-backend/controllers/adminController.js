const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const EventBooking = require('../models/EventBooking');
const EventHall = require('../models/EventHall');

// @desc    Get Admin Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. Total Revenue (sum of all 'paid' or 'confirmed' bookings for events since they don't use 'paymentStatus' yet)
  const paidRoomBookings = await Booking.find({ paymentStatus: 'paid' });
  const confirmedEventBookings = await EventBooking.find({ status: { $in: ['confirmed', 'completed'] } });

  const roomRevenue = paidRoomBookings.reduce((acc, order) => acc + (order.pricing?.total || 0), 0);
  const eventRevenue = confirmedEventBookings.reduce((acc, order) => acc + (order.pricing?.total || 0), 0);
  const totalRevenue = roomRevenue + eventRevenue;

  // 2. Counts
  const usersCount = await User.countDocuments();
  const roomBookingsCount = await Booking.countDocuments();
  const eventBookingsCount = await EventBooking.countDocuments();
  const bookingsCount = roomBookingsCount + eventBookingsCount;
  
  const roomsCount = await Room.countDocuments();
  const hallsCount = await EventHall.countDocuments();

  // 3. Recent 5 Bookings (Merge and Sort)
  const recentRoomBookings = await Booking.find()
    .populate('user', 'name email')
    .populate('room', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentEventBookings = await EventBooking.find()
    .populate('user', 'name email')
    .populate('hall', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const mergedRecent = [...recentRoomBookings.map(b => ({...b, type: 'room'})), ...recentEventBookings.map(b => ({...b, type: 'event'}))]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // 4. Monthly Revenue (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const roomMonthly = await Booking.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$pricing.total" } } }
  ]);

  const eventMonthly = await EventBooking.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ['confirmed', 'completed'] } } },
    { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$pricing.total" } } }
  ]);

  // Merge Monthly Revenue (Removed to keep separate)
  const roomMonthlyRevenue = roomMonthly.sort((a, b) => a._id - b._id);
  const eventMonthlyRevenue = eventMonthly.sort((a, b) => a._id - b._id);

  // 5. Booking Status Distribution
  const roomStatuses = await Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const eventStatuses = await EventBooking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);

  // Return separately
  const roomStatusCounts = roomStatuses;
  const eventStatusCounts = eventStatuses;

  // Debug: Check one recent booking to verify structure
  if (mergedRecent.length > 0) {
      console.log("DEBUG: Sample Recent Booking Pricing:", JSON.stringify(mergedRecent[0].pricing, null, 2));
      console.log("DEBUG: Sample Recent Booking CreatedAt:", mergedRecent[0].createdAt);
  }

  res.json({
    totalRevenue,
    usersCount, 
    bookingsCount,
    roomsCount,
    recentBookings: mergedRecent,
    roomMonthlyRevenue, 
    eventMonthlyRevenue,
    roomStatusCounts,
    eventStatusCounts
  });
});

// @desc    Get All Bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = asyncHandler(async (req, res) => {
  const roomBookings = await Booking.find()
    .populate('user', 'name email')
    .populate('room', 'name')
    .sort({ createdAt: -1 })
    .lean();
    
  const eventBookings = await EventBooking.find()
    .populate('user', 'name email')
    .populate('hall', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const mergedBookings = [...roomBookings.map(b => ({...b, type: 'room'})), ...eventBookings.map(b => ({...b, type: 'event'}))]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(mergedBookings);
});

module.exports = { getDashboardStats, getAllBookings };