# API Integration Guide

## Overview

This document describes the API integration for the Hotel SmartStay frontend application.

## Base Configuration

### API Base URL
- **Development**: `http://localhost:8000/api/v1`
- **Production**: Set via `NEXT_PUBLIC_API_URL` environment variable

### Configuration File
Location: `lib/api.js`

```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const API_TIMEOUT = 10000 // 10 seconds
```

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Update `NEXT_PUBLIC_API_URL` with your backend URL

```bash
cp .env.local.example .env.local
```

## API Endpoints

### Authentication APIs

#### POST /auth/login
**Purpose**: User login

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Frontend Usage**:
```javascript
import { authAPI } from '@/lib/api'

const response = await authAPI.login(email, password)
localStorage.setItem('jwtToken', response.token)
```

---

#### POST /auth/signup
**Purpose**: User registration

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response**: Same as login

**Frontend Usage**:
```javascript
const response = await authAPI.signup(email, password, confirmPassword)
```

---

#### GET /auth/google
**Purpose**: Google OAuth redirect

**Frontend Usage**:
```javascript
authAPI.googleAuth() // Redirects to Google OAuth
```

---

#### POST /auth/logout
**Purpose**: User logout

**Headers**: `Authorization: Bearer {token}`

**Frontend Usage**:
```javascript
await authAPI.logout()
localStorage.removeItem('jwtToken')
```

---

#### GET /auth/verify
**Purpose**: Verify JWT token validity

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "valid": true,
  "user": { ... }
}
```

---

### Booking APIs

#### POST /bookings
**Purpose**: Create new booking

**Headers**: `Authorization: Bearer {token}`

**Request**:
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
    "specialRequests": "Late check-in"
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

**Response**:
```json
{
  "bookingId": "BK12345678",
  "status": "confirmed",
  "message": "Booking successful",
  "booking": { ... }
}
```

**Frontend Usage**:
```javascript
import { bookingAPI } from '@/lib/api'

const response = await bookingAPI.create(bookingData)
setBookingId(response.bookingId)
```

---

#### GET /bookings/:id
**Purpose**: Get booking details

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "bookingId": "BK12345678",
  "status": "confirmed",
  "room": { ... },
  "guest": { ... },
  "dates": { ... },
  "pricing": { ... }
}
```

---

#### GET /bookings/user
**Purpose**: Get user's booking history

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "bookings": [
    {
      "bookingId": "BK12345678",
      "roomName": "JUNIOR SUITE",
      "checkIn": "2024-01-20",
      "checkOut": "2024-01-25",
      "status": "confirmed",
      "total": 905
    }
  ]
}
```

---

#### DELETE /bookings/:id
**Purpose**: Cancel booking

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "message": "Booking cancelled successfully",
  "refundAmount": 905
}
```

---

### Room APIs

#### GET /rooms
**Purpose**: Get all rooms with optional filters

**Query Parameters**:
- `checkIn` (optional): ISO date string
- `checkOut` (optional): ISO date string
- `guests` (optional): Number of guests

**Response**:
```json
{
  "rooms": [
    {
      "id": 1,
      "name": "JUNIOR SUITE",
      "price": "$150",
      "image": "url",
      "amenities": [...],
      "available": true
    }
  ]
}
```

---

#### GET /rooms/:id
**Purpose**: Get specific room details

**Response**:
```json
{
  "id": 1,
  "name": "JUNIOR SUITE",
  "description": "...",
  "price": 150,
  "images": [...],
  "amenities": [...],
  "capacity": {
    "adults": 2,
    "children": 1
  }
}
```

---

#### POST /rooms/check-availability
**Purpose**: Check room availability

**Request**:
```json
{
  "roomId": 1,
  "checkIn": "2024-01-20",
  "checkOut": "2024-01-25"
}
```

**Response**:
```json
{
  "available": true,
  "price": 150,
  "totalPrice": 750
}
```

---

### Support APIs

#### POST /support/contact
**Purpose**: Send contact message

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I have a question..."
}
```

**Response**:
```json
{
  "message": "Message sent successfully",
  "ticketId": "TKT123"
}
```

---

#### POST /support/chatbot
**Purpose**: Chatbot conversation

**Request**:
```json
{
  "message": "What are your check-in times?",
  "conversationId": "conv_123" // optional
}
```

**Response**:
```json
{
  "message": "Check-in is from 2 PM to 11 PM",
  "conversationId": "conv_123"
}
```

**Frontend Usage**:
```javascript
import { supportAPI } from '@/lib/api'

const response = await supportAPI.chatbot(userMessage, conversationId)
setConversationId(response.conversationId)
```

---

### User APIs

#### GET /user/profile
**Purpose**: Get user profile

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "bookings": 5
}
```

---

#### PATCH /user/profile
**Purpose**: Update user profile

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., user already exists)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "code": "ERROR_CODE"
}
```

### Frontend Error Handling

The API client automatically handles common errors:

```javascript
// Automatic token refresh on 401
// Automatic retry on network errors
// Timeout handling (10 seconds)
// Error message normalization
```

## Request Interceptors

### Authentication
All authenticated requests automatically include the JWT token:

```javascript
Authorization: Bearer {token}
```

### Content Type
Default content type is `application/json`

## Response Interceptors

### Automatic Logout on 401
When a 401 response is received:
1. JWT token is removed from localStorage
2. `unauthorized` event is dispatched
3. User is redirected to login

### Error Normalization
All errors are normalized to include a user-friendly message:

```javascript
error.message = "User-friendly error message"
```

## Testing

### Development
```bash
# Start backend server
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

### API Testing Tools
- Postman collection: `docs/postman_collection.json`
- cURL examples: See individual endpoint documentation

## Security

### CORS Configuration
Backend must allow requests from frontend origin:

```javascript
// Backend CORS config
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
})
```

### Token Storage
- JWT tokens stored in localStorage
- Tokens included in Authorization header
- Automatic cleanup on logout/401

### HTTPS in Production
Always use HTTPS in production:

```
NEXT_PUBLIC_API_URL=https://api.smartstay.com/api/v1
```

## Rate Limiting

Backend should implement rate limiting:
- Auth endpoints: 5 requests/minute
- Booking endpoints: 10 requests/minute
- General endpoints: 100 requests/minute

## Monitoring

### Error Logging
All API errors are logged to console in development.

In production, integrate with error tracking:
```javascript
// Example: Sentry integration
Sentry.captureException(error)
```

### Performance Monitoring
Track API response times and success rates.

## Support

For API issues:
- Check backend logs
- Verify environment variables
- Test endpoints with Postman
- Review network tab in browser DevTools