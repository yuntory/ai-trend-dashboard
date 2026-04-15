"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PlatformShare } from "@/types/trend";

type PlatformShareChartProps = {
  data: PlatformShare[];
  title?: string;
};

export function PlatformShareChart({ data, title = "플랫폼별 점유율" }: PlatformShareChartProps) {
  const leader = data.length ? data.reduce((max, item) => (item.value > max.value ? item : max), data[0]) : null;

  return (
    <section className="rounded-lg border border-dashboard-line bg-dashboard-panel p-5 shadow-panel">
      <div className="mb-4">
        <p className="text-sm font-semibold text-dashboard-sky">Market Share</p>
        <h2 className="mt-1 text-xl font-bold text-dashboard-text">{title}</h2>
      </div>

      <div className="relative h-64">
        {!data.length && (
          <div className="flex h-full items-center justify-center rounded-lg bg-dashboard-panelSoft text-sm text-dashboard-muted">
            No chart data yet.
          </div>
        )}
        {data.length > 0 && (
          <>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="86%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "#11151f",
                border: "1px solid #273043",
                borderRadius: 8,
                color: "#f5f7fb",
              }}
              formatter={(value: number) => [`${value}%`, "점유율"]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm text-dashboard-muted">1위</span>
          <strong className="mt-1 text-2xl font-black text-dashboard-text">{leader?.name}</strong>
          <span className="text-sm font-semibold text-dashboard-mint">{leader?.value}%</span>
        </div>
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 rounded-lg bg-dashboard-panelSoft px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm font-semibold text-dashboard-text">{item.name}</span>
            <span className="ml-auto text-sm text-dashboard-muted">{item.value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
