"use client";

// ============================================================
// BookingCard.jsx — Booking confirmation receipt UI
// ============================================================

import styles from "./BookingCard.module.css";

export default function BookingCard({ booking }) {
  if (!booking) return null;

  return (
    <div className={`${styles.card} ${booking.crisis_mode ? styles.crisisCard : ""}`}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>{booking.crisis_mode ? "🚨" : "✅"}</span>
        <div>
          <p className={styles.headerTitle}>
            {booking.crisis_mode ? "EMERGENCY BOOKING CONFIRMED" : "Booking Confirmed!"}
          </p>
          <p className={styles.headerSub}>HaazirAI — Bol do, ho jaaye</p>
        </div>
      </div>

      {/* Booking ID */}
      <div className={styles.bookingId}>
        <span className={styles.idLabel}>Booking ID</span>
        <span className={styles.idValue}>{booking.booking_id}</span>
      </div>

      <div className={styles.divider} />

      {/* Details */}
      <div className={styles.details}>
        <DetailRow label="Service" value={booking.service} icon="🔧" />
        <DetailRow label="Provider" value={booking.provider?.name} icon="👨‍🔧" />
        <DetailRow label="Phone" value={booking.provider?.phone} icon="📞" />
        <DetailRow label="Location" value={booking.provider?.location} icon="📍" />
        <DetailRow label="Your Area" value={booking.user_location} icon="🏠" />
        <DetailRow label="Scheduled" value={booking.scheduled_time} icon="🕐" />
        <DetailRow label="Price" value={booking.agreed_price} icon="💰" />
      </div>

      <div className={styles.divider} />

      {/* Status */}
      <div className={styles.status}>
        <span className={styles.statusDot} />
        <span className={styles.statusText}>Provider ko SMS bhej diya gaya</span>
      </div>

      {/* Reminders note */}
      <p className={styles.reminderNote}>
        ⏰ Reminders scheduled: 1 hour before &amp; 15 minutes before
      </p>
    </div>
  );
}

function DetailRow({ label, value, icon }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon}>{icon}</span>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value || "—"}</span>
    </div>
  );
}
