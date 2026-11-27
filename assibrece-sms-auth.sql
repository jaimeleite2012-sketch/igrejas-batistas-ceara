-- ASSIBRECE: acesso opcional por codigo SMS para o titular da ficha.
-- O numero precisa estar confirmado pelo Supabase Auth e coincidir com uma unica ficha.

create schema if not exists private;

create or replace function private.assibrece_phone_e164(value text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  digits text := regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g');
begin
  if digits ~ '^55[0-9]{10,11}$' then
    return '+' || digits;
  end if;
  if digits ~ '^[0-9]{10,11}$' then
    return '+55' || digits;
  end if;
  return null;
end;
$$;

revoke all on function private.assibrece_phone_e164(text) from public, anon, authenticated;

create table if not exists private.assibrece_admin_phones (
  phone_e164 text primary key check (phone_e164 ~ '^\+[1-9][0-9]{9,14}$'),
  member_id uuid unique references public.assibrece_members(id) on delete restrict,
  created_at timestamptz not null default now()
);

revoke all on table private.assibrece_admin_phones from public, anon, authenticated;

-- Autoriza por SMS os administradores que ja possuem uma ficha com o mesmo e-mail.
insert into private.assibrece_admin_phones (phone_e164, member_id)
select private.assibrece_phone_e164(m.phone), m.id
from public.directory_admins d
join auth.users u on u.id = d.user_id
join public.assibrece_members m on lower(trim(m.email)) = lower(trim(u.email))
where private.assibrece_phone_e164(m.phone) is not null
on conflict (phone_e164) do update set member_id = excluded.member_id;

-- Uma pessoa pode usar e-mail e telefone como identidades distintas para a mesma ficha.
alter table public.assibrece_access
  drop constraint if exists assibrece_access_member_id_key;

create index if not exists assibrece_access_member_id_idx
  on public.assibrece_access(member_id);

create or replace function private.assibrece_claim_verified_phone()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  verified_phone text;
  target_member uuid;
  current_member uuid;
  match_count integer;
  admin_phone boolean := false;
begin
  if current_user_id is null then
    raise exception 'Entre com o codigo recebido por SMS.' using errcode = '28000';
  end if;

  select private.assibrece_phone_e164(u.phone)
    into verified_phone
  from auth.users u
  where u.id = current_user_id
    and u.phone_confirmed_at is not null;

  if verified_phone is null then
    raise exception 'O celular desta conta ainda nao foi confirmado por SMS.' using errcode = '28000';
  end if;

  select a.member_id into current_member
  from public.assibrece_access a
  where a.user_id = current_user_id;

  select count(*), min(m.id::text)::uuid
    into match_count, target_member
  from public.assibrece_members m
  where private.assibrece_phone_e164(m.phone) = verified_phone;

  if match_count = 0 then
    raise exception 'Este celular ainda nao esta associado a uma ficha da ASSIBRECE.' using errcode = 'P0001';
  end if;
  if match_count > 1 then
    raise exception 'Este celular aparece em mais de uma ficha. O administrador precisa corrigir a duplicidade antes do acesso.' using errcode = 'P0001';
  end if;
  if current_member is not null and current_member <> target_member then
    raise exception 'Esta conta ja esta vinculada a outra ficha. Procure o administrador.' using errcode = 'P0001';
  end if;

  insert into public.assibrece_access(user_id, member_id)
  values (current_user_id, target_member)
  on conflict (user_id) do nothing;

  select exists(
    select 1 from private.assibrece_admin_phones p
    where p.phone_e164 = verified_phone and p.member_id = target_member
  ) into admin_phone;

  if admin_phone then
    insert into public.directory_admins(user_id)
    values (current_user_id)
    on conflict (user_id) do nothing;
  end if;

  return jsonb_build_object(
    'member_id', target_member,
    'is_admin', admin_phone
  );
end;
$$;

revoke all on function private.assibrece_claim_verified_phone() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.assibrece_claim_verified_phone() to authenticated;

create or replace function public.assibrece_claim_verified_phone()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.assibrece_claim_verified_phone();
$$;

revoke all on function public.assibrece_claim_verified_phone() from public, anon;
grant execute on function public.assibrece_claim_verified_phone() to authenticated;
