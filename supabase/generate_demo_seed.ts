import { writeFileSync } from 'node:fs';
import {
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_SECTORS,
} from '../src/data/seedData';

const jsonSql = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;

const recordSet = (rows: unknown[], definition: string) =>
  `jsonb_to_recordset(${jsonSql(rows)}) as seed(${definition})`;

const categories = INITIAL_CATEGORIES.map((row) => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  icon_name: row.iconName,
  sort_order: row.order,
}));

const sectors = INITIAL_SECTORS.map((row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  type: row.type,
  capacity_summary: row.capacitySummary,
}));

const locations = INITIAL_LOCATIONS.map((row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  type: row.type,
  sector_id: row.sectorId,
  capacity: row.capacity,
  status: row.status,
  qr_payload: row.qrPayload,
  notes: row.notes ?? null,
}));

const products = INITIAL_PRODUCTS.map((row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category_id: row.categoryId,
  price: row.price,
  cost: row.cost ?? null,
  image: row.image,
  sku: row.sku,
  is_available: row.isAvailable,
  is_active: row.isActive,
  rating: row.rating,
  reviews_count: row.reviewsCount,
  sales_count: row.salesCount,
  prep_time_minutes: row.prepTimeMinutes,
  tag: row.tag ?? null,
  is_veggie: row.isVeggie ?? false,
  is_gluten_free: row.isGlutenFree ?? false,
  included_ingredients: row.includedIngredients ?? [],
  removable_ingredients: row.removableIngredients ?? [],
  available_addons: row.availableAddons ?? [],
  variants: row.variants ?? [],
}));

const promotions = INITIAL_PROMOTIONS.map((row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  promo_price: row.promoPrice,
  regular_price: row.regularPrice,
  image: row.image,
  badge: row.badge,
  valid_until: row.validUntil ?? null,
  included_product_names: row.includedProductNames,
  conditions: row.conditions,
}));

const sql = `-- Demo catalog for local acceptance testing only. Safe to run more than once.
-- This only inserts missing rows; it does not overwrite an existing business catalog.
begin;

do $demo_seed$
declare
  v_business_id uuid;
begin
  select id into v_business_id
  from public.businesses
  where slug = 'tu-balneario-del-mar' and is_active;

  if v_business_id is null then
    raise exception 'Active business tu-balneario-del-mar was not found.';
  end if;

  insert into public.categories (business_id, id, name, emoji, icon_name, sort_order)
  select v_business_id, seed.id, seed.name, seed.emoji, seed.icon_name, seed.sort_order
  from ${recordSet(categories, 'id text, name text, emoji text, icon_name text, sort_order integer')}
  on conflict (business_id, id) do nothing;

  insert into public.sectors (business_id, id, name, description, type, capacity_summary)
  select v_business_id, seed.id, seed.name, seed.description, seed.type, seed.capacity_summary
  from ${recordSet(sectors, 'id text, name text, description text, type public.location_type, capacity_summary text')}
  on conflict (business_id, id) do nothing;

  insert into public.locations (business_id, id, code, name, type, sector_id, capacity, status, qr_payload, notes)
  select v_business_id, seed.id, seed.code, seed.name, seed.type, seed.sector_id, seed.capacity,
         seed.status, seed.qr_payload, seed.notes
  from ${recordSet(locations, 'id text, code text, name text, type public.location_type, sector_id text, capacity integer, status public.location_status, qr_payload text, notes text')}
  on conflict (business_id, id) do nothing;

  insert into public.products (
    business_id, id, name, description, category_id, price, cost, image, sku,
    is_available, is_active, rating, reviews_count, sales_count, prep_time_minutes,
    tag, is_veggie, is_gluten_free, included_ingredients, removable_ingredients,
    available_addons, variants
  )
  select v_business_id, seed.id, seed.name, seed.description, seed.category_id, seed.price, seed.cost,
         seed.image, seed.sku, seed.is_available, seed.is_active, seed.rating, seed.reviews_count,
         seed.sales_count, seed.prep_time_minutes, seed.tag, seed.is_veggie, seed.is_gluten_free,
         seed.included_ingredients, seed.removable_ingredients, seed.available_addons, seed.variants
  from ${recordSet(products, 'id text, name text, description text, category_id text, price numeric, cost numeric, image text, sku text, is_available boolean, is_active boolean, rating numeric, reviews_count integer, sales_count integer, prep_time_minutes integer, tag text, is_veggie boolean, is_gluten_free boolean, included_ingredients text[], removable_ingredients text[], available_addons jsonb, variants jsonb')}
  on conflict (business_id, id) do nothing;

  insert into public.promotions (
    business_id, id, name, description, promo_price, regular_price, image, badge,
    valid_until, included_product_names, conditions
  )
  select v_business_id, seed.id, seed.name, seed.description, seed.promo_price, seed.regular_price,
         seed.image, seed.badge, seed.valid_until, seed.included_product_names, seed.conditions
  from ${recordSet(promotions, 'id text, name text, description text, promo_price numeric, regular_price numeric, image text, badge text, valid_until date, included_product_names text[], conditions text')}
  on conflict (business_id, id) do nothing;
end;
$demo_seed$;

commit;
`;

writeFileSync(new URL('./seed_demo_data.sql', import.meta.url), sql, 'utf8');
console.log(`Wrote seed_demo_data.sql with ${categories.length} categories, ${sectors.length} sectors, ${locations.length} locations, ${products.length} products, and ${promotions.length} promotions.`);
