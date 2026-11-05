-- Stage 3 follow-up: deliver QR waiter calls to authenticated staff in real time.
begin;

create table public.guest_assistance_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id text not null,
  request_count integer not null default 1 check (request_count > 0),
  created_at timestamptz not null default now(),
  last_requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  foreign key (business_id, location_id)
    references public.locations(business_id, id) on delete cascade
);

create unique index guest_assistance_one_open_per_location
  on public.guest_assistance_requests(business_id, location_id)
  where resolved_at is null;
create index guest_assistance_business_open_idx
  on public.guest_assistance_requests(business_id, created_at desc)
  where resolved_at is null;

alter table public.guest_assistance_requests enable row level security;
revoke all on table public.guest_assistance_requests from anon, authenticated;
grant select on table public.guest_assistance_requests to authenticated;
grant all on table public.guest_assistance_requests to service_role;
create policy guest_assistance_select_member
  on public.guest_assistance_requests for select to authenticated
  using ((select private.is_business_member(business_id)));

create or replace function public.request_guest_assistance(
  p_business_slug text,
  p_location_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
  v_location_id text;
  v_request_id uuid;
begin
  select id into v_business_id
  from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, '')))
    and is_active;
  if v_business_id is null then
    raise exception using errcode = '22023', message = 'No se encontró el balneario.';
  end if;

  select id into v_location_id
  from public.locations
  where business_id = v_business_id
    and code = pg_catalog.upper(pg_catalog.btrim(coalesce(p_location_code, '')));
  if v_location_id is null then
    raise exception using errcode = '22023', message = 'No se encontró la ubicación del QR.';
  end if;

  insert into public.guest_assistance_requests as current_request (business_id, location_id)
  values (v_business_id, v_location_id)
  on conflict (business_id, location_id) where resolved_at is null
  do update set
    request_count = current_request.request_count + 1,
    last_requested_at = pg_catalog.clock_timestamp()
  returning id into v_request_id;

  return pg_catalog.jsonb_build_object('id', v_request_id, 'status', 'received');
end;
$function$;
revoke all on function public.request_guest_assistance(text, text) from public;
grant execute on function public.request_guest_assistance(text, text) to anon, authenticated;

create or replace function public.resolve_guest_assistance_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
begin
  select business_id into v_business_id
  from public.guest_assistance_requests
  where id = p_request_id and resolved_at is null;
  if v_business_id is null then
    raise exception using errcode = 'P0002', message = 'La solicitud ya fue atendida o no existe.';
  end if;
  if not private.is_business_member(v_business_id) then
    raise exception using errcode = '42501', message = 'No tenés acceso a este balneario.';
  end if;

  update public.guest_assistance_requests
  set resolved_at = pg_catalog.clock_timestamp(), resolved_by = auth.uid()
  where id = p_request_id and resolved_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'La solicitud ya fue atendida.';
  end if;
end;
$function$;
revoke all on function public.resolve_guest_assistance_request(uuid) from public;
grant execute on function public.resolve_guest_assistance_request(uuid) to authenticated;

do $realtime$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public' and tablename = 'guest_assistance_requests'
    ) then
    alter publication supabase_realtime add table public.guest_assistance_requests;
  end if;
end;
$realtime$;

commit;
