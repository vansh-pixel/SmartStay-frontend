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

  // 1. INTENT CLASSIFICATION PASS
  const intentPrompt = `You are a classifier for a Hotel Admin AI.
Current Date: ${new Date().toDateString()}
Analyze the request: "${message}"

Classify into one of these types:
- filter: Sorting/filtering the current visible table (status, payment, type).
- sort: Sorting the current table (price, date).
- search: Basic keyword search in the current table.
- availability: Checking if rooms are free on a specific date.
- lookup: Searching for a specific client/guest details across all time.
- chat: General conversation.

Return ONLY a JSON object:
{"intent": "intent_name", "params": {"date": "YYYY-MM-DD", "query": "search_term", "field": "field_name", "value": "field_value", "order": "asc/desc"}}`;

  try {
    const classification = await groq.chat.completions.create({
      messages: [{ role: "system", content: intentPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const parsedIntent = JSON.parse(classification.choices[0].message.content);
    const { intent, params } = parsedIntent;

    // 2. DATA FETCHING BASED ON INTENT
    if (intent === 'availability') {
      const searchDate = params.date ? new Date(params.date) : new Date();
      if (isNaN(searchDate.getTime())) {
        return res.json({ action: "chat", message: "I couldn't understand the date you mentioned. Please use a format like YYYY-MM-DD." });
      }

      const rooms = await Room.find({}).lean();
      const bookedOnDate = await Booking.find({
        checkIn: { $lt: new Date(searchDate.getTime() + 86400000) },
        checkOut: { $gt: searchDate },
        status: { $ne: 'cancelled' }
      }).select('room').lean();

      const bookedRoomIds = bookedOnDate.map(b => b.room.toString());
      const availableRooms = rooms.filter(r => !bookedRoomIds.includes(r._id.toString()));

      let responseMsg = `On ${searchDate.toDateString()}, we have ${availableRooms.length} rooms available:\n`;
      availableRooms.forEach(r => {
        responseMsg += `- ${r.name} (₹${r.price}/night)\n`;
      });

      if (availableRooms.length === 0) responseMsg = `Sorry, all rooms are booked for ${searchDate.toDateString()}.`;
      return res.json({ action: "chat", message: responseMsg });
    }

    if (intent === 'lookup') {
      const query = params.query || message;
      const bookings = await Booking.find({
        $or: [
          { 'guestDetails.fullName': { $regex: query, $options: 'i' } },
          { 'guestDetails.email': { $regex: query, $options: 'i' } }
        ]
      }).populate('room').limit(3).lean();

      if (bookings.length === 0) {
        return res.json({ action: "chat", message: `I couldn't find any bookings for "${query}".` });
      }

      let responseMsg = `I found ${bookings.length} booking(s) for "${query}":\n\n`;
      bookings.forEach(b => {
        responseMsg += `--- BOOKING #${b._id.toString().slice(-6).toUpperCase()} ---\n`;
        responseMsg += `Guest: ${b.guestDetails.fullName} (${b.guestDetails.email})\n`;
        responseMsg += `Room: ${b.room?.name || 'Unknown'}\n`;
        responseMsg += `Dates: ${new Date(b.checkIn).toLocaleDateString()} to ${new Date(b.checkOut).toLocaleDateString()}\n`;
        responseMsg += `Status: ${b.status} | Payment: ${b.paymentStatus}\n`;
        responseMsg += `Invoice Total: ₹${b.pricing?.total}\n`;
        responseMsg += `Details: ${b.pricing?.nights} nights, ${b.guestDetails.adults} adults.\n\n`;
      });

      return res.json({ action: "chat", message: responseMsg });
    }

    // 3. FALLBACK TO COMMAND GENERATION FOR FRONTEND (FE-side filtering/sorting)
    // We reuse the original system prompt logic for command-based intents
    const commandPrompt = `You are a Hotel Admin AI. Classify the request into a JSON command for the dashboard table.
Available: filter (status, paymentStatus, type), sort (price, date), search (query), chat (message).
Request: "${message}"
Return ONLY JSON. Example: {"action": "filter", "field": "status", "value": "pending"}`;

    const commandRes = await groq.chat.completions.create({
      messages: [{ role: "system", content: commandPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" }
    });

    res.json(JSON.parse(commandRes.choices[0].message.content));

  } catch (error) {
    console.error("Admin AI Error:", error);
    res.status(500).json({ error: "AI Assistant encountered an error." });
  }
});

module.exports = { getDashboardStats, getAllBookings, processAdminAICommand };