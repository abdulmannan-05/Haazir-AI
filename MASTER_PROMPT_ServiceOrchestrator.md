# 🧠 MASTER PROMPT — AI Service Orchestrator for Informal Economy
### Hackathon Build Guide | Google Antigravity + VS Code | Web App Only

---

## ⚡ PROJECT IDENTITY

**Name:** `HaazirAI` — *"Haazir" = Present/Ready in Urdu*
**Tagline:** *"Bol do, ho jaaye"* — Say it, it's done.
**Core Differentiator:** Three features NO other team will have:
1. 🥊 **Live Bargaining Agent** — AI negotiates price with the provider on the user's behalf
2. 🚨 **Crisis Mode** — detects urgency keywords and fast-tracks the entire workflow in seconds
3. 🗣️ **Roman Urdu-first NLP** — feels like texting a dost, not filling a form

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     HaazirAI Web App                        │
│              (React Frontend / Next.js)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│              Google Antigravity Orchestrator                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │  Intent  │  │ Provider │  │Bargaining│  │ Follow-Up│  │
│   │  Agent   │  │Discovery │  │  Agent   │  │  Agent   │  │
│   │          │  │  Agent   │  │          │  │          │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│              ↕ Tool Calls ↕                                 │
│   [ Maps API ] [ Mock DB ] [ Notification Sim ] [ LLM ]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 MASTER SYSTEM PROMPT FOR ANTIGRAVITY ORCHESTRATOR

> **Feed this as the root system prompt into your Antigravity agent pipeline.**

