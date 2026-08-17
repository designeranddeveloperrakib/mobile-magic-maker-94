import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/achievements")({
  component: Achievements,
});

function Achievements() {
  return (
    <MobileShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-sm text-muted-foreground">
          Unlock milestones as you build your streak, hit savings targets, and complete challenge days.
        </p>
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base">Coming in Phase 12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Locked and unlocked achievement cards with first day, streak, savings, and 365-day completion badges.
            </p>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}
