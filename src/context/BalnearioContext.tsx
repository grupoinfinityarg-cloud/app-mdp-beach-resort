import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  BalnearioConfig,
  CartItem,
  CashMovement,
  CashRegisterState,
  Category,
  CommercialPlan,
  GuestAssistanceRequest,
  LocationItem,
  LocationStatus,
  LocationType,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  Promotion,
  Reservation,
  Sector,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_CONFIG,
  INITIAL_LOCATIONS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_RESERVATIONS,
  INITIAL_SECTORS,
  INITIAL_CASH_MOVEMENTS,
} from '../data/seedData';
import { calculateItemUnitPrice, canTransitionOrderStatus } from '../utils/balnearioLogic';
import { isSupabaseConfigured, supabase, supabaseBusinessSlug } from '../utils/supabase';

export type ActiveView =
  | 'panel'
  | 'sectores'
  | 'carpas'
  | 'carta'
  | 'personalizar'
  | 'comandas'
  | 'cocina'
  | 'pos'
  | 'productos'
  | 'promociones'
  | 'reservas'
  | 'caja'
  | 'reportes'
  | 'configuracion';

interface BalnearioContextType {
  config: BalnearioConfig;
  businessDisplayName: string;
  updateConfig: (patch: Partial<BalnearioConfig>) => void;
  switchPlan: (plan: CommercialPlan) => void;

  // Navigation
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedLocationCode: string;
  setSelectedLocationCode: (code: string) => void;

  // Sectors & Locations
  sectors: Sector[];
  locations: LocationItem[];
  updateLocationStatus: (locationId: string, status: LocationStatus, guestName?: string) => void;
  addLocation: (location: Omit<LocationItem, 'id'>) => void;
  editLocation: (locationId: string, patch: Partial<LocationItem>) => void;

  // Products & Categories
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'salesCount'>) => void;
  editProduct: (productId: string, patch: Partial<Product>) => void;
  toggleProductAvailable: (productId: string) => void;
  toggleProductActive: (productId: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;

  // Promotions
  promotions: Promotion[];
  addPromotion: (promo: Omit<Promotion, 'id'>) => void;
  editPromotion: (promoId: string, patch: Partial<Promotion>) => void;
  togglePromotion: (promoId: string) => void;

  // Customer Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  productBeingCustomized: Product | null;
  setProductBeingCustomized: (product: Product | null) => void;

  orders: Order[];
  guestAssistanceRequests: GuestAssistanceRequest[];
  resolveGuestAssistanceRequest: (requestId: string) => Promise<boolean>;
  activePosOrder: Order | null;
  setActivePosOrder: (order: Order | null) => void;
  openPosForOrder: (order: Order) => void;
  createCustomerOrder: (
    locationCode: string,
    customerName?: string,
    customerPhone?: string,
    paymentMethod?: PaymentMethod,
    notes?: string
  ) => Order | null;
  editOrder: (
    orderId: string,
    updatedItems: CartItem[],
    updatedNotes?: string,
    employeeName?: string,
    changeDescription?: string
  ) => boolean;
  recordWhatsAppContact: (orderId: string, alreadyPersistedRemotely?: boolean) => void;
  recordQrCustomerApproval: (order: Order) => Promise<boolean>;
  recordQrCustomerEditRequest: (order: Order) => Promise<boolean>;
  sendQrOrderToKitchen: (order: Order) => Promise<boolean>;
  editQrOrderVersion: (order: Order, items: CartItem[], notes: string | undefined, employee: string, reason: string) => Promise<boolean>;
  confirmAndSendToKitchen: (orderId: string) => boolean;
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus) => boolean;
  cancelOrder: (orderId: string, reason: string) => boolean;
  closeAndPayOrder: (
    orderId: string,
    paymentMethod: PaymentMethod,
    discountAmount?: number,
    cashierName?: string
  ) => Promise<boolean>;
  createDirectPosSale: (
    locationCode: string,
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerName?: string,
    discountAmount?: number,
    serviceFee?: number,
    sendToKitchen?: boolean
  ) => Order;

  // Reservations
  reservations: Reservation[];
  addReservation: (res: Omit<Reservation, 'id' | 'createdAt'>) => void;
  updateReservationStatus: (resId: string, status: Reservation['status']) => void;

  // Cash Register
  cashRegister: CashRegisterState;
  cashMovements: CashMovement[];
  openCashRegister: (initialCash: number, cashierName: string, shiftName: string) => void;
  closeCashRegister: (countedCash: number, notes?: string) => { difference: number };
  addManualCashMovement: (
    type: 'ingreso' | 'egreso',
    amount: number,
    concept: string,
    cashierName: string
  ) => void;

  // Reset to initial demo state
  resetAllDemoData: () => void;
}

