// Input validation for the create / edit event form.

export const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 60,
  DESCRIPTION_MAX: 300,
};

/**
 * Validates the form values and returns an object of error messages.
 * An empty object means everything is valid.
 *
 * requireFuture: true for new events (or when the date/time was changed),
 *                false when editing an old event without touching its date.
 */
export function validateEvent({ name, description, dateTime, reminderMinutes, requireFuture }) {
  const errors = {};

  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    errors.name = 'Event name is required.';
  } else if (trimmedName.length < LIMITS.NAME_MIN) {
    errors.name = `Name must be at least ${LIMITS.NAME_MIN} characters.`;
  } else if (trimmedName.length > LIMITS.NAME_MAX) {
    errors.name = `Name must be at most ${LIMITS.NAME_MAX} characters.`;
  }

  if ((description || '').trim().length > LIMITS.DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${LIMITS.DESCRIPTION_MAX} characters.`;
  }

  const validDate = dateTime instanceof Date && !isNaN(dateTime.getTime());
  if (!validDate) {
    errors.dateTime = 'Please choose a valid date and time.';
  } else if (requireFuture && dateTime.getTime() <= Date.now()) {
    errors.dateTime = 'Event date and time must be in the future.';
  }

  // The reminder itself must still be in the future, otherwise it would never fire.
  if (validDate && requireFuture && reminderMinutes !== null && reminderMinutes !== undefined) {
    const reminderAt = dateTime.getTime() - reminderMinutes * 60 * 1000;
    if (reminderAt <= Date.now()) {
      errors.reminder = 'That reminder time has already passed. Choose a shorter reminder.';
    }
  }

  return errors;
}
