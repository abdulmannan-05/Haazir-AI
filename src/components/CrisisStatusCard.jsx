"use client";

// ============================================================
// CrisisStatusCard.jsx — Real-time crisis response card
// Shown inside the chat during a crisis booking.
// Displays: severity, provider, timeline, safety protocol,
//           emergency helpline, and countdown timer.
// ============================================================

import { useEffect, useState } from "react";
import styles from "./CrisisStatusCard.module.css";
import { CRISIS_SEVERITY } from "@/agents/crisisAgent";

// ── Sub-components ─────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const config = {
    [CRISIS_SEVERITY.CRITICAL]: { label: "⛔ CRITICAL", cls: styles.badgeCritical },
    [CRISIS_SEVERITY.HIGH]:     { label: "🔴 HIGH",     cls: styles.badgeHigh },
    [CRISIS_SEVERITY.MEDIUM]:   { label: "🟠 MEDIUM",   cls: styles.badgeMedium },
  };
  const { label, cls } = config[severity] || config[CRISIS_SEVERITY.MEDIUM];
  return <span className={`${styles.severityBadge} ${cls}`}>{label}</span>;
}

function TimelineStep({ step, animate }) {
  return (
    <div
      className={`${styles.timelineStep} ${
        step.status === "done"   ? styles.stepDone   :
        step.status === "active" ? styles.stepActive  : styles.stepPending
      } ${animate ? styles.stepAnimate : ""}`}
    >
      <div className={styles.stepIconWrap}>
        <span className={styles.stepIcon}>{step.icon}</span>
        {step.status === "active" && <span className={styles.stepPulse} />}
      </div>
      <div className={styles.stepBody}>
        <div className={styles.stepHeader}>
          <span className={styles.stepLabel}>{step.label}</span>
          <span className={styles.stepDuration}>{step.duration}</span>
        </div>
        <p className={styles.stepDetail}>{step.detail}</p>
      </div>
    </div>
  );
}

function ProtocolList({ steps }) {
  return (
    <div className={styles.protocol}>
      <p className={styles.protocolTitle}>🛡️ Abhi yeh karein (Safety Protocol):</p>
      <ol className={styles.protocolList}>
        {steps.map((s, i) => (
          <li key={i} className={styles.protocolItem}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

function EmergencyLine({ helpline }) {
  return (
    <a
      href={`tel:${helpline.number}`}
      className={styles.helplineBtn}
      id="crisis-helpline-btn"
    >
      📞 {helpline.number} — {helpline.label}
    </a>
  );
}

// ── ETA counter: counts up from 0 to show "response in X min" ──
function EtaCounter() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0
    ? `${mins}m ${secs.toString().padStart(2, "0")}s`
    : `${secs}s`;

  return (
    <div className={styles.eta}>
      <span className={styles.etaLabel}>⏱ Response time</span>
      <span className={styles.etaValue}>{display}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function CrisisStatusCard({ crisisReport, booking }) {
  const [visibleSteps, setVisibleSteps] = useState(0);

  // Animate timeline steps appearing one by one
  useEffect(() => {
    if (!crisisReport?.timelineSteps) return;
    setVisibleSteps(0);
    const total = crisisReport.timelineSteps.length;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleSteps(i);
      if (i >= total) clearInterval(interval);
    }, 600);
    return () => clearInterval(interval);
  }, [crisisReport]);

  if (!crisisReport) return null;

  const {
    crisisType,
    severity,
    safetyTip,
    protocol,
    emergencyLine,
    selectedProvider,
    timelineSteps,
    matchedKeyword,
  } = crisisReport;

  return (
    <div className={`${styles.card} ${severity === CRISIS_SEVERITY.CRITICAL ? styles.cardCritical : styles.cardHigh}`}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🚨</span>
          <div>
            <p className={styles.headerTitle}>EMERGENCY RESPONSE ACTIVE</p>
            <p className={styles.headerSub}>Triggered by: &ldquo;{matchedKeyword}&rdquo;</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <SeverityBadge severity={severity} />
          <EtaCounter />
        </div>
      </div>

      {/* ── Safety Tip Banner ── */}
      <div className={styles.safetyBanner}>
        <p className={styles.safetyText}>{safetyTip}</p>
      </div>

      {/* ── Emergency Helpline ── */}
      {emergencyLine && (
        <div className={styles.helplineRow}>
          <span className={styles.helplineLabel}>Government Emergency:</span>
          <EmergencyLine helpline={{ number: emergencyLine.split(" ")[0], label: emergencyLine.split("(")[1]?.replace(")", "") || emergencyLine }} />
        </div>
      )}

      {/* ── Provider Info ── */}
      {selectedProvider && (
        <div className={styles.providerStrip}>
          <div className={styles.providerLeft}>
            <span className={styles.providerIcon}>👨‍🔧</span>
            <div>
              <p className={styles.providerName}>{selectedProvider.name}</p>
              <p className={styles.providerMeta}>
                📍 {selectedProvider.area} · {selectedProvider.distance_km?.toFixed(1)} km
                {selectedProvider.hasNow && <span className={styles.nowTag}> · 🟢 AVAILABLE NOW</span>}
              </p>
            </div>
          </div>
          <div className={styles.providerRight}>
            <span className={styles.providerPhone}>{selectedProvider.phone}</span>
            <span className={styles.urgentFlag}>⚡ URGENT</span>
          </div>
        </div>
      )}

      {/* ── Crisis Timeline ── */}
      <div className={styles.timelineSection}>
        <p className={styles.timelineTitle}>⚡ Emergency Pipeline</p>
        <div className={styles.timeline}>
          {timelineSteps.slice(0, visibleSteps).map((step, i) => (
            <TimelineStep
              key={step.id}
              step={step}
              animate={i === visibleSteps - 1}
            />
          ))}
        </div>
      </div>

      {/* ── Safety Protocol ── */}
      {protocol && protocol.length > 0 && (
        <ProtocolList steps={protocol} />
      )}

      {/* ── Booking Confirmation Strip ── */}
      {booking && (
        <div className={styles.bookingStrip}>
          <span className={styles.bookingIcon}>✅</span>
          <span className={styles.bookingId}>Emergency Booking: {booking.booking_id}</span>
          <span className={styles.bookingStatus}>CONFIRMED</span>
        </div>
      )}
    </div>
  );
}
