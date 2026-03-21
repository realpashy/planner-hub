create table if not exists ai_usage_monthly (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  month_key text not null,
  full_generations_used int not null default 0,
  light_edits_used int not null default 0,
  estimated_input_tokens bigint not null default 0,
  estimated_output_tokens bigint not null default 0,
  estimated_cost_usd numeric not null default 0,
  over_limit_attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, month_key)
);
