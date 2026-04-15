import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CharacterTrendRow = {
  id: string;
  character_name: string;
  image_url: string | null;
  service_name: string;
  category: "ai_character" | "web_novel" | null;
  genre_tags: string[] | null;
  chat_count: number | null;
  view_count: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "ai_character";
  const service = searchParams.get("service") || "all";
  const orderColumn = category === "web_novel" ? "view_count" : "chat_count";

  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("characters_trend")
      .select("id, character_name, image_url, service_name, category, genre_tags, chat_count, view_count")
      .eq("category", category)
      .order(orderColumn, { ascending: false })
      .limit(100);

    if (service !== "all") {
      query = query.eq("service_name", service);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const characters = [];

    for (const item of (data || []) as CharacterTrendRow[]) {
      const normalizedId = normalizeKey(item.id);
      const normalizedName = normalizeKey(item.character_name);

      if (!normalizedId || !normalizedName || seenIds.has(normalizedId) || seenNames.has(normalizedName)) {
        continue;
      }

      seenIds.add(normalizedId);
      seenNames.add(normalizedName);
      characters.push({
        id: item.id,
        characterName: item.character_name,
        imageUrl: item.image_url || "https://via.placeholder.com/300x220/111827/2dd4bf?text=AI+Character",
        serviceName: item.service_name,
        category: item.category || "ai_character",
        genreTags: item.genre_tags || [],
        chatCount: item.chat_count || 0,
        viewCount: item.view_count || 0,
      });

      if (characters.length === 20) {
        break;
      }
    }

    return NextResponse.json({ characters });
  } catch (error) {
    console.error("[api/trending]", error);
    return NextResponse.json({ error: "Failed to fetch trending characters." }, { status: 500 });
  }
}

function normalizeKey(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}
