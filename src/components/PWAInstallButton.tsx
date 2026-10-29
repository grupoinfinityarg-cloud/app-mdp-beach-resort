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
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-full">
        <Check className="w-3.5 h-3.5" />
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
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
            variant === 'sidebar'
              ? 'w-full justify-center bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
          } ${className}`}
          title="Instalar Gestión Balnearia en tu dispositivo"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar PWA</span>
        </button>

        {justInstalled && (
          <div className="fixed bottom-4 right-4 z-50 bg-emerald-800 text-white p-3 rounded-xl shadow-xl flex items-center gap-2 text-xs">
            <Check className="w-4 h-4 text-emerald-300" />
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
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border border-emerald-700/50 text-emerald-200 hover:bg-emerald-900/40 ${className}`}
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-gray-900">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                    GB
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Instalar Gestión Balnearia</h3>
                    <p className="text-xs text-gray-500">En Safari iOS (iPhone / iPad)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </span>
                  <p>
                    Tocá el botón <strong>Compartir</strong> (ícono de cuadrado con flecha hacia arriba) en la barra inferior de Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </span>
                  <p>
                    Deslizá las opciones y seleccioná <strong>"Agregar a pantalla de inicio"</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </span>
                  <p>
                    Tocá <strong>"Agregar"</strong> arriba a la derecha para tener acceso rápido como app nativa.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback direct shortcut badge for desktop Chrome or when prompt not fired yet
  return (
    <button
      onClick={() => {
        alert(
          'Para instalar la aplicación:\n1. Desde Chrome/Edge: hacé clic en el ícono de instalación en la barra de direcciones.\n2. Desde el móvil: menú del navegador > "Instalar aplicación" o "Agregar a pantalla principal".'
        );
      }}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-300 hover:bg-emerald-900/40 border border-emerald-800/40 ${className}`}
      title="Información de instalación PWA"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Instalar App</span>
    </button>
  );
};
