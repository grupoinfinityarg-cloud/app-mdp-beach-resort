import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

type Action = 'confirm' | 'edit' | 'cancel';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Falta configurar ${name} en Supabase Functions.`);
  return value;
}

function getServiceClient() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getActions(): Array<{ action: Action; token: string }> {
  return ['confirm', 'edit', 'cancel'].map((action) => ({
    action: action as Action,
    token: crypto.randomUUID(),
  }));
}

async function sendOrderApproval(request: Request, payload: Record<string, unknown>): Promise<Response> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return jsonResponse({ error: 'Iniciá sesión para enviar el pedido.' }, 401);

  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const anonKey = requiredEnv('SUPABASE_ANON_KEY');
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return jsonResponse({ error: 'La sesión venció. Volvé a ingresar.' }, 401);

  const businessSlug = typeof payload.businessSlug === 'string' ? payload.businessSlug.trim().toLowerCase() : '';
  const orderId = typeof payload.orderId === 'string' ? payload.orderId.trim() : '';
  const version = Number(payload.version);
  if (!businessSlug || !orderId || !Number.isInteger(version) || version < 1) {
    return jsonResponse({ error: 'Los datos del pedido no son válidos.' }, 400);
  }

  const service = getServiceClient();
  const { data: business, error: businessError } = await service
    .from('businesses')
    .select('id, name')
    .eq('slug', businessSlug)
    .eq('is_active', true)
    .maybeSingle();
  if (businessError || !business) return jsonResponse({ error: 'No se encontró el balneario.' }, 404);

  const { data: membership, error: membershipError } = await service
    .from('business_memberships')
    .select('user_id')
    .eq('business_id', business.id)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (membershipError || !membership) return jsonResponse({ error: 'No tenés acceso a este balneario.' }, 403);

  const { data: order, error: orderError } = await service
    .from('orders')
    .select('id, order_number, order_source, status, current_version, customer_name, customer_phone, total, location_id')
    .eq('business_id', business.id)
    .eq('id', orderId)
    .maybeSingle();
  if (orderError || !order) return jsonResponse({ error: 'No se encontró el pedido.' }, 404);
  if (order.order_source !== 'qr' || order.status !== 'pendiente_confirmacion' || order.current_version !== version) {
    return jsonResponse({ error: 'El pedido cambió o ya no está pendiente de confirmación.' }, 409);
  }

  const phone = String(order.customer_phone ?? '').replace(/\D/g, '');
  if (phone.length < 10 || phone.length > 15) return jsonResponse({ error: 'El teléfono del cliente no es válido.' }, 422);

  const { data: snapshotRow, error: snapshotError } = await service
    .from('order_versions')
    .select('snapshot')
    .eq('business_id', business.id)
    .eq('order_id', order.id)
    .eq('version', version)
    .maybeSingle();
  if (snapshotError || !snapshotRow?.snapshot) return jsonResponse({ error: 'No se encontró la versión del pedido.' }, 404);

  const { data: location } = await service
    .from('locations')
    .select('name, code')
    .eq('business_id', business.id)
    .eq('id', order.location_id)
    .maybeSingle();

  const apiVersion = requiredEnv('META_WHATSAPP_API_VERSION');
  if (!/^v\d+\.\d+$/.test(apiVersion)) return jsonResponse({ error: 'META_WHATSAPP_API_VERSION debe tener formato vNN.N.' }, 500);
  const phoneNumberId = requiredEnv('META_WHATSAPP_PHONE_NUMBER_ID');
  const accessToken = requiredEnv('META_WHATSAPP_ACCESS_TOKEN');
  const templateName = requiredEnv('META_WHATSAPP_ORDER_TEMPLATE_NAME');
  const templateLanguage = Deno.env.get('META_WHATSAPP_ORDER_TEMPLATE_LANGUAGE')?.trim() || 'es_AR';

  const tokens = getActions();
  const tokenRows = tokens.map(({ action, token }) => ({
    token,
    business_id: business.id,
    order_id: order.id,
    version,
    action,
    recipient_phone: phone,
  }));
  const { error: tokenInsertError } = await service.from('whatsapp_order_approval_buttons').insert(tokenRows);
  if (tokenInsertError) return jsonResponse({ error: 'No se pudieron preparar los botones de respuesta.' }, 500);

  const snapshot = snapshotRow.snapshot as Record<string, unknown>;
  const formattedTotal = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(snapshot.total ?? order.total));
  const locationName = [location?.name, location?.code].filter(Boolean).join(' · ') || 'la ubicación indicada';
  const actionIndex: Record<Action, string> = { confirm: '0', edit: '1', cancel: '2' };
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: String(snapshot.customerName ?? order.customer_name ?? 'Cliente').slice(0, 80) },
        { type: 'text', text: String(order.order_number).slice(0, 40) },
        { type: 'text', text: locationName.slice(0, 80) },
        { type: 'text', text: formattedTotal.slice(0, 40) },
      ],
    },
    ...tokens.map(({ action, token }) => ({
      type: 'button',
      sub_type: 'quick_reply',
      index: actionIndex[action],
      parameters: [{ type: 'payload', payload: token }],
    })),
  ];

  let whatsappMessageId = '';
  try {
    const graphResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components,
        },
      }),
    });
    const result = await graphResponse.json().catch(() => ({}));
    if (!graphResponse.ok) {
      await service.from('whatsapp_order_approval_buttons').delete().in('token', tokens.map(({ token }) => token));
      const metaMessage = result?.error?.error_user_msg || result?.error?.message;
      return jsonResponse({ error: metaMessage || 'WhatsApp no aceptó el mensaje. Revisá la plantilla y la configuración de Meta.' }, 502);
    }
    whatsappMessageId = result?.messages?.[0]?.id;
    if (!whatsappMessageId) throw new Error('WhatsApp no devolvió un identificador de mensaje.');
  } catch (error) {
    await service.from('whatsapp_order_approval_buttons').delete().in('token', tokens.map(({ token }) => token));
    const message = error instanceof Error ? error.message : 'No se pudo conectar con WhatsApp.';
    return jsonResponse({ error: message }, 502);
  }

  const { error: recordError } = await service.rpc('record_qr_whatsapp_approval_sent', {
    p_business_slug: businessSlug,
    p_order_id: order.id,
    p_version: version,
    p_whatsapp_message_id: whatsappMessageId,
    p_tokens: tokens.map(({ token }) => token),
  });
  if (recordError) {
    return jsonResponse({ error: 'WhatsApp envió el mensaje, pero no se pudo registrar el contacto en el pedido. Avisá a Caja antes de reenviarlo.' }, 502);
  }

  return jsonResponse({ sent: true, orderId: order.id, version, messageId: whatsappMessageId });
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hasValidMetaSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature?.startsWith('sha256=')) return false;
  const secret = requiredEnv('META_WHATSAPP_APP_SECRET');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  const expected = `sha256=${bytesToHex(digest)}`;
  if (signature.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

async function handleMetaWebhook(request: Request, rawBody: string): Promise<Response> {
  if (!await hasValidMetaSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return jsonResponse({ error: 'Firma de Meta no válida.' }, 401);
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'El webhook no contiene JSON válido.' }, 400);
  }

  const service = getServiceClient();
  const entries = Array.isArray(body.entry) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray((entry as any)?.changes) ? (entry as any).changes : [];
    for (const change of changes) {
      const messages = Array.isArray(change?.value?.messages) ? change.value.messages : [];
      for (const message of messages) {
        let payload: string | undefined;
        if (message?.type === 'button') {
          payload = message.button?.payload;
        }
        if (message?.type === 'interactive' && message.interactive?.type === 'button_reply') {
          payload = message.interactive.button_reply?.id;
        }
        // Soporte adicional: si el cliente responde tipeando texto o emojis (👍, ✏️, 🚫)
        if (!payload && message?.type === 'text' && typeof message.text?.body === 'string') {
          const bodyText = message.text.body.trim().toLowerCase();
          let matchedAction: Action | null = null;
          if (bodyText.includes('confirm') || bodyText.includes('👍') || bodyText === '1' || bodyText === 'si' || bodyText === 'sí') {
            matchedAction = 'confirm';
          } else if (bodyText.includes('edit') || bodyText.includes('✏️') || bodyText === '2' || bodyText.includes('cambiar')) {
            matchedAction = 'edit';
          } else if (bodyText.includes('cancel') || bodyText.includes('🚫') || bodyText.includes('❌') || bodyText === '3') {
            matchedAction = 'cancel';
          }
          if (matchedAction) {
            const senderDigits = String(message.from ?? '').replace(/\D/g, '');
            const { data: btnRow } = await service
              .from('whatsapp_order_approval_buttons')
              .select('token')
              .eq('action', matchedAction)
              .eq('recipient_phone', senderDigits)
              .is('consumed_at', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (btnRow?.token) payload = btnRow.token;
          }
        }
        if (typeof payload !== 'string' || !payload) continue;
        await service.rpc('apply_qr_whatsapp_customer_response', {
          p_token: payload,
          p_sender_phone: String(message.from ?? ''),
          p_response_message_id: String(message.id ?? ''),
        });
      }
    }
  }
  return jsonResponse({ received: true });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === requiredEnv('META_WHATSAPP_WEBHOOK_VERIFY_TOKEN') && challenge) {
        return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
      return new Response('Forbidden', { status: 403 });
    }

    if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido.' }, 405);
    const rawBody = await request.text();
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(rawBody); } catch { /* Meta webhook validation happens below. */ }
    if (payload.action === 'send_order_approval') return await sendOrderApproval(request, payload);
    return await handleMetaWebhook(request, rawBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno al procesar WhatsApp.';
    return jsonResponse({ error: message }, 500);
  }
});
