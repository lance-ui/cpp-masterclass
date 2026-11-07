import { readStoredValue, writeStoredValue } from "@/utils/storage";

export type ActivityMap = Record<string, number>;

const isActivityMap = (value: unknown): value is ActivityMap =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((v) => typeof v === "number" && Number.isFinite(v));

function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function activityStorageKey(userId: string): string {
  return `activity:${userId}`;
}

/** Record a learning event for today without touching the User blob. */
export function recordActivity(userId: string): void {
  if (!userId) return;
  const key = activityStorageKey(userId);
  const map = { ...readStoredValue(key, {} as ActivityMap, isActivityMap) };
  const today = dayKey();
  map[today] = (map[today] ?? 0) + 1;

  // Keep ~90 days so streaks remain meaningful without unbounded growth
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffKey = dayKey(cutoff);
  for (const k of Object.keys(map)) {
    if (k < cutoffKey) delete map[k];
  }

  writeStoredValue(key, map);
}

export function readActivity(userId: string): ActivityMap {
  if (!userId) return {};
  return readStoredValue(
    activityStorageKey(userId),
    {} as ActivityMap,
    isActivityMap,
  );
}

export function getLast7DaysActivity(
  userId: string,
): { date: string; label: string; count: number }[] {
  const map = readActivity(userId);
  const days: { date: string; label: string; count: number }[] = [];
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    days.push({
      date: key,
      label: labels[d.getDay()] ?? "—",
      count: map[key] ?? 0,
    });
  }
  return days;
}

/** Consecutive days with activity ending today or yesterday. */
export function getActivityStreak(userId: string): number {
  const map = readActivity(userId);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  // If nothing today, allow streak to continue from yesterday
  if (!(map[dayKey(cursor)] > 0)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!(map[dayKey(cursor)] > 0)) return 0;
  }

  while (map[dayKey(cursor)] > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
