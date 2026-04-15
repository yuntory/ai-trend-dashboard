import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GenreRow = {
  genre_tags: string[] | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "ai_character";
  const service = searchParams.get("service") || "all";

  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("characters_trend")
      .select("genre_tags")
      .eq("category", category);

    if (service !== "all") {
      query = query.eq("service_name", service);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const counts = new Map<string, number>();
    let totalTags = 0;

    for (const row of (data || []) as GenreRow[]) {
      for (const rawTag of row.genre_tags || []) {
        const tag = rawTag.trim();

        if (!tag) {
          continue;
        }

        counts.set(tag, (counts.get(tag) || 0) + 1);
        totalTags += 1;
      }
    }

    const genres = Array.from(counts.entries())
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: totalTags ? Number(((count / totalTags) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));

    return NextResponse.json({ totalTags, genres });
  } catch (error) {
    console.error("[api/genre-stats]", error);
    return NextResponse.json({ error: "Failed to fetch genre stats." }, { status: 500 });
  }
}
