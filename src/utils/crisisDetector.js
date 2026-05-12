// ============================================================
// crisisDetector.js — Enhanced crisis detection & classification
// ============================================================

// ── Crisis keyword map: keyword → crisis type ─────────────────
const CRISIS_KEYWORD_MAP = [
  // Fire
  { keywords: ["aag", "fire", "jal raha", "jal rahi", "jalti", "smoke", "dhuan", "dhuaan", "burn"], type: "fire" },
  // Gas leak
  { keywords: ["gas leak", "gas aa rahi", "gas smell", "gas band", "gas wala", "smell gas", "gas nikal"], type: "gas_leak" },
  // Flood / pipe burst
  { keywords: ["pipe burst", "pipe phut", "paani aa raha", "paani baar", "flood", "paani bhar gaya", "paani aa gaya", "nali tod"], type: "pipe_burst" },
  // Electrical
  { keywords: ["bijli short", "short circuit", "bijli gir", "current lag", "shock laga", "wire jal", "bijli khatam", "spark"], type: "electrical" },
  // Water damage
  { keywords: ["paani barh", "seepage", "seepage ho", "leakage", "water damage", "chhatt se paani"], type: "water_damage" },
  // General emergency
  { keywords: ["emergency", "bachao", "help", "khatarnak", "danger", "jaldi jaldi", "foran aao", "abhi aao", "please help", "maday karo"], type: "general" },
];

// ── Urgency intensifiers (boost crisis confidence) ────────────
const URGENCY_AMPLIFIERS = [
  "abhi", "foran", "jaldi", "urgent", "immediately", "now", "asap",
  "please", "please help", "help me", "koi aao", "koi help karo",
];

// ── Flat keyword list (for simple boolean check) ──────────────
export const crisisKeywords = CRISIS_KEYWORD_MAP.flatMap((entry) => entry.keywords);

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

/**
 * Checks if the user message contains any crisis signal.
 * Returns enriched detection result with confidence score.
 *
 * @param {string} message
 * @returns {{
 *   isCrisis:       boolean,
 *   matchedKeyword: string | null,
 *   crisisType:     string | null,
 *   confidence:     number,
 *   hasAmplifier:   boolean,
 * }}
 */
export function detectCrisis(message) {
  if (!message) return { isCrisis: false, matchedKeyword: null, crisisType: null, confidence: 0, hasAmplifier: false };

  const lower = message.toLowerCase();

  // Check amplifiers
  const hasAmplifier = URGENCY_AMPLIFIERS.some((a) => lower.includes(a));

  // Check each crisis category
  for (const entry of CRISIS_KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        const confidence = hasAmplifier ? 0.99 : 0.9;
        return {
          isCrisis:       true,
          matchedKeyword: kw,
          crisisType:     entry.type,
          confidence,
          hasAmplifier,
        };
      }
    }
  }

  return { isCrisis: false, matchedKeyword: null, crisisType: null, confidence: 0, hasAmplifier };
}

/**
 * Classifies the crisis type from matched keyword and full message.
 * Used by CrisisAgent for severity mapping.
 *
 * @param {string} keyword
 * @param {string} message
 * @returns {string} crisis type
 */
export function classifyCrisisType(keyword, message) {
  const lower = (keyword + " " + message).toLowerCase();

  for (const entry of CRISIS_KEYWORD_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return entry.type;
    }
  }
  return "general";
}

/**
 * Returns safety tips for a given crisis matched keyword.
 * Rich, multi-step safety instructions.
 *
 * @param {string} keyword
 * @returns {string}
 */
export function getCrisisSafetyTip(keyword) {
  const lower = (keyword || "").toLowerCase();

  if (lower.includes("aag") || lower.includes("fire") || lower.includes("jal") || lower.includes("smoke") || lower.includes("dhuan")) {
    return "🔥 Foran ghar se bahar niklo — darwaza band kar ke jaao. Gas main band karo. Kisi ko andar wapas na jaane do. 1122 call karo.";
  }
  if (lower.includes("gas")) {
    return "⚠️ Gas valve FORAN band karo. Koi bhi electric switch mat lagao — spark se blast ho sakti hai. Khidkiyan kholkar bahar niklo. 1199 call karo.";
  }
  if (lower.includes("bijli") || lower.includes("short") || lower.includes("current") || lower.includes("spark") || lower.includes("shock")) {
    return "⚡ Main circuit breaker OFF karo. Geele haath se koi bhi cheez mat chuoo. Paani se door raho. WAPDA/LESCO: 118 call karo.";
  }
  if (lower.includes("paani") || lower.includes("pipe") || lower.includes("flood") || lower.includes("nali")) {
    return "💧 Main water valve BAND karo (usually meter ke paas). Electric sockets aur appliances paani se door rakho. WASA helpline: 116.";
  }
  if (lower.includes("bachao") || lower.includes("help") || lower.includes("emergency")) {
    return "🚨 Apni safety sabse pehle. Agar khatarnak situation hai — ghar se bahar niklo aur 1122 call karo.";
  }

  return "🚨 Apni safety pehle ensure karo. Zaroorat par Rescue 1122 call karein.";
}

/**
 * Returns a step-by-step safety protocol for a given crisis type.
 *
 * @param {string} crisisType
 * @returns {string[]} list of protocol steps
 */
export function getCrisisProtocol(crisisType) {
  const protocols = {
    fire: [
      "Foran ghar se bahar niklo",
      "Darwaza band karo — hawa aag ko tez karti hai",
      "Kisi ko andar wapas jaane mat do",
      "1122 (Rescue) call karo",
      "Hamdard logon ko khabardaar karo",
    ],
    gas_leak: [
      "Gas meter valve FORAN band karo",
      "Koi electric switch mat lagao ya band karo",
      "Khidkiyan aur darwaze kholkar ghar khali karo",
      "Mobile bahar ja ke use karo — andar nahi",
      "1199 (SNGPL) ya 1122 call karo",
    ],
    pipe_burst: [
      "Main water shutoff valve band karo",
      "Electric sockets jo paani ke paas hain unhe band karo",
      "Qeemat ki cheezein upar rakhne ki koshish karo",
      "WASA helpline 116 call karo",
    ],
    electrical: [
      "Main circuit breaker FORAN off karo",
      "Geele haath se kuch mat chuoo",
      "Paani se door raho",
      "WAPDA/LESCO helpline 118 call karo",
    ],
    water_damage: [
      "Main water valve band karo",
      "Electric appliances off karo aur unplug karo",
      "Qeemat ki cheezein mehfooz jagah rakh do",
    ],
    general: [
      "Apni safety pehle ensure karo",
      "Agar khatarnak lag raha hai toh ghar se bahar niklo",
      "1122 call karo emergency mein",
    ],
  };

  return protocols[crisisType] || protocols.general;
}

/**
 * Returns the appropriate emergency helpline number.
 *
 * @param {string} crisisType
 * @returns {{ number: string, label: string }}
 */
export function getEmergencyHelpline(crisisType) {
  const helplines = {
    fire:         { number: "1122", label: "Rescue" },
    gas_leak:     { number: "1199", label: "SNGPL Gas Emergency" },
    flood:        { number: "1122", label: "NDMA / Rescue" },
    pipe_burst:   { number: "116",  label: "WASA Water" },
    electrical:   { number: "118",  label: "WAPDA / LESCO" },
    water_damage: { number: "116",  label: "WASA Water" },
    general:      { number: "1122", label: "Rescue" },
  };
  return helplines[crisisType] || helplines.general;
}
