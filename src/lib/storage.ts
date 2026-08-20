import { useEffect, useState } from "react";

export type ChallengeConfig = {
  startDate: string; // ISO date string YYYY-MM-DD
  exerciseTarget: number; // minutes per day
  germanTarget: number; // minutes per day
  savingsTarget: number; // currency units per day
};

export type DayRecord = {
  date: string;
  exerciseMinutes: number;
  germanMinutes: number;
  businessCompleted: boolean;
  businessNote?: string;
  savingsAmount: number;
};

export type ChallengeSettings = {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  reminderTimes: {
    exercise: string;
    german: string;
    business: string;
    savings: string;
  };
};

export type ChallengeData = {
  version: 1;
  onboardingCompleted: boolean;
  config: ChallengeConfig;
  records: Record<string, DayRecord>;
  longestStreak: number;
  achievements: string[];
  settings: ChallengeSettings;
};

export const STORAGE_KEY = "challenge365-data";

export const DEFAULT_CONFIG: ChallengeConfig = {
  startDate: new Date().toISOString().split("T")[0] ?? "",
  exerciseTarget: 60,
  germanTarget: 180,
  savingsTarget: 300,
};

const DEFAULT_SETTINGS: ChallengeSettings = {
  theme: "system",
  notificationsEnabled: false,
  reminderTimes: {
    exercise: "08:00",
    german: "10:00",
    business: "14:00",
    savings: "20:00",
  },
};

function createDefaultData(): ChallengeData {
  return {
    version: 1,
    onboardingCompleted: false,
    config: DEFAULT_CONFIG,
    records: {},
    longestStreak: 0,
    achievements: [],
    settings: DEFAULT_SETTINGS,
  };
}

export function loadChallengeData(): ChallengeData {
  if (typeof window === "undefined") return createDefaultData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as ChallengeData;
    // Fill defaults for missing fields to stay resilient.
    return {
      ...createDefaultData(),
      ...parsed,
      config: { ...DEFAULT_CONFIG, ...parsed.config },
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings, reminderTimes: { ...DEFAULT_SETTINGS.reminderTimes, ...parsed.settings?.reminderTimes } },
    };
  } catch {
    return createDefaultData();
  }
}

export function saveChallengeData(data: ChallengeData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (e.g., private mode).
  }
}

export function exportBackup(): string {
  return JSON.stringify(loadChallengeData(), null, 2);
}

export function importBackup(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as ChallengeData;
    if (!parsed || parsed.version !== 1 || typeof parsed.records !== "object") return false;
    const base = createDefaultData();
    saveChallengeData({
      ...base,
      ...parsed,
      config: { ...base.config, ...(parsed.config ?? {}) },
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      records: parsed.records ?? {},
      achievements: parsed.achievements ?? [],
    });
    refreshChallengeData();
    return true;
  } catch {
    return false;
  }
}

export function backupFileName(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `challenge365-backup-${stamp}.json`;
}

export function resetChallengeData() {
  saveChallengeData(createDefaultData());
  refreshChallengeData();
}

