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
