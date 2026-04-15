import { NextResponse } from "next/server";
import { getKstDateString } from "@/lib/api/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PLATFORM_COLORS: Record<string, string> = {
  "제타": "#2dd4bf",
  "젠잇": "#38bdf8",
  "크랙": "#fb7185",
  "루나톡": "#fbbf24",
};

type PlatformRow = {
  service_name: string;
  chat_count: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";
  const trendDate = getKstDateString();

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("characters_trend")
      .select("service_name, chat_count")
      .eq("period", period)
      .eq("trend_date", trendDate);

    if (error) {
      throw error;
    }

    const totals = new Map<string, number>();

    for (const row of (data || []) as PlatformRow[]) {
      totals.set(row.service_name, (totals.get(row.service_name) || 0) + (row.chat_count || 0));
    }

    const totalChatCount = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
    const platforms = Array.from(totals.entries())
      .map(([name, chatCount]) => ({
        name,
        chatCount,
        value: totalChatCount ? Number(((chatCount / totalChatCount) * 100).toFixed(1)) : 0,
        color: PLATFORM_COLORS[name] || "#a78bfa",
      }))
      .sort((a, b) => b.chatCount - a.chatCount);

    return NextResponse.json({ date: trendDate, period, totalChatCount, platforms });
  } catch (error) {
    console.error("[platform-comparison]", error);
    return NextResponse.json({ error: "Failed to load platform comparison." }, { status: 500 });
  }
}
