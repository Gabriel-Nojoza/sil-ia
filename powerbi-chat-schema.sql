create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  workspace_id uuid not null,
  dataset_id uuid not null,
  timezone text default 'America/Sao_Paulo',
  language text default 'pt-BR',
  powerbi_identity_mode text default 'service_principal',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint users_role_check check (role in ('admin', 'user'))
);

create table if not exists company_catalog (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  artifact_type text not null,
  table_name text,
  column_name text,
  measure_name text,
  dax_expression text,
  description text,
  synonyms jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_company_catalog_company_id
  on company_catalog(company_id);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  company_id uuid not null references companies(id) on delete cascade,
  role text not null,
  content text not null,
  dax_query text,
  response_metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session_id
  on chat_messages(session_id);

create index if not exists idx_chat_messages_company_id
  on chat_messages(company_id);
