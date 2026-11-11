export type LocationType =
  | 'carpa'
  | 'sombrilla'
  | 'mesa_exterior'
  | 'mesa_interior'
  | 'mostrador'
  | 'pileta'
  | 'solarium';

export type LocationStatus =
  | 'disponible'
  | 'ocupada'
  | 'reservada'
  | 'limpieza'
  | 'mantenimiento';

export interface LocationItem {
  id: string;
  code: string; // e.g. "C-01", "S-15", "M-08", "D-03"
  name: string;
  type: LocationType;
  sectorId: string;
  sectorName: string;
  capacity: number;
  status: LocationStatus;
  currentGuestName?: string;
  currentOrderId?: string;
  notes?: string;
  qrPayload: string;
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  capacitySummary: string;
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  cost?: number;
  image: string;
  sku: string;
  isAvailable: boolean;
  isActive: boolean;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  prepTimeMinutes: number;
  tag?: string; // e.g. "MÁS PEDIDO", "POPULAR", "ESPECIAL CHEF", "RECOMENDADO"
  isVeggie?: boolean;
  isGlutenFree?: boolean;
  includedIngredients?: string[];
  removableIngredients?: string[];
  availableAddons?: ProductAddon[];
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  iconName: string;
  order: number;
}

export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item id in cart
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  variant?: ProductVariant;
  removedIngredients: string[];
  selectedAddons: SelectedAddon[];
  notes?: string;
  subtotal: number;
}

export type OrderStatus =
  | 'pendiente_confirmacion' // Paso 3: creado por el cliente, esperando revisión del mozo/balneario
  | 'confirmado_en_cocina'   // Paso 6: aprobado por el personal, ingresa a la KDS
  | 'en_preparacion'        // Paso 8: cocina lo toma en preparación
  | 'listo_para_entrega'    // Paso 8: cocina marca listo
  | 'entregado'             // Paso 9: personal entrega en carpa/sombrilla/mesa
  | 'cancelado';

export type PaymentStatus = 'pendiente' | 'cobrado' | 'anulado';

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'qr'
  | 'debito/credito'
  | 'mercadopago_qr'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'cargo_a_carpa';

export type CustomerApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected' | 'edit_requested';
export type OrderSource = 'staff' | 'qr';

export interface GuestAssistanceRequest {
  id: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  requestedAt: string;
  requestCount: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#1054"
  ticketNumber?: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  locationType: LocationType;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  serviceFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  paidAt?: string;
  whatsappContactedAt?: string;
  orderSource?: OrderSource;
  currentVersion?: number;
  customerApprovedVersion?: number;
  customerApprovalStatus?: CustomerApprovalStatus;
  editAuditLog?: {
    timestamp: string;
    employee: string;
    description: string;
  }[];
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  promoPrice: number;
  regularPrice: number;
  image: string;
  badge: string;
  validUntil: string;
  includedProductNames: string[];
  conditions: string;
  isActive: boolean;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locationId: string;
  locationCode: string;
  locationType: LocationType;
  date: string;
  timeSlot: 'dia_completo' | 'turno_manana' | 'turno_tarde' | 'semana' | 'quincena';
  guestsCount: number;
  depositAmount: number;
  totalAmount: number;
  status: 'confirmada' | 'en_uso' | 'finalizada' | 'cancelada';
  notes?: string;
  createdAt: string;
}

export interface CashMovement {
  id: string;
  type: 'apertura' | 'ingreso' | 'egreso' | 'venta' | 'cierre';
  amount: number;
  paymentMethod?: PaymentMethod;
  concept: string;
  cashierName: string;
  orderId?: string;
  createdAt: string;
}

export interface CashRegisterState {
  isOpen: boolean;
  openedAt?: string;
  initialCash: number;
  cashierName: string;
  shiftName: string; // e.g. "Turno Mañana / Playa", "Turno Tarde / Parador"
}

export type CommercialPlan = 'DEMO' | 'ORO' | 'PLATINO' | 'DIAMANTE';

export interface BalnearioConfig {
  name: string;
  branchName: string;
  slogan?: string;
  logoUrl?: string;
  address: string;
  city: string;
  phone: string;
  schedule: string;
  activePlan: CommercialPlan;
  demoExpiryNotice: string;
  currencySymbol: string;
  taxPercentage: number;
  serviceFeeCover: number; // e.g. cubierto de mesa o servicio carpa
}
