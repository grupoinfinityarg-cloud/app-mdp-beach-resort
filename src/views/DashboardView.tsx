import React from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { formatCurrencyARS, calculateTop5Products } from '../utils/balnearioLogic';
import {
  DollarSign,
  Clock,
  ChefHat,
  CheckCircle2,
  Umbrella,
  Utensils,
  TrendingUp,
  ArrowRight,
  CreditCard,
  Wallet,
  Sparkles,
  QrCode,
  AlertCircle,
  Eye,
  Check,
  ChevronRight,
  Sun,
  Waves,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    orders,
    locations,
    products,
    cashRegister,
    cashMovements,
    config,
    businessDisplayName,
    setActiveView,
    confirmAndSendToKitchen,
    cancelOrder,
  } = useBalneario();

  // 1. Sales & Revenue metrics
  const totalSalesToday = orders
    .filter((o) => o.paymentStatus === 'cobrado')
    .reduce((sum, o) => sum + o.total, 0);

  const cashSales = cashMovements
    .filter((m) => m.type === 'venta' && m.paymentMethod === 'efectivo')
    .reduce((s, m) => s + m.amount, 0);

  const mpSales = orders
    .filter((o) => o.paymentStatus === 'cobrado' && o.paymentMethod === 'mercadopago_qr')
    .reduce((s, o) => s + o.total, 0);

  const cardSales = orders
    .filter(
      (o) =>
        o.paymentStatus === 'cobrado' &&
        (o.paymentMethod === 'tarjeta_debito' || o.paymentMethod === 'tarjeta_credito')
    )
    .reduce((s, o) => s + o.total, 0);

  // Expected cash in drawer
  const manualInflows = cashMovements
    .filter((m) => m.type === 'ingreso')
    .reduce((s, m) => s + m.amount, 0);
  const manualOutflows = cashMovements
    .filter((m) => m.type === 'egreso')
    .reduce((s, m) => s + m.amount, 0);
  const expectedCashInDrawer =
    cashRegister.initialCash + cashSales + manualInflows - manualOutflows;

  // 2. Orders by operational state
  const pendingApprovalOrders = orders.filter((o) => o.status === 'pendiente_confirmacion');
  const kitchenPreparingOrders = orders.filter(
    (o) => o.status === 'confirmado_en_cocina' || o.status === 'en_preparacion'
  );
  const readyOrders = orders.filter((o) => o.status === 'listo_para_entrega');
  const totalAttentionNeeded = pendingApprovalOrders.length + kitchenPreparingOrders.length;

  // 3. Beach & Sector Occupancy
  const tents = locations.filter((l) => l.type === 'carpa');
  const occupiedTents = tents.filter((l) => l.status === 'ocupada' || l.status === 'reservada');
  const umbrellas = locations.filter((l) => l.type === 'sombrilla');
  const occupiedUmbrellas = umbrellas.filter(
    (l) => l.status === 'ocupada' || l.status === 'reservada'
  );
  const tables = locations.filter((l) => l.type === 'mesa_interior' || l.type === 'mesa_exterior');
  const occupiedTables = tables.filter((l) => l.status === 'ocupada' || l.status === 'reservada');

  const totalShadows = tents.length + umbrellas.length;
  const occupiedShadows = occupiedTents.length + occupiedUmbrellas.length;
  const occupancyPercentage =
    totalShadows > 0 ? Math.round((occupiedShadows / totalShadows) * 100) : 0;

  // 4. Dynamic Top 5
  const { products: top5Products, isDemonstrationOnly } = calculateTop5Products(products, orders);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#34313A]">
      {/* Top Welcome & Operational Status Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEEB9] text-[#34313A] flex items-center justify-center font-black text-2xl border border-[#e8d799] shrink-0">
            🏖️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-[#34313A] tracking-tight">
                {businessDisplayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]">
                TEMPORADA 2026
              </span>
              <span className="text-[11px] font-semibold text-[#F68F57] bg-[#F68F57]/15 px-2 py-0.5 rounded-md">
                Mar del Plata • 26°C Sol
              </span>
            </div>
            <p className="text-xs text-[#34313A]/70 font-medium mt-1">
              {config.address} • Horario de Carpas: {config.schedule}
            </p>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('pos')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#C1E7FF] text-[#34313A] font-black text-xs hover:bg-[#a9dbfa] border border-[#a9dbfa] shadow-xs transition"
          >
            <CreditCard className="w-4 h-4 text-[#34313A]" />
            <span>Cobro Rápido POS</span>
          </button>
          <button
            onClick={() => setActiveView('comandas')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E2E2] text-[#34313A] font-bold text-xs hover:bg-[#FBEEB9]/30 transition"
          >
            <Clock className="w-4 h-4 text-[#F68F57]" />
            <span>Comandas ({pendingApprovalOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveView('cocina')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E2E2] text-[#34313A] font-bold text-xs hover:bg-[#FBEEB9]/30 transition"
          >
            <ChefHat className="w-4 h-4 text-[#34313A]" />
            <span>KDS Cocina</span>
          </button>
          <button
            onClick={() => setActiveView('caja')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E2E2] text-[#34313A] font-bold text-xs hover:bg-[#FBEEB9]/30 transition"
          >
            <Wallet className="w-4 h-4 text-[#34313A]" />
            <span>Caja & Arqueo</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Indicator Cards (Requirement Section 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1 — Ventas del día */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E2E2] shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs text-[#34313A]/60 font-bold uppercase tracking-wider">
              <span>Ventas del Día</span>
              <div className="w-8 h-8 rounded-xl bg-[#FBEEB9] text-[#34313A] flex items-center justify-center border border-[#e8d799]">
                <DollarSign className="w-4 h-4 text-[#34313A]" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-[#34313A] tracking-tight">
                {formatCurrencyARS(totalSalesToday)}
              </div>

              {/* Evolución vs. día anterior */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  <TrendingUp className="w-3 h-3 text-emerald-700" />
                  +14.8%
                </span>
                <span className="text-[11px] text-[#34313A]/60 font-medium">
                  vs. jornada anterior
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#E2E2E2] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#34313A]/60 font-medium">
              Turno {cashRegister.shiftName.split('/')[0]}
            </span>
            <button
              onClick={() => setActiveView('caja')}
              className="text-xs font-bold text-[#34313A] hover:text-[#F68F57] flex items-center gap-0.5 group"
            >
              <span>Ver detalle</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Tarjeta 2 — Pedidos pendientes */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E2E2] shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs text-[#34313A]/60 font-bold uppercase tracking-wider">
              <span>Pedidos Pendientes</span>
              <div className="w-8 h-8 rounded-xl bg-[#F68F57]/15 text-[#F68F57] flex items-center justify-center border border-[#F68F57]/30">
                <Clock className="w-4 h-4 text-[#F68F57]" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#34313A] tracking-tight">
                  {totalAttentionNeeded}
                </span>
                {pendingApprovalOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F68F57] text-white">
                    {pendingApprovalOrders.length} NUEVOS
                  </span>
                )}
              </div>

              {/* Diferenciación clara de estados operativos */}
              <div className="text-[11px] text-[#34313A]/70 space-y-0.5 mt-2">
                <div className="flex justify-between">
                  <span>Por confirmar:</span>
                  <strong className="text-[#F68F57] font-black">{pendingApprovalOrders.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>En cocina:</span>
                  <strong className="text-[#34313A] font-black">{kitchenPreparingOrders.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Listos para entrega:</span>
                  <strong className="text-emerald-700 font-black">{readyOrders.length}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#E2E2E2] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#34313A]/60 font-medium">Comandas de playa</span>
            <button
              onClick={() => setActiveView('comandas')}
              className="text-xs font-bold text-[#34313A] hover:text-[#F68F57] flex items-center gap-0.5 group"
            >
              <span>Atender</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Tarjeta 3 — Ocupación de Playa / Sectores */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E2E2] shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs text-[#34313A]/60 font-bold uppercase tracking-wider">
              <span>Ocupación de Playa</span>
              <div className="w-8 h-8 rounded-xl bg-[#C1E7FF] text-[#34313A] flex items-center justify-center border border-[#a9dbfa]">
                <Umbrella className="w-4 h-4 text-[#34313A]" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#34313A] tracking-tight">
                  {occupancyPercentage}%
                </span>
                <span className="text-xs text-[#34313A]/60 font-bold">
                  ({occupiedShadows}/{totalShadows} sombras)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#E2E2E2] h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#C1E7FF] h-full rounded-full transition-all duration-300"
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>

              <div className="text-[11px] text-[#34313A]/70 flex justify-between mt-2">
                <span>Carpas: <strong>{occupiedTents.length}/{tents.length}</strong></span>
                <span>Sombrillas: <strong>{occupiedUmbrellas.length}/{umbrellas.length}</strong></span>
                <span>Mesas: <strong>{occupiedTables.length}/{tables.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#E2E2E2] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#34313A]/60 font-medium">
              {totalShadows - occupiedShadows} sombras libres
            </span>
            <button
              onClick={() => setActiveView('sectores')}
              className="text-xs font-bold text-[#34313A] hover:text-[#F68F57] flex items-center gap-0.5 group"
            >
              <span>Ver mapa</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Tarjeta 4 — Estado de Caja y Medios de Pago */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E2E2] shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs text-[#34313A]/60 font-bold uppercase tracking-wider">
              <span>Caja & Medios de Pago</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                <Wallet className="w-4 h-4 text-emerald-800" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#34313A] tracking-tight">
                  {formatCurrencyARS(expectedCashInDrawer)}
                </span>
              </div>

              {/* Status pill & payment methods breakdown */}
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-[#34313A]/60">Efectivo en cajón</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                    cashRegister.isOpen ? 'bg-[#C1E7FF] text-[#34313A]' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {cashRegister.isOpen ? 'CAJA ABIERTA' : 'CERRADA'}
                </span>
              </div>

              <div className="text-[11px] text-[#34313A]/70 space-y-0.5 mt-2">
                <div className="flex justify-between">
                  <span>Mercado Pago QR:</span>
                  <strong className="text-[#34313A] font-bold">{formatCurrencyARS(mpSales)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tarjetas Parador:</span>
                  <strong className="text-[#34313A] font-bold">{formatCurrencyARS(cardSales)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#E2E2E2] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#34313A]/60 font-medium">
              Resp: {cashRegister.cashierName}
            </span>
            <button
              onClick={() => setActiveView('caja')}
              className="text-xs font-bold text-[#34313A] hover:text-[#F68F57] flex items-center gap-0.5 group"
            >
              <span>Arqueo</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-column layout: Active Orders & Gastronomic Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pedidos Digitales Recientes & Comandas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E2E2E2] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E2E2] gap-2 flex-wrap">
              <div>
                <h3 className="font-black text-base text-[#34313A] tracking-tight">
                  Pedidos Digitales Recientes & Comandas en Vivo
                </h3>
                <p className="text-xs text-[#34313A]/70">
                  Despacho en tiempo real de órdenes realizadas por QR desde carpas, sombrillas y restaurante
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#FBEEB9] text-[#34313A] border border-[#e8d799] text-xs font-bold">
                {pendingApprovalOrders.length} por confirmar
              </span>
            </div>

            {/* List of pending or in-preparation orders */}
            <div className="space-y-3">
              {orders.slice(0, 4).map((ord) => {
                const isPending = ord.status === 'pendiente_confirmacion';
                const isKitchen =
                  ord.status === 'confirmado_en_cocina' || ord.status === 'en_preparacion';
                const isReady = ord.status === 'listo_para_entrega';

                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-white border border-[#E2E2E2] hover:border-[#a9dbfa] transition space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm px-2.5 py-1 rounded-xl bg-[#34313A] text-white">
                          {ord.orderNumber}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#34313A] flex items-center gap-1.5">
                            <span>{ord.locationName}</span>
                            <span className="text-[10px] font-mono text-[#34313A] bg-[#C1E7FF] px-1.5 py-0.2 rounded border border-[#a9dbfa] font-black">
                              {ord.locationCode}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#34313A]/60">
                            {ord.customerName} • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-[#34313A]">
                          {formatCurrencyARS(ord.total)}
                        </div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mt-0.5 ${
                            isPending
                              ? 'bg-[#F68F57] text-white'
                              : isKitchen
                              ? 'bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]'
                              : isReady
                              ? 'bg-[#FBEEB9] text-[#34313A] border border-[#e8d799]'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Items snippet */}
                    <div className="text-xs text-[#34313A]/80 bg-[#FBEEB9]/20 p-2.5 rounded-xl border border-[#E2E2E2] space-y-1">
                      {ord.items.map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px]">
                          <span>
                            <strong className="text-[#34313A]">{it.quantity}x</strong> {it.productName}
                          </span>
                          <span className="font-bold text-[#34313A]">
                            {formatCurrencyARS(it.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                      <span className="text-[10px] text-[#34313A]/60">
                        {isPending
                          ? 'Esperando aprobación de personal de carpas'
                          : `Medio de pago: ${ord.paymentMethod ? ord.paymentMethod.replace(/_/g, ' ').toUpperCase() : 'PENDIENTE'}`}
                      </span>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => cancelOrder(ord.id, 'Cancelado por el personal')}
                              className="px-3 py-1.5 rounded-xl border border-[#E2E2E2] text-[#34313A]/70 font-bold text-xs hover:bg-gray-100 transition"
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => confirmAndSendToKitchen(ord.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#C1E7FF] hover:bg-[#a9dbfa] text-[#34313A] font-black text-xs shadow-xs border border-[#a9dbfa] transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Enviar a Cocina</span>
                            </button>
                          </>
                        )}

                        {ord.paymentStatus === 'pendiente' && !isPending && (
                          <button
                            onClick={() => setActiveView('pos')}
                            className="px-3 py-1.5 rounded-xl bg-[#C1E7FF] text-[#34313A] font-black text-xs hover:bg-[#a9dbfa] border border-[#a9dbfa] transition flex items-center gap-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cobrar en POS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {orders.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400">
                  No hay órdenes registradas aún.
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveView('comandas')}
              className="w-full py-2.5 rounded-xl text-center text-xs font-black text-[#34313A] bg-[#FBEEB9]/30 hover:bg-[#FBEEB9] border border-[#E2E2E2] transition flex items-center justify-center gap-1.5"
            >
              <span>Ver todas las comandas y despacho</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#34313A]" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Top 5 & Estado Rápido de Ubicaciones */}
        <div className="space-y-4">
          {/* Top 5 Dynamic Products */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E2]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F68F57]" />
                <h3 className="font-black text-sm text-[#34313A]">
                  Top 5 Más Vendidos en Playa
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#F68F57]">
                {isDemonstrationOnly ? 'Recomendados' : 'Ventas en vivo'}
              </span>
            </div>

            <div className="space-y-2">
              {top5Products.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#FBEEB9]/20 transition border border-transparent hover:border-[#E2E2E2]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#C1E7FF] text-[#34313A] font-black text-[11px] flex items-center justify-center border border-[#a9dbfa] shrink-0">
                      {i + 1}
                    </span>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#34313A] truncate">{p.name}</div>
                      <div className="text-[10px] text-[#34313A]/60 font-semibold">{formatCurrencyARS(p.price)}</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#F68F57] shrink-0 ml-2">
                    {p.dynamicUnitsSold || p.salesCount} vend.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Spots Matrix */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E2]">
              <div>
                <h3 className="font-black text-sm text-[#34313A]">Estado Rápido de Sombra</h3>
                <span className="text-[10px] text-[#34313A]/60">Sectores VIP y Carpas Standard</span>
              </div>
              <button
                onClick={() => setActiveView('sectores')}
                className="text-[11px] font-black text-[#34313A] hover:text-[#F68F57] underline"
              >
                Ver Mapa
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {locations.slice(0, 16).map((loc) => {
                const isOccupied = loc.status === 'ocupada';
                const isReserved = loc.status === 'reservada';
                const isCleaning = loc.status === 'limpieza';
                return (
                  <button
                    key={loc.id}
                    onClick={() => setActiveView('carpas')}
                    className={`p-2 rounded-xl text-center border text-[10px] font-bold transition hover:scale-105 active:scale-95 ${
                      isOccupied
                        ? 'bg-[#F68F57] text-white border-[#F68F57]'
                        : isReserved
                        ? 'bg-[#FBEEB9] text-[#34313A] border border-[#e8d799]'
                        : isCleaning
                        ? 'bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]'
                        : 'bg-white text-[#34313A] border border-[#E2E2E2]'
                    }`}
                    title={`${loc.name}: ${loc.status}`}
                  >
                    <div className="font-black">{loc.code}</div>
                    <div className="text-[8px] font-medium opacity-80 truncate">
                      {loc.status}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-[#34313A]/70">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white border border-[#E2E2E2]" /> Libre
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F68F57]" /> Ocupada
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FBEEB9] border border-[#e8d799]" /> Reservada
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C1E7FF]" /> Limpieza
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
