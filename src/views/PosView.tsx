import React, { useState, useMemo } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { CartItem, PaymentMethod, Product } from '../types';
import { formatCurrencyARS, calculateOrderTotals } from '../utils/balnearioLogic';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  DollarSign,
  Utensils,
  Umbrella,
  Percent,
  Receipt,
  CheckCircle2,
  X,
  ChevronDown,
  Sparkles,
  Barcode,
  Split,
  RefreshCw,
  Send,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const {
    products,
    categories,
    locations,
    orders,
    selectedLocationCode,
    setSelectedLocationCode,
    createDirectPosSale,
    closeAndPayOrder,
    confirmAndSendToKitchen,
    config,
  } = useBalneario();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [posItems, setPosItems] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPendingComandasModal, setShowPendingComandasModal] = useState(false);

  // Cash payment calculator
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<any | null>(null);

  // Selected location details
  const activeLocation = locations.find((l) => l.code === selectedLocationCode) || locations[0];

  // Check if there is an active pending order for this location
  const existingOrderForLocation = orders.find(
    (o) =>
      o.locationCode === selectedLocationCode &&
      o.paymentStatus === 'pendiente' &&
      o.status !== 'cancelado'
  );

  // Calculate totals
  const totals = useMemo(() => {
    return calculateOrderTotals(
      posItems,
      { type: 'percent', value: discountPercent },
      config.serviceFeeCover,
      activeLocation?.capacity || 2
    );
  }, [posItems, discountPercent, config.serviceFeeCover, activeLocation]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive || !p.isAvailable) return false;
      if (selectedCategory !== 'todos' && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add product to POS cart
  const handleAddProduct = (prod: Product) => {
    setPosItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id && i.removedIngredients.length === 0 && i.selectedAddons.length === 0);
      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx];
        const newQty = existing.quantity + 1;
        next[idx] = {
          ...existing,
          quantity: newQty,
          subtotal: existing.unitPrice * newQty,
        };
        return next;
      }
      const newItem: CartItem = {
        id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        productImage: prod.image,
        basePrice: prod.price,
        unitPrice: prod.price,
        quantity: 1,
        removedIngredients: [],
        selectedAddons: [],
        subtotal: prod.price,
      };
      return [...prev, newItem];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setPosItems((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return { ...i, quantity: newQty, subtotal: i.unitPrice * newQty };
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const removeItem = (itemId: string) => {
    setPosItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Load comanda from table/carpa
  const handleLoadComanda = (ord: any) => {
    setSelectedLocationCode(ord.locationCode);
    setPosItems([...ord.items]);
    setShowPendingComandasModal(false);
  };

  // Open Checkout Modal
  const handleOpenPayment = () => {
    if (posItems.length === 0) return;
    setCashReceived(totals.total);
    setShowPaymentModal(true);
  };

  // Confirm Sale & Close
  const handleConfirmPayment = () => {
    // If closing existing order
    if (existingOrderForLocation) {
      closeAndPayOrder(
        existingOrderForLocation.id,
        selectedPaymentMethod,
        totals.discountAmount,
        'Lucas G. (Mozo #4)'
      );
      setPaymentSuccessOrder(existingOrderForLocation);
    } else {
      // Direct POS sale
      const newOrder = createDirectPosSale(
        selectedLocationCode,
        posItems,
        selectedPaymentMethod,
        activeLocation?.currentGuestName || 'Venta Rápida Salón/Playa',
        totals.discountAmount,
        totals.serviceFee,
        false
      );
      setPaymentSuccessOrder(newOrder);
    }

    setPosItems([]);
    setShowPaymentModal(false);
  };

  // Send POS items to kitchen
  const handleSendToKitchen = () => {
    if (posItems.length === 0) return;
    createDirectPosSale(
      selectedLocationCode,
      posItems,
      selectedPaymentMethod,
      activeLocation?.currentGuestName || 'Pedido Mostrador',
      totals.discountAmount,
      totals.serviceFee,
      true // sendToKitchen: true
    );
    setPosItems([]);
    alert(`Comanda enviada exitosamente a la KDS de Cocina para ${selectedLocationCode}`);
  };

  const cashChange = Math.max(0, cashReceived - totals.total);

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col">
      {/* Top POS Control Bar matching ref-pos-view.png */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Location chip selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-left hover:bg-emerald-100/80 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              {activeLocation?.type === 'carpa' ? <Umbrella className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-xs text-gray-900 leading-tight">
                <span>{activeLocation?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-[10px] text-emerald-800 font-semibold">
                {activeLocation?.currentGuestName || 'Sin asignar'} • {activeLocation?.capacity} pax
              </div>
            </div>
          </button>

          {/* Existing open comanda alert badge */}
          {existingOrderForLocation && (
            <button
              onClick={() => handleLoadComanda(existingOrderForLocation)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-200 transition"
              title="Cargar orden existente abierta en esta ubicación"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>Cargar {existingOrderForLocation.orderNumber} ({formatCurrencyARS(existingOrderForLocation.total)})</span>
            </button>
          )}
        </div>

        {/* Turno & Cashier info */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Turno Mediodía / Playa</span>
          </div>
          <span>•</span>
          <span>{config.branchName}</span>
          <span>•</span>
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
              LG
            </span>
            <span>Lucas G. (Mozo #4)</span>
          </div>
        </div>

        {/* Quick action buttons row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPendingComandasModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buscar Comanda</span>
          </button>

          <button
            onClick={() => setShowDiscountModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50"
          >
            <Percent className="w-3.5 h-3.5 text-amber-500" />
            <span>{discountPercent > 0 ? `Desc: ${discountPercent}%` : 'Descuento'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-gray-900 text-white font-bold text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>DIAMANTE</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Products & Right Order Cart */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Search, Categories & Products Grid */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Search bar with PLU & barcode icon */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por plato, bebida o código PLU (ej: BUR-01, rabas, ipa)..."
              className="w-full bg-white pl-10 pr-20 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium text-gray-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
            />
            <div className="absolute right-3 flex items-center gap-1.5 text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              <Barcode className="w-3 h-3 text-gray-500" />
              <span>PLU ↵</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCategory === 'todos'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Todo ({products.filter((p) => p.isActive).length})</span>
            </button>

            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Products Grid matching ref-pos-view.png */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition group"
              >
                <div className="relative h-28 sm:h-32 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {p.tag && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-black uppercase">
                      {p.tag}
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-gray-900 line-clamp-1">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="font-black text-xs sm:text-sm text-emerald-800">
                      {formatCurrencyARS(p.price)}
                    </span>
                    <button
                      onClick={() => handleAddProduct(p)}
                      className="w-8 h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs active:scale-95 transition"
                      title="Agregar al pedido"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Order Cart & Billing Panel matching ref-pos-view.png */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col justify-between p-4 sm:p-5 shadow-lg">
          {/* Top Panel: Location Code, Ticket, Comensales */}
          <div className="space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-gray-900">{activeLocation?.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                    ACTIVA
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">
                  {activeLocation?.capacity} comensales • Ticket #{Math.floor(1000 + Math.random() * 9000)}
                </div>
              </div>

              {posItems.length > 0 && (
                <button
                  onClick={() => setPosItems([])}
                  className="p-1.5 text-gray-400 hover:text-rose-600 transition"
                  title="Vaciar comanda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* List of items */}
            <div className="max-h-[36vh] overflow-y-auto space-y-2.5 pr-1">
              {posItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-xs text-emerald-700">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-xs text-gray-900 leading-tight">
                        {item.productName}
                      </span>
                    </div>
                    <span className="font-black text-xs text-gray-900">
                      {formatCurrencyARS(item.subtotal)}
                    </span>
                  </div>

                  {/* Quantity Stepper & Modifications */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-400">
                      {formatCurrencyARS(item.unitPrice)} c/u
                    </span>

                    <div className="flex items-center border border-gray-200 rounded-lg bg-white p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {posItems.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No hay productos en la orden actual. Hacé clic en los platos a la izquierda para sumarlos.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Totals & Payment Actions */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            {/* Subtotals & Fees */}
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({posItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold text-gray-900">{formatCurrencyARS(totals.subtotal)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Descuento ({discountPercent}%)</span>
                  <span>-{formatCurrencyARS(totals.discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Total Highlight */}
            <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                  TOTAL A COBRAR
                </span>
                <span className="text-[10px] text-gray-400">IVA Incluido • Factura B</span>
              </div>
              <span className="text-2xl font-black text-emerald-800">
                {formatCurrencyARS(totals.total)}
              </span>
            </div>

            {/* Payment Method Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('efectivo')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition ${
                  selectedPaymentMethod === 'efectivo'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('mercadopago_qr')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition ${
                  selectedPaymentMethod === 'mercadopago_qr'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>MP QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('tarjeta_credito')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition ${
                  selectedPaymentMethod === 'tarjeta_credito'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Tarjeta</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleSendToKitchen}
                disabled={posItems.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white font-extrabold text-xs transition"
              >
                <Send className="w-4 h-4" />
                <span>MANDAR A COCINA / COMANDA</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleOpenPayment}
                  disabled={posItems.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs shadow-md transition"
                >
                  <Receipt className="w-4 h-4" />
                  <span>COBRAR ORDEN</span>
                </button>

                <button
                  onClick={() => {
                    if (posItems.length > 0) {
                      alert(`Pre-cuenta impresa para ${selectedLocationCode}: Total ${formatCurrencyARS(totals.total)}`);
                    }
                  }}
                  disabled={posItems.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <Receipt className="w-4 h-4 text-gray-500" />
                  <span>PRE-CUENTA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Selector Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-black text-base text-gray-900">Seleccionar Ubicación POS</h3>
              <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {locations.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setSelectedLocationCode(l.code);
                    setShowLocationModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition ${
                    selectedLocationCode === l.code
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-gray-100 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100">
                      {l.code}
                    </span>
                    <div>
                      <div className="text-xs font-bold">{l.name}</div>
                      <div className="text-[10px] text-gray-500">{l.sectorName}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      l.status === 'ocupada'
                        ? 'bg-amber-100 text-amber-800'
                        : l.status === 'disponible'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {l.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <h3 className="font-black text-base text-gray-900">Aplicar Descuento / Promo</h3>
            <p className="text-xs text-gray-500">Seleccioná el porcentaje autorizado para esta mesa:</p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 5, 10, 15, 20, 30].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    setDiscountPercent(pct);
                    setShowDiscountModal(false);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    discountPercent === pct
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pct === 0 ? 'Sin desc.' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation & Cash Drawer Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-base text-gray-900">Confirmar Cobro de Venta</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80">
              <div className="text-xs text-emerald-800 font-bold uppercase">Total a Cobrar</div>
              <div className="text-2xl font-black text-emerald-950 mt-0.5">
                {formatCurrencyARS(totals.total)}
              </div>
            </div>

            {selectedPaymentMethod === 'efectivo' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 block">
                  Monto Recibido en Efectivo:
                </label>
                <input
                  type="number"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-gray-200 text-lg font-black text-gray-900 text-center focus:border-emerald-600 focus:outline-hidden"
                />

                {/* Quick bills buttons */}
                <div className="flex gap-2 justify-center">
                  {[10000, 20000, 50000].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setCashReceived(bill)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      +{formatCurrencyARS(bill)}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-600">Vuelto a entregar:</span>
                  <span className="font-black text-base text-gray-900">
                    {formatCurrencyARS(cashChange)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-lg transition"
            >
              ✓ Confirmar Pago y Cerrar Venta
            </button>
          </div>
        </div>
      )}

      {/* Payment Success Receipt Toast/Modal */}
      {paymentSuccessOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-900">¡Venta Registrada!</h3>
              <p className="text-xs text-gray-500 mt-1">
                Comprobante interno {paymentSuccessOrder.ticketNumber || paymentSuccessOrder.orderNumber}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Ubicación:</span>
                <span className="font-bold">{paymentSuccessOrder.locationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Medio de Pago:</span>
                <span className="font-bold uppercase">{paymentSuccessOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Cobrado:</span>
                <span className="font-black text-emerald-800">
                  {formatCurrencyARS(paymentSuccessOrder.total)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setPaymentSuccessOrder(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs"
            >
              Aceptar y Nueva Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
