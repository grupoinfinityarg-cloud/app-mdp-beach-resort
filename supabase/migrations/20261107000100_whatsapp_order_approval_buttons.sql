-- Store one-time WhatsApp quick-reply payloads and apply customer responses.
-- The webhook service role is the only writer; customers never access this table.

begin;

alter table public.orders
  drop constraint if exists orders_customer_approval_status_check;

alter table public.orders
  add constraint orders_customer_approval_status_check
  check (customer_approval_status in (
    'not_required', 'pending', 'approved', 'rejected', 'edit_requested'
  ));

create table if not exists public.whatsapp_order_approval_buttons (
  token text primary key,
  business_id uuid not null,
  order_id text not null,
  version integer not null check (version > 0),
  action text not null check (action in ('confirm', 'edit', 'cancel')),
  recipient_phone text not null,
  whatsapp_message_id text,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  response_message_id text unique,
  foreign key (business_id, order_id, version)
    references public.order_versions(business_id, order_id, version) on delete cascade
);

create index if not exists whatsapp_order_approval_buttons_order_idx
  on public.whatsapp_order_approval_buttons(business_id, order_id, version);

alter table public.whatsapp_order_approval_buttons enable row level security;
revoke all on table public.whatsapp_order_approval_buttons from public, anon, authenticated;
grant all on table public.whatsapp_order_approval_buttons to service_role;

create or replace function public.record_qr_whatsapp_approval_sent(
  p_business_slug text,
  p_order_id text,
  p_version integer,
  p_whatsapp_message_id text,
  p_tokens text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
  v_order public.orders%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'Solo el servicio de WhatsApp puede registrar este envío.';
  end if;
  if coalesce(array_length(p_tokens, 1), 0) <> 3 or nullif(p_whatsapp_message_id, '') is null then
    raise exception using errcode = '22023', message = 'Faltan los datos del envío de WhatsApp.';
  end if;

  select id into v_business_id
  from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, '')))
    and is_active;
  if v_business_id is null then
    raise exception using errcode = '22023', message = 'No se encontró el balneario indicado.';
  end if;

  select * into v_order
  from public.orders
  where business_id = v_business_id and id = p_order_id and order_source = 'qr'
  for update;
  if not found or v_order.status <> 'pendiente_confirmacion'
    or v_order.current_version <> p_version then
    raise exception using errcode = '22023', message = 'El pedido cambió o ya no está pendiente de confirmación.';
  end if;

  update public.whatsapp_order_approval_buttons
  set whatsapp_message_id = p_whatsapp_message_id
  where business_id = v_business_id and order_id = p_order_id and version = p_version
    and token = any(p_tokens);
  if not found or (
    select count(*) from public.whatsapp_order_approval_buttons
    where business_id = v_business_id and order_id = p_order_id and version = p_version
      and token = any(p_tokens)
  ) <> 3 then
    raise exception using errcode = '22023', message = 'No se encontraron los tres botones del pedido.';
  end if;

  update public.orders set
    whatsapp_contacted_at = v_now,
    edit_audit_log = coalesce(edit_audit_log, '[]'::jsonb) || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'timestamp', v_now,
        'employee', 'WhatsApp Cloud API',
        'description', pg_catalog.format('Se enviaron al cliente los botones de respuesta para la versión %s.', p_version)
      )
    )
  where business_id = v_business_id and id = p_order_id;
end;
$function$;

revoke all on function public.record_qr_whatsapp_approval_sent(text, text, integer, text, text[]) from public, anon, authenticated;
grant execute on function public.record_qr_whatsapp_approval_sent(text, text, integer, text, text[]) to service_role;

