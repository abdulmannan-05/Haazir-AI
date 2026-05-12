// ============================================================
// languageDetector.js — Classifies input language
// ============================================================

// Unicode range for Arabic/Urdu Nastaliq script
const ARABIC_URDU_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Common Roman Urdu words that are NOT English
const ROMAN_URDU_MARKERS = [
  "mujhe", "chahiye", "karo", "karna", "abhi", "kal", "aaj", "subah",
  "shaam", "raat", "mein", "hai", "hain", "nahi", "kya", "kyun",
  "wala", "wali", "bhai", "yaar", "dost", "ghar", "paani", "bijli",
  "jaldi", "foran", "kitna", "kaisa", "kahan", "kab", "lekin",
  "aur", "ya", "se", "ko", "ka", "ki", "ke", "agar", "toh",
  "bahut", "thora", "zyada", "kam", "mehenga", "sasta", "achha",
  "theek", "haan", "naa", "shukriya", "please", "zaroor",
];

/**
 * Detects the dominant language of a message.
 * @param {string} message
 * @returns {"roman_urdu" | "urdu" | "english" | "mixed"}
 */
export function detectLanguage(message) {
  if (!message || message.trim().length === 0) return "english";

  const hasUrduScript = ARABIC_URDU_REGEX.test(message);
  const lower = message.toLowerCase();
  const words = lower.split(/\s+/);

  const romanUrduCount = words.filter((w) =>
    ROMAN_URDU_MARKERS.some((marker) => w === marker || w.startsWith(marker))
  ).length;

  const romanUrduRatio = romanUrduCount / Math.max(words.length, 1);

  if (hasUrduScript && romanUrduCount > 0) return "mixed";
  if (hasUrduScript) return "urdu";
  if (romanUrduRatio >= 0.2) return "roman_urdu";

  return "english";
}

/**
 * Returns a human-readable label for the detected language.
 * @param {"roman_urdu" | "urdu" | "english" | "mixed"} lang
 * @returns {string}
 */
export function getLanguageLabel(lang) {
  const labels = {
    roman_urdu: "Roman Urdu 🇵🇰",
    urdu: "اردو 🇵🇰",
    english: "English 🌐",
    mixed: "Mixed 🔀",
  };
  return labels[lang] || "Unknown";
}
