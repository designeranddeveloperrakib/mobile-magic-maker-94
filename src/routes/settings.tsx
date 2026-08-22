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
import { Input } from "@/components/ui/input";
import { Moon, Sun, Monitor, Download, Upload, Trash2, Bell, UserRound, LogOut, Users } from "lucide-react";
import { deleteUser, renameUser, signOut, useAccounts } from "@/lib/accounts";
import { backupFileName, exportBackup, importBackup, resetChallengeData, useChallengeData } from "@/lib/storage";
import {
  REMINDER_LABELS,
  REMINDER_ORDER,
  requestNotificationPermission,
  useNotificationPermission,
} from "@/lib/notifications";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, update } = useChallengeData();
  const { activeUser, users } = useAccounts();
  const { permission, setPermission } = useNotificationPermission();
  const settings = data.settings;

  async function handleToggleNotifications(checked: boolean) {
    if (!checked) {
      update((prev) => ({ ...prev, settings: { ...prev.settings, notificationsEnabled: false } }));
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "unsupported") {
      toast.error("Notifications aren't supported on this device");
      return;
    }
    update((prev) => ({ ...prev, settings: { ...prev.settings, notificationsEnabled: true } }));
    if (result === "granted") toast.success("Daily reminders enabled");
    else toast.error("Allow notifications in your browser to receive reminders");
  }

  function handleTestNotification() {
    if (permission !== "granted") {
      toast.error("Notification permission is not granted");
      return;
    }
    new Notification("Challenge 365", { body: "Reminders are working. Keep going!" });
    toast.success("Test reminder sent");
  }

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
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{activeUser?.name ?? "No profile"}</p>
                <p className="text-xs text-muted-foreground">
                  {users.length} profile{users.length === 1 ? "" : "s"} on this device
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileName">Display name</Label>
              <Input
                id="profileName"
                value={activeUser?.name ?? ""}
                onChange={(e) => activeUser && renameUser(activeUser.id, e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  signOut();
                  navigate({ to: "/accounts", replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: "/accounts" })}>
                <Users className="mr-2 h-4 w-4" /> Switch profile
              </Button>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete this profile
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes {activeUser?.name ?? "this profile"} and all of its challenge data from this
                    device. Other profiles are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (activeUser) deleteUser(activeUser.id);
                      navigate({ to: "/accounts", replace: true });
                    }}
                  >
                    Delete profile
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

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