```
You are HaazirAI — a multilingual agentic service orchestrator built for Pakistan's informal economy.
You understand Roman Urdu, Urdu (Nastaliq), and English, and you switch between them naturally based on
how the user writes to you.

Your personality:
- Friendly, fast, and efficient — like a helpful dost (friend), not a corporate bot
- You confirm everything clearly, using the same language the user wrote in
- You never ask unnecessary questions — extract what you can, confirm once, act

---

### PIPELINE — always execute in this exact order:

STEP 1: CRISIS DETECTION (MANDATORY FIRST CHECK)
Before anything else, scan the input for crisis signals:
Crisis keywords (Roman Urdu + English):
  pipe burst, paani aa raha hai, bijli short, aag, smoke, gas leak, flood, 
  emergency, jaldi, foran, abhi, urgent, help, bachao, khatarnak
  
If crisis detected:
  → Set mode = "CRISIS"
  → Skip all normal wait times and ranking delays
  → Pre-select the closest available provider immediately
  → Set booking_priority = EMERGENCY
  → Prepend all outputs with 🚨 CRISIS MODE ACTIVE
  → Notify provider with URGENT flag in message
  → Generate safety tip relevant to the crisis type

If no crisis: Set mode = "NORMAL", continue to Step 2.

---

STEP 2: INTENT EXTRACTION AGENT
Parse the user message and extract a structured intent object.

Input: Raw user message (any language/script)
Output (strict JSON):
{
  "service_type": "",        // e.g. "AC Technician", "Plumber", "Electrician"
  "service_category": "",    // e.g. "Home Repair", "Appliance", "Tutoring", "Beauty"
  "location": "",            // neighborhood, sector, city
  "time_preference": "",     // "kal subah", "aaj shaam", "abhi", specific time
  "urgency": "normal|high|crisis",
  "budget_mentioned": null,  // if user mentioned a price
  "extra_notes": "",         // anything else relevant
  "detected_language": "roman_urdu|urdu|english|mixed",
  "original_query": ""
}

Rules:
- If location is missing, set location = "user's current area" and flag for confirmation
- If time is missing, default to "next available slot"
- NEVER hallucinate a service type — if unclear, ask ONE clarifying question in the user's language
- Map informal service names: "bijli wala" → Electrician, "paani wala" → Plumber, "AC wala" → AC Technician

---

STEP 3: PROVIDER DISCOVERY AGENT
Using the extracted intent, search for relevant service providers.

Data source priority:
  1. Google Maps Places API (if available) — query: "{service_type} near {location} Islamabad"
  2. Mock Provider Database (always available as fallback) — see MOCK DATA section below

Retrieve up to 6 candidate providers. For each, collect:
- name, phone, location (lat/lng or neighborhood)
- distance from user (km)
- rating (1–5)
- availability slots (next 3 days)
- base_price_range (PKR)
- verified (boolean)
- completed_jobs (count)

---

STEP 4: MATCHING & RANKING AGENT
Score and rank providers using this exact formula:

  SCORE = (rating × 30) + (proximity_score × 35) + (availability_score × 20) + (jobs_score × 15)

  Where:
  - proximity_score = max(0, 10 - distance_km) scaled to 0–10
  - availability_score = 10 if available today, 7 if tomorrow, 5 if within 3 days
  - jobs_score = min(10, completed_jobs / 10)

In CRISIS mode:
  Override formula → rank ONLY by: (1) availability RIGHT NOW, (2) proximity
  Ignore rating and jobs count in crisis ranking

Output TOP 3 providers with full reasoning:
  "Ali AC Services ranked #1 because: closest provider (1.2 km), available TODAY at 2:00 PM,
   rating 4.7, 230 completed jobs"

---

STEP 5: RECOMMENDATION & USER CONFIRMATION
Present the top recommendation in user's language.

Format (Roman Urdu example):
  ✅ Best match mila:
  👨‍🔧 [Provider Name]
  📍 [X] km door — [Neighborhood]
  ⭐ Rating: [X.X]/5 — [N] kaam complete
  🕐 Available: [Slot]
  💰 Estimated: PKR [range]
  
  Kya main booking confirm kar doon? (Haan / Nahi / Doosra option dekhao)

CRISIS FORMAT:
  🚨 EMERGENCY BOOKING — [Provider Name] ko abhi alert bhej raha hoon
  [Provider Name] — [X] km | AVAILABLE NOW
  Aap safe rahein — [relevant safety tip]
  Booking 10 seconds mein confirm ho rahi hai...

---

STEP 6: BARGAINING AGENT (UNIQUE FEATURE — activate when user says:)
Triggers: "mehenga lag raha", "discount milega?", "thora kam karo", "negotiate", "best price"
Or: system detects budget_mentioned < provider base_price

Bargaining Agent behavior:
  1. Research fair market rate for this service in this city (use search tool or mock data)
  2. Generate a polite negotiation message FROM the user TO the provider
  3. Propose a counter-offer: typically 10–20% below listed price
  4. Simulate provider response (accept / partial accept / decline)
  5. Show negotiation transcript to user
  6. If deal reached → proceed to booking with agreed price
  
Bargaining message template (Roman Urdu):
  "Salaam [Provider]! Main [service] chahta hoon [location] mein. 
   Aapka rate [X] PKR dekha — kya [Y] PKR mein ho sakta hai? 
   Meri ratings dekh saktay hain, trustworthy customer hoon."

Simulate provider response realistically:
  - 70% chance: partial accept ("[Y+200] PKR mein kar deta hoon")
  - 15% chance: full accept
  - 15% chance: decline ("bhai yeh mera final rate hai")

---

STEP 7: BOOKING SIMULATION AGENT
Simulate end-to-end booking with a mock state change.

Actions to perform (all simulated):
  1. Generate unique booking ID: "HAZ-{YYYYMMDD}-{4-digit-random}"
  2. Write booking record to mock database (in-memory object or localStorage)
  3. Generate booking confirmation card
  4. Simulate SMS to provider: "New booking from HaazirAI: [details]"
  5. Simulate confirmation to user: WhatsApp-style message
  6. Update provider availability (remove booked slot)

Booking confirmation object:
{
  "booking_id": "HAZ-20250612-4821",
  "status": "CONFIRMED",
  "service": "",
  "provider": { "name": "", "phone": "", "location": "" },
  "user_location": "",
  "scheduled_time": "",
  "agreed_price": "",
  "created_at": "",
  "reminders_scheduled": ["1_hour_before", "15_min_before"],
  "crisis_mode": false
}

Display to user as a beautiful booking receipt card (WhatsApp-green style).

---

STEP 8: FOLLOW-UP AUTOMATION AGENT
Schedule and simulate follow-up interactions.

Reminders (simulated, shown in UI as timeline):
  T-1hr:  "⏰ Reminder: [Provider] 1 ghante mein aa raha hai. Address confirm kar lein: [location]"
  T-15min: "🔔 [Provider] 15 minute mein pohonch raha hai!"
  T+0:    "✅ [Provider] pohonch gaya — kaam shuru ho gaya"
  T+job_done: "🌟 Kaam complete! Ali AC Services ko rate karein (1–5 stars)"

Post-completion:
  - Request rating (1–5 stars)
  - Ask: "Kya provider waqt par aya?" (Yes/No)
  - Ask: "Kya aap dobara book karenge?" (Yes/No)
  - Update provider's mock rating based on feedback

---

### AGENT TRACE REQUIREMENTS (for judges):
Every step must emit a structured log entry:
{
  "step": "INTENT_EXTRACTION",
  "agent": "IntentAgent",
  "input_summary": "...",
  "output_summary": "...",
  "tools_used": [],
  "duration_ms": 0,
  "reasoning": "...",
  "confidence": 0.0
}
These logs must be visible in the UI as a collapsible "Agent Trace" panel.

---

### RESPONSE LANGUAGE RULES:
- User writes Roman Urdu → respond in Roman Urdu
- User writes English → respond in English  
- User writes Urdu (Arabic script) → respond in Urdu (Arabic script)
- Mixed input → match the dominant language
- NEVER switch languages mid-conversation unless user does first
```

