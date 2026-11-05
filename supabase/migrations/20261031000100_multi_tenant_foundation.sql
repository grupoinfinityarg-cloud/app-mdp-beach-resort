-- Stage 2: shared PostgreSQL model and tenant isolation foundation.
-- No customer-facing anonymous policies are enabled in this migration.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.business_plan as enum ('DEMO', 'ORO', 'PLATINO', 'DIAMANTE');
create type public.business_member_role as enum ('owner', 'admin', 'manager', 'cashier', 'kitchen', 'staff');
create type public.location_type as enum (
  'carpa', 'sombrilla', 'mesa_exterior', 'mesa_interior', 'mostrador', 'pileta', 'solarium'
);
create type public.location_status as enum ('disponible', 'ocupada', 'reservada', 'limpieza', 'mantenimiento');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  branch_name text not null,
  address text not null default '',
  city text not null default '',
  phone text not null default '',
  schedule text not null default '',
  active_plan public.business_plan not null default 'DEMO',
  demo_expiry_notice text not null default '',
  currency_symbol text not null default 'ARS',
  tax_percentage numeric(5,2) not null default 0 check (tax_percentage between 0 and 100),
  service_fee_cover numeric(12,2) not null default 0 check (service_fee_cover >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.business_member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index business_memberships_user_id_idx on public.business_memberships(user_id);

-- Keep tenant rows addressable by their existing string IDs while enforcing
-- tenant-local foreign keys with (business_id, id).
create table public.sectors (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  name text not null,
  description text not null default '',
  type public.location_type not null,
  capacity_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, id)
);

create table public.locations (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  code text not null,
  name text not null,
  type public.location_type not null,
  sector_id text not null,
  capacity integer not null default 1 check (capacity > 0),
  status public.location_status not null default 'disponible',
  current_guest_name text,
  current_order_id text,
  notes text,
  qr_payload text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, id),
  unique (business_id, code),
  foreign key (business_id, sector_id) references public.sectors(business_id, id) on delete restrict
);

create table public.categories (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  name text not null,
  emoji text not null default '',
  icon_name text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, id)
);

create table public.products (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  name text not null,
  description text not null default '',
  category_id text not null,
  price numeric(12,2) not null check (price >= 0),
  cost numeric(12,2) check (cost is null or cost >= 0),
  image text not null default '',
  sku text not null default '',
  is_available boolean not null default true,
  is_active boolean not null default true,
  rating numeric(3,2) not null default 0 check (rating between 0 and 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  sales_count integer not null default 0 check (sales_count >= 0),
  prep_time_minutes integer not null default 0 check (prep_time_minutes >= 0),
  tag text,
  is_veggie boolean not null default false,
  is_gluten_free boolean not null default false,
  included_ingredients text[] not null default '{}',
  removable_ingredients text[] not null default '{}',
  available_addons jsonb not null default '[]'::jsonb check (jsonb_typeof(available_addons) = 'array'),
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, id),
  foreign key (business_id, category_id) references public.categories(business_id, id) on delete restrict
);
create index products_business_category_idx on public.products(business_id, category_id);

create table public.promotions (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  name text not null,
  description text not null default '',
  promo_price numeric(12,2) not null check (promo_price >= 0),
  regular_price numeric(12,2) not null check (regular_price >= 0),
  image text not null default '',
  badge text not null default '',
  valid_until timestamptz,
  included_product_names text[] not null default '{}',
  conditions text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, id)
);

