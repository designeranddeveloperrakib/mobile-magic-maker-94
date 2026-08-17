import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useChallengeData } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Calendar, Dumbbell, Languages, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/setup")({
  component: Setup,
});

function Setup() {
  const { data, update, hydrated } = useChallengeData();
  const [startDate, setStartDate] = useState(data.config.startDate);
  const [exerciseTarget, setExerciseTarget] = useState(String(data.config.exerciseTarget));
  const [germanTarget, setGermanTarget] = useState(String(Math.floor(data.config.germanTarget / 60)));
  const [savingsTarget, setSavingsTarget] = useState(String(data.config.savingsTarget));
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!hydrated || synced) return;
    setStartDate(data.config.startDate);
    setExerciseTarget(String(data.config.exerciseTarget));
    setGermanTarget(String(Math.floor(data.config.germanTarget / 60)));
    setSavingsTarget(String(data.config.savingsTarget));
    setSynced(true);
  }, [hydrated, synced, data.config]);

  if (hydrated && data.onboardingCompleted) {
    return <Navigate to="/" replace />;
  }

  const savingsTargetNum = Number.isNaN(Number(savingsTarget)) ? 0 : Number(savingsTarget);
  const finalSavingsTarget = savingsTargetNum * 365;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update((prev) => ({
      ...prev,
      onboardingCompleted: true,
      config: {
        ...prev.config,
        startDate,
        exerciseTarget: Math.max(1, Number(exerciseTarget) || 60),
        germanTarget: Math.max(1, Number(germanTarget) || 3) * 60,
        savingsTarget: Math.max(1, Number(savingsTarget) || 300),
      },
    }));
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-background px-6 py-8 text-foreground">
      <div className="mb-6 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Challenge 365</h1>
        <p className="mt-1 text-sm text-muted-foreground">Set your targets to begin your 365-day journey.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base">Challenge Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Start Date
              </Label>
              <Input id="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" /> Exercise Target (minutes/day)
              </Label>
              <Input id="exercise" type="number" min={1} required value={exerciseTarget} onChange={(e) => setExerciseTarget(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="german" className="flex items-center gap-2">
                <Languages className="h-4 w-4" /> German Learning Target (hours/day)
              </Label>
              <Input id="german" type="number" min={1} required value={germanTarget} onChange={(e) => setGermanTarget(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings" className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4" /> Savings Target (৳/day)
              </Label>
              <Input id="savings" type="number" min={1} required value={savingsTarget} onChange={(e) => setSavingsTarget(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-muted/30">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Daily savings target</span>
              <span className="font-semibold">৳{savingsTargetNum.toLocaleString("en-BD")}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Days</span>
              <span className="font-semibold">× 365</span>
            </p>
            <div className="border-t border-border pt-2">
              <p className="flex justify-between text-base">
                <span className="font-medium">Final savings target</span>
                <span className="font-bold text-primary">৳{finalSavingsTarget.toLocaleString("en-BD")}</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Milestone: ৳100,000</p>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Start Challenge
        </Button>
      </form>
    </div>
  );
}
