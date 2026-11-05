create or replace function public.pay_qr_order(
  p_business_slug text,
  p_order_id text,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
  v_order public.orders%rowtype;
  v_ticket_number text;
  v_paid_at timestamptz := pg_catalog.clock_timestamp();
begin
  select id into v_business_id from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, ''))) and is_active;
  if v_business_id is null or not private.is_business_member(v_business_id) then
    raise exception using errcode = '42501', message = 'No tenés acceso a este balneario.';
  end if;
  if coalesce(p_payment_method, '') not in (
    'efectivo', 'transferencia', 'qr', 'debito/credito', 'mercadopago_qr',
    'tarjeta_debito', 'tarjeta_credito', 'cargo_a_carpa'
  ) then
    raise exception using errcode = '22023', message = 'El medio de pago no es válido.';
  end if;

  select * into v_order from public.orders
  where business_id = v_business_id and id = p_order_id and order_source = 'qr'
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'No se encontró el pedido.';
  end if;
  if v_order.payment_status <> 'pendiente' or v_order.status = 'cancelado' then
    raise exception using errcode = '22023', message = 'El pedido ya no está pendiente de pago.';
  end if;

  v_ticket_number := coalesce(v_order.ticket_number, 'T-' || pg_catalog.upper(pg_catalog.right(p_order_id, 6)));
  update public.orders set
    payment_status = 'cobrado',
    payment_method = p_payment_method,
    paid_at = v_paid_at,
    ticket_number = v_ticket_number
  where business_id = v_business_id and id = p_order_id;

  return pg_catalog.jsonb_build_object(
    'ticketNumber', v_ticket_number,
    'paidAt', v_paid_at
  );
end;
$function$;
revoke all on function public.pay_qr_order(text, text, text) from public;
grant execute on function public.pay_qr_order(text, text, text) to authenticated;
