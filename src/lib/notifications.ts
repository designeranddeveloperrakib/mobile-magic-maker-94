import { useEffect, useState } from "react";
import {
  getDayRecord,
  getGoalStatus,
  toDateKey,
  useChallengeData,
  type ReminderKey,
} from "@/lib/storage";

export const REMINDER_LABELS: Record<ReminderKey, { title: string; body: string }> = {
  exercise: { title: "🏋️ Exercise time", body: "Get your 60 minutes in today." },
  german: { title: "🇩🇪 German learning", body: "Time for your 3 hours of German." },
  business: { title: "💼 Business", body: "Did you work on your business today?" },
  savings: { title: "💰 Savings", body: "Put aside today's ৳300." },
};

export const REMINDER_ORDER: ReminderKey[] = ["exercise", "german", "business", "savings"];

const FIRED_KEY = "challenge365-reminders-fired";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function readFired(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(FIRED_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function markFired(key: ReminderKey, date: string) {
  const fired = readFired();
  fired[key] = date;
  try {
    window.localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
  } catch {
    // ignore
  }
}

function nowHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Fires local reminders while the app is open. A reminder fires at most once per
 * day, only if enabled, permission is granted, and the goal is not yet completed.
 */
export function useReminderScheduler() {
  const { data, hydrated } = useChallengeData();

  useEffect(() => {
    if (!hydrated) return;
    if (!notificationsSupported()) return;
    const settings = data.settings;
    if (!settings.notificationsEnabled) return;

    const tick = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const today = toDateKey(now);
      const current = nowHm(now);
      const record = getDayRecord(data, today);
      const status = getGoalStatus(record, data.config);
      const fired = readFired();

      for (const key of REMINDER_ORDER) {
        if (!settings.reminderEnabled[key]) continue;
        if (status[key]) continue;
        if (settings.reminderTimes[key] !== current) continue;
        if (fired[key] === today) continue;
        markFired(key, today);
        try {
          new Notification(REMINDER_LABELS[key].title, {
            body: REMINDER_LABELS[key].body,
            tag: `challenge365-${key}-${today}`,
          });
        } catch {
          // ignore
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [hydrated, data]);
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => {
    setPermission(getPermission());
  }, []);
  return { permission, setPermission };
}
