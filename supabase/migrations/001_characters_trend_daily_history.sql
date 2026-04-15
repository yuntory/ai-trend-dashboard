alter table if exists public.characters_trend
  add column if not exists trend_date date not null default (now() at time zone 'Asia/Seoul')::date;

alter table if exists public.characters_trend
  drop constraint if exists characters_trend_pkey;

alter table if exists public.characters_trend
  add constraint characters_trend_pkey primary key (source_key, trend_date, period);

create index if not exists characters_trend_trend_date_idx
  on public.characters_trend (trend_date);

create index if not exists characters_trend_period_trend_date_idx
  on public.characters_trend (period, trend_date);
