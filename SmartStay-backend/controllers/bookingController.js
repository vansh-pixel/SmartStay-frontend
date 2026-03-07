const Booking = require('../models/Booking');
const Room = require('../models/Room');
const sendEmail = require('../utils/sendEmail'); // Import the email utility

const createBooking = async (req, res) => {
  try {
    console.log("----------------------------------------------");
    console.log("🔔 INCOMING BOOKING REQUEST:");
    console.log("Body:", req.body); 

    const {
      roomId,      
      checkIn,
      checkOut,
      guestDetails,
      pricing
    } = req.body;

    // 1. Validate Input
    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }

    // FIX: Search for room by custom 'id' (String "1" or Number 1) or ObjectId
    const mongoose = require('mongoose');
    let room = await Room.findOne({ id: String(roomId) });
    if (!room && !isNaN(roomId)) {
       room = await Room.findOne({ id: Number(roomId) });
    }
    if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
       room = await Room.findById(roomId);
    }
    
    if (!room) {
      console.log(`❌ Room with id ${roomId} not found in DB`);
      return res.status(404).json({ message: 'Room not found' });
    }
    console.log("✅ Room found:", room.name);

    // 2. CHECK AVAILABILITY
    const existingBooking = await Booking.findOne({
      room: room._id, 
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      console.log("❌ Room is already booked");
      return res.status(400).json({ message: 'Room is already booked for these dates' });
    }

    // 3. Create the Booking
    const userId = req.user ? req.user._id : null;

    const booking = await Booking.create({
      room: room._id,
      user: userId,
      guestDetails,
      checkIn,
      checkOut,
      pricing,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    console.log("🎉 Booking Created:", booking._id);

// ---------------------------------------------------------
    // 📧 4. SEND PROFESSIONAL INVOICE EMAIL
    // ---------------------------------------------------------
    try {
      const emailMessage = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #ff6b35; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Booking Confirmed!</h1>
            <p style="color: #fff0eb; margin: 10px 0 0; font-size: 16px;">Thank you for choosing SmartStay</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Dear <strong>${guestDetails.fullName}</strong>,
            </p>
            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your reservation has been successfully confirmed. We're excited to host you! Below are your booking details and invoice.
            </p>

            <!-- Invoice Box -->
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px;">
              <div style="border-bottom: 2px solid #e9ecef; padding-bottom: 15px; margin-bottom: 20px;">
                <h3 style="color: #333333; margin: 0; font-size: 20px;">Receipt #${booking._id.toString().slice(-6).toUpperCase()}</h3>
                <p style="color: #888888; margin: 5px 0 0; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #555555; font-weight: 600;">Room Type</td>
                  <td style="padding: 10px 0; color: #333333; text-align: right;">${room.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #555555; font-weight: 600;">Check-in</td>
                  <td style="padding: 10px 0; color: #333333; text-align: right;">${new Date(checkIn).toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #555555; font-weight: 600;">Check-out</td>
                  <td style="padding: 10px 0; color: #333333; text-align: right;">${new Date(checkOut).toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #555555; font-weight: 600;">Nights</td>
                  <td style="padding: 10px 0; color: #333333; text-align: right;">${pricing.nights}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #555555; font-weight: 600;">Guests</td>
                  <td style="padding: 10px 0; color: #333333; text-align: right;">
                    ${guestDetails.adults} Adults, ${guestDetails.children} Children
                  </td>
                </tr>
              </table>

              <div style="border-top: 2px solid #e9ecef; margin-top: 20px; padding-top: 15px;">
                <table style="width: 100%; border-collapse: collapse;">
                   <tr>
                    <td style="padding: 5px 0; color: #333333; font-weight: 700; font-size: 18px;">Total Paid</td>
                      <td style="padding: 5px 0; color: #ff6b35; text-align: right; font-weight: 700; font-size: 20px;">
                        ₹${pricing.total.toFixed(2)}
                      </td>
                  </tr>
                </table>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
               <a href="http://localhost:3000/profile" style="background-color: #ff6b35; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block;">View My Booking</a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #333333; padding: 20px; text-align: center;">
            <p style="color: #bbbbbb; margin: 0; font-size: 12px;">SmartStay Hotel Inc. | 123 Luxury Ave, City Center</p>
            <p style="color: #bbbbbb; margin: 5px 0 0; font-size: 12px;">Questions? support@smartstay.com</p>
          </div>
        </div>
      `;

      await sendEmail({
        email: guestDetails.email,
        subject: `Booking Confirmed #${booking._id.toString().slice(-6).toUpperCase()} - SmartStay`,
        message: emailMessage
      });
      
      console.log(`📧 Invoice Email sent to ${guestDetails.email}`);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
    }
    // ---------------------------------------------------------

    res.status(201).json({
      success: true,
      bookingId: booking._id,
      message: 'Booking confirmed'
    });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room', 'name image')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      bookingId: booking._id,
      status: booking.status,
      roomName: booking.room ? booking.room.name : 'Unknown Room',
      roomImage: booking.room ? booking.room.image : '',
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.pricing ? booking.pricing.nights : 0,
      guests: booking.guestDetails ? (Number(booking.guestDetails.adults) + Number(booking.guestDetails.children)) : 0,
      total: booking.pricing ? booking.pricing.total : 0,
      createdAt: booking.createdAt
    }));

    res.json({ bookings: formattedBookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Booking (Admin)
// @route   PUT /api/bookings/:id
// @access  Private/Admin
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (booking) {
      // Update fields if they exist in request body
      booking.status = req.body.status || booking.status;
      booking.checkIn = req.body.checkIn || booking.checkIn;
      booking.checkOut = req.body.checkOut || booking.checkOut;
      booking.paymentStatus = req.body.paymentStatus || booking.paymentStatus;
      
      const updatedBooking = await booking.save();
      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Booking (Admin)
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (booking) {
      await booking.deleteOne();
      res.json({ message: 'Booking removed' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Booking Manually (Admin)
// @route   POST /api/bookings/admin
// @access  Private/Admin
const createAdminBooking = async (req, res) => {
  try {
    console.log("----------------------------------------------");
    console.log("🔔 ADMIN BOOKING REQUEST:");
    console.log("Body:", req.body);
    console.log("User:", req.user ? req.user.email : "No User (Manual)");
    const {
      roomId,      
      checkIn,
      checkOut,
      guestDetails,
      pricing,
      paymentStatus = 'pending', // Default to pending if not specified
      paymentMethod = 'manual'   // Default to manual
    } = req.body;

    // 1. Validate Input
    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }

    const mongoose = require('mongoose');
    let room = await Room.findOne({ id: String(roomId) });
    if (!room && !isNaN(roomId)) {
       room = await Room.findOne({ id: Number(roomId) });
    }
    if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
       room = await Room.findById(roomId);
    }
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // 2. CHECK AVAILABILITY
    const existingBooking = await Booking.findOne({
      room: room._id,
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Room is already booked for these dates' });
    }

    // 3. Create the Booking
    // Admin bookings might not be linked to a user account, or could be linked if email matches
    // For now, we'll leave user as null if not provided, or search by email if we wanted to be fancy.
    // Keeping it simple: null user for admin manual bookings usually implies guest/offline user.
    
    const booking = await Booking.create({
      room: room._id,
      user: null, // Explicitly no user account link for manual entry unless we want to search
      guestDetails,
      checkIn,
      checkOut,
      pricing,
      status: 'confirmed',
      paymentStatus, // 'paid' or 'pending'
      paymentMethod  // 'cash', 'qr', 'stripe'
    });

    // 4. Send Email (Reusable logic could be extracted, but keeping inline for now)
    try {
      const emailMessage = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2c3e50; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Reservation Confirmed</h1>
            <p style="color: #ecf0f1; margin: 10px 0 0; font-size: 16px;">Manual Booking via Admin Panel</p>
          </div>
          <div style="padding: 30px;">
            <p>Dear <strong>${guestDetails.fullName}</strong>,</p>
            <p>Your reservation has been confirmed by our staff.</p>
            
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; margin-top: 20px;">
              <h3 style="margin-top: 0;">Booking Details</h3>
              <p><strong>Room:</strong> ${room.name}</p>
              <p><strong>Dates:</strong> ${new Date(checkIn).toDateString()} - ${new Date(checkOut).toDateString()}</p>
              <p><strong>Total:</strong> ₹${pricing.total}</p>
              <p><strong>Status:</strong> ${paymentStatus.toUpperCase()} (${paymentMethod.toUpperCase()})</p>
            </div>
          </div>
        </div>
      `;
      
      await sendEmail({
        email: guestDetails.email,
        subject: `Reservation Confirmed #${booking._id.toString().slice(-6).toUpperCase()}`,
        message: emailMessage
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
    }

    res.status(201).json({
      success: true,
      bookingId: booking._id,
      message: 'Admin booking confirmed'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookedDates = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { roomId } = req.params;
    // Try finding room by ID (String, Number, or ObjectId)
    let room = await Room.findOne({ id: String(roomId) });
    if (!room && !isNaN(roomId)) {
      room = await Room.findOne({ id: Number(roomId) });
    }
    if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
      room = await Room.findById(roomId);
    }
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Find confirmed bookings for this room
    const bookings = await Booking.find({
      room: room._id,
      status: { $ne: 'cancelled' },
      checkOut: { $gte: new Date() } // Only future or current bookings
    }).select('checkIn checkOut');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  createAdminBooking,
  getBookedDates
};









// const Booking = require('../models/Booking');
// const Room = require('../models/Room');

// const createBooking = async (req, res) => {
//   try {
//     console.log("----------------------------------------------");
//     console.log("🔔 INCOMING BOOKING REQUEST:");
//     console.log("Body:", req.body); 

//     const {
//       roomId,      
//       checkIn,
//       checkOut,
//       guestDetails,
//       pricing
//     } = req.body;

//     // 1. Validate Input
//     if (!roomId) {
//       return res.status(400).json({ message: "roomId is required" });
//     }

//     // FIX: Use 'findOne' to search for your custom 'id' (e.g., 1, 2, 3)
//     // We treat roomId as a Number here just in case it comes as a string "2"
//     const room = await Room.findOne({ id: Number(roomId) });
    
//     if (!room) {
//       console.log(`❌ Room with id ${roomId} not found in DB`);
//       // If this happens, it means your Database doesn't have a room with id: 2
//       return res.status(404).json({ message: 'Room not found' });
//     }
//     console.log("✅ Room found:", room.name);

//     // 2. CHECK AVAILABILITY
//     const existingBooking = await Booking.findOne({
//       room: room._id, // We use the REAL _id for the relationship
//       checkIn: { $lt: new Date(checkOut) },
//       checkOut: { $gt: new Date(checkIn) },
//       status: { $ne: 'cancelled' }
//     });

//     if (existingBooking) {
//       console.log("❌ Room is already booked");
//       return res.status(400).json({ message: 'Room is already booked for these dates' });
//     }

//     // 3. Create the Booking
//     // Note: We user req.user._id if it exists, otherwise we proceed without it
//     const userId = req.user ? req.user._id : null;

//     const booking = await Booking.create({
//       room: room._id,
//       user: userId,
//       guestDetails,
//       checkIn,
//       checkOut,
//       pricing,
//       status: 'confirmed',
//       paymentStatus: 'paid'
//     });

//     console.log("🎉 Booking Created:", booking._id);
//     res.status(201).json({
//       success: true,
//       bookingId: booking._id,
//       message: 'Booking confirmed'
//     });

//   } catch (error) {
//     console.error("🔥 SERVER ERROR:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// const getMyBookings = async (req, res) => {
//   try {
//     const bookings = await Booking.find({ user: req.user._id })
//       .populate('room', 'name image')
//       .sort({ createdAt: -1 });

//     const formattedBookings = bookings.map(booking => ({
//       bookingId: booking._id,
//       status: booking.status,
//       roomName: booking.room ? booking.room.name : 'Unknown Room',
//       roomImage: booking.room ? booking.room.image : '',
//       checkIn: booking.checkIn,
//       checkOut: booking.checkOut,
//       nights: booking.pricing ? booking.pricing.nights : 0,
//       guests: booking.guestDetails ? (Number(booking.guestDetails.adults) + Number(booking.guestDetails.children)) : 0,
//       total: booking.pricing ? booking.pricing.total : 0,
//       createdAt: booking.createdAt
//     }));

//     res.json({ bookings: formattedBookings });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const getBookingById = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id).populate('room');
//     if (booking) {
//       res.json(booking);
//     } else {
//       res.status(404).json({ message: 'Booking not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   createBooking,
//   getMyBookings,
//   getBookingById
// };

















// const Booking = require('../models/Booking');
// const Room = require('../models/Room');

// // @desc    Create a new booking
// // @route   POST /api/bookings
// // @access  Private
// const createBooking = async (req, res) => {
//   const {
//     roomId,
//     checkIn,
//     checkOut,
//     guestDetails,
//     pricing
//   } = req.body;

//   try {
//     // 1. Find the room in DB
//     const room = await Room.findOne({ id: roomId });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     // 2. CHECK AVAILABILITY (Prevent Double Booking)
//     // This query checks if any existing booking overlaps with the requested dates.
//     // Logic: An overlap occurs if (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
//     const existingBooking = await Booking.findOne({
//       room: room._id,
//       checkIn: { $lt: new Date(checkOut) },
//       checkOut: { $gt: new Date(checkIn) },
//       status: { $ne: 'cancelled' } // Ignore cancelled bookings
//     });

//     if (existingBooking) {
//       return res.status(400).json({ message: 'Room is already booked for these dates' });
//     }

//     // 3. Create the Booking
//     const booking = await Booking.create({
//       room: room._id,
//       user: req.user ? req.user._id : null, // Attached from authMiddleware
//       guestDetails,
//       checkIn,
//       checkOut,
//       pricing,
//       status: 'confirmed',
//       paymentStatus: 'paid'
//     });

//     res.status(201).json({
//       success: true,
//       bookingId: booking._id,
//       message: 'Booking confirmed'
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get logged in user bookings
// // @route   GET /api/bookings/mybookings
// // @access  Private
// const getMyBookings = async (req, res) => {
//   try {
//     // Find bookings where the 'user' field matches the logged-in user's ID
//     const bookings = await Booking.find({ user: req.user._id })
//       .populate('room', 'name image') // Get room details
//       .sort({ createdAt: -1 }); // Sort by newest first

//     // Map the database results to the format your Frontend Profile expects
//     const formattedBookings = bookings.map(booking => ({
//       bookingId: booking._id,
//       status: booking.status,
//       roomName: booking.room ? booking.room.name : 'Unknown Room',
//       roomImage: booking.room ? booking.room.image : '',
//       checkIn: booking.checkIn,
//       checkOut: booking.checkOut,
//       nights: booking.pricing ? booking.pricing.nights : 0,
//       guests: booking.guestDetails ? (booking.guestDetails.adults + booking.guestDetails.children) : 0,
//       total: booking.pricing ? booking.pricing.total : 0,
//       createdAt: booking.createdAt
//     }));

//     res.json({ bookings: formattedBookings });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get booking by ID
// // @route   GET /api/bookings/:id
// // @access  Private
// const getBookingById = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id).populate('room');
//     if (booking) {
//       res.json(booking);
//     } else {
//       res.status(404).json({ message: 'Booking not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   createBooking,
//   getMyBookings,
//   getBookingById
// };