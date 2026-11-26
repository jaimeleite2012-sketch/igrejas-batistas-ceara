-- Stable church membership; preserves existing RLS and the public contact projection.
alter table public.assibrece_members add column if not exists church_id text references public.churches(id) on delete set null;
alter table public.assibrece_members add column if not exists profession text not null default '';
alter table public.assibrece_members add column if not exists offers_services boolean not null default false;
alter table public.assibrece_members add column if not exists service_description text not null default '';
create index if not exists assibrece_members_church_id_idx on public.assibrece_members(church_id);
create unique index if not exists assibrece_members_unique_normalized_name
on public.assibrece_members (
 regexp_replace(lower(translate(trim(name),'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç','AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc')),'^(pr\.?|pra\.?|pastor(a)?|irmao|irma)\s+','','i')
) where trim(name)<>'';
create or replace view public.assibrece_directory with (security_barrier=true) as
select id,number,name,phone,role_description,church,church_id,profession,offers_services,service_description from public.assibrece_members;
grant delete on public.assibrece_members to authenticated;
drop policy if exists assibrece_member_admin_delete on public.assibrece_members;
create policy assibrece_member_admin_delete on public.assibrece_members for delete to authenticated
using(exists(select 1 from public.directory_admins where user_id=(select auth.uid())));
