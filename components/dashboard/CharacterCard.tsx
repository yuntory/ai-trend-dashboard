import React from 'react';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';

export const CharacterCard = ({ character, rank, metricType }: any) => {
  const displayName = character.character_name || character.characterName || 'Unknown';
  
  // ★ [기획자 전용 패치] 사진이 비어있을 때 플랫폼별 기본 이미지 설정
  let imageUrl = character.image_url || character.imageUrl;
  
  if (!imageUrl || imageUrl === "") {
    if (character.service_name === 'Crack') {
      // 크랙 이미지가 없을 때 띄울 임시 세련된 이미지
      imageUrl = "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=300&h=220&auto=format&fit=crop";
    } else if (character.service_name === 'KakaoPage') {
      imageUrl = "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=300&h=220&auto=format&fit=crop";
    } else {
      imageUrl = "https://via.placeholder.com/300x220/111827/2dd4bf?text=AI+Trend";
    }
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
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          className="object-cover transition-transform hover:scale-105"
          unoptimized
        />
        <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          TOP {rank}
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-dashboard-mint/80 px-2 py-0.5 text-[10px] font-bold text-slate-950">
          {character.service_name || character.serviceName}
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 truncate text-sm font-bold text-dashboard-text">{displayName}</h3>
        <div className="flex items-center justify-between border-t border-dashboard-line pt-3 text-[11px]">
          <span className="text-dashboard-muted">
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