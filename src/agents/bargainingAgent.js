// ============================================================
// bargainingAgent.js — Step 6: Price Anchor Negotiation Protocol
//
// BARGAINING_LOGIC.md constraints active:
//   • user_target_price is the ANCHOR — negotiation starts there
//   • Sanity check: if price < 50% of provider min → "Zabardasti" warning
//   • Probability map: 40% full accept | 50% counter-offer | 10% decline
//   • Counter-offer formula: user_target_price + 250 (not a % of listed)
//   • Never auto-triggers — only fires on explicit user request
// ============================================================

// ── Interactive trigger keywords ───────────────────────────────
// These are the ONLY words that should activate bargaining.
// Checked in page.jsx WAITING_CONFIRM state, NOT on first message.
export const BARGAIN_TRIGGER_WORDS = [
  "kam karo", "kam kar", "discount", "mehenga", "sasta karo",
  "thora kam", "budget", "negotiate", "price kam", "rate kam",
  "zyada nahi", "afford nahi", "cheap", "concession", "rebate",
  "2000", "1500", "1200", "1000", "800", "500",   // inline number mentions
];

/**
 * Returns true only if the user's text contains an explicit bargaining trigger.
 * Called in WAITING_CONFIRM state ONLY — never on the initial pipeline message.
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isBargainRequest(message) {
  const lower = (message || "").toLowerCase();
  return BARGAIN_TRIGGER_WORDS.some((t) => lower.includes(t));
}

// ─────────────────────────────────────────────────────────────
// PRICE ANCHOR LOGIC
// ─────────────────────────────────────────────────────────────

/**
 * Zabardasti check — flags if the user's target is unreasonably low.
 * Threshold: < 50% of provider's base min price.
 *
 * @param {number} userTargetPrice
 * @param {number} providerMinPrice
 * @returns {{ isZabardasti: boolean, ratio: number }}
 */
export function checkZabardasti(userTargetPrice, providerMinPrice) {
  const ratio = userTargetPrice / providerMinPrice;
  return {
    isZabardasti: ratio < 0.5,
    ratio:        parseFloat(ratio.toFixed(2)),
    percentOfMin: Math.round(ratio * 100),
  };
}

/**
 * Resolves the effective anchor price for negotiation.
 * Priority: user_target_price > user-typed number in WAITING state > fallback (82% of listed).
 *
 * @param {Object} intent - From IntentAgent (has user_target_price)
 * @param {number|null} overridePrice - Price typed during WAITING_CONFIRM state
 * @param {number} providerMinPrice
 * @returns {number}
 */
function resolveAnchorPrice(intent, overridePrice, providerMinPrice) {
  if (overridePrice && overridePrice > 0)            return overridePrice;
  if (intent?.user_target_price)                     return intent.user_target_price;
  if (intent?.budget_mentioned && intent.budget_mentioned > 0) return intent.budget_mentioned;
  return Math.floor(providerMinPrice * 0.82);         // fallback: 18% below listed
}

// ─────────────────────────────────────────────────────────────
// PROVIDER RESPONSE SIMULATION — new probability map
// ─────────────────────────────────────────────────────────────

/**
 * Simulates the provider's response using the new probability map:
 *   40% — Full Accept  (price is reasonable)
 *   50% — Counter-Offer (user_target_price + 250)
 *   10% — Decline
 *
 * @param {number} anchorPrice - User's target price
 * @param {number} providerMin - Provider's listed min price
 * @param {string} providerName
 * @returns {{ outcome: string, agreedPrice: number, providerText: string, rand: number }}
 */
