import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#C1E7FF] bg-white/5 border border-[#C1E7FF]/50 rounded-full">
        <Check className="w-3.5 h-3.5 text-[#C1E7FF]" />
        <span>PWA Instalada</span>
      </div>
    );
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
    }
  };

  if (isInstallable) {
    return (
      <>
        <button
          onClick={handleInstall}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
            variant === 'sidebar'
              ? 'w-full justify-center bg-[#C1E7FF] text-[#34313A] hover:bg-[#a9dbfa] border border-[#a9dbfa]'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          } ${className}`}
          title="Instalar Gestión Balnearia en tu dispositivo"
        >
          <Download className="w-3.5 h-3.5 text-[#34313A]" />
          <span>Instalar PWA</span>
        </button>

        {justInstalled && (
          <div className="fixed bottom-4 right-4 z-50 bg-[#34313A] text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs border border-[#C1E7FF]">
            <Check className="w-4 h-4 text-[#C1E7FF]" />
            <span>¡Aplicación instalada con éxito!</span>
          </div>
        )}
      </>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border border-[#C1E7FF]/50 text-[#C1E7FF] hover:bg-[#C1E7FF]/10 ${className}`}
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34313A]/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-[#34313A] border border-[#E2E2E2]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E2E2]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#34313A] flex items-center justify-center text-[#FBEEB9] font-black text-sm">
                    GB
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[#34313A]">Instalar Gestión Balnearia</h3>
                    <p className="text-xs text-gray-500">En Safari iOS (iPhone / iPad)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#34313A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#FBEEB9]/20 border border-[#E2E2E2]">
                  <span className="w-5 h-5 rounded-full bg-[#C1E7FF] text-[#34313A] flex items-center justify-center font-black text-xs shrink-0">
                    1
                  </span>
                  <p>
                    Tocá el botón <strong>Compartir</strong> en la barra inferior de Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#FBEEB9]/20 border border-[#E2E2E2]">
                  <span className="w-5 h-5 rounded-full bg-[#C1E7FF] text-[#34313A] flex items-center justify-center font-black text-xs shrink-0">
                    2
                  </span>
                  <p>
                    Seleccioná <strong>"Agregar a pantalla de inicio"</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#FBEEB9]/20 border border-[#E2E2E2]">
                  <span className="w-5 h-5 rounded-full bg-[#C1E7FF] text-[#34313A] flex items-center justify-center font-black text-xs shrink-0">
                    3
                  </span>
                  <p>
                    Tocá <strong>"Agregar"</strong> arriba a la derecha.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-[#C1E7FF] py-2.5 text-xs font-black text-[#34313A] hover:bg-[#a9dbfa] transition shadow-xs border border-[#a9dbfa]"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={() => {
        alert(
          'Para instalar la aplicación:\n1. Desde Chrome/Edge: menú o ícono de instalación en la barra de direcciones.\n2. Desde el móvil: "Instalar aplicación" o "Agregar a pantalla principal".'
        );
      }}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl text-gray-200 hover:bg-white/10 border border-white/20 ${className}`}
      title="Información de instalación PWA"
    >
      <Download className="w-3.5 h-3.5 text-[#C1E7FF]" />
      <span>Instalar App</span>
    </button>
  );
};
