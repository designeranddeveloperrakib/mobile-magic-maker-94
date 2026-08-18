import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { useChallengeData, formatDateLabel, formatCurrency, toDateKey, getDayRecord, getStreaks } from "@/lib/storage";
import { CircularProgress } from "@/components/circular-progress";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, Languages, Briefcase, PiggyBank, Flame, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

const QUOTES = [
  "Don't break the chain.",
  "One day at a time.",
  "Discipline today. Freedom tomorrow.",
  "Your future self is watching.",
  "Keep going.",
];

function Home() {
  const { data, update, updateDay, hydrated } = useChallengeData();

  const today = toDateKey(new Date());
  const todayRecord = getDayRecord(data, today);
  const streaks = getStreaks(data, today);

  useEffect(() => {
    if (!hydrated) return;
    if (streaks.longest > (data.longestStreak ?? 0)) {
      update((prev) => ({ ...prev, longestStreak: streaks.longest }));
    }
  }, [hydrated, streaks.longest, data.longestStreak]);

  if (!hydrated) {
    return (
      <MobileShell>
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
      </MobileShell>
    );
  }

  if (!data.onboardingCompleted) {
    return <Navigate to="/setup" replace />;
  }

  const exerciseDone = (todayRecord.exerciseMinutes ?? 0) >= data.config.exerciseTarget;
  const germanDone = (todayRecord.germanMinutes ?? 0) >= data.config.germanTarget;
  const businessDone = todayRecord.businessCompleted ?? false;
  const savingsDone = (todayRecord.savingsAmount ?? 0) >= data.config.savingsTarget;

  const completedCount = [exerciseDone, germanDone, businessDone, savingsDone].filter(Boolean).length;
  const todayProgress = (completedCount / 4) * 100;

  const startDate = new Date(data.config.startDate + "T00:00:00");
  const diffDays = Math.floor((new Date(today + "T00:00:00").getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const currentDay = Math.max(1, Math.min(365, diffDays));
  const daysRemaining = Math.max(0, 365 - currentDay + 1);
  const quote = QUOTES[(currentDay - 1) % QUOTES.length];

  const updateToday = (patch: Partial<typeof todayRecord>) => {
    updateDay(today, (prev) => ({ ...prev, ...patch }));
  };

  return (
    <MobileShell>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Challenge 365</h1>
          <p className="text-sm text-muted-foreground">{formatDateLabel(today)}</p>
        </header>

        <Card className="border border-border bg-gradient-to-br from-card to-muted/30">
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Day {String(currentDay).padStart(3, "0")} / 365</p>
              <p className="text-xs text-muted-foreground">{daysRemaining} days remaining</p>
            </div>
            <CircularProgress value={todayProgress} size={160} strokeWidth={12} />
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Today&apos;s Progress</span>
                <span className="font-semibold">{Math.round(todayProgress)}%</span>
              </div>
              <Progress value={todayProgress} className="h-3" />
            </div>
            {todayProgress === 100 && (
              <p className="w-full rounded-lg bg-primary/10 p-3 text-center text-sm font-semibold text-primary">
                🎉 DAY COMPLETED!
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border border-border">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-500">
                <Flame className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight">{streaks.current}</p>
                <p className="truncate text-xs text-muted-foreground">Current streak</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-500">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight">{streaks.longest}</p>
                <p className="truncate text-xs text-muted-foreground">Longest streak</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-3">
          <GoalCard
            icon={Dumbbell}
            label="Exercise"
            done={exerciseDone}
            progress={Math.min(100, ((todayRecord.exerciseMinutes ?? 0) / data.config.exerciseTarget) * 100)}
            current={`${todayRecord.exerciseMinutes ?? 0} / ${data.config.exerciseTarget} min`}
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Minutes"
                value={todayRecord.exerciseMinutes ?? 0}
                onChange={(e) => updateToday({ exerciseMinutes: Math.max(0, Number(e.target.value) || 0) })}
                className="h-9 w-28"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </GoalCard>

          <GoalCard
            icon={Languages}
            label="German"
            done={germanDone}
            progress={Math.min(100, ((todayRecord.germanMinutes ?? 0) / data.config.germanTarget) * 100)}
            current={`${Math.floor((todayRecord.germanMinutes ?? 0) / 60)} hr ${(todayRecord.germanMinutes ?? 0) % 60} min / ${Math.floor(data.config.germanTarget / 60)} hr`}
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Hours"
                value={Math.floor((todayRecord.germanMinutes ?? 0) / 60)}
                onChange={(e) => {
                  const hours = Math.max(0, Number(e.target.value) || 0);
                  const minutes = (todayRecord.germanMinutes ?? 0) % 60;
                  updateToday({ germanMinutes: hours * 60 + minutes });
                }}
                className="h-9 w-20"
              />
              <span className="text-sm text-muted-foreground">hr</span>
              <Input
                type="number"
                min={0}
                max={59}
                placeholder="Min"
                value={(todayRecord.germanMinutes ?? 0) % 60}
                onChange={(e) => {
                  const hours = Math.floor((todayRecord.germanMinutes ?? 0) / 60);
                  const minutes = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                  updateToday({ germanMinutes: hours * 60 + minutes });
                }}
                className="h-9 w-20"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </GoalCard>

          <GoalCard
            icon={Briefcase}
            label="Business"
            done={businessDone}
            progress={businessDone ? 100 : 0}
            current={businessDone ? "Completed" : "Pending"}
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="business-done"
                  checked={businessDone}
                  onCheckedChange={(checked) => updateToday({ businessCompleted: checked === true })}
                />
                <Label htmlFor="business-done" className="cursor-pointer text-sm font-normal leading-none">
                  I worked on my business today.
                </Label>
              </div>
              <Textarea
                placeholder="What did you do for your business today? (optional)"
                value={todayRecord.businessNote ?? ""}
                onChange={(e) => updateToday({ businessNote: e.target.value })}
                className="min-h-[60px] text-sm"
              />
            </div>
          </GoalCard>

          <GoalCard
            icon={PiggyBank}
            label="Savings"
            done={savingsDone}
            progress={Math.min(100, ((todayRecord.savingsAmount ?? 0) / data.config.savingsTarget) * 100)}
            current={`${formatCurrency(todayRecord.savingsAmount ?? 0)} / ${formatCurrency(data.config.savingsTarget)}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">৳</span>
              <Input
                type="number"
                min={0}
                placeholder="Amount saved"
                value={todayRecord.savingsAmount ?? 0}
                onChange={(e) => updateToday({ savingsAmount: Math.max(0, Number(e.target.value) || 0) })}
                className="h-9 w-32"
              />
            </div>
            <Link
              to="/savings"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View savings tracker →
            </Link>
          </GoalCard>
        </section>


        <p className="text-center text-sm italic text-muted-foreground">&ldquo;{quote}&rdquo;</p>
      </div>
    </MobileShell>
  );
}

function GoalCard({
  icon: Icon,
  label,
  done,
  progress,
  current,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  done: boolean;
  progress: number;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-border overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{label}</h3>
                <p className="text-sm text-muted-foreground">{current}</p>
              </div>
              {done && <span className="text-lg font-bold text-primary">✓</span>}
            </div>
            <Progress value={progress} className="h-2" />
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
