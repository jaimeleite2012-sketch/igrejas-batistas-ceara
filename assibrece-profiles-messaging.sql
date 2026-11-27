
alter table public.assibrece_members
 add column if not exists profile_photo_url text not null default ''
 check (length(profile_photo_url) <= 1000);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('assibrece-profiles','assibrece-profiles',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
 public=excluded.public,
 file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "assibrece profile owners select" on storage.objects;
create policy "assibrece profile owners select"
on storage.objects for select to authenticated
using (
 bucket_id='assibrece-profiles' and (
  exists(
   select 1 from public.assibrece_access a
   where a.user_id=(select auth.uid())
   and a.member_id::text=(storage.foldername(name))[1]
  )
  or exists(select 1 from public.directory_admins d where d.user_id=(select auth.uid()))
 )
);

drop policy if exists "assibrece profile owners insert" on storage.objects;
create policy "assibrece profile owners insert"
on storage.objects for insert to authenticated
with check (
 bucket_id='assibrece-profiles' and (
  exists(
   select 1 from public.assibrece_access a
   where a.user_id=(select auth.uid())
   and a.member_id::text=(storage.foldername(name))[1]
  )
  or exists(select 1 from public.directory_admins d where d.user_id=(select auth.uid()))
 )
);

drop policy if exists "assibrece profile owners update" on storage.objects;
create policy "assibrece profile owners update"
on storage.objects for update to authenticated
using (
 bucket_id='assibrece-profiles' and (
  exists(
   select 1 from public.assibrece_access a
   where a.user_id=(select auth.uid())
   and a.member_id::text=(storage.foldername(name))[1]
  )
  or exists(select 1 from public.directory_admins d where d.user_id=(select auth.uid()))
 )
)
with check (
 bucket_id='assibrece-profiles' and (
  exists(
   select 1 from public.assibrece_access a
   where a.user_id=(select auth.uid())
   and a.member_id::text=(storage.foldername(name))[1]
  )
  or exists(select 1 from public.directory_admins d where d.user_id=(select auth.uid()))
 )
);

drop policy if exists "assibrece profile owners delete" on storage.objects;
create policy "assibrece profile owners delete"
on storage.objects for delete to authenticated
using (
 bucket_id='assibrece-profiles' and (
  exists(
   select 1 from public.assibrece_access a
   where a.user_id=(select auth.uid())
   and a.member_id::text=(storage.foldername(name))[1]
  )
  or exists(select 1 from public.directory_admins d where d.user_id=(select auth.uid()))
 )
);

drop view if exists public.assibrece_directory;
create view public.assibrece_directory
with (security_invoker=true,security_barrier=true) as
select id,number,name,phone,role_description,church,church_id,profession,
 offers_services,service_description,profile_photo_url
from public.assibrece_members;

grant select on public.assibrece_directory to anon,authenticated;
grant select (
 id,number,name,phone,role_description,church,church_id,profession,
 offers_services,service_description,profile_photo_url
) on public.assibrece_members to anon;

drop policy if exists assibrece_member_public_directory_read on public.assibrece_members;
create policy assibrece_member_public_directory_read
on public.assibrece_members for select to anon
using (true);
