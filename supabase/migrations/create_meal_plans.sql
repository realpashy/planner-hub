create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  week_start text not null,
  version int not null,
  is_active boolean not null default true,
  preferences jsonb not null default '{}'::jsonb,
  plan_data jsonb not null default '{}'::jsonb,
  usage_data jsonb not null default '{}'::jsonb,
  source text not null default 'basic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start, version)
);
