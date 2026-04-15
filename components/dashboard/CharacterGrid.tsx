import { CharacterCard } from "@/components/dashboard/CharacterCard";
import type { CharacterItem } from "@/types/trend";

type CharacterGridProps = {
  characters: CharacterItem[];
  title?: string;
  description?: string;
  metricLabel?: string;
  metricKey?: "chatCount" | "viewCount";
};

export function CharacterGrid({
  characters,
  title = "종합 인기 캐릭터 TOP 20",
  description = "채팅수 기준 정렬",
  metricLabel = "총 채팅수",
  metricKey = "chatCount",
}: CharacterGridProps) {
  return (
    <section className="min-w-0">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-dashboard-mint">Character Ranking</p>
          <h2 className="mt-1 text-2xl font-bold text-dashboard-text">{title}</h2>
        </div>
        <p className="text-sm text-dashboard-muted">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {characters.map((character, index) => (
          <CharacterCard
            key={character.id}
            character={character}
            rank={index + 1}
            metricLabel={metricLabel}
            metricValue={character[metricKey]}
          />
        ))}
      </div>

      {!characters.length && (
        <div className="rounded-lg border border-dashboard-line bg-dashboard-panel p-8 text-center text-sm text-dashboard-muted shadow-panel">
          No character data yet.
        </div>
      )}
    </section>
  );
}
