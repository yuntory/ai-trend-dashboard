export type TrendPeriod = "daily" | "weekly" | "monthly";
export type ContentCategory = "ai_character" | "web_novel";

export type CharacterItem = {
  id: string;
  characterName: string;
  imageUrl: string;
  serviceName: string;
  category: ContentCategory;
  genreTags: string[];
  chatCount: number;
  viewCount: number;
};

export type KeywordTrend = {
  keyword: string;
  delta: number;
};

export type PlatformShare = {
  name: string;
  value: number;
  color: string;
};

export type TrendingCharacter = CharacterItem & {
  todayChatCount: number;
  yesterdayChatCount: number;
  growthRate: number;
  rank: number;
};

export type GenreStat = {
  genre: string;
  count: number;
  percentage: number;
};
