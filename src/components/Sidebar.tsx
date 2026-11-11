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
      badgeColor: 'bg-[#F59E0B] text-white',
    },
    { id: 'pos', label: 'Ventas / POS', icon: <CreditCard className="w-4 h-4" /> },
    {
      id: 'cocina',
      label: 'Cocina',
      icon: <ChefHat className="w-4 h-4" />,
      badge: kitchenOrdersCount,
      badgeColor: 'bg-[#0F2942] text-white',
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
          className="fixed inset-0 z-40 bg-[#0F2942]/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container in Blanco (#FFFFFF) and border #E2E8F0 */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 shadow-sm ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Logo & Brand with exact tagline */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={businessDisplayName}
                className="w-10 h-10 rounded-2xl object-cover border border-gray-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#0F2942] flex items-center justify-center text-white shadow-sm relative overflow-hidden shrink-0">
                <Sun className="w-5 h-5 text-[#F59E0B] absolute -top-1 -right-1" />
                <Waves className="w-5 h-5 text-[#0284C7]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-black tracking-tight text-[#0F172A] leading-tight truncate">
                {businessDisplayName || config.branchName}
              </div>
              <div className="text-[11px] font-semibold text-[#0284C7] leading-tight mt-0.5 truncate">
                {config.slogan || 'Tu balneario, mejor gestionado'}
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-[#0F172A] hover:bg-gray-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button: #0284C7 with white text */}
        <div className="px-3 pt-3">
          <button
            onClick={handleQuickNewSale}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs shadow-xs border border-[#0284C7] transition group active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
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
                    ? 'bg-[#E0F2FE] text-[#0369A1] font-black border-l-4 border-l-[#0284C7] border-y border-r border-sky-100 shadow-xs'
                    : 'text-[#64748B] font-semibold hover:text-[#0F172A] hover:bg-[#F0F4F8] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#0284C7]' : 'text-[#64748B]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-[#0284C7] text-white' : item.badgeColor || 'bg-gray-200 text-gray-700'
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
        <div className="p-3 border-t border-[#E2E8F0] bg-white space-y-2.5">
          {/* Minimalist Summer Beach Illustration in Warm Sand (#FFFBEB) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] p-2.5 flex items-center justify-between">
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#92400E] block">
                Costa Atlántica
              </span>
              <span className="text-[11px] font-bold text-[#B45309] block">
                Mar del Plata • Temporada
              </span>
            </div>
            
            {/* Minimalist Beach SVG */}
            <svg
              className="w-12 h-10 text-[#0F2942] opacity-90 shrink-0"
              viewBox="0 0 64 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Sun */}
              <circle cx="48" cy="14" r="8" fill="#F59E0B" opacity="0.9" />
              <circle cx="48" cy="14" r="5" fill="#FFFBEB" />
              {/* Dune / Sand line */}
              <path
                d="M0 40C12 36 24 42 36 38C48 34 54 40 64 37V48H0V40Z"
                fill="#FFFBEB"
                stroke="#FDE68A"
                strokeWidth="1"
              />
              {/* Wave */}
              <path
                d="M0 44C16 41 32 46 48 43C56 41 60 44 64 43"
                stroke="#0284C7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Palm Tree minimal */}
              <path
                d="M16 42C16 32 20 22 25 18"
                stroke="#0F2942"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M25 18C21 14 14 16 12 19"
                stroke="#0F2942"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M25 18C28 13 35 15 37 18"
                stroke="#0F2942"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M25 18C25 12 28 8 32 8"
                stroke="#0F2942"
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
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0F4F8] rounded-xl transition"
            title="Reiniciar datos de demostración"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Reiniciar Datos Demo</span>
          </button>

          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
            <span>Gestión Balnearia 2026</span>
            <span className="flex items-center gap-1 text-[#0284C7] font-bold">
              <HelpCircle className="w-3 h-3 text-[#0284C7]" /> Soporte
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
