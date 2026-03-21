create table if not exists profiles (
  id text primary key references app_users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'super_admin', 'user')),
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro', 'admin')),
  ai_enabled boolean not null default true,
  timezone text not null default 'Asia/Jerusalem',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
