import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, ChevronRight, Target } from "lucide-react";
import { createUser, switchUser, useAccounts } from "@/lib/accounts";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Choose Profile · Challenge 365" },
      { name: "description", content: "Pick or create your Challenge 365 profile — every profile keeps its own private 365-day progress." },
      { property: "og:title", content: "Choose Profile · Challenge 365" },
      { property: "og:description", content: "Pick or create your Challenge 365 profile — every profile keeps its own private 365-day progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accounts,
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Accounts() {
  const { users, activeUser, hydrated } = useAccounts();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  if (hydrated && activeUser) return <Navigate to="/" replace />;

  const showForm = creating || (hydrated && users.length === 0);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-background px-6 py-8 text-foreground">
      <div className="mb-6 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Challenge 365</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {showForm ? "Create your profile to begin." : "Who's continuing the challenge?"}
        </p>
      </div>

      {!hydrated ? (
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      ) : showForm ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createUser(name);
          }}
        >
          <Card className="border border-border">
            <CardContent className="space-y-2 p-4">
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Your name
              </Label>
              <Input
                id="name"
                required
                autoFocus
                placeholder="e.g. Shimanto"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Each profile keeps its own private targets, records and streaks on this device.
              </p>
            </CardContent>
          </Card>
          <Button type="submit" className="w-full">
            Create profile
          </Button>
          {users.length > 0 && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => setCreating(false)}>
              Back to profiles
            </Button>
          )}
        </form>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => switchUser(user.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(user.name) || <Users className="h-4 w-4" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{user.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      Started {new Date(user.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" className="w-full" onClick={() => setCreating(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add another profile
          </Button>
        </div>
      )}
    </div>
  );
}
