# ORCHESTRATOR_SKILL.md
## HaazirAI — Interactive Control Constraints
### Last Updated: 2026-05-12 | Status: ACTIVE

---

## Purpose

This file defines the mandatory interactive constraints for the HaazirAI pipeline orchestrator.
These constraints override any default autonomous behaviour and must be respected across all future development.

---

## CONSTRAINT 1 — No Auto-Initialization

- The pipeline starts in **IDLE** state on page load
- No `useEffect` hooks may trigger pipeline steps automatically
- No mock-simulation loops on mount
- `bookingStore.resetStore()` is called on mount to guarantee a clean slate
- Agent Trace starts at **0 steps logged**

```js
// ✅ Allowed
useEffect(() => { resetStore(); }, []); // cleanup only

// ❌ Forbidden
useEffect(() => { runPipeline(mockMessage); }, []); // auto-start
```

---

## CONSTRAINT 2 — User-Driven Entry Point

- **Step 1 (Crisis Detection)** fires ONLY when the user manually sends a message via the chat input
- The `handleSend` function is the SOLE entry point for the pipeline
- No programmatic calls to `runPipeline()` may occur without a real user message

**Pipeline State Machine:**
```
IDLE → (user sends message) → RUNNING → WAITING_CONFIRM → BOOKING → COMPLETE
                                                   ↕
                                           (bargaining modal)
```

---

## CONSTRAINT 3 — Mandatory Step-5 Breakpoint

After Step 5 (Recommendation), the pipeline **MUST** transition to `WAITING_CONFIRM` state.

- A `ConfirmationPrompt` component is shown in the chat
- The pipeline will NOT advance to Step 7 (Booking) until the user does ONE of:
  - Types: `"Haan"`, `"Confirm"`, `"Yes"`, `"Theek hai"`, `"Ok"`, `"Book karo"`, `"Zaroor"`, `"Bilkul"`
  - Types a number: `"1"`, `"2"`, `"3"` (selects ranked provider by index)
  - Clicks a provider button in `ConfirmationPrompt`
- The pipeline cancels cleanly if user types: `"Nahi"`, `"No"`, `"Cancel"`, `"Ruk"`

**Exception — CRITICAL crisis severity:**
If `crisisReport.severity === "critical"` (fire, gas leak, flood), auto-booking is permitted
because waiting could risk life safety. This is the only allowed autopilot exception.

---

## CONSTRAINT 4 — Manual Bargaining Only

- `BargainingAgent` MUST NEVER trigger automatically
- It fires ONLY when the user explicitly expresses a budget concern, either by:
  - Typing one of these words in the chat while in `WAITING_CONFIRM` state:
    `"mehenga"`, `"discount"`, `"thora kam"`, `"negotiate"`, `"sasta"`, `"zyada nahi"`, `"budget"`, `"kam karo"`
  - Clicking the `"Price Bargain Karo"` button inside `ConfirmationPrompt`
- Calling `shouldTriggerBargaining()` as a check on the INITIAL user message is forbidden

```js
// ✅ Allowed — user explicitly asks for bargain
if (BARGAIN_WORDS.some(w => lower.includes(w))) { runBargainingAgent(...) }

// ❌ Forbidden — auto-check on first message
if (shouldTriggerBargaining(text, budget, provider)) { runBargainingAgent(...) }
```

---

## CONSTRAINT 5 — Event-Based Follow-Up Timeline

All follow-up milestones are strictly user-driven:

| Step | ID  | Method          | Initial Status |
|------|-----|-----------------|----------------|
| T-1hr Reminder     | R1 | Simulated SMS (no action needed) | `scheduled` |
| T-15min Reminder   | R2 | Simulated SMS (no action needed) | `scheduled` |
| Provider Arrival   | R3 | **User clicks "Confirm Arrival"** | `pending` |
| Job Complete       | R4 | **User clicks "Mark as Done"**   | `pending` (locked until R3 done) |

- **No `setTimeout`** may be used to automatically advance R3 or R4
- **No `setInterval`** for polling or auto-status updates
- R4's button is **disabled** (🔒) until R3 is confirmed
- After R4 is confirmed, a star-rating prompt appears

```js
// ✅ Allowed
const [confirmed, setConfirmed] = useState({});
const handleConfirm = (step) => setConfirmed(prev => ({ ...prev, [step.id]: true }));

// ❌ Forbidden
setTimeout(() => setStatus("confirmed"), 5000); // auto-advance
```

---

## CONSTRAINT 6 — State & Trace Reset

A **↺ Reset** button in the header must:
1. Call `resetStore()` — clears all bookings and reminders from memory
2. Clear `messages` state → `[]`
3. Clear `traces` state → `[]` (Agent Trace shows "0 steps logged")
4. Set `pipelineState` → `IDLE`
5. Clear `pendingCtx`, `crisisActive`, `bargainResult`

The reset must be achievable without a page refresh.

---

## Pipeline State Reference

| State              | Description                                       | Input accepted? |
|--------------------|---------------------------------------------------|-----------------|
| `IDLE`             | App ready, no pipeline active                    | ✅ Yes           |
| `RUNNING`          | Steps 1–5 executing                              | ❌ Blocked       |
| `WAITING_CONFIRM`  | Paused at Step 5 — awaiting user choice          | ✅ Yes (interpreted as confirmation/bargain/cancel) |
| `BOOKING`          | Steps 7–8 executing                              | ❌ Blocked       |
| `COMPLETE`         | Booking done — user can start a new request      | ✅ Yes (new pipeline) |

---

*HaazirAI — Bol do, ho jaaye. (But only when YOU say so.)*
