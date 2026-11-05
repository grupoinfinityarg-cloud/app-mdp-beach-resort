import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { Order, OrderStatus, CartItem, Product } from '../types';
import {
  formatCurrencyARS,
  validateArgentinePhone,
  formatWhatsAppOrderMessage,
  buildWhatsAppLink,
} from '../utils/balnearioLogic';
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
  MessageCircle,
  Phone,
  Edit,
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  History,
  X,
  FileText,
} from 'lucide-react';

export const OrderManagementView: React.FC = () => {
  const {
    orders,
    confirmAndSendToKitchen,
    updateOrderStatus,
    cancelOrder,
    editOrder,
    recordWhatsAppContact,
    recordQrCustomerApproval,
    sendQrOrderToKitchen,
    editQrOrderVersion,
    setActiveView,
    setSelectedLocationCode,
    config,
    businessDisplayName,
    products,
  } = useBalneario();

  const [activeTab, setActiveTab] = useState<
    'todos' | 'pendientes' | 'cocina' | 'listos' | 'entregados' | 'cobrados'
  >('pendientes');

  // Cancellation modal state
  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // Editing order modal state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<CartItem[]>([]);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editEmployeeName, setEditEmployeeName] = useState<string>('Mozo Playa');
  const [editChangeReason, setEditChangeReason] = useState<string>('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');

  // WhatsApp copied feedback
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

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

  const handleCopyWhatsAppMessage = (order: Order) => {
    const message = formatWhatsAppOrderMessage(order, businessDisplayName);
    navigator.clipboard.writeText(message);
    setCopiedOrderId(order.id);
    recordWhatsAppContact(order.id);
    setTimeout(() => setCopiedOrderId(null), 3000);
  };

  // Open Edit Order Modal
  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditItems([...order.items]);
    setEditNotes(order.notes || '');
    setEditChangeReason('');
  };

  const handleUpdateEditItemQuantity = (index: number, delta: number) => {
    setEditItems((prev) => {
      const next = [...prev];
      const target = next[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index] = {
        ...target,
        quantity: newQty,
        subtotal: target.unitPrice * newQty,
      };
      return next;
    });
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProductToEditOrder = () => {
    if (!selectedProductToAdd) return;
    const prod = products.find((p) => p.id === selectedProductToAdd);
    if (!prod) return;

    const newItem: CartItem = {
      id: `edit-item-${Date.now()}`,
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

    setEditItems((prev) => [...prev, newItem]);
    setSelectedProductToAdd('');
  };

  const handleSaveOrderEdits = async () => {
    if (!editingOrder) return;
    if (editItems.length === 0) {
      alert('La comanda debe tener al menos un producto.');
      return;
    }

    const employee = editEmployeeName.trim() || 'Personal Balneario';
    const reason = editChangeReason.trim() || 'Modificación acordada con el cliente';

    if (editingOrder.orderSource === 'qr') {
      if (await editQrOrderVersion(editingOrder, editItems, editNotes, employee, reason)) setEditingOrder(null);
    } else {
      editOrder(editingOrder.id, editItems, editNotes, employee, reason);
      setEditingOrder(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#34313A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            El pedido recibido requiere contacto y confirmación del personal vía WhatsApp antes de enviarse a cocina KDS.
          </p>
        </div>

        {/* 10-step explainer card trigger */}
        <div className="p-3 rounded-2xl bg-[#C1E7FF]/25 border border-[#C1E7FF]/60 text-xs text-[#34313A] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#34313A] shrink-0" />
          <span className="text-[11px] font-semibold">
            Flujo: <strong>Pedido Cliente</strong> → <strong>Contacto WhatsApp</strong> → <strong>Edición / Confirmación</strong> → <strong>Cocina KDS</strong>.
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
          const isPaid = ord.paymentStatus === 'cobrado';

          const elapsedMin = Math.round(
            (Date.now() - new Date(ord.createdAt).getTime()) / (60 * 1000)
          );

          const phoneValidation = validateArgentinePhone(ord.customerPhone || '');

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
                        <Umbrella className="w-3.5 h-3.5 text-[#34313A]" />
                      ) : (
                        <Utensils className="w-3.5 h-3.5 text-[#34313A]" />
                      )}
                      <span>{ord.locationName}</span>
                      <span className="px-1.5 py-0.2 rounded bg-gray-100 text-[10px] font-mono text-gray-600">
                        {ord.locationCode}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-600 font-medium mt-1">
                      <div>Cliente: <strong>{ord.customerName || 'Cliente'}</strong></div>
                      {ord.customerPhone ? (
                        <div className="text-gray-500 font-mono text-[10px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#34313A]" />
                          <span>{phoneValidation.cleanForWhatsApp || ord.customerPhone}</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-[10px]">Sin teléfono</div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-[#FBEEB9] text-[#34313A] border border-[#e8d799]">
                        Paso 3: Espera Aprobación
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]">
                        Paso 6: En Cola Cocina
                      </span>
                    )}
                    {isPreparing && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-[#F68F57] text-white">
                        Paso 8: En Cocina KDS
                      </span>
                    )}
                    {isReady && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa] animate-pulse">
                        Paso 8: Listo para Llevar
                      </span>
                    )}
                    {ord.status === 'entregado' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-gray-100 text-[#34313A] border border-[#E2E2E2]">
                        Paso 9: Entregado
                      </span>
                    )}
                    {ord.status === 'cancelado' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                        Cancelado
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase text-gray-400 tracking-wider">
                    <span>Productos solicitados ({ord.items.reduce((s, i) => s + i.quantity, 0)})</span>
                    {isPending && (
                      <button
                        onClick={() => handleOpenEditOrder(ord)}
                        className="text-[10px] font-bold text-[#F68F57] lowercase hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Editar Comanda</span>
                      </button>
                    )}
                  </div>

                  {ord.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl bg-gray-50/70 border border-[#E2E2E2]/60 text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#34313A]">
                          <strong className="text-[#F68F57]">{item.quantity}x</strong> {item.productName}
                        </span>
                        <span className="font-extrabold text-[#34313A] shrink-0">
                          {formatCurrencyARS(item.subtotal)}
                        </span>
                      </div>

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

                {/* WhatsApp & Audit Status */}
                <div className="space-y-1.5">
                  {ord.whatsappContactedAt && (
                    <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Contactado por WhatsApp</span>
                      </span>
                      <span className="text-gray-500 font-mono">
                        {new Date(ord.whatsappContactedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                      </span>
                    </div>
                  )}

                  {/* Audit Trail preview */}
                  {ord.editAuditLog && ord.editAuditLog.length > 1 && (
                    <div className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-xl border border-[#E2E2E2] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">
                        Último cambio por <strong>{ord.editAuditLog[ord.editAuditLog.length - 1].employee}</strong>:{' '}
                        {ord.editAuditLog[ord.editAuditLog.length - 1].description}
                      </span>
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
                    {ord.orderSource === 'qr' && (
                      <div className="rounded-xl border border-[#a9dbfa] bg-[#C1E7FF]/25 px-3 py-2 text-[11px] text-[#34313A]">
                        <div className="font-black">Pedido QR · versión {ord.currentVersion ?? 1}</div>
                        <div className="mt-0.5">
                          {ord.customerApprovalStatus === 'approved' && ord.customerApprovedVersion === ord.currentVersion
                            ? 'El cliente aprobó esta versión por WhatsApp.'
                            : ord.whatsappContactedAt
                              ? 'Después de recibir su respuesta, registrá la aprobación acá.'
                              : 'Contactá al cliente y confirmá por WhatsApp los productos e importe.'}
                        </div>
                      </div>
                    )}
                    {/* Botón WhatsApp prioritario (Requisito 2) */}
                    <div className="flex gap-1.5">
                      {(() => {
                        const rawPhone = ord.customerPhone || '';
                        const phoneVal = validateArgentinePhone(rawPhone);
                        const cleanPhone = phoneVal.cleanForWhatsApp || '5492235551234';
                        const message = formatWhatsAppOrderMessage(ord, businessDisplayName);
                        const waLink = buildWhatsAppLink(cleanPhone, message);
                        return (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordWhatsAppContact(ord.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition active:scale-98"
                            title="Abrir WhatsApp con mensaje preparado para el cliente"
                          >
                            <MessageCircle className="w-4 h-4 fill-white" />
                            <span>Contactar por WhatsApp</span>
                          </a>
                        );
                      })()}

                      <button
                        onClick={() => handleCopyWhatsAppMessage(ord)}
                        className="px-2.5 py-2 rounded-xl border border-[#E2E2E2] hover:bg-gray-100 text-[#34313A] transition"
                        title="Copiar mensaje preparado al portapapeles"
                      >
                        {copiedOrderId === ord.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {/* Editar comanda y Confirmar a Cocina */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenEditOrder(ord)}
                        className="py-2 px-3 rounded-xl border border-[#E2E2E2] text-[#34313A] font-bold text-xs hover:bg-[#FBEEB9]/40 transition flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#34313A]" />
                        <span>Editar Pedido</span>
                      </button>

                      {ord.orderSource === 'qr' && ord.customerApprovalStatus !== 'approved' ? (
                        <button
                          onClick={() => void recordQrCustomerApproval(ord)}
                          disabled={!ord.whatsappContactedAt}
                          className="py-2 px-3 rounded-xl bg-[#C1E7FF] hover:bg-[#a9dbfa] disabled:opacity-50 disabled:cursor-not-allowed text-[#34313A] font-black text-xs shadow-xs border border-[#a9dbfa] transition flex items-center justify-center gap-1"
                          title="Caja confirma que el cliente respondió y aprobó por WhatsApp"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34313A]" />
                          <span>Registrar aprobación</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => ord.orderSource === 'qr' ? void sendQrOrderToKitchen(ord) : confirmAndSendToKitchen(ord.id)}
                          disabled={ord.orderSource === 'qr' && ord.customerApprovedVersion !== ord.currentVersion}
                          className="py-2 px-3 rounded-xl bg-[#C1E7FF] hover:bg-[#a9dbfa] disabled:opacity-50 disabled:cursor-not-allowed text-[#34313A] font-black text-xs shadow-xs border border-[#a9dbfa] transition flex items-center justify-center gap-1"
                        >
                          <ChefHat className="w-3.5 h-3.5 text-[#34313A]" />
                          <span>A Cocina KDS</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setCancellationOrderId(ord.id)}
                      className="w-full py-1 text-center text-[11px] font-bold text-rose-600 hover:text-rose-800"
                    >
                      Rechazar o Cancelar Pedido
                    </button>
                  </div>
                )}

                {isConfirmed && (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'en_preparacion')}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#C1E7FF] text-[#34313A] font-black text-xs hover:bg-[#a9dbfa] border border-[#a9dbfa] transition"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Iniciar Preparación en Cocina</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditOrder(ord)}
                      className="w-full text-center text-[11px] font-bold text-[#34313A]/70 hover:underline"
                    >
                      Editar comanda en cocina
                    </button>
                  </div>
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

      {/* Edit Order Modal (Requirement Section 2-6) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34313A]/70 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-[#E2E2E2]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E2]">
              <div>
                <h3 className="font-black text-base text-[#34313A]">
                  Editar Pedido {editingOrder.orderNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Cliente: <strong>{editingOrder.customerName}</strong> • {editingOrder.locationCode}
                </p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-[#34313A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items list inside modal */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#34313A]">Productos en la Comanda:</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {editItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-[#E2E2E2] bg-gray-50/70 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#34313A] truncate">{item.productName}</div>
                      <div className="text-[10px] text-gray-500">
                        {formatCurrencyARS(item.unitPrice)} c/u
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-[#E2E2E2] rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => handleUpdateEditItemQuantity(index, -1)}
                          className="w-6 h-6 flex items-center justify-center text-[#34313A] hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#34313A]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateEditItemQuantity(index, 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#34313A] hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-black text-xs text-[#34313A] min-w-[70px] text-right">
                        {formatCurrencyARS(item.subtotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveEditItem(index)}
                        className="p-1 text-gray-400 hover:text-rose-600"
                        title="Quitar ítem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add product dropdown */}
            <div className="p-3 rounded-2xl bg-[#FBEEB9]/25 border border-[#E2E2E2] space-y-2">
              <label className="text-xs font-bold text-[#34313A]">Agregar plato o bebida adicional:</label>
              <div className="flex gap-2">
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => setSelectedProductToAdd(e.target.value)}
                  className="flex-1 bg-white p-2 rounded-xl border border-[#E2E2E2] text-xs font-semibold text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
                >
                  <option value="">Seleccionar del catálogo...</option>
                  {products
                    .filter((p) => p.isActive && p.isAvailable)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrencyARS(p.price)}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProductToEditOrder}
                  disabled={!selectedProductToAdd}
                  className="px-3.5 py-2 rounded-xl bg-[#C1E7FF] text-[#34313A] font-bold text-xs disabled:opacity-40 border border-[#a9dbfa]"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Reason and employee details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#34313A]">Empleado Responsable:</label>
                <input
                  type="text"
                  value={editEmployeeName}
                  onChange={(e) => setEditEmployeeName(e.target.value)}
                  placeholder="Ej: Mozo Playa / Lucas"
                  className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs font-bold text-[#34313A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#34313A]">Motivo / Modificación Acordada:</label>
                <input
                  type="text"
                  value={editChangeReason}
                  onChange={(e) => setEditChangeReason(e.target.value)}
                  placeholder="Ej: Cambio solicitado por WhatsApp"
                  className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-[#34313A]">Notas para Cocina y Entrega:</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Aclaraciones actualizadas..."
                  className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A]"
                />
              </div>
            </div>

            {/* Recalculated total and actions */}
            <div className="pt-3 border-t border-[#E2E2E2] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-500 block">Nuevo Total Recalculado:</span>
                <span className="text-lg font-black text-[#34313A]">
                  {formatCurrencyARS(editItems.reduce((acc, it) => acc + it.subtotal, 0))}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrderEdits}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-[#C1E7FF] hover:bg-[#a9dbfa] text-[#34313A] border border-[#a9dbfa] shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              placeholder="Ej: Cliente canceló por WhatsApp, falta de insumo, etc."
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
