// ============================================================
// bookingStore.js — In-memory booking state management
// ============================================================

// In-browser singleton store (resets on page refresh — intentional for demo)
let store = {
  bookings: [],
  reminders: [],
};

/**
 * Generates a booking ID in format: HAZ-YYYYMMDD-XXXX
 * @returns {string}
 */
function generateBookingId() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `HAZ-${datePart}-${randomPart}`;
}

/**
 * Resets the entire store — clears all bookings and reminders.
 * Call this to reset state without a page refresh.
 */
export function resetStore() {
  store = { bookings: [], reminders: [] };
}

/**
 * Creates a new booking and stores it in memory.
 * @param {Object} data
 * @returns {Object} Created booking record
 */
export function createBooking(data) {
  const booking = {
    booking_id: generateBookingId(),
    status: "CONFIRMED",
    service: data.service || "",
    provider: data.provider || {},
    user_location: data.user_location || "",
    scheduled_time: data.scheduled_time || "",
    agreed_price: data.agreed_price || "",
    created_at: new Date().toISOString(),
    reminders_scheduled: ["1_hour_before", "15_min_before"],
    crisis_mode: data.crisis_mode || false,
  };

  store.bookings.push(booking);
  return booking;
}

/**
 * Retrieves a booking by ID.
 * @param {string} bookingId
 * @returns {Object | undefined}
 */
export function getBooking(bookingId) {
  return store.bookings.find((b) => b.booking_id === bookingId);
}

/**
 * Returns all bookings.
 * @returns {Object[]}
 */
export function getAllBookings() {
  return [...store.bookings];
}

/**
 * Adds a reminder entry.
 * @param {Object} reminder
 */
export function addReminder(reminder) {
  store.reminders.push(reminder);
}

/**
 * Returns all reminders for a booking.
 * @param {string} bookingId
 * @returns {Object[]}
 */
export function getReminders(bookingId) {
  return store.reminders.filter((r) => r.booking_id === bookingId);
}
