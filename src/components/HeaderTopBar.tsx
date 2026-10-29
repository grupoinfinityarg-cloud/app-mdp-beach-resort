import React from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Smartphone,
  SlidersHorizontal,
  CreditCard,
  LayoutDashboard,
  Gem,
  Menu,
} from 'lucide-react';

interface HeaderTopBarProps {
  onToggleMobileSidebar?: () => void;
}

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({ onToggleMobileSidebar }) => {
  const { activeView, setActiveView, cart, config } = useBalneario();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#111d16] text-white border-b border-emerald-950/80 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left branding & stage badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 -ml-1 text-gray-300 hover:text-white rounded-lg hover:bg-emerald-900/50"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              DEMO ETAPA 1
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold tracking-wide truncate">
            <span className="text-white font-extrabold uppercase">GESTIÓN BALNEARIA</span>
            <span className="text-emerald-500/60 font-light">|</span>
            <span className="text-emerald-200/80 font-normal truncate hidden lg:inline">
              {config.branchName} • Mar del Plata
            </span>
          </div>
        </div>

        {/* Right switchers matching the reference design */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Carta Digital */}
          <button
            onClick={() => setActiveView('carta')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'carta'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-emerald-900/40'
            }`}
            title="Ver carta digital para clientes móviles"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden xs:inline">Carta Digital</span>
          </button>

          {/* Personalizar & Carrito */}
          <button
            onClick={() => setActiveView('personalizar')}
            className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'personalizar'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-emerald-900/40'
            }`}
            title="Personalizar producto y ver carrito"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Carrito</span>
            {totalCartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px] flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* POS Directo */}
          <button
            onClick={() => setActiveView('pos')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'pos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-emerald-900/40'
            }`}
            title="Punto de venta y cobro directo"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">POS Directo</span>
          </button>

          {/* Panel Salón / Dashboard */}
          <button
            onClick={() => setActiveView('panel')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'panel'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-emerald-900/40'
            }`}
            title="Panel de administración y control"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden lg:inline">Panel Balneario</span>
          </button>

          {/* Plan badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#182a20] border border-emerald-700/40 text-[11px] font-bold text-emerald-300">
            <Gem className="w-3.5 h-3.5 text-emerald-400" />
            <span>{config.activePlan}</span>
          </div>

          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton variant="header" />
          </div>
        </div>
      </div>
    </header>
  );
};
