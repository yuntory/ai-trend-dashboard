import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "ai_character";
  const service = searchParams.get("service") || "all";
  const orderColumn = category === "web_novel" ? "view_count" : "chat_count";

  try {
    const supabase = createSupabaseServerClient();
    
    // 1. 필요한 컬럼을 Supabase에서 정확히 가져옵니다.
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

    if (error) throw error;

    const seenNames = new Set<string>();
    const characters = [];

    // 2. 데이터를 정제해서 내보냅니다.
    for (const item of (data || [])) {
      const normalizedName = item.character_name?.trim().toLowerCase();

      // 중복 데이터 방지
      if (!normalizedName || seenNames.has(normalizedName)) continue;
      seenNames.add(normalizedName);

      // ★ 기획자님 핵심 포인트: 화면에서 찾기 쉽게 이름표를 두 종류 다 보내버립니다.
      characters.push({
        id: item.id,
        // 아래처럼 snake_case와 camelCase 둘 다 넣어주면 무조건 나옵니다.
        character_name: item.character_name, 
        characterName: item.character_name,
        image_url: item.image_url,
        imageUrl: item.image_url || "https://via.placeholder.com/300x220/111827/2dd4bf?text=No+Image",
        service_name: item.service_name,
        serviceName: item.service_name,
        genre_tags: item.genre_tags || [],
        genreTags: item.genre_tags || [],
        chat_count: item.chat_count || 0,
        chatCount: item.chat_count || 0,
        view_count: item.view_count || 0,
        viewCount: item.view_count || 0,
        category: item.category || "ai_character",
      });

      if (characters.length === 20) break;
    }

    return NextResponse.json({ characters });
  } catch (error) {
    console.error("[api/trending]", error);
    return NextResponse.json({ error: "Failed to fetch trending characters." }, { status: 500 });
  }
}