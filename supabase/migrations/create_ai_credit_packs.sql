create table if not exists ai_credit_packs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  extra_full_generations int not null default 0,
  extra_light_edits int not null default 0,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
