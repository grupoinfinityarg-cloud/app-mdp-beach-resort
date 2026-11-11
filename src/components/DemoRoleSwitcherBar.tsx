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
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Determinar rol activo actual según la vista
  const getActiveRole = () => {
    if (activeView === 'carta' || activeView === 'personalizar') return 'cliente';
    if (activeView === 'pos') return 'mozo';
    if (activeView === 'cocina') return 'cocina';
    return 'dueno';
  };

  const currentRole = getActiveRole();

  const handleSelectRole = (role: 'cliente' | 'mozo' | 'cocina' | 'dueno') => {
    if (role === 'cliente') {
      setSelectedLocationCode('C-01');
      setActiveView('carta');
    } else if (role === 'mozo') {
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

            {/* 2. Mozo / Mostrador */}
            <button
              type="button"
              onClick={() => handleSelectRole('mozo')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-black transition text-xs ${
                currentRole === 'mozo'
                  ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Punto de venta táctil para mozos y cobro rápido"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Mozo (POS)</span>
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

          {/* Acciones de Demo: Probar con Celular QR & Reiniciar */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handleOpenQrModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black transition shadow-xs"
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
    </>
  );
};
