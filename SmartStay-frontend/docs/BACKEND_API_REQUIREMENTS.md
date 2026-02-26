# Backend API Requirements for Hotel SmartStay

## Document Overview

This document provides complete specifications for the backend team to implement all required APIs for the Hotel SmartStay frontend application.

**Base URL**: `http://localhost:8000/api/v1` (Development)  
**Production**: `https://api.smartstay.com/api/v1`

---

## Table of Contents

1. [General Requirements](#general-requirements)
2. [Authentication APIs](#authentication-apis)
3. [Booking APIs](#booking-apis)
4. [Room APIs](#room-apis)
5. [Support APIs](#support-apis)
6. [User APIs](#user-apis)
7. [Database Schema](#database-schema)
8. [Security Requirements](#security-requirements)
9. [Error Handling](#error-handling)
10. [Testing Requirements](#testing-requirements)

---

## General Requirements

### Technology Stack
- **Framework**: Node.js/Express, Python/Django, or similar
- **Database**: PostgreSQL, MySQL, or MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3 or similar for images

### CORS Configuration
```javascript
// Allow frontend origin
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

### Rate Limiting
- **Auth endpoints**: 5 requests/minute per IP
- **Booking endpoints**: 10 requests/minute per user
- **General endpoints**: 100 requests/minute per user

### Response Format
All responses should follow this structure:

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error type",
  "message": "User-friendly error message",
  "code": "ERROR_CODE"
}
```

---

## Authentication APIs

### 1. POST /api/v1/auth/login

**Purpose**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules**:
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Invalid email format or missing fields
- `401`: Invalid credentials
- `429`: Too many login attempts

**Implementation Notes**:
- Hash passwords using bcrypt (10 rounds)
- JWT should expire in 7 days
- Include user ID and email in JWT payload
- Log failed login attempts

---

### 2. POST /api/v1/auth/signup

**Purpose**: Register new user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Validation Rules**:
- `email`: Required, valid email, unique
- `password`: Required, minimum 6 characters
- `confirmPassword`: Must match password

**Success Response** (201):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Validation errors, passwords don't match
- `409`: Email already exists
- `429`: Too many signup attempts

**Implementation Notes**:
- Check if email already exists before creating
- Hash password before storing
- Send welcome email (optional)
- Auto-login after signup (return JWT)

---

### 3. GET /api/v1/auth/google

**Purpose**: Initiate Google OAuth flow

**Implementation**:
1. Redirect to Google OAuth consent screen
2. Handle callback from Google
3. Create/update user in database
4. Generate JWT token
5. Redirect to frontend with token in URL or cookie

**Callback URL**: `http://localhost:8000/api/v1/auth/google/callback`

**Frontend Redirect**: `http://localhost:3000/?token={jwt_token}`

**Implementation Notes**:
- Use Google OAuth 2.0
- Store Google ID for future logins
- Extract name and email from Google profile

---

### 4. POST /api/v1/auth/logout

**Purpose**: Logout user (optional: blacklist token)

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Implementation Notes**:
- Optional: Add token to blacklist/revocation list
- Optional: Clear any server-side sessions
- Frontend will clear localStorage

---

### 5. GET /api/v1/auth/verify

**Purpose**: Verify JWT token validity

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Success Response** (200):
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**:
- `401`: Invalid or expired token

---

## Booking APIs

### 1. POST /api/v1/bookings

**Purpose**: Create new room booking

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Request Body**:
```json
{
  "roomId": 1,
  "roomName": "JUNIOR SUITE",
  "checkIn": "2024-01-20T00:00:00.000Z",
  "checkOut": "2024-01-25T00:00:00.000Z",
  "guestDetails": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "adults": 2,
    "children": 0,
    "specialRequests": "Late check-in please"
  },
  "pricing": {
    "basePrice": 150,
    "nights": 5,
    "subtotal": 750,
    "taxes": 135,
    "serviceFee": 20,
    "total": 905
  }
}
```

**Validation Rules**:
- `roomId`: Required, must exist
- `checkIn`: Required, ISO date, must be future date
- `checkOut`: Required, ISO date, must be after checkIn
- `guestDetails.fullName`: Required, 2-50 characters
- `guestDetails.email`: Required, valid email
- `guestDetails.phone`: Required, 10-15 digits
- `guestDetails.adults`: Required, minimum 1
- `guestDetails.children`: Optional, default 0
- Room must be available for selected dates

**Success Response** (201):
```json
{
  "success": true,
  "bookingId": "BK12345678",
  "status": "confirmed",
  "message": "Booking created successfully",
  "booking": {
    "id": "booking_uuid",
    "bookingId": "BK12345678",
    "userId": "user_uuid",
    "roomId": 1,
    "roomName": "JUNIOR SUITE",
    "checkIn": "2024-01-20T00:00:00.000Z",
    "checkOut": "2024-01-25T00:00:00.000Z",
    "nights": 5,
    "guestDetails": { ... },
    "pricing": { ... },
    "status": "confirmed",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Validation errors, invalid dates
- `401`: Unauthorized (no token)
- `404`: Room not found
- `409`: Room not available for selected dates

**Implementation Notes**:
- Generate unique booking ID (e.g., BK + timestamp)
- Check room availability before creating
- Lock room for selected dates
- Send confirmation email to guest
- Calculate pricing on backend (don't trust frontend)
- Store all guest details for invoice

---

### 2. GET /api/v1/bookings/:id

**Purpose**: Get booking details by ID

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**URL Parameters**:
- `id`: Booking ID (e.g., BK12345678)

**Success Response** (200):
```json
{
  "success": true,
  "booking": {
    "id": "booking_uuid",
    "bookingId": "BK12345678",
    "userId": "user_uuid",
    "roomId": 1,
    "roomName": "JUNIOR SUITE",
    "roomImage": "https://...",
    "checkIn": "2024-01-20T00:00:00.000Z",
    "checkOut": "2024-01-25T00:00:00.000Z",
    "nights": 5,
    "guestDetails": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "adults": 2,
      "children": 0,
      "specialRequests": "Late check-in"
    },
    "pricing": {
      "basePrice": 150,
      "nights": 5,
      "subtotal": 750,
      "taxes": 135,
      "serviceFee": 20,
      "total": 905
    },
    "status": "confirmed",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `401`: Unauthorized
- `403`: Forbidden (not user's booking)
- `404`: Booking not found

**Implementation Notes**:
- Only allow user to view their own bookings
- Include room details in response

---

### 3. GET /api/v1/bookings/user

**Purpose**: Get all bookings for authenticated user

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters** (optional):
- `status`: Filter by status (confirmed, cancelled, completed)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking_uuid",
      "bookingId": "BK12345678",
      "roomName": "JUNIOR SUITE",
      "roomImage": "https://...",
      "checkIn": "2024-01-20",
      "checkOut": "2024-01-25",
      "nights": 5,
      "guests": 2,
      "total": 905,
      "status": "confirmed",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Implementation Notes**:
- Sort by creation date (newest first)
- Include pagination
- Return summary data (not full details)

---

### 4. DELETE /api/v1/bookings/:id

**Purpose**: Cancel booking

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**URL Parameters**:
- `id`: Booking ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "refundAmount": 905,
  "booking": {
    "bookingId": "BK12345678",
    "status": "cancelled",
    "cancelledAt": "2024-01-16T14:20:00.000Z"
  }
}
```

**Error Responses**:
- `401`: Unauthorized
- `403`: Forbidden (not user's booking)
- `404`: Booking not found
- `400`: Cannot cancel (e.g., check-in date passed)

**Implementation Notes**:
- Only allow cancellation before check-in date
- Calculate refund based on cancellation policy
- Send cancellation email
- Free up room availability

---

### 5. PATCH /api/v1/bookings/:id

**Purpose**: Update booking details

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Request Body** (all fields optional):
```json
{
  "guestDetails": {
    "phone": "+1234567890",
    "specialRequests": "Updated request"
  }
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "booking": { ... }
}
```

**Implementation Notes**:
- Only allow updating guest details, not dates/room
- For date changes, require cancellation and new booking

---

## Room APIs

### 1. GET /api/v1/rooms

**Purpose**: Get all rooms with optional filters

**Query Parameters** (all optional):
- `checkIn`: ISO date string
- `checkOut`: ISO date string
- `guests`: Number of guests
- `minPrice`: Minimum price
- `maxPrice`: Maximum price

**Success Response** (200):
```json
{
  "success": true,
  "rooms": [
    {
      "id": 1,
      "name": "JUNIOR SUITE",
      "description": "Comfortable suite with modern amenities",
      "price": 150,
      "image": "https://images.unsplash.com/...",
      "images": [
        "https://...",
        "https://..."
      ],
      "amenities": [
        { "icon": "wifi", "label": "Free Wi-Fi" },
        { "icon": "ac", "label": "Air Conditioning" },
        { "icon": "tv", "label": "Smart TV" }
      ],
      "capacity": {
        "adults": 2,
        "children": 1
      },
      "available": true
    }
  ]
}
```

**Implementation Notes**:
- If dates provided, check availability
- Filter by capacity if guests parameter provided
- Return all rooms if no filters

---

### 2. GET /api/v1/rooms/:id

**Purpose**: Get detailed room information

**URL Parameters**:
- `id`: Room ID

**Success Response** (200):
```json
{
  "success": true,
  "room": {
    "id": 1,
    "name": "JUNIOR SUITE",
    "description": "Spacious suite with king bed, work desk, and city views",
    "price": 150,
    "weekendPrice": 195,
    "images": [
      {
        "type": "main",
        "url": "https://...",
        "label": "Room View"
      },
      {
        "type": "bed",
        "url": "https://...",
        "label": "Bed View"
      }
    ],
    "amenities": [
      { "icon": "wifi", "label": "Free Wi-Fi" },
      { "icon": "ac", "label": "Air Conditioning" },
      { "icon": "shower", "label": "Hot Water" },
      { "icon": "tv", "label": "Smart TV" }
    ],
    "capacity": {
      "adults": 2,
      "children": 1,
      "maxGuests": 3
    },
    "size": "35 sqm",
    "bedType": "King Bed",
    "view": "City View",
    "floor": "3-7"
  }
}
```

**Error Responses**:
- `404`: Room not found

---

### 3. POST /api/v1/rooms/check-availability

**Purpose**: Check if room is available for dates

**Request Body**:
```json
{
  "roomId": 1,
  "checkIn": "2024-01-20",
  "checkOut": "2024-01-25"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "available": true,
  "roomId": 1,
  "roomName": "JUNIOR SUITE",
  "checkIn": "2024-01-20",
  "checkOut": "2024-01-25",
  "nights": 5,
  "pricing": {
    "basePrice": 150,
    "weekendNights": 2,
    "weekdayNights": 3,
    "subtotal": 840,
    "taxes": 151.20,
    "serviceFee": 20,
    "total": 1011.20
  }
}
```

**If Not Available** (200):
```json
{
  "success": true,
  "available": false,
  "message": "Room not available for selected dates",
  "alternativeDates": [
    {
      "checkIn": "2024-01-22",
      "checkOut": "2024-01-27",
      "available": true
    }
  ]
}
```

**Implementation Notes**:
- Check against existing bookings
- Calculate dynamic pricing (weekends vs weekdays)
- Suggest alternative dates if not available

---

## Support APIs

### 1. POST /api/v1/support/contact

**Purpose**: Send contact/inquiry message

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Inquiry about booking",
  "message": "I have a question about..."
}
```

**Validation Rules**:
- `name`: Required, 2-100 characters
- `email`: Required, valid email
- `message`: Required, 10-1000 characters

**Success Response** (200):
```json
{
  "success": true,
  "message": "Message sent successfully",
  "ticketId": "TKT123456"
}
```

**Implementation Notes**:
- Send email to support team
- Store message in database
- Generate ticket ID
- Send auto-reply to user

---

### 2. POST /api/v1/support/chatbot

**Purpose**: Handle chatbot conversation

**Request Body**:
```json
{
  "message": "What are your check-in times?",
  "conversationId": "conv_123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Check-in is from 2 PM to 11 PM. Early check-in may be available upon request.",
  "conversationId": "conv_123456",
  "suggestions": [
    "What about check-out times?",
    "Do you have parking?",
    "What amenities are included?"
  ]
}
```

**Implementation Notes**:
- Use AI/ML service (OpenAI, Dialogflow) or rule-based
- Maintain conversation context
- Provide helpful suggestions
- Fallback to human support if needed

---

## User APIs

### 1. GET /api/v1/user/profile

**Purpose**: Get user profile

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Success Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "stats": {
      "totalBookings": 5,
      "upcomingBookings": 1,
      "completedBookings": 4
    }
  }
}
```

---

### 2. PATCH /api/v1/user/profile

**Purpose**: Update user profile

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Request Body** (all optional):
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "avatar": "base64_image_data"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rooms Table
```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  weekend_price DECIMAL(10,2),
  image_url TEXT,
  capacity_adults INT DEFAULT 2,
  capacity_children INT DEFAULT 1,
  size VARCHAR(50),
  bed_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Room Images Table
```sql
CREATE TABLE room_images (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id),
  type VARCHAR(50),
  url TEXT NOT NULL,
  label VARCHAR(100)
);
```

### Room Amenities Table
```sql
CREATE TABLE room_amenities (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id),
  icon VARCHAR(50),
  label VARCHAR(100)
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  room_id INT REFERENCES rooms(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT NOT NULL,
  guest_name VARCHAR(100) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20) NOT NULL,
  adults INT NOT NULL,
  children INT DEFAULT 0,
  special_requests TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  taxes DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP
);
```

### Support Messages Table
```sql
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Security Requirements

### 1. Password Security
- Hash passwords using bcrypt (10+ rounds)
- Never store plain text passwords
- Enforce minimum 6 characters

### 2. JWT Security
- Use strong secret key (256-bit)
- Set expiration (7 days recommended)
- Include user ID and email in payload
- Validate on every protected route

### 3. Input Validation
- Validate all inputs server-side
- Sanitize HTML/SQL to prevent injection
- Use parameterized queries
- Validate email format
- Validate phone format

### 4. Rate Limiting
- Implement per-IP and per-user limits
- Use Redis for distributed rate limiting
- Return 429 status when exceeded

### 5. HTTPS
- Enforce HTTPS in production
- Redirect HTTP to HTTPS
- Use secure cookies

---

## Error Handling

### Standard Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

### Error Response Format
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Email is required",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "constraint": "required"
  }
}
```

---

## Testing Requirements

### Unit Tests
- Test all validation logic
- Test authentication flows
- Test booking creation/cancellation
- Test availability checking

### Integration Tests
- Test complete booking flow
- Test authentication flow
- Test error scenarios

### API Documentation
- Use Swagger/OpenAPI
- Document all endpoints
- Provide example requests/responses
- Include authentication requirements

---

## Deployment Checklist

- [ ] Set up database with schema
- [ ] Configure environment variables
- [ ] Set up JWT secret key
- [ ] Configure CORS for frontend
- [ ] Implement rate limiting
- [ ] Set up email service
- [ ] Configure file storage (S3)
- [ ] Set up logging
- [ ] Set up monitoring
- [ ] Create API documentation
- [ ] Write tests
- [ ] Set up CI/CD pipeline

---

## Support

For questions or clarifications, contact the frontend team.

**Frontend Developer**: [Your Name]  
**Email**: [your.email@example.com]  
**Documentation**: See `docs/API_INTEGRATION.md` for frontend integration details