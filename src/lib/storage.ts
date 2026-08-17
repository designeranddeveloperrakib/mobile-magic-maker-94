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
    if (!parsed || parsed.version !== 1) return false;
    saveChallengeData({ ...createDefaultData(), ...parsed });
    return true;
  } catch {
    return false;
  }
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

export function useChallengeData() {
  const [data, setData] = useState<ChallengeData>(loadChallengeData);

  useEffect(() => {
    setData(loadChallengeData());
  }, []);

  const update = (updater: (prev: ChallengeData) => ChallengeData) => {
    setData((prev) => {
      const next = updater(prev);
      saveChallengeData(next);
      return next;
    });
  };

  return { data, update };
}
