import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/statistics")({
  component: Statistics,
});

function Statistics() {
  return (
    <MobileShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
        <p className="text-sm text-muted-foreground">
          Track your overall progress, exercise hours, German study hours, business days, and savings.
        </p>
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base">Coming in Phase 9</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed stats including current streak, longest streak, averages, and savings totals.
            </p>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}
