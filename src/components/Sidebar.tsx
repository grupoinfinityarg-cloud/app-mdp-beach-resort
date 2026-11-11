import React from 'react';
import { useBalneario, ActiveView } from '../context/BalnearioContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  LayoutDashboard,
  Map,
  Umbrella,
  Smartphone,
  ClipboardList,
  ChefHat,
  CreditCard,
  UtensilsCrossed,
  Tag,
  CalendarCheck2,
  Wallet,
  BarChart3,
  Settings,
  X,
  PlusCircle,
  HelpCircle,
  RotateCcw,
  Sun,
  Waves,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    activeView,
    setActiveView,
    orders,
    resetAllDemoData,
    setSelectedLocationCode,
    locations,
    config,
    businessDisplayName,
  } = useBalneario();

  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente_confirmacion').length;
  const kitchenOrdersCount = orders.filter(
    (o) => o.status === 'confirmado_en_cocina' || o.status === 'en_preparacion'
  ).length;

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'panel', label: 'Inicio', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'sectores', label: 'Sectores', icon: <Map className="w-4 h-4" /> },
    { id: 'carpas', label: 'Carpas & Sombrillas', icon: <Umbrella className="w-4 h-4" /> },
    { id: 'carta', label: 'Carta Digital', icon: <Smartphone className="w-4 h-4" /> },
    {
      id: 'comandas',
      label: 'Pedidos & Comandas',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: pendingOrdersCount,
      badgeColor: 'bg-[#F68F57] text-white',
    },
    { id: 'pos', label: 'Ventas / POS', icon: <CreditCard className="w-4 h-4" /> },
    {
      id: 'cocina',
      label: 'Cocina',
      icon: <ChefHat className="w-4 h-4" />,
      badge: kitchenOrdersCount,
      badgeColor: 'bg-[#34313A] text-white',
    },
    { id: 'productos', label: 'Menú & Productos', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'promociones', label: 'Promociones', icon: <Tag className="w-4 h-4" /> },
    { id: 'reservas', label: 'Clientes', icon: <CalendarCheck2 className="w-4 h-4" /> },
    { id: 'caja', label: 'Caja & Arqueos', icon: <Wallet className="w-4 h-4" /> },
    { id: 'reportes', label: 'Reportes', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSelectNav = (view: ActiveView) => {
    setActiveView(view);
    onCloseMobile();
  };

  const handleQuickNewSale = () => {
    const firstAvailable = locations.find((l) => l.status === 'disponible') || locations[0];
    if (firstAvailable) {
      setSelectedLocationCode(firstAvailable.code);
    }
    setActiveView('pos');
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#34313A]/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container in Blanco (#FFFFFF) and border #E2E2E2 */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#E2E2E2] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 shadow-sm ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Logo & Brand with exact tagline */}
        <div className="p-4 border-b border-[#E2E2E2] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={businessDisplayName}
                className="w-10 h-10 rounded-2xl object-cover border border-gray-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#34313A] flex items-center justify-center text-white shadow-sm relative overflow-hidden shrink-0">
                <Sun className="w-5 h-5 text-[#FBEEB9] absolute -top-1 -right-1" />
                <Waves className="w-5 h-5 text-[#C1E7FF]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-black tracking-tight text-[#34313A] leading-tight truncate">
                {businessDisplayName || config.branchName}
              </div>
              <div className="text-[11px] font-semibold text-[#F68F57] leading-tight mt-0.5 truncate">
                {config.slogan || 'Tu balneario, mejor gestionado'}
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-[#34313A] hover:bg-gray-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button: #C1E7FF with dark #34313A text */}
        <div className="px-3 pt-3">
          <button
            onClick={handleQuickNewSale}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#C1E7FF] hover:bg-[#aadefc] text-[#34313A] font-extrabold text-xs shadow-xs border border-[#aadefc] transition group active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 text-[#34313A] group-hover:rotate-90 transition-transform duration-200" />
            <span>Abrir Mesa / Venta POS</span>
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#C1E7FF] text-[#34313A] font-black shadow-xs border border-[#aadefc]'
                    : 'text-[#34313A] font-semibold hover:bg-[#FBEEB9]/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#34313A]' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-[#34313A] text-white' : item.badgeColor || 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Summer Beach Minimalist Illustration & Utilities */}
        <div className="p-3 border-t border-[#E2E2E2] bg-white space-y-2.5">
          {/* Minimalist Summer Beach Illustration */}
          <div className="relative overflow-hidden rounded-2xl bg-[#FBEEB9]/50 border border-[#E2E2E2] p-2.5 flex items-center justify-between">
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#34313A] block">
                Costa Atlántica
              </span>
              <span className="text-[11px] font-bold text-[#F68F57] block">
                Mar del Plata • Temporada
              </span>
            </div>
            
            {/* Minimalist Beach SVG */}
            <svg
              className="w-12 h-10 text-[#34313A] opacity-90 shrink-0"
              viewBox="0 0 64 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Sun */}
              <circle cx="48" cy="14" r="8" fill="#F68F57" opacity="0.9" />
              <circle cx="48" cy="14" r="5" fill="#FBEEB9" />
              {/* Dune / Sand line */}
              <path
                d="M0 40C12 36 24 42 36 38C48 34 54 40 64 37V48H0V40Z"
                fill="#FBEEB9"
                stroke="#E2E2E2"
                strokeWidth="1"
              />
              {/* Wave */}
              <path
                d="M0 44C16 41 32 46 48 43C56 41 60 44 64 43"
                stroke="#C1E7FF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Palm Tree minimal */}
              <path
                d="M16 42C16 32 20 22 25 18"
                stroke="#34313A"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M25 18C21 14 14 16 12 19"
                stroke="#34313A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M25 18C28 13 35 15 37 18"
                stroke="#34313A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M25 18C25 12 28 8 32 8"
                stroke="#34313A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* PWA in sidebar */}
          <PWAInstallButton variant="sidebar" />

          {/* Reset demo data */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  '¿Deseás reiniciar todos los datos a la demostración inicial de Mar del Plata?'
                )
              ) {
                resetAllDemoData();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-bold text-[#34313A]/70 hover:text-[#34313A] hover:bg-[#FBEEB9]/40 rounded-xl transition"
            title="Reiniciar datos de demostración"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#34313A]" />
            <span>Reiniciar Datos Demo</span>
          </button>

          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
            <span>Gestión Balnearia 2026</span>
            <span className="flex items-center gap-1 text-[#34313A] font-bold">
              <HelpCircle className="w-3 h-3 text-[#34313A]" /> Soporte
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