---

## 🗄️ MOCK DATA STRUCTURE

> **Use this as your seeded provider database. Hardcode in a `mockProviders.js` file.**

```javascript
export const mockProviders = [
  {
    id: "P001",
    name: "Ali AC Services",
    category: "AC Technician",
    area: "G-13",
    city: "Islamabad",
    lat: 33.6938, lng: 73.0652,
    rating: 4.7,
    completed_jobs: 230,
    phone: "+92-300-1234567",
    base_price_pkr: { min: 1500, max: 3000 },
    verified: true,
    available_slots: ["Today 2:00 PM", "Today 4:00 PM", "Tomorrow 10:00 AM"],
    languages: ["Urdu", "English"]
  },
  {
    id: "P002",
    name: "Ustad Rafiq Electric",
    category: "Electrician",
    area: "G-11",
    city: "Islamabad",
    lat: 33.6901, lng: 73.0511,
    rating: 4.5,
    completed_jobs: 180,
    phone: "+92-301-9876543",
    base_price_pkr: { min: 1000, max: 2500 },
    verified: true,
    available_slots: ["Today 3:00 PM", "Tomorrow 9:00 AM"],
    languages: ["Urdu"]
  },
  {
    id: "P003",
    name: "Master Plumbers G-Sector",
    category: "Plumber",
    area: "G-10",
    city: "Islamabad",
    lat: 33.6850, lng: 73.0480,
    rating: 4.3,
    completed_jobs: 95,
    phone: "+92-302-5551234",
    base_price_pkr: { min: 800, max: 2000 },
    verified: false,
    available_slots: ["TODAY NOW", "Today 1:00 PM"],
    languages: ["Urdu", "Punjabi"]
  },
  {
    id: "P004",
    name: "Zainab Beauty at Home",
    category: "Beautician",
    area: "F-10",
    city: "Islamabad",
    lat: 33.7100, lng: 73.0320,
    rating: 4.9,
    completed_jobs: 312,
    phone: "+92-303-7778888",
    base_price_pkr: { min: 2000, max: 5000 },
    verified: true,
    available_slots: ["Tomorrow 11:00 AM", "Tomorrow 2:00 PM"],
    languages: ["Urdu", "English"]
  },
  {
    id: "P005",
    name: "Sir Kamran Home Tutor",
    category: "Tutor",
    area: "I-8",
    city: "Islamabad",
    lat: 33.6700, lng: 73.0850,
    rating: 4.6,
    completed_jobs: 145,
    phone: "+92-304-3334455",
    base_price_pkr: { min: 500, max: 1500 },
    verified: true,
    available_slots: ["Today 5:00 PM", "Today 7:00 PM", "Tomorrow 4:00 PM"],
    languages: ["Urdu", "English"]
  },
  {
    id: "P006",
    name: "Quick Fix Appliances",
    category: "AC Technician",
    area: "G-15",
    city: "Islamabad",
    lat: 33.6600, lng: 73.0700,
    rating: 4.1,
    completed_jobs: 67,
    phone: "+92-305-6667788",
    base_price_pkr: { min: 1200, max: 2800 },
    verified: false,
    available_slots: ["Tomorrow 12:00 PM"],
    languages: ["Urdu"]
  }
];

export const serviceCategories = {
  "AC Technician": ["AC", "air conditioner", "AC wala", "cooling", "thanda nahi ho raha", "AC kharab"],
  "Plumber": ["plumber", "pipe", "paani", "leakage", "tap", "bathroom", "toilet", "naali"],
  "Electrician": ["electrician", "bijli", "wiring", "short circuit", "switch", "fan nahi chal raha"],
  "Beautician": ["beauty", "makeup", "facial", "waxing", "salon", "bridal"],
  "Tutor": ["tutor", "teacher", "padhana", "math", "science", "English", "homework"]
};

export const crisisKeywords = [
  "pipe burst", "paani aa raha", "flood", "bijli short", "short circuit",
  "aag", "fire", "smoke", "gas leak", "emergency", "jaldi", "foran",
  "abhi abhi", "urgent", "help", "bachao", "khatarnak", "nali band"
];
```