export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function formatDateLabel(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------- Day record helpers ----------------

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(date: string): Date {
  return new Date(date + "T00:00:00");
}

/** Date key for a 1-based challenge day number. */
export function dateForDayNumber(startDate: string, dayNumber: number): string {
  const d = parseDateKey(startDate);
  d.setDate(d.getDate() + (dayNumber - 1));
  return toDateKey(d);
}

/** 1-based challenge day number for a date key (can be <1 or >365). */
export function dayNumberForDate(startDate: string, date: string): number {
  const diff = parseDateKey(date).getTime() - parseDateKey(startDate).getTime();
  return Math.floor(diff / 86400000) + 1;
}

export type DayStatus = "completed" | "partial" | "missed" | "today" | "future";

export function getDayStatus(data: ChallengeData, date: string, todayKey: string): DayStatus {
  const record = getDayRecord(data, date);
  const progress = getDayProgress(record, data.config);
  if (date === todayKey) return "today";
  if (date > todayKey) return "future";
  if (progress === 100) return "completed";
  if (progress > 0) return "partial";
  return "missed";
}

export function emptyRecord(date: string): DayRecord {
  return {
    date,
    exerciseMinutes: 0,
    germanMinutes: 0,
    businessCompleted: false,
    businessNote: "",
    savingsAmount: 0,
  };
}

export function getDayRecord(data: ChallengeData, date: string): DayRecord {
  return { ...emptyRecord(date), ...data.records[date] };
}

export function getGoalStatus(record: DayRecord, config: ChallengeConfig) {
  return {
    exercise: record.exerciseMinutes >= config.exerciseTarget,
    german: record.germanMinutes >= config.germanTarget,
    business: record.businessCompleted,
    savings: record.savingsAmount >= config.savingsTarget,
  };
}

export function getDayProgress(record: DayRecord, config: ChallengeConfig): number {
  const s = getGoalStatus(record, config);
  return (Number(s.exercise) + Number(s.german) + Number(s.business) + Number(s.savings)) * 25;
}

export function isDayCompleted(record: DayRecord, config: ChallengeConfig): boolean {
  return getDayProgress(record, config) === 100;
}

/** Persist (or clear) a single day's record. Empty days are removed to keep storage small. */
export function setDayRecord(data: ChallengeData, record: DayRecord): ChallengeData {
  const isEmpty =
    !record.exerciseMinutes &&
    !record.germanMinutes &&
    !record.businessCompleted &&
    !record.savingsAmount &&
    !record.businessNote?.trim();

  const records = { ...data.records };
  if (isEmpty) delete records[record.date];
  else records[record.date] = record;

  return { ...data, records };
}

// ---------------- Reactive store (shared + cross-tab) ----------------

let store: ChallengeData | null = null;
const listeners = new Set<(d: ChallengeData) => void>();

function getStore(): ChallengeData {
  if (!store) store = loadChallengeData();
  return store;
}

function setStore(next: ChallengeData, persist = true) {
  store = next;
  if (persist) saveChallengeData(next);
  listeners.forEach((l) => l(next));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) setStore(loadChallengeData(), false);
  });
}

/** Reload from localStorage into the shared store (use after import/reset). */
export function refreshChallengeData() {
  setStore(loadChallengeData(), false);
}

export function useChallengeData() {
  // Start from defaults on the server / first render, hydrate in an effect.
  const [data, setData] = useState<ChallengeData>(createDefaultData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(getStore());
    setHydrated(true);
    const listener = (d: ChallengeData) => setData(d);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const update = (updater: (prev: ChallengeData) => ChallengeData) => {
    setStore(updater(getStore()));
  };

  const updateDay = (date: string, updater: (prev: DayRecord) => DayRecord) => {
    const current = getStore();
    setStore(setDayRecord(current, updater(getDayRecord(current, date))));
  };

  return { data, update, updateDay, hydrated };
}

// ---------------- Streaks ----------------

function shiftDate(date: string, days: number): string {
  const d = parseDateKey(date);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** A day counts only when all four goals are completed. */
export function isDateCompleted(data: ChallengeData, date: string): boolean {
  return isDayCompleted(getDayRecord(data, date), data.config);
}

/**
 * Current streak: consecutive fully-completed days ending today.
 * Today still in progress does not break the streak (we count back from yesterday).
 */
export function getCurrentStreak(data: ChallengeData, todayKey: string): number {
  let cursor = isDateCompleted(data, todayKey) ? todayKey : shiftDate(todayKey, -1);
  let streak = 0;
  while (cursor >= data.config.startDate && isDateCompleted(data, cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive completed days across all records. */
export function getLongestStreak(data: ChallengeData): number {
  const dates = Object.keys(data.records)
    .filter((d) => isDateCompleted(data, d))
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of dates) {
    run = prev && shiftDate(prev, 1) === date ? run + 1 : 1;
    if (run > best) best = run;
    prev = date;
  }
  return best;
}

export type StreakInfo = { current: number; longest: number };

export function getStreaks(data: ChallengeData, todayKey: string): StreakInfo {
  const current = getCurrentStreak(data, todayKey);
  const longest = Math.max(data.longestStreak ?? 0, getLongestStreak(data), current);
  return { current, longest };
}
