import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { useChallengeData, formatDateLabel } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Languages, Briefcase, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data } = useChallengeData();

  if (!data.onboardingCompleted) {
    return <Navigate to="/setup" replace />;
  }

  const today = new Date().toISOString().split("T")[0] ?? "";
  const todayRecord = data.records[today];

  const exerciseDone = (todayRecord?.exerciseMinutes ?? 0) >= data.config.exerciseTarget;
  const germanDone = (todayRecord?.germanMinutes ?? 0) >= data.config.germanTarget;
  const businessDone = todayRecord?.businessCompleted ?? false;
  const savingsDone = (todayRecord?.savingsAmount ?? 0) >= data.config.savingsTarget;

  const completedCount = [exerciseDone, germanDone, businessDone, savingsDone].filter(Boolean).length;
  const todayProgress = (completedCount / 4) * 100;

  const startDate = new Date(data.config.startDate + "T00:00:00");
  const diffDays = Math.floor((new Date(today + "T00:00:00").getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const currentDay = Math.max(1, Math.min(365, diffDays));
  const daysRemaining = Math.max(0, 365 - currentDay + 1);

  const goals = [
    { icon: Dumbbell, label: "Exercise", target: `${data.config.exerciseTarget} min`, current: `${todayRecord?.exerciseMinutes ?? 0} min`, done: exerciseDone },
    { icon: Languages, label: "German", target: `${Math.floor(data.config.germanTarget / 60)} hr`, current: `${Math.floor((todayRecord?.germanMinutes ?? 0) / 60)} hr ${(todayRecord?.germanMinutes ?? 0) % 60} min`, done: germanDone },
    { icon: Briefcase, label: "Business", target: "Daily", current: businessDone ? "Done" : "Pending", done: businessDone },
    { icon: PiggyBank, label: "Savings", target: `৳${data.config.savingsTarget}`, current: `৳${todayRecord?.savingsAmount ?? 0}`, done: savingsDone },
  ];

  return (
    <MobileShell>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Challenge 365</h1>
          <p className="text-sm text-muted-foreground">{formatDateLabel(today)}</p>
        </header>

        <Card className="border border-border bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Day {String(currentDay).padStart(3, "0")} / 365</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{daysRemaining}</span>
              <span className="text-sm text-muted-foreground">days remaining</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Today&apos;s Progress</span>
                <span className="font-semibold">{Math.round(todayProgress)}%</span>
              </div>
              <Progress value={todayProgress} className="h-3" />
            </div>
            {todayProgress === 100 && (
              <p className="rounded-lg bg-primary/10 p-3 text-center text-sm font-semibold text-primary">
                🎉 DAY COMPLETED!
              </p>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-3">
          {goals.map((goal) => {
            const Icon = goal.icon;
            return (
              <Card key={goal.label} className="border border-border">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", goal.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{goal.label}</h3>
                      {goal.done && <span className="text-xs font-semibold text-primary">✓</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {goal.current} / {goal.target}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

      <p className="text-center text-sm italic text-muted-foreground">
        &ldquo;One day at a time.&rdquo;
      </p>
    </div>
  </MobileShell>
  );
}
