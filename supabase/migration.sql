-- Global leaderboard for Science Based Quiz online 1v1 mode
-- Run this once in the Supabase SQL editor (Database > SQL Editor) for your project.
-- Also enable "Anonymous sign-ins" under Authentication > Providers before deploying.

create table if not exists public.leaderboard (
  player_id uuid primary key,
  username text not null check (char_length(username) between 2 and 24),
  rating integer not null default 1000 check (rating between 0 and 4000),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  ties integer not null default 0 check (ties >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

-- Anyone can read the leaderboard (it's public).
create policy "leaderboard_select_all"
  on public.leaderboard for select
  using (true);

-- A player can only create/update their own row, tied to their anonymous auth id.
create policy "leaderboard_insert_own"
  on public.leaderboard for insert
  with check (auth.uid() = player_id);

create policy "leaderboard_update_own"
  on public.leaderboard for update
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

-- Realtime: make sure the table broadcasts changes to subscribed clients.
alter publication supabase_realtime add table public.leaderboard;

create index if not exists leaderboard_rating_idx on public.leaderboard (rating desc);
