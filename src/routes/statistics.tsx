import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatCurrency,
  toDateKey,
  dayNumberForDate,
  getStreaks,
  getDayRecord,
  isDayCompleted,
  useChallengeData,
} from "@/lib/storage";
import { Dumbbell, Languages, Briefcase, PiggyBank, Activity } from "lucide-react";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Challenge 365" },
      {
        name: "description",
        content:
          "See completed days, streaks, exercise hours, German study hours, business days and savings totals for your 365-day challenge.",
      },
      { property: "og:title", content: "Statistics — Challenge 365" },
      {
        property: "og:description",
        content: "Full analytics for your 365-day discipline challenge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Statistics,
});

const MILESTONE = 100000;

function Statistics() {
  const { data, hydrated } = useChallengeData();
  const todayKey = toDateKey(new Date());

  if (!hydrated) {
    return (
      <MobileShell>
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
      </MobileShell>
    );
  }

  const rawDay = dayNumberForDate(data.config.startDate, todayKey);
  const currentDay = Math.min(365, Math.max(1, rawDay));
  const elapsedDays = Math.min(365, Math.max(0, rawDay));
  const remainingDays = Math.max(0, 365 - elapsedDays);

  let completedDays = 0;
  let totalExercise = 0;
  let totalGerman = 0;
  let businessDays = 0;
  let totalSavings = 0;

  for (let i = 1; i <= 365; i++) {
    const d = new Date(data.config.startDate + "T00:00:00");
    d.setDate(d.getDate() + (i - 1));
    const key = toDateKey(d);
    if (key > todayKey) break;
    const record = getDayRecord(data, key);
    totalExercise += record.exerciseMinutes || 0;
    totalGerman += record.germanMinutes || 0;
    totalSavings += record.savingsAmount || 0;
    if (record.businessCompleted) businessDays += 1;
    if (isDayCompleted(record, data.config)) completedDays += 1;
  }

  const streaks = getStreaks(data, todayKey);
  const divisor = Math.max(1, elapsedDays);
  const overallProgress = (completedDays / 365) * 100;
  const finalTarget = data.config.savingsTarget * 365;

  return (
    <MobileShell>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
          <p className="text-sm text-muted-foreground">
            Day {String(currentDay).padStart(3, "0")} of 365
          </p>
        </header>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Completed Days" value={`${completedDays}`} />
              <Stat label="Remaining Days" value={`${remainingDays}`} />
              <Stat label="Current Streak" value={`🔥 ${streaks.current}`} />
              <Stat label="Longest Streak" value={`🏆 ${streaks.longest}`} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">Overall Challenge Progress</span>
                <span className="tabular-nums text-muted-foreground">{overallProgress.toFixed(1)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Section icon={Dumbbell} title="Exercise">
          <Stat label="Total Minutes" value={`${totalExercise.toLocaleString()}`} />
          <Stat label="Total Hours" value={`${(totalExercise / 60).toFixed(1)} hr`} />
          <Stat label="Average per Day" value={`${Math.round(totalExercise / divisor)} min`} />
        </Section>

        <Section icon={Languages} title="German">
          <Stat label="Total Hours" value={`${(totalGerman / 60).toFixed(1)} hr`} />
          <Stat label="Average per Day" value={`${(totalGerman / divisor / 60).toFixed(1)} hr`} />
        </Section>

        <Section icon={Briefcase} title="Business">
          <Stat label="Total Business Days" value={`${businessDays}`} />
          <Stat
            label="Consistency"
            value={`${Math.round((businessDays / divisor) * 100)}%`}
          />
        </Section>

        <Section icon={PiggyBank} title="Savings">
          <Stat label="Total Savings" value={formatCurrency(totalSavings)} />
          <Stat label="Average Daily" value={formatCurrency(Math.round(totalSavings / divisor))} />
          <Stat
            label={`Remaining to ${formatCurrency(MILESTONE)}`}
            value={formatCurrency(Math.max(0, MILESTONE - totalSavings))}
          />
          <Stat
            label={`Remaining to ${formatCurrency(finalTarget)}`}
            value={formatCurrency(Math.max(0, finalTarget - totalSavings))}
          />
        </Section>
      </div>
    </MobileShell>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
