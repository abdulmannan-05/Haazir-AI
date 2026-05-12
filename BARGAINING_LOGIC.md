# BARGAINING_LOGIC.md
## HaazirAI — Price Anchor Negotiation Protocol
### Status: ACTIVE

---

## 1. Core Philosophy: Anchor-Based Negotiation

The Bargaining Agent upgrades the negotiation from a generic percentage discount to an **Anchor-Based Negotiation Protocol**. Instead of proposing arbitrary counter-offers, the agent strictly uses the user's explicitly stated target price (`user_target_price`) as the starting anchor for all discussions with the provider.

---

## 2. Intent Extraction & Price Capture (Step 2)

During Step 2 (Intent Extraction), the system actively parses the user's message for explicit target prices using specific Regex patterns for Roman Urdu and English context.
- **Mandatory Field:** `user_target_price` is captured if the user mentions specific phrases (e.g., `"1500 mein karlo"`, `"budget 1200"`, `"sirf 800 hai"`).
- If no specific anchor is provided, the system falls back gracefully to a loose budget mention or an automated default starting point.

---

## 3. Sanity Check Logic: The "Zabardasti" Check

Before sending the offer to the provider, the agent performs a mandatory plausibility check against the provider's base minimum rate.

- **Condition:** If the user's target price is **lower than 50%** of the provider's `min_price`.
- **Mandatory Agent Response:** 
  > *"Bhai, yeh rate bohat kam hai. Provider shayad hi maanay, par main koshish karta hoon."*

This response sets realistic expectations for the user while still acting as their advocate.

---

## 4. Provider Response Simulation (Probability Map)

The provider's response is simulated based on a strict probability distribution to reflect realistic informal market behavior:

### Full Accept (40% Probability)
If the price is accepted, the provider agrees directly without further negotiation:
- **Response:** `"Theek hai, aap puranay customer hain, kar deta hoon."`

### Counter-Offer (50% Probability)
If the provider feels the rate is too low but wants the job, they propose a middle ground based strictly on the user's anchor:
- **Formula:** `User_Price + 250`
- **Response:** `"Bhai itne mein toh kharcha bhi nahi nikalta. [User_Price + 250] kar lein?"`

### Decline (10% Probability)
The provider refuses to lower their rates further:
- **Response:** `"Sorry bhai, mera rate fixed hai."`

---

## 5. Interactive Trigger Constraints

- **Never bargain automatically.**
- If a user selects a provider during the Recommendation stage (Step 5), the Bargaining Agent is **only** triggered if the user explicitly requests it via chat using keywords like:
  - `"kam karo"`
  - `"discount"`
  - `"budget [number]"`
- Automatic invocation during initial pipeline routing is strictly disabled.

---

## 6. UI Feedback & Trace Formatting

To ensure complete transparency in the orchestration panel, the agent must output a strictly formatted string in the **Agent Trace**:

```text
Bargaining: User Target [X] vs Provider Min [Y]
```

Where `[X]` is the user's target anchor price and `[Y]` is the provider's minimum base price.
