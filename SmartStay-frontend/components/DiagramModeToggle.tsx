"use client";

import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

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
            <h4 class="text-white font-bold text-xl mb-4 text-brand-400">Level 0: The Big Picture</h4>
            <p class="mb-5 text-slate-300">This diagram demonstrates how the highest-level actors interact with the SmartStay application and external services over standard networking protocols.</p>
            <ul class="space-y-4">
                <li class="flex gap-3 text-sm text-slate-300 bg-slate-800/50 p-3 border border-slate-700 rounded-lg">
                    <strong class="text-white min-w-20">Guests:</strong> <span>Browse the React UI compiled natively via Next.js over HTTPS.</span>
                </li>
                <li class="flex gap-3 text-sm text-slate-300 bg-slate-800/50 p-3 border border-slate-700 rounded-lg">
                    <strong class="text-white min-w-20">Admins:</strong> <span>Access protected Node.js API routes requiring verified JSON Web Token (JWT) headers to mutate the database.</span>
                </li>
                <li class="flex gap-3 text-sm text-slate-300 bg-slate-800/50 p-3 border border-slate-700 rounded-lg">
                    <strong class="text-white min-w-20">Stripe:</strong> <span>Handles PCI-compliant secure payment intents and tokens. Credit Card logic physically lives on their servers, isolated from our Next.js frontend.</span>
                </li>
                <li class="flex gap-3 text-sm text-slate-300 bg-slate-800/50 p-3 border border-slate-700 rounded-lg">
                    <strong class="text-white min-w-20">NoSQL:</strong> <span>MongoDB maintains a persistent TCP multiplexed pool connection with the backend Mongoose models to stream document data without huge handshake overheads.</span>
                </li>
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
            <h4 class="text-white font-bold text-xl mb-4 text-brand-400">Secure Gateway Validation Logic</h4>
            <p class="mb-5 text-slate-300">You triggered the Authentication flow. When a user attempts to access the Admin dashboard or Login forms, the Node/Express backend doesn't just trust a cookie blindly. It rigorously verifies the signed JWT token block.</p>
            
            <div class="bg-indigo-900/40 p-5 rounded-xl border border-indigo-500/30 mb-6">
                <strong class="text-indigo-300 block mb-2 font-mono text-xs tracking-widest uppercase">Decryption Checkpoint</strong>
                <p class="text-sm text-indigo-100/80">The Node Express API parses the <code class="bg-indigo-950 px-1 rounded text-indigo-200">Authorization: Bearer</code> header and decrypts the signature using a server-side hidden secret.</p>
            </div>

            <ul class="list-none space-y-3">
                <li class="text-sm text-slate-300 flex items-start gap-2">
                    <span class="text-rose-500 mt-0.5">⊗</span> If the token has expired or the signature is tampered with, it immediately throws a 401 Error.
                </li>
                <li class="text-sm text-slate-300 flex items-start gap-2">
                    <span class="text-emerald-500 mt-0.5">⊛</span> Crucially, even if the token mathematics validate perfectly, the system queries the NoSQL cluster to ensure the user's <code class="text-brand-400">isAdmin</code> boolean flag is still true.
                </li>
                <li class="text-sm text-slate-300 flex items-start gap-2">
                    <span class="text-emerald-500 mt-0.5">⊛</span> This "double-check" halts massive privilege escalation vulnerabilities.
                </li>
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
    participant NodeAPI as Node Backend
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
    
    React->>NodeAPI: POST api bookings with pmToken String
    
    NodeAPI->>DB: Check CheckIn CheckOut Date Conflicts
    DB-->>NodeAPI: Dates Free
    
    NodeAPI->>StripeAPI: POST v1 payment intents
    
    alt Charge Succeeded
        StripeAPI-->>NodeAPI: 200 OK succeeded
        NodeAPI->>DB: save Booking status Confirmed
        NodeAPI-->>React: 201 Created
        React->>React: Router push booking confirmed
    end
        `,
        description: `
            <h4 class="text-white font-bold text-xl mb-4 text-emerald-400">PCI Compliant Credit Card Isolation</h4>
            <p class="mb-6 text-slate-300">You just triggered the <strong>E-Commerce Booking Pipeline</strong>! Our architecture guarantees PCI Data Security Standard compliance by ensuring our Next.js frontend and Node backend <em>never touch the actual card numbers</em>.</p>
            
            <div class="space-y-4">
                <div class="relative pl-6 border-l-2 border-slate-700 pb-2">
                    <span class="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                    <h5 class="font-bold text-white text-sm mb-1 uppercase tracking-wide">Phase 1: The iFrame Illusion</h5>
                    <p class="text-sm text-slate-400">When the React modal opened, the text boxes where you supposedly type credit card digits are not SmartStay HTML elements. They are tiny iframe cross-domain windows injected over the UI by Stripe. The keystrokes go straight to Stripe servers.</p>
                </div>
                <div class="relative pl-6 border-l-2 border-slate-700 pb-2 border-transparent">
                    <span class="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                    <h5 class="font-bold text-white text-sm mb-1 uppercase tracking-wide">Phase 2: Tokenization & Verification</h5>
                    <p class="text-sm text-slate-400">When you click submit, Stripe gives React a temporary identifier string (ex: pm_1Nx...). React passes this string to our Node Server. The Node server quickly checks MongoDB to ensure the dates haven't been snatched in the last 2 seconds. Finally, Node talks directly to Stripe via REST to officially charge the token!</p>
                </div>
            </div>
        `
    },
    room_filtering: {
        title: "Client-Side Hydration: Instant Room Filtering",
        code: `
