import type { CharacterItem, ContentCategory } from "@/types/trend";

const fallbackImageUrl = "https://via.placeholder.com/300x220/111827/2dd4bf?text=AI+Character";

type CharacterRecord = Partial<CharacterItem> & {
  character_name?: string;
  name?: string;
  image_url?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  service_name?: string;
  genre_tags?: string[];
  chat_count?: number;
  view_count?: number;
};

export function normalizeCharacter(item: CharacterRecord): CharacterItem {
  const characterName = cleanText(item.characterName || item.character_name || item.name);
  const imageUrl = cleanText(item.imageUrl || item.image_url || item.thumbnailUrl || item.coverImageUrl);
  const serviceName = cleanText(item.serviceName || item.service_name || "Unknown");
  const genreTags = Array.isArray(item.genreTags) ? item.genreTags : Array.isArray(item.genre_tags) ? item.genre_tags : [];

  return {
    id: cleanText(item.id) || `${serviceName}-${characterName}`,
    characterName: characterName || "Unknown",
    imageUrl: imageUrl || fallbackImageUrl,
    serviceName,
    category: normalizeCategory(item.category),
    genreTags: genreTags.map(cleanText).filter(Boolean),
    chatCount: toNumber(item.chatCount ?? item.chat_count),
    viewCount: toNumber(item.viewCount ?? item.view_count),
  };
}

function cleanText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeCategory(value: unknown): ContentCategory {
  return value === "web_novel" ? "web_novel" : "ai_character";
}
