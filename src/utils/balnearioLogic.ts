import { CartItem, Order, OrderStatus, Product, SelectedAddon, ProductVariant, LocationType } from '../types';

/**
 * Formats monetary amounts in Argentine Pesos format (e.g. $11.800 ARS).
 */
export function formatCurrencyARS(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(rounded);
  return `$${formatted} ARS`;
}

/**
 * Calculates unit price of an item including optional variant and selected addons.
 */
export function calculateItemUnitPrice(
  basePrice: number,
  variant?: ProductVariant,
  addons: SelectedAddon[] = []
): number {
  const priceWithVariant = variant ? variant.price : basePrice;
  const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
  return Math.max(0, priceWithVariant + addonsTotal);
}

/**
 * Calculates subtotal, discount, service fee (cubierto/servicio), and total.
 */
export function calculateOrderTotals(
  items: CartItem[],
  discount: { type: 'percent' | 'fixed'; value: number } = { type: 'percent', value: 0 },
  coverFeePerPerson = 0,
  guestsCount = 0
): {
  subtotal: number;
  discountAmount: number;
  serviceFee: number;
  total: number;
} {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

  let discountAmount = 0;
  if (discount.type === 'percent') {
    discountAmount = Math.round((subtotal * Math.min(100, Math.max(0, discount.value))) / 100);
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, discount.value));
  }

  const serviceFee = Math.max(0, coverFeePerPerson * Math.max(0, guestsCount));
  const total = Math.max(0, subtotal - discountAmount + serviceFee);

  return {
    subtotal,
    discountAmount,
    serviceFee,
    total,
  };
}

/**
 * Dynamic Top 5 ranking calculator.
 * - Primary metric: actual units sold in valid completed/paid orders.
 * - Secondary tie-breaker: product customer rating.
 * - If not enough orders exist, returns highest-rated active products clearly identified.
 */
export function calculateTop5Products(
  products: Product[],
  orders: Order[],
  periodDays?: number
): { products: (Product & { dynamicUnitsSold: number })[]; isDemonstrationOnly: boolean } {
  const activeProducts = products.filter((p) => p.isActive);
  if (activeProducts.length === 0) {
    return { products: [], isDemonstrationOnly: true };
  }

  // Filter orders by period if specified
  const now = Date.now();
  const periodMs = periodDays ? periodDays * 24 * 60 * 60 * 1000 : null;

  const validOrders = orders.filter((o) => {
    if (o.status === 'cancelado') return false;
    if (periodMs) {
      const orderTime = new Date(o.createdAt).getTime();
      if (now - orderTime > periodMs) return false;
    }
    return true;
  });

  // Calculate sold units per productId
  const unitsSoldMap: Record<string, number> = {};
  for (const ord of validOrders) {
    for (const it of ord.items) {
      unitsSoldMap[it.productId] = (unitsSoldMap[it.productId] || 0) + it.quantity;
    }
  }

  const hasSalesData = Object.keys(unitsSoldMap).length > 0;

  // Build ranking
  const ranked = activeProducts.map((prod) => {
    const dynamicUnits = unitsSoldMap[prod.id] || 0;
    return {
      ...prod,
      dynamicUnitsSold: dynamicUnits,
    };
  });

  ranked.sort((a, b) => {
    // 1st: units sold
    if (b.dynamicUnitsSold !== a.dynamicUnitsSold) {
      return b.dynamicUnitsSold - a.dynamicUnitsSold;
    }
    // 2nd: rating
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    // 3rd: reviews count
    return b.reviewsCount - a.reviewsCount;
  });

  const top5 = ranked.slice(0, 5);

  return {
    products: top5,
    isDemonstrationOnly: !hasSalesData,
  };
}

/**
 * 10-Step Circuit State Transition Rules.
 * Ensures an employee confirms a customer order before dispatching to the kitchen,
 * and commercial payment closure is decoupled from physical preparation.
 */
export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;

  switch (from) {
    case 'pendiente_confirmacion':
      // From pending confirmation, staff confirms & sends to kitchen, or cancels
      return to === 'confirmado_en_cocina' || to === 'cancelado';

    case 'confirmado_en_cocina':
      // Kitchen takes the order into preparation, or can be cancelled
      return to === 'en_preparacion' || to === 'cancelado';

    case 'en_preparacion':
      // Kitchen finishes cooking -> ready for runner/waiter delivery
      return to === 'listo_para_entrega' || to === 'cancelado';

    case 'listo_para_entrega':
      // Staff delivers to tent / umbrella / table
      return to === 'entregado' || to === 'cancelado';

    case 'entregado':
      // Delivered stays delivered (POS can collect payment at any time)
      return false;

    case 'cancelado':
      return false;

    default:
      return false;
  }
}

