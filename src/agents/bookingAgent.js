// ============================================================
// bookingAgent.js — Step 7: Create and confirm booking
// ============================================================

import { createBooking } from "@/utils/bookingStore";

/**
 * Runs the booking simulation for the selected provider.
 *
 * @param {Object} provider - Top-ranked / selected provider
 * @param {Object} intent - Structured intent from IntentAgent
 * @param {number|null} agreedPrice - Price after bargaining (or base price)
 * @param {boolean} isCrisis
 * @returns {{ booking: Object, trace: Object }}
 */
export function runBookingAgent(provider, intent, agreedPrice = null, isCrisis = false) {
  const startTime = Date.now();

  const priceToUse = agreedPrice || provider.base_price_pkr.min;
  const slot = isCrisis
    ? "RIGHT NOW — Emergency"
    : provider.available_slots?.[0] || intent.time_preference;

  const booking = createBooking({
    service: intent.service_type,
    provider: {
      name: provider.name,
      phone: provider.phone,
      location: `${provider.area}, ${provider.city}`,
    },
    user_location: intent.location,
    scheduled_time: slot,
    agreed_price: `PKR ${priceToUse.toLocaleString()}`,
    crisis_mode: isCrisis,
  });

  // Simulate SMS notification to provider
  const providerSms = `[HaazirAI] New ${isCrisis ? "URGENT " : ""}booking: ${intent.service_type} at ${intent.location}. Time: ${slot}. Customer will be notified. Booking: ${booking.booking_id}`;

  // Simulate confirmation to user
  const userConfirmation = `✅ Booking confirmed! ${provider.name} ko message bhej diya. ID: ${booking.booking_id}`;

  const duration = Date.now() - startTime;

  const trace = {
    step: "BOOKING",
    agent: "BookingAgent",
    input_summary: `Provider: ${provider.name} | Service: ${intent.service_type} | Crisis: ${isCrisis}`,
    output_summary: `Booking created: ${booking.booking_id} | Slot: ${slot}`,
    tools_used: ["create_booking", "send_notification"],
    duration_ms: duration,
    reasoning: `Generated booking ID using HAZ-YYYYMMDD-XXXX format. Simulated SMS to provider and WhatsApp confirmation to user.`,
    confidence: 1.0,
    simulated_sms: providerSms,
    simulated_user_msg: userConfirmation,
  };

  return { booking, trace };
}
