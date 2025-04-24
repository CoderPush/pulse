export function isFormOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 5 = Friday, 1 = Monday, 2 = Tuesday
  const hour = now.getHours();

  // Convert current time to UTC-5
  const utcOffset = -5;
  const currentHour = (hour + utcOffset + 24) % 24;

  // Form opens Friday 5PM UTC-5
  if (day === 5 && currentHour >= 17) {
    return true;
  }

  // Form is open all weekend
  if (day === 6 || day === 0) {
    return true;
  }

  // Form is open Monday until Tuesday 5PM UTC-5
  if (day === 1 || (day === 2 && currentHour < 17)) {
    return true;
  }

  return false;
}

export function getTimeUntilNextWindow(): string {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Convert current time to UTC-5
  const utcOffset = -5;
  const currentHour = (hour + utcOffset + 24) % 24;

  if (!isFormOpen()) {
    // If it's after Tuesday 5PM, next window is Friday 5PM
    if (day > 2 || (day === 2 && currentHour >= 17)) {
      const daysUntilFriday = (5 - day + 7) % 7;
      return `${daysUntilFriday} days until next submission window`;
    }
  }

  // If form is open, return time until close
  if (isFormOpen()) {
    if (day === 2) { // Tuesday
      const hoursUntilClose = 17 - currentHour;
      return `${hoursUntilClose} hours until form closes`;
    }
  }

  return '';
}

export function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
} 