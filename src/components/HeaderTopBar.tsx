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
    <header className="sticky top-0 z-40 bg-[#202428] text-white border-b border-[#2d3238] shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left branding & stage badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 -ml-1 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD43B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFD43B]"></span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-[#FFD43B] text-[#202428]">
              DEMO ETAPA 1
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold tracking-wide truncate">
            <span className="text-white font-black uppercase tracking-tight">GESTIÓN BALNEARIA</span>
            <span className="text-[#55C7E8] font-bold">|</span>
            <span className="text-gray-300 font-medium truncate hidden lg:inline">
              {config.branchName} • Mar del Plata
            </span>
          </div>
        </div>

        {/* Right switchers with Celeste Mar for active state */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Carta Digital */}
          <button
            onClick={() => setActiveView('carta')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'carta'
                ? 'bg-[#55C7E8] text-[#202428] shadow-sm ring-1 ring-[#55C7E8]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Ver carta digital para clientes móviles"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Carta Digital</span>
          </button>

          {/* Personalizar & Carrito */}
          <button
            onClick={() => setActiveView('personalizar')}
            className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'personalizar'
                ? 'bg-[#55C7E8] text-[#202428] shadow-sm ring-1 ring-[#55C7E8]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Personalizar producto y ver carrito"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Carrito</span>
            {totalCartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#F47B35] text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* POS Directo */}
          <button
            onClick={() => setActiveView('pos')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'pos'
                ? 'bg-[#55C7E8] text-[#202428] shadow-sm ring-1 ring-[#55C7E8]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Punto de venta y cobro directo"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden md:inline">POS Directo</span>
          </button>

          {/* Panel Salón / Dashboard */}
          <button
            onClick={() => setActiveView('panel')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'panel'
                ? 'bg-[#55C7E8] text-[#202428] shadow-sm ring-1 ring-[#55C7E8]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Panel de administración y control"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Panel Balneario</span>
          </button>

          {/* Plan badge (Amarillo sol) */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFD43B]/15 border border-[#FFD43B]/40 text-[11px] font-black text-[#FFD43B]">
            <Gem className="w-3.5 h-3.5 text-[#FFD43B]" />
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
