import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const KAKAOPAGE_LAYOUT_API_URL =
  process.env.KAKAOPAGE_LAYOUT_API_URL ||
  "https://bff-page.kakao.com/api/gateway/view/v1/layout?screen_uid=46";

const tableName = process.env.SUPABASE_TABLE_NAME || "characters_trend";
const serviceName = "KakaoPage";
const category = "web_novel";

function randomDelay(minMs = 1000, maxMs = 3000) {
  const waitMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, waitMs));
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function kakaoHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    Origin: "https://page.kakao.com",
    Referer: "https://page.kakao.com/",
  };
}

async function fetchLayout() {
  await randomDelay();

  const response = await fetch(KAKAOPAGE_LAYOUT_API_URL, {
    headers: kakaoHeaders(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[KakaoPage API Error Body]", errorBody);
    throw new Error(`Failed to fetch KakaoPage layout API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function collectSeriesItems(payload) {
  const reference = payload?.result?.reference || {};
  const candidates = [reference.series_card_view, reference.series_poster_view];
  const items = [];

  for (const candidate of candidates) {
    collectSeriesLikeObjects(candidate, items);
  }

  return items;
}

function collectSeriesLikeObjects(value, output) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSeriesLikeObjects(item, output);
    }
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  if (value.series_id && value.title) {
    output.push(value);
  }

  for (const nestedValue of Object.values(value)) {
    collectSeriesLikeObjects(nestedValue, output);
  }
}

function buildImageUrl(thumbnail) {
  const value = cleanText(thumbnail);

  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const filename = encodeURIComponent(value);
  return `https://dn-img-page.kakao.com/php?filename=${filename}/600x0`;
}

function mapSeriesToRows(payload) {
  const rowsBySeriesId = new Map();

  for (const item of collectSeriesItems(payload)) {
    const seriesId = cleanText(item?.series_id);
    const title = cleanText(item?.title);

    if (!seriesId || !title || rowsBySeriesId.has(seriesId)) {
      continue;
    }

    rowsBySeriesId.set(seriesId, {
      id: `kakaopage-${seriesId}`,
      character_name: title,
      image_url: buildImageUrl(item?.thumbnail),
      service_name: serviceName,
      category,
      genre_tags: [cleanText(item?.category), cleanText(item?.sub_category)].filter(Boolean),
      chat_count: 0,
      view_count: Number(item?.service_property?.view_count) || 0,
    });
  }

  return Array.from(rowsBySeriesId.values());
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
    console.log("업데이트할 카카오페이지 웹소설 데이터가 없습니다.");
    return;
  }

  const { error } = await createSupabaseClient().from(tableName).upsert(rows, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw error;
  }

  console.log(`카카오페이지 웹소설 ${rows.length}개를 성공적으로 업데이트했습니다.`);
}

async function main() {
  console.log("카카오페이지 layout API에서 웹소설 랭킹 데이터를 수집합니다...");
  const payload = await fetchLayout();
  const rows = mapSeriesToRows(payload);
  await upsertRows(rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