sequenceDiagram
    actor User
    participant NextRouter as Next js View
    participant ReactState as React Context Array
    participant NodeAPI as API
    participant Database as Collections

    User->>NextRouter: Load Rooms Page
    NextRouter->>NodeAPI: Initial Fetch Command
    NodeAPI->>Database: mongoose .find()
    Database-->>NodeAPI: Returns Array Object
    NodeAPI-->>NextRouter: Returns JSON Payload
    NextRouter->>ReactState: Stores full array in memory
    
    note over User, ReactState: All further filtering happens instantly in browser RAM!
    
    User->>ReactState: Clicks "Suites" Filter Box
    ReactState->>ReactState: Compute array.filter() logic
    ReactState->>NextRouter: Trigger DOM re-render event
    NextRouter-->>User: Screen instantly shrinks to target objects
        `,
        description: `
            <h4 class="text-white font-bold text-xl mb-4 text-sky-400">Lightning Fast Client-Side Interpolation</h4>
            <p class="mb-5 text-slate-300">You just interacted with the Room List or Navigation bar! SmartStay optimizes perceived performance by relying heavily on client-side RAM filtering.</p>
            
            <div class="bg-slate-800/80 p-5 rounded-lg border border-slate-700 mb-6">
                <strong class="text-white block mb-2">The Fetch-Once Principle</strong>
                <p class="text-sm text-slate-400 mb-3">Instead of firing a heavy TCP network request <em>every single time</em> a user clicks a checkbox or searches for a term, the Next.js <code class="px-1 bg-slate-800 text-brand-300 rounded">useEffect</code> hook requests the entire catalogue of active rooms as a JSON Array immediately upon initial route load.</p>
                <p class="text-sm text-slate-400">That payload is saved physically into the browser's memory via a React <code class="bg-slate-900 px-[4px] rounded text-emerald-300">useState()</code> array variable.</p>
            </div>

            <ul class="list-none space-y-2 text-sm text-slate-300">
                <li class="flex items-center gap-2">➔ When navigating or sorting, the application runs a vanilla JavaScript <code class="font-mono text-cyan-400 bg-slate-800 px-1 rounded">.filter()</code> loop over the objects in RAM.</li>
                <li class="flex items-center gap-2">➔ React reconciler detects the array mutation and triggers an instant Virtual DOM tree redraw.</li>
                <li class="flex items-center gap-2">➔ The result is zero spinning buffering icons during basic exploratory filtering!</li>
            </ul>
        `
    }
};

export default function DiagramModeToggle() {
    const [isActive, setIsActive] = useState(false);
    const [activeDiagramKey, setActiveDiagramKey] = useState<string | null>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [isRendering, setIsRendering] = useState(false);

    // Sync isActive state with a global custom event emitted by the Navbar
    useEffect(() => {
        const handleToggle = (e: any) => {
            setIsActive(e.detail.isActive);
            if (!e.detail.isActive) {
                setActiveDiagramKey(null);
                setSvgContent('');
            }
        };
        window.addEventListener('diagramModeToggle', handleToggle);
        return () => window.removeEventListener('diagramModeToggle', handleToggle);
    }, []);

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
        if (!isActive) return;

        const handleClick = (e: MouseEvent) => {
            // Traverse up looking for keywords
            let target = e.target as HTMLElement | null;
            let text = "";
            let href = "";
            let cssClasses = "";

            for (let i = 0; i < 4 && target && target !== document.body; i++) {
                if (target.innerText) text += target.innerText.toLowerCase() + " ";
                if (target.getAttribute('href')) href = target.getAttribute('href')!.toLowerCase();
                if (target.className && typeof target.className === 'string') cssClasses += target.className.toLowerCase() + " ";
                target = target.parentElement;
            }

            let matchedDiagram = null;

            if (text.includes("book") || text.includes("checkout") || text.includes("pay")) {
                matchedDiagram = 'stripe_checkout';
            } else if (text.includes("admin") || href.includes("admin") || text.includes("login") || text.includes("sign")) {
                matchedDiagram = 'auth_flow';
            } else if (text.includes("room") || cssClasses.includes("filter") || href.includes("rooms")) {
                matchedDiagram = 'room_filtering';
            }

            if (matchedDiagram) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                setActiveDiagramKey(matchedDiagram);
            }
        };

        // Hook onto capture phase to intercept BEFORE react synthetic events fire
        window.addEventListener('click', handleClick, true);

        return () => {
            window.removeEventListener('click', handleClick, true);
        };
    }, [isActive]);

    useEffect(() => {
        if (!activeDiagramKey) return;

        setIsRendering(true);
        const renderDiagram = async () => {
            try {
                const diagramObj = diagramsDB[activeDiagramKey as keyof typeof diagramsDB];
                if (!diagramObj) return;

                // Allow UI to show rendering state
                await new Promise(r => setTimeout(r, 50));

                const cleanSource = diagramObj.code.trim();
                const id = 'mermaid-svg-' + Date.now();
                const renderResult = await mermaid.render(id, cleanSource);
                const svg = typeof renderResult === 'string' ? renderResult : renderResult.svg;
                setSvgContent(svg);
            } catch (e) {
                console.error("Mermaid Render error", e);
                setSvgContent(`<div class="text-rose-500">Failed to render diagram: ${e}</div>`);
            } finally {
                setIsRendering(false);
            }
        };

        renderDiagram();
    }, [activeDiagramKey]);

    const activeDiagram = activeDiagramKey ? diagramsDB[activeDiagramKey as keyof typeof diagramsDB] : null;

    return (
        <>
            {/* The Master Catalog Button (Only visible if mode is ON) */}
            {isActive && !activeDiagramKey && (
                <div className="fixed inset-x-0 bottom-6 z-[99998] flex justify-center pointer-events-none">
                    <button
                        onClick={() => setActiveDiagramKey('arch_overview')}
                        className="bg-sky-500/90 text-white hover:bg-sky-400 border border-sky-400 px-6 py-3 rounded-full font-bold shadow-xl backdrop-blur flex items-center gap-2 pointer-events-auto transition-transform hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                        Master Block Diagram
                    </button>
                </div>
            )}

            {/* Reused Sandbox Modal Overlay inside React */}
            {activeDiagramKey && activeDiagram && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm"
                        onClick={() => {
                            setActiveDiagramKey(null);
                            setSvgContent('');
                        }}
                    ></div>

                    {/* Modal Panel */}
                    <div className="relative z-10 w-full max-w-7xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

                        {/* Header */}
                        <div className="bg-slate-800/80 px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10 shrink-0 overflow-hidden">
                            <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                                <div className="bg-sky-500/20 text-sky-400 p-1.5 lg:p-2 rounded-lg shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 lg:w-6 lg:h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg lg:text-2xl font-bold text-white tracking-wide truncate">{activeDiagram.title}</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveDiagramKey(null);
                                    setSvgContent('');
                                }}
                                className="text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:bg-rose-500 hover:border-rose-400 transition-all rounded p-2 focus:outline-none flex items-center gap-2"
                            >
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider pl-1">Close Trigger</span>
                                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body Splits Diagram & Explanation */}
                        <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row">
                            {/* Diagram Viewport Area */}
                            <div className="lg:w-2/3 h-[45vh] lg:h-full shrink-0 relative bg-[#0f172a] border-b lg:border-b-0 lg:border-r border-slate-800 flex items-center justify-center p-2 lg:p-4">
                                <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

                                {isRendering ? (
                                    <div className="z-10 flex flex-col items-center justify-center text-sky-500">
                                        <svg className="animate-spin h-12 w-12 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="font-bold tracking-widest uppercase">Rendering Vector Node Map...</span>
                                    </div>
                                ) : (
                                    <div className="w-full h-full z-10">
                                        <TransformWrapper initialScale={1} centerOnInit>
                                            {({ zoomIn, zoomOut, resetTransform }) => (
                                                <>
                                                    <div className="absolute bottom-4 left-4 z-20 bg-slate-800/80 backdrop-blur rounded px-3 py-1.5 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
                                                        Scroll to Zoom &bull; Drag to Pan
                                                    </div>
                                                    <button onClick={() => resetTransform()} className="absolute bottom-4 right-4 z-20 bg-sky-500 hover:bg-sky-400 text-white rounded px-4 py-2 font-bold text-sm transition-colors shadow-lg shadow-sky-500/20">
                                                        Recenter View
                                                    </button>
                                                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                        <div
                                                            dangerouslySetInnerHTML={{ __html: svgContent }}
                                                            className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-none"
                                                        />
                                                    </TransformComponent>
                                                </>
                                            )}
                                        </TransformWrapper>
                                    </div>
                                )}
                            </div>

                            {/* Explainer Sidebar */}
                            <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-900">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
                                    <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <span className="animate-pulse w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                        Native Intercept Explainer
                                    </span>
                                </div>
                                <div
                                    className="prose prose-invert prose-slate prose-img:rounded-xl text-base leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: activeDiagram.description }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
