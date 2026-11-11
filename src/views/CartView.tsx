import React, { useState, useEffect } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { formatCurrencyARS, validateArgentinePhone } from '../utils/balnearioLogic';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { PaymentMethod } from '../types';
import { supabase, supabaseBusinessSlug } from '../utils/supabase';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Clock,
  ShoppingBag,
  Send,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Phone,
  User,
  ChevronDown,
  CreditCard,
  QrCode,
  Banknote,
  Landmark,
  Copy,
  Check,
} from 'lucide-react';

export const CartView: React.FC = () => {
  const {
    cart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    createCustomerOrder,
    selectedLocationCode,
    setSelectedLocationCode,
    setActiveView,
    locations,
    config,
  } = useBalneario();
  const qrParams = new URLSearchParams(window.location.search);
  const qrLocationCode = qrParams.get('mesa') || qrParams.get('carpa') || qrParams.get('spot');
  const isQrAccess = ['mesa', 'carpa', 'spot'].some((param) => qrParams.has(param));
  const activeLocationCode = qrLocationCode?.toUpperCase() || selectedLocationCode;

  // Customer required fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [selectedSectorTypeFilter, setSelectedSectorTypeFilter] = useState<string>('todos');

  // Validation feedback
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Modals
  const [showClearCartModal, setShowClearCartModal] = useState<boolean>(false);
  const [showLeaveWarningModal, setShowLeaveWarningModal] = useState<boolean>(false);

  // Location resolution
  const loc = locations.find((l) => l.code.toUpperCase() === activeLocationCode.toUpperCase());
  const locationDisplayName = loc ? `${loc.name} (${loc.code})` : `Ubicación ${activeLocationCode}`;

  // Phone validation
  const phoneValidation = validateArgentinePhone(customerPhone);
  const isNameValid = customerName.trim().length >= 3;
  const isPhoneValid = phoneValidation.isValid;
  const isFormValid = isNameValid && isPhoneValid;

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal;

  // Estados interactivos para pago QR y Transferencia
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const bankAlias = 'BALNEARIO.PLAYA.MDP';
  const bankCbu = '0000003100018472910482';
  const bankTitular = `${config.branchName} SRL`;

  useEffect(() => {
    if (selectedPaymentMethod === 'mercadopago_qr' && total > 0) {
      QRCode.toDataURL(
        `00020101021243650016com.mercadolibre0129https://mpago.la/pos/balneario520400005303032540${total}.005802AR5920${encodeURIComponent(config.branchName).slice(0, 20)}6013Mar del Plata62150511PEDIDO-PLAYA6304`,
        {
          width: 220,
          margin: 1,
          color: { dark: '#009ee3', light: '#ffffff' },
        }
      )
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [selectedPaymentMethod, total, config.branchName]);

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(bankAlias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2500);
  };

  const handlePlaceOrder = async () => {
    setFormSubmitted(true);
    setOrderError(null);
    if (!isFormValid || cart.length === 0 || isSubmittingOrder) return;

    if (isQrAccess) {
      if (!supabase || !supabaseBusinessSlug) {
        setOrderError('No se pudo conectar con el sistema de pedidos. Avisale al personal del balneario.');
        return;
      }
      setIsSubmittingOrder(true);
      try {
        const { data, error } = await supabase.rpc('create_qr_order', {
          p_business_slug: supabaseBusinessSlug,
          p_location_code: activeLocationCode,
          p_customer_name: customerName.trim(),
          p_customer_phone: phoneValidation.cleanForWhatsApp,
          p_payment_method: selectedPaymentMethod,
          p_notes: deliveryNotes.trim() || null,
          p_items: cart.map((item) => ({
            product_id: item.productId, quantity: item.quantity,
            variant_id: item.variant?.id ?? null,
            addon_ids: item.selectedAddons.map((addon) => addon.id),
            removed_ingredients: item.removedIngredients, notes: item.notes ?? null,
          })),
        });
        if (error) throw error;
        const result = data as { orderNumber?: string };
        if (!result?.orderNumber) throw new Error('El servidor no confirmó el número del pedido.');
        clearCart();
        setPlacedOrderNumber(result.orderNumber);
      } catch (error) {
        setOrderError(error instanceof Error ? error.message : 'No se pudo enviar el pedido. Probá nuevamente.');
      } finally {
        setIsSubmittingOrder(false);
      }
      return;
    }

    const order = createCustomerOrder(
      activeLocationCode,
      customerName.trim(),
      phoneValidation.cleanForWhatsApp,
      selectedPaymentMethod,
      deliveryNotes.trim() || undefined
    );

    if (order) {
      setPlacedOrderNumber(order.orderNumber);
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe confetti fallback
      }
    }
  };

  const handleConfirmClearCart = () => {
    clearCart();
    setShowClearCartModal(false);
  };

  const handleAttemptLeave = () => {
    if (cart.length > 0 && !placedOrderNumber) {
      setShowLeaveWarningModal(true);
    } else {
      setActiveView('carta');
    }
  };

  const filteredLocationsForPicker = locations.filter((l) => {
    if (selectedSectorTypeFilter === 'todos') return true;
    return l.type === selectedSectorTypeFilter;
  });

  return (
    <div className="min-h-screen bg-[#FBEEB9] pb-24 text-[#34313A]">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl min-h-screen flex flex-col justify-between border-x border-[#E2E2E2] md:my-4 md:rounded-3xl">
        {/* Top Header */}
        <div className="relative bg-white border-b border-[#E2E2E2] px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={handleAttemptLeave}
            className="flex items-center gap-1.5 text-xs font-bold text-[#34313A] hover:text-[#F68F57] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Carta</span>
          </button>

          {isQrAccess ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa] text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-[#34313A]" />
            <span>{locationDisplayName}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa] text-xs font-bold hover:bg-[#aee0ff] transition"
              title="Tocar para cambiar tu sector de entrega"
            >
              <MapPin className="w-3.5 h-3.5 text-[#34313A]" />
              <span>{locationDisplayName}</span>
              <ChevronDown className="w-3 h-3 text-[#34313A]" />
            </button>
          )}
        </div>

        {/* Location Picker dropdown modal */}
        {!isQrAccess && showLocationPicker && (
          <div className="bg-[#FBEEB9]/30 border-b border-[#E2E2E2] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-xs text-[#34313A]">
                  Seleccioná el sector de entrega de tu pedido:
                </h4>
                <p className="text-[11px] text-gray-500">
                  Podés elegir tu carpa, sombrilla o mesa en el balneario.
                </p>
              </div>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-xs font-bold text-gray-500 hover:text-[#34313A]"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'carpa', label: 'Carpas' },
                { id: 'sombrilla', label: 'Sombrillas' },
                { id: 'mesa_exterior', label: 'Mesas Deck' },
                { id: 'mesa_interior', label: 'Mesas Salón' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSectorTypeFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    selectedSectorTypeFilter === tab.id
                      ? 'bg-[#34313A] text-white'
                      : 'bg-white text-[#34313A] border border-[#E2E2E2]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Location spots grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-1">
              {filteredLocationsForPicker.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedLocationCode(item.code);
                    setShowLocationPicker(false);
                  }}
                  className={`p-2 rounded-xl text-center text-xs font-black transition border ${
                    selectedLocationCode === item.code
                      ? 'bg-[#C1E7FF] text-[#34313A] border-[#a9dbfa] ring-2 ring-[#C1E7FF]'
                      : 'bg-white text-[#34313A] border-[#E2E2E2] hover:bg-[#FBEEB9]/40'
                  }`}
                >
                  <div>{item.code}</div>
                  <div className="text-[9px] font-semibold text-gray-500 truncate">{item.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-5 space-y-5">
          {placedOrderNumber ? (
            /* Success confirmation screen (Step 3 completed) */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#C1E7FF] text-[#34313A] flex items-center justify-center mx-auto shadow-md border border-[#a9dbfa]">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#F68F57]">
                  PASO 3 DEL CIRCUITO DE PEDIDO
                </span>
                <h2 className="text-2xl font-black text-[#34313A] mt-1">
                  ¡Pedido {placedOrderNumber} Enviado!
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto mt-2 leading-relaxed">
                  Muchas gracias, <strong>{customerName}</strong>. Tu pedido para{' '}
                  <strong>{locationDisplayName}</strong> fue registrado con estado{' '}
                  <span className="font-bold text-[#F68F57]">Pendiente de confirmación</span>.
                </p>
              </div>

              {/* Status explanation card */}
              <div className="p-4 rounded-2xl bg-[#C1E7FF]/25 border border-[#C1E7FF]/60 text-left text-xs space-y-2.5 max-w-sm mx-auto text-[#34313A]">
                <div className="flex items-center gap-2 font-black">
                  <Clock className="w-4 h-4 text-[#34313A]" />
                  <span>¿Cómo sigue tu pedido?</span>
                </div>
                <p className="text-gray-700 leading-normal text-[11px]">
                  1. <strong>Contacto por WhatsApp:</strong> El personal del balneario revisará tu pedido y se comunicará a tu celular (<strong>{customerPhone}</strong>) para confirmar los productos e importe.<br />
                  2. <strong>Envío a Cocina KDS:</strong> Caja registra tu aprobación de la versión actual y recién entonces la envía a preparación.<br />
                  3. <strong>Entrega:</strong> Te lo llevamos directamente a tu sector.
                </p>
              </div>

              {/* Si seleccionó QR o Transferencia, mostrar datos de pago en la confirmación */}
              {selectedPaymentMethod === 'mercadopago_qr' && qrDataUrl && (
                <div className="p-3.5 rounded-2xl bg-[#009ee3]/10 border border-[#009ee3]/30 max-w-sm mx-auto text-center space-y-2">
                  <div className="text-xs font-black text-[#009ee3] flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>Abonar pedido con QR ({placedOrderNumber})</span>
                  </div>
                  <img src={qrDataUrl} alt="QR Pago" className="w-28 h-28 mx-auto bg-white p-1 rounded-xl shadow-xs" />
                  <p className="text-[10px] text-gray-600">Escaneá desde Mercado Pago o MODO cuando quieras abonar.</p>
                </div>
              )}

              {selectedPaymentMethod === 'transferencia' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 max-w-sm mx-auto text-left space-y-2">
                  <div className="text-xs font-black text-emerald-800 flex items-center justify-between">
                    <span>Datos para Transferir:</span>
                    <button
                      type="button"
                      onClick={handleCopyAlias}
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1"
                    >
                      {copiedAlias ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAlias ? 'Copiado' : 'Copiar Alias'}</span>
                    </button>
                  </div>
                  <div className="text-xs font-mono font-black text-[#34313A] bg-white p-2 rounded-lg border border-emerald-200">
                    Alias: {bankAlias}
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => {
                    setPlacedOrderNumber(null);
                    setActiveView(isQrAccess ? 'carta' : 'comandas');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#C1E7FF] hover:bg-[#a9dbfa] text-[#34313A] font-black text-xs transition shadow-sm border border-[#a9dbfa]"
                >
                  {isQrAccess ? 'Volver a la Carta' : 'Ver Estado en Comandas'}
                </button>
                <button
                  onClick={() => {
                    setPlacedOrderNumber(null);
                    setActiveView('carta');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#E2E2E2] text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Seguir explorando la carta
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* Empty Cart */
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FBEEB9]/40 border border-[#E2E2E2] flex items-center justify-center mx-auto text-[#34313A]/60 shadow-xs">
                <ShoppingBag className="w-8 h-8 text-[#34313A]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#34313A]">Tu carrito está vacío</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Explorá la carta del balneario y agregá tus platos, tragos o bebidas favoritas.
                </p>
              </div>
              <button
                onClick={() => setActiveView('carta')}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-[#C1E7FF] hover:bg-[#a9dbfa] text-[#34313A] font-black text-xs shadow-xs border border-[#a9dbfa] transition"
              >
                IR A LA CARTA DIGITAL
              </button>
            </div>
          ) : (
            /* Active Cart Items & Order Confirmation */
            <>
              {/* Header with clear cart option */}
              <div className="flex items-center justify-between pb-1 border-b border-[#E2E2E2]">
                <h2 className="font-black text-sm text-[#34313A]">
                  Resumen de tu Pedido ({cart.reduce((s, i) => s + i.quantity, 0)} productos)
                </h2>
                <button
                  type="button"
                  onClick={() => setShowClearCartModal(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar carrito</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-[#E2E2E2] bg-white shadow-xs flex flex-col justify-between gap-2.5 hover:shadow-sm transition"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100 border border-[#E2E2E2]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-black text-xs text-[#34313A] line-clamp-1">
                            {item.productName}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-rose-600 p-1 rounded-lg transition"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.variant && (
                          <div className="text-[10px] text-gray-500 font-semibold">
                            Variante: {item.variant.name}
                          </div>
                        )}

                        {(item.removedIngredients.length > 0 ||
                          item.selectedAddons.length > 0 ||
                          item.notes) && (
                          <div className="flex flex-wrap gap-1 text-[10px] pt-1">
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

                        <div className="text-[11px] font-extrabold text-[#34313A] mt-1">
                          {formatCurrencyARS(item.unitPrice)} c/u
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 bg-[#FBEEB9]/30 rounded-xl p-1 border border-[#E2E2E2]">
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#E2E2E2] flex items-center justify-center text-xs font-black text-[#34313A] hover:bg-gray-50 shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-[#34313A] w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-[#F68F57] text-white flex items-center justify-center text-xs font-black shadow-2xs hover:bg-[#e07f4a]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-black text-sm text-[#34313A]">
                        {formatCurrencyARS(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Obligatory Customer Details Form (Requirement Section 1) */}
              <div className="p-4 rounded-2xl bg-[#FBEEB9]/25 border border-[#E2E2E2] space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#E2E2E2]">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#34313A]">
                    <FileText className="w-4 h-4 text-[#F68F57]" />
                    <span>Datos Obligatorios del Cliente</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    * Requerido p/ WhatsApp
                  </span>
                </div>

                {/* Nombre y Apellido */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#34313A] flex items-center gap-1">
                    <User className="w-3 h-3 text-[#34313A]" />
                    <span>Nombre y Apellido *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Laura Domínguez, Martín Rossi"
                    className={`w-full bg-white px-3 py-2 rounded-xl border text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF] focus:ring-1 focus:ring-[#C1E7FF] ${
                      formSubmitted && !isNameValid
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-[#E2E2E2]'
                    }`}
                  />
                  {formSubmitted && !isNameValid && (
                    <span className="text-[10px] font-bold text-rose-600 block">
                      Por favor ingresá tu nombre y apellido completo.
                    </span>
                  )}
                </div>

                {/* Teléfono celular con código de área */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#34313A] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#34313A]" />
                    <span>Número de Celular con Código de Área *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 223 555-1234 ó +54 9 11 4444-3333"
                    className={`w-full bg-white px-3 py-2 rounded-xl border text-xs font-mono text-[#34313A] focus:outline-none focus:border-[#C1E7FF] focus:ring-1 focus:ring-[#C1E7FF] ${
                      formSubmitted && !isPhoneValid
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-[#E2E2E2]'
                    }`}
                  />
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                    <span>Válido para celulares de Mar del Plata (+54 9 223...) o todo el país.</span>
                    {customerPhone.trim() && isPhoneValid && (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Formato válido
                      </span>
                    )}
                  </div>
                  {formSubmitted && !isPhoneValid && (
                    <span className="text-[10px] font-bold text-rose-600 block">
                      {phoneValidation.error || 'Ingresá tu número de teléfono celular con código de área.'}
                    </span>
                  )}
                </div>

                {/* Sector de entrega confirmado */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#34313A] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#34313A]" />
                      <span>Sector de Entrega Confirmado:</span>
                    </label>
                    {!isQrAccess && (
                      <button
                        type="button"
                        onClick={() => setShowLocationPicker(true)}
                        className="text-[11px] font-bold text-[#34313A] underline hover:text-[#F68F57]"
                      >
                        Cambiar sector
                      </button>
                    )}
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2E2E2] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#34313A]">{locationDisplayName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#C1E7FF] text-[#34313A] font-black text-[10px] uppercase">
                      {loc?.type.replace(/_/g, ' ') || 'Playa'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-bold text-[#34313A]">¿Cómo vas a abonar?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'efectivo', label: 'Efectivo', Icon: Banknote },
                      { value: 'mercadopago_qr', label: 'QR', Icon: QrCode },
                      { value: 'transferencia', label: 'Transferencia', Icon: Landmark },
                      { value: 'debito/credito', label: 'Tarjeta', Icon: CreditCard },
                    ] as const).map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selectedPaymentMethod === value}
                        onClick={() => setSelectedPaymentMethod(value)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          selectedPaymentMethod === value
                            ? 'bg-[#C1E7FF] text-[#34313A] border-[#a9dbfa] shadow-xs'
                            : 'bg-white text-[#34313A] border-[#E2E2E2] hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tarjeta Interactiva de Pago con QR con Importe Actualizado */}
                  {selectedPaymentMethod === 'mercadopago_qr' && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#009ee3]/10 to-[#C1E7FF]/30 border-2 border-[#009ee3]/30 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-[#009ee3]/20">
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#009ee3]">
                          <QrCode className="w-4 h-4" />
                          <span>QR Dinámico • Mercado Pago & MODO</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#009ee3] text-white">
                          Interoperable
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="bg-white p-2 rounded-2xl border border-[#009ee3]/30 shadow-md shrink-0">
                          {qrDataUrl ? (
                            <img src={qrDataUrl} alt="QR de Pago" className="w-32 h-32 object-contain" />
                          ) : (
                            <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-xs">Generando QR...</div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                          <p className="text-[11px] text-gray-700 leading-snug">
                            Escaneá desde tu celular con la app de <strong>Mercado Pago</strong>, <strong>MODO</strong> o tu banco.
                          </p>
                          <div className="pt-1">
                            <span className="text-[10px] text-gray-500 uppercase font-mono block">Importe exacto a pagar:</span>
                            <span className="text-lg font-black text-[#009ee3]">{formatCurrencyARS(total)}</span>
                          </div>
                          <span className="text-[9px] text-emerald-700 font-bold block">
                            ✓ Se actualiza en tiempo real al modificar cantidades
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tarjeta Interactiva de Transferencia con Alias y Botón Copiar */}
                  {selectedPaymentMethod === 'transferencia' && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-2 border-emerald-300 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                          <Landmark className="w-4 h-4 text-emerald-600" />
                          <span>Datos para Transferencia Bancaria</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          Acreditación Inmediata
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-mono block">Alias Bancario:</span>
                            <span className="font-mono font-black text-sm text-[#34313A]">{bankAlias}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyAlias}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                              copiedAlias
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {copiedAlias ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Alias</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 px-1">
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase font-mono">Titular:</span>
                            <span className="font-bold text-[#34313A]">{bankTitular}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase font-mono">CVU / CBU:</span>
                            <span className="font-mono font-bold text-[#34313A] text-[10px]">{bankCbu}</span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-emerald-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-600">Importe a transferir:</span>
                          <span className="text-base font-black text-emerald-800">{formatCurrencyARS(total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notas adicionales */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Aclaraciones para la entrega (opcional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Ej: Sombrilla azul con toallas rojas, dejar en mesita..."
                    className="w-full bg-white px-3 py-2 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF] focus:ring-1 focus:ring-[#C1E7FF]"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-[#E2E2E2] space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal productos</span>
                  <span className="font-semibold text-[#34313A]">{formatCurrencyARS(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Servicio de playa / IVA</span>
                  <span className="font-semibold text-[#34313A]">Incluido</span>
                </div>
                <div className="pt-2 border-t border-[#E2E2E2] flex justify-between items-baseline text-sm">
                  <span className="font-extrabold text-[#34313A]">Total del Pedido</span>
                  <span className="font-black text-lg text-[#34313A]">
                    {formatCurrencyARS(total)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom CTA when cart has items */}
        {cart.length > 0 && !placedOrderNumber && (
          <div className="sticky bottom-0 z-20 bg-white border-t border-[#E2E2E2] p-4 shadow-lg">
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmittingOrder}
              className="w-full flex items-center justify-between py-3.5 px-5 rounded-2xl bg-[#F68F57] hover:bg-[#e07f4a] text-white font-extrabold text-sm shadow-lg shadow-[#F68F57]/25 transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span>{isSubmittingOrder ? 'ENVIANDO PEDIDO…' : 'CONFIRMAR Y ENVIAR PEDIDO'}</span>
              </div>
              <span className="bg-[#34313A]/25 px-3 py-1 rounded-xl text-white text-xs font-black">
                {formatCurrencyARS(total)}
              </span>
            </button>

            {orderError && <p role="alert" className="mt-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{orderError}</p>}

            <p className="text-[10px] text-gray-500 text-center mt-2">
              Se creará el pedido para <strong>{locationDisplayName}</strong> y el personal te contactará por WhatsApp para confirmar.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Vaciar Carrito (Requirement Section 4-B) */}
      {showClearCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34313A]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E2E2]">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-base text-[#34313A]">
                ¿Estás seguro de que querés eliminar todos los productos del carrito?
              </h3>
              <p className="text-xs text-gray-600">
                Se quitarán todos los productos seleccionados y el total volverá a $0. Los pedidos que ya enviaste al balneario permanecerán guardados.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearCartModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#E2E2E2] text-xs font-bold text-[#34313A] hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCart}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition"
              >
                Sí, vaciar carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Protection Modal: Warn on leaving with active cart (Requirement Section 4-D) */}
      {showLeaveWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34313A]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E2E2]">
            <div className="w-12 h-12 rounded-2xl bg-[#FBEEB9] text-[#34313A] flex items-center justify-center mx-auto border border-[#e8d799]">
              <AlertTriangle className="w-6 h-6 text-[#34313A]" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-base text-[#34313A]">
                ¿Deseás salir de tu pedido?
              </h3>
              <p className="text-xs text-gray-600">
                Tenés <strong>{cart.reduce((s, i) => s + i.quantity, 0)} productos</strong> en el carrito que aún no fueron enviados al balneario.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveWarningModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C1E7FF] text-[#34313A] font-black text-xs hover:bg-[#aee0ff] border border-[#a9dbfa] transition"
              >
                Seguir en el carrito
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveWarningModal(false);
                  setActiveView('carta');
                }}
                className="w-full py-2 px-4 rounded-xl border border-[#E2E2E2] text-[#34313A]/70 font-bold text-xs hover:bg-gray-100 transition"
              >
                Salir de todas formas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
