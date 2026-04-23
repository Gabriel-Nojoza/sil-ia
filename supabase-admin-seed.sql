-- 1. Cria uma empresa inicial
with inserted_company as (
  insert into companies (
    name,
    workspace_id,
    dataset_id,
    timezone,
    language,
    powerbi_identity_mode
  )
  values (
    'SIL Inteligencia Analitica',
    '4f51b7d2-0de5-4d98-9f71-5797dc4a1945',
    '63b6d1a8-b95a-4730-9d0b-04d6b17af932',
    'America/Sao_Paulo',
    'pt-BR',
    'service_principal'
  )
  on conflict do nothing
  returning id
)

-- 2. Cria um usuario admin vinculado a essa empresa
insert into users (
  company_id,
  name,
  email,
  role,
  status
)
select
  coalesce(
    (select id from inserted_company limit 1),
    (select id from companies where name = 'SIL Inteligencia Analitica' limit 1)
  ),
  'Administrador SIL',
  'admin@sil.local',
  'admin',
  'active'
where not exists (
  select 1
  from users
  where email = 'admin@sil.local'
);

-- 3. Consulta de validacao
select
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  u.status,
  c.id as company_id,
  c.name as company_name
from users u
join companies c on c.id = u.company_id
where u.email = 'admin@sil.local';