function simulateProviderResponse(anchorPrice, providerMin, providerName) {
  const rand = Math.random();

  // Counter-offer is anchor + 250, but capped at provider min (no point countering above listed)
  const counterPrice = Math.min(anchorPrice + 250, providerMin);

  if (rand < 0.40) {
    // ── 40%: Full Accept ──────────────────────────────────────
    return {
      outcome:      "accepted",
      agreedPrice:  anchorPrice,
      providerText: `Theek hai, aap puranay customer hain, kar deta hoon.`,
      rand,
    };
  } else if (rand < 0.90) {
    // ── 50%: Counter-Offer ────────────────────────────────────
    return {
      outcome:      "partial_accept",
      agreedPrice:  counterPrice,
      providerText: `Bhai itne mein toh kharcha bhi nahi nikalta. ${counterPrice} kar lein?`,
      rand,
    };
  } else {
    // ── 10%: Decline ──────────────────────────────────────────
    return {
      outcome:      "declined",
      agreedPrice:  providerMin,
      providerText: `Sorry bhai, mera rate fixed hai.`,
      rand,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

/**
 * Runs the full Price Anchor Negotiation Protocol.
 *
 * @param {Object}      provider      - Selected provider (has base_price_pkr)
 * @param {Object}      intent        - Structured intent (has user_target_price)
 * @param {number|null} overridePrice - Price explicitly typed during WAITING_CONFIRM
 * @returns {{ result: Object, trace: Object }}
 */
export function runBargainingAgent(provider, intent, overridePrice = null) {
  const startTime    = Date.now();
  const providerMin  = provider.base_price_pkr.min;
  const anchorPrice  = resolveAnchorPrice(intent, overridePrice, providerMin);

  // ── Zabardasti check ────────────────────────────────────────
  const { isZabardasti, ratio, percentOfMin } = checkZabardasti(anchorPrice, providerMin);

  const zabardasti_warning = isZabardasti
    ? `Bhai, yeh rate bohat kam hai. Provider shayad hi maanay, par main koshish karta hoon.`
    : null;

  // ── Build outgoing message from user to provider ────────────
  const userMessage =
    `Salaam ${provider.name}! Main aapki service lena chahta hoon — ` +
    `${provider.category} ke liye. Aapka rate PKR ${providerMin.toLocaleString()} dekha. ` +
    `Kya PKR ${anchorPrice.toLocaleString()} mein ho sakta hai? ` +
    `Main acha customer hoon — time par payment, koi jhanjhat nahi.`;

  // ── Simulate provider response ──────────────────────────────
  const { outcome, agreedPrice, providerText, rand } =
    simulateProviderResponse(anchorPrice, providerMin, provider.name);

  // ── Build transcript ────────────────────────────────────────
  const negotiation_transcript = [];

  if (zabardasti_warning) {
    negotiation_transcript.push({
      from:  "system",
      text:  `⚠️ ${zabardasti_warning}`,
      type:  "warning",
    });
  }

  negotiation_transcript.push({ from: "user",     text: userMessage });
  negotiation_transcript.push({ from: "provider", text: providerText });

  // ── Build result object ─────────────────────────────────────
  const result = {
    provider_name:           provider.name,
    provider_min_price:      providerMin,
    user_target_price:       anchorPrice,
    anchor_source:           overridePrice       ? "user_typed_in_chat"
                           : intent?.user_target_price ? "intent_extraction"
                           : intent?.budget_mentioned  ? "budget_mentioned"
                           :                             "auto_fallback_82pct",
    is_zabardasti:           isZabardasti,
    zabardasti_ratio:        ratio,
    counter_offer_price:     Math.min(anchorPrice + 250, providerMin),
    agreed_price:            agreedPrice,
    outcome,                 // "accepted" | "partial_accept" | "declined"
    negotiation_transcript,
  };

  const duration = Date.now() - startTime;

  // ── Trace — includes the mandated "User Target vs Provider Min" format ──
  const trace = {
    step:  "BARGAINING",
    agent: "BargainingAgent",
    input_summary:
      `Bargaining: User Target ${anchorPrice} vs Provider Min ${providerMin}` +
      (isZabardasti ? ` (⚠️ ZABARDASTI: ${percentOfMin}% of min)` : ""),
    output_summary:
      `Outcome: ${outcome.toUpperCase()} | Agreed: PKR ${agreedPrice.toLocaleString()}` +
      (isZabardasti ? " | Warning shown" : ""),
    tools_used: [
      "price_anchor_extractor",
      "zabardasti_check",
      "provider_response_sim",
      "negotiate_price",
    ],
    duration_ms: duration,
    reasoning: [
      `Anchor source: ${result.anchor_source}.`,
      `User target PKR ${anchorPrice.toLocaleString()} is ${percentOfMin}% of provider min (PKR ${providerMin.toLocaleString()}).`,
      isZabardasti ? `⚠️ Zabardasti threshold crossed (<50%). Warning injected into transcript.` : "Price is within reasonable range.",
      `Provider response (rand=${rand.toFixed(3)}): ${outcome}.`,
      `Probability map: 0–0.40 = accept, 0.40–0.90 = counter (+250), 0.90–1.0 = decline.`,
      outcome === "partial_accept"
        ? `Counter-offer = user_target (${anchorPrice.toLocaleString()}) + 250 = ${(anchorPrice + 250).toLocaleString()} PKR, capped at min (${providerMin.toLocaleString()}).`
        : "",
    ].filter(Boolean).join(" "),
    confidence: isZabardasti ? 0.5 : 0.85,
    crisis_mode: false,
  };

  return { result, trace };
}
