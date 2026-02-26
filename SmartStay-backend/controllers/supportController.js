const Groq = require('groq-sdk');

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// @desc    Handle AI Chatbot Messages via Groq
// @route   POST /api/support/chatbot
const chatbotResponse = async (req, res) => {
  const { message } = req.body;

  // 1. PROMPT ENGINEERING
  // This tells the AI exactly who it is and what information it knows.
  const systemPrompt = `
    You are the helpful, polite, and professional AI Concierge for "Hotel SmartStay".
    
    HOTEL FACTS:
    - Location: Ahmedabad, Gujarat, India (City Center).
    - Check-in: 2:00 PM | Check-out: 11:00 AM.
    - Prices: Junior Suite ($199), Executive Suite ($299), Super Deluxe ($399).
    - Amenities: Free Wi-Fi, Swimming Pool, Spa, Gym, 24/7 Room Service, Valet Parking.
    - Cancellation: Free up to 24 hours before check-in.
    - Contact: contact@smartstay.com or +1 (555) 123-4567.

    YOUR RULES:
    1. Keep answers concise (max 2-3 sentences).
    2. If asked to book, guide them to the "Book Now" button on the Rooms page.
    3. If the user asks about something not in the facts (like "Can I bring my pet lion?"), say you aren't sure and provide the contact number.
    4. Never make up facts.
    5. Be warm and welcoming.
  `;

  try {
    // 2. Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile", // High speed model suitable for chat
      temperature: 0.5,        // Lower temperature for more factual answers
      max_tokens: 200,         // Limit length
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I didn't catch that.";

    res.json({ reply });

  } catch (error) {
    console.error("Groq API Error:", error);
    
    // Fallback response
    res.json({ 
      reply: "I'm currently having trouble reaching the server. Please contact our support team at +1 (555) 123-4567." 
    });
  }
};

// @desc    Handle Contact Form
const contactSupport = async (req, res) => {
    res.json({ message: "Thank you! We have received your message." });
};

module.exports = { chatbotResponse, contactSupport };