const BalnearioContext = createContext<BalnearioContextType | null>(null);

const STORAGE_KEY = 'gestion_balnearia_v1.0';

export const BalnearioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or defaults
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const [config, setConfig] = useState<BalnearioConfig>(() =>
    loadStored('config', INITIAL_CONFIG)
  );
  const [businessDisplayName, setBusinessDisplayName] = useState(INITIAL_CONFIG.branchName);
  const [sectors] = useState<Sector[]>(() =>
    loadStored('sectors', INITIAL_SECTORS)
  );
  const [locations, setLocations] = useState<LocationItem[]>(() =>
    loadStored('locations', INITIAL_LOCATIONS)
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadStored('categories', INITIAL_CATEGORIES)
  );
  const [products, setProducts] = useState<Product[]>(() =>
    loadStored('products', INITIAL_PRODUCTS)
  );
  const [promotions, setPromotions] = useState<Promotion[]>(() =>
    loadStored('promotions', INITIAL_PROMOTIONS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    loadStored('orders', INITIAL_ORDERS)
  );
  const [guestAssistanceRequests, setGuestAssistanceRequests] = useState<GuestAssistanceRequest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>(() =>
    loadStored('reservations', INITIAL_RESERVATIONS)
  );
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() =>
    loadStored('cash_movements', INITIAL_CASH_MOVEMENTS)
  );
  const [cashRegister, setCashRegister] = useState<CashRegisterState>(() =>
    loadStored('cash_register', {
      isOpen: true,
      openedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      initialCash: 150000,
      cashierName: 'Matías Silva',
      shiftName: 'Turno Mañana / Playa & Parador',
    })
  );

  const [activeView, setActiveView] = useState<ActiveView>('panel');
  const [selectedLocationCode, setSelectedLocationCode] = useState<string>('C-01');
  const [cart, setCart] = useState<CartItem[]>(() => loadStored('cart', []));
  const [productBeingCustomized, setProductBeingCustomized] = useState<Product | null>(null);
  const [activePosOrder, setActivePosOrder] = useState<Order | null>(null);

  // Carga y mantiene sincronizados los pedidos QR visibles para el personal.
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client || !supabaseBusinessSlug) return;
    let alive = true;
    let businessId: string | null = null;
    const loadQrOrders = async () => {
      const { data: business } = await client
        .from('businesses').select('id,name').eq('slug', supabaseBusinessSlug).maybeSingle();
      if (!alive || !business?.id) return;
      if (business.name) {
        setBusinessDisplayName(business.name);
        setConfig((current) => ({ ...current, branchName: business.name }));
      }
      businessId = business.id;

      const { data: assistanceRows, error: assistanceError } = await client
        .from('guest_assistance_requests').select('*').eq('business_id', businessId)
        .is('resolved_at', null).order('created_at', { ascending: true });
      if (alive && !assistanceError && assistanceRows) {
        const assistanceLocationIds = [...new Set(assistanceRows.map((request) => request.location_id))];
        const { data: assistanceLocations } = assistanceLocationIds.length
          ? await client.from('locations').select('id,code,name').eq('business_id', businessId).in('id', assistanceLocationIds)
          : { data: [] };
        const assistanceLocationById = new Map((assistanceLocations ?? []).map((location) => [location.id, location]));
        setGuestAssistanceRequests(assistanceRows.map((request) => {
          const location = assistanceLocationById.get(request.location_id);
          return {
            id: request.id, locationId: request.location_id,
            locationCode: location?.code ?? '', locationName: location?.name ?? 'Ubicación',
            requestedAt: request.created_at, requestCount: request.request_count,
          };
        }));
      }

      const { data: rows, error } = await client
        .from('orders').select('*').eq('business_id', businessId).eq('order_source', 'qr')
        .order('created_at', { ascending: false });
      if (!alive || error || !rows) return;
      const ids = rows.map((row) => row.id);
      const { data: itemRows } = ids.length
        ? await client.from('order_items').select('*').eq('business_id', businessId).in('order_id', ids)
        : { data: [] };
      const byOrder = new Map<string, CartItem[]>();
      for (const item of itemRows ?? []) {
        const list = byOrder.get(item.order_id) ?? [];
        list.push({
          id: item.id, productId: item.product_id, productName: item.product_name,
          productImage: item.product_image, basePrice: Number(item.base_price),
          unitPrice: Number(item.unit_price), quantity: item.quantity,
          variant: item.variant ?? undefined, removedIngredients: item.removed_ingredients ?? [],
          selectedAddons: item.selected_addons ?? [], notes: item.notes ?? undefined,
          subtotal: Number(item.subtotal),
        });
        byOrder.set(item.order_id, list);
      }
      const locationIds = [...new Set(rows.map((row) => row.location_id))];
      const { data: locationRows } = locationIds.length
        ? await client.from('locations').select('id,code,name,type').eq('business_id', businessId).in('id', locationIds)
        : { data: [] };
      const locationById = new Map((locationRows ?? []).map((loc) => [loc.id, loc]));
      const remoteOrders: Order[] = rows.map((row) => {
        const location = locationById.get(row.location_id);
        return {
          id: row.id, orderNumber: row.order_number, ticketNumber: row.ticket_number ?? undefined,
          locationId: row.location_id, locationCode: location?.code ?? '',
          locationName: location?.name ?? 'Ubicación', locationType: location?.type ?? 'carpa',
          customerName: row.customer_name ?? undefined, customerPhone: row.customer_phone ?? undefined,
          items: byOrder.get(row.id) ?? [], subtotal: Number(row.subtotal), discount: Number(row.discount),
          discountReason: row.discount_reason ?? undefined, serviceFee: Number(row.service_fee),
          total: Number(row.total), status: row.status, paymentStatus: row.payment_status,
          paymentMethod: row.payment_method ?? undefined, cancellationReason: row.cancellation_reason ?? undefined,
          notes: row.notes ?? undefined, createdAt: row.created_at, confirmedAt: row.confirmed_at ?? undefined,
          preparingAt: row.preparing_at ?? undefined, readyAt: row.ready_at ?? undefined,
          deliveredAt: row.delivered_at ?? undefined, paidAt: row.paid_at ?? undefined,
          whatsappContactedAt: row.whatsapp_contacted_at ?? undefined, orderSource: 'qr',
          currentVersion: row.current_version, customerApprovedVersion: row.customer_approved_version ?? undefined,
          customerApprovalStatus: row.customer_approval_status, editAuditLog: row.edit_audit_log ?? [],
        };
      });
      if (alive) setOrders((current) => [...remoteOrders, ...current.filter((order) => order.orderSource !== 'qr')]);
    };
    void loadQrOrders();
    const { data: authListener } = client.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') void loadQrOrders();
    });
    const channel = client.channel(`qr-orders-${supabaseBusinessSlug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void loadQrOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guest_assistance_requests' }, () => void loadQrOrders())
      .subscribe();
    return () => { alive = false; authListener.subscription.unsubscribe(); void client.removeChannel(channel); };
  }, []);

  const callQrOrderRpc = async (name: string, order: Order): Promise<boolean> => {
    if (!supabase || !supabaseBusinessSlug) {
      // En modo demostración / local (sin Supabase conectado), permitimos continuar en memoria
      return true;
    }
    const { error } = await supabase.rpc(name, {
      p_business_slug: supabaseBusinessSlug,
      p_order_id: order.id,
      p_version: order.currentVersion ?? 1,
    });
    if (error) { window.alert(error.message); return false; }
    return true;
  };

  const resolveGuestAssistanceRequest = async (requestId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase.rpc('resolve_guest_assistance_request', { p_request_id: requestId });
    if (error) {
      window.alert(error.message);
      return false;
    }
    setGuestAssistanceRequests((current) => current.filter((request) => request.id !== requestId));
    return true;
  };

  const openPosForOrder = (order: Order) => {
    setActivePosOrder(order);
    setSelectedLocationCode(order.locationCode);
    setActiveView('pos');
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_config`, JSON.stringify(config));
      localStorage.setItem(`${STORAGE_KEY}_locations`, JSON.stringify(locations));
      localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
      localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
      localStorage.setItem(`${STORAGE_KEY}_promotions`, JSON.stringify(promotions));
      localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
      localStorage.setItem(`${STORAGE_KEY}_reservations`, JSON.stringify(reservations));
      localStorage.setItem(`${STORAGE_KEY}_cash_movements`, JSON.stringify(cashMovements));
      localStorage.setItem(`${STORAGE_KEY}_cash_register`, JSON.stringify(cashRegister));
      localStorage.setItem(`${STORAGE_KEY}_cart`, JSON.stringify(cart));
    } catch {
      // Ignore quota storage exceptions
    }
  }, [
    config,
    locations,
    products,
    categories,
    promotions,
    orders,
    reservations,
    cashMovements,
    cashRegister,
    cart,
  ]);

  const updateConfig = (patch: Partial<BalnearioConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      if (patch.branchName) {
        setBusinessDisplayName(patch.branchName);
      }
      return next;
    });
  };

  const switchPlan = (plan: CommercialPlan) => {
    setConfig((prev) => ({ ...prev, activePlan: plan }));
  };

  const updateLocationStatus = (
    locationId: string,
    status: LocationStatus,
    guestName?: string
  ) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id === locationId) {
          return {
            ...loc,
            status,
            currentGuestName:
              status === 'disponible' || status === 'limpieza'
                ? undefined
                : guestName !== undefined
                ? guestName
                : loc.currentGuestName,
          };
        }
        return loc;
      })
    );
  };

  const addLocation = (newLoc: Omit<LocationItem, 'id'>) => {
    const id = `loc-${Date.now()}`;
    setLocations((prev) => [...prev, { ...newLoc, id }]);
  };

  const editLocation = (locationId: string, patch: Partial<LocationItem>) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === locationId ? { ...l, ...patch } : l))
    );
  };

  const addProduct = (newProd: Omit<Product, 'id' | 'salesCount'>) => {
    const id = `prod-${Date.now()}`;
    setProducts((prev) => [...prev, { ...newProd, id, salesCount: 0 }]);
  };

  const editProduct = (productId: string, patch: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...patch } : p))
    );
  };

  const toggleProductAvailable = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
    );
  };

  const toggleProductActive = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const addCategory = (cat: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}`;
    setCategories((prev) => [...prev, { ...cat, id }]);
  };

  const addPromotion = (newPromo: Omit<Promotion, 'id'>) => {
    const id = `promo-${Date.now()}`;
    setPromotions((prev) => [...prev, { ...newPromo, id }]);
  };

  const editPromotion = (promoId: string, patch: Partial<Promotion>) => {
    setPromotions((prev) =>
      prev.map((pr) => (pr.id === promoId ? { ...pr, ...patch } : pr))
    );
  };

  const togglePromotion = (promoId: string) => {
    setPromotions((prev) =>
      prev.map((pr) => (pr.id === promoId ? { ...pr, isActive: !pr.isActive } : pr))
    );
  };

  // Cart operations
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      // Look for identical item (same product, same variant, same removed ingredients, same addons)
      const existingIdx = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.variant?.id === item.variant?.id &&
          JSON.stringify(i.removedIngredients.sort()) ===
            JSON.stringify(item.removedIngredients.sort()) &&
          JSON.stringify(i.selectedAddons.map((a) => a.id).sort()) ===
            JSON.stringify(item.selectedAddons.map((a) => a.id).sort()) &&
          (i.notes || '') === (item.notes || '')
      );

      if (existingIdx >= 0) {
        const next = [...prev];
        const existing = next[existingIdx];
        const updatedQty = existing.quantity + item.quantity;
        next[existingIdx] = {
          ...existing,
          quantity: updatedQty,
          subtotal: existing.unitPrice * updatedQty,
        };
        return next;
      }
      return [...prev, item];
    });
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === cartItemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...i,
              quantity: newQty,
              subtotal: i.unitPrice * newQty,
            };
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => setCart([]);

  // Orders flow: Step 1 -> Step 2 -> Step 3
  const createCustomerOrder = (
    locationCode: string,
    customerName?: string,
    customerPhone?: string,
    paymentMethod?: PaymentMethod,
    notes?: string
  ): Order | null => {
    if (cart.length === 0) return null;

    const loc = locations.find(
      (l) => l.code.toUpperCase() === locationCode.trim().toUpperCase()
    );
    const resolvedType: LocationType = loc ? loc.type : 'carpa';
    const resolvedName = loc ? loc.name : `Ubicación ${locationCode}`;
    const resolvedId = loc ? loc.id : `loc-temp-${locationCode}`;

    const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
    const total = subtotal; // No automatic discounts or fees in customer initial submit
    const nextOrderNum = `#${1050 + orders.length + 1}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNum,
      locationId: resolvedId,
      locationCode: locationCode.toUpperCase(),
      locationName: resolvedName,
      locationType: resolvedType,
      customerName: (customerName || 'Cliente').trim(),
      customerPhone: customerPhone ? customerPhone.trim() : undefined,
      paymentMethod: paymentMethod || 'efectivo',
      items: [...cart],
      subtotal,
      discount: 0,
      serviceFee: 0,
      total,
      status: 'pendiente_confirmacion', // PASO 3
      paymentStatus: 'pendiente',
      orderSource: 'qr',
      currentVersion: 1,
      customerApprovalStatus: 'pending',
      notes,
      createdAt: new Date().toISOString(),
      editAuditLog: [
        {
          timestamp: new Date().toISOString(),
          employee: 'Cliente (Carta QR)',
          description: 'Pedido creado desde la carta digital móvil.',
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If location was available, mark occupied
    if (loc && loc.status === 'disponible') {
      updateLocationStatus(loc.id, 'ocupada', newOrder.customerName);
    }

    clearCart();
    return newOrder;
  };

  // Permite al personal editar un pedido antes de confirmar o mientras se procesa
  const editOrder = (
    orderId: string,
    updatedItems: CartItem[],
    updatedNotes?: string,
    employeeName = 'Personal Balneario',
    changeDescription?: string
  ): boolean => {
    let success = false;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          success = true;
          const subtotal = updatedItems.reduce((acc, it) => acc + it.subtotal, 0);
          const total = Math.max(0, subtotal - ord.discount + ord.serviceFee);
          const now = new Date().toISOString();
          const newAuditEntry = {
            timestamp: now,
            employee: employeeName,
            description: changeDescription || `Modificación de comanda (${updatedItems.length} ítems, Total: $${total}).`,
          };
          return {
            ...ord,
            items: updatedItems,
            subtotal,
            total,
            notes: updatedNotes !== undefined ? updatedNotes : ord.notes,
            editAuditLog: [...(ord.editAuditLog || []), newAuditEntry],
          };
        }
        return ord;
      })
    );
    return success;
  };

  // Registra que el empleado abrió WhatsApp para contactar al cliente
  const recordWhatsAppContact = (orderId: string, alreadyPersistedRemotely = false) => {
    const target = orders.find((order) => order.id === orderId);
    if (!alreadyPersistedRemotely && target?.orderSource === 'qr' && supabase && supabaseBusinessSlug) {
      void supabase.rpc('record_qr_order_whatsapp_contact', {
        p_business_slug: supabaseBusinessSlug, p_order_id: target.id,
        p_version: target.currentVersion ?? 1,
      }).then(({ error }) => { if (error) window.alert(error.message); });
    }
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const now = new Date().toISOString();
          const newAuditEntry = {
            timestamp: now,
            employee: 'Personal Balneario',
            description: 'Se abrió contacto por WhatsApp con mensaje preparado de confirmación.',
          };
          return {
            ...ord,
            whatsappContactedAt: now,
            editAuditLog: [...(ord.editAuditLog || []), newAuditEntry],
          };
        }
        return ord;
      })
    );
  };

  const recordQrCustomerApproval = async (order: Order): Promise<boolean> => {
    const success = await callQrOrderRpc('record_qr_customer_approval', order);
    if (success) setOrders((prev) => prev.map((item) => item.id === order.id
      ? { ...item, customerApprovedVersion: order.currentVersion ?? 1, customerApprovalStatus: 'approved' }
      : item));
    return success;
  };

  const recordQrCustomerEditRequest = async (order: Order): Promise<boolean> => {
    const now = new Date().toISOString();
    const newAuditEntry = {
      timestamp: now,
      employee: 'Cliente por WhatsApp',
      description: 'El cliente pidió editar el pedido desde el botón de WhatsApp (✏️ EDITAR).',
    };
    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? {
              ...item,
              customerApprovalStatus: 'edit_requested',
              editAuditLog: [...(item.editAuditLog || []), newAuditEntry],
            }
          : item
      )
    );
    return true;
  };

  const editQrOrderVersion = async (order: Order, items: CartItem[], notes: string | undefined, employee: string, reason: string): Promise<boolean> => {
    if (!supabase || !supabaseBusinessSlug) return false;
    const { error } = await supabase.rpc('edit_qr_order_version', {
      p_business_slug: supabaseBusinessSlug,
      p_order_id: order.id,
      p_items: items.map((item) => ({
        product_id: item.productId, quantity: item.quantity,
        variant_id: item.variant?.id ?? null,
        addon_ids: item.selectedAddons.map((addon) => addon.id),
        removed_ingredients: item.removedIngredients, notes: item.notes ?? null,
      })),
      p_notes: notes ?? null, p_employee_name: employee, p_change_reason: reason,
    });
    if (error) { window.alert(error.message); return false; }
    setOrders((prev) => prev.map((item) => item.id === order.id ? {
      ...item, items, notes, currentVersion: (order.currentVersion ?? 1) + 1,
      customerApprovedVersion: undefined, customerApprovalStatus: 'pending', whatsappContactedAt: undefined,
      subtotal: items.reduce((sum, entry) => sum + entry.subtotal, 0),
      total: items.reduce((sum, entry) => sum + entry.subtotal, 0) - item.discount + item.serviceFee,
    } : item));
    return true;
  };

  const sendQrOrderToKitchen = async (order: Order): Promise<boolean> => {
    const success = await callQrOrderRpc('send_qr_order_to_kitchen', order);
    if (success) setOrders((prev) => prev.map((item) => item.id === order.id
      ? { ...item, status: 'confirmado_en_cocina', confirmedAt: new Date().toISOString() }
      : item));
    return success;
  };

  // PASO 6: Empleado confirma comanda comercial y la envía a cocina KDS
  const confirmAndSendToKitchen = (orderId: string): boolean => {
    let success = false;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          if (canTransitionOrderStatus(ord.status, 'confirmado_en_cocina')) {
            success = true;
            return {
              ...ord,
              status: 'confirmado_en_cocina',
              confirmedAt: new Date().toISOString(),
            };
          }
        }
        return ord;
      })
    );
    return success;
  };

  // PASO 8 / 9: Estados de cocina y entrega
  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus): boolean => {
    const target = orders.find((order) => order.id === orderId);
    if (target?.orderSource === 'qr' && supabase && supabaseBusinessSlug) {
      void supabase.rpc('update_qr_order_status', {
        p_business_slug: supabaseBusinessSlug, p_order_id: target.id, p_next_status: nextStatus,
      }).then(({ error }) => {
        if (error) { window.alert(error.message); return; }
        setOrders((prev) => prev.map((order) => order.id === orderId ? { ...order, status: nextStatus } : order));
      });
      return true;
    }
    let success = false;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          if (canTransitionOrderStatus(ord.status, nextStatus)) {
            success = true;
            const now = new Date().toISOString();
            const updates: Partial<Order> = { status: nextStatus };
            if (nextStatus === 'en_preparacion' && !ord.preparingAt) {
              updates.preparingAt = now;
            }
            if (nextStatus === 'listo_para_entrega' && !ord.readyAt) {
              updates.readyAt = now;
            }
            if (nextStatus === 'entregado' && !ord.deliveredAt) {
              updates.deliveredAt = now;
            }
            return { ...ord, ...updates };
          }
        }
        return ord;
      })
    );
    return success;
  };

  const cancelOrder = (orderId: string, reason: string): boolean => {
    let success = false;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId && ord.status !== 'entregado') {
          success = true;
          return {
            ...ord,
            status: 'cancelado',
            cancellationReason: reason,
          };
        }
        return ord;
      })
    );
    return success;
  };

  // PASO 10: POS registra pago y cierra la venta
  const closeAndPayOrder = async (
    orderId: string,
    paymentMethod: PaymentMethod,
    discountAmount = 0,
    cashierName = 'Cajero Turno'
  ): Promise<boolean> => {
    const targetOrder = orders.find((order) => order.id === orderId);
    let remotePayment: { ticketNumber?: string; paidAt?: string } | null = null;
    if (targetOrder?.orderSource === 'qr') {
      if (!supabase || !supabaseBusinessSlug) {
        window.alert('No se pudo conectar con el servidor. El pedido sigue pendiente de pago.');
        return false;
      }
      const { data, error } = await supabase.rpc('pay_qr_order', {
        p_business_slug: supabaseBusinessSlug,
        p_order_id: orderId,
        p_payment_method: paymentMethod,
      });
      if (error) {
        window.alert(`No se pudo registrar el pago: ${error.message}`);
        return false;
      }
      remotePayment = data as { ticketNumber?: string; paidAt?: string };
    }

    let success = false;
    let paidOrder: Order | null = null;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          success = true;
          const discountedTotal = Math.max(0, ord.total - discountAmount);
          const updated: Order = {
            ...ord,
            discount: ord.discount + discountAmount,
            total: discountedTotal,
            paymentStatus: 'cobrado',
            paymentMethod,
            paidAt: remotePayment?.paidAt || new Date().toISOString(),
            ticketNumber: remotePayment?.ticketNumber || ord.ticketNumber || `T-${Math.floor(1000 + Math.random() * 9000)}`,
          };
          paidOrder = updated;
          return updated;
        }
        return ord;
      })
    );

    if (success && paidOrder) {
      const order = paidOrder as Order;
      // Record cash movement if cash
      if (paymentMethod === 'efectivo') {
        const move: CashMovement = {
          id: `cm-${Date.now()}`,
          type: 'venta',
          amount: order.total,
          paymentMethod,
          concept: `Cobro Comanda ${order.orderNumber} - ${order.locationName}`,
          orderId: order.id,
          cashierName,
          createdAt: new Date().toISOString(),
        };
        setCashMovements((m) => [move, ...m]);
      }

      // Update product salesCount for dynamic ranking
      setProducts((prods) =>
        prods.map((p) => {
          const soldItem = order.items.find((it) => it.productId === p.id);
          if (soldItem) {
            return { ...p, salesCount: p.salesCount + soldItem.quantity };
          }
          return p;
        })
      );
      if (activePosOrder?.id === orderId) {
        setActivePosOrder(null);
      }
    }

    return success;
  };

  // POS Direct Sale (instant checkout at counter or table)
  const createDirectPosSale = (
    locationCode: string,
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerName = 'Venta Mostrador',
    discountAmount = 0,
    serviceFee = 0,
    sendToKitchen = false
  ): Order => {
    const loc = locations.find(
      (l) => l.code.toUpperCase() === locationCode.trim().toUpperCase()
    );
    const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
    const total = Math.max(0, subtotal - discountAmount + serviceFee);
    const orderNum = `#${1060 + orders.length + 1}`;
    const ticketNum = `T-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      ticketNumber: ticketNum,
      locationId: loc ? loc.id : `loc-pos-${locationCode}`,
      locationCode: locationCode.toUpperCase(),
      locationName: loc ? loc.name : `Venta Rápida ${locationCode}`,
      locationType: loc ? loc.type : 'mostrador',
      customerName,
      items,
      subtotal,
      discount: discountAmount,
      serviceFee,
      total,
      // If items need kitchen preparation, mark as confirmed_en_cocina; otherwise directly entregado
      status: sendToKitchen ? 'confirmado_en_cocina' : 'entregado',
      paymentStatus: sendToKitchen ? 'pendiente' : 'cobrado',
      paymentMethod: sendToKitchen ? undefined : paymentMethod,
      createdAt: now,
      confirmedAt: sendToKitchen ? now : undefined,
      paidAt: sendToKitchen ? undefined : now,
      deliveredAt: !sendToKitchen ? now : undefined,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Record cash movement if cash
    if (!sendToKitchen && paymentMethod === 'efectivo') {
      const move: CashMovement = {
        id: `cm-${Date.now()}`,
        type: 'venta',
        amount: total,
        paymentMethod,
        concept: `Venta POS Directa ${orderNum} - ${ticketNum}`,
        orderId: newOrder.id,
        cashierName: 'Cajero POS',
        createdAt: now,
      };
      setCashMovements((m) => [move, ...m]);
    }

    // Increment sales count
    setProducts((prods) =>
      prods.map((p) => {
        const soldItem = items.find((it) => it.productId === p.id);
        if (soldItem) {
          return { ...p, salesCount: p.salesCount + soldItem.quantity };
        }
        return p;
      })
    );

    return newOrder;
  };

  // Reservations
  const addReservation = (res: Omit<Reservation, 'id' | 'createdAt'>) => {
    const newRes: Reservation = {
      ...res,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setReservations((prev) => [newRes, ...prev]);

    // Update location status to 'reservada'
    const loc = locations.find((l) => l.id === res.locationId || l.code === res.locationCode);
    if (loc) {
      updateLocationStatus(loc.id, 'reservada', res.customerName);
    }
  };

  const updateReservationStatus = (resId: string, status: Reservation['status']) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, status } : r))
    );
  };

  // Cash Register operations
  const openCashRegister = (
    initialCash: number,
    cashierName: string,
    shiftName: string
  ) => {
    const now = new Date().toISOString();
    setCashRegister({
      isOpen: true,
      openedAt: now,
      initialCash,
      cashierName,
      shiftName,
    });

    const move: CashMovement = {
      id: `cm-${Date.now()}`,
      type: 'apertura',
      amount: initialCash,
      concept: `Apertura de turno: ${shiftName}`,
      cashierName,
      createdAt: now,
    };
    setCashMovements((prev) => [move, ...prev]);
  };

  const closeCashRegister = (countedCash: number, notes?: string) => {
    // Calculate expected cash: initial + cash sales + cash inflows - cash outflows
    const totalCashSales = cashMovements
      .filter((m) => m.type === 'venta' && m.paymentMethod === 'efectivo')
      .reduce((s, m) => s + m.amount, 0);

    const manualInflows = cashMovements
      .filter((m) => m.type === 'ingreso')
      .reduce((s, m) => s + m.amount, 0);

    const manualOutflows = cashMovements
      .filter((m) => m.type === 'egreso')
      .reduce((s, m) => s + m.amount, 0);

    const expectedCash =
      cashRegister.initialCash + totalCashSales + manualInflows - manualOutflows;
    const difference = countedCash - expectedCash;

    const move: CashMovement = {
      id: `cm-${Date.now()}`,
      type: 'cierre',
      amount: countedCash,
      concept: `Cierre de caja - Contado: $${countedCash.toLocaleString()} ARS (Esperado: $${expectedCash.toLocaleString()} ARS, Dif: ${difference >= 0 ? '+' : ''}${difference.toLocaleString()} ARS)${
        notes ? ` - ${notes}` : ''
      }`,
      cashierName: cashRegister.cashierName,
      createdAt: new Date().toISOString(),
    };

    setCashMovements((prev) => [move, ...prev]);
    setCashRegister((prev) => ({ ...prev, isOpen: false }));

    return { difference };
  };

  const addManualCashMovement = (
    type: 'ingreso' | 'egreso',
    amount: number,
    concept: string,
    cashierName: string
  ) => {
    const move: CashMovement = {
      id: `cm-${Date.now()}`,
      type,
      amount,
      concept,
      cashierName,
      createdAt: new Date().toISOString(),
    };
    setCashMovements((prev) => [move, ...prev]);
  };

  const resetAllDemoData = () => {
    localStorage.clear();
    setConfig(INITIAL_CONFIG);
    setLocations(INITIAL_LOCATIONS);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setPromotions(INITIAL_PROMOTIONS);
    setOrders(INITIAL_ORDERS);
    setReservations(INITIAL_RESERVATIONS);
    setCashMovements(INITIAL_CASH_MOVEMENTS);
    setCart([]);
  };

  return (
    <BalnearioContext.Provider
      value={{
        config,
        businessDisplayName,
        updateConfig,
        switchPlan,
        activeView,
        setActiveView,
        selectedLocationCode,
        setSelectedLocationCode,
        sectors,
        locations,
        updateLocationStatus,
        addLocation,
        editLocation,
        products,
        categories,
        addProduct,
        editProduct,
        toggleProductAvailable,
        toggleProductActive,
        addCategory,
        promotions,
        addPromotion,
        editPromotion,
        togglePromotion,
        cart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        productBeingCustomized,
        setProductBeingCustomized,
        orders,
        guestAssistanceRequests,
        resolveGuestAssistanceRequest,
        activePosOrder,
        setActivePosOrder,
        openPosForOrder,
        createCustomerOrder,
        editOrder,
        recordWhatsAppContact,
        recordQrCustomerApproval,
        recordQrCustomerEditRequest,
        sendQrOrderToKitchen,
        editQrOrderVersion,
        confirmAndSendToKitchen,
        updateOrderStatus,
        cancelOrder,
        closeAndPayOrder,
        createDirectPosSale,
        reservations,
        addReservation,
        updateReservationStatus,
        cashRegister,
        cashMovements,
        openCashRegister,
        closeCashRegister,
        addManualCashMovement,
        resetAllDemoData,
      }}
    >
      {children}
    </BalnearioContext.Provider>
  );
};

export const useBalneario = (): BalnearioContextType => {
  const ctx = useContext(BalnearioContext);
  if (!ctx) {
    throw new Error('useBalneario must be used within a BalnearioProvider');
  }
  return ctx;
};
