create table if not exists public.characters_trend (
  id text primary key,
  character_name text not null,
  image_url text,
  service_name text not null,
  genre_tags text[] not null default '{}',
  chat_count bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists characters_trend_service_name_idx
  on public.characters_trend (service_name);

create index if not exists characters_trend_chat_count_idx
  on public.characters_trend (chat_count desc);
