create extension if not exists pgcrypto;

create table if not exists repositories (
  id uuid primary key default gen_random_uuid(),
  github_repo_id bigint not null unique,
  owner text not null,
  name text not null,
  full_name text not null unique,
  github_url text not null,
  description text,
  primary_language text,
  stars_total integer,
  forks_total integer,
  default_branch text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trending_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  captured_at timestamptz not null,
  status text not null check (status in ('running', 'success', 'failed')),
  item_count integer not null default 0,
  source text not null default 'github-trending',
  created_at timestamptz not null default now()
);

create table if not exists trending_snapshot_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references trending_snapshots(id) on delete cascade,
  repository_id uuid not null references repositories(id) on delete cascade,
  rank integer not null,
  stars_today integer,
  repo_description_snapshot text,
  readme_excerpt text,
  summary_ko text not null,
  created_at timestamptz not null default now(),
  constraint trending_snapshot_items_snapshot_rank_key unique (snapshot_id, rank),
  constraint trending_snapshot_items_snapshot_repository_key unique (snapshot_id, repository_id)
);
