import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import {
  Sparkles,
  QrCode,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Smartphone,
  ChefHat,
  ShoppingBag,
  BarChart3,
  ExternalLink,
  X,
  Check,
  Copy,
  MessageCircle,
  BookOpen,
  Layers,
  Award,
} from 'lucide-react';
import QRCode from 'qrcode';

export const DemoRoleSwitcherBar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    selectedLocationCode,
    setSelectedLocationCode,
    resetAllDemoData,
    businessDisplayName,
    locations,
  } = useBalneario();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [activeTutorialTab, setActiveTutorialTab] = useState<'oro' | 'platino' | 'diamante'>('platino');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Determinar rol activo actual según la vista
  const getActiveRole = () => {
    if (activeView === 'carta' || activeView === 'personalizar') return 'cliente';
    if (activeView === 'pos') return 'cajero';
    if (activeView === 'cocina') return 'cocina';
    return 'dueno';
  };

  const currentRole = getActiveRole();

  const handleSelectRole = (role: 'cliente' | 'cajero' | 'cocina' | 'dueno') => {
    if (role === 'cliente') {
      setSelectedLocationCode('C-01');
      setActiveView('carta');
    } else if (role === 'cajero') {
      setActiveView('pos');
    } else if (role === 'cocina') {
      setActiveView('cocina');
    } else {
      setActiveView('panel');
    }
  };

  const handleOpenQrModal = async () => {
    const demoSpot = locations.find((l) => l.code === selectedLocationCode) || locations[0] || { code: 'C-01' };
    const url = new URL(window.location.origin);
    url.searchParams.set('carpa', demoSpot.code);
    try {
      const dataUrl = await QRCode.toDataURL(url.toString(), {
        width: 320,
        margin: 2,
        color: { dark: '#34313A', light: '#FFFFFF' },
      });
      setQrCodeUrl(dataUrl);
      setShowQrModal(true);
    } catch (e) {
      console.error('Error generating QR', e);
    }
  };

  const handleCopyDemoLink = () => {
    const url = new URL(window.location.origin);
    url.searchParams.set('carpa', selectedLocationCode || 'C-01');
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('¿Restablecer todos los datos de la demo a los valores originales de fábrica?')) {
      resetAllDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 bg-[#34313A] text-white px-3.5 py-2 rounded-full shadow-2xl border-2 border-[#F68F57] hover:bg-[#47434e] transition text-xs font-black animate-bounce"
          title="Abrir barra de roles de demostración"
        >
          <Sparkles className="w-4 h-4 text-[#FBEEB9]" />
          <span>Barra de Demo</span>
          <ChevronUp className="w-3.5 h-3.5 text-gray-300" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-[#242129] via-[#34313A] to-[#242129] text-white border-b-2 border-[#F68F57] shadow-lg sticky top-0 z-[70]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tag Demo */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F68F57] text-white font-black text-[11px] tracking-wide uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FBEEB9]" />
              <span>Modo Demo</span>
            </span>
            <span className="hidden md:inline text-[11px] text-gray-300 font-medium">
              Elegí un rol para experimentar la app:
            </span>
          </div>

          {/* Selector de 4 Roles */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10 overflow-x-auto">
            {/* 1. Cliente en Carpa */}
            <button
              type="button"
              onClick={() => handleSelectRole('cliente')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-black transition text-xs ${
                currentRole === 'cliente'
                  ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Ver la carta digital interactiva desde la Carpa C-01"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#F68F57]" />
              <span>1. Cliente (Carpa)</span>
            </button>

            {/* 2. Cajero / Mostrador */}
            <button
              type="button"
              onClick={() => handleSelectRole('cajero')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-black transition text-xs ${
                currentRole === 'cajero'
                  ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Punto de venta táctil para cajeros y cobro rápido"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Cajero (POS)</span>
            </button>

            {/* 3. Cocina / KDS */}
            <button
              type="button"
              onClick={() => handleSelectRole('cocina')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-black transition text-xs ${
                currentRole === 'cocina'
                  ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Pantalla KDS en tiempo real para cocineros y barman"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Cocina (KDS)</span>
            </button>

            {/* 4. Dueño / Administrador */}
            <button
              type="button"
              onClick={() => handleSelectRole('dueno')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-black transition text-xs ${
                currentRole === 'dueno'
                  ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Panel del dueño: ocupación de playa, recaudación y arqueo de caja"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#FBEEB9]" />
              <span>4. Dueño (Panel)</span>
            </button>
          </div>

          {/* Acciones de Demo: Probar con Celular QR & Contratar & Reiniciar */}
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href="https://wa.me/5492236779934?text=Hola!%20Vi%20la%20demo%20de%20Gesti%C3%B3n%20Balnearia%20y%20me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n%20para%20implementarlo%20en%20mi%20balneario."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-xs"
              title="Contactar al asesor comercial por WhatsApp (+54 9 223 677-9934)"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Contratar</span>
            </a>

            {/* Botón de Tutorial Demo por Planes */}
            <button
              type="button"
              onClick={() => setShowTutorialModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition shadow-xs text-xs cursor-pointer"
              title="Abrir tutorial interactivo de cómo mostrar los planes Oro, Platino y Diamante"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tutorial Demo</span>
            </button>

            <button
              type="button"
              onClick={handleOpenQrModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black transition shadow-xs text-xs"
              title="Abrir código QR para probar con tu propio celular"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Probar en Celular</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
              title="Restablecer datos de fábrica de la demo"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetSuccess ? 'text-emerald-400 rotate-180 transition-transform' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Ocultar barra de demo"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal QR Interactivo para Celular */}
      {showQrModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-[#34313A] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C1E7FF] flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-[#34313A]" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Escaneá con tu celular</h3>
                  <p className="text-[11px] text-gray-500">Simulá estar en la Carpa {selectedLocationCode || 'C-01'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-[#f8f9fa] rounded-2xl border border-dashed border-gray-300">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Demostración"
                  className="w-56 h-56 rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-400 text-xs">
                  Generando QR...
                </div>
              )}
              <span className="text-[11px] font-bold text-gray-600 mt-2 text-center">
                Apuntá la cámara de tu teléfono para abrir la Carta Digital
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyDemoLink}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C1E7FF] hover:bg-[#a9dbfa] text-[#34313A] font-black text-xs transition flex items-center justify-center gap-2 shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>¡Enlace copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar enlace directo de la carpa</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  handleSelectRole('cliente');
                }}
                className="w-full py-2 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir vista en esta misma pestaña</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interactivo de Tutorial por Planes (ORO, PLATINO, DIAMANTE) */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 text-[#34313A]">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-black">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-[#34313A]">
                    Guía Rápida para Demostración a Clientes
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Aprendé a mostrar cada plan en 3 minutos exactos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Pestañas: ORO, PLATINO, DIAMANTE */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTutorialTab('oro')}
                className={`py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  activeTutorialTab === 'oro'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🥇 ORO</span>
                <span className="hidden sm:inline text-[10px] font-normal">(Básico)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTutorialTab('platino')}
                className={`py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  activeTutorialTab === 'platino'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🥈 PLATINO</span>
                <span className="hidden sm:inline text-[10px] font-normal">(El + Vendido)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTutorialTab('diamante')}
                className={`py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  activeTutorialTab === 'diamante'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>💎 DIAMANTE</span>
                <span className="hidden sm:inline text-[10px] font-normal">(Complejo Full)</span>
              </button>
            </div>

            {/* Contenido según el Plan Seleccionado */}
            {activeTutorialTab === 'oro' && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <div className="font-black text-amber-900 text-sm flex items-center gap-2">
                    <span>Plan ORO: Carta Digital QR & Pedidos a la Arena</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Ideal para paradores que no tienen cocina compleja o que quieren empezar digitalizando su menú con fotos de alta calidad, pedidos directos por WhatsApp y pagos con QR.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                    Pasos exactos para la reunión de venta:
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-amber-700">1. Tocá el botón "1. Cliente (Carpa)"</span>
                    <p className="text-gray-600 text-[11px]">
                      Mostrale al cliente cómo ve la carta un turista en la carpa o sombrilla. La pantalla es 100% limpia (sin menús raros de administración).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-amber-700">2. Probá la búsqueda por voz 🎙️ y categorías</span>
                    <p className="text-gray-600 text-[11px]">
                      Tocá el micrófono en la barra de búsqueda y decí <em>"hamburguesa"</em> o <em>"rabas"</em>. Destacá que el cliente no pierde tiempo buscando.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-amber-700">3. Armá un pedido y mostrá el pago interactivo con QR o Transferencia</span>
                    <p className="text-gray-600 text-[11px]">
                      Agregá un producto, tocá <strong>"VER PEDIDO"</strong>. Al seleccionar "QR", mostrale el código QR con el importe exacto; al seleccionar "Transferencia", mostrale el Alias listo con el botón <em>"Copiar Alias"</em>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-amber-700">4. Argumento de venta del Plan Oro:</span>
                    <p className="text-emerald-800 font-medium text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      "Con este plan te ahorrás imprimir cartas de papel que se arruinan con la arena y el agua, y los clientes piden un 30% más porque ven las fotos de los platos."
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowTutorialModal(false);
                    handleSelectRole('cliente');
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                >
                  Probar ahora la Vista Cliente (Carpa)
                </button>
              </div>
            )}

            {activeTutorialTab === 'platino' && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-1">
                  <div className="font-black text-cyan-950 text-sm flex items-center gap-2">
                    <span>Plan PLATINO: Circuito Integral Gastronómico & Playa (El Más Vendido)</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Incluye todo lo de Oro + <strong>Punto de Venta POS táctil</strong> para cajeros, <strong>Pantalla KDS en Cocina</strong> con timers automáticos de demora y <strong>Arqueo de Caja</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                    El truco mágico para cerrar la venta (Demo en 4 toques):
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-cyan-700">Paso A: Creá un pedido desde "1. Cliente (Carpa)"</span>
                    <p className="text-gray-600 text-[11px]">
                      Elegí una hamburguesa y confirmá el pedido para la Carpa C-01.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-cyan-700">Paso B: Pasá a "2. Cajero (POS)"</span>
                    <p className="text-gray-600 text-[11px]">
                      Mostrale la pantalla táctil de cobro. El cajero ve las comandas entrantes, puede cobrar en efectivo, tarjeta o QR, y con 1 clic enviar la orden a cocina.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-cyan-700">Paso C: Pasá a "3. Cocina (KDS)"</span>
                    <p className="text-gray-600 text-[11px]">
                      Mostrale la pantalla del cocinero. Tiene un cronómetro en tiempo real (verde &lt; 10 min, amarillo 10-20 min, rojo &gt; 20 min). Tocá <strong>"MARCAR LISTO"</strong>: suena la campana y avisa al mozo.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-cyan-700">Paso D: Argumento de venta Platino:</span>
                    <p className="text-emerald-800 font-medium text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      "Eliminás los papelitos de comanda perdidos, el cocinero sabe exactamente qué sacar primero y el mozo no corre buscando la carpa. Se pagan los $850.000 de la temporada con 2 mesas recuperadas al mediodía."
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTutorialModal(false);
                      handleSelectRole('cajero');
                    }}
                    className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition"
                  >
                    Ver Pantalla POS Cajero
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTutorialModal(false);
                      handleSelectRole('cocina');
                    }}
                    className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                  >
                    Ver Pantalla Cocina KDS
                  </button>
                </div>
              </div>
            )}

            {activeTutorialTab === 'diamante' && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                  <div className="font-black text-purple-950 text-sm flex items-center gap-2">
                    <span>Plan DIAMANTE: Gestión Total de Balneario & Eventos</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Para los balnearios más grandes de la costa (200 a 400 carpas): incluye <strong>Mapa Interactivo de Playa</strong>, <strong>Módulo de Reservas de Sombra por Temporada</strong>, subdominio propio y múltiples KDS para barra y cocina.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                    Qué mostrar en la demostración:
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-purple-700">1. Mapa de Playa Interactivo en "4. Dueño"</span>
                    <p className="text-gray-600 text-[11px]">
                      Mostrale la distribución por sectores: Carpas VIP frente al mar, Sombrillas, Mesas Deck y Barra. Explicá los 4 colores de estado en 1 segundo: <strong>Verde (Disponible)</strong>, <strong>Rojo (Ocupado)</strong>, <strong>Azul (Reservado)</strong> y <strong>Amarillo (Limpieza)</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-purple-700">2. Módulo de Reservas de Sombra</span>
                    <p className="text-gray-600 text-[11px]">
                      En el menú lateral, abrí <strong>"Reservas"</strong>. Mostrale cómo se reserva una carpa por día, quincena o toda la temporada con el nombre del titular y pago de seña.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-purple-700">3. Pantallas de Cocina y Barra Separadas</span>
                    <p className="text-gray-600 text-[11px]">
                      Los tragos van directo a la barra de playa; los platos calientes van a la cocina central, sin interferencias.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1.5">
                    <span className="font-black text-purple-700">4. Argumento de venta Diamante:</span>
                    <p className="text-emerald-800 font-medium text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      "Una sola carpa en Playa Grande o Cariló se alquila a $4.500.000 por temporada. El Plan Diamante completo cuesta $1.390.000: con un tercio de lo que cobran por UNA carpa, tienen todo el balneario funcionando en piloto automático todo el año."
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowTutorialModal(false);
                    handleSelectRole('dueno');
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition"
                >
                  Abrir Panel del Dueño & Mapa de Playa
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
