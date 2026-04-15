"use client";

import { cn } from "@/lib/utils";
import { periodLabels } from "@/lib/mock-data";
import type { TrendPeriod } from "@/types/trend";

const periods: TrendPeriod[] = ["daily", "weekly", "monthly"];

type PeriodTabsProps = {
  activePeriod: TrendPeriod;
  onChange: (period: TrendPeriod) => void;
};

export function PeriodTabs({ activePeriod, onChange }: PeriodTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-dashboard-line bg-dashboard-panel p-1 shadow-panel">
      {periods.map((period) => {
        const isActive = activePeriod === period;

        return (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            className={cn(
              "min-w-20 rounded-md px-4 py-2 text-sm font-semibold text-dashboard-muted transition",
              "hover:bg-dashboard-panelSoft hover:text-dashboard-text",
              isActive && "bg-dashboard-mint text-slate-950 hover:bg-dashboard-mint hover:text-slate-950"
            )}
          >
            {periodLabels[period]}
          </button>
        );
      })}
    </div>
  );
}
