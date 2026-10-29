import React, { useState, useEffect } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { Order } from '../types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Check,
  Send,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const KitchenKDSView: React.FC = () => {
  const { orders, updateOrderStatus } = useBalneario();
  const [filter, setFilter] = useState<'activas' | 'nuevas' | 'preparando' | 'listas'>('activas');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [, setTicker] = useState(0);

  // Update elapsed timers every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setTicker((t) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  // Filter kitchen active orders
  const kitchenOrders = orders.filter((o) => {
    if (o.status === 'cancelado') return false;
    if (filter === 'activas') {
      return (
        o.status === 'confirmado_en_cocina' ||
        o.status === 'en_preparacion' ||
        o.status === 'listo_para_entrega'
      );
    }
    if (filter === 'nuevas') return o.status === 'confirmado_en_cocina';
    if (filter === 'preparando') return o.status === 'en_preparacion';
    if (filter === 'listas') return o.status === 'listo_para_entrega';
    return false;
  });

  const playKitchenChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#111914] text-white p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top KDS Header */}
      <div className="bg-[#18231c] p-4 sm:p-5 rounded-3xl border border-emerald-950/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                KDS COCINA & DESPACHO
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 uppercase">
                Pantalla a distancia
              </span>
            </div>
            <p className="text-xs text-emerald-400/80 font-medium mt-0.5">
              Comandas confirmadas en tiempo real para elaboración y despacho a carpas y mesas.
            </p>
          </div>
        </div>

        {/* Filters & Sound controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playKitchenChime();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
              soundEnabled
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-gray-900 border-gray-800 text-gray-500'
            }`}
            title="Activar o silenciar campana de cocina"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Campana ON' : 'Silencio'}</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#101912] p-1 rounded-2xl border border-emerald-950">
            {[
              { id: 'activas', label: 'Todas Activas' },
              { id: 'nuevas', label: 'Nuevas' },
              { id: 'preparando', label: 'En Fuego' },
              { id: 'listas', label: 'Listas' },
            ].map((tab) => {
              const isSelected = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-emerald-950/40'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {kitchenOrders.map((ord) => {
          const isNew = ord.status === 'confirmado_en_cocina';
          const isCooking = ord.status === 'en_preparacion';
          const isReady = ord.status === 'listo_para_entrega';

          // Elapsed time
          const startTime = ord.confirmedAt || ord.createdAt;
          const elapsedMinutes = Math.max(
            0,
            Math.round((Date.now() - new Date(startTime).getTime()) / (60 * 1000))
          );
          const isDelayed = elapsedMinutes >= 15;

          return (
            <div
              key={ord.id}
              className={`rounded-3xl p-5 border flex flex-col justify-between transition shadow-2xl relative overflow-hidden ${
                isReady
                  ? 'bg-[#15271d] border-emerald-500 ring-2 ring-emerald-500/30'
                  : isCooking
                  ? 'bg-[#1a232e] border-blue-500'
                  : 'bg-[#211d15] border-amber-500 ring-1 ring-amber-500/20'
              }`}
            >
              {/* Delayed warning bar */}
              {isDelayed && !isReady && (
                <div className="absolute top-0 left-0 right-0 bg-rose-600 text-white text-[10px] font-black uppercase text-center py-0.5 tracking-wider">
                  ⚠️ ALERTA: +{elapsedMinutes} MIN EN ESPERA
                </div>
              )}

              <div className="space-y-4 pt-1">
                {/* Header Card: Order # + Location + Time */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-white">{ord.orderNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                          isReady
                            ? 'bg-emerald-500 text-emerald-950'
                            : isCooking
                            ? 'bg-blue-500 text-blue-950'
                            : 'bg-amber-400 text-amber-950 animate-pulse'
                        }`}
                      >
                        {isReady ? 'LISTO' : isCooking ? 'COCINANDO' : 'NUEVO'}
                      </span>
                    </div>

                    {/* Prominent Delivery Destination */}
                    <div className="text-base font-black text-emerald-300 tracking-wide mt-1 uppercase">
                      DESTINO: {ord.locationName} ({ord.locationCode})
                    </div>
                  </div>

                  {/* Timer */}
                  <div
                    className={`px-3 py-1.5 rounded-xl font-mono text-center shrink-0 border ${
                      isDelayed
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-black/40 border-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedMinutes}m</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider block opacity-70">
                      transcurrido
                    </span>
                  </div>
                </div>

                {/* Items & Ingredients */}
                <div className="space-y-3">
                  {ord.items.map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-black/35 border border-white/5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-amber-400">
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="text-base font-black text-white leading-tight">
                              {item.productName}
                            </span>
                            {item.variant && (
                              <span className="block text-xs font-bold text-emerald-300">
                                [{item.variant.name}]
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Explicit kitchen modifications */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.removedIngredients.map((ing) => (
                          <span
                            key={ing}
                            className="px-2 py-0.5 rounded-md bg-rose-950/90 text-rose-300 border border-rose-700 font-bold text-xs line-through"
                          >
                            SIN {ing.toUpperCase()}
                          </span>
                        ))}

                        {item.selectedAddons.map((addon) => (
                          <span
                            key={addon.id}
                            className="px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-600 font-bold text-xs"
                          >
                            + {addon.name.toUpperCase()}
                          </span>
                        ))}
                      </div>

                      {item.notes && (
                        <div className="text-xs font-semibold text-amber-300 bg-amber-950/50 p-2 rounded-xl border border-amber-800/60">
                          <strong>NOTA:</strong> {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {ord.notes && (
                  <div className="text-xs text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="font-bold text-white">Observaciones del cliente:</span>{' '}
                    {ord.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons (Large & Accessible for Kitchen Staff) */}
              <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                {isNew && (
                  <button
                    onClick={() => {
                      updateOrderStatus(ord.id, 'en_preparacion');
                      playKitchenChime();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg transition active:scale-[0.98]"
                  >
                    <Flame className="w-5 h-5 text-amber-300" />
                    <span>INICIAR PREPARACIÓN</span>
                  </button>
                )}

                {isCooking && (
                  <button
                    onClick={() => {
                      updateOrderStatus(ord.id, 'listo_para_entrega');
                      playKitchenChime();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg transition active:scale-[0.98]"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>MARCAR LISTO PARA RETIRAR</span>
                  </button>
                )}

                {isReady && (
                  <button
                    onClick={() => {
                      updateOrderStatus(ord.id, 'entregado');
                      playKitchenChime();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider shadow-lg transition active:scale-[0.98]"
                  >
                    <Send className="w-5 h-5" />
                    <span>DESPACHADO / ENTREGADO EN PLAYA</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {kitchenOrders.length === 0 && (
          <div className="col-span-full py-24 text-center text-gray-500 bg-[#16211a] rounded-3xl border border-emerald-950">
            <ChefHat className="w-16 h-16 mx-auto text-emerald-900 mb-3" />
            <h3 className="text-lg font-black text-gray-300">¡Cocina al día!</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No hay comandas pendientes de elaboración en este momento. Las nuevas órdenes confirmadas por los mozos ingresarán aquí con sonido.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
