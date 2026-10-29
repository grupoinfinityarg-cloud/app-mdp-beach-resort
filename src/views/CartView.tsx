import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { formatCurrencyARS } from '../utils/balnearioLogic';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Utensils,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  Send,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const CartView: React.FC = () => {
  const {
    cart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    createCustomerOrder,
    selectedLocationCode,
    setActiveView,
    locations,
  } = useBalneario();

  const [customerName, setCustomerName] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);

  const loc = locations.find((l) => l.code === selectedLocationCode);
  const locationDisplayName = loc ? `${loc.name} (${loc.code})` : `Ubicación ${selectedLocationCode}`;

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal;

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const order = createCustomerOrder(
      selectedLocationCode,
      customerName.trim() || undefined,
      deliveryNotes.trim() || undefined
    );

    if (order) {
      setPlacedOrderNumber(order.orderNumber);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe confetti fallback
      }
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 text-[#202428]">
      <div className="max-w-xl mx-auto bg-white shadow-xl min-h-screen flex flex-col justify-between border-x border-gray-100">
        {/* Top Header */}
        <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => setActiveView('carta')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#202428] hover:text-[#F47B35] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Carta</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#55C7E8]/15 text-[#202428] border border-[#55C7E8]/40 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-[#202428]" />
            <span>{locationDisplayName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 space-y-5">
          {placedOrderNumber ? (
            /* Success confirmation screen (Step 3 completed) */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FFD43B] text-[#202428] flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#F47B35]">
                  PASO 3 DEL CIRCUITO DE PEDIDO
                </span>
                <h2 className="text-2xl font-black text-[#202428] mt-1">
                  ¡Pedido {placedOrderNumber} Enviado!
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto mt-2 leading-relaxed">
                  Tu solicitud fue recibida para <strong>{locationDisplayName}</strong>. El personal del parador revisará la comanda y la enviará a cocina.
                </p>
              </div>

              {/* Status explanation card */}
              <div className="p-4 rounded-2xl bg-[#55C7E8]/10 border border-[#55C7E8]/30 text-left text-xs space-y-2.5 max-w-sm mx-auto text-[#202428]">
                <div className="flex items-center gap-2 font-bold">
                  <Clock className="w-4 h-4 text-[#202428]" />
                  <span>Estado: Pendiente de confirmación</span>
                </div>
                <p className="text-gray-700 leading-normal text-[11px]">
                  1. El personal confirma disponibilidad y comanda.<br />
                  2. Ingresa a la pantalla KDS de la cocina.<br />
                  3. El runner o mozo te lo acerca a tu carpa o mesa.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => {
                    setPlacedOrderNumber(null);
                    setActiveView('comandas');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#F47B35] hover:bg-[#e06824] text-white font-extrabold text-xs transition shadow-md"
                >
                  Ver en Panel de Comandas
                </button>
                <button
                  onClick={() => {
                    setPlacedOrderNumber(null);
                    setActiveView('carta');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-[#202428] font-bold text-xs hover:bg-gray-50 transition"
                >
                  Seguir explorando la carta
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* Empty Cart */
            <div className="py-20 text-center space-y-3">
              <ShoppingBag className="w-14 h-14 mx-auto text-gray-300" />
              <h3 className="text-base font-bold text-[#202428]">Tu carrito está vacío</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Explorá nuestra carta gastronómica y elegí tus platos y bebidas favoritos de la playa.
              </p>
              <button
                onClick={() => setActiveView('carta')}
                className="mt-3 px-5 py-2.5 rounded-xl bg-[#F47B35] hover:bg-[#e06824] text-white font-extrabold text-xs shadow-md transition"
              >
                Explorar Menú
              </button>
            </div>
          ) : (
            /* Cart with Items */
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-[#202428]">
                  Resumen de tu Pedido ({cart.reduce((s, i) => s + i.quantity, 0)} productos)
                </h2>
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-[#202428] leading-snug">
                            {item.productName}
                          </h4>
                          {item.variant && (
                            <span className="text-[11px] font-bold text-[#202428]/80 block">
                              {item.variant.name}
                            </span>
                          )}
                          <span className="text-xs font-extrabold text-[#202428] block mt-0.5">
                            {formatCurrencyARS(item.unitPrice)} c/u
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 transition"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Customizations tags */}
                    {(item.removedIngredients.length > 0 ||
                      item.selectedAddons.length > 0 ||
                      item.notes) && (
                      <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1 text-[10px]">
                        {item.removedIngredients.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-bold border border-rose-200"
                          >
                            Sin {r}
                          </span>
                        ))}
                        {item.selectedAddons.map((a) => (
                          <span
                            key={a.id}
                            className="px-2 py-0.5 rounded-md bg-[#55C7E8]/15 text-[#202428] font-bold border border-[#55C7E8]/40"
                          >
                            +{a.name} ({formatCurrencyARS(a.price)})
                          </span>
                        ))}
                        {item.notes && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 italic">
                            "{item.notes}"
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stepper & item subtotal */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, -1)}
                          className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-white"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#202428]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, 1)}
                          className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs sm:text-sm font-black text-[#202428]">
                        {formatCurrencyARS(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer details for delivery */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#202428]">
                  <FileText className="w-4 h-4 text-[#F47B35]" />
                  <span>Datos de Entrega en el Balneario</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Nombre o Titular de la Carpa/Mesa (opcional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Familia Rossi, Carlos M."
                    className="w-full bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs text-[#202428] focus:outline-hidden focus:border-[#55C7E8] focus:ring-1 focus:ring-[#55C7E8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Aclaraciones para la entrega
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Ej: Sombrilla azul con toallas rojas, dejar en mesita..."
                    className="w-full bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs text-[#202428] focus:outline-hidden focus:border-[#55C7E8] focus:ring-1 focus:ring-[#55C7E8]"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal productos</span>
                  <span className="font-semibold text-[#202428]">{formatCurrencyARS(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Servicio de playa / IVA</span>
                  <span className="font-semibold text-[#202428]">Incluido</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline text-sm">
                  <span className="font-extrabold text-[#202428]">Total a Pagar</span>
                  <span className="font-black text-lg text-[#202428]">
                    {formatCurrencyARS(total)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom CTA when cart has items */}
        {cart.length > 0 && !placedOrderNumber && (
          <div className="sticky bottom-0 z-20 bg-white border-t border-gray-100 p-4 shadow-lg">
            <button
              onClick={handlePlaceOrder}
              className="w-full flex items-center justify-between py-3.5 px-5 rounded-2xl bg-[#F47B35] hover:bg-[#e06824] text-white font-extrabold text-sm shadow-lg shadow-[#F47B35]/25 transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span>CONFIRMAR Y ENVIAR PEDIDO</span>
              </div>
              <span className="bg-[#202428]/25 px-3 py-1 rounded-xl text-white text-xs font-black">
                {formatCurrencyARS(total)}
              </span>
            </button>

            <p className="text-[10px] text-gray-400 text-center mt-2">
              Se creará la comanda con origen <strong>{selectedLocationCode}</strong> para aprobación del personal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
