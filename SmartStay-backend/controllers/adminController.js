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
const getAllBookings = asyncHandler( async (req, res) => {
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

// @desc    Process Admin AI Command
// @route   POST /api/admin/chat
// @access  Private/Admin
// @desc    Process Admin AI Command
// @route   POST /api/admin/chat
// @access  Private/Admin
const processAdminAICommand = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const Groq = require('groq-sdk');
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is missing");
    return res.status(500).json({ error: "AI Assistant is currently unavailable." });
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // 1. IMPROVED INTENT CLASSIFICATION PASS
  const intentPrompt = `You are a Smart Hotel Admin AI. 
Current Date: ${new Date().toDateString()}

Analyze the request: "${message}"

Your capabilities:
1. filter: Filtering the visible table (status: pending/confirmed, paymentStatus: paid/pending, type: room/event).
2. sort: Sorting the visible table (price, date).
3. search: Keyword search in the current table (guest name, email).
4. availability: Real-time DB check if rooms are free on a specific date.
5. lookup: Deep DB search for guest history, details, and invoices.
6. chat: General greeting or question.

Respond ONLY with JSON:
{
  "intent": "filter" | "sort" | "search" | "availability" | "lookup" | "chat",
  "params": {
    "date": "YYYY-MM-DD", 
    "query": "search term",
    "field": "status/paymentStatus/type/price/date",
    "value": "pending/confirmed/paid/etc",
    "order": "asc/desc"
  },
  "message": "Direct chat response if intent is 'chat'"
}`;

  try {
    const classification = await groq.chat.completions.create({
      messages: [{ role: "system", content: intentPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const parsedData = JSON.parse(classification.choices[0].message.content);
    const { intent, params, message: aiMessage } = parsedData;
    console.log(`[AI Intent] ${intent} | Query: ${message}`);

    // --- CASE 1: AVAILABILITY CHECK ---
    if (intent === 'availability') {
      const searchDate = params.date ? new Date(params.date) : new Date();
      if (isNaN(searchDate.getTime())) {
        return res.json({ action: "chat", message: "I couldn't identify the date. Try 'rooms available on 2026-03-10'." });
      }

      const rooms = await Room.find({}).lean();
      const bookedOnDate = await Booking.find({
        checkIn: { $lt: new Date(searchDate.getTime() + 86400000) },
        checkOut: { $gt: searchDate },
        status: { $ne: 'cancelled' }
      }).select('room').lean();

      const bookedRoomIds = bookedOnDate.map(b => b.room.toString());
      const availableRooms = rooms.filter(r => !bookedRoomIds.includes(r._id.toString()));

      let responseMsg = `📅 Availability for ${searchDate.toDateString()}:\n\n`;
      if (availableRooms.length > 0) {
        responseMsg += `We have ${availableRooms.length} rooms free:\n`;
        availableRooms.forEach(r => {
          responseMsg += `• ${r.name} (₹${r.price}/night)\n`;
        });
      } else {
        responseMsg = `❌ Sorry, all rooms are booked for ${searchDate.toDateString()}.`;
      }
      return res.json({ action: "chat", message: responseMsg });
    }

    // --- CASE 2: DEEP GUEST LOOKUP ---
    if (intent === 'lookup') {
      const query = params.query || message;
      const bookings = await Booking.find({
        $or: [
          { 'guestDetails.fullName': { $regex: query, $options: 'i' } },
          { 'guestDetails.email': { $regex: query, $options: 'i' } }
        ]
      }).populate('room').sort({ createdAt: -1 }).limit(3).lean();

      if (bookings.length === 0) {
        return res.json({ action: "chat", message: `🔍 No bookings found for "${query}".` });
      }

      let responseMsg = `📋 Found ${bookings.length} booking(s) for "${query}":\n\n`;
      bookings.forEach(b => {
        responseMsg += `📍 [BOOKING #${b._id.toString().slice(-6).toUpperCase()}]\n`;
        responseMsg += `👤 Guest: ${b.guestDetails.fullName}\n`;
        responseMsg += `📧 Email: ${b.guestDetails.email}\n`;
        responseMsg += `🏨 Room: ${b.room?.name || 'N/A'}\n`;
        responseMsg += `📅 Support: ${new Date(b.checkIn).toLocaleDateString()} to ${new Date(b.checkOut).toLocaleDateString()}\n`;
        responseMsg += `💰 Total Paid: ₹${b.pricing?.total}\n`;
        responseMsg += `✅ Status: ${b.status.toUpperCase()}\n\n`;
      });
      return res.json({ action: "chat", message: responseMsg });
    }

    // --- CASE 3: CHAT ---
    if (intent === 'chat' && aiMessage) {
      return res.json({ action: "chat", message: aiMessage });
    }

    // --- CASE 4: TABLE COMMANDS (Filter/Sort/Search) ---
    // If intent is filter/sort/search, return the structured JSON for the frontend
    return res.json({ 
      action: intent, 
      field: params.field, 
      value: params.value, 
      order: params.order,
      query: params.query,
      message: aiMessage || `Applying ${intent} command...`
    });

  } catch (error) {
    console.error("Admin AI Error:", error);
    res.status(500).json({ error: "AI Assistant encountered a problem. Please try again." });
  }
});

module.exports = { getDashboardStats, getAllBookings, processAdminAICommand };