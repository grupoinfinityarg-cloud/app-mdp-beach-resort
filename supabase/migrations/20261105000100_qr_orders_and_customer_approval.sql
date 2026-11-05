-- Stage 3: connected QR orders, immutable order versions, and explicit customer approval.
-- Public clients can read only the public menu and submit validated orders through RPCs.

begin;

alter table public.orders
  add column if not exists order_source text not null default 'staff'
    check (order_source in ('staff', 'qr')),
  add column if not exists current_version integer not null default 1
    check (current_version > 0),
  add column if not exists customer_approved_version integer,
  add column if not exists customer_approval_status text not null default 'not_required'
    check (customer_approval_status in ('not_required', 'pending', 'approved', 'rejected'));

create table if not exists public.order_versions (
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id text not null,
  version integer not null check (version > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'superseded')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  primary key (business_id, order_id, version),
  foreign key (business_id, order_id)
    references public.orders(business_id, id) on delete cascade
);

alter table public.order_versions enable row level security;
revoke all on table public.order_versions from anon, authenticated;
grant select on table public.order_versions to authenticated;
grant all on table public.order_versions to service_role;
create policy order_versions_select_member
  on public.order_versions for select to authenticated
  using ((select private.is_business_member(business_id)));

-- All public and staff writes go through functions which validate prices,
-- membership, version numbers, and the approval-before-kitchen rule.
revoke insert, update, delete on table public.orders, public.order_items from authenticated;
grant select on table public.orders, public.order_items to authenticated;

create sequence if not exists public.qr_order_number_seq start with 1001;
revoke all on sequence public.qr_order_number_seq from public, anon, authenticated;

