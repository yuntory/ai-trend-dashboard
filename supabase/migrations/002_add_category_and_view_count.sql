alter table if exists public.characters_trend
  add column if not exists category text not null default 'ai_character';

alter table if exists public.characters_trend
  add column if not exists view_count bigint not null default 0;

create index if not exists characters_trend_category_idx
  on public.characters_trend (category);

create index if not exists characters_trend_view_count_idx
  on public.characters_trend (view_count desc);
