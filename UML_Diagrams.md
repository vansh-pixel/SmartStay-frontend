# SmartStay - Comprehensive UML Documentation

This document contains all the necessary UML diagrams representing the complete architecture, database schema, user interactions, and system flows for the SmartStay platform.

---

## 1. System Architecture (Component Diagram)

This diagram visualizes the high-level technology stack and the interaction between the Next.js frontend, the Node.js/Express backend, and the MongoDB database.

```mermaid
graph TD
    subgraph Frontend [Next.js Client]
        UI([User Interface Components])
        Context([State Management / Context])
        API_Client([Axios API Client])
        
        UI --> Context
        UI --> API_Client
    end

    subgraph Backend [Node.js / Express Server]
        Router([Express API Routes])
        Middleware([Auth & Error Middleware])
        Controllers([Business Logic Controllers])
        Models([Mongoose ODM Models])
        
        Router --> Middleware
        Middleware --> Controllers
        Controllers --> Models
    end

    subgraph Database [MongoDB]
        DB[(SmartStay Cluster)]
    end

    subgraph External Services
        Stripe([Stripe Payment Gateway])
    end

    API_Client -- "HTTP / REST API" --> Router
    Models -- "Mongoose Driver" --> DB
    Controllers -- "Payment Intents" --> Stripe
```

---

## 2. Entity-Relationship (ER) / Class Diagram

This diagram maps out every database collection (model) currently defined in your MongoDB schema, including detailed attributes and their relationships to each other.

```mermaid
classDiagram
    direction TB
    
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +Boolean isAdmin
        +String resetPasswordToken
        +Date resetPasswordExpire
        +Date createdAt
        +Date updatedAt
        +matchPassword(enteredPassword) Boolean
        +getResetPasswordToken() String
    }

    class Room {
        +ObjectId _id
        +String id
        +String name
        +String price
        +Number basePrice
        +String image
        +String description
        +String size
        +String bedType
        +Number maxGuests
        +Object[] amenities
        +Object[] images
        +Date createdAt
        +Date updatedAt
    }

    class EventHall {
        +ObjectId _id
        +String id
        +String name
        +String type
        +Number pricePerDay
        +String priceDisplay
        +Number capacity
        +String description
        +String image
        +String[] amenities
        +String[] images
        +Date createdAt
        +Date updatedAt
    }

    class Booking {
        +ObjectId _id
        +ObjectId room
        +ObjectId user
        +Object guestDetails
        +Date checkIn
        +Date checkOut
        +Object pricing
        +String status
        +String paymentStatus
        +Date createdAt
        +Date updatedAt
    }

    class EventBooking {
        +ObjectId _id
        +ObjectId hall
        +ObjectId user
        +Object guestDetails
        +Date eventDate
        +String eventType
        +Object pricing
        +String status
        +Date createdAt
        +Date updatedAt
    }

    class Review {
        +ObjectId _id
        +ObjectId user
        +String name
        +String email
        +String quote
        +Number rating
        +Date createdAt
        +Date updatedAt
    }

    User "1" -- "0..*" Booking : places >
    User "1" -- "0..*" EventBooking : places >
    User "1" -- "0..*" Review : writes >
    Room "1" -- "0..*" Booking : is booked in >
    EventHall "1" -- "0..*" EventBooking : is booked in >
```

---

## 3. Use Case Diagram

This diagram identifies the main actors interacting with the system and their respective actions and capabilities.

```mermaid
flowchart LR
    Guest([Guest User])
    Customer([Logged-in User])
    Admin([Admin User])

    subgraph SmartStay Platform
        UC1(Browse Rooms & Amenities)
        UC2(Browse Event Halls)
        UC3(Login / Register / Recover Password)
        
        UC4(Check Room Availability)
        UC5(Book a Room / Make Payment)
        UC6(Book an Event Hall)
        
        UC7(View Order History)
        UC8(Submit Platform Review)
        
        UC9(Access Admin Dashboard)
        UC10(View Revenue Analytics)
        UC11(Manage All Bookings)
        UC12(Create Manual Admin Bookings)
    end

    %% Guest Actions
    Guest ---> UC1
    Guest ---> UC2
    Guest ---> UC3
    Guest ---> UC4

    %% Customer Actions
    Customer ---> UC1
    Customer ---> UC2
    Customer ---> UC4
    Customer ---> UC5
    Customer ---> UC6
    Customer ---> UC7
    Customer ---> UC8

    %% Admin Actions
    Admin ---> UC9
    Admin ---> UC10
    Admin ---> UC11
    Admin ---> UC12
```

---

## 4. Sequence Diagrams

### 4.1 Authentication Flow (Login)

```mermaid
sequenceDiagram
    participant Client as Next.js Frontend
    participant Route as Express Router
    participant Controller as Auth Controller
    participant DB as MongoDB (User Table)
    
    Client->>Route: POST /api/auth/login {email, password}
    Route->>Controller: Parse Request
    Controller->>DB: findOne({ email: req.email })
    
    alt User not found
        DB-->>Controller: null
        Controller-->>Client: 401 Unauthorized (Invalid credentials)
    else User exists
        DB-->>Controller: User Document
        Controller->>Controller: user.matchPassword(password)
        
        alt Password Mismatch
            Controller-->>Client: 401 Unauthorized (Invalid credentials)
        else Password Valid
            Controller->>Controller: jwt.sign(userId)
            Controller-->>Client: 200 OK { _id, name, email, isAdmin, token }
        end
    end
```

### 4.2 Room Booking Flow

```mermaid
sequenceDiagram
    participant User as Web User
    participant Frontend as Next.js App
    participant RoomAPI as Room Controller
    participant BookingAPI as Booking Controller
    participant Stripe as Stripe Gateway
    participant DB as Database
    
    User->>Frontend: Selects Dates & Room
    Frontend->>RoomAPI: POST /api/rooms/check-availability
    RoomAPI->>DB: Query Overlapping Bookings
    DB-->>RoomAPI: Boolean (Available)
    RoomAPI-->>Frontend: 200 OK (Room is Available)
    
    User->>Frontend: Proceed to Checkout
    Frontend->>Stripe: Request Payment Intent (Simulated)
    Stripe-->>Frontend: Returns Payment Token
    
    User->>Frontend: Confirms Payment
    Frontend->>BookingAPI: POST /api/bookings {room, dates, guestDetails, token}
    BookingAPI->>DB: Create new Booking Document
    DB-->>BookingAPI: Booking Saved
    BookingAPI-->>Frontend: 201 Created (Booking Success)
    Frontend-->>User: Redirect to Success / Receipt Page
```

---

## 5. State Machine Diagram

This diagram outlines the lifecycle states of a `Booking` or `EventBooking` entity from creation to conclusion.

```mermaid
stateDiagram-v2
    [*] --> Pending : User initiates checkout
    
    Pending --> Confirmed : Payment succeeds
    Pending --> Failed : Payment rejected
    Pending --> Cancelled : User abandons checkout
    
    Confirmed --> CheckedIn : Guest arrives/Event starts
    Confirmed --> Cancelled : Guest requests cancellation
    
    CheckedIn --> CheckedOut : Guest leaves
    CheckedIn --> Completed : Event finishes
    
    CheckedOut --> [*]
    Completed --> [*]
    Failed --> [*]
    Cancelled --> [*]
```
