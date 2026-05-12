"use client";

// ============================================================
// ConfirmationPrompt.jsx — Step 5 interactive breakpoint UI
//
// Shown inside the chat after providers are recommended.
// User MUST interact before pipeline continues to booking.
// ============================================================

import styles from "./ConfirmationPrompt.module.css";

export default function ConfirmationPrompt({ topProvider, ranked, onConfirm, onCancel, onBargain }) {
  if (!topProvider) return null;

  return (
    <div className={styles.card}>
      <p className={styles.question}>
        Kaunsa provider book karoon?
      </p>

      {/* Quick-confirm buttons for each ranked provider */}
      <div className={styles.providerBtns}>
        {ranked.map((p, i) => (
          <button
            key={p.id}
            id={`confirm-provider-${p.id}`}
            className={`${styles.providerBtn} ${i === 0 ? styles.providerBtnTop : ""}`}
            onClick={() => onConfirm(p)}
          >
            <span className={styles.providerBtnRank}>#{i + 1}</span>
            <span className={styles.providerBtnName}>{p.name}</span>
            <span className={styles.providerBtnPrice}>
              PKR {p.base_price_pkr.min.toLocaleString()}+
            </span>
          </button>
        ))}
      </div>

      {/* Or type instruction */}
      <p className={styles.hint}>
        Ya chat mein type karein: <strong>&ldquo;Haan&rdquo;</strong> (top pick confirm) ·{" "}
        <strong>&ldquo;2&rdquo;</strong> / <strong>&ldquo;3&rdquo;</strong> (doosra option) ·{" "}
        <strong>&ldquo;Thora kam karo&rdquo;</strong> (bargain) ·{" "}
        <strong>&ldquo;Nahi&rdquo;</strong> (cancel)
      </p>

      {/* Action row */}
      <div className={styles.actions}>
        <button
          id="bargain-trigger-btn"
          className={styles.bargainBtn}
          onClick={onBargain}
        >
          🤝 Price Bargain Karo
        </button>
        <button
          id="cancel-booking-btn"
          className={styles.cancelBtn}
          onClick={onCancel}
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  );
}
