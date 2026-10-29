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
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'cocina',
      label: 'Cocina (KDS)',
      icon: <ChefHat className="w-4 h-4" />,
      badge: kitchenOrdersCount,
      badgeColor: 'bg-emerald-600 text-white',
    },
    { id: 'pos', label: 'Punto de Venta POS', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'productos', label: 'Menú & Productos', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'promociones', label: 'Promociones', icon: <Tag className="w-4 h-4" /> },
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Logo & Brand */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-950 flex items-center justify-center text-white shadow-sm relative overflow-hidden">
              <Sun className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 opacity-80" />
              <Waves className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-gray-900 leading-none">
                GESTIÓN BALNEARIA
              </div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-1">
                {config.branchName}
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="px-3 pt-3">
          <button
            onClick={handleQuickNewSale}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md shadow-emerald-700/20 transition group"
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-emerald-900' : item.badgeColor || 'bg-gray-200'
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
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-medium text-gray-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
            title="Reiniciar datos de demostración"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Datos Demo</span>
          </button>

          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 pt-1">
            <span>Versión 1.0 (Mar del Plata)</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <HelpCircle className="w-3 h-3" /> Soporte
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
