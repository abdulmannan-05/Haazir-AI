"use client";

// ============================================================
// page.jsx — HaazirAI Main Page
//
// ORCHESTRATOR_SKILL CONSTRAINTS ACTIVE:
//   • Pipeline is IDLE at Step 0 — no auto-initialization
//   • Step 1 triggers ONLY on manual user message
//   • Step 5 has a mandatory WAIT_FOR_CONFIRMATION breakpoint
//   • Bargaining NEVER auto-triggers — only on explicit user request
//   • Follow-up milestones R3/R4 are user-confirmed, no timers
//   • bookingStore + trace cleared on reset
// ============================================================

import { useState, useCallback, useEffect } from "react";
import ChatInterface       from "@/components/ChatInterface";
import AgentTracePanel     from "@/components/AgentTracePanel";
import BargainingModal     from "@/components/BargainingModal";
import CrisisAlert         from "@/components/CrisisAlert";
import CrisisStatusCard    from "@/components/CrisisStatusCard";
import BookingCard         from "@/components/BookingCard";
import ProviderCard        from "@/components/ProviderCard";
import ReminderTimeline    from "@/components/ReminderTimeline";
import ConfirmationPrompt  from "@/components/ConfirmationPrompt";

import { detectCrisis, getEmergencyHelpline } from "@/utils/crisisDetector";
import { resetStore }                          from "@/utils/bookingStore";
import { runCrisisAgent }                      from "@/agents/crisisAgent";
import { runIntentAgent }                      from "@/agents/intentAgent";
import { runDiscoveryAgent }                   from "@/agents/discoveryAgent";
import { runRankingAgent }                     from "@/agents/rankingAgent";
import { shouldTriggerBargaining, runBargainingAgent } from "@/agents/bargainingAgent";
import { runBookingAgent }                     from "@/agents/bookingAgent";
import { runFollowupAgent }                    from "@/agents/followupAgent";

import styles from "./page.module.css";

// ── Pipeline states ────────────────────────────────────────────
const STATE = {
  IDLE:             "IDLE",             // Waiting for first message
  RUNNING:          "RUNNING",          // Steps 1-5 in progress
  WAITING_CONFIRM:  "WAITING_CONFIRM",  // Step 5 breakpoint — awaiting user choice
  BOOKING:          "BOOKING",          // Steps 7-8 in progress
  COMPLETE:         "COMPLETE",         // Booking done
};

// ── Confirmation keywords ──────────────────────────────────────
const CONFIRM_WORDS  = ["haan", "confirm", "yes", "theek", "ok", "book karo", "proceed", "zaroor", "bilkul"];
const CANCEL_WORDS   = ["nahi", "no", "cancel", "band", "ruk", "mat karo", "chhodo"];
const BARGAIN_WORDS  = ["mehenga", "discount", "thora kam", "negotiate", "sasta", "zyada nahi", "budget", "kam karo", "2000", "1500", "1000"];

// ── Helpers ────────────────────────────────────────────────────
function makeId()   { return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function nowTime()  { return new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }); }
const sleep = (ms)  => new Promise((r) => setTimeout(r, ms));

