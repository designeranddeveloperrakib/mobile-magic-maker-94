import {
  type ChallengeData,
  getDayRecord,
  isDayCompleted,
  getStreaks,
  toDateKey,
} from "./storage";

export type ChallengeTotals = {
  completedDays: number;
  exerciseMinutes: number;
  germanMinutes: number;
  businessDays: number;
  savings: number;
  currentStreak: number;
  longestStreak: number;
};

export function getChallengeTotals(data: ChallengeData, todayKey = toDateKey(new Date())): ChallengeTotals {
  let completedDays = 0;
  let exerciseMinutes = 0;
  let germanMinutes = 0;
  let businessDays = 0;
  let savings = 0;

  for (let i = 1; i <= 365; i++) {
    const d = new Date(data.config.startDate + "T00:00:00");
    d.setDate(d.getDate() + (i - 1));
    const key = toDateKey(d);
    if (key > todayKey) break;
    const record = getDayRecord(data, key);
    exerciseMinutes += record.exerciseMinutes || 0;
    germanMinutes += record.germanMinutes || 0;
    savings += record.savingsAmount || 0;
    if (record.businessCompleted) businessDays += 1;
    if (isDayCompleted(record, data.config)) completedDays += 1;
  }

  const streaks = getStreaks(data, todayKey);

  return {
    completedDays,
    exerciseMinutes,
    germanMinutes,
    businessDays,
    savings,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
}

export type Achievement = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  group: "Milestones" | "Streaks" | "Exercise" | "German" | "Savings";
  progress: number; // 0..1
  current: number;
  goal: number;
  unlocked: boolean;
};

function make(
  id: string,
  emoji: string,
  title: string,
  description: string,
  group: Achievement["group"],
  current: number,
  goal: number,
): Achievement {
  const progress = goal > 0 ? Math.min(1, current / goal) : 0;
  return { id, emoji, title, description, group, progress, current, goal, unlocked: current >= goal };
}

export function getAchievements(totals: ChallengeTotals): Achievement[] {
  const exerciseHours = totals.exerciseMinutes / 60;
  const germanHours = totals.germanMinutes / 60;

  return [
    make("first-day", "🏁", "First Day", "Complete Day 1", "Milestones", totals.completedDays, 1),
    make("days-30", "📅", "30 Days", "Complete 30 challenge days", "Milestones", totals.completedDays, 30),
    make("days-100", "🏆", "100 Days", "Complete 100 challenge days", "Milestones", totals.completedDays, 100),
    make("days-365", "👑", "365 Days Completed", "Complete all 365 days", "Milestones", totals.completedDays, 365),

    make("streak-7", "🔥", "7-Day Streak", "7 perfect days in a row", "Streaks", totals.longestStreak, 7),
    make("streak-30", "🔥", "30-Day Streak", "30 perfect days in a row", "Streaks", totals.longestStreak, 30),

    make("exercise-100", "💪", "100 Exercise Hours", "Log 100 hours of exercise", "Exercise", exerciseHours, 100),
    make("german-100", "🇩🇪", "100 German Hours", "Log 100 hours of German study", "German", germanHours, 100),

    make("savings-10k", "💰", "৳10,000 Saved", "Reach ৳10,000 in savings", "Savings", totals.savings, 10000),
    make("savings-50k", "💰", "৳50,000 Saved", "Reach ৳50,000 in savings", "Savings", totals.savings, 50000),
    make("savings-100k", "💰", "৳100,000 Saved", "Reach ৳100,000 in savings", "Savings", totals.savings, 100000),
  ];
}

export function formatAchievementProgress(a: Achievement): string {
  const fmt = (n: number) =>
    a.group === "Savings"
      ? `৳${Math.round(n).toLocaleString("en-BD")}`
      : a.group === "Exercise" || a.group === "German"
        ? `${n.toFixed(n < 10 ? 1 : 0)} hr`
        : `${Math.floor(n)}`;
  return `${fmt(Math.min(a.current, a.goal))} / ${fmt(a.goal)}`;
}
