-- ─────────────────────────────────────────────────────────────────────
--  MenuDrop database schema
--  Run in Supabase SQL editor (or `supabase db push`).
--  Row-Level Security is enabled so users can only read/write their own
--  rows. The service-role key (server-side only) bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── restaurant_profiles ──────────────────────────────────────────────
create table if not exists public.restaurant_profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  logo_url          text,
  logo_public_id    text,
  street            text,
  city              text,
  display_phone     text,
  maps_link         text,
  caption_language  text not null default 'en' check (caption_language in ('en','ml','both')),
  brand_color       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id)
);

-- ─── post_history ─────────────────────────────────────────────────────
create table if not exists public.post_history (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  dishes          jsonb not null default '[]'::jsonb,
  captions        jsonb not null default '{}'::jsonb,
  background      jsonb,
  format          text,
  image_url       text,
  platform_used   text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_post_history_user_date
  on public.post_history (user_id, created_at desc);

-- ─── subscriptions ────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  plan                text not null default 'free' check (plan in ('free','starter','pro')),
  razorpay_sub_id     text,
  status              text not null default 'active' check (status in ('active','cancelled','expired')),
  current_period_end  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id)
);

-- ─── updated_at trigger ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated on public.restaurant_profiles;
create trigger trg_profiles_updated before update on public.restaurant_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_subs_updated on public.subscriptions;
create trigger trg_subs_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ─── Row-Level Security ───────────────────────────────────────────────
alter table public.restaurant_profiles enable row level security;
alter table public.post_history        enable row level security;
alter table public.subscriptions       enable row level security;

create policy "own profile"  on public.restaurant_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own posts"    on public.post_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sub"      on public.subscriptions
  for select using (auth.uid() = user_id);
