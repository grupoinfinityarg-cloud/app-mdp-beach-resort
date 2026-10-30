import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  BalnearioConfig,
  CartItem,
  CashMovement,
  CashRegisterState,
  Category,
  CommercialPlan,
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
  createCustomerOrder: (
    locationCode: string,
    customerName: string,
    customerPhone: string,
    notes?: string
  ) => Order | null;
  editOrder: (
    orderId: string,
    updatedItems: CartItem[],
    updatedNotes?: string,
    employeeName?: string,
    changeDescription?: string
  ) => boolean;
  recordWhatsAppContact: (orderId: string) => void;
  confirmAndSendToKitchen: (orderId: string) => boolean;
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus) => boolean;
  cancelOrder: (orderId: string, reason: string) => boolean;
  closeAndPayOrder: (
    orderId: string,
    paymentMethod: PaymentMethod,
    discountAmount?: number,
    cashierName?: string
  ) => boolean;
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

  // Active navigation
  const [activeView, setActiveView] = useState<ActiveView>('panel');
  const [selectedLocationCode, setSelectedLocationCode] = useState<string>('C-01');
  const [cart, setCart] = useState<CartItem[]>(() => loadStored('cart', []));
  const [productBeingCustomized, setProductBeingCustomized] = useState<Product | null>(null);

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
    setConfig((prev) => ({ ...prev, ...patch }));
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
    customerName: string,
    customerPhone: string,
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
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: [...cart],
      subtotal,
      discount: 0,
      serviceFee: 0,
      total,
      status: 'pendiente_confirmacion', // PASO 3
      paymentStatus: 'pendiente',
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
  const recordWhatsAppContact = (orderId: string) => {
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
  const closeAndPayOrder = (
    orderId: string,
    paymentMethod: PaymentMethod,
    discountAmount = 0,
    cashierName = 'Cajero Turno'
  ): boolean => {
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
            paidAt: new Date().toISOString(),
            ticketNumber: ord.ticketNumber || `T-${Math.floor(1000 + Math.random() * 9000)}`,
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
      paymentStatus: 'cobrado',
      paymentMethod,
      createdAt: now,
      confirmedAt: now,
      paidAt: now,
      deliveredAt: !sendToKitchen ? now : undefined,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Record cash movement if cash
    if (paymentMethod === 'efectivo') {
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
        createCustomerOrder,
        editOrder,
        recordWhatsAppContact,
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
