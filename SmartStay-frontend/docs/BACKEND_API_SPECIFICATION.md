# Hotel SmartStay - Backend API Specification

## Base URL
```
Production: https://smartstay.com/api
Development: http://localhost:3000/api
```

## Authentication
All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication APIs

### 1.1 User Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+1234567890"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 1.2 User Signup
**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "user",
    "email": "user@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

### 1.3 Google OAuth
**Endpoint:** `GET /api/auth/google`

**Description:** Redirects to Google OAuth consent screen

**Success:** Redirects to frontend with token in URL parameter
```
https://smartstay.com/auth/callback?token=<jwt_token>
```

---

### 1.4 User Logout
**Endpoint:** `POST /api/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. User Profile APIs

### 2.1 Get User Profile
**Endpoint:** `GET /api/user/profile`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+1234567890",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2.2 Update User Profile
**Endpoint:** `PUT /api/user/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "+1234567890"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe Updated",
    "email": "user@example.com",
    "phone": "+1234567890"
  }
}
```

---

## 3. Room APIs

### 3.1 Get All Rooms
**Endpoint:** `GET /api/rooms`

**Query Parameters:**
- `available` (optional): boolean - Filter by availability
- `minPrice` (optional): number - Minimum price filter
- `maxPrice` (optional): number - Maximum price filter

**Success Response (200):**
```json
{
  "success": true,
  "rooms": [
    {
      "_id": "room_id_1",
      "name": "Deluxe Suite",
      "description": "Spacious suite with city view",
      "price": 150,
      "image": "https://example.com/room1.jpg",
      "amenities": ["WiFi", "TV", "Mini Bar", "Air Conditioning"],
      "maxGuests": 2,
      "available": true
    },
    {
      "_id": "room_id_2",
      "name": "Executive Suite",
      "description": "Luxury suite with premium amenities",
      "price": 200,
      "image": "https://example.com/room2.jpg",
      "amenities": ["WiFi", "TV", "Mini Bar", "Air Conditioning", "Jacuzzi"],
      "maxGuests": 3,
      "available": true
    }
  ]
}
```

---

### 3.2 Get Room by ID
**Endpoint:** `GET /api/rooms/:id`

**Success Response (200):**
```json
{
  "success": true,
  "room": {
    "_id": "room_id",
    "name": "Deluxe Suite",
    "description": "Spacious suite with city view",
    "price": 150,
    "image": "https://example.com/room.jpg",
    "amenities": ["WiFi", "TV", "Mini Bar", "Air Conditioning"],
    "maxGuests": 2,
    "available": true
  }
}
```

---

## 4. Booking APIs

### 4.1 Create Booking
**Endpoint:** `POST /api/bookings`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "roomId": "room_id",
  "checkInDate": "2024-02-15",
  "checkOutDate": "2024-02-18",
  "guests": {
    "adults": 2,
    "children": 0
  },
  "guestDetails": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "specialRequests": "Late check-in required",
  "totalPrice": 450
}
```

**Success Response (201):**
```json
{
  "success": true,
  "booking": {
    "_id": "booking_id",
    "bookingId": "BK001",
    "userId": "user_id",
    "roomId": {
      "_id": "room_id",
      "name": "Deluxe Suite",
      "image": "https://example.com/room.jpg"
    },
    "checkInDate": "2024-02-15",
    "checkOutDate": "2024-02-18",
    "guests": {
      "adults": 2,
      "children": 0
    },
    "guestDetails": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "specialRequests": "Late check-in required",
    "totalPrice": 450,
    "status": "confirmed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Room not available for selected dates"
}
```

---

### 4.2 Get User Bookings
**Endpoint:** `GET /api/bookings/user`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "booking_id_1",
      "bookingId": "BK001",
      "roomId": {
        "_id": "room_id",
        "name": "Deluxe Suite",
        "image": "https://example.com/room.jpg"
      },
      "checkInDate": "2024-02-15",
      "checkOutDate": "2024-02-18",
      "guests": {
        "adults": 2,
        "children": 0
      },
      "totalPrice": 450,
      "status": "confirmed",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 4.3 Get Booking by ID
**Endpoint:** `GET /api/bookings/:id`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "booking": {
    "_id": "booking_id",
    "bookingId": "BK001",
    "userId": "user_id",
    "roomId": {
      "_id": "room_id",
      "name": "Deluxe Suite",
      "image": "https://example.com/room.jpg"
    },
    "checkInDate": "2024-02-15",
    "checkOutDate": "2024-02-18",
    "guests": {
      "adults": 2,
      "children": 0
    },
    "guestDetails": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "specialRequests": "Late check-in required",
    "totalPrice": 450,
    "status": "confirmed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4.4 Cancel Booking
**Endpoint:** `PUT /api/bookings/:id/cancel`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "_id": "booking_id",
    "status": "cancelled"
  }
}
```

---

## 5. Support/Chatbot API

### 5.1 Send Chat Message
**Endpoint:** `POST /api/support/chat`

**Request Body:**
```json
{
  "message": "What are your check-in times?",
  "conversationId": "conv_id_optional"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "response": "Our check-in time is 2:00 PM and check-out is 11:00 AM.",
  "conversationId": "conv_id"
}
```

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, required),
  password: String (hashed, required),
  phone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Room Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  price: Number (required),
  image: String (URL),
  amenities: [String],
  maxGuests: Number,
  available: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model
```javascript
{
  _id: ObjectId,
  bookingId: String (unique, auto-generated),
  userId: ObjectId (ref: User),
  roomId: ObjectId (ref: Room),
  checkInDate: Date (required),
  checkOutDate: Date (required),
  guests: {
    adults: Number,
    children: Number
  },
  guestDetails: {
    fullName: String (required),
    email: String (required),
    phone: String (required)
  },
  specialRequests: String,
  totalPrice: Number (required),
  status: String (enum: ['confirmed', 'cancelled', 'completed']),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": {
    "field": "Specific field error"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Security Requirements

1. **Password Hashing**: Use bcrypt with salt rounds >= 10
2. **JWT Tokens**: 
   - Expiry: 7 days
   - Secret: Strong random string (min 32 characters)
3. **HTTPS**: All production endpoints must use HTTPS
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Input Validation**: Validate and sanitize all inputs
6. **CORS**: Configure CORS for frontend domain only

---

## Environment Variables Required

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smartstay
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

---

## Testing Endpoints

Use the following test credentials for development:

**Test User:**
```
Email: test@smartstay.com
Password: Test@123
```

**Test Room IDs:**
```
Deluxe Suite: 507f1f77bcf86cd799439011
Executive Suite: 507f1f77bcf86cd799439012
Junior Suite: 507f1f77bcf86cd799439013
```

---

## Notes for Backend Team

1. All dates should be stored in ISO 8601 format
2. Implement proper indexing on frequently queried fields (email, bookingId, userId)
3. Add database transactions for booking creation to ensure data consistency
4. Implement soft delete for bookings (don't permanently delete)
5. Add logging for all API requests and errors
6. Implement email notifications for booking confirmations
7. Add webhook support for payment gateway integration (future)
8. Consider implementing Redis for session management and caching

---

**Document Version:** 1.0  
**Last Updated:** January 18, 2024  
**Frontend Integration:** Complete  
**Status:** Ready for Backend Implementation