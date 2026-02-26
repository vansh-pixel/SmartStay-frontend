// Setup initial mermaid configuration matching previous setup
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    flowchart: { useMaxWidth: false, curve: 'basis', nodeSpacing: 60, rankSpacing: 60 },
    sequence: { useMaxWidth: false, actorMargin: 90, messageMargin: 35, boxTextMargin: 15 },
    er: { useMaxWidth: false, entityPadding: 25 },
    state: { useMaxWidth: false }
});

// The master database of diagrams and explanations
const diagramsDB = {
    arch_overview: {
        title: "System Context Architecture",
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
        description: `
            <h4 class="text-white font-bold text-lg mb-4">Level 0: The Big Picture</h4>
            <p class="mb-4">This diagram demonstrates how the highest-level actors interact with the SmartStay application and external services over standard networking protocols.</p>
            <ul class="list-disc pl-5 space-y-2 text-slate-300">
                <li><strong>Guests</strong> browse the React UI rendered via Next.js over HTTPS.</li>
                <li><strong>Admins</strong> access protected routes requiring JWT authentication headers to mutate object states.</li>
                <li><strong>SmartStay</strong> acts as the central hub, acting as an intermediary to hide sensitive external connections.</li>
                <li><strong>Stripe</strong> handles PCI-compliant secure payment intents.</li>
                <li><strong>MongoDB</strong> maintains a persistent TCP-bound pool connection with the backend Mongoose models to stream document data.</li>
            </ul>
        `
    },
    
    auth_flow: {
        title: "Admin Security Gateway & Login",
        code: `
sequenceDiagram
    autonumber
    actor User
    participant Next as Protected logic
    participant JWT as jsonwebtoken map
    participant DB as MongoDB Auth
    participant AdminAPI as api admin routes

    User->>Next: Clicks Admin Nav
    Next->>AdminAPI: GET endpoint with target Auth header

    AdminAPI->>JWT: Execute lock map function
    JWT->>JWT: Math Validation verify token format

    alt Secret is Wrong or Expired value
        JWT-->>Next: 401 Unauthorized Flag
        Next-->>User: NextRouter send login page
    else Signature Matches Key
        JWT->>DB: Decoded Object parse
        DB->>DB: search isAdmin filter object
        alt user isAdmin is false
            DB-->>AdminAPI: 403 Forbidden
            AdminAPI-->>Next: Reject Response
            Next-->>User: Render Error Banner UI
        else user isAdmin is true value
            DB->>AdminAPI: Assign var data
            AdminAPI->>AdminAPI: Authorize network route
            AdminAPI-->>Next: Send 200 payload Object
            Next-->>User: Allow Render Screen Charts
        end
    end
        `,
        description: `
            <h4 class="text-white font-bold text-lg mb-4">Secure Gateway Logic</h4>
            <p class="mb-4">When a user attempts to access the Admin dashboard, the system doesn't just trust the cookie. It rigorously verifies the signed JWT token block.</p>
            <ul class="list-disc pl-5 space-y-2 text-slate-300">
                <li>The API parses the Authorization header and decrypts the signature using a server-side hidden secret.</li>
                <li>If the token has expired, it immediately fails.</li>
                <li>Crucially, even if the token is valid, the system queries MongoDB to ensure the <code class="text-brand-400">isAdmin</code> boolean flag is still <code class="text-emerald-400">true</code>, preventing privilege escalation.</li>
            </ul>
        `
    },

    stripe_checkout: {
        title: "Secure Stripe Flow (PCI Compliant)",
        code: `
sequenceDiagram
    autonumber
    actor Guest
    participant React as User Browser
    participant StripeElements as Stripe iFrame
    participant ExpressAPI as Node Backend
    participant DB as MongoDB
    participant StripeAPI as Stripe Core

    Guest->>React: Types Card string into Form Input
    note over React: Input is actually an isolated iFrame from Stripe
    React->>StripeElements: Local Javascript Injection
    
    Guest->>React: Clicks Confirm Booking button
    
    React->>StripeElements: Trigger createPaymentMethod
    StripeElements->>StripeAPI: Encrypted Transmission of Card Digits
    StripeAPI-->>StripeElements: Returns pmToken String
    StripeElements-->>React: PaymentMethod ID
    
    note over Guest, React: SmartStay NEVER sees actual credit card numbers.
    
    React->>ExpressAPI: POST api bookings with pmToken String
    
    ExpressAPI->>DB: Check CheckIn CheckOut Date Conflicts
    DB-->>ExpressAPI: Dates Free
    
    ExpressAPI->>StripeAPI: POST v1 payment intents
    
    alt Charge Succeeded
        StripeAPI-->>ExpressAPI: 200 OK succeeded
        ExpressAPI->>DB: save Booking status Confirmed
        ExpressAPI-->>React: 201 Created
        React->>React: Router push booking confirmed
    end
        `,
        description: `
            <h4 class="text-white font-bold text-lg mb-4">Complete Isolation of Credit Cards</h4>
            <p class="mb-4">When a user clicks "Book Now", we never touch their actual card numbers. This logic guarantees extreme security.</p>
            
            <div class="space-y-4">
                <div class="relative pl-6 border-l-2 border-slate-700 pb-2">
                    <span class="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_#38bdf8]"></span>
                    <h5 class="font-bold text-white text-sm mb-1">Step 1: The iFrame Illusion</h5>
                    <p class="text-sm text-slate-400">The text boxes where users type their card are actually tiny iFrames injected by the Stripe Elements library. They belong directly to Stripe's remote servers.</p>
                </div>
                <div class="relative pl-6 border-l-2 border-slate-700 pb-2 border-transparent">
                    <span class="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_#38bdf8]"></span>
                    <h5 class="font-bold text-white text-sm mb-1">Step 2: Backend Verification</h5>
                    <p class="text-sm text-slate-400">Our Node.js server takes the secure token, verifies MongoDB to ensure no date conflicts happened in the last 5 seconds, and then asks Stripe's API to officially charge the account.</p>
                </div>
            </div>
        `
    },
    
    booking_lifecycle: {
        title: "State Machine: Booking Lifecycle",
        code: `
stateDiagram-v2
    direction TB
    [*] --> PENDING_PAYMENT : Step 1 Add Cart
    
    PENDING_PAYMENT --> FAILED_DECLINED : Stripe Failed
    PENDING_PAYMENT --> CONFIRMED_SECURE : Success Block
    
    CONFIRMED_SECURE --> USER_CANCELLED : User deletes Doc
    CONFIRMED_SECURE --> CHECKED_IN : Admin manual Override
    
    CHECKED_IN --> CHECKED_OUT : Admin updates string
    
    FAILED_DECLINED --> [*]
    USER_CANCELLED --> [*]
    CHECKED_OUT --> [*]
        `,
        description: `
            <h4 class="text-white font-bold text-lg mb-4">The Status Mutator Logic</h4>
            <p class="mb-4">From the moment an ID is pushed to the database, a booking document exists in one of strict predefined states governed by enum validation in the MongoDB Schema.</p>
            
            <p class="text-slate-300 text-sm mb-4">Through the Admin Dashboard, the backend exposes RESTful <code class="text-brand-400">PUT</code> endpoints allowing personnel to manually force-override the sequence (e.g., clicking <strong>Force Check-In</strong> immediately mutates the string from <code class="text-emerald-400">"Confirmed"</code> to <code class="text-sky-400">"Checked In"</code>.</p>
        `
    },

    room_filtering: {
        title: "Memory vs DB: Room Filtering",
        code: `
sequenceDiagram
    actor User
    participant NextRouter as Next js View
    participant ReactState as React Context Array
    participant Express as API
    participant Database as Collections

    User->>NextRouter: Load Rooms Page
    NextRouter->>Express: Initial Fetch Command
    Express->>Database: mongoose .find()
    Database-->>Express: Returns Array Object
    Express-->>NextRouter: Returns JSON Payload
    NextRouter->>ReactState: Stores full array in memory
    
    note over User, ReactState: All further filtering happens instantly in browser RAM!
    
    User->>ReactState: Clicks "Suites" Filter Box
    ReactState->>ReactState: Compute array.filter() logic
    ReactState->>NextRouter: Trigger DOM re-render event
    NextRouter-->>User: Screen instantly shrinks to Suites
        `,
        description: `
            <h4 class="text-white font-bold text-lg mb-4">Client-Side Hydration & Filtering</h4>
            <p class="mb-4">SmartStay optimizes performance by relying heavily on client-side RAM interpolation rather than firing a new network request on every tiny checkbox click.</p>
            <ul class="list-disc pl-5 space-y-2 text-slate-300">
                <li><strong>The Initial Load:</strong> When the page opens, it fetches the complete catalog of rooms as a JSON array and stores it in React state variables natively.</li>
                <li><strong>Instant Feedback:</strong> Clicking <em>All</em>, <em>Suites</em>, or changing the slider instantly evaluates a JavaScript <code class="px-1 bg-slate-800 text-brand-300 rounded">.filter()</code> function matching against properties of the objects sitting in memory.</li>
                <li>This ensures zero loading spinners when a guest evaluates their choices.</li>
            </ul>
        `
    },

    event_hall_validation: {
        title: "Event Hall Date Collision Validation",
        code: `
sequenceDiagram
    actor Booker
    participant UI as Event Booking Modal
    participant Backend as Event Controller
    participant Model as Schema Config

    Booker->>UI: Selects Conference Hall string
    Booker->>UI: Click Submit Post Button
    
    UI->>Backend: POST api events route execution
    
    Backend->>Model: Validate eventDate threshold
    alt Past Date Selected
        Model-->>Backend: Throw Error
        Backend-->>UI: 400 Bad Request
    else Date Valid
        Backend->>Model: Query existing Event
        Model-->>Backend: Array Data return
        
        alt Array Not Empty Space taken
            Backend-->>UI: 400 Conflict taken
        else Array Empty Slots clear
            Backend->>Backend: Calculate Math Add Taxes
            Backend->>Model: save new target Document
            Model-->>Backend: Save Execution Success
            Backend-->>UI: 201 Created Success
        end
    end
        `,
        description: `
            <h4 class="text-white font-bold text-lg mb-4">Event Booking Logic Control</h4>
            <p class="mb-4">Unlike Room Bookings which can span multiple days and overlap, Event Halls are strictly booked for a single discrete day.</p>
            <p class="text-slate-300 text-sm">When the user selects <code class="text-brand-400">Reserve Hall</code>, the Node controller explicitly searches the DB for any records matching that specific <code class="text-emerald-400">eventDate</code> and <code class="text-emerald-400">hallObjectId</code>. If the array length > 0, the Node transaction halts and aborts the Stripe charge.</p>
        `
    },

    admin_stats_gen: {
        title: "Admin Analytics Pipeline Aggregation",
        code: `
sequenceDiagram
    actor AdminBrowser
    participant API as Node js CodeBlock
    participant Mongo as NoSQL Logic

    AdminBrowser->>API: Next Mount Load Event
    
    par Async Promises Block
        API->>Mongo: COUNT User Size
        API->>Mongo: COUNT Room Size
        API->>Mongo: AGGREGATE Revenue Accumulator
        API->>Mongo: AGGREGATE Date Accumulator
    end
    
    Mongo-->>API: Resolves Integer map sets
    
    API->>API: Compute var addition limit
    API->>API: Compute target structure
    
    API-->>AdminBrowser: Output complete Object
    AdminBrowser->>AdminBrowser: Generate Recharts Array map
        `,
        description: `
            <h4 class="text-white font-bold text-lg mb-4">Parallel Promise Execution</h4>
            <p class="mb-4">The Admin Dashboard performs heavy statistical analysis by running multiple concurrent MongoDB aggregate pipelines.</p>
            <p class="text-slate-300 text-sm">Instead of awaiting each query sequentially (which creates a massive waterfall delay), the controller uses <code class="text-brand-400 bg-slate-800 px-1 rounded">Promise.all()</code> to fire all statistical queries simultaneously, drastically reducing TTFB (Time To First Byte).</p>
        `
    },

    admin_manual_update: {
        title: "Admin Manual Status Mutations",
        code: `
sequenceDiagram
    actor Admin_UI
    participant FrontReact as View Layer
    participant API as Backend Route Logic
    participant DB as NoSQL DB

    Admin_UI->>FrontReact: Adjust UI String Dropdown
    FrontReact->>API: Call PUT target var JSON Object
    
    API->>DB: query ID mutate Object Map
    
    alt Target Destroyed Overwritten
        DB-->>API: returns null catch Math
        API-->>FrontReact: 404 Output error payload
    else Valid Mutation Found
        DB->>DB: Save object
        DB-->>API: returns Output Promise
        API-->>FrontReact: 200 OK Target String
        FrontReact->>FrontReact: Filter local list match update Row flash string
    end
        `,
        description: `
            <h4 class="text-white font-bold text-lg mb-4">Optimistic UI Updates</h4>
            <p class="mb-4">When an Admin rapidly updates the status of a booking to Keep queues moving, they expect instant feedback.</p>
            <p class="text-slate-300 text-sm">When the User clicks "Force Check-In", a <code class="text-brand-400">PUT</code> request fires off asynchronously. On a 200 OK return, the React frontend instantly mutates the specific object string in its local array list state object and the row component changes colors, avoiding a full page refresh.</p>
        `
    }
};

