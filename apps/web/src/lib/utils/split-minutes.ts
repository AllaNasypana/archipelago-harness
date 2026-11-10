export interface HoursAndMinutes {
  hours: number;
  minutes: number;
}

/** Splits a whole-minute duration (Contribution time, tracked totals) into hours and minutes. */
export function splitMinutes(totalMinutes: number): HoursAndMinutes {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0) {
    throw new RangeError(`Expected a non-negative whole number of minutes, got ${totalMinutes}`);
  }

  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
