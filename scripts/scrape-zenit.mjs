import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const targetUrl = process.env.ZENIT_RANKING_URL || "https://example.com/zenit/rankings";
const tableName = process.env.SUPABASE_TABLE_NAME || "characters_trend";
const serviceName = "Zenit";
const category = "ai_character";

const selectors = {
  card: process.env.ZENIT_CARD_SELECTOR || ".ranking-card",
  name: process.env.ZENIT_NAME_SELECTOR || ".character-name",
  image: process.env.ZENIT_IMAGE_SELECTOR || "img.character-image",
  chatCount: process.env.ZENIT_CHAT_COUNT_SELECTOR || ".chat-count",
  genreTag: process.env.ZENIT_GENRE_TAG_SELECTOR || ".genre-tag",
};

function randomDelay(minMs = 1000, maxMs = 3000) {
  return new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs));
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseCount(value) {
  const text = cleanText(value).toLowerCase().replaceAll(",", "");
  const match = text.match(/(\d+(?:\.\d+)?)\s*([km만천]?)/);
  if (!match) return Number(text.replace(/\D/g, "")) || 0;
  const multiplier = { k: 1_000, m: 1_000_000, 천: 1_000, 만: 10_000 }[match[2]] || 1;
  return Math.round(Number(match[1]) * multiplier);
}

function stableId(name, imageUrl) {
  return `zenit-${createHash("sha256").update(`${name}:${imageUrl}`).digest("hex")}`;
}

async function fetchHtml() {
  await randomDelay();
  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch Zenit ranking: ${response.status}`);
  return response.text();
}

function parseRows(html) {
  const $ = cheerio.load(html);
  const rows = [];

  $(selectors.card).each((_, element) => {
    const card = $(element);
    const name = cleanText(card.find(selectors.name).first().text());
    const rawImageUrl = card.find(selectors.image).first().attr("src") || "";
    const imageUrl = rawImageUrl ? new URL(rawImageUrl, targetUrl).toString() : "";

    if (!name) return;

    rows.push({
      id: card.attr("data-character-id") || stableId(name, imageUrl),
      character_name: name,
      image_url: imageUrl,
      service_name: serviceName,
      category,
      genre_tags: card.find(selectors.genreTag).map((__, tag) => cleanText($(tag).text())).get().filter(Boolean),
      chat_count: parseCount(card.find(selectors.chatCount).first().text()),
      view_count: 0,
    });
  });

  return rows;
}

async function upsertRows(rows) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables.");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from(tableName).upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`Zenit 캐릭터 ${rows.length}개를 업데이트했습니다.`);
}

const html = await fetchHtml();
await upsertRows(parseRows(html));
