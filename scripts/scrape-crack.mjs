import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const CRACK_API_URL =
  process.env.CRACK_RANKING_URL ||
  "https://crack-api.wrtn.ai/crack-api/stories?sort=totalMessageCount.desc&isOriginal=true";

const tableName = process.env.SUPABASE_TABLE_NAME || "characters_trend";
const serviceName = "Crack";
const category = "ai_character";

function randomDelay(minMs = 1000, maxMs = 3000) {
  const waitMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, waitMs));
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getImageUrl(story) {
  const rawUrl = cleanText(
    story?.imageUrl ||
      story?.portraitImageUrl ||
      story?.profileImage?.origin ||
      ""
  );

  return toAbsoluteImageUrl(rawUrl);
}

function toAbsoluteImageUrl(rawUrl) {
  if (!rawUrl) {
    return "";
  }

  if (rawUrl.startsWith("//")) {
    return `https:${rawUrl}`;
  }

  try {
    return new URL(rawUrl, "https://crack.wrtn.ai/").toString();
  } catch {
    return rawUrl;
  }
}

async function fetchStories() {
  await randomDelay();

  const response = await fetch(CRACK_API_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      Origin: "https://crack.wrtn.ai",
      Referer: "https://crack.wrtn.ai/",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Crack API Error Body]", errorBody);
    throw new Error(`Failed to fetch Crack API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function mapStoriesToRows(payload) {
  const stories = Array.isArray(payload?.data?.stories) ? payload.data.stories : [];

  return stories
    .map((story) => {
      const id = cleanText(story?._id);
      const characterName = cleanText(story?.name);

      if (!id || !characterName) {
        return null;
      }

      const imageUrl = getImageUrl(story);

      if (!imageUrl) {
        console.warn(`Crack 이미지 URL이 없어 스킵합니다: ${characterName} (${id})`);
        return null;
      }

      return {
        id,
        character_name: characterName,
        image_url: imageUrl,
        service_name: serviceName,
        category,
        genre_tags: Array.isArray(story?.categories)
          ? story.categories.map((item) => cleanText(item?.name)).filter(Boolean)
          : [],
        chat_count: Number(story?.totalMessageCount) || 0,
        view_count: Number(story?.viewCount || story?.totalViewCount) || 0,
      };
    })
    .filter(Boolean);
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function upsertRows(rows) {
  if (!rows.length) {
    console.log("업데이트할 Crack 캐릭터 데이터가 없습니다.");
    return;
  }

  const { error } = await createSupabaseClient().from(tableName).upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }

  console.log(`Crack 캐릭터 ${rows.length}개를 성공적으로 업데이트했습니다.`);
}

async function main() {
  console.log("Crack 실제 API에서 AI 캐릭터 랭킹 데이터를 수집합니다...");
  const payload = await fetchStories();
  const rows = mapStoriesToRows(payload);
  await upsertRows(rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
