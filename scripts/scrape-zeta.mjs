import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const ZETA_API_URL = process.env.ZETA_API_URL || "https://api.zeta-ai.io/v1/infinite-plots?limit=16";
const serviceName = "Zeta";
const category = "ai_character";
const tableName = process.env.SUPABASE_TABLE_NAME || "characters_trend";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

function randomDelay(minMs = 1000, maxMs = 3000) {
  const waitMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, waitMs));
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function createStableId(characterId) {
  return `zeta-${cleanText(characterId)}`;
}

async function fetchPlots() {
  await randomDelay();

  const response = await fetch(ZETA_API_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: "https://zeta-ai.io/",
      Origin: "https://zeta-ai.io",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Zeta API Error Body]", errorBody);
    throw new Error(`Failed to fetch Zeta API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function mapPlotsToRows(payload) {
  const plots = Array.isArray(payload?.plots) ? payload.plots : [];

  return plots
    .map((plot) => {
      const characterId = cleanText(plot?.id);
      const characterName = cleanText(plot?.name || plot?.firstCharacterName);

      if (!characterId || !characterName) {
        return null;
      }

      return {
        id: createStableId(characterId),
        character_name: characterName,
        image_url: cleanText(plot?.imageUrl),
        service_name: serviceName,
        category,
        chat_count: Number(plot?.interactionCount) || 0,
        view_count: Number(plot?.viewCount) || 0,
        genre_tags: Array.isArray(plot?.hashtags) ? plot.hashtags.filter(Boolean) : [],
      };
    })
    .filter(Boolean);
}

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function upsertRows(rows) {
  const uniqueRows = dedupeRows(rows);

  if (!uniqueRows.length) {
    console.log("업데이트할 Zeta 캐릭터 데이터가 없습니다.");
    return;
  }

  const { error } = await createSupabaseClient().from(tableName).upsert(uniqueRows, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw error;
  }

  console.log(`Zeta 캐릭터 ${uniqueRows.length}명의 데이터를 성공적으로 업데이트했습니다.`);
}

function dedupeRows(rows) {
  const deduped = new Map();

  for (const row of rows) {
    if (!row?.id) continue;

    const previous = deduped.get(row.id);
    if (!previous || row.chat_count > previous.chat_count) {
      deduped.set(row.id, row);
    }
  }

  return Array.from(deduped.values());
}

async function main() {
  console.log("Zeta 실제 API에서 AI 캐릭터 데이터를 수집합니다...");
  const payload = await fetchPlots();
  await upsertRows(mapPlotsToRows(payload));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