// ── Main Component ─────────────────────────────────────────────
export default function Home() {
  // ── Core UI state ──────────────────────────────────────────
  const [messages,  setMessages]  = useState([]);
  const [traces,    setTraces]    = useState([]);
  const [isTyping,  setIsTyping]  = useState(false);
  const [traceOpen, setTraceOpen] = useState(true);

  // ── Pipeline state machine ─────────────────────────────────
  const [pipelineState, setPipelineState] = useState(STATE.IDLE);

  // Pending context held across the Step-5 breakpoint
  const [pendingCtx, setPendingCtx] = useState(null);
  // { ranked: [], topProvider: {}, intent: {}, isCrisis: bool, crisisReport: null }

  // ── Crisis state ───────────────────────────────────────────
  const [crisisActive,  setCrisisActive]  = useState(false);
  const [crisisType,    setCrisisType]    = useState("general");
  const [safetyTip,     setSafetyTip]     = useState("");
  const [emergencyLine, setEmergencyLine] = useState("");

  // ── Bargaining state ───────────────────────────────────────
  const [bargainResult, setBargainResult] = useState(null);

  // ── Reset on mount — ensure IDLE start ────────────────────
  // (no useEffect auto-runs that start the pipeline)
  useEffect(() => {
    resetStore();
    // Nothing else — pipeline stays IDLE until user types
  }, []);

  // ── Message helpers ────────────────────────────────────────
  const pushMsg = (role, content, type = "text") => {
    const msg = { id: makeId(), role, content, type, time: nowTime() };
    setMessages((prev) => [...prev, msg]);
  };

  const pushTrace = (trace) => setTraces((prev) => [...prev, trace]);

  // ── Hard reset ────────────────────────────────────────────
  const handleReset = () => {
    resetStore();
    setMessages([]);
    setTraces([]);
    setPipelineState(STATE.IDLE);
    setPendingCtx(null);
    setCrisisActive(false);
    setBargainResult(null);
    setIsTyping(false);
  };

  // ══════════════════════════════════════════════════════════
  // PRIMARY ENTRY POINT — handleSend
  // Routes message based on current pipelineState
  // ══════════════════════════════════════════════════════════
  const handleSend = useCallback(async (text) => {

    // ── Guard: don't accept input while pipeline is running/booking ──
    if (pipelineState === STATE.RUNNING || pipelineState === STATE.BOOKING) return;

    // ── State: WAITING_CONFIRM — interpret as confirmation/bargain/cancel ──
    if (pipelineState === STATE.WAITING_CONFIRM) {
      await handleConfirmationInput(text);
      return;
    }

    // ── State: IDLE or COMPLETE — start a fresh pipeline ──
    await runPipeline(text);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineState, pendingCtx]);

  // ══════════════════════════════════════════════════════════
  // CONFIRMATION INPUT HANDLER (Step 5 breakpoint)
  // ══════════════════════════════════════════════════════════
  const handleConfirmationInput = async (text) => {
    const lower = text.toLowerCase().trim();
    pushMsg("user", text);

    // ── Check for cancel ──────────────────────────────────
    if (CANCEL_WORDS.some((w) => lower.includes(w))) {
      setPipelineState(STATE.IDLE);
      setPendingCtx(null);
      pushMsg("bot", "Theek hai, booking cancel kar di. Jab chahiye toh type karein! 👍");
      return;
    }

    // ── Check for bargaining trigger ──────────────────────
    if (BARGAIN_WORDS.some((w) => lower.includes(w))) {
      const { topProvider, intent } = pendingCtx;
      const budgetMatch = lower.match(/(\d[\d,]+)/);
      const overridePrice = budgetMatch ? parseInt(budgetMatch[1].replace(",", ""), 10) : null;

      setIsTyping(true);
      await sleep(300);
      const { result: bResult, trace: bargainTrace } = runBargainingAgent(topProvider, intent, overridePrice);
      pushTrace(bargainTrace);
      setIsTyping(false);
      setBargainResult(bResult);
      return;
    }

    // ── Check for numeric provider selection (type "2" or "3") ──
    const numMatch = lower.match(/^[1-3]$/);
    if (numMatch) {
      const idx = parseInt(numMatch[0]) - 1;
      const provider = pendingCtx.ranked[idx];
      if (provider) {
        await finalizeBooking(provider, pendingCtx.intent, null, false);
        return;
      }
    }

    // ── Check for confirmation ────────────────────────────
    if (CONFIRM_WORDS.some((w) => lower.includes(w))) {
      await finalizeBooking(pendingCtx.topProvider, pendingCtx.intent, null, false);
      return;
    }

    // ── Not understood — re-prompt ─────────────────────────
    pushMsg(
      "bot",
      `Main samajh nahi paya. Please:\n` +
      `• "Haan" — top pick confirm karein\n` +
      `• "2" ya "3" — doosra provider\n` +
      `• "Thora kam karo" — price bargain\n` +
      `• "Nahi" — cancel`,
    );
  };

  // ══════════════════════════════════════════════════════════
  // MAIN PIPELINE — Steps 1 through 5 + conditional branches
  // ══════════════════════════════════════════════════════════
  const runPipeline = async (text) => {
    pushMsg("user", text);
    setPipelineState(STATE.RUNNING);
    setIsTyping(true);

    await sleep(300);

    // ── STEP 1: Crisis Detection ──────────────────────────
    const crisisResult = detectCrisis(text);
    const isCrisis     = crisisResult.isCrisis;

    pushTrace({
      step:          "CRISIS_DETECTION",
      agent:         "CrisisDetector",
      input_summary: `"${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
      output_summary: isCrisis
        ? `🚨 CRISIS: "${crisisResult.matchedKeyword}" (${crisisResult.crisisType}, ${Math.round(crisisResult.confidence * 100)}%)`
        : "✅ No crisis — normal flow",
      tools_used:  ["detect_crisis", "keyword_map_scan"],
      duration_ms: 8,
      reasoning: isCrisis
        ? `Keyword "${crisisResult.matchedKeyword}" matched. Amplifier: ${crisisResult.hasAmplifier}`
        : "No crisis keywords. Normal pipeline continues.",
      confidence:  crisisResult.confidence || 0.05,
      crisis_mode: isCrisis,
    });

    // ── STEP 2: Intent Extraction ─────────────────────────
    await sleep(isCrisis ? 80 : 300);
    const { intent, trace: intentTrace } = runIntentAgent(text, isCrisis);
    pushTrace(intentTrace);

    if (!intent.service_type) {
      setIsTyping(false);
      setPipelineState(STATE.IDLE);
      pushMsg(
        "bot",
        isCrisis
          ? "🚨 Emergency! Kaunsi service chahiye? (Plumber / Electrician / General)"
          : "Salaam! Main samajh nahi paya — kaunsi service chahiye?\n\nMisal: Plumber, Electrician, AC Technician, Tutor, Beautician?",
      );
      return;
    }

    // ── STEP 3: Provider Discovery ────────────────────────
    await sleep(isCrisis ? 80 : 350);
    const { providers, trace: discoveryTrace } = runDiscoveryAgent(intent);
    pushTrace(discoveryTrace);

    if (providers.length === 0) {
      setIsTyping(false);
      setPipelineState(STATE.IDLE);
      pushMsg("bot", `Afsos, "${intent.service_type}" ke liye koi provider nahi mila. Thodi der mein dobara try karein.`);
      return;
    }

    // ── STEP 4: Crisis Branch vs Normal Ranking ───────────
    if (isCrisis) {
      // Activate crisis UI
      const helpline    = getEmergencyHelpline(crisisResult.crisisType);
      const helplineStr = `${helpline.number} (${helpline.label})`;
      setCrisisActive(true);
      setCrisisType(crisisResult.crisisType);
      setEmergencyLine(helplineStr);

      await sleep(100);

      // Run crisis agent
      const { crisisReport, selectedProvider, trace: crisisTrace } = runCrisisAgent(
        text,
        crisisResult.matchedKeyword,
        providers,
        intent.service_type,
      );
      pushTrace(crisisTrace);
      setSafetyTip(crisisReport.safetyTip);

      // Show crisis card
      setIsTyping(false);
      pushMsg(
        "bot",
        <CrisisStatusCard crisisReport={crisisReport} booking={null} />,
        "crisis",
      );

      // ── Crisis still goes to WAIT — user must confirm ──
      // (unless CRITICAL severity → auto-book for life safety)
      if (crisisReport.severity === "critical") {
        // Life-threatening — auto-book immediately
        await sleep(800);
        await finalizeCrisisBooking(selectedProvider, intent, crisisReport);
      } else {
        // HIGH/MEDIUM crisis — show confirmation
        setPendingCtx({ ranked: [selectedProvider], topProvider: selectedProvider, intent, isCrisis: true, crisisReport });
        setPipelineState(STATE.WAITING_CONFIRM);
        pushMsg(
          "bot",
          `🚨 ${selectedProvider.name} available hai. Emergency booking confirm karoon?\nType "Haan" ya button dabao.`,
        );
      }
      return;
    }

    // ── Normal Step 4: Ranking ────────────────────────────
    await sleep(250);
    const { ranked, trace: rankTrace } = runRankingAgent(providers, false);
    pushTrace(rankTrace);

    const topProvider = ranked[0];

    // ── STEP 5: Recommendation — MANDATORY WAIT ───────────
    await sleep(200);
    setIsTyping(false);

    // Show provider cards
    pushMsg(
      "bot",
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ color: "#25D366", fontWeight: 600, fontSize: "0.88rem", marginBottom: "4px" }}>
          ✅ Best matches mili:
        </p>
        {ranked.map((p) => (
          <ProviderCard key={p.id} provider={p} rank={p.rank} />
        ))}
      </div>,
      "providers",
    );

    // Show confirmation prompt (interactive breakpoint)
    pushMsg(
      "bot",
      <ConfirmationPrompt
        topProvider={topProvider}
        ranked={ranked}
        onConfirm={(p) => handleProviderConfirm(p, intent)}
        onCancel={handleCancel}
        onBargain={() => handleBargainTrigger(topProvider, intent)}
      />,
      "confirm_prompt",
    );

    pushTrace({
      step:          "RECOMMENDATION",
      agent:         "OrchestratorAgent",
      input_summary: `Top: ${topProvider.name} (score ${topProvider.scores?.total?.toFixed(0)})`,
      output_summary: `⏸ PAUSED at Step 5 — awaiting user confirmation`,
      tools_used:    ["rank_providers"],
      duration_ms:   10,
      reasoning:
        "ORCHESTRATOR_SKILL: Mandatory breakpoint at Step 5. Pipeline is PAUSED. " +
        "Booking will NOT proceed until user types 'Haan'/'Confirm' or clicks a provider button.",
      confidence: 0.9,
    });

    // ── PAUSE — store context, wait for user input ────────
    setPendingCtx({ ranked, topProvider, intent, isCrisis: false, crisisReport: null });
    setPipelineState(STATE.WAITING_CONFIRM);
  };

  // ══════════════════════════════════════════════════════════
  // BUTTON CALLBACKS (called by ConfirmationPrompt / CrisisCard)
  // ══════════════════════════════════════════════════════════

  const handleProviderConfirm = useCallback(async (provider, intent) => {
    await finalizeBooking(provider, intent, null, false);
  }, []);

  const handleCancel = useCallback(() => {
    setPipelineState(STATE.IDLE);
    setPendingCtx(null);
    pushMsg("bot", "Theek hai, booking cancel kar di. Kab chahiye toh likhein! 👍");
  }, []);

  const handleBargainTrigger = useCallback(async (provider, intent) => {
    setIsTyping(true);
    await sleep(300);
    const { result: bResult, trace: bargainTrace } = runBargainingAgent(
      provider,
      intent,
      null
    );
    pushTrace(bargainTrace);
    setIsTyping(false);
    setBargainResult(bResult);
    // Keep state as WAITING_CONFIRM — bargaining resolves back here
  }, []);

  const handleBargainAccept = useCallback(async (agreedPrice) => {
    setBargainResult(null);
    if (pendingCtx) {
      await finalizeBooking(pendingCtx.topProvider, pendingCtx.intent, agreedPrice, false);
    }
  }, [pendingCtx]);

  // ══════════════════════════════════════════════════════════
  // STEP 7 + 8: Booking + Follow-up
  // ══════════════════════════════════════════════════════════

  const finalizeBooking = async (provider, intent, agreedPrice, isCrisis) => {
    setPipelineState(STATE.BOOKING);
    setIsTyping(true);
    await sleep(500);

    const { booking, trace: bookTrace }   = runBookingAgent(provider, intent, agreedPrice, isCrisis);
    const { reminders, trace: followTrace } = runFollowupAgent(booking);
    pushTrace(bookTrace);
    pushTrace(followTrace);

    setIsTyping(false);
    setPipelineState(STATE.COMPLETE);
    setPendingCtx(null);

    pushMsg(
      "bot",
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <BookingCard booking={booking} />
        <ReminderTimeline reminders={reminders} />
      </div>,
      "booking",
    );
  };

  const finalizeCrisisBooking = async (provider, intent, crisisReport) => {
    setPipelineState(STATE.BOOKING);
    setIsTyping(true);
    await sleep(400);

    const { booking, trace: bookTrace }   = runBookingAgent(provider, intent, null, true);
    const { reminders, trace: followTrace } = runFollowupAgent(booking);
    pushTrace(bookTrace);
    pushTrace(followTrace);

    setIsTyping(false);
    setPipelineState(STATE.COMPLETE);
    setPendingCtx(null);

    pushMsg(
      "bot",
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <CrisisStatusCard crisisReport={crisisReport} booking={booking} />
        <ReminderTimeline reminders={reminders} />
      </div>,
      "crisis_booking",
    );
  };

  // ── State label for UI ─────────────────────────────────────
  const stateLabel = {
    [STATE.IDLE]:            { text: "● IDLE — Ready",              color: "#8B949E" },
    [STATE.RUNNING]:         { text: "⚡ Running pipeline...",      color: "#FFA500" },
    [STATE.WAITING_CONFIRM]: { text: "⏸ Waiting for your choice",  color: "#007AFF" },
    [STATE.BOOKING]:         { text: "📋 Booking in progress...",   color: "#25D366" },
    [STATE.COMPLETE]:        { text: "✅ Booking complete",          color: "#25D366" },
  }[pipelineState];

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={`${styles.root} ${crisisActive ? styles.rootCrisis : ""}`}>

      {/* ── App Header ─────────────────────────────────────── */}
      <header className={`${styles.appHeader} ${crisisActive ? styles.headerCrisis : ""}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🤖</span>
          <span className={styles.logoText}>HaazirAI</span>
        </div>

        {/* Pipeline state indicator */}
        <span className={styles.stateIndicator} style={{ color: stateLabel.color }}>
          {stateLabel.text}
        </span>

        <div className={styles.headerBadges}>
          <span className={`${styles.badge} ${crisisActive ? styles.badgeCrisisActive : ""}`}>
            🚨 Crisis
          </span>
          <span className={styles.badge}>🥊 Bargain</span>
          <span className={styles.badge}>🗣️ Roman Urdu</span>
          <button
            id="reset-btn"
            className={styles.resetBtn}
            onClick={handleReset}
            title="Reset all — clear store & traces"
          >
            ↺ Reset
          </button>
        </div>
      </header>

      {/* ── Crisis Alert ───────────────────────────────────── */}
      <CrisisAlert
        active={crisisActive}
        safetyTip={safetyTip}
        crisisType={crisisType}
        emergencyLine={emergencyLine}
        onDismiss={() => setCrisisActive(false)}
      />

      {/* ── Bargaining Modal ───────────────────────────────── */}
      <BargainingModal
        bargainResult={bargainResult}
        onAccept={handleBargainAccept}
        onClose={() => setBargainResult(null)}
      />

      {/* ── Main layout ────────────────────────────────────── */}
      <main className={styles.main}>
        <div className={`${styles.chatArea} ${crisisActive ? styles.chatCrisis : ""}`}>
          <ChatInterface
            messages={messages}
            isTyping={isTyping}
            onSend={handleSend}
            disabled={pipelineState === STATE.RUNNING || pipelineState === STATE.BOOKING}
            isCrisis={crisisActive}
          />
        </div>

        <AgentTracePanel
          traces={traces}
          isOpen={traceOpen}
          onToggle={() => setTraceOpen((o) => !o)}
        />
      </main>
    </div>
  );
}
