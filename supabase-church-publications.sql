-- Execute no SQL Editor do projeto Supabase existente, após revisar e realizar backup.
-- Não modifica dados nem estrutura das igrejas existentes.
create table if not exists public.church_publications (
 id uuid primary key default gen_random_uuid(),
 church_id text not null,
 kind text not null check (kind in ('event','news','report')),
 title text not null check (length(trim(title)) between 3 and 180),
 description text not null default '',
 event_date date,
 file_path text,
 file_type text check (file_type is null or file_type in ('image/jpeg','image/png','image/webp','application/pdf')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 created_by uuid default auth.uid(),
 constraint publication_file_kind check (file_type is null or (kind='report' and file_type='application/pdf') or (kind='event' and file_type in ('image/jpeg','image/png','image/webp')) or (kind='news' and file_type in ('image/jpeg','image/png','image/webp')))
);
create index if not exists church_publications_church_idx on public.church_publications(church_id,created_at desc);
alter table public.church_publications enable row level security;
drop policy if exists "Public read church publications" on public.church_publications;
create policy "Public read church publications" on public.church_publications for select to anon, authenticated using (true);
drop policy if exists "Directory admins manage church publications" on public.church_publications;
create policy "Directory admins manage church publications" on public.church_publications for all to authenticated
 using (exists(select 1 from public.directory_admins a where a.user_id=auth.uid()))
 with check (exists(select 1 from public.directory_admins a where a.user_id=auth.uid()));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('church-publications','church-publications',true,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
 on conflict (id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];
drop policy if exists "Public read church publication files" on storage.objects;
create policy "Public read church publication files" on storage.objects for select to anon,authenticated using (bucket_id='church-publications');
drop policy if exists "Directory admins upload church publication files" on storage.objects;
create policy "Directory admins upload church publication files" on storage.objects for insert to authenticated
 with check (bucket_id='church-publications' and exists(select 1 from public.directory_admins a where a.user_id=auth.uid()));
drop policy if exists "Directory admins delete church publication files" on storage.objects;
create policy "Directory admins delete church publication files" on storage.objects for delete to authenticated
 using (bucket_id='church-publications' and exists(select 1 from public.directory_admins a where a.user_id=auth.uid()));
