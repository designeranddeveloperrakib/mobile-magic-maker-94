import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { Confetti } from "@/components/confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getChallengeTotals } from "@/lib/achievements";
import { formatCurrency, useChallengeData, formatDateLabel, dateForDayNumber } from "@/lib/storage";
import { Dumbbell, Languages, Briefcase, PiggyBank, Flame } from "lucide-react";

export const Route = createFileRoute("/complete")({
  component: CompletePage,
  head: () => ({
    meta: [
      { title: "Challenge 365 Completed — Final Results" },
      {
        name: "description",
        content: "Your final Challenge 365 results: exercise hours, German study hours, business days, total savings and longest streak.",
      },
      { property: "og:title", content: "Challenge 365 Completed" },
      { property: "og:description", content: "365 days of discipline — see the final results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CompletePage() {
  const { data, hydrated } = useChallengeData();

  if (!hydrated) {
    return (
      <MobileShell>
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
      </MobileShell>
    );
  }

  const totals = getChallengeTotals(data);
  const finished = totals.completedDays >= 365;

  if (!finished) {
    return (
      <MobileShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Challenge Completion</h1>
          <Card className="border border-border">
            <CardContent className="space-y-4 p-6 text-center">
              <p className="text-5xl">🔒</p>
              <p className="text-sm text-muted-foreground">
                This screen unlocks when all 365 days are completed.
              </p>
              <div className="space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Completed days</span>
                  <span className="font-semibold">{totals.completedDays} / 365</span>
                </div>
                <Progress value={(totals.completedDays / 365) * 100} className="h-3" />
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Back to today</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileShell>
    );
  }

  const stats = [
    {
      icon: Dumbbell,
      label: "Total Exercise",
      value: `${Math.round(totals.exerciseMinutes / 60).toLocaleString("en-BD")} hours`,
    },
    {
      icon: Languages,
      label: "German Learning",
      value: `${Math.round(totals.germanMinutes / 60).toLocaleString("en-BD")} hours`,
    },
    { icon: Briefcase, label: "Business Days", value: `${totals.businessDays} days` },
    { icon: PiggyBank, label: "Total Savings", value: formatCurrency(Math.round(totals.savings)) },
    { icon: Flame, label: "Longest Streak", value: `${totals.longestStreak} days` },
  ];

  return (
    <MobileShell>
      <div className="relative space-y-6">
        <Confetti />
        <Card className="relative overflow-hidden border border-primary/40 bg-gradient-to-br from-primary/10 to-card">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="trophy-pop text-6xl">🏆</p>
            <h1 className="text-2xl font-bold tracking-tight">CHALLENGE 365 COMPLETED</h1>
            <p className="text-4xl font-black text-primary">365 / 365</p>
            <p className="text-xs text-muted-foreground">
              {formatDateLabel(data.config.startDate)} → {formatDateLabel(dateForDayNumber(data.config.startDate, 365))}
            </p>
            <Progress value={100} className="mt-2 h-3 w-full" />
          </CardContent>
        </Card>

        <section className="grid gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border border-border">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold leading-tight">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card className="border border-primary/40 bg-primary/5">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold leading-snug">&ldquo;365 days of discipline. You did it.&rdquo;</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline">
            <Link to="/statistics">Statistics</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/achievements">Achievements</Link>
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}
