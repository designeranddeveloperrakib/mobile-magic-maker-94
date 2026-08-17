import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dumbbell, Languages, Briefcase, PiggyBank } from "lucide-react";
import {
  useChallengeData,
  getDayRecord,
  getGoalStatus,
  getDayProgress,
  dayNumberForDate,
  formatDateLabel,
  formatCurrency,
  type DayRecord,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

type Props = {
  date: string | null;
  onOpenChange: (open: boolean) => void;
};

export function DayDetailSheet({ date, onOpenChange }: Props) {
  const { data, updateDay } = useChallengeData();
  const [draft, setDraft] = useState<DayRecord | null>(null);

  useEffect(() => {
    setDraft(date ? getDayRecord(data, date) : null);
    // Only reset when the selected day changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const record = draft ?? (date ? getDayRecord(data, date) : null);
  if (!date || !record) {
    return <Sheet open={false} onOpenChange={onOpenChange} />;
  }

  const status = getGoalStatus(record, data.config);
  const progress = getDayProgress(record, data.config);
  const dayNumber = dayNumberForDate(data.config.startDate, date);

  const patch = (p: Partial<DayRecord>) => {
    const next = { ...record, ...p };
    setDraft(next);
    updateDay(date, () => next);
  };

  const germanHours = Math.floor(record.germanMinutes / 60);
  const germanMins = record.germanMinutes % 60;

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Day {String(Math.max(dayNumber, 0)).padStart(3, "0")}</SheetTitle>
          <p className="text-sm text-muted-foreground">{formatDateLabel(date)}</p>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Day Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            {progress === 100 && (
              <p className="text-center text-sm font-semibold text-emerald-500">🎉 DAY COMPLETED!</p>
            )}
          </div>

          <Row icon={<Dumbbell className="h-4 w-4" />} title="Exercise" done={status.exercise}
            summary={`${record.exerciseMinutes} / ${data.config.exerciseTarget} min`}>
            <div className="space-y-1.5">
              <Label htmlFor="d-ex" className="text-xs">Minutes</Label>
              <Input id="d-ex" type="number" min={0} inputMode="numeric" value={record.exerciseMinutes || ""}
                onChange={(e) => patch({ exerciseMinutes: Math.max(0, Number(e.target.value) || 0) })} />
            </div>
          </Row>

          <Row icon={<Languages className="h-4 w-4" />} title="German" done={status.german}
            summary={`${germanHours} hr ${germanMins} min / ${Math.floor(data.config.germanTarget / 60)} hr`}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="d-gh" className="text-xs">Hours</Label>
                <Input id="d-gh" type="number" min={0} inputMode="numeric" value={germanHours || ""}
                  onChange={(e) => patch({ germanMinutes: Math.max(0, Number(e.target.value) || 0) * 60 + germanMins })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-gm" className="text-xs">Minutes</Label>
                <Input id="d-gm" type="number" min={0} max={59} inputMode="numeric" value={germanMins || ""}
                  onChange={(e) => patch({ germanMinutes: germanHours * 60 + Math.max(0, Number(e.target.value) || 0) })} />
              </div>
            </div>
          </Row>

          <Row icon={<Briefcase className="h-4 w-4" />} title="Business" done={status.business}
            summary={status.business ? "Completed" : "Pending"}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="d-biz" checked={record.businessCompleted}
                  onCheckedChange={(v) => patch({ businessCompleted: v === true })} />
                <Label htmlFor="d-biz" className="text-sm">I worked on my business today.</Label>
              </div>
              <Textarea placeholder="What did I do for my business?" value={record.businessNote ?? ""}
                onChange={(e) => patch({ businessNote: e.target.value })} />
            </div>
          </Row>

          <Row icon={<PiggyBank className="h-4 w-4" />} title="Savings" done={status.savings}
            summary={`${formatCurrency(record.savingsAmount)} / ${formatCurrency(data.config.savingsTarget)}`}>
            <div className="space-y-1.5">
              <Label htmlFor="d-sav" className="text-xs">Amount saved (৳)</Label>
              <Input id="d-sav" type="number" min={0} inputMode="numeric" value={record.savingsAmount || ""}
                onChange={(e) => patch({ savingsAmount: Math.max(0, Number(e.target.value) || 0) })} />
            </div>
          </Row>

          <Button variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({
  icon, title, summary, done, children,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </div>
        <span className={cn("text-xs font-medium", done ? "text-emerald-500" : "text-muted-foreground")}>
          {summary} {done ? "✓" : ""}
        </span>
      </div>
      {children}
    </div>
  );
}
