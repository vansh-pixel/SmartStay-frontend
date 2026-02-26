require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const user = await User.findOne();
    if (!user) return console.log("No user");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const http = require('http');
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/halls/bookings/undefined',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    };
    
    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Response body:', data);
            process.exit(0);
        });
    });

    req.write(JSON.stringify({ status: 'confirmed' }));
    req.end();
});
