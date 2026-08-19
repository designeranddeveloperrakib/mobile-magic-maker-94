import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useChallengeData,
  toDateKey,
  dateForDayNumber,
  getDayRecord,
  getGoalStatus,
  isDayCompleted,
  formatCurrency,
  parseDateKey,
} from "@/lib/storage";

export const Route = createFileRoute("/monthly")({
  head: () => ({
    meta: [
      { title: "Monthly Report — Challenge 365" },
      {
        name: "description",
        content:
          "Month-by-month summaries of completed days, exercise hours, German study hours, business days and total savings.",
      },
      { property: "og:title", content: "Monthly Report — Challenge 365" },
      { property: "og:description", content: "Monthly progress summaries for your 365-day challenge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MonthlyPage,
});

type MonthSummary = {
  key: string;
  label: string;
  daysElapsed: number;
  completedDays: number;
  exerciseMinutes: number;
  germanMinutes: number;
  businessDays: number;
  savings: number;
};

function MonthlyPage() {
  const { data, hydrated } = useChallengeData();
  const todayKey = toDateKey(new Date());

  const months = useMemo(() => {
    const map = new Map<string, MonthSummary>();
    for (let dayNumber = 1; dayNumber <= 365; dayNumber++) {
      const date = dateForDayNumber(data.config.startDate, dayNumber);
      if (date > todayKey) break;
      const key = date.slice(0, 7);
      let month = map.get(key);
      if (!month) {
        month = {
          key,
          label: parseDateKey(date).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
          daysElapsed: 0,
          completedDays: 0,
          exerciseMinutes: 0,
          germanMinutes: 0,
          businessDays: 0,
          savings: 0,
        };
        map.set(key, month);
      }
      const record = getDayRecord(data, date);
      const status = getGoalStatus(record, data.config);
      month.daysElapsed += 1;
      month.exerciseMinutes += record.exerciseMinutes;
      month.germanMinutes += record.germanMinutes;
      month.savings += record.savingsAmount;
      if (status.business) month.businessDays += 1;
      if (isDayCompleted(record, data.config)) month.completedDays += 1;
    }
    return [...map.values()].reverse();
  }, [data, todayKey]);

  if (!hydrated) {
    return (
      <MobileShell>
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="space-y-5">
        <header className="flex items-end justify-between gap-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Monthly Report</h1>
            <p className="text-sm text-muted-foreground">Your progress summarised month by month.</p>
          </div>
          <Link
            to="/history"
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            History
          </Link>
        </header>

        {months.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Your monthly summaries appear once the challenge starts.
          </p>
        ) : (
          <div className="space-y-4">
            {months.map((m) => {
              const rate = m.daysElapsed ? Math.round((m.completedDays / m.daysElapsed) * 100) : 0;
              return (
                <Card key={m.key} className="border border-border">
                  <CardContent className="space-y-4 py-5">
                    <div className="flex items-baseline justify-between">
                      <h2 className="text-lg font-bold">{m.label}</h2>
                      <span className="text-xs text-muted-foreground">{m.daysElapsed} days tracked</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Completed Days</span>
                        <span className="font-semibold">
                          {m.completedDays} / {m.daysElapsed} · {rate}%
                        </span>
                      </div>
                      <Progress value={rate} className="h-2" />
                    </div>

                    <dl className="grid grid-cols-2 gap-3">
                      <Item label="🏋️ Exercise" value={`${(m.exerciseMinutes / 60).toFixed(1)} hours`} />
                      <Item label="🇩🇪 German" value={`${(m.germanMinutes / 60).toFixed(1)} hours`} />
                      <Item label="💼 Business" value={`${m.businessDays} days`} />
                      <Item label="💰 Savings" value={formatCurrency(m.savings)} />
                    </dl>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}
