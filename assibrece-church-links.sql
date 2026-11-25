-- Stable church membership; preserves existing RLS and the public contact projection.
alter table public.assibrece_members add column if not exists church_id text references public.churches(id) on delete set null;
create index if not exists assibrece_members_church_id_idx on public.assibrece_members(church_id);
create or replace view public.assibrece_directory with (security_barrier=true) as
select id,number,name,phone,role_description,church,church_id from public.assibrece_members;
