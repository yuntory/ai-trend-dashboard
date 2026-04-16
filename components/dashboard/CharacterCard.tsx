import React from 'react';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';

export const CharacterCard = ({ character, rank, metricType }: any) => {
  const displayName = character.character_name || character.characterName || 'Unknown';
  
  // 1. 진짜 주소인지 확인하는 로직 추가
  let rawUrl = character.image_url || character.imageUrl;
  let imageUrl = "";

  // 주소가 비어있거나, "EMPTY"라고 적혀있으면 가짜로 판정!
  if (!rawUrl || rawUrl === "" || rawUrl === "EMPTY") {
    if (character.service_name === 'Crack') {
      imageUrl = "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=400&h=300&auto=format&fit=crop";
    } else {
      imageUrl = "https://via.placeholder.com/400x300/111827/2dd4bf?text=AI+Trend";
    }
  } else {
    imageUrl = rawUrl;
  }

  const count = character.chat_count || character.chatCount || character.view_count || character.viewCount || 0;

  const formatCount = (num: number) => {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
    return num.toLocaleString();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-dashboard-line bg-dashboard-panel shadow-lg transition-all hover:translate-y-[-4px]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-dashboard-panelSoft">
        {/* 일반 img 태그를 써서 검문소를 더 쉽게 통과하게 바꿨습니다 */}
        <img
          src={imageUrl}
          alt={displayName}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
        <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          TOP {rank}
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-dashboard-mint/80 px-2 py-0.5 text-[10px] font-bold text-slate-950">
          {character.service_name || character.serviceName}
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 truncate text-sm font-bold text-dashboard-textMain">{displayName}</h3>
        <div className="flex items-center justify-between border-t border-dashboard-line pt-3 text-[11px]">
          <span className="text-dashboard-textMuted">
            {character.service_name === 'KakaoPage' ? '총 조회 수' : '총 채팅 수'}
          </span>
          <div className="flex items-center gap-1.5 font-bold text-dashboard-mint">
            <MessageSquare className="h-3 w-3" />
            {formatCount(count)}
          </div>
        </div>
      </div>
    </div>
  );
};