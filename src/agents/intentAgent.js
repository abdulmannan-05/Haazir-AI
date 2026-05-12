// ============================================================
// intentAgent.js — Step 2: Parse raw message → structured intent
//
// UPGRADE: Added mandatory `user_target_price` field.
// Distinct from `budget_mentioned` — this is the explicit
// anchor price the user wants to pay (e.g. "1500 mein karlo").
// ============================================================

import { serviceCategories } from "@/utils/mockProviders";
import { detectLanguage } from "@/utils/languageDetector";

// ── Price extraction patterns ──────────────────────────────────
// Captures explicit target price expressions like:
//   "1500 mein karlo", "2000 se zyada nahi", "budget 1200",
//   "1,500 PKR mein", "sirf 800 hai mere paas"

const TARGET_PRICE_PATTERNS = [
  // "1500 mein karlo / kar do / chahiye"
  /(\d[\d,]+)\s*(?:pkr|rs|rupees?|rupay?)?\s*(?:mein|mai|me)\s*(?:karlo?|kar do|kar dena|chahiye|ho sakta|hoga)/i,
  // "budget 1500" or "budget hai 1500"
  /budget\s*(?:hai|sirf|only|ka)?\s*(\d[\d,]+)/i,
  // "sirf 1200 hai" / "bas 1500 hai"
  /(?:sirf|bas|only)\s*(\d[\d,]+)/i,
  // "2000 se zyada nahi" / "2000 se upar nahi"
  /(\d[\d,]+)\s*(?:pkr|rs)?\s*se\s*(?:zyada|upar|bada)\s*nahi/i,
  // "max 1500" / "maximum 2000"
  /(?:max|maximum|upto|up to)\s*(?:pkr|rs)?\s*(\d[\d,]+)/i,
  // "1500 budget" (number then budget)
  /(\d[\d,]+)\s*(?:pkr|rs)?\s*budget/i,
];

/**
 * Extracts explicit user target price from message.
 * Returns the first matched number, or null.
 * @param {string} message
 * @returns {number|null}
 */
function extractUserTargetPrice(message) {
  for (const pattern of TARGET_PRICE_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const raw = match[1].replace(/,/g, "");
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

/**
 * Extracts a structured intent object from a raw user message.
 * Uses keyword-based NLP (no external LLM required for demo).
 *
 * @param {string} message - Raw user input
 * @param {boolean} isCrisis - Whether crisis was detected
 * @returns {{ intent: Object, trace: Object }}
 */
export function runIntentAgent(message, isCrisis = false) {
  const startTime = Date.now();
  const lower = message.toLowerCase();
  const detectedLanguage = detectLanguage(message);

  // ── Service Type Detection ──────────────────────────────────
  let serviceType = null;
  let serviceCategory = null;

  for (const [category, keywords] of Object.entries(serviceCategories)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      serviceType = category;
      serviceCategory =
        category === "AC Technician" ? "Appliance" :
        category === "Plumber"       ? "Home Repair" :
        category === "Electrician"   ? "Home Repair" :
        category === "Beautician"    ? "Beauty" :
        category === "Tutor"         ? "Tutoring" : "General";
      break;
    }
  }

  // ── Location Detection ──────────────────────────────────────
  const locationPattern = /\b([A-Z]-\d{1,2}|F-\d{1,2}|I-\d{1,2}|DHA|Bahria|Gulberg|Clifton|Defence|Nazimabad|Johar|Islamabad|Rawalpindi|Karachi|Lahore)\b/i;
  const locationMatch = message.match(locationPattern);
  const location = locationMatch ? locationMatch[1] : null;

  // ── Time Detection ──────────────────────────────────────────
  let timePreference = "next available slot";
  if (/kal subah|tomorrow morning/i.test(lower))      timePreference = "kal subah (tomorrow morning)";
  else if (/kal|tomorrow/i.test(lower))               timePreference = "kal (tomorrow)";
  else if (/aaj shaam|today evening/i.test(lower))    timePreference = "aaj shaam (today evening)";
  else if (/abhi|now|foran|immediately/i.test(lower)) timePreference = "abhi (immediately)";
  else if (/aaj|today/i.test(lower))                  timePreference = "aaj (today)";

  // ── Budget Detection (general number mention) ───────────────
  const budgetMatch = lower.match(/(\d[\d,]+)\s*(pkr|rs|rupees|rupay)?/);
  const budgetMentioned = budgetMatch ? parseInt(budgetMatch[1].replace(",", ""), 10) : null;

  // ── User Target Price (explicit anchor — NEW) ────────────────
  // This is the SPECIFIC price the user wants to negotiate from.
  // Separate from budgetMentioned which is a loose number mention.
  const userTargetPrice = extractUserTargetPrice(message);

  // ── Urgency ─────────────────────────────────────────────────
  const urgency = isCrisis
    ? "crisis"
    : /jaldi|urgent|abhi|foran/i.test(lower) ? "high" : "normal";

  const intent = {
    service_type:      serviceType,
    service_category:  serviceCategory,
    location:          location || "user's current area",
    location_confirmed: !!locationMatch,
    time_preference:   timePreference,
    urgency,
    budget_mentioned:  budgetMentioned,
    user_target_price: userTargetPrice,   // ← NEW mandatory field
    has_price_anchor:  userTargetPrice !== null, // ← flag for BargainingAgent
    extra_notes:       "",
    detected_language: detectedLanguage,
    original_query:    message,
  };

  const duration = Date.now() - startTime;

  // Build output summary including price anchor if found
  const pricePart = userTargetPrice
    ? ` | 💰 Price anchor: PKR ${userTargetPrice.toLocaleString()}`
    : budgetMentioned
    ? ` | 💰 Budget mention: PKR ${budgetMentioned.toLocaleString()}`
    : "";

  const trace = {
    step:          "INTENT_EXTRACTION",
    agent:         "IntentAgent",
    input_summary: `"${message.slice(0, 60)}${message.length > 60 ? "..." : ""}"`,
    output_summary: `Detected: ${serviceType || "unknown"} @ ${intent.location} | ${timePreference}${pricePart}`,
    tools_used:    ["keyword_parser", "language_detector", "price_anchor_extractor"],
    duration_ms:   duration,
    reasoning: [
      serviceType
        ? `Matched "${serviceType}" via serviceCategories keyword map.`
        : "No service keyword matched — will ask for clarification.",
      userTargetPrice
        ? `Price anchor extracted: PKR ${userTargetPrice.toLocaleString()} (explicit negotiation target).`
        : budgetMentioned
        ? `General budget mentioned: PKR ${budgetMentioned.toLocaleString()} (no explicit anchor pattern).`
        : "No price/budget detected.",
    ].join(" "),
    confidence: serviceType ? 0.85 : 0.3,
  };

  return { intent, trace };
}