create or replace function public.apply_qr_whatsapp_customer_response(
  p_token text,
  p_sender_phone text,
  p_response_message_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_button public.whatsapp_order_approval_buttons%rowtype;
  v_order public.orders%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_sender_digits text := pg_catalog.regexp_replace(coalesce(p_sender_phone, ''), '[^0-9]', '', 'g');
  v_order_digits text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'Solo el servicio de WhatsApp puede registrar respuestas.';
  end if;
  if nullif(p_response_message_id, '') is null then
    raise exception using errcode = '22023', message = 'Falta el identificador de la respuesta.';
  end if;

  if exists (
    select 1 from public.whatsapp_order_approval_buttons
    where response_message_id = p_response_message_id
  ) then
    return pg_catalog.jsonb_build_object('status', 'duplicate');
  end if;

  select * into v_button
  from public.whatsapp_order_approval_buttons
  where token = p_token
  for update;
  if not found then
    return pg_catalog.jsonb_build_object('status', 'unknown_button');
  end if;

  select * into v_order from public.orders
  where business_id = v_button.business_id and id = v_button.order_id and order_source = 'qr'
  for update;
  if not found then
    return pg_catalog.jsonb_build_object('status', 'order_not_found');
  end if;

  v_order_digits := pg_catalog.regexp_replace(coalesce(v_order.customer_phone, ''), '[^0-9]', '', 'g');
  if v_sender_digits = '' or v_sender_digits <> v_order_digits
    or v_sender_digits <> pg_catalog.regexp_replace(v_button.recipient_phone, '[^0-9]', '', 'g') then
    return pg_catalog.jsonb_build_object('status', 'sender_mismatch');
  end if;

  if v_button.consumed_at is not null then
    return pg_catalog.jsonb_build_object('status', 'already_answered');
  end if;

  update public.whatsapp_order_approval_buttons set
    consumed_at = v_now,
    response_message_id = p_response_message_id
  where token = p_token;

  if v_order.status <> 'pendiente_confirmacion'
    or v_order.current_version <> v_button.version then
    return pg_catalog.jsonb_build_object('status', 'stale_order');
  end if;

  if v_button.action = 'confirm' then
    update public.orders set
      customer_approved_version = v_order.current_version,
      customer_approval_status = 'approved',
      edit_audit_log = coalesce(edit_audit_log, '[]'::jsonb) || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'timestamp', v_now,
          'employee', 'Cliente por WhatsApp',
          'description', pg_catalog.format('El cliente aprobó con el botón de WhatsApp la versión %s.', v_button.version)
        )
      )
    where business_id = v_order.business_id and id = v_order.id;
    update public.order_versions set
      approval_status = 'approved', approved_by = null, approved_at = v_now
    where business_id = v_order.business_id and order_id = v_order.id
      and version = v_button.version and approval_status = 'pending';
  elsif v_button.action = 'edit' then
    update public.orders set
      customer_approval_status = 'edit_requested',
      edit_audit_log = coalesce(edit_audit_log, '[]'::jsonb) || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'timestamp', v_now,
          'employee', 'Cliente por WhatsApp',
          'description', 'El cliente pidió editar el pedido desde el botón de WhatsApp. Contactar para conocer los cambios solicitados.'
        )
      )
    where business_id = v_order.business_id and id = v_order.id;
  else
    update public.orders set
      status = 'cancelado',
      customer_approval_status = 'rejected',
      cancellation_reason = 'Cancelado por el cliente mediante WhatsApp',
      edit_audit_log = coalesce(edit_audit_log, '[]'::jsonb) || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'timestamp', v_now,
          'employee', 'Cliente por WhatsApp',
          'description', 'El cliente canceló el pedido mediante el botón de WhatsApp.'
        )
      )
    where business_id = v_order.business_id and id = v_order.id;
    update public.order_versions set approval_status = 'superseded'
    where business_id = v_order.business_id and order_id = v_order.id
      and version = v_button.version and approval_status = 'pending';
    update public.locations set
      status = 'disponible', current_guest_name = null, current_order_id = null
    where business_id = v_order.business_id and id = v_order.location_id
      and current_order_id = v_order.id;
  end if;

  return pg_catalog.jsonb_build_object(
    'status', 'applied', 'action', v_button.action,
    'order_id', v_order.id, 'version', v_button.version
  );
end;
$function$;

revoke all on function public.apply_qr_whatsapp_customer_response(text, text, text) from public, anon, authenticated;
grant execute on function public.apply_qr_whatsapp_customer_response(text, text, text) to service_role;

commit;
