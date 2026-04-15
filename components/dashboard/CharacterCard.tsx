import React from 'react';
import Image from 'next/image';
import { CharacterItem } from '@/types/trend';
import { MessageSquare, Eye } from 'lucide-react';

interface CharacterCardProps {
  character: CharacterItem;
  rank: number;
  metricType: 'chat_count' | 'view_count';
}

export const CharacterCard = ({ character, rank, metricType }: CharacterCardProps) => {
  // 어떤 이름표가 들어와도 에러 안 나게 안전하게 이름 가져오기
  const displayName = (character as any).character_name || (character as any).name || 'Unknown Character';
  
  const {
    id,
    chat_count,
    view_count,
    genre_tags,
    image_url,
    service_name,
  } = character;

  const formatCount = (count: number) => {
    if (count >= 100000000) return `${(count / 100000000).toFixed(1)}억`;
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
    return count.toLocaleString();
  };

  const primaryTag = genre_tags?.[0];
  const secondaryTag = genre_tags?.[1];

  return (
    <div className="overflow-hidden rounded-xl border border-dashboard-line bg-dashboard-panel shadow-lg transition-all hover:translate-y-[-4px] hover:border-dashboard-accent/30">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-dashboard-panelSoft">
        {image_url ? (
          <Image
            src={image_url}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-500 hover:scale-110"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-dashboard-panelSoft text-dashboard-textMuted text-xs">
            No Image
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          TOP {rank}
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-dashboard-accent/80 px-2 py-0.5 text-[10px] font-bold text-white">
          {service_name}
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 truncate text-sm font-bold text-dashboard-textMain">
          {displayName}
        </h3>
        
        <div className="mb-4 flex flex-wrap gap-2 h-6 overflow-hidden">
          {[primaryTag, secondaryTag]
            .filter(tag => tag && tag.trim() !== "") 
            .map((tag) => (
              <span 
                key={`tag-${id}-${tag}`} 
                className="rounded-md border border-dashboard-line bg-dashboard-panelSoft px-2 py-0.5 text-[10px] font-medium text-dashboard-textMuted"
              >
                {tag}
              </span>
            ))
          }
        </div>

        <div className="flex items-center justify-between border-t border-dashboard-line pt-3 text-[11px]">
          <span className="text-dashboard-textMuted">
            {metricType === 'chat_count' ? '총 채팅 수' : '총 조회 수'}
          </span>
          <div className="flex items-center gap-1.5 font-bold text-dashboard-accentHighlight">
            {metricType === 'chat_count' ? (
              <MessageSquare className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            {metricType === 'chat_count' 
              ? formatCount(chat_count) 
              : formatCount(view_count || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};