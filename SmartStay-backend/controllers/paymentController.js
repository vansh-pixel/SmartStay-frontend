const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Room = require('../models/Room');

const createPaymentIntent = async (req, res) => {
  const { roomId, nights } = req.body;

  try {
    console.log("------------------------------------------");
    console.log("💳 PAYMENT INTENT STARTED");
    console.log("Incoming Request ID:", roomId);
    console.log("Incoming Request Type:", typeof roomId);

    // 👇 SPY CODE: See what is actually in the database
    const allRooms = await Room.find({});
    console.log("🔍 DATABASE CONTENTS:");
    allRooms.forEach(r => {
      console.log(` - DB Room: "${r.name}" | id: ${r.id} (Type: ${typeof r.id}) | _id: ${r._id}`);
    });
    // 👆 END SPY CODE

    const mongoose = require('mongoose');
    
    // Try finding it as a String or Number custom ID
    let room = await Room.findOne({ id: String(roomId) });
    
    if (!room && !isNaN(roomId)) {
      console.log("⚠️ Not found as String, trying as Number...");
      room = await Room.findOne({ id: Number(roomId) });
    }

    // Try finding it as a MongoDB ObjectId
    if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
      console.log("⚠️ Not found as custom ID, trying as ObjectId...");
      room = await Room.findById(roomId);
    }

    if (!room) {
      console.log("❌ ERROR: Room definitely not found.");
      return res.status(404).json({ message: "Room not found in database" });
    }

    console.log("✅ Room Matched:", room.name);
    
    // Price Calculation
    let priceValue = 0;
    if (typeof room.basePrice === 'number') {
      priceValue = room.basePrice;
    } else if (room.price) {
        // Handle "$120" string or number
        priceValue = typeof room.price === 'string' ? parseInt(room.price.replace('$', '')) : room.price;
    }

    const totalAmount = priceValue * nights * 100;
    
    console.log("🧮 Calculated Amount (cents):", totalAmount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'inr',
      metadata: { roomId: room.id, roomName: room.name },
      automatic_payment_methods: { enabled: true },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
    
  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

const createEventPaymentIntent = async (req, res) => {
  const { hallId, pricePerDay } = req.body;

  try {
    console.log("------------------------------------------");
    console.log("💳 EVENT PAYMENT INTENT STARTED");
    console.log("Incoming Request ID:", hallId);

    const EventHall = require('../models/EventHall');
    const hall = await EventHall.findOne({ id: hallId });

    if (!hall) {
      console.log("❌ ERROR: Hall not found.");
      return res.status(404).json({ message: "Hall not found in database" });
    }

    console.log("✅ Hall Matched:", hall.name);
    
    // Price Calculation (Base + 18% Tax)
    const basePrice = hall.pricePerDay || pricePerDay;
    const totalWithTax = basePrice * 1.18; 
    const totalAmount = Math.round(totalWithTax * 100); // Cents
    
    console.log("🧮 Calculated Amount (cents):", totalAmount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'inr',
      metadata: { hallId: hall.id, hallName: hall.name },
      automatic_payment_methods: { enabled: true },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
    
  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createPaymentIntent, createEventPaymentIntent };











// const Stripe = require('stripe');
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// const Room = require('../models/Room');

// const createPaymentIntent = async (req, res) => {
//   const { roomId, nights } = req.body;

//   try {
//     // 1. Find the room to verify the price from your Database
//     // Note: We use 'findOne' with your custom 'id' field (like 1, 2, 3)
//     const room = await Room.findOne({ id: Number(roomId) });
    
//     if (!room) {
//       return res.status(404).json({ message: "Room not found" });
//     }

//     // 2. Calculate Total Price
//     // Stripe expects amounts in CENTS (e.g., $100 = 10000 cents)
//     const totalAmount = room.price * nights * 100;

//     // 3. Create the PaymentIntent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: totalAmount,
//       currency: 'usd',
//       metadata: { 
//         roomId: room.id, 
//         roomName: room.name 
//       },
//       automatic_payment_methods: {
//         enabled: true,
//       },
//     });

//     // 4. Send the secret to the frontend
//     res.send({
//       clientSecret: paymentIntent.client_secret,
//     });
    
//   } catch (error) {
//     console.error("Stripe Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = { createPaymentIntent };