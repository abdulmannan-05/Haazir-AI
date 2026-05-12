"use client";

import { useEffect, useState } from "react";
import styles from "./BargainingModal.module.css";

export default function BargainingModal({ bargainResult, onAccept, onClose }) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!bargainResult) return;
    setVisibleLines(0);
    const total = bargainResult.negotiation_transcript.length;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= total) clearInterval(interval);
    }, 1200);
    return () => clearInterval(interval);
  }, [bargainResult]);

  if (!bargainResult) return null;

  const {
    outcome,
    agreed_price,
    negotiation_transcript,
    user_target_price,
    provider_min_price,
    listed_price
  } = bargainResult;

  const leftPrice = user_target_price || agreed_price || 0;
  const rightPrice = provider_min_price || listed_price || agreed_price || 1;
  const range = rightPrice - leftPrice;
  let dealRatio = range > 0 ? (agreed_price - leftPrice) / range : 0.5;
  dealRatio = Math.max(0, Math.min(1, dealRatio));

  const totalLines = negotiation_transcript.length;
  let currentRatio = 0.05;
  if (visibleLines > 0 && visibleLines < totalLines) {
    currentRatio = 0.35;
  } else if (visibleLines >= totalLines) {
    currentRatio = dealRatio;
  }
  const targetPercent = currentRatio * 100;

  const outcomeLabel = {
    accepted: { text: "✅ Deal accepted!", color: "#25D366" },
    partial_accept: { text: "🤝 Counter-offer accepted!", color: "#FFA500" },
    declined: { text: "❌ Provider declined — listed price applies", color: "#FF3B30" },
  }[outcome] || { text: "🤝 Deal concluded", color: "#25D366" };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.modal} glass-panel`} style={{ transition: "all 0.4s ease" }}>
        <div className={styles.header}>
          <span className={styles.title}>🥊 Visual Tug-of-War Bargaining</span>
          <button className={styles.closeBtn} onClick={onClose} id="bargain-close-btn">✕</button>
        </div>

        <div className={styles.tugContainer}>
          <div className={styles.tugLabels}>
            <div className={styles.labelUser}>
              <span className={styles.labelSub}>User Anchor</span>
              <span className={styles.labelVal}>PKR {leftPrice.toLocaleString()}</span>
            </div>
            <div className={styles.labelDeal} style={{ opacity: visibleLines >= totalLines ? 1 : 0.4 }}>
              <span className={styles.labelSubDeal}>Agreed Deal</span>
              <span className={styles.labelValDeal}>PKR {agreed_price?.toLocaleString()}</span>
            </div>
            <div className={styles.labelProvider}>
              <span className={styles.labelSub}>Listed Rate</span>
              <span className={styles.labelVal}>PKR {rightPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.trackWrapper}>
            <div className={styles.trackBg}>
              <div
                className={styles.trackFillGreen}
                style={{ width: `${targetPercent}%`, transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />
              <div
                className={styles.trackFillRed}
                style={{ width: `${100 - targetPercent}%`, transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />
            </div>

            <div
              className={styles.thumbDot}
              style={{ left: `${targetPercent}%`, transition: "left 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              <span className={styles.thumbPulse} />
              <span className={styles.thumbInner} />
            </div>
          </div>
        </div>

        <div className={styles.transcript}>
          {negotiation_transcript.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`${styles.line} ${line.from === "user" ? styles.lineUser : styles.lineProvider}`}
              style={{ animation: "fadeIn 0.3s ease" }}
            >
              <span className={styles.lineFrom}>
                {line.from === "user" ? "👤 You:" : line.from === "system" ? "⚠️ Advisory:" : "👨‍🔧 Provider:"}
              </span>
              <span className={styles.lineText}>{line.text}</span>
            </div>
          ))}

          {visibleLines < totalLines && (
            <div className={styles.typing}>
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {visibleLines >= totalLines && (
          <div className={styles.outcome} style={{ borderColor: outcomeLabel.color, animation: "fadeIn 0.4s ease" }}>
            <p style={{ color: outcomeLabel.color }}>{outcomeLabel.text}</p>
            <div className={styles.outcomeActions}>
              <button
                className={styles.acceptBtn}
                onClick={() => onAccept(agreed_price)}
                id="bargain-accept-btn"
              >
                Confirm Deal @ PKR {agreed_price?.toLocaleString()}
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
