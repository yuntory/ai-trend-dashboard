import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const chartColors = ["#2dd4bf", "#38bdf8", "#fb7185", "#fbbf24", "#a78bfa", "#22c55e"];

type PlatformRow = {
  service_name: string;
  chat_count: number | null;
  view_count: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "ai_character";
  const service = searchParams.get("service") || "all";
  const metricKey = category === "web_novel" ? "view_count" : "chat_count";

  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("characters_trend")
      .select("service_name, chat_count, view_count")
      .eq("category", category);

    if (service !== "all") {
      query = query.eq("service_name", service);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const totals = new Map<string, number>();

    for (const row of (data || []) as PlatformRow[]) {
      totals.set(row.service_name, (totals.get(row.service_name) || 0) + (row[metricKey] || 0));
    }

    const totalChatCount = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
    const platforms = Array.from(totals.entries())
      .map(([name, chatCount], index) => ({
        name,
        chatCount,
        value: totalChatCount ? Number(((chatCount / totalChatCount) * 100).toFixed(1)) : 0,
        color: chartColors[index % chartColors.length],
      }))
      .sort((a, b) => b.chatCount - a.chatCount);

    return NextResponse.json({ totalChatCount, platforms });
  } catch (error) {
    console.error("[api/platform-stats]", error);
    return NextResponse.json({ error: "Failed to fetch platform stats." }, { status: 500 });
  }
}
