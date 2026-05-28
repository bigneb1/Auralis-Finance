create table if not exists users (
  wallet_address text primary key,
  chain_id integer,
  jurisdiction text,
  risk_profile text,
  mode text,
  liquidity text,
  max_drawdown text,
  display_name text,
  appearance text,
  notifications jsonb,
  onboarding_done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users add column if not exists chain_id integer;
alter table users add column if not exists liquidity text;
alter table users add column if not exists max_drawdown text;
alter table users add column if not exists display_name text;
alter table users add column if not exists appearance text;
alter table users add column if not exists notifications jsonb;
alter table users add column if not exists updated_at timestamptz default now();

create table if not exists ratings (
  asset_id text primary key,
  rating_json jsonb not null,
  rating_hash text not null unique,
  methodology_version integer not null,
  updated_at timestamptz not null default now()
);
create index if not exists ratings_updated_at_idx on ratings(updated_at desc);

create table if not exists compliance_reports (
  id text primary key,
  wallet text not null,
  report_json jsonb not null,
  check_hash text not null unique,
  created_at timestamptz default now()
);
create index if not exists compliance_reports_wallet_idx on compliance_reports(wallet, created_at desc);

create table if not exists attestations (
  id text primary key,
  wallet text not null,
  asset_class text not null,
  verdict text not null,
  check_hash text not null,
  tx_hash text,
  valid_until timestamptz,
  revoked boolean default false,
  created_at timestamptz default now()
);
create index if not exists attestations_wallet_class_idx on attestations(wallet, asset_class, created_at desc);

create table if not exists decisions (
  id text primary key,
  wallet text not null,
  decision_json jsonb not null,
  decision_hash text not null unique,
  action_type text not null,
  outcome text not null,
  tx_hash text,
  created_at timestamptz default now()
);
create index if not exists decisions_wallet_idx on decisions(wallet, created_at desc);

create table if not exists policies (
  wallet text primary key,
  policy_json jsonb not null,
  tx_hash text,
  updated_at timestamptz default now()
);
