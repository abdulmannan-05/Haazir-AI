"use client";

// ============================================================
// BargainingModal.jsx — Live negotiation transcript UI
// ============================================================

import { useEffect, useState } from "react";
import styles from "./BargainingModal.module.css";

export default function BargainingModal({ bargainResult, onAccept, onClose }) {
  const [visibleLines, setVisibleLines] = useState(0);

  // Animate transcript lines appearing one by one
  useEffect(() => {
    if (!bargainResult) return;
    setVisibleLines(0);
    const total = bargainResult.negotiation_transcript.length;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= total) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [bargainResult]);

  if (!bargainResult) return null;

  const { outcome, listed_price, agreed_price, negotiation_transcript } = bargainResult;

  const outcomeLabel = {
    accepted: { text: "✅ Deal accepted!", color: "#25D366" },
    partial_accept: { text: "🤝 Counter-offer accepted!", color: "#FFA500" },
    declined: { text: "❌ Provider declined — original price applies", color: "#FF3B30" },
  }[outcome];

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>🤝 Live Bargaining</span>
          <button className={styles.closeBtn} onClick={onClose} id="bargain-close-btn">✕</button>
        </div>

        {/* Price summary */}
        <div className={styles.priceRow}>
          <div className={styles.priceBox}>
            <span className={styles.priceLabel}>Listed</span>
            <span className={styles.priceVal}>PKR {listed_price?.toLocaleString()}</span>
          </div>
          <span className={styles.arrow}>→</span>
          <div className={styles.priceBox}>
            <span className={styles.priceLabel}>Agreed</span>
            <span className={`${styles.priceVal} ${styles.agreedPrice}`}>
              PKR {agreed_price?.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Transcript */}
        <div className={styles.transcript}>
          {negotiation_transcript.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`${styles.line} ${line.from === "user" ? styles.lineUser : styles.lineProvider}`}
            >
              <span className={styles.lineFrom}>
                {line.from === "user" ? "👤 You:" : "👨‍🔧 Provider:"}
              </span>
              <span className={styles.lineText}>{line.text}</span>
            </div>
          ))}

          {visibleLines < negotiation_transcript.length && (
            <div className={styles.typing}>
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {/* Outcome */}
        {visibleLines >= negotiation_transcript.length && (
          <div className={styles.outcome} style={{ borderColor: outcomeLabel.color }}>
            <p style={{ color: outcomeLabel.color }}>{outcomeLabel.text}</p>
            <div className={styles.outcomeActions}>
              <button
                className={styles.acceptBtn}
                onClick={() => onAccept(agreed_price)}
                id="bargain-accept-btn"
              >
                Confirm Booking @ PKR {agreed_price?.toLocaleString()}
              </button>
              <button className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
