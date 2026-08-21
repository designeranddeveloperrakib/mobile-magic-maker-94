import { useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Moon, Sun, Monitor, Download, Upload, Trash2 } from "lucide-react";
import { backupFileName, exportBackup, importBackup, resetChallengeData } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    try {
      const blob = new Blob([exportBackup()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backupFileName();
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exported");
    } catch {
      toast.error("Could not export backup");
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    if (importBackup(text)) {
      toast.success("Backup restored");
    } else {
      toast.error("Invalid backup file");
    }
  }


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
            <CardTitle className="text-base">Daily Reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable reminders</Label>
                <p className="text-xs text-muted-foreground">
                  {permission === "unsupported"
                    ? "Notifications aren't supported on this device."
                    : "Reminders fire while the app is open, once per goal per day."}
                </p>
              </div>
              <Switch
                id="notifications"
                disabled={permission === "unsupported"}
                checked={settings.notificationsEnabled}
                onCheckedChange={handleToggleNotifications}
              />
            </div>

            {settings.notificationsEnabled && permission === "denied" && (
              <p className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                Notifications are blocked in your browser settings. Allow them for this site to receive reminders.
              </p>
            )}

            {settings.notificationsEnabled && (
              <div className="space-y-3 border-t border-border pt-4">
                {REMINDER_ORDER.map((key) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Switch
                        id={`reminder-${key}`}
                        checked={settings.reminderEnabled[key]}
                        onCheckedChange={(checked) =>
                          update((prev) => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              reminderEnabled: { ...prev.settings.reminderEnabled, [key]: checked },
                            },
                          }))
                        }
                      />
                      <Label htmlFor={`reminder-${key}`} className="truncate text-sm font-normal">
                        {REMINDER_LABELS[key].title}
                      </Label>
                    </div>
                    <Input
                      type="time"
                      aria-label={`${key} reminder time`}
                      value={settings.reminderTimes[key]}
                      disabled={!settings.reminderEnabled[key]}
                      onChange={(e) =>
                        update((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            reminderTimes: { ...prev.settings.reminderTimes, [key]: e.target.value },
                          },
                        }))
                      }
                      className="h-9 w-32"
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={handleTestNotification}>
                  <Bell className="mr-2 h-4 w-4" /> Send a test reminder
                </Button>
              </div>
            )}
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