create or replace function private.resolve_order_items(p_business_id uuid, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_input jsonb;
  v_product public.products%rowtype;
  v_variant jsonb;
  v_selected_addons jsonb;
  v_addon_ids text[];
  v_removed text[];
  v_quantity integer;
  v_base_price numeric(12,2);
  v_unit_price numeric(12,2);
  v_addon_total numeric(12,2);
  v_item_subtotal numeric(12,2);
  v_variant_id text;
  v_notes text;
  v_result jsonb := '[]'::jsonb;
  v_total numeric(12,2) := 0;
  v_count integer := 0;
begin
  if p_items is null or coalesce(jsonb_typeof(p_items), '') <> 'array' then
    raise exception using errcode = '22023', message = 'El pedido debe tener entre 1 y 30 productos.';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception using errcode = '22023', message = 'El pedido debe tener entre 1 y 30 productos.';
  end if;

  for v_input in select value from jsonb_array_elements(p_items) loop
    v_count := v_count + 1;
    if jsonb_typeof(v_input) <> 'object'
      or coalesce(v_input->>'quantity', '') !~ '^[1-9][0-9]*$' then
      raise exception using errcode = '22023', message = 'La cantidad de un producto no es válida.';
    end if;
    v_quantity := (v_input->>'quantity')::integer;
    if v_quantity > 50 then
      raise exception using errcode = '22023', message = 'La cantidad máxima por producto es 50.';
    end if;

    select * into v_product
    from public.products
    where business_id = p_business_id
      and id = nullif(v_input->>'product_id', '')
      and is_active and is_available;
    if not found then
      raise exception using errcode = '22023', message = 'Un producto ya no está disponible.';
    end if;

    v_variant_id := nullif(v_input->>'variant_id', '');
    v_variant := null;
    v_base_price := v_product.price;
    if v_variant_id is not null then
      select option into v_variant
      from jsonb_array_elements(coalesce(v_product.variants, '[]'::jsonb)) as variants(option)
      where option->>'id' = v_variant_id;
      if v_variant is null then
        raise exception using errcode = '22023', message = 'Una variante del pedido ya no está disponible.';
      end if;
      v_base_price := (v_variant->>'price')::numeric(12,2);
    end if;

    if v_input ? 'addon_ids' and coalesce(jsonb_typeof(v_input->'addon_ids'), '') <> 'array' then
      raise exception using errcode = '22023', message = 'Los agregados del producto no son válidos.';
    end if;
    select coalesce(array_agg(value), array[]::text[])
      into v_addon_ids
    from jsonb_array_elements_text(coalesce(nullif(v_input->'addon_ids', 'null'::jsonb), '[]'::jsonb));
    if cardinality(v_addon_ids) > 8
      or cardinality(v_addon_ids) <> (select count(distinct id) from unnest(v_addon_ids) as ids(id)) then
      raise exception using errcode = '22023', message = 'Los agregados del producto no son válidos.';
    end if;
    select coalesce(jsonb_agg(addon), '[]'::jsonb), coalesce(sum((addon->>'price')::numeric), 0)
      into v_selected_addons, v_addon_total
    from jsonb_array_elements(coalesce(v_product.available_addons, '[]'::jsonb)) as addons(addon)
    where addon->>'id' = any(v_addon_ids);
    if jsonb_array_length(v_selected_addons) <> cardinality(v_addon_ids) then
      raise exception using errcode = '22023', message = 'Un agregado del producto ya no está disponible.';
    end if;

    if v_input ? 'removed_ingredients' and coalesce(jsonb_typeof(v_input->'removed_ingredients'), '') <> 'array' then
      raise exception using errcode = '22023', message = 'Las modificaciones del producto no son válidas.';
    end if;
    select coalesce(array_agg(value), array[]::text[])
      into v_removed
    from jsonb_array_elements_text(coalesce(nullif(v_input->'removed_ingredients', 'null'::jsonb), '[]'::jsonb));
    if cardinality(v_removed) > 20 or exists (
      select 1 from unnest(v_removed) as removed(ingredient)
      where not (removed.ingredient = any(v_product.removable_ingredients))
    ) then
      raise exception using errcode = '22023', message = 'Una modificación del producto no es válida.';
    end if;

    v_notes := nullif(left(btrim(coalesce(v_input->>'notes', '')), 240), '');
    v_unit_price := v_base_price + v_addon_total;
    v_item_subtotal := v_unit_price * v_quantity;
    v_total := v_total + v_item_subtotal;
    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'product_image', v_product.image,
      'base_price', v_product.price,
      'unit_price', v_unit_price,
      'quantity', v_quantity,
      'variant', v_variant,
      'removed_ingredients', to_jsonb(v_removed),
      'selected_addons', v_selected_addons,
      'notes', v_notes,
      'subtotal', v_item_subtotal
    ));
  end loop;

  return jsonb_build_object('items', v_result, 'subtotal', v_total);
end;
$function$;
revoke all on function private.resolve_order_items(uuid, jsonb) from public, anon, authenticated;

create or replace function public.get_qr_menu(p_business_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'business', jsonb_build_object(
      'name', business.name,
      'branchName', business.branch_name,
      'address', business.address,
      'city', business.city,
      'phone', business.phone,
      'schedule', business.schedule,
      'currencySymbol', business.currency_symbol,
      'taxPercentage', business.tax_percentage,
      'serviceFeeCover', business.service_fee_cover
    ),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', category.id, 'name', category.name, 'emoji', category.emoji,
        'iconName', category.icon_name, 'order', category.sort_order
      ) order by category.sort_order, category.name)
      from public.categories as category
      where category.business_id = business.id
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', product.id, 'name', product.name, 'description', product.description,
        'categoryId', product.category_id, 'price', product.price, 'image', product.image,
        'sku', product.sku, 'isAvailable', product.is_available, 'isActive', product.is_active,
        'rating', product.rating, 'reviewsCount', product.reviews_count,
        'salesCount', product.sales_count, 'prepTimeMinutes', product.prep_time_minutes,
        'tag', product.tag, 'isVeggie', product.is_veggie, 'isGlutenFree', product.is_gluten_free,
        'includedIngredients', product.included_ingredients,
        'removableIngredients', product.removable_ingredients,
        'availableAddons', product.available_addons, 'variants', product.variants
      ) order by category.sort_order, product.name)
      from public.products as product
      join public.categories as category
        on category.business_id = product.business_id and category.id = product.category_id
      where product.business_id = business.id and product.is_active and product.is_available
    ), '[]'::jsonb),
    'promotions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', promotion.id, 'name', promotion.name, 'description', promotion.description,
        'promoPrice', promotion.promo_price, 'regularPrice', promotion.regular_price,
        'image', promotion.image, 'badge', promotion.badge,
        'validUntil', promotion.valid_until, 'includedProductNames', promotion.included_product_names,
        'conditions', promotion.conditions, 'isActive', true
      ) order by promotion.name)
      from public.promotions as promotion
      where promotion.business_id = business.id
        and promotion.is_active
        and (promotion.valid_until is null or promotion.valid_until >= current_date)
    ), '[]'::jsonb)
  )
  from public.businesses as business
  where business.slug = lower(trim(coalesce(p_business_slug, '')))
    and business.is_active;
