// ============================================================
// crisisAgent.js — Dedicated Crisis Mode Orchestration Agent
// Handles the full fast-track emergency pipeline:
//   Detect → Classify → Pre-select → Auto-book → Notify → Safety
// ============================================================

import { getCrisisSafetyTip, classifyCrisisType, getCrisisProtocol } from "@/utils/crisisDetector";

/**
 * Crisis severity levels
 */
export const CRISIS_SEVERITY = {
  CRITICAL: "critical",   // fire, gas leak, flood — life-threatening
  HIGH:     "high",       // pipe burst, short circuit — urgent damage
  MEDIUM:   "medium",     // urgent service needed but not life-threatening
};

/**
 * Runs the full crisis assessment and pre-selection step.
 * Called immediately after crisis is detected, BEFORE normal pipeline.
 *
 * @param {string}   message        - Raw user message
 * @param {string}   matchedKeyword - Keyword that triggered crisis
 * @param {Object[]} allProviders   - All providers from discovery (with distance_km)
 * @param {string}   serviceType    - Extracted service type (e.g. "Plumber")
 * @returns {{ crisisReport: Object, selectedProvider: Object, trace: Object }}
 */
export function runCrisisAgent(message, matchedKeyword, allProviders, serviceType) {
  const startTime = Date.now();

  // ── 1. Classify crisis type & severity ───────────────────────
  const crisisType    = classifyCrisisType(matchedKeyword, message);
  const severity      = getCrisisSeverity(crisisType);
  const safetyTip     = getCrisisSafetyTip(matchedKeyword);
  const protocol      = getCrisisProtocol(crisisType);
  const emergencyLine = getEmergencyLine(crisisType);

  // ── 2. Pre-select best emergency provider ────────────────────
  // Crisis ranking: availability NOW > proximity > anything else
  const urgentProviders = allProviders
    .map((p) => {
      const hasNow = p.available_slots?.some(
        (s) => s.toLowerCase().includes("now") || s.toLowerCase().includes("abhi")
      );
      const hasToday = p.available_slots?.some((s) =>
        s.toLowerCase().includes("today")
      );

      const availScore  = hasNow ? 100 : hasToday ? 50 : 10;
      const proxScore   = Math.max(0, 10 - (p.distance_km || 5)) * 10; // 0–100
      const crisisScore = availScore + proxScore;

      return { ...p, crisisScore, hasNow, hasToday };
    })
    .sort((a, b) => b.crisisScore - a.crisisScore);

  const selectedProvider = urgentProviders[0] || allProviders[0];

  // ── 3. Build step-by-step crisis status messages ─────────────
  const timelineSteps = buildCrisisTimeline(selectedProvider, serviceType, crisisType);

  // ── 4. Build crisis report ────────────────────────────────────
  const crisisReport = {
    matchedKeyword,
    crisisType,
    severity,
    safetyTip,
    protocol,
    emergencyLine,
    selectedProvider,
    timelineSteps,
    booking_priority: "EMERGENCY",
    auto_booking:     true,
    skip_confirmation: severity === CRISIS_SEVERITY.CRITICAL,
    detected_at: new Date().toISOString(),
  };

  const duration = Date.now() - startTime;

  const trace = {
    step: "CRISIS_RESPONSE",
    agent: "CrisisAgent",
    input_summary: `Keyword: "${matchedKeyword}" | Type: ${crisisType} | Severity: ${severity}`,
    output_summary: `Pre-selected: ${selectedProvider?.name} | Priority: EMERGENCY | Auto-book: true`,
    tools_used: [
      "detect_crisis",
      "classify_crisis_type",
      "emergency_provider_sort",
      "get_safety_protocol",
      "get_emergency_line",
    ],
    duration_ms: duration,
    reasoning:
      `Crisis detected (${severity.toUpperCase()}). Normal ranking skipped. ` +
      `Sorted ${allProviders.length} providers by availability-NOW + proximity. ` +
      `Pre-selected ${selectedProvider?.name} (crisis score: ${selectedProvider?.crisisScore?.toFixed(0)}). ` +
      `Auto-booking enabled. Safety tip generated. Emergency line: ${emergencyLine}.`,
    confidence: 0.99,
    crisis_mode: true,
  };

  return { crisisReport, selectedProvider, trace };
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Maps crisis type → severity level
 */
function getCrisisSeverity(crisisType) {
  const critical = ["fire", "gas_leak", "flood"];
  const high     = ["electrical", "pipe_burst", "water_damage"];

  if (critical.includes(crisisType)) return CRISIS_SEVERITY.CRITICAL;
  if (high.includes(crisisType))     return CRISIS_SEVERITY.HIGH;
  return CRISIS_SEVERITY.MEDIUM;
}

/**
 * Returns appropriate emergency helpline for the crisis type
 */
function getEmergencyLine(crisisType) {
  const lines = {
    fire:         "1122 (Rescue)",
    gas_leak:     "1199 (SNGPL Gas) / 1122",
    flood:        "1122 (Rescue) / NDMA",
    electrical:   "118 (WAPDA / LESCO)",
    pipe_burst:   "116 (WASA Water)",
    water_damage: "116 (WASA Water)",
    general:      "1122 (Rescue)",
  };
  return lines[crisisType] || lines.general;
}

/**
 * Builds the step-by-step crisis response timeline shown in UI
 */
function buildCrisisTimeline(provider, serviceType, crisisType) {
  const name = provider?.name || "Nearest provider";
  const slot = provider?.available_slots?.find(
    (s) => s.toLowerCase().includes("now")
  ) || "Immediately";

  return [
    {
      id: "C1",
      icon: "🚨",
      label: "Crisis Detected",
      detail: "Emergency workflow activated — all wait times skipped",
      status: "done",
      duration: "< 1s",
    },
    {
      id: "C2",
      icon: "🔍",
      label: "Emergency Provider Located",
      detail: `${name} — ${provider?.distance_km?.toFixed(1) || "~"} km away | Available: ${slot}`,
      status: "done",
      duration: "< 2s",
    },
    {
      id: "C3",
      icon: "📲",
      label: "Provider Alerted",
      detail: `URGENT SMS sent to ${name}: "${serviceType} emergency — respond immediately"`,
      status: "done",
      duration: "< 3s",
    },
    {
      id: "C4",
      icon: "✅",
      label: "Emergency Booking Confirmed",
      detail: "Booking ID generated with EMERGENCY priority flag",
      status: "done",
      duration: "< 5s",
    },
    {
      id: "C5",
      icon: "🛡️",
      label: "Safety Protocol Active",
      detail: `Follow safety instructions while ${name} is en route`,
      status: "active",
      duration: "ongoing",
    },
  ];
}
