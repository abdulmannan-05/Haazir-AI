"use client";

// ============================================================
// CrisisAlert.jsx — Full-screen red overlay + persistent banner
// Enhanced: animated overlay with countdown, danger type label,
//           pulsing border, safety tip, emergency call button
// ============================================================

import { useEffect, useState } from "react";
import styles from "./CrisisAlert.module.css";

const CRISIS_TYPE_LABELS = {
  fire:         { icon: "🔥", label: "Fire / Smoke" },
  gas_leak:     { icon: "⚠️", label: "Gas Leak" },
  pipe_burst:   { icon: "💧", label: "Pipe Burst / Flood" },
  electrical:   { icon: "⚡", label: "Electrical Hazard" },
  water_damage: { icon: "💧", label: "Water Damage" },
  general:      { icon: "🚨", label: "Emergency" },
};

export default function CrisisAlert({
  active,
  safetyTip,
  crisisType = "general",
  emergencyLine,
  onDismiss,
}) {
  const [phase, setPhase] = useState("idle"); // "overlay" → "banner" → "idle"
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }

    // Phase 1: full-screen overlay (3s with countdown)
    setPhase("overlay");
    setCountdown(3);

    const countInterval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countInterval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    const overlayTimer = setTimeout(() => {
      setPhase("banner");
    }, 3000);

    return () => {
      clearTimeout(overlayTimer);
      clearInterval(countInterval);
    };
  }, [active]);

  if (!active || phase === "idle") return null;

  const typeConfig = CRISIS_TYPE_LABELS[crisisType] || CRISIS_TYPE_LABELS.general;

  return (
    <>
      {/* ── Full-screen flash overlay ────────────────────────── */}
      {phase === "overlay" && (
        <div className={styles.overlay} role="alertdialog" aria-label="Crisis Mode Active">
          <div className={styles.overlayInner}>
            <div className={styles.overlayPulseRing} />

            <span className={styles.overlayTypeIcon}>{typeConfig.icon}</span>
            <h2 className={styles.overlayTitle}>🚨 CRISIS MODE ACTIVE</h2>
            <p className={styles.overlayType}>{typeConfig.label} Detected</p>

            <div className={styles.overlayStatus}>
              <div className={styles.statusRow}>
                <span className={styles.statusDot} />
                <span>Fast-tracking emergency response...</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusDot} />
                <span>Pre-selecting nearest available provider...</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusDot} />
                <span>Sending URGENT alert to provider...</span>
              </div>
            </div>

            <div className={styles.countdown}>
              <div className={styles.countdownRing}>
                <span className={styles.countdownNum}>{countdown}</span>
              </div>
              <span className={styles.countdownLabel}>Auto-proceeding</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent top banner ────────────────────────────── */}
      {phase === "banner" && (
        <div className={styles.banner} role="alert" id="crisis-banner">
          <span className={styles.bannerPulse} />

          <span className={styles.bannerIcon}>{typeConfig.icon}</span>

          <div className={styles.bannerBody}>
            <div className={styles.bannerTopRow}>
              <strong className={styles.bannerTitle}>
                🚨 CRISIS MODE — {typeConfig.label}
              </strong>
              {emergencyLine && (
                <a href={`tel:${emergencyLine.split(" ")[0]}`} className={styles.callBtn}>
                  📞 {emergencyLine}
                </a>
              )}
            </div>
            {safetyTip && (
              <p className={styles.safetyTip}>{safetyTip}</p>
            )}
          </div>

          <button
            className={styles.dismissBtn}
            onClick={onDismiss}
            id="crisis-dismiss-btn"
            aria-label="Dismiss crisis banner"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