$function$;
revoke all on function public.get_qr_menu(text) from public;
grant execute on function public.get_qr_menu(text) to anon, authenticated;

create or replace function public.create_qr_order(
  p_business_slug text,
  p_location_code text,
  p_customer_name text,
  p_customer_phone text,
  p_payment_method text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business public.businesses%rowtype;
  v_location public.locations%rowtype;
  v_resolved jsonb;
  v_order_id text := pg_catalog.gen_random_uuid()::text;
  v_order_number text := '#' || pg_catalog.lpad(pg_catalog.nextval('public.qr_order_number_seq')::text, 6, '0');
  v_customer_name text := pg_catalog.left(pg_catalog.btrim(coalesce(p_customer_name, '')), 80);
  v_customer_phone text := pg_catalog.btrim(coalesce(p_customer_phone, ''));
  v_notes text := nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_notes, '')), 500), '');
  v_subtotal numeric(12,2);
  v_created_at timestamptz := pg_catalog.clock_timestamp();
begin
  if pg_catalog.length(v_customer_name) < 3 then
    raise exception using errcode = '22023', message = 'Ingresá un nombre de al menos 3 caracteres.';
  end if;
  if pg_catalog.length(pg_catalog.regexp_replace(v_customer_phone, '[^0-9]', '', 'g')) not between 10 and 15 then
    raise exception using errcode = '22023', message = 'El teléfono ingresado no es válido.';
  end if;
  if coalesce(p_payment_method, '') not in (
    'efectivo', 'transferencia', 'qr', 'debito/credito', 'mercadopago_qr',
    'tarjeta_debito', 'tarjeta_credito', 'cargo_a_carpa'
  ) then
    raise exception using errcode = '22023', message = 'El medio de pago seleccionado no es válido.';
  end if;

  select * into v_business
  from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, '')))
    and is_active;
  if not found then
    raise exception using errcode = '22023', message = 'No se encontró el balneario indicado.';
  end if;

  select * into v_location
  from public.locations
  where business_id = v_business.id
    and code = pg_catalog.upper(pg_catalog.btrim(coalesce(p_location_code, '')))
    and status not in ('limpieza', 'mantenimiento');
  if not found then
    raise exception using errcode = '22023', message = 'La ubicación del QR no está disponible.';
  end if;

  v_resolved := private.resolve_order_items(v_business.id, p_items);
  v_subtotal := (v_resolved->>'subtotal')::numeric(12,2);

  insert into public.orders (
    business_id, id, order_number, location_id, customer_name, customer_phone,
    subtotal, discount, service_fee, total, status, payment_status, payment_method,
    notes, created_at, edit_audit_log, order_source, current_version, customer_approval_status
  ) values (
    v_business.id, v_order_id, v_order_number, v_location.id, v_customer_name, v_customer_phone,
    v_subtotal, 0, 0, v_subtotal, 'pendiente_confirmacion', 'pendiente', p_payment_method,
    v_notes, v_created_at,
    pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'timestamp', v_created_at, 'employee', 'Cliente (Carta QR)',
      'description', 'Pedido enviado desde la carta digital.'
    )),
    'qr', 1, 'pending'
  );

  insert into public.order_items (
    business_id, id, order_id, product_id, product_name, product_image,
    base_price, unit_price, quantity, variant, removed_ingredients,
    selected_addons, notes, subtotal
  )
  select v_business.id, pg_catalog.gen_random_uuid()::text, v_order_id,
         item->>'product_id', item->>'product_name', coalesce(item->>'product_image', ''),
         (item->>'base_price')::numeric(12,2), (item->>'unit_price')::numeric(12,2),
         (item->>'quantity')::integer, item->'variant',
         array(select pg_catalog.jsonb_array_elements_text(item->'removed_ingredients')),
         item->'selected_addons', nullif(item->>'notes', ''), (item->>'subtotal')::numeric(12,2)
  from pg_catalog.jsonb_array_elements(v_resolved->'items') as items(item);

  insert into public.order_versions (
    business_id, order_id, version, snapshot, approval_status
  ) values (
    v_business.id, v_order_id, 1,
    pg_catalog.jsonb_build_object(
      'items', v_resolved->'items', 'subtotal', v_subtotal, 'total', v_subtotal,
      'notes', v_notes, 'customerName', v_customer_name, 'customerPhone', v_customer_phone,
      'paymentMethod', p_payment_method
    ),
    'pending'
  );

  return pg_catalog.jsonb_build_object(
    'id', v_order_id, 'orderNumber', v_order_number, 'version', 1,
    'status', 'pendiente_confirmacion', 'total', v_subtotal
  );
