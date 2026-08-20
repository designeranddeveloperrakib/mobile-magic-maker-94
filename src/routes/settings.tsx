import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Monitor } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <MobileShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                <SelectTrigger id="theme" className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <span className="flex items-center gap-2">
                      <Sun className="h-4 w-4" /> Light
                    </span>
                  </SelectItem>
                  <SelectItem value="dark">
                    <span className="flex items-center gap-2">
                      <Moon className="h-4 w-4" /> Dark
                    </span>
                  </SelectItem>
                  <SelectItem value="system">
                    <span className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" /> System
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base">Challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Daily Reminders</Label>
                <p className="text-xs text-muted-foreground">Reminder settings will be available in Phase 15.</p>
              </div>
              <Switch id="notifications" disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base">Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your backup file contains every day record, targets, streaks, achievements and settings.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" /> Reset Challenge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset everything?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes all Challenge 365 data on this device — day records, streaks,
                    achievements and settings. Export a backup first if you want to keep it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      resetChallengeData();
                      toast.success("Challenge reset");
                      navigate({ to: "/setup" });
                    }}
                  >
                    Delete all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}
