"use client";

import { Activity, Bot, MessageSquareText, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CharacterGrid } from "@/components/dashboard/CharacterGrid";
import { KeywordList } from "@/components/dashboard/KeywordList";
import { PeriodTabs } from "@/components/dashboard/PeriodTabs";
import { PlatformShareChart } from "@/components/dashboard/PlatformShareChart";
import { normalizeCharacter } from "@/lib/normalize-character";
import { cn } from "@/lib/utils";
import { formatCompactNumber } from "@/lib/utils";
import { periodLabels } from "@/lib/mock-data";
import type { CharacterItem, ContentCategory, GenreStat, KeywordTrend, PlatformShare, TrendPeriod } from "@/types/trend";

type TrendingResponse = {
  characters: CharacterItem[];
};

type GenreStatsResponse = {
  genres: GenreStat[];
};

type PlatformStatsResponse = {
  platforms: PlatformShare[];
};

const categoryTabs: Array<{ label: string; value: ContentCategory }> = [
  { label: "AI 캐릭터", value: "ai_character" },
  { label: "웹소설", value: "web_novel" },
];

const serviceTabsByCategory: Record<ContentCategory, Array<{ label: string; value: string }>> = {
  ai_character: [
    { label: "전체", value: "all" },
    { label: "Zeta", value: "Zeta" },
    { label: "Crack", value: "Crack" },
    { label: "Zenit", value: "Zenit" },
  ],
  web_novel: [
    { label: "전체", value: "all" },
    { label: "KakaoPage", value: "KakaoPage" },
  ],
};

export function DashboardMain() {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>("ai_character");
  const [activeService, setActiveService] = useState("all");
  const [activePeriod, setActivePeriod] = useState<TrendPeriod>("daily");
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [genreKeywords, setGenreKeywords] = useState<KeywordTrend[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const isWebNovel = activeCategory === "web_novel";
  const primaryMetricLabel = isWebNovel ? "총 조회 수" : "총 채팅 수";
  const primaryMetricKey = isWebNovel ? "viewCount" : "chatCount";
  const totalPrimaryMetric = characters.reduce((sum, item) => sum + item[primaryMetricKey], 0);
  const topService = platformStats[0]?.name ?? characters[0]?.serviceName ?? "-";
  const serviceTabs = useMemo(() => serviceTabsByCategory[activeCategory], [activeCategory]);

  function handleCategoryChange(category: ContentCategory) {
    setActiveCategory(category);
    setActiveService("all");
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboardData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const query = new URLSearchParams({
          category: activeCategory,
          service: activeService,
        });
        const [trendingResponse, genreResponse, platformResponse] = await Promise.all([
          fetch(`/api/trending?${query.toString()}`, { signal: controller.signal }),
          fetch(`/api/genre-stats?${query.toString()}`, { signal: controller.signal }),
          fetch(`/api/platform-stats?${query.toString()}`, { signal: controller.signal }),
        ]);

        if (!trendingResponse.ok || !genreResponse.ok || !platformResponse.ok) {
          throw new Error("대시보드 데이터를 불러올 수 없습니다.");
        }

        const [trending, genreStats, platformData] = (await Promise.all([
          trendingResponse.json(),
          genreResponse.json(),
          platformResponse.json(),
        ])) as [TrendingResponse, GenreStatsResponse, PlatformStatsResponse];

        setCharacters((trending.characters || []).map((item) => normalizeCharacter(item)));
        setGenreKeywords(
          (genreStats.genres || []).slice(0, 5).map((item) => ({
            keyword: item.genre,
            delta: item.percentage,
          }))
        );
        setPlatformStats(platformData.platforms || []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("[dashboard]", error);
        setErrorMessage("데이터를 불러오지 못했습니다. Supabase 연결 상태나 터미널의 에러 로그를 확인해주세요.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => controller.abort();
  }, [activeCategory, activeService]);

  return (
    <main className="min-h-screen bg-dashboard-bg">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-8 px-5 py-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-lg border border-dashboard-line bg-dashboard-panel p-5 shadow-panel lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-dashboard-mint">
              <Sparkles className="h-4 w-4" />
              AI 채팅 트렌드 분석
            </div>
            <h1 className="text-3xl font-black tracking-tight text-dashboard-text sm:text-4xl">
              AI 캐릭터 트렌드 대시보드
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-dashboard-muted">
              제타, 젠잇, 크랙 등 주요 AI 채팅 서비스의 인기 캐릭터와 장르 트렌드를 실시간으로 확인하세요.
            </p>
          </div>
          <PeriodTabs activePeriod={activePeriod} onChange={setActivePeriod} />
        </header>

        <section className="inline-flex w-fit rounded-lg border border-dashboard-line bg-dashboard-panel p-1 shadow-panel">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleCategoryChange(tab.value)}
                className={cn(
                  "min-w-24 rounded-md px-4 py-2 text-sm font-semibold text-dashboard-muted transition",
                  "hover:bg-dashboard-panelSoft hover:text-dashboard-text",
                  isActive && "bg-dashboard-mint text-slate-950 hover:bg-dashboard-mint hover:text-slate-950"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </section>

        <section className="flex flex-wrap items-center gap-2">
          {serviceTabs.map((tab) => {
            const isActive = activeService === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveService(tab.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                  "border-dashboard-line bg-transparent text-dashboard-muted hover:border-dashboard-mint hover:text-dashboard-text",
                  isActive && "border-dashboard-mint bg-dashboard-mint/15 text-dashboard-mint"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<MessageSquareText className="h-5 w-5" />}
            label={`${periodLabels[activePeriod]} ${primaryMetricLabel}`}
            value={formatCompactNumber(totalPrimaryMetric)}
            accent="text-dashboard-coral"
          />
          <SummaryCard
            icon={<Activity className="h-5 w-5" />}
            label="분석 중인 캐릭터 수"
            value={`${characters.length}`}
            accent="text-dashboard-sky"
          />
          <SummaryCard
            icon={<Bot className="h-5 w-5" />}
            label="1위 플랫폼"
            value={topService}
            accent="text-dashboard-mint"
          />
        </section>

        {(isLoading || errorMessage) && (
          <section className="rounded-lg border border-dashboard-line bg-dashboard-panel px-5 py-4 text-sm text-dashboard-muted shadow-panel">
            {isLoading ? "데이터를 불러오는 중입니다..." : errorMessage}
          </section>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <CharacterGrid
            characters={characters}
            title={isWebNovel ? "인기 웹소설 랭킹" : "인기 급상승 캐릭터"}
            description={`Supabase 실시간 데이터 기반 ${periodLabels[activePeriod]} 랭킹`}
            metricLabel={primaryMetricLabel}
            metricKey={primaryMetricKey}
          />
          <aside className="grid gap-5 xl:sticky xl:top-6">
            <KeywordList
              keywords={genreKeywords}
              eyebrow="실시간 지표"
              title="인기 장르 TOP 5"
            />
            <PlatformShareChart data={platformStats} title="플랫폼 점유율" />
          </aside>
        </div>
      </div>
    </main>
  );
}

type SummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
};

function SummaryCard({ icon, label, value, accent }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-dashboard-line bg-dashboard-panel p-5 shadow-panel">
      <div className={`${accent} mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-dashboard-panelSoft`}>
        {icon}
      </div>
      <p className="text-sm text-dashboard-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-dashboard-text">{value}</strong>
    </div>
  );
}