end;
$function$;
revoke all on function public.create_qr_order(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.create_qr_order(text, text, text, text, text, text, jsonb) to anon, authenticated;

create or replace function public.edit_qr_order_version(
  p_business_slug text,
  p_order_id text,
  p_items jsonb,
  p_notes text,
  p_employee_name text,
  p_change_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
  v_order public.orders%rowtype;
  v_resolved jsonb;
  v_new_version integer;
  v_subtotal numeric(12,2);
  v_notes text := nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_notes, '')), 500), '');
  v_audit jsonb;
begin
  select id into v_business_id
  from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, '')))
    and is_active;
  if v_business_id is null or not private.is_business_member(v_business_id) then
    raise exception using errcode = '42501', message = 'No tenés acceso a este balneario.';
  end if;

  select * into v_order from public.orders
  where business_id = v_business_id and id = p_order_id and order_source = 'qr'
  for update;
  if not found or v_order.status <> 'pendiente_confirmacion' then
    raise exception using errcode = '22023', message = 'Solo se pueden editar pedidos QR pendientes.';
  end if;

  v_resolved := private.resolve_order_items(v_business_id, p_items);
  v_subtotal := (v_resolved->>'subtotal')::numeric(12,2);
  v_new_version := v_order.current_version + 1;
  v_audit := coalesce(v_order.edit_audit_log, '[]'::jsonb) || pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object(
      'timestamp', pg_catalog.clock_timestamp(),
      'employee', coalesce(nullif(pg_catalog.btrim(p_employee_name), ''), 'Personal Balneario'),
      'description', coalesce(nullif(pg_catalog.btrim(p_change_reason), ''), 'Se modificó el pedido; requiere nueva aprobación del cliente.')
    )
  );

  update public.order_versions
  set approval_status = 'superseded'
  where business_id = v_business_id and order_id = p_order_id and version = v_order.current_version;

  delete from public.order_items where business_id = v_business_id and order_id = p_order_id;
  insert into public.order_items (
    business_id, id, order_id, product_id, product_name, product_image,
    base_price, unit_price, quantity, variant, removed_ingredients,
    selected_addons, notes, subtotal
  )
  select v_business_id, pg_catalog.gen_random_uuid()::text, p_order_id,
         item->>'product_id', item->>'product_name', coalesce(item->>'product_image', ''),
         (item->>'base_price')::numeric(12,2), (item->>'unit_price')::numeric(12,2),
         (item->>'quantity')::integer, item->'variant',
         array(select pg_catalog.jsonb_array_elements_text(item->'removed_ingredients')),
         item->'selected_addons', nullif(item->>'notes', ''), (item->>'subtotal')::numeric(12,2)
  from pg_catalog.jsonb_array_elements(v_resolved->'items') as items(item);

  update public.orders set
    subtotal = v_subtotal, total = v_subtotal - discount + service_fee,
    notes = v_notes, current_version = v_new_version,
    customer_approved_version = null, customer_approval_status = 'pending',
    whatsapp_contacted_at = null, edit_audit_log = v_audit
  where business_id = v_business_id and id = p_order_id;

  insert into public.order_versions (business_id, order_id, version, snapshot, approval_status, created_by)
  values (
    v_business_id, p_order_id, v_new_version,
    pg_catalog.jsonb_build_object(
      'items', v_resolved->'items', 'subtotal', v_subtotal,
      'total', v_subtotal - v_order.discount + v_order.service_fee,
      'notes', v_notes, 'customerName', v_order.customer_name,
      'customerPhone', v_order.customer_phone, 'paymentMethod', v_order.payment_method
    ),
    'pending', auth.uid()
  );

  return pg_catalog.jsonb_build_object('version', v_new_version, 'total', v_subtotal - v_order.discount + v_order.service_fee);
