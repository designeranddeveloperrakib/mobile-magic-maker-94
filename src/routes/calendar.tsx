import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DayDetailSheet } from "@/components/day-detail-sheet";
import {
  useChallengeData,
  toDateKey,
  dateForDayNumber,
  getDayStatus,
  getDayProgress,
  getDayRecord,
  type DayStatus,
} from "@/lib/storage";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "365-Day Calendar — Challenge 365" },
      { name: "description", content: "Track all 365 days of your challenge with completed, partial and missed day statuses." },
      { property: "og:title", content: "365-Day Calendar — Challenge 365" },
      { property: "og:description", content: "See every day of your 365-day challenge at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const STATUS_STYLES: Record<DayStatus, string> = {
  completed: "bg-emerald-500 text-white border-emerald-500",
  partial: "bg-amber-400 text-black border-amber-400",
  missed: "bg-red-500/80 text-white border-red-500/80",
  today: "bg-blue-500 text-white border-blue-500 ring-2 ring-blue-500/40",
  future: "bg-muted text-muted-foreground border-border",
};

const LEGEND: { status: DayStatus; label: string }[] = [
  { status: "completed", label: "Completed" },
  { status: "partial", label: "Partial" },
  { status: "missed", label: "Missed" },
  { status: "today", label: "Today" },
];

function CalendarPage() {
  const { data, hydrated } = useChallengeData();
  const [selected, setSelected] = useState<string | null>(null);

  const todayKey = toDateKey(new Date());

  const days = useMemo(() => {
    return Array.from({ length: 365 }, (_, i) => {
      const dayNumber = i + 1;
      const date = dateForDayNumber(data.config.startDate, dayNumber);
      return {
        dayNumber,
        date,
        status: getDayStatus(data, date, todayKey),
        progress: getDayProgress(getDayRecord(data, date), data.config),
      };
    });
  }, [data, todayKey]);

  const completed = days.filter((d) => d.status !== "today" && d.progress === 100).length;
  const todayEntry = days.find((d) => d.date === todayKey);
  const currentDay = todayEntry?.dayNumber ?? 0;
  const missed = days.filter((d) => d.status === "missed").length;
  const remaining = Math.max(0, 365 - Math.max(0, currentDay));
  const overall = Math.round((completed / 365) * 100);

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
          <h1 className="text-2xl font-bold tracking-tight">365 Days</h1>
          <p className="text-sm text-muted-foreground">Tap any day to view or edit it.</p>
        </header>

        <Card className="border border-border">
          <CardContent className="space-y-4 py-5">
            <div className="grid grid-cols-4 gap-3 text-center">
              <Stat label="Completed" value={completed} className="text-emerald-500" />
              <Stat label="Missed" value={missed} className="text-red-500" />
              <Stat label="Remaining" value={remaining} />
              <Stat label="Current" value={currentDay > 0 ? currentDay : "—"} className="text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Challenge Progress</span>
                <span className="font-semibold">{overall}%</span>
              </div>
              <Progress value={overall} className="h-2.5" />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          {LEGEND.map((l) => (
            <div key={l.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-3 w-3 rounded-full border", STATUS_STYLES[l.status])} />
              {l.label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <button
              key={d.dayNumber}
              type="button"
              onClick={() => setSelected(d.date)}
              aria-label={`Day ${d.dayNumber}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border text-[11px] font-semibold transition-transform active:scale-95",
                STATUS_STYLES[d.status],
              )}
            >
              {d.dayNumber}
            </button>
          ))}
        </div>
      </div>

      <DayDetailSheet date={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </MobileShell>
  );
}

function Stat({ label, value, className }: { label: string; value: number | string; className?: string }) {
  return (
    <div>
      <p className={cn("text-xl font-bold", className)}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
