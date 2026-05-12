// ============================================================
// followupAgent.js — Step 8: Generate follow-up reminder timeline
//
// CONSTRAINT: No automatic timers (setTimeout/setInterval).
// Arrival (R3) and Job Done (R4) stay "pending" until the user
// manually clicks the interactive buttons in ReminderTimeline.
// ============================================================

/**
 * Generates a structured follow-up reminder timeline for a booking.
 * All milestones are STATIC — no timers, no auto-updates.
 * R3 and R4 require manual user confirmation via UI buttons.
 *
 * @param {Object} booking - Confirmed booking from BookingAgent
 * @returns {{ reminders: Object[], trace: Object }}
 */
export function runFollowupAgent(booking) {
  const startTime = Date.now();
  const providerName = booking.provider?.name || "Provider";

  const reminders = [
    {
      id: "R1",
      stage: "1_hour_before",
      label: "T-1 Hour",
      icon: "⏰",
      status: "scheduled",       // Scheduled — simulated notification
      interactive: false,        // No button needed
      message: `⏰ Reminder: ${providerName} 1 ghante mein aa raha hai. Address confirm kar lein: ${booking.user_location}`,
      time_offset: "-1hr",
    },
    {
      id: "R2",
      stage: "15_min_before",
      label: "T-15 Mins",
      icon: "🔔",
      status: "scheduled",
      interactive: false,
      message: `🔔 ${providerName} 15 minute mein pohonch raha hai!`,
      time_offset: "-15min",
    },
    {
      id: "R3",
      stage: "arrival",
      label: "Arrival",
      icon: "✅",
      status: "pending",         // STAYS PENDING until user clicks button
      interactive: true,         // Shows "Confirm Arrival" button
      actionLabel: "Confirm Arrival",
      actionId: "confirm-arrival-btn",
      message: `✅ ${providerName} pohonch gaya — kaam shuru ho gaya`,
      time_offset: "0",
    },
    {
      id: "R4",
      stage: "job_complete",
      label: "Job Done",
      icon: "🌟",
      status: "pending",         // STAYS PENDING until user clicks button
      interactive: true,         // Shows "Mark as Done" button
      actionLabel: "Mark as Done",
      actionId: "mark-done-btn",
      message: `🌟 Kaam complete! ${providerName} ko rate karein (1–5 stars)`,
      time_offset: "+job_done",
      dependsOn: "R3",           // Only enabled after R3 is confirmed
    },
  ];

  const duration = Date.now() - startTime;

  const trace = {
    step: "FOLLOW_UP",
    agent: "FollowupAgent",
    input_summary: `Booking: ${booking.booking_id} | Provider: ${providerName}`,
    output_summary: `4 milestones created. R1/R2 scheduled. R3/R4 PENDING user confirmation (no auto-timers).`,
    tools_used: ["schedule_reminder", "notification_sim"],
    duration_ms: duration,
    reasoning:
      "Generated 4-stage timeline. R1 & R2 are simulated-scheduled notifications. " +
      "R3 (Arrival) and R4 (Job Done) are INTERACTIVE — they require explicit user button-click to advance. " +
      "No setTimeout or auto-triggers used per ORCHESTRATOR_SKILL constraints.",
    confidence: 1.0,
  };

  return { reminders, trace };
}
