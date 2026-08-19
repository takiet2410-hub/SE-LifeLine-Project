/**
 * Utility functions to check timeslot expiration and validity for campaign booking.
 */

/**
 * Checks if a specific time slot (defined by endTimeStr 'HH:mm') on a specific date (YYYY-MM-DD) has passed.
 */
export function isSlotPassed(dateStr: string, endTimeStr: string): boolean {
  if (!dateStr || !endTimeStr) return false;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // If selected date is in the past
  if (dateStr < todayStr) return true;

  // If selected date is in the future
  if (dateStr > todayStr) return false;

  // If selected date is today: compare current HH:mm with endTimeStr
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  return currentTimeStr >= endTimeStr;
}

/**
 * Checks if ALL timeslots for a location/campaign on a specific date have passed,
 * or if the last timeslot's endTime has passed.
 */
export function areAllSlotsPassedOnDate(
  dateStr: string,
  timeSlots?: Array<{ startTime: string; endTime: string }>
): boolean {
  if (!timeSlots || timeSlots.length === 0) return false;

  // Find the latest endTime among all timeslots
  const lastEndTime = timeSlots.reduce((latest, slot) => {
    return slot.endTime > latest ? slot.endTime : latest;
  }, '00:00');

  return isSlotPassed(dateStr, lastEndTime);
}

/**
 * Finds the first available, non-passed, and non-full timeslot for a location on a specific date.
 */
export function getFirstAvailableSlot(
  dateStr: string,
  timeSlots?: Array<{ startTime: string; endTime: string; capacity: number; registeredCount: number }>
): { startTime: string; endTime: string } | null {
  if (!timeSlots || timeSlots.length === 0) return null;

  const validSlot = timeSlots.find((slot) => {
    const isFull = slot.registeredCount >= slot.capacity;
    const isPassed = isSlotPassed(dateStr, slot.endTime);
    return !isFull && !isPassed;
  });

  return validSlot || null;
}
