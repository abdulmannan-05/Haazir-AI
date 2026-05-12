"use client";

// ============================================================
// ProviderCard.jsx — Provider listing with score breakdown
// ============================================================

import styles from "./ProviderCard.module.css";

function Stars({ rating }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? styles.starFilled : styles.starEmpty}>
          ★
        </span>
      ))}
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </span>
  );
}

export default function ProviderCard({ provider, rank, onSelect, selected }) {
  const isTopPick = rank === 1;

  return (
    <div
      className={`${styles.card} ${isTopPick ? styles.topPick : ""} ${selected ? styles.selected : ""}`}
      onClick={() => onSelect?.(provider)}
      id={`provider-card-${provider.id}`}
    >
      {/* Rank badge */}
      <div className={styles.rankBadge}>
        {isTopPick ? "🏆 Top Pick" : `#${rank}`}
      </div>

      {/* Provider info */}
      <div className={styles.providerInfo}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{provider.name}</span>
          {provider.verified && <span className={styles.verified}>✓ Verified</span>}
        </div>
        <Stars rating={provider.rating} />
        <p className={styles.meta}>
          📍 {provider.area} · {provider.distance_km} km away · {provider.completed_jobs} jobs
        </p>
      </div>

      {/* Price & slots */}
      <div className={styles.priceSlots}>
        <span className={styles.price}>
          PKR {provider.base_price_pkr.min.toLocaleString()}–{provider.base_price_pkr.max.toLocaleString()}
        </span>
        <div className={styles.slots}>
          {provider.available_slots?.slice(0, 2).map((slot) => (
            <span key={slot} className={`${styles.slot} ${slot.toLowerCase().includes("now") ? styles.slotNow : ""}`}>
              {slot.toLowerCase().includes("now") ? "🟢 " : "🕐 "}{slot}
            </span>
          ))}
        </div>
      </div>

      {/* Score bar */}
      {provider.scores && (
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>Match Score:</span>
          <div className={styles.scoreBar}>
            <div
              className={styles.scoreFill}
              style={{ width: `${Math.min(100, provider.scores.total)}%` }}
            />
          </div>
          <span className={styles.scoreNum}>{provider.scores.total.toFixed(0)}</span>
        </div>
      )}

      {isTopPick && (
        <button className={styles.bookBtn} onClick={() => onSelect?.(provider)}>
          Book Now →
        </button>
      )}
    </div>
  );
}
