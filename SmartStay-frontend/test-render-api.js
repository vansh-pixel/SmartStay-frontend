const axios = require('axios');

async function testApi() {
  try {
    const res = await axios.post('https://smartstay-backend-ibsr.onrender.com/api/bookings/admin', {
      roomId: '1',
      checkIn: new Date().toISOString(),
      checkOut: new Date(Date.now() + 86400000).toISOString(),
      guestDetails: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        adults: 2,
        children: 0
      },
      pricing: { perNight: 100, nights: 1, total: 100 },
      paymentStatus: 'paid',
      paymentMethod: 'cash'
    }, {
      headers: {
        // Assuming no token or an invalid one, we should get 401 Unauthorized WITH a response.
        // If it returns a network error (no response), then we reproduced the bug!
        'Authorization': 'Bearer test'
      }
    });
    console.log("Success:", res.status);
  } catch (err) {
    if (err.response) {
      console.log("Got response with status:", err.response.status, err.response.data);
    } else if (err.request) {
      console.log("Network Error! No response received.");
    } else {
      console.log("Other Error:", err.message);
    }
  }
}

testApi();