create table public.orders (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  order_number text not null,
  ticket_number text,
  location_id text not null,
  customer_name text,
  customer_phone text,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  discount_reason text,
  service_fee numeric(12,2) not null default 0 check (service_fee >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  status text not null default 'pendiente_confirmacion' check (status in (
    'pendiente_confirmacion', 'confirmado_en_cocina', 'en_preparacion',
    'listo_para_entrega', 'entregado', 'cancelado'
  )),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente', 'cobrado', 'anulado')),
  payment_method text check (payment_method is null or payment_method in (
    'efectivo', 'transferencia', 'qr', 'debito/credito', 'mercadopago_qr',
    'tarjeta_debito', 'tarjeta_credito', 'cargo_a_carpa'
  )),
  cancellation_reason text,
  notes text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  paid_at timestamptz,
  whatsapp_contacted_at timestamptz,
  edit_audit_log jsonb not null default '[]'::jsonb check (jsonb_typeof(edit_audit_log) = 'array'),
  primary key (business_id, id),
  unique (business_id, order_number),
  foreign key (business_id, location_id) references public.locations(business_id, id) on delete restrict
);
create index orders_business_status_created_idx on public.orders(business_id, status, created_at desc);
create index orders_business_location_idx on public.orders(business_id, location_id);

alter table public.locations
  add constraint locations_current_order_fk
  foreign key (business_id, current_order_id) references public.orders(business_id, id) on delete set null (current_order_id);

create table public.order_items (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  order_id text not null,
  product_id text not null,
  product_name text not null,
  product_image text not null default '',
  base_price numeric(12,2) not null check (base_price >= 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  variant jsonb,
  removed_ingredients text[] not null default '{}',
  selected_addons jsonb not null default '[]'::jsonb check (jsonb_typeof(selected_addons) = 'array'),
  notes text,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  primary key (business_id, id),
  foreign key (business_id, order_id) references public.orders(business_id, id) on delete cascade,
  foreign key (business_id, product_id) references public.products(business_id, id) on delete restrict
);
create index order_items_business_order_idx on public.order_items(business_id, order_id);

create table public.reservations (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  location_id text not null,
  service_date date not null,
  time_slot text not null check (time_slot in ('dia_completo', 'turno_manana', 'turno_tarde', 'semana', 'quincena')),
  guests_count integer not null check (guests_count > 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status text not null default 'confirmada' check (status in ('confirmada', 'en_uso', 'finalizada', 'cancelada')),
  notes text,
  created_at timestamptz not null default now(),
  primary key (business_id, id),
  foreign key (business_id, location_id) references public.locations(business_id, id) on delete restrict
);
create index reservations_business_date_idx on public.reservations(business_id, service_date);

create table public.cash_registers (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  is_open boolean not null default false,
  opened_at timestamptz,
  initial_cash numeric(12,2) not null default 0 check (initial_cash >= 0),
  cashier_name text not null default '',
  shift_name text not null default '',
  updated_at timestamptz not null default now()
);

create table public.cash_movements (
  business_id uuid not null references public.businesses(id) on delete cascade,
  id text not null default gen_random_uuid()::text,
  type text not null check (type in ('apertura', 'ingreso', 'egreso', 'venta', 'cierre')),
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text check (payment_method is null or payment_method in (
    'efectivo', 'transferencia', 'qr', 'debito/credito', 'mercadopago_qr',
    'tarjeta_debito', 'tarjeta_credito', 'cargo_a_carpa'
  )),
  concept text not null,
  cashier_name text not null,
  order_id text,
  created_at timestamptz not null default now(),
  primary key (business_id, id),
  foreign key (business_id, order_id) references public.orders(business_id, id) on delete restrict
);
create index cash_movements_business_created_idx on public.cash_movements(business_id, created_at desc);

-- The membership lookup bypasses RLS only inside this narrowly scoped helper.
-- It is kept outside the exposed API schemas and uses a pinned empty search path.
create function private.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships as membership
    where membership.business_id = p_business_id
      and membership.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_business_member(uuid) from public, anon, authenticated;
grant execute on function private.is_business_member(uuid) to authenticated;

alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
revoke all on table public.businesses, public.business_memberships from anon, authenticated;
grant select on table public.businesses, public.business_memberships to authenticated;
grant all on table public.businesses, public.business_memberships to service_role;

create policy businesses_select_member
  on public.businesses for select to authenticated
  using ((select private.is_business_member(id)));
create policy memberships_select_same_business
  on public.business_memberships for select to authenticated
  using ((select private.is_business_member(business_id)));

-- Operational rows all carry business_id. The authenticated role is limited
-- to memberships in that same tenant; role-specific permissions are a later stage.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'sectors', 'locations', 'categories', 'products', 'promotions', 'orders',
    'order_items', 'reservations', 'cash_registers', 'cash_movements'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_business_member(business_id)))',
      table_name || '_select_member', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_business_member(business_id)))',
      table_name || '_insert_member', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_business_member(business_id))) with check ((select private.is_business_member(business_id)))',
      table_name || '_update_member', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_business_member(business_id)))',
      table_name || '_delete_member', table_name
    );
  end loop;
end;
$$;

commit;
