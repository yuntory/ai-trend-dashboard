import { ArrowUpRight } from "lucide-react";
import type { KeywordTrend } from "@/types/trend";

type KeywordListProps = {
  keywords: KeywordTrend[];
  eyebrow?: string;
  title?: string;
};

export function KeywordList({
  keywords,
  eyebrow = "Live Signals",
  title = "급상승 키워드 TOP 5",
}: KeywordListProps) {
  return (
    <section className="rounded-lg border border-dashboard-line bg-dashboard-panel p-5 shadow-panel">
      <div className="mb-4">
        <p className="text-sm font-semibold text-dashboard-coral">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold text-dashboard-text">{title}</h2>
      </div>

      <ol className="space-y-3">
        {keywords.map((item, index) => (
          <li
            key={item.keyword}
            className="flex items-center justify-between rounded-lg bg-dashboard-panelSoft px-3 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-dashboard-bg text-xs font-bold text-dashboard-muted">
                {index + 1}
              </span>
              <span className="truncate text-sm font-semibold text-dashboard-text">{item.keyword}</span>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-dashboard-mint">
              <ArrowUpRight className="h-4 w-4" />
              {item.delta}%
            </span>
          </li>
        ))}
      </ol>

      {!keywords.length && (
        <div className="rounded-lg bg-dashboard-panelSoft px-3 py-6 text-center text-sm text-dashboard-muted">
          No genre signals yet.
        </div>
      )}
    </section>
  );
}
