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
    config,
    setSelectedLocationCode,
    locations,
  } = useBalneario();

  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente_confirmacion').length;
  const kitchenOrdersCount = orders.filter(
    (o) => o.status === 'confirmado_en_cocina' || o.status === 'en_preparacion'
  ).length;

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'panel', label: 'Panel Principal', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'sectores', label: 'Mapa & Sectores', icon: <Map className="w-4 h-4" /> },
    { id: 'carpas', label: 'Carpas & Sombrillas', icon: <Umbrella className="w-4 h-4" /> },
    { id: 'carta', label: 'Carta Digital (QR)', icon: <Smartphone className="w-4 h-4" /> },
    {
      id: 'comandas',
      label: 'Pedidos & Comandas',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: pendingOrdersCount,
      badgeColor: 'bg-[#F47B35] text-white', // Naranja gastronómico para pedidos nuevos
    },
    {
      id: 'cocina',
      label: 'Cocina (KDS)',
      icon: <ChefHat className="w-4 h-4" />,
      badge: kitchenOrdersCount,
      badgeColor: 'bg-[#202428] text-white',
    },
    { id: 'pos', label: 'Punto de Venta POS', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'productos', label: 'Menú & Productos', icon: <UtensilsCrossed className="w-4 h-4" /> },
    {
      id: 'promociones',
      label: 'Promociones',
      icon: <Tag className="w-4 h-4" />,
      badge: undefined,
    },
    { id: 'reservas', label: 'Clientes & Reservas', icon: <CalendarCheck2 className="w-4 h-4" /> },
    { id: 'caja', label: 'Caja & Medios de Pago', icon: <Wallet className="w-4 h-4" /> },
    { id: 'reportes', label: 'Reportes & Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'configuracion', label: 'Configuración & Planes', icon: <Settings className="w-4 h-4" /> },
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
          className="fixed inset-0 z-40 bg-[#202428]/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container in Blanco (#FFFFFF) and Negro grafito border */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#FFFFFF] border-r border-gray-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Logo & Brand */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#202428] flex items-center justify-center text-white shadow-sm relative overflow-hidden">
              <Sun className="w-5 h-5 text-[#FFD43B] absolute -top-1 -right-1" />
              <Waves className="w-5 h-5 text-[#55C7E8]" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-[#202428] leading-none">
                GESTIÓN BALNEARIA
              </div>
              <div className="text-[10px] font-bold text-[#F47B35] uppercase tracking-wider mt-1">
                {config.branchName}
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-[#202428] hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button: Naranja gastronómico (#F47B35) para iniciar acciones de venta */}
        <div className="px-3 pt-3">
          <button
            onClick={handleQuickNewSale}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#F47B35] text-white font-extrabold text-xs hover:bg-[#e06822] shadow-md shadow-[#F47B35]/25 transition group active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
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
                    ? 'bg-[#55C7E8] text-[#202428] font-black shadow-xs' // Celeste mar activo con texto negro grafito para contraste óptimo
                    : 'text-gray-700 font-semibold hover:bg-gray-100 hover:text-[#202428]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#202428]' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-[#202428] text-white' : item.badgeColor || 'bg-gray-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom utility footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/70 space-y-2">
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
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-bold text-gray-500 hover:text-[#202428] hover:bg-gray-200/60 rounded-xl transition"
            title="Reiniciar datos de demostración"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Datos Demo</span>
          </button>

          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 pt-1">
            <span>Identidad Oficial 2026</span>
            <span className="flex items-center gap-1 text-[#202428] font-bold">
              <HelpCircle className="w-3 h-3 text-[#55C7E8]" /> Soporte
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
