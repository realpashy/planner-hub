create table if not exists saved_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  week_key text not null,
  preferences jsonb not null default '{}'::jsonb,
  plan_data jsonb not null default '{}'::jsonb,
  source text not null default 'local',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
