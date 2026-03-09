"use client";

import React, { useState, useEffect } from "react";
import mermaid from "mermaid";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function AdminDevMode({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState("Architecture");
  const [activeSubCategory, setActiveSubCategory] = useState("Level 0: Context");
  const [svgContent, setSvgContent] = useState("");
  const [isRendering, setIsRendering] = useState(false);

  // We will build out diagramsDB with all requested schemas next.
  const diagramsDB = {
    Architecture: {
      "Level 0: Context": {
        title: "System Context Architecture (Level 0)",
        code: `
flowchart LR
    G["Guest User"]:::person
    A["Admin Support"]:::person
    S["SmartStay Cloud Application"]:::system
    P["Stripe Payment Gateway"]:::ext
    D["MongoDB Cloud Atlas"]:::ext

    classDef person fill:#0ea5e9,stroke:#0f172a,color:#fff,padding:15px,rx:10
    classDef system fill:#4f46e5,stroke:#0f172a,color:#fff,padding:25px,rx:10
    classDef ext fill:#475569,stroke:#0f172a,color:#fff,padding:15px,rx:10

    G <-->|"Browses visually via HTTPS"| S
    A <-->|"Modifies objects via HTTPS"| S
    S <-->|"Validates PCI via API"| P
    S <-->|"Persists Objects via TCP"| D
        `,
        description: "This diagram demonstrates how the highest-level actors interact with the SmartStay application and external services over standard networking protocols."
      }
    },
    "Use Cases": {
      "System Overview": {
        title: "SmartStay Primary Use Cases",
        code: `
flowchart LR
    %% Actors
    G((Guest\\nClient)):::actor
    A((Admin)):::actor
    S((Stripe\\nSystem)):::actor
    
    %% Use Cases
    subgraph App [SmartStay App]
        UC1([Browse Rooms]):::usecase
        UC2([Filter & Search]):::usecase
        UC3([Book Room]):::usecase
        UC4([Leave Review]):::usecase
        UC5([Manage Rooms]):::usecase
        UC6([View Bookings]):::usecase
        UC7([Process Payments]):::usecase
    end
    
    %% Connections
    G --> UC1
    G --> UC2
    G --> UC3
    G --> UC4
    
    A --> UC5
    A --> UC6
    A --> UC6
    
    UC3 -.->|includes| UC7
    S --> UC7
    
    %% Styles
    classDef actor fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    classDef usecase fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
        `,
        description: "A high-level view of the primary interactions between various actors and the core modules of the SmartStay app."
      }
    },
    "Sequence Diagrams": {
      "Booking Flow": {
        title: "User Booking & Payment Sequence",
        code: `
sequenceDiagram
    autonumber
    actor Guest
    participant Frontend
    participant Backend API
    participant Stripe API
    participant MongoDB
    
    Guest->>Frontend: Select Room & Dates
    Guest->>Frontend: Enter Details & Card Info
    Frontend->>Stripe API: Request Payment Method
    Stripe API-->>Frontend: Token/PM ID
    Frontend->>Backend API: POST /bookings (Token + Dates)
    Backend API->>MongoDB: Check Availability
    MongoDB-->>Backend API: Dates Available
    Backend API->>Stripe API: Create Payment Intent
    Stripe API-->>Backend API: Charge Success (200)
    Backend API->>MongoDB: Save Booking Record
    MongoDB-->>Backend API: Booking ID
    Backend API-->>Frontend: 201 Created (Success)
    Frontend-->>Guest: Show Confirmation Screen
        `,
        description: "The order of operations across network boundaries when a guest successfully books a room."
      },
      "Admin Login Flow": {
        title: "Admin JWT Authentication Flow",
        code: `
sequenceDiagram
    autonumber
    actor Admin
    participant Next.js UI
    participant Auth Controller
    participant MongoDB
    
    Admin->>Next.js UI: Submit Email & Password
    Next.js UI->>Auth Controller: POST /api/v1/auth/login
    Auth Controller->>MongoDB: Find User by Email (+ Select Password)
    MongoDB-->>Auth Controller: User Document
    Auth Controller->>Auth Controller: bcrypt.compare(passwords)
    Auth Controller->>Auth Controller: Generate JWT signed with Secret
    Auth Controller-->>Next.js UI: 200 OK + token + user object
    Next.js UI->>Next.js UI: Save Token to LocalStorage
    Next.js UI-->>Admin: Redirect to Admin Dashboard
        `,
        description: "How administrators authenticate and receive stateless JWT tokens for future protected requests."
      }
    },
    "ER Diagram": {
      "Full Database Schema": {
        title: "SmartStay Entity Relationship Diagram",
        code: `
erDiagram
    USER ||--o{ BOOKING : places
    USER ||--o{ REVIEW : writes
    ROOM ||--o{ BOOKING : contains
    ROOM ||--o{ REVIEW : receives
    EVENT_HALL ||--o{ EVENT_BOOKING : hosts
    
    USER {
        ObjectId _id PK
        String name
        String email UK
        String password
        Boolean isAdmin
        String resetPasswordToken
        Date resetPasswordExpire
        Date createdAt
        Date updatedAt
    }
    
    ROOM {
        ObjectId _id PK
        String id UK "e.g., executive-suite"
        String name
        Number basePrice
        String price
        String description
        String size
        String bedType
        Number maxGuests
        Array amenities "[{label, icon}]"
        Array images "[{type, url, label}]"
        Date createdAt
        Date updatedAt
    }
    
    BOOKING {
        ObjectId _id PK
        ObjectId room FK
        ObjectId user FK "Optional"
        Object guestDetails "fullName, email, phone, adults..."
        Date checkIn
        Date checkOut
        Object pricing "basePrice, serviceFee, taxes, total"
        String status "confirmed, cancelled, completed..."
        String paymentStatus "paid, pending, failed"
        Date createdAt
        Date updatedAt
    }
    
    REVIEW {
        ObjectId _id PK
        ObjectId room FK
        ObjectId user FK "Optional"
        String userName
        Number rating
        String comment
        Date createdAt
    }
    
    EVENT_HALL {
        ObjectId _id PK
        String name
        Number capacity
        Number pricePerHour
        String description
    }
    
    EVENT_BOOKING {
        ObjectId _id PK
        ObjectId hall FK
        ObjectId user FK
        Date eventDate
        Number durationHours
        Number totalAmount
    }
        `,
        description: "A detailed map of all MongoDB collections, their exact attribute types, and relationships mapping the business logic."
      }
    },
    "Admin DFDs": {
      "Level 0 (Context)": {
         title: "Admin Context DFD",
         code: `
flowchart TD
    A[Admin User] -->|Commands/Data| S((SmartStay Admin System))
    S -->|Reports/Status| A
    S -->|Queries/Updates| DB[(MongoDB)]
    DB -->|Results| S
         `,
         description: "Highest level view of the Admin side."
      },
      "Level 1 (Major Processes)": {
         title: "Admin Level 1 DFD",
         code: `
flowchart TD
    A[Admin User]
    DB[(MongoDB)]
    
    P1((1.0 Auth/Login))
    P2((2.0 Room Management))
    P3((3.0 Booking Management))
    
    A -->|Credentials| P1
    P1 -->|JWT Token| A
    
    A -->|Room Data| P2
    P2 -->|Save/Edit| DB
    DB -->|Room List| P2
    P2 -->|Display Data| A
    
    A -->|Booking Filters| P3
    P3 -->|Queries| DB
    DB -->|Booking Records| P3
    P3 -->|Status Actions| DB
    P3 -->|Booking Dashboard| A
         `,
         description: "Breaking down the Admin side into core process modules."
      },
      "Level 2 (Room Management 2.0)": {
         title: "Admin Level 2 (Sub-Process 2.0)",
         code: `
flowchart TD
    A[Admin User]
    DB[(Rooms Collection)]
    
    P21((2.1 Create Room))
    P22((2.2 Edit Details))
    P23((2.3 Manage Images))
    P24((2.4 Delete Room))
    
    A -->|New Room JSON| P21
    P21 -->|Insert Doc| DB
    
    A -->|Patch JSON| P22
    P22 -->|UpdateById| DB
    
    A -->|Image URLs| P23
    P23 -->|Push to Array| DB
    
    A -->|RoomID| P24
    P24 -->|DeleteById| DB
         `,
         description: "Exploding the '2.0 Room Management' node into its granular CRUD operations."
      },
      "Level 3 (Booking Edits 3.0)": {
         title: "Admin Level 3 (Booking State Machine)",
         code: `
flowchart TD
    DB[(Bookings Collection)]
    Controller[Admin API Controller]
    
    P31((3.1 Verify Privileges))
    P32((3.2 Validate State Transition))
    P33((3.3 Trigger Hooks))
    
    Controller -->|Token| P31
    P31 --> P32
    P32 -->|Check current status| DB
    DB -->|'confirmed'| P32
    P32 -->|Approve 'checked-in'| P33
    P33 -->|Update Doc| DB
         `,
         description: "Micro-level view inside a specific controller action (changing a booking status)."
      },
      "Level 4 (Audit Trail)": {
          title: "Admin Level 4 DFD",
          code: `
flowchart TD
    Admin[Admin Actor]
    API((4.1 Event Emitter))
    Log[(Audit Log)]
    
    Admin -->|State Change| API
    API -->|Write Log Entry| Log
          `,
          description: "Internal representation of logging admin changes."
      },
      "Level 5 & 6 (Deep Logic)": {
          title: "Admin Level 5/6 (Internal Algorithms)",
          code: `
flowchart LR
    R((5.1 Revenue Calc)) --> F((6.1 Tax Math))
    F --> D[(Cache)]
          `,
          description: "Lowest level abstract math execution nodes."
      }
    },
    "Client DFDs": {
      "Level 0 (Context)": {
         title: "Client Context DFD",
         code: `
flowchart TD
    G[Guest/Client] -->|Browsing/Booking Requests| Sys((SmartStay Client App))
    Sys -->|UI Views/Confirmations| G
    Sys -->|Validation| Stripe[Stripe API]
    Sys -->|Persistence| DB[(MongoDB)]
         `,
         description: "Context level diagram for the user-facing storefront."
      },
      "Level 1 (Storefront)": {
         title: "Client Level 1 DFD",
         code: `
flowchart TD
    G[Guest]
    DB[(MongoDB)]
    
    P1((1.0 Browse Catalog))
    P2((2.0 Checkout Flow))
    P3((3.0 Auth/Profile))
    
    G -->|Filters| P1
    P1 -->|Fetch Rooms| DB
    DB -->|Room Docs| P1
    P1 -->|Display Grid| G
    
    G -->|Cart/Dates| P2
    P2 -->|Create Intent| Stripe
    P2 -->|Save Booking| DB
    
    G -->|Login Details| P3
    P3 -->|Query User| DB
         `,
         description: "Major independent processes available to a regular guest."
      },
      "Level 2 (Checkout 2.0)": {
         title: "Client Level 2 (Sub-Process 2.0 Checkout)",
         code: `
flowchart TD
    G[Guest]
    DB[(Database)]
    Stripe[Stripe API]
    
    P21((2.1 Date Validation))
    P22((2.2 Pricing Calc))
    P23((2.3 Card Tokenization))
    P24((2.4 Finalize))
    
    G -->|Selected Dates| P21
    P21 <-->|Check overlap| DB
    P21 --> P22
    P22 -->|Compute base*nights + tax| P23
    G -->|Typed Card| P23
    P23 <-->|Secure Handshake| Stripe
    P23 -->|pmToken| P24
    P24 -->|Save Confirmed| DB
         `,
         description: "Exploding the crucial booking and checkout sequence into DFD nodes."
      },
      "Level 3 (Search Algorithms 3.0)": {
         title: "Client Level 3 (Search/Filter Logic)",
         code: `
flowchart LR
    UI[React State]
    L1((3.1 Price Filter))
    L2((3.2 Amenity Match))
    L3((3.3 Date Range Math))
    
    UI --> L1
    L1 --> L2
    L2 --> L3
    L3 -->|Filtered Array| UI
         `,
         description: "Client-side RAM and CPU filtering algorithms."
      },
      "Level 4 & 5 (Micro-interactions)": {
         title: "Client Level 4/5 (UI State)",
         code: `
flowchart TD
    M((4.1 Modal Open)) --> A((5.1 Animation Frame))
    A --> DOM[Browser Paint]
         `,
         description: "Frontend specific rendering processes."
      }
    },
    "Data Dictionary": {
      "Models Overview": {
        title: "Database Models Dictionary",
        html: `
        <div class="overflow-y-auto p-4 h-[calc(100vh-200px)] lg:h-full">
          <table class="w-full text-left border-collapse text-sm text-slate-300">
            <thead>
              <tr class="bg-slate-800 border-b-2 border-slate-700 sticky top-0 shadow-md">
                 <th class="p-4 font-semibold text-white w-1/6">Entity</th>
                 <th class="p-4 font-semibold text-white w-1/5">Attribute</th>
                 <th class="p-4 font-semibold text-white w-1/6">Type</th>
                 <th class="p-4 font-semibold text-white w-1/4">Constraints</th>
                 <th class="p-4 font-semibold text-white">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              
              <!-- USER MODEL -->
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-medium text-sky-400 align-top" rowspan="5">USER</td>
                <td class="p-4 font-mono text-emerald-400">_id</td>
                <td class="p-4 text-slate-400">ObjectId</td>
                <td class="p-4"><span class="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-xs">PK</span> <span class="bg-slate-700 px-2 py-0.5 rounded text-xs">Auto</span></td>
                <td class="p-4 text-slate-400">Primary Key generated by MongoDB.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">name</td>
                <td class="p-4 text-slate-400">String</td>
                <td class="p-4"><span class="bg-slate-700 px-2 py-0.5 rounded text-xs">Default: split(email)</span></td>
                <td class="p-4 text-slate-400">Display name of the user.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">email</td>
                <td class="p-4 text-slate-400">String</td>
                <td class="p-4"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required</span> <span class="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs">Unique</span> <span class="bg-slate-700 px-2 py-0.5 rounded text-xs">Regex Match</span></td>
                <td class="p-4 text-slate-400">Authentication identifier.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">password</td>
                <td class="p-4 text-slate-400">String</td>
                <td class="p-4"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required</span> <span class="bg-slate-700 px-2 py-0.5 rounded text-xs">select: false</span></td>
                <td class="p-4 text-slate-400">Bcrypt hashed password. Excluded from normal queries.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">isAdmin</td>
                <td class="p-4 text-slate-400">Boolean</td>
                <td class="p-4"><span class="bg-slate-700 px-2 py-0.5 rounded text-xs">Default: false</span></td>
                <td class="p-4 text-slate-400">Authorization flag for admin portal access.</td>
              </tr>

              <!-- ROOM MODEL -->
              <tr class="border-t-4 border-slate-700 hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-medium text-sky-400 align-top" rowspan="6">ROOM</td>
                <td class="p-4 font-mono text-emerald-400">id</td>
                <td class="p-4 text-slate-400">String</td>
                <td class="p-4"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required</span> <span class="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs">Unique</span></td>
                <td class="p-4 text-slate-400">Slugified URL identifier (e.g., 'executive-suite').</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">name</td>
                <td class="p-4 text-slate-400">String</td>
                <td class="p-4"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required</span></td>
                <td class="p-4 text-slate-400">Human-readable room title.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">basePrice</td>
                <td class="p-4 text-slate-400">Number</td>
                <td class="p-4"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required</span></td>
                <td class="p-4 text-slate-400">Integer/Float used internally for math calculations.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">price</td>
                <td class="p-4 text-slate-400">String</td>
                <td class="p-4">-</td>
                <td class="p-4 text-slate-400">Formatted display string (e.g., '$299').</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">amenities</td>
                <td class="p-4 text-slate-400">Array[Object]</td>
                <td class="p-4"><span class="bg-slate-700 px-2 py-0.5 rounded text-xs">[{label: String, icon: String}]</span></td>
                <td class="p-4 text-slate-400">List of features attached to the room.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">images</td>
                <td class="p-4 text-slate-400">Array[Object]</td>
                <td class="p-4"><span class="bg-slate-700 px-2 py-0.5 rounded text-xs">[{type, url, label}]</span></td>
                <td class="p-4 text-slate-400">Carousel image metadata.</td>
              </tr>

              <!-- BOOKING MODEL -->
              <tr class="border-t-4 border-slate-700 hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-medium text-sky-400 align-top" rowspan="8">BOOKING</td>
                <td class="p-4 font-mono text-emerald-400">room</td>
                <td class="p-4 text-slate-400">ObjectId</td>
                <td class="p-4"><span class="bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded text-xs">FK: Room</span> <span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required</span></td>
                <td class="p-4 text-slate-400">Reference to the reserved room.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">user</td>
                <td class="p-4 text-slate-400">ObjectId</td>
                <td class="p-4"><span class="bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded text-xs">FK: User</span></td>
                <td class="p-4 text-slate-400">Optional reference, if guest logged in.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">guestDetails</td>
                <td class="p-4 text-slate-400">Object</td>
                <td class="p-4"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required params inner</span></td>
                <td class="p-4 text-slate-400">Stores fullName, email, phone, adults, children.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">checkIn</td>
                <td class="p-4 text-slate-400">Date</td>
                <td class="p-4"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required</span></td>
                <td class="p-4 text-slate-400">Arrival UTC Date.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">checkOut</td>
                <td class="p-4 text-slate-400">Date</td>
                <td class="p-4"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Required</span></td>
                <td class="p-4 text-slate-400">Departure UTC Date.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">pricing</td>
                <td class="p-4 text-slate-400">Object</td>
                <td class="p-4">-</td>
                <td class="p-4 text-slate-400">Immutable snapshot of numbers: basePrice, nights, taxes, total.</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">status</td>
                <td class="p-4 text-slate-400">String</td>
                <td class="p-4"><span class="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-xs">Enum</span> <span class="bg-slate-700 px-2 py-0.5 rounded text-xs">Default: confirmed</span></td>
                <td class="p-4 text-slate-400">['confirmed', 'cancelled', 'completed', 'checked-in', 'checked-out'].</td>
              </tr>
              <tr class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono text-emerald-400">paymentStatus</td>
                <td class="p-4 text-slate-400">String</td>
                <td class="p-4"><span class="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-xs">Enum</span> <span class="bg-slate-700 px-2 py-0.5 rounded text-xs">Default: paid</span></td>
                <td class="p-4 text-slate-400">['paid', 'pending', 'failed'].</td>
              </tr>

            </tbody>
          </table>
        </div>
        `,
        description: "A comprehensive reference detailing all data entities, their attributes, data types, and specific constraints within the MongoDB NoSQL database."
      }
    }
  };

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: false, curve: 'basis', nodeSpacing: 60, rankSpacing: 60 },
      sequence: { useMaxWidth: false, actorMargin: 90, messageMargin: 35, boxTextMargin: 15 },
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const renderDiagram = async () => {
      setIsRendering(true);
      try {
        const categoryData = diagramsDB[activeCategory];
        if (!categoryData) return;

        const diagramObj = categoryData[activeSubCategory] || Object.values(categoryData)[0];
        
        if (activeCategory === "Data Dictionary") {
            setSvgContent(diagramObj.html || '<div class="p-10 text-slate-400">No dictionary data available.</div>');
            setIsRendering(false);
            return;
        }

        if (!diagramObj || !diagramObj.code) {
           setSvgContent('<div class="p-10 text-slate-400">Select a specific diagram from the menu (or Data Dictionary).</div>');
           setIsRendering(false);
           return;
        }

        // Allow UI to show rendering state
        await new Promise(r => setTimeout(r, 50));

        const cleanSource = diagramObj.code.trim();
        const id = 'mermaid-svg-' + Date.now();
        const renderResult = await mermaid.render(id, cleanSource);
        const svg = typeof renderResult === 'string' ? renderResult : renderResult.svg;
        setSvgContent(svg);
      } catch (e) {
        console.error("Mermaid Render error", e);
        setSvgContent(`<div class="text-rose-500 p-10">Failed to render diagram: ${e}</div>`);
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [isOpen, activeCategory, activeSubCategory]);

  if (!isOpen) return null;

  const categories = ["Architecture", "Use Cases", "Sequence Diagrams", "ER Diagram", "Admin DFDs", "Client DFDs", "Data Dictionary"];

  // Helper to get current active diagram object for the description panel
  const currentCategoryData = diagramsDB[activeCategory];
  const activeDiagram = currentCategoryData ? (currentCategoryData[activeSubCategory] || Object.values(currentCategoryData)[0]) : null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-7xl h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800/80 px-4 lg:px-6 py-3 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/20 text-sky-400 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">Developer Dashboard</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:bg-rose-500 hover:border-rose-400 transition-all rounded p-2 focus:outline-none flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider pl-1">Close Dashboard</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          
          {/* Dashboard Sidebar */}
          <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto shrink-0 flex flex-col">
             <div className="p-4 border-b border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Categories</h4>
                <div className="space-y-1">
                   {categories.map(cat => (
                     <button
                       key={cat}
                       onClick={() => {
                         setActiveCategory(cat);
                         // Reset subcategory on category change (we'll implement smart defaults later when objects are built)
                         setActiveSubCategory("");
                       }}
                       className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat ? 'bg-sky-500 text-white font-medium shadow-md shadow-sky-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
             </div>
             
             {/* Subcategories (Dynamic based on Category) */}
             {currentCategoryData && typeof currentCategoryData === 'object' && Object.keys(currentCategoryData).length > 0 && (
                <div className="p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 ml-2 border-l-2 border-slate-700 pl-2">Views</h4>
                  <div className="space-y-1 ml-2">
                     {Object.keys(currentCategoryData).map(sub => (
                       <button
                         key={sub}
                         onClick={() => setActiveSubCategory(sub)}
                         className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${activeSubCategory === sub || (activeSubCategory === "" && Object.keys(currentCategoryData)[0] === sub) ? 'bg-slate-800 text-brand-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                       >
                         {sub}
                       </button>
                     ))}
                  </div>
                </div>
             )}
          </div>

          {/* Diagram Main Viewport */}
          <div className="flex-1 relative bg-[#0f172a] flex flex-col overflow-hidden">
             
             {/* Zoom/Pan Area */}
             <div className="flex-1 relative min-h-0 border-b border-slate-800 flex items-center justify-center p-2">
                <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                
                {isRendering ? (
                    <div className="z-10 flex flex-col items-center justify-center text-sky-500 absolute inset-0">
                        <svg className="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-bold tracking-widest text-sm uppercase">Rendering View...</span>
                    </div>
                ) : (
                    <div className="w-full h-full z-10 flex flex-col">
                        {activeCategory === "Data Dictionary" ? (
                           <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full h-full overflow-y-auto" />
                        ) : (
                          <TransformWrapper initialScale={1} centerOnInit>
                              {({ resetTransform }) => (
                                  <>
                                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                                          <div className="bg-slate-800/80 backdrop-blur rounded px-3 py-2 border border-slate-700 text-xs text-slate-300 flex items-center">
                                              Scroll to Zoom &bull; Drag to Pan
                                          </div>
                                          <button onClick={() => resetTransform()} className="bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-2 border border-slate-700 font-bold text-xs transition-colors shadow-none cursor-pointer">
                                              Recenter
                                          </button>
                                      </div>
                                      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                          <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-none flex items-center justify-center" />
                                      </TransformComponent>
                                  </>
                              )}
                          </TransformWrapper>
                        )}
                    </div>
                )}
             </div>

             {/* Description Panel (Bottom) */}
             <div className="h-48 md:h-56 bg-slate-900 border-t border-slate-800 p-6 overflow-y-auto shrink-0">
               {activeDiagram && (
                 <>
                   <h3 className="text-xl font-bold text-white mb-2">{activeDiagram.title || "Description"}</h3>
                   <div className="prose prose-invert prose-slate prose-sm max-w-none text-slate-300">
                     <p>{activeDiagram.description || "No specific details provided for this view."}</p>
                   </div>
                 </>
               )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
