# Backend base for Gestión Balnearia

This folder contains the versioned Supabase database foundation. The app has a Supabase client configured, but its operational data and order flow still use the existing `localStorage` demo state until the remaining Stage 3 work is completed.

## Included in Stage 2

- A shared PostgreSQL schema with a `businesses` tenant table and `business_memberships` linked to Supabase Auth users.
- Tenant-scoped sectors, locations, categories, products, promotions, orders, order items, reservations, cash register and cash movement tables.
- Existing string IDs are retained as tenant-local IDs. Composite foreign keys include `business_id` so records cannot reference another tenant's rows.
- RLS is enabled on every exposed `public` table. Authenticated users can access operational rows only when they belong to that business. Membership creation, plan changes and initial tenant provisioning remain service/admin operations.
- `private.is_business_member()` is outside the exposed API schemas, uses an empty `search_path`, and is executable only by authenticated users through RLS policies.
- The `anon` role has no table grants. Customer menu reads and order submission will be added through a narrow public interface in Stage 3, rather than exposing internal tables or customer/order data.

The membership role values are stored now, but role-specific permissions are not enforced yet. Stage 6 will define those rules alongside multi-user operations. All members currently share the same tenant-scoped access to operational tables.

## Apply locally

Install the Supabase CLI and Docker separately if they are not already available, then run from the repository root:

```sh
supabase start
supabase db reset
```

`supabase db reset` recreates the local database and applies migrations from this folder. This project has no seed data configured because the current `src/data/seedData.ts` records are demonstration content and should not silently become production tenant data.

## Provisioning and remote use

The initial schema migration has been applied manually to the connected Supabase project. Use `provision_business.sql` in the Dashboard SQL Editor after creating the staff account under Authentication > Users; replace the email placeholder first. The script creates the `MDP BEACH & RESORT` tenant with slug `tu-balneario-del-mar` and assigns that account the `cashier` membership. Do not add a Supabase secret/service-role key to browser environment variables or source control. Only a publishable key belongs in the browser, and it still depends on database grants and RLS.

Set `VITE_SUPABASE_BUSINESS_SLUG` to the tenant slug so newly generated QR codes identify the business.

## Stage 3: connect QR orders

The app now loads a QR menu through `get_qr_menu`, submits customer orders through `create_qr_order` (which recalculates prices from the database), and loads the authenticated staff QR order feed from Supabase. Orders have immutable numbered snapshots: editing a pending QR order creates a new version and requires the customer to approve that version again. Caja records that the customer approved via WhatsApp; the database refuses to send an unapproved or outdated version to Kitchen. QR guest assistance calls are stored in `guest_assistance_requests` and appear in the staff notification dropdown in real time.

To enable this on the connected project, in Supabase Dashboard > SQL Editor:

1. Run `migrations/20261105000100_qr_orders_and_customer_approval.sql`.
2. Run `migrations/20261105000200_waiter_assistance_requests.sql` to enable guest calls and staff notifications.
3. For demo testing, run `seed_demo_data.sql`. It inserts the local demo catalog into `tu-balneario-del-mar` and leaves rows with matching IDs unchanged. This is demo content; review and replace it before using the menu with customers.
4. Confirm the app's local environment has `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_BUSINESS_SLUG=tu-balneario-del-mar`, then restart the local app.
5. Open a generated QR link for a location that exists in the seeded catalog, submit a test order, and verify it appears in Comandas. Contact the customer in WhatsApp, record approval in Caja, then send it to Cocina. Use “Llamar Mozo” to verify the request appears in the staff notification dropdown.

The application changes and SQL files are local until you apply the SQL yourself. No production migration or seed was run from this workspace. The browser publishable key is public by design; the order rules and customer price calculation are enforced by the database functions and grants, but the app itself has not been deployed or remotely tested.

## WhatsApp order approval buttons

QR order confirmation now uses the WhatsApp Business Platform Cloud API instead of opening a prefilled `wa.me` draft. The Supabase Edge Function `whatsapp-order-approval` sends a template with three quick replies (`CONFIRMAR`, `EDITAR`, `CANCELAR`) and receives the button response through the Meta webhook. The webhook checks Meta's HMAC signature, matches the replying phone to the order, and accepts each response only once for the current order version.

Before enabling it:

1. In Meta Business Manager / WhatsApp Manager, confirm the balneario's WhatsApp number is registered for the Cloud API and can receive webhook events. Do not disconnect or migrate the existing WhatsApp Business number until its current setup has been checked.
2. Create and get approval for a Spanish utility template with four body variables in this order: customer name, order number, location, total. Add exactly three quick-reply buttons, in this order: `👍 CONFIRMAR`, `✏️ EDITAR`, `🚫 CANCELAR`.
3. Apply `migrations/20261107000100_whatsapp_order_approval_buttons.sql` in the connected Supabase project.
4. Deploy the `whatsapp-order-approval` Edge Function.
5. Add these function secrets in Supabase: `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_APP_SECRET`, `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `META_WHATSAPP_API_VERSION`, `META_WHATSAPP_ORDER_TEMPLATE_NAME`, and `META_WHATSAPP_ORDER_TEMPLATE_LANGUAGE` (`es_AR` for the template above).
6. In Meta's webhook configuration, use `https://<project-ref>.supabase.co/functions/v1/whatsapp-order-approval`, enter the same verification token, and subscribe to the `messages` field.
7. Send a test QR order to a number controlled by the balneario. Confirm each button updates the order in Comandas before using the flow with customers.

The service-role key stays in Supabase's managed function environment and is never added to Vercel or browser variables. Until the migration, function, template, and Meta webhook are configured, the new QR send button cannot deliver a WhatsApp message. A tap on `EDITAR` records a request for staff to contact the customer and create a new order version; `CANCELAR` cancels the pending order; `CONFIRMAR` approves only the version shown in that message.
