import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DayDetailSheet } from "@/components/day-detail-sheet";
import { cn } from "@/lib/utils";
import {
  useChallengeData,
  toDateKey,
  dateForDayNumber,
  getDayRecord,
  getDayProgress,
  getGoalStatus,
  formatCurrency,
  formatDateLabel,
} from "@/lib/storage";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Daily History — Challenge 365" },
      {
        name: "description",
        content:
          "Browse a detailed day-by-day history of exercise, German study, business work and savings, and edit any past day.",
      },
      { property: "og:title", content: "Daily History — Challenge 365" },
      { property: "og:description", content: "Every logged day of your 365-day challenge in detail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

type Filter = "all" | "completed" | "partial" | "missed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "partial", label: "Partial" },
  { value: "missed", label: "Missed" },
];

function HistoryPage() {
  const { data, hydrated } = useChallengeData();
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const todayKey = toDateKey(new Date());

  const days = useMemo(() => {
    const list = [];
    for (let dayNumber = 1; dayNumber <= 365; dayNumber++) {
      const date = dateForDayNumber(data.config.startDate, dayNumber);
      if (date > todayKey) break;
      const record = getDayRecord(data, date);
      list.push({
        dayNumber,
        date,
        record,
        progress: getDayProgress(record, data.config),
        status: getGoalStatus(record, data.config),
        isToday: date === todayKey,
      });
    }
    return list.reverse();
  }, [data, todayKey]);

  const visible = days.filter((d) => {
    if (filter === "completed") return d.progress === 100;
    if (filter === "partial") return d.progress > 0 && d.progress < 100;
    if (filter === "missed") return d.progress === 0;
    return true;
  });

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
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">Tap a day to view or edit its record.</p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
              className="shrink-0 rounded-full"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No days to show yet.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((d) => {
              const germanHours = Math.floor(d.record.germanMinutes / 60);
              const germanMins = d.record.germanMinutes % 60;
              return (
                <Card
                  key={d.date}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(d.date)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelected(d.date);
                  }}
                  className={cn(
                    "cursor-pointer border border-border transition-colors hover:border-primary/50",
                    d.isToday && "ring-2 ring-blue-500/40",
                  )}
                >
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold">
                          Day {String(d.dayNumber).padStart(3, "0")}
                          {d.isToday && <span className="ml-2 text-xs font-medium text-blue-500">Today</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateLabel(d.date)}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          d.progress === 100
                            ? "bg-emerald-500/15 text-emerald-500"
                            : d.progress > 0
                              ? "bg-amber-400/20 text-amber-500"
                              : "bg-red-500/15 text-red-500",
                        )}
                      >
                        {d.progress}%
                      </span>
                    </div>

                    <Progress value={d.progress} className="h-1.5" />

                    <ul className="space-y-1 text-sm">
                      <GoalLine
                        emoji="🏋️"
                        label="Exercise"
                        value={`${d.record.exerciseMinutes} min`}
                        done={d.status.exercise}
                      />
                      <GoalLine
                        emoji="🇩🇪"
                        label="German"
                        value={germanMins ? `${germanHours} hr ${germanMins} min` : `${germanHours} hr`}
                        done={d.status.german}
                      />
                      <GoalLine
                        emoji="💼"
                        label="Business"
                        value={d.status.business ? "Completed" : "Not done"}
                        done={d.status.business}
                      />
                      <GoalLine
                        emoji="💰"
                        label="Savings"
                        value={formatCurrency(d.record.savingsAmount)}
                        done={d.status.savings}
                      />
                    </ul>

                    {d.record.businessNote?.trim() && (
                      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {d.record.businessNote}
                      </p>
                    )}

                    {d.progress === 100 && (
                      <p className="text-sm font-semibold text-emerald-500">DAY COMPLETED ✓</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <DayDetailSheet date={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </MobileShell>
  );
}

function GoalLine({
  emoji,
  label,
  value,
  done,
}: {
  emoji: string;
  label: string;
  value: string;
  done: boolean;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">
        <span aria-hidden="true">{emoji}</span> {label}
      </span>
      <span className={cn("font-medium", done ? "text-emerald-500" : "text-foreground")}>
        {value} {done ? "✓" : ""}
      </span>
    </li>
  );
}
