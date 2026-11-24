create table public.assibrece_links (
 member_id uuid primary key references public.assibrece_members(id) on delete cascade,
 token_hash text not null unique,
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
alter table public.assibrece_links enable row level security;
revoke all on public.assibrece_links from anon,authenticated;
-- Only the authenticated server function handles personal bearer links.
grant all on public.assibrece_links to service_role;
