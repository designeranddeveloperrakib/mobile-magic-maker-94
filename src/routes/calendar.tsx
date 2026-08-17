import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/calendar")({
  component: Calendar,
});

function Calendar() {
  return (
    <MobileShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">365 Days</h1>
        <p className="text-sm text-muted-foreground">
          Your full challenge calendar will appear here. Completed days will show green, partial days yellow, missed days red, and today blue.
        </p>
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base">Coming in Phase 6</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A 365-day grid with daily status, day details, and tap-to-edit history.
            </p>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}
