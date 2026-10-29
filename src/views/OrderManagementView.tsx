import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { Order, OrderStatus } from '../types';
import { formatCurrencyARS } from '../utils/balnearioLogic';
import {
  ClipboardList,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  ChefHat,
  ArrowRight,
  CreditCard,
  AlertTriangle,
  Umbrella,
  Utensils,
  Layers,
} from 'lucide-react';

export const OrderManagementView: React.FC = () => {
  const {
    orders,
    confirmAndSendToKitchen,
    updateOrderStatus,
    cancelOrder,
    setActiveView,
    setSelectedLocationCode,
  } = useBalneario();

  const [activeTab, setActiveTab] = useState<
    'todos' | 'pendientes' | 'cocina' | 'listos' | 'entregados' | 'cobrados'
  >('pendientes');

  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'pendientes') return o.status === 'pendiente_confirmacion';
    if (activeTab === 'cocina')
      return o.status === 'confirmado_en_cocina' || o.status === 'en_preparacion';
    if (activeTab === 'listos') return o.status === 'listo_para_entrega';
    if (activeTab === 'entregados') return o.status === 'entregado';
    if (activeTab === 'cobrados') return o.paymentStatus === 'cobrado';
    return true;
  });

  const handleConfirmCancel = () => {
    if (!cancellationOrderId) return;
    cancelOrder(cancellationOrderId, cancellationReason || 'Cancelado por solicitud del cliente');
    setCancellationOrderId(null);
    setCancellationReason('');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente_confirmacion':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#F68F57]/15 text-[#34313A] border border-[#F68F57] text-xs font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#34313A] animate-spin" />
            <span>Paso 3: Espera Aprobación</span>
          </span>
        );
      case 'confirmado_en_cocina':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa] text-xs font-bold flex items-center gap-1">
            <ChefHat className="w-3.5 h-3.5 text-[#34313A]" />
            <span>Paso 6: En Cocina KDS</span>
          </span>
        );
      case 'en_preparacion':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#C1E7FF]/50 text-[#34313A] border border-[#a9dbfa] text-xs font-bold flex items-center gap-1">
            <ChefHat className="w-3.5 h-3.5 text-[#34313A]" />
            <span>Paso 8: Cocinando</span>
          </span>
        );
      case 'listo_para_entrega':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#FBEEB9] text-[#34313A] border border-[#e8d799] text-xs font-black flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34313A]" />
            <span>Paso 8: Listo p/ Entrega</span>
          </span>
        );
      case 'entregado':
        return (
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-600" />
            <span>Paso 9: Entregado</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold">
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#34313A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#34313A] tracking-tight">
              Flujo de Pedidos & Comandas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]">
              CIRCUITO DE 10 PASOS
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Control de comanda: el pedido del cliente requiere confirmación antes de enviarse a cocina.
          </p>
        </div>

        {/* 10-step explainer card trigger */}
        <div className="p-3 rounded-2xl bg-[#C1E7FF]/25 border border-[#C1E7FF]/60 text-xs text-[#34313A] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#34313A] shrink-0" />
          <span className="text-[11px] font-semibold">
            Separación estricta: <strong>Aprobación Comercial</strong> → <strong>Cocina KDS</strong> → <strong>Cobro POS</strong>.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'pendientes', label: 'Pendientes Aprobación', count: orders.filter((o) => o.status === 'pendiente_confirmacion').length },
          { id: 'cocina', label: 'En Cocina KDS', count: orders.filter((o) => o.status === 'confirmado_en_cocina' || o.status === 'en_preparacion').length },
          { id: 'listos', label: 'Listos para Despacho', count: orders.filter((o) => o.status === 'listo_para_entrega').length },
          { id: 'entregados', label: 'Entregados en Playa', count: orders.filter((o) => o.status === 'entregado').length },
          { id: 'cobrados', label: 'Cerrados y Cobrados', count: orders.filter((o) => o.paymentStatus === 'cobrado').length },
          { id: 'todos', label: 'Historial Completo', count: orders.length },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#C1E7FF] text-[#34313A] shadow-xs font-black border border-[#a9dbfa]'
                  : 'bg-white text-[#34313A] hover:bg-gray-50 border border-[#E2E2E2]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-[#34313A] text-white' : 'bg-gray-100 text-[#34313A]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((ord) => {
          const isPending = ord.status === 'pendiente_confirmacion';
          const isConfirmed = ord.status === 'confirmado_en_cocina';
          const isPreparing = ord.status === 'en_preparacion';
          const isReady = ord.status === 'listo_para_entrega';
          const isDelivered = ord.status === 'entregado';
          const isPaid = ord.paymentStatus === 'cobrado';

          const elapsedMin = Math.round(
            (Date.now() - new Date(ord.createdAt).getTime()) / (60 * 1000)
          );

          return (
            <div
              key={ord.id}
              className={`bg-white rounded-3xl p-5 border shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                isPending
                  ? 'border-[#F68F57] ring-2 ring-[#F68F57]/20'
                  : isReady
                  ? 'border-[#C1E7FF] ring-2 ring-[#C1E7FF]/30'
                  : 'border-[#E2E2E2]'
              }`}
            >
              <div className="space-y-4">
                {/* Top: Order #, Status, Location */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E2E2E2]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-[#34313A]">{ord.orderNumber}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        hace {elapsedMin}m
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-black text-[#34313A] mt-1">
                      {ord.locationType === 'carpa' ? (
                        <Umbrella className="w-3.5 h-3.5 text-[#FBEEB9]" />
                      ) : (
                        <Utensils className="w-3.5 h-3.5 text-[#C1E7FF]" />
                      )}
                      <span>{ord.locationName}</span>
                      <span className="text-[10px] font-mono bg-[#C1E7FF]/30 text-[#34313A] border border-[#a9dbfa] px-1.5 py-0.5 rounded font-bold">
                        {ord.locationCode}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 font-medium">
                      Cliente: <strong>{ord.customerName}</strong>
                    </div>
                  </div>

                  <div className="shrink-0">{getStatusBadge(ord.status)}</div>
                </div>

                {/* Items breakdown with modifications */}
                <div className="space-y-2 bg-gray-50/80 p-3 rounded-2xl border border-[#E2E2E2] text-xs">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="pb-1.5 border-b border-[#E2E2E2] last:border-0 space-y-1">
                      <div className="flex justify-between font-bold text-[#34313A]">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span>{formatCurrencyARS(item.subtotal)}</span>
                      </div>

                      {/* Modifications */}
                      {(item.removedIngredients.length > 0 ||
                        item.selectedAddons.length > 0 ||
                        item.notes) && (
                        <div className="flex flex-wrap gap-1 text-[10px] pt-0.5">
                          {item.removedIngredients.map((r) => (
                            <span
                              key={r}
                              className="px-1.5 py-0.2 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded line-through"
                            >
                              Sin {r}
                            </span>
                          ))}
                          {item.selectedAddons.map((a) => (
                            <span
                              key={a.id}
                              className="px-1.5 py-0.2 bg-[#C1E7FF]/30 text-[#34313A] border border-[#a9dbfa] font-bold rounded"
                            >
                              +{a.name}
                            </span>
                          ))}
                          {item.notes && (
                            <span className="text-gray-500 italic block w-full">
                              "{item.notes}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {ord.notes && (
                    <div className="text-[11px] text-[#34313A] bg-[#FBEEB9]/30 p-2 rounded-xl font-medium border border-[#E2E2E2]">
                      <strong>Nota de entrega:</strong> {ord.notes}
                    </div>
                  )}
                </div>

                {/* Financial summary */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-500 font-medium">Total de la Comanda</span>
                  <div className="text-right">
                    <span className="text-base font-black text-[#34313A]">
                      {formatCurrencyARS(ord.total)}
                    </span>
                    <span
                      className={`block text-[10px] font-bold ${
                        isPaid ? 'text-[#34313A]' : 'text-[#F68F57]'
                      }`}
                    >
                      {isPaid ? `Cobrado (${ord.paymentMethod})` : 'Pendiente de cobro'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons depending on 10-step state */}
              <div className="pt-4 mt-3 border-t border-[#E2E2E2] space-y-2">
                {isPending && (
                  <div className="space-y-2">
                    <button
                      onClick={() => confirmAndSendToKitchen(ord.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#C1E7FF] text-[#34313A] font-black text-xs hover:bg-[#a9dbfa] border border-[#a9dbfa] shadow-xs transition"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>PASO 6: CONFIRMAR Y ENVIAR A COCINA</span>
                    </button>

                    <button
                      onClick={() => setCancellationOrderId(ord.id)}
                      className="w-full py-1.5 text-center text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Rechazar o Cancelar Pedido
                    </button>
                  </div>
                )}

                {isConfirmed && (
                  <button
                    onClick={() => updateOrderStatus(ord.id, 'en_preparacion')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#C1E7FF] text-[#34313A] font-black text-xs hover:bg-[#a9dbfa] border border-[#a9dbfa] transition"
                  >
                    <span>Iniciar Preparación en Cocina</span>
                  </button>
                )}

                {isPreparing && (
                  <button
                    onClick={() => updateOrderStatus(ord.id, 'listo_para_entrega')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FBEEB9] text-[#34313A] font-black text-xs hover:bg-[#fae498] border border-[#e8d799] transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Marcar Listo para Despacho</span>
                  </button>
                )}

                {isReady && (
                  <button
                    onClick={() => updateOrderStatus(ord.id, 'entregado')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#34313A] text-white font-extrabold text-xs hover:bg-[#484450] transition"
                  >
                    <span>PASO 9: ENTREGAR EN {ord.locationCode}</span>
                  </button>
                )}

                {/* POS Billing button */}
                {!isPaid && ord.status !== 'cancelado' && (
                  <button
                    onClick={() => {
                      setSelectedLocationCode(ord.locationCode);
                      setActiveView('pos');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#C1E7FF]/30 hover:bg-[#C1E7FF] text-[#34313A] font-black text-xs border border-[#a9dbfa] transition"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#34313A]" />
                    <span>PASO 10: IR AL POS PARA COBRAR</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-[#E2E2E2]">
            <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-bold text-[#34313A]">No hay pedidos en esta pestaña</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Los nuevos pedidos desde la playa aparecerán aquí automáticamente.
            </p>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellationOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancelar Comanda</span>
            </div>
            <p className="text-xs text-gray-600">
              Ingresá el motivo de la cancelación. No se borrará del historial para auditoría.
            </p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ej: Cliente canceló antes de preparar, falta de insumo..."
              rows={3}
              className="w-full p-3 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellationOrderId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#34313A]/70 hover:bg-gray-100"
              >
                Volver
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
