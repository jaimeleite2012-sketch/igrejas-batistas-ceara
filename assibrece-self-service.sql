-- Self-service ownership request for an existing ASSIBRECE member record.
alter table public.assibrece_requests
add column if not exists requested_member_id uuid references public.assibrece_members(id) on delete set null;
create index if not exists assibrece_requests_requested_member_idx
on public.assibrece_requests(requested_member_id);
