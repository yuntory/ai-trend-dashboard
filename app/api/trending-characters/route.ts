import { NextResponse } from "next/server";
import { getKstDateString } from "@/lib/api/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TrendRow = {
  source_key: string;
  character_name: string;
  image_url: string | null;
  service_name: string;
  genre_tags: string[] | null;
  chat_count: number | null;
  ranking: number | null;
  trend_date: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";
  const today = getKstDateString();
  const yesterday = getKstDateString(-1);

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("characters_trend")
      .select("source_key, character_name, image_url, service_name, genre_tags, chat_count, ranking, trend_date")
      .eq("period", period)
      .in("trend_date", [today, yesterday]);

    if (error) {
      throw error;
    }

    const grouped = new Map<string, { today?: TrendRow; yesterday?: TrendRow }>();

    for (const row of (data || []) as TrendRow[]) {
      const bucket = grouped.get(row.source_key) || {};
      if (row.trend_date === today) {
        bucket.today = row;
      }
      if (row.trend_date === yesterday) {
        bucket.yesterday = row;
      }
      grouped.set(row.source_key, bucket);
    }

    const characters = Array.from(grouped.values())
      .filter((bucket) => bucket.today)
      .map((bucket) => {
        const todayRow = bucket.today as TrendRow;
        const todayChatCount = todayRow.chat_count || 0;
        const yesterdayChatCount = bucket.yesterday?.chat_count || 0;
        const growthRate =
          yesterdayChatCount > 0
            ? ((todayChatCount - yesterdayChatCount) / yesterdayChatCount) * 100
            : todayChatCount > 0
              ? 100
              : 0;

        return {
          id: todayRow.source_key,
          characterName: todayRow.character_name,
          image_url: todayRow.image_url || "",
          serviceName: todayRow.service_name,
          genreTags: todayRow.genre_tags || [],
          metrics: {
            viewCount: 0,
            chatCount: todayChatCount,
            averageChatTurn: 0,
          },
          todayChatCount,
          yesterdayChatCount,
          growthRate: Number(growthRate.toFixed(1)),
        };
      })
      .sort((a, b) => b.growthRate - a.growthRate || b.todayChatCount - a.todayChatCount)
      .slice(0, 10)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return NextResponse.json({ date: today, compareDate: yesterday, period, characters });
  } catch (error) {
    console.error("[trending-characters]", error);
    return NextResponse.json({ error: "Failed to load trending characters." }, { status: 500 });
  }
}
