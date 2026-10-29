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
  Receipt,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  CreditCard,
  Wallet,
  AlertCircle,
  Sparkles,
  MapPin,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    orders,
    locations,
    products,
    cashRegister,
    cashMovements,
    config,
    setActiveView,
    confirmAndSendToKitchen,
    cancelOrder,
  } = useBalneario();

  // Metrics calculations
  const totalSalesToday = orders
    .filter((o) => o.paymentStatus === 'cobrado')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingApprovalOrders = orders.filter((o) => o.status === 'pendiente_confirmacion');
  const kitchenPreparingOrders = orders.filter(
    (o) => o.status === 'confirmado_en_cocina' || o.status === 'en_preparacion'
  );
  const readyOrders = orders.filter((o) => o.status === 'listo_para_entrega');

  // Beach occupancy
  const tents = locations.filter((l) => l.type === 'carpa');
  const occupiedTents = tents.filter((l) => l.status === 'ocupada' || l.status === 'reservada');
  const umbrellas = locations.filter((l) => l.type === 'sombrilla');
  const occupiedUmbrellas = umbrellas.filter(
    (l) => l.status === 'ocupada' || l.status === 'reservada'
  );
  const tables = locations.filter((l) => l.type === 'mesa_interior' || l.type === 'mesa_exterior');
  const occupiedTables = tables.filter((l) => l.status === 'ocupada' || l.status === 'reservada');

  const paidOrdersCount = orders.filter((o) => o.paymentStatus === 'cobrado').length;
  const averageTicket = paidOrdersCount > 0 ? Math.round(totalSalesToday / paidOrdersCount) : 0;

  // Dynamic Top 5
  const { products: top5Products, isDemonstrationOnly } = calculateTop5Products(products, orders);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#202428]">
      {/* Top Banner & Status bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD43B]/20 text-[#202428] flex items-center justify-center font-black text-xl">
            🏖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#202428] tracking-tight">
                {config.branchName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#55C7E8]/20 text-[#202428] border border-[#55C7E8]/40">
                TEMPORADA ACTIVA
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {config.address} • {config.schedule}
            </p>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('pos')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F47B35] text-white font-extrabold text-xs hover:bg-[#e06824] shadow-md shadow-[#F47B35]/20 transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cobro Rápido POS</span>
          </button>
          <button
            onClick={() => setActiveView('comandas')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-[#202428] font-bold text-xs hover:bg-gray-50 transition"
          >
            <Clock className="w-3.5 h-3.5 text-[#F47B35]" />
            <span>Ver Comandas ({pendingApprovalOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveView('cocina')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-[#202428] font-bold text-xs hover:bg-gray-50 transition"
          >
            <ChefHat className="w-3.5 h-3.5 text-[#55C7E8]" />
            <span>KDS Cocina</span>
          </button>
          <button
            onClick={() => setActiveView('caja')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-[#202428] font-bold text-xs hover:bg-gray-50 transition"
          >
            <Wallet className="w-3.5 h-3.5 text-[#202428]" />
            <span>Arqueo de Caja</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas del día */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>Ventas del Turno</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFD43B]/20 text-[#202428] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-[#202428] tracking-tight">
              {formatCurrencyARS(totalSalesToday)}
            </div>
            <div className="text-xs text-[#202428] font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#55C7E8]" />
              <span>{paidOrdersCount} pedidos cobrados</span>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400">
            Fondo inicial en caja: {formatCurrencyARS(cashRegister.initialCash)}
          </div>
        </div>

        {/* Ocupación de Playa */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>Ocupación de Playa</span>
            <div className="w-8 h-8 rounded-xl bg-[#55C7E8]/20 text-[#202428] flex items-center justify-center">
              <Umbrella className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-[#202428] tracking-tight">
              {occupiedTents.length + occupiedUmbrellas.length} / {tents.length + umbrellas.length}
            </div>
            <div className="text-xs text-gray-600 font-semibold mt-1">
              Carpas: <strong className="text-[#202428]">{occupiedTents.length}/{tents.length}</strong> • Sombrillas: <strong className="text-[#202428]">{occupiedUmbrellas.length}/{umbrellas.length}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400">
            {tents.length + umbrellas.length - (occupiedTents.length + occupiedUmbrellas.length)} sombras libres ahora
          </div>
        </div>

        {/* Mesas y Salón */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>Mesas Salón & Deck</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-[#202428] flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-[#202428] tracking-tight">
              {occupiedTables.length} / {tables.length}
            </div>
            <div className="text-xs text-gray-600 font-semibold mt-1">
              {Math.round((occupiedTables.length / Math.max(1, tables.length)) * 100)}% ocupación activa
            </div>
          </div>
          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400">
            {tables.length - occupiedTables.length} mesas disponibles para comensales
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>Ticket Promedio</span>
            <div className="w-8 h-8 rounded-xl bg-[#F47B35]/15 text-[#F47B35] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-[#202428] tracking-tight">
              {formatCurrencyARS(averageTicket)}
            </div>
            <div className="text-xs text-[#202428] font-bold mt-1">
              {readyOrders.length} listos para entrega inmediata
            </div>
          </div>
          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400">
            Calculado con órdenes completadas
          </div>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pedidos Digitales Recientes & Comandas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-base text-[#202428] tracking-tight">
                  Pedidos Digitales Recientes & Comandas
                </h3>
                <p className="text-xs text-gray-500">Gestión en vivo de órdenes por QR de playa y restaurante</p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#FFD43B]/20 text-[#202428] border border-[#FFD43B] text-xs font-bold">
                {pendingApprovalOrders.length} pendientes de confirmación
              </span>
            </div>

            {/* List of pending or in-preparation orders */}
            <div className="space-y-3">
              {orders.slice(0, 4).map((ord) => {
                const isPending = ord.status === 'pendiente_confirmacion';
                const isKitchen = ord.status === 'confirmado_en_cocina' || ord.status === 'en_preparacion';
                const isReady = ord.status === 'listo_para_entrega';

                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm px-2.5 py-1 rounded-xl bg-[#202428] text-white">
                          {ord.orderNumber}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#202428] flex items-center gap-1.5">
                            <span>{ord.locationName}</span>
                            <span className="text-[10px] font-mono text-gray-600 bg-white px-1.5 py-0.2 rounded border font-bold">
                              {ord.locationCode}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500">
                            {ord.customerName} • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-[#202428]">
                          {formatCurrencyARS(ord.total)}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                            isPending
                              ? 'bg-[#FFD43B]/20 text-[#202428] border border-[#FFD43B]'
                              : isKitchen
                              ? 'bg-[#55C7E8]/20 text-[#202428]'
                              : isReady
                              ? 'bg-[#FFD43B] text-[#202428]'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Items snippet */}
                    <div className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100 space-y-1">
                      {ord.items.map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px]">
                          <span>
                            <strong>{it.quantity}x</strong> {it.productName}
                          </span>
                          <span className="font-semibold text-[#202428]">
                            {formatCurrencyARS(it.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400">
                        {isPending
                          ? 'Esperando aprobación del personal de playa'
                          : `Estado de pago: ${ord.paymentStatus}`}
                      </span>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => cancelOrder(ord.id, 'Cancelado por el personal')}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-100 transition"
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => confirmAndSendToKitchen(ord.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#F47B35] hover:bg-[#e06824] text-white font-extrabold text-xs shadow-xs transition"
                            >
                              ✓ Enviar a Cocina
                            </button>
                          </>
                        )}

                        {ord.paymentStatus === 'pendiente' && !isPending && (
                          <button
                            onClick={() => setActiveView('pos')}
                            className="px-3 py-1.5 rounded-xl bg-[#55C7E8] text-[#202428] font-black text-xs hover:bg-[#43b5d6] transition"
                          >
                            Cobrar en POS
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
              className="w-full py-2 rounded-xl text-center text-xs font-bold text-[#202428] hover:bg-gray-50 transition flex items-center justify-center gap-1"
            >
              <span>Ver todas las comandas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Top 5 & Estado de Sectores */}
        <div className="space-y-4">
          {/* Top 5 Dynamic Products */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FFD43B]" />
                <h3 className="font-black text-sm text-[#202428]">
                  Top 5 Más Vendidos
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-gray-400">
                {isDemonstrationOnly ? 'Recomendados' : 'Ventas en vivo'}
              </span>
            </div>

            <div className="space-y-2">
              {top5Products.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#FFD43B] text-[#202428] font-black text-[11px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#202428] line-clamp-1">{p.name}</div>
                      <div className="text-[10px] text-gray-400">{formatCurrencyARS(p.price)}</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#F47B35]">
                    {p.dynamicUnitsSold || p.salesCount} vend.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Spots Matrix */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-black text-sm text-[#202428]">Estado Rápido de Ubicaciones</h3>
              <button
                onClick={() => setActiveView('sectores')}
                className="text-[11px] font-bold text-[#55C7E8] hover:underline"
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
                  <div
                    key={loc.id}
                    className={`p-2 rounded-xl text-center border text-[10px] font-bold transition ${
                      isOccupied
                        ? 'bg-[#F47B35] text-white border-[#F47B35]'
                        : isReserved
                        ? 'bg-[#FFD43B] text-[#202428] border-[#FFD43B]'
                        : isCleaning
                        ? 'bg-[#55C7E8] text-[#202428] border-[#55C7E8]'
                        : 'bg-gray-50 text-[#202428] border-gray-200'
                    }`}
                    title={`${loc.name}: ${loc.status}`}
                  >
                    <div>{loc.code}</div>
                    <div className="text-[8px] font-medium opacity-80 truncate">
                      {loc.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
