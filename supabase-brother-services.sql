create table if not exists public.brother_services (
  id text primary key,
  owner_name text not null,
  title text not null,
  category text not null,
  type text not null default 'Serviço',
  city text not null,
  church_name text not null,
  pastor text,
  description text not null,
  whatsapp text,
  instagram_url text,
  website_url text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'hidden')),
  photo_url text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brother_services enable row level security;

drop policy if exists "brother_services_select_approved" on public.brother_services;
create policy "brother_services_select_approved"
on public.brother_services
for select
using (status = 'approved' or auth.uid() in (select user_id from public.directory_admins));

drop policy if exists "brother_services_admin_insert" on public.brother_services;
create policy "brother_services_admin_insert"
on public.brother_services
for insert
with check (auth.uid() in (select user_id from public.directory_admins));

drop policy if exists "brother_services_admin_update" on public.brother_services;
create policy "brother_services_admin_update"
on public.brother_services
for update
using (auth.uid() in (select user_id from public.directory_admins))
with check (auth.uid() in (select user_id from public.directory_admins));

drop policy if exists "brother_services_admin_delete" on public.brother_services;
create policy "brother_services_admin_delete"
on public.brother_services
for delete
using (auth.uid() in (select user_id from public.directory_admins));

create index if not exists brother_services_status_idx on public.brother_services(status);
create index if not exists brother_services_category_idx on public.brother_services(category);
create index if not exists brother_services_church_idx on public.brother_services(church_name);
create index if not exists brother_services_city_idx on public.brother_services(city);