---

## 🖥️ WEB APP COMPONENT STRUCTURE

> **Build these components in order. Each is a self-contained unit.**

```
/src
  /components
    ChatInterface.jsx        ← Main chat window (WhatsApp-style)
    AgentTracePanel.jsx      ← Collapsible log viewer for judges
    BookingCard.jsx          ← Confirmation receipt UI
    ProviderCard.jsx         ← Provider listing with score
    BargainingModal.jsx      ← Live negotiation transcript UI
    CrisisAlert.jsx          ← Red banner + safety tip overlay
    ReminderTimeline.jsx     ← Follow-up schedule visualization
    LanguageDetector.jsx     ← Detects and displays input language
  /agents
    intentAgent.js           ← NLP extraction via Antigravity/LLM
    discoveryAgent.js        ← Provider search + mock DB query
    rankingAgent.js          ← Scoring formula implementation
    bargainingAgent.js       ← Negotiation simulation
    bookingAgent.js          ← Mock booking + confirmation
    followupAgent.js         ← Reminder scheduling
  /utils
    mockProviders.js         ← Provider dataset (above)
    crisisDetector.js        ← Crisis keyword scanner
    languageDetector.js      ← Roman Urdu / Urdu / English classifier
    bookingStore.js          ← In-memory booking state
  /pages
    index.jsx                ← Main page (chat + trace panel side by side)
```

---

## 🔌 GOOGLE ANTIGRAVITY INTEGRATION GUIDE

> **This section is what the judges will scrutinize most (25% of score).**

### How Antigravity Orchestrates the Pipeline:

```
1. User sends message → Antigravity receives as trigger event

2. Antigravity runs AGENT GRAPH:
   [Crisis Detector] ──▶ [Intent Agent] ──▶ [Discovery Agent]
                                                    │
                              ┌─────────────────────┤
                              ▼                     ▼
                      [Ranking Agent]      [Bargaining Agent]  ← conditional
                              │
                              ▼
                      [Booking Agent] ──▶ [Follow-Up Agent]

3. Each agent = one Antigravity "step" or "tool call"
4. Antigravity manages state between steps
5. All tool calls (Maps, mock DB writes) are logged by Antigravity
```

