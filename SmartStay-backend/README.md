# SmartStay Backend API

A comprehensive Node.js/Express backend API for the SmartStay hotel booking system, built with MongoDB Atlas and JWT authentication.

## 🚀 Features

- **User Authentication**: JWT-based login/signup with Google OAuth support
- **Room Management**: Complete room inventory with availability checking
- **Booking System**: Full booking lifecycle management
- **Support System**: Contact forms and AI chatbot
- **Security**: Rate limiting, input validation, CORS, helmet security headers
- **Scalable**: MongoDB Atlas for cloud database, production-ready architecture

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## 🛠 Installation

1. **Clone the repository**
   ```bash
   cd SmartStay-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartstay?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **MongoDB Atlas Setup**
   - Create a MongoDB Atlas cluster
   - Get your connection string
   - Add your IP address to the whitelist
   - Update `MONGODB_URI` in `.env`

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:8000`

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication Endpoints

#### POST /auth/login
**Login user**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/signup
**Register new user**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### Booking Endpoints

#### POST /bookings
**Create booking** (Requires authentication)
```json
{
  "roomId": "room_id",
  "roomName": "JUNIOR SUITE",
  "checkIn": "2024-01-20T00:00:00.000Z",
  "checkOut": "2024-01-25T00:00:00.000Z",
  "guestDetails": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "adults": 2,
    "children": 0
  },
  "pricing": {
    "total": 905
  }
}
```

#### GET /bookings/user
**Get user bookings** (Requires authentication)

### Room Endpoints

#### GET /rooms
**Get all rooms**
Query parameters: `checkIn`, `checkOut`, `guests`

#### GET /rooms/:id
**Get room details**

#### POST /rooms/check-availability
**Check room availability**
```json
{
  "roomId": "room_id",
  "checkIn": "2024-01-20",
  "checkOut": "2024-01-25"
}
```

### Support Endpoints

#### POST /support/contact
**Send contact message**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I have a question..."
}
```

#### POST /support/chatbot
**Chat with AI assistant**
```json
{
  "message": "What are your check-in times?",
  "conversationId": "optional_id"
}
```

### User Endpoints

#### GET /user/profile
**Get user profile** (Requires authentication)

#### PATCH /user/profile
**Update user profile** (Requires authentication)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Comprehensive validation using express-validator
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Password Hashing**: bcrypt with salt rounds
- **Error Handling**: Sanitized error responses

## 🗄 Database Schema

### Users Collection
- Authentication and profile data
- Indexes on email and Google ID

### Rooms Collection
- Room inventory with amenities and pricing
- Image galleries and capacity information

### Bookings Collection
- Complete booking lifecycle
- Guest details and pricing breakdown

### Support Collection
- Contact messages and chatbot conversations
- Ticket tracking system

## 🧪 Testing

### Health Check
```
GET /health
```

### Using Postman
Import the provided Postman collection for testing all endpoints.

## 📦 Scripts

```bash
# Start server
npm start

# Development mode
npm run dev

# Lint code
npm run lint

# Run tests
npm test
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://yourdomain.com
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start server.js --name smartstay-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@smartstay.com or create an issue in the repository.

## 🔄 API Versioning

Current API version: v1
All endpoints are prefixed with `/api/v1/`

---

**Built with ❤️ for SmartStay Hotel Management System**
