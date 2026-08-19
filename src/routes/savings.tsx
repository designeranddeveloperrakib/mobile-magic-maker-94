import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatCurrency,
  toDateKey,
  dayNumberForDate,
  useChallengeData,
} from "@/lib/storage";
import { PiggyBank, Target, TrendingUp, Flag } from "lucide-react";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings Tracker — Challenge 365" },
      {
        name: "description",
        content:
          "Track your daily ৳300 savings, total saved, milestones and progress toward the ৳109,500 Challenge 365 goal.",
      },
      { property: "og:title", content: "Savings Tracker — Challenge 365" },
      {
        property: "og:description",
        content: "Total saved, milestones and average daily savings for your 365-day challenge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavingsPage,
});

const MILESTONE = 100000;

function SavingsPage() {
  const { data, hydrated } = useChallengeData();
  const todayKey = toDateKey(new Date());

  const records = Object.values(data.records);
  const totalSaved = records.reduce((sum, r) => sum + (r.savingsAmount || 0), 0);
  const finalTarget = data.config.savingsTarget * 365;

  const dayNumber = Math.min(365, Math.max(1, dayNumberForDate(data.config.startDate, todayKey)));
  const daysWithSavings = records.filter((r) => (r.savingsAmount || 0) > 0).length;
  const averageDaily = dayNumber > 0 ? totalSaved / dayNumber : 0;
  const expectedSoFar = data.config.savingsTarget * dayNumber;
  const ahead = totalSaved - expectedSoFar;

  const pctFinal = finalTarget > 0 ? Math.min(100, (totalSaved / finalTarget) * 100) : 0;
  const pctMilestone = Math.min(100, (totalSaved / MILESTONE) * 100);

  if (!hydrated) return <MobileShell><div className="h-40" /></MobileShell>;

  return (
    <MobileShell>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Savings</h1>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.config.savingsTarget)} / day × 365 = {formatCurrency(finalTarget)}
          </p>
        </header>

        <Card className="border-border bg-primary text-primary-foreground">
          <CardContent className="space-y-3 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-sm opacity-80">
              <PiggyBank className="h-4 w-4" aria-hidden="true" />
              Total Saved
            </div>
            <p className="text-4xl font-bold tabular-nums">{formatCurrency(totalSaved)}</p>
            <p className="text-xs opacity-80">
              {pctFinal.toFixed(1)}% of {formatCurrency(finalTarget)}
            </p>
            <Progress value={pctFinal} className="h-2 bg-primary-foreground/20" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MilestoneRow
              label={`${formatCurrency(MILESTONE)} Milestone`}
              value={totalSaved}
              target={MILESTONE}
              percent={pctMilestone}
            />
            <MilestoneRow
              label={`${formatCurrency(finalTarget)} Final Target`}
              value={totalSaved}
              target={finalTarget}
              percent={pctFinal}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            label={`Remaining to ${formatCurrency(MILESTONE)}`}
            value={formatCurrency(Math.max(0, MILESTONE - totalSaved))}
          />
          <StatTile
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            label={`Remaining to ${formatCurrency(finalTarget)}`}
            value={formatCurrency(Math.max(0, finalTarget - totalSaved))}
          />
          <StatTile
            icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
            label="Average Daily Savings"
            value={formatCurrency(Math.round(averageDaily))}
          />
          <StatTile
            icon={<PiggyBank className="h-4 w-4" aria-hidden="true" />}
            label="Days With Savings"
            value={`${daysWithSavings} / ${dayNumber}`}
          />
        </div>

        <Card className="border-border">
          <CardContent className="p-4 text-sm">
            <p className="text-muted-foreground">
              Expected by day {dayNumber}: {formatCurrency(expectedSoFar)}
            </p>
            <p className={ahead >= 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-destructive"}>
              {ahead >= 0
                ? `${formatCurrency(ahead)} ahead of schedule`
                : `${formatCurrency(Math.abs(ahead))} behind schedule`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Savings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {records.filter((r) => r.savingsAmount > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground">No savings recorded yet.</p>
            ) : (
              records
                .filter((r) => r.savingsAmount > 0)
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .slice(0, 10)
                .map((r) => {
                  const dn = dayNumberForDate(data.config.startDate, r.date);
                  const met = r.savingsAmount >= data.config.savingsTarget;
                  return (
                    <div key={r.date} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Day {String(dn).padStart(3, "0")} · {r.date}
                      </span>
                      <span className={met ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium"}>
                        {formatCurrency(r.savingsAmount)}
                      </span>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}

function MilestoneRow({
  label,
  value,
  target,
  percent,
}: {
  label: string;
  value: number;
  target: number;
  percent: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{percent.toFixed(1)}%</span>
      </div>
      <Progress value={percent} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {formatCurrency(value)} of {formatCurrency(target)} · {formatCurrency(Math.max(0, target - value))} left
      </p>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-border">
      <CardContent className="space-y-1 p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
