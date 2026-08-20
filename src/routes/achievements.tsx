import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useChallengeData, toDateKey } from "@/lib/storage";
import {
  getAchievements,
  getChallengeTotals,
  formatAchievementProgress,
  type Achievement,
} from "@/lib/achievements";
import { Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Challenge 365" },
      {
        name: "description",
        content:
          "Unlock badges for streaks, exercise hours, German study hours, savings milestones and completing all 365 challenge days.",
      },
      { property: "og:title", content: "Achievements — Challenge 365" },
      {
        property: "og:description",
        content: "Track every milestone you unlock across your 365-day discipline challenge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Achievements,
});

function Achievements() {
  const { data, hydrated } = useChallengeData();

  if (!hydrated) {
    return (
      <MobileShell>
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
      </MobileShell>
    );
  }

  const totals = getChallengeTotals(data, toDateKey(new Date()));
  const achievements = getAchievements(totals);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const groups = achievements.reduce<Record<string, Achievement[]>>((acc, a) => {
    (acc[a.group] ??= []).push(a);
    return acc;
  }, {});

  return (
    <MobileShell>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} of {achievements.length} unlocked
          </p>
        </header>

        <Card className="border-border">
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">Overall</span>
              <span className="tabular-nums text-muted-foreground">
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </span>
            </div>
            <Progress value={(unlockedCount / achievements.length) * 100} className="h-2" />
          </CardContent>
        </Card>

        {Object.entries(groups).map(([group, items]) => (
          <section key={group} className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</h2>
            <div className="space-y-2">
              {items.map((a) => (
                <AchievementRow key={a.id} achievement={a} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </MobileShell>
  );
}

function AchievementRow({ achievement: a }: { achievement: Achievement }) {
  return (
    <Card
      className={cn(
        "border-border transition-colors",
        a.unlocked ? "border-primary/40 bg-primary/5" : "opacity-70",
      )}
    >
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl",
            a.unlocked ? "bg-primary/15" : "bg-muted grayscale",
          )}
          aria-hidden="true"
        >
          {a.unlocked ? a.emoji : <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cn("truncate text-sm font-semibold", !a.unlocked && "text-muted-foreground")}>{a.title}</p>
            {a.unlocked ? (
              <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Unlocked" />
            ) : (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatAchievementProgress(a)}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{a.description}</p>
          {!a.unlocked && <Progress value={a.progress * 100} className="h-1.5" />}
        </div>
      </CardContent>
    </Card>
  );
}
