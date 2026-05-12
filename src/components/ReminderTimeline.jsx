"use client";

// ============================================================
// ReminderTimeline.jsx — Interactive follow-up schedule
//
// CONSTRAINTS (ORCHESTRATOR_SKILL):
// - R3 (Arrival) and R4 (Job Done) are ALWAYS initially "pending"
// - They advance ONLY when the user clicks the action button
// - R4 is locked (disabled) until R3 is confirmed
// - NO setTimeout or automatic state changes
// ============================================================

import { useState } from "react";
import styles from "./ReminderTimeline.module.css";

function StepDot({ step, confirmed }) {
  const isScheduled  = step.status === "scheduled";
  const isConfirmed  = confirmed;
  const isPending    = !isScheduled && !isConfirmed;

  return (
    <div className={`
      ${styles.dot}
      ${isScheduled  ? styles.dotScheduled  : ""}
      ${isConfirmed  ? styles.dotConfirmed  : ""}
      ${isPending    ? styles.dotPending    : ""}
    `}>
      {step.icon}
    </div>
  );
}

export default function ReminderTimeline({ reminders }) {
  // Track which interactive steps the user has confirmed
  // key: step.id, value: boolean
  const [confirmed, setConfirmed] = useState({});

  if (!reminders || reminders.length === 0) return null;

  const handleConfirm = (step) => {
    setConfirmed((prev) => ({ ...prev, [step.id]: true }));
  };

  const isStepConfirmed  = (id) => !!confirmed[id];
  const isDepSatisfied   = (step) => !step.dependsOn || isStepConfirmed(step.dependsOn);

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>⏰ Follow-up Timeline</h4>
      <div className={styles.timeline}>
        {reminders.map((r, i) => {
          const stepConfirmed = isStepConfirmed(r.id);
          const depOk         = isDepSatisfied(r);

          // Effective status: scheduled | confirmed | pending
          const effectiveStatus = r.status === "scheduled"
            ? "scheduled"
            : stepConfirmed
            ? "confirmed"
            : "pending";

          return (
            <div key={r.id} className={styles.step}>
              {/* Connector line */}
              {i < reminders.length - 1 && (
                <div className={`${styles.connector} ${effectiveStatus === "scheduled" || effectiveStatus === "confirmed" ? styles.connectorActive : ""}`} />
              )}

              <StepDot step={r} confirmed={stepConfirmed} />

              <div className={styles.stepInfo}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepLabel}>{r.label}</span>
                  <span className={`
                    ${styles.stepStatus}
                    ${effectiveStatus === "scheduled"  ? styles.statusScheduled  : ""}
                    ${effectiveStatus === "confirmed"  ? styles.statusConfirmed  : ""}
                    ${effectiveStatus === "pending"    ? styles.statusPending    : ""}
                  `}>
                    {effectiveStatus === "scheduled"  && "✓ Scheduled"}
                    {effectiveStatus === "confirmed"  && "✅ Done"}
                    {effectiveStatus === "pending"    && "⏳ Waiting"}
                  </span>
                </div>

                <span className={styles.stepMsg}>{r.message}</span>

                {/* Interactive action button — only for R3 and R4 */}
                {r.interactive && !stepConfirmed && (
                  <button
                    id={r.actionId}
                    className={`${styles.actionBtn} ${!depOk ? styles.actionBtnDisabled : ""}`}
                    onClick={() => depOk && handleConfirm(r)}
                    disabled={!depOk}
                    title={!depOk ? `First confirm: ${r.dependsOn}` : r.actionLabel}
                  >
                    {r.actionLabel}
                    {!depOk && <span className={styles.lockIcon}> 🔒</span>}
                  </button>
                )}

                {/* Confirmed feedback */}
                {r.interactive && stepConfirmed && (
                  <span className={styles.confirmedTag}>✅ You confirmed this</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating prompt — appears after job done confirmed */}
      {isStepConfirmed("R4") && (
        <div className={styles.ratingPrompt}>
          <p className={styles.ratingTitle}>🌟 Kaam kaisa raha? Rate karein:</p>
          <div className={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={styles.ratingStar} id={`rating-star-${n}`}>
                ★
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