// Alpine.js Application State
function appData() {
    return {
        currentView: 'home',
        modalOpen: false,
        panZoomInst: null,
        activeDiagram: { id: '', title: '', code: '', description: '' },
        
        async openDiagram(key) {
            // Fallback to arch overview if key doesn't exist yet in the demo
            const diagramObj = diagramsDB[key] || diagramsDB['arch_overview'];
            
            this.activeDiagram = { ...diagramObj, id: key };
            this.modalOpen = true;
            this.destroyPanZoom();
            
            // Render Mermaid to text string
            const container = document.getElementById('mermaid-render-target');
            container.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-brand-500 animate-pulse font-medium text-lg tracking-widest uppercase">Rendering Vector Node Map...</div>';

            // wait for Alpine to make modal visible
            await this.$nextTick(); 
            
            try {
                // Short wait to ensure transition animation unblocks main thread
                await new Promise(r => setTimeout(r, 100)); 
                
                const cleanSource = this.activeDiagram.code.trim();
                // Support v9 (string return) or v10+ (object return)
                const renderResult = await mermaid.render('injected-graph-' + Date.now(), cleanSource);
                const svg = typeof renderResult === 'string' ? renderResult : renderResult.svg;
                
                // Inject into DOM
                container.innerHTML = svg;
                const svgElement = container.querySelector('svg');
                
                if (svgElement) {
                    svgElement.style.width = '100%';
                    svgElement.style.height = '100%';
                    
                    // Initialize zoom controls
                    this.panZoomInst = svgPanZoom(svgElement, {
                        zoomEnabled: true,
                        controlIconsEnabled: false,
                        fit: true,
                        center: true,
                        minZoom: 0.1,
                        maxZoom: 30,
                        zoomScaleSensitivity: 0.3
                    });
                }
            } catch (e) {
                 console.error("Render error", e);
                 container.innerHTML = `<div class="text-rose-500 text-center font-bold">Failed to compile diagram.<br><span class="text-xs font-mono font-normal">${e}</span></div>`;
            }
        },
        
        closeModal() {
            this.modalOpen = false;
            this.destroyPanZoom();
        },
        
        destroyPanZoom() {
            if (this.panZoomInst) {
                this.panZoomInst.destroy();
                this.panZoomInst = null;
            }
            const container = document.getElementById('mermaid-render-target');
            if(container) container.innerHTML = '';
        },
        
        resetPanZoom() {
            if (this.panZoomInst) {
                this.panZoomInst.resetZoom();
                this.panZoomInst.center();
                this.panZoomInst.fit();
            }
        }
    }
}
