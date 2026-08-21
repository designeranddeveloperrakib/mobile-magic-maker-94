import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, BarChart3, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReminderScheduler } from "@/lib/notifications";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/calendar", label: "365 Days", icon: CalendarDays },
  { to: "/statistics", label: "Stats", icon: BarChart3 },
  { to: "/achievements", label: "Awards", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  useReminderScheduler();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background text-foreground">
      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur md:absolute md:mx-auto md:max-w-md">
        <ul className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={cn("h-5 w-5", active && "fill-current")} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