/**
 * Cash register reconciliation difference (Counted cash vs Expected in register).
 */
export function calculateCashDifference(
  expectedCash: number,
  countedCash: number
): {
  difference: number;
  status: 'exact' | 'surplus' | 'shortage';
  message: string;
} {
  const diff = countedCash - expectedCash;
  if (diff === 0) {
    return {
      difference: 0,
      status: 'exact',
      message: 'Caja cuadrada exactamente sin diferencias.',
    };
  }
  if (diff > 0) {
    return {
      difference: diff,
      status: 'surplus',
      message: `Sobrante de caja: +${formatCurrencyARS(diff)}.`,
    };
  }
  return {
    difference: diff,
    status: 'shortage',
    message: `Faltante de caja: -${formatCurrencyARS(Math.abs(diff))}.`,
  };
}

/**
 * Validates and parses location codes like C-01 (Carpa), S-15 (Sombrilla), M-08 (Mesa), B-01 (Barra).
 */
export function parseLocationCode(code: string): {
  type: LocationType;
  number: number;
  isValid: boolean;
} {
  const clean = (code || '').trim().toUpperCase();
  const match = clean.match(/^([CSMEBPD])-?(\d+)$/);

  if (!match) {
    return { type: 'mesa_exterior', number: 0, isValid: false };
  }

  const prefix = match[1];
  const num = parseInt(match[2], 10);

  let type: LocationType = 'mesa_exterior';
  if (prefix === 'C') type = 'carpa';
  else if (prefix === 'S') type = 'sombrilla';
  else if (prefix === 'M' || prefix === 'I') type = 'mesa_interior';
  else if (prefix === 'E' || prefix === 'D') type = 'mesa_exterior';
  else if (prefix === 'B') type = 'mostrador';
  else if (prefix === 'P') type = 'pileta';

  return { type, number: num, isValid: true };
}

/**
 * Validates Argentine cellphone numbers with area code and international prefix.
 * Accepts formats like:
 * - "+54 9 223 555-1234"
 * - "223 5551234"
 * - "011 15-4444-3333"
 * - "1144443333"
 * - "+5491144443333"
 */
export function validateArgentinePhone(phoneInput: string): {
  isValid: boolean;
  cleanForWhatsApp: string;
  formattedDisplay: string;
  error?: string;
} {
  const raw = (phoneInput || '').trim();
  if (!raw) {
    return {
      isValid: false,
      cleanForWhatsApp: '',
      formattedDisplay: '',
      error: 'Ingresá tu número de teléfono celular con código de área.',
    };
  }

  // Remove non-digit characters
  let digits = raw.replace(/\D/g, '');

  // Strip international prefix if present (54 or 549)
  if (digits.startsWith('549')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('54')) {
    digits = digits.slice(2);
  }

  // Strip leading 0 from trunk code (e.g. 0223 -> 223, 011 -> 11)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Strip mobile prefix 15 if present after area code (e.g. 223 15 xxxxxxx or 11 15 xxxxxxx)
  // Common area codes: 11 (Bs As), 223 (Mar del Plata), 351 (Córdoba), 341 (Rosario), etc.
  if (digits.startsWith('1115')) {
    digits = '11' + digits.slice(4);
  } else if (digits.match(/^(223|351|341|261|381)15(\d{6,7})$/)) {
    const m = digits.match(/^(223|351|341|261|381)15(\d{6,7})$/)!;
    digits = m[1] + m[2];
  }

  // Standard Argentine mobile number has 10 digits (2-4 area code + 6-8 subscriber number)
  if (digits.length < 9 || digits.length > 11) {
    return {
      isValid: false,
      cleanForWhatsApp: '',
      formattedDisplay: raw,
      error: 'El teléfono debe incluir código de área (ej: 223 555-1234 o 11 4444-3333).',
    };
  }

  // Normalise for WhatsApp (+54 9 <10 digits>)
  const cleanForWhatsApp = `549${digits}`;
  const formattedDisplay = `+54 9 ${digits.slice(0, digits.length - 8)} ${digits.slice(-8, -4)}-${digits.slice(-4)}`;

  return {
    isValid: true,
    cleanForWhatsApp,
    formattedDisplay,
  };
}

/**
 * Builds the prepared WhatsApp confirmation message according to the required template:
 *
 * Hola, [nombre]. Somos de [nombre del balneario].
 *
 * Recibimos tu pedido [número]:
 *
 * [Detalle de productos y cantidades]
 *
 * Total: $[importe].
 *
 * Tu pedido se encuentra pendiente de confirmación. ¿Confirmás que está correcto o querés realizar alguna modificación?
 *
 * ¡Gracias!
 */