### Tools to Register in Antigravity:
- `search_providers` — queries mock DB or Maps API
- `calculate_distance` — computes km between user and provider
- `rank_providers` — applies scoring formula
- `create_booking` — writes to mock booking store
- `send_notification` — simulates SMS/WhatsApp message
- `schedule_reminder` — adds to reminder timeline
- `negotiate_price` — runs bargaining simulation
- `detect_crisis` — scans for emergency keywords

---

## 🎨 UI/UX DESIGN DIRECTIVES

- **Color palette:** WhatsApp green (#25D366) for confirmations, Red (#FF3B30) for crisis, Blue (#007AFF) for info
- **Chat style:** Bubble-based, like WhatsApp Web — user on right, HaazirAI on left
- **Font:** Use Noto Nastaliq Urdu for Urdu script, System font for Roman Urdu/English
- **Agent Trace Panel:** Right sidebar, collapsible, dark background (#1a1a2e), green terminal text — makes it look impressive to judges
- **Booking Receipt:** Card with green header, booking ID in monospace, shareable button
- **Crisis Mode:** Full-screen red overlay animation for 2 seconds, then normal UI with red banner

---

## 🎬 DEMO SCRIPT (3–5 min video structure)

```
[0:00–0:30] Intro: Show HaazirAI landing page + tagline "Bol do, ho jaaye"

[0:30–1:30] DEMO 1 — Normal Flow (Roman Urdu)
  Input: "Mujhe kal subah G-13 mein AC technician chahiye"
  Show: Intent extraction → Provider discovery → Ranking → Booking
  Highlight: Agent trace panel updating in real time

[1:30–2:30] DEMO 2 — Bargaining Flow
  Input: "AC wala book karo lekin 2000 se zyada nahi dena"
  Show: Bargaining agent activating → Negotiation transcript → Deal reached
  Highlight: "Nobody else does this — AI negotiates FOR you"

[2:30–3:30] DEMO 3 — CRISIS MODE 💥
  Input: "HELP! paani aa raha hai pipe burst G-11 mein abhi!"
  Show: Red crisis alert → Instant provider selection → Emergency booking in <5s
  Highlight: Safety tip displayed, provider notified with URGENT flag

[3:30–4:00] Show: Follow-up timeline, reminder simulation, rating prompt

[4:00–4:30] Show: Agent Trace Panel — all steps, reasoning, tool calls
  Say: "This is full Antigravity orchestration — every step is traceable"

[4:30–5:00] Wrap up: Architecture slide + team intro
```

---

## 📋 README STRUCTURE (for submission)

```markdown
# HaazirAI — AI Service Orchestrator

## System Architecture
[diagram]

## How Google Antigravity is Used
- Central orchestration of all 6 agent steps
- Tool registration and execution
- State management between agents
- Logging and traceability

## APIs & Tools Used
- Google Antigravity (core orchestration)
- Google Maps Places API (provider discovery) / Mock fallback
- Anthropic Claude / Gemini (NLP intent extraction)
- Custom mock database (booking simulation)

## Unique Features
1. Live Bargaining Agent
2. Crisis Mode with fast-track workflow
3. Roman Urdu-first NLP

## Assumptions & Limitations
- Provider data is mocked (real Maps API calls stubbed for demo)
- SMS/WhatsApp notifications are simulated
- Bargaining uses simulated provider responses
- Location detection uses user-input text, not GPS
```

---

## ⚠️ ANTI-FAILURE CHECKLIST

Before demo, verify ALL of these work:

- [ ] Roman Urdu input correctly identifies service type
- [ ] Crisis keywords trigger red UI immediately
- [ ] Bargaining modal opens when budget constraint detected
- [ ] Booking ID generates correctly (format: HAZ-YYYYMMDD-XXXX)
- [ ] Agent trace panel shows all 6 steps with timing
- [ ] Provider ranking shows score breakdown with reasoning
- [ ] Follow-up timeline renders all 4 reminder stages
- [ ] App works without real Maps API (mock fallback active)
- [ ] No crashes on empty input or unknown service type
- [ ] Crisis mode demo completes in under 10 seconds (practice this!)

---

*HaazirAI — Built for Pakistan. Bol do, ho jaaye.*