end;
$function$;
revoke all on function public.edit_qr_order_version(text, text, jsonb, text, text, text) from public;
grant execute on function public.edit_qr_order_version(text, text, jsonb, text, text, text) to authenticated;

create or replace function public.record_qr_order_whatsapp_contact(
  p_business_slug text,
  p_order_id text,
  p_version integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
begin
  select id into v_business_id from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, ''))) and is_active;
  if v_business_id is null or not private.is_business_member(v_business_id) then
    raise exception using errcode = '42501', message = 'No tenés acceso a este balneario.';
  end if;
  update public.orders set
    whatsapp_contacted_at = pg_catalog.clock_timestamp(),
    edit_audit_log = coalesce(edit_audit_log, '[]'::jsonb) || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('timestamp', pg_catalog.clock_timestamp(),
        'employee', auth.uid()::text, 'description', 'Se contactó al cliente por WhatsApp para confirmar la versión del pedido.')
    )
  where business_id = v_business_id and id = p_order_id
    and order_source = 'qr' and status = 'pendiente_confirmacion'
    and current_version = p_version;
  if not found then
    raise exception using errcode = '22023', message = 'El pedido cambió o ya no está pendiente.';
  end if;
end;
$function$;
revoke all on function public.record_qr_order_whatsapp_contact(text, text, integer) from public;
grant execute on function public.record_qr_order_whatsapp_contact(text, text, integer) to authenticated;

create or replace function public.record_qr_customer_approval(
  p_business_slug text,
  p_order_id text,
  p_version integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
begin
  select id into v_business_id from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, ''))) and is_active;
  if v_business_id is null or not private.is_business_member(v_business_id) then
    raise exception using errcode = '42501', message = 'No tenés acceso a este balneario.';
  end if;

  update public.orders set
    customer_approved_version = current_version,
    customer_approval_status = 'approved',
    edit_audit_log = coalesce(edit_audit_log, '[]'::jsonb) || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('timestamp', pg_catalog.clock_timestamp(),
        'employee', auth.uid()::text, 'description', pg_catalog.format('Caja registró la aprobación del cliente para la versión %s.', current_version))
    )
  where business_id = v_business_id and id = p_order_id and order_source = 'qr'
    and status = 'pendiente_confirmacion' and current_version = p_version
    and whatsapp_contacted_at is not null;
  if not found then
    raise exception using errcode = '22023', message = 'Registrá primero el contacto por WhatsApp y confirmá que el cliente aprobó la versión actual.';
  end if;

  update public.order_versions set
    approval_status = 'approved', approved_by = auth.uid(), approved_at = pg_catalog.clock_timestamp()
  where business_id = v_business_id and order_id = p_order_id and version = p_version
    and approval_status = 'pending';