export function formatWhatsAppOrderMessage(
  order: Order,
  branchName: string
): string {
  const customerName = order.customerName || 'Cliente';
  const itemsText = order.items
    .map((item) => {
      const modifications: string[] = [];
      if (item.variant) modifications.push(`(${item.variant.name})`);
      if (item.removedIngredients.length > 0) {
        modifications.push(`sin ${item.removedIngredients.join(', ')}`);
      }
      if (item.selectedAddons.length > 0) {
        modifications.push(`con ${item.selectedAddons.map((a) => a.name).join(', ')}`);
      }
      if (item.notes) {
        modifications.push(`nota: "${item.notes}"`);
      }
      const modString = modifications.length > 0 ? ` [${modifications.join(' - ')}]` : '';
      return `• ${item.quantity}x ${item.productName}${modString}`;
    })
    .join('\n');

  const formattedTotal = formatCurrencyARS(order.total);
  const locationText = order.locationCode ? ` (Ubicación: *${order.locationName} - ${order.locationCode}*)` : '';

  const paymentMethodLabels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia Bancaria',
    qr: 'Mercado Pago / Billetera QR',
    'debito/credito': 'Tarjeta Débito / Crédito',
    mercadopago_qr: 'Mercado Pago QR',
    tarjeta_debito: 'Tarjeta Débito',
    tarjeta_credito: 'Tarjeta Crédito',
    cargo_a_carpa: 'Cargo a la Carpa',
  };
  const paymentLine = order.paymentMethod
    ? `\nMedio de pago: *${paymentMethodLabels[order.paymentMethod] || order.paymentMethod}*`
    : '';

  const originUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://mdp-beach.grupoinfinity.site';
  const cleanOrderNum = (order.orderNumber || '').replace(/[^0-9]/g, '') || order.id;

  return `Hola, *${customerName}*. Somos de *${branchName}*.\n\nRecibimos tu pedido *${order.orderNumber}*${locationText}:\n\n${itemsText}\n\nTotal: *${formattedTotal}*.${paymentLine}\n\nRespondé con una opción:\n👍 *CONFIRMAR*: ${originUrl}/?confirmar=${cleanOrderNum}\n✏️ *EDITAR*: ${originUrl}/?editar=${cleanOrderNum}\n🚫 *CANCELAR*: ${originUrl}/?cancelar=${cleanOrderNum}\n\n¡Gracias!`;
}

/**
 * Builds an action URL for WhatsApp Web / App.
 */
export function buildWhatsAppLink(
  phoneClean: string,
  message: string
): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneClean}?text=${encodedMessage}`;
}

/**
 * Fuzzy search matcher for written, voice, and barcode/SKU searches.
 * Handles diacritics removal, partial token matching, and colloquial beach terminology
 * (e.g. "coca" -> Gaseosa Cola, "papas" -> Papas Fritas, "rabas", "limonada", "mineral").
 */
export function matchProductSearch(product: Product, query: string): boolean {
  if (!query || !query.trim()) return true;

  const normalize = (str: string) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

  const cleanQuery = normalize(query);
  if (!cleanQuery) return true;

  const name = normalize(product.name);
  const desc = normalize(product.description);
  const sku = normalize(product.sku);
  const tag = normalize(product.tag || '');
  const ingredients = (product.includedIngredients || []).map(normalize).join(' ');

  // Direct substring match
  if (
    name.includes(cleanQuery) ||
    desc.includes(cleanQuery) ||
    sku.includes(cleanQuery) ||
    tag.includes(cleanQuery) ||
    ingredients.includes(cleanQuery)
  ) {
    return true;
  }

  // Synonym / colloquial aliases in Argentina beach parlance
  const synonyms: Record<string, string[]> = {
    coca: ['gaseosa', 'cola'],
    cocacola: ['gaseosa', 'cola'],
    gaseosa: ['cola', 'pomelo', 'tonica', 'sprite', 'paso'],
    papas: ['fritas', 'papas'],
    birra: ['cerveza', 'ipa', 'golden'],
    cerveza: ['birra', 'ipa', 'golden', 'artesanal'],
    hamburguesa: ['burger', 'novillo', 'medallon'],
    burger: ['hamburguesa'],
    rabas: ['calamar', 'romana'],
    licuado: ['fruta', 'maracuya', 'frutilla', 'banana'],
    trago: ['fernet', 'mojito', 'gin', 'aperol', 'cocktail'],
    agua: ['mineral', 'agua'],
  };

  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);

  // Check if all or most words match product attributes or synonyms
  const matchedWords = queryWords.filter((w) => {
    if (name.includes(w) || desc.includes(w) || sku.includes(w) || tag.includes(w) || ingredients.includes(w)) {
      return true;
    }
    const syns = synonyms[w];
    if (syns && syns.some((s) => name.includes(s) || desc.includes(s) || tag.includes(s))) {
      return true;
    }
    return false;
  });

  return matchedWords.length > 0;
}