end;
$function$;
revoke all on function public.record_qr_customer_approval(text, text, integer) from public;
grant execute on function public.record_qr_customer_approval(text, text, integer) to authenticated;

create or replace function public.send_qr_order_to_kitchen(
  p_business_slug text,
  p_order_id text,
  p_version integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
begin
  select id into v_business_id from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, ''))) and is_active;
  if v_business_id is null or not private.is_business_member(v_business_id) then
    raise exception using errcode = '42501', message = 'No tenés acceso a este balneario.';
  end if;
  update public.orders set status = 'confirmado_en_cocina', confirmed_at = pg_catalog.clock_timestamp()
  where business_id = v_business_id and id = p_order_id and order_source = 'qr'
    and status = 'pendiente_confirmacion' and current_version = p_version
    and customer_approved_version = p_version and customer_approval_status = 'approved';
  if not found then
    raise exception using errcode = '22023', message = 'La versión actual debe estar aprobada por el cliente antes de enviarse a Cocina.';
  end if;
end;
$function$;
revoke all on function public.send_qr_order_to_kitchen(text, text, integer) from public;
grant execute on function public.send_qr_order_to_kitchen(text, text, integer) to authenticated;

create or replace function public.update_qr_order_status(
  p_business_slug text,
  p_order_id text,
  p_next_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_id uuid;
  v_order public.orders%rowtype;
  v_timestamp timestamptz := pg_catalog.clock_timestamp();
begin
  select id into v_business_id from public.businesses
  where slug = pg_catalog.lower(pg_catalog.btrim(coalesce(p_business_slug, ''))) and is_active;
  if v_business_id is null or not private.is_business_member(v_business_id) then
    raise exception using errcode = '42501', message = 'No tenés acceso a este balneario.';
  end if;
  select * into v_order from public.orders
  where business_id = v_business_id and id = p_order_id and order_source = 'qr'
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'No se encontró el pedido.';
  end if;
  if not (
    (v_order.status = 'confirmado_en_cocina' and p_next_status in ('en_preparacion', 'cancelado')) or
    (v_order.status = 'en_preparacion' and p_next_status in ('listo_para_entrega', 'cancelado')) or
    (v_order.status = 'listo_para_entrega' and p_next_status in ('entregado', 'cancelado'))
  ) then
    raise exception using errcode = '22023', message = 'El cambio de estado solicitado no está permitido.';
  end if;
  update public.orders set
    status = p_next_status,
    preparing_at = case when p_next_status = 'en_preparacion' then v_timestamp else preparing_at end,
    ready_at = case when p_next_status = 'listo_para_entrega' then v_timestamp else ready_at end,
    delivered_at = case when p_next_status = 'entregado' then v_timestamp else delivered_at end,
    cancellation_reason = case when p_next_status = 'cancelado' then 'Cancelado por personal' else cancellation_reason end
  where business_id = v_business_id and id = p_order_id;
end;
$function$;
revoke all on function public.update_qr_order_status(text, text, text) from public;
grant execute on function public.update_qr_order_status(text, text, text) to authenticated;

-- A member may not bypass the approval functions by directly updating the status.
create or replace function private.enforce_qr_order_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.order_source = 'qr'
    and new.status = 'confirmado_en_cocina'
    and (new.customer_approval_status <> 'approved'
      or new.customer_approved_version is distinct from new.current_version) then
    raise exception using errcode = '42501', message = 'El cliente debe aprobar la versión actual antes de enviar el pedido a Cocina.';
  end if;
  return new;
end;
$function$;
revoke all on function private.enforce_qr_order_approval() from public, anon, authenticated;
drop trigger if exists enforce_qr_order_approval on public.orders;
create trigger enforce_qr_order_approval
  before insert or update of status, current_version, customer_approved_version, customer_approval_status
  on public.orders for each row execute function private.enforce_qr_order_approval();

do $realtime$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
    ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$realtime$;

commit;
