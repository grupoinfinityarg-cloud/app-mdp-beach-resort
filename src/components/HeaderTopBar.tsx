import React, { useState, useEffect } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Smartphone,
  SlidersHorizontal,
  CreditCard,
  LayoutDashboard,
  Menu,
  Bell,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  BellRing,
  LogOut,
  X,
} from 'lucide-react';

interface HeaderTopBarProps {
  onToggleMobileSidebar?: () => void;
  onSignOut?: () => void;
}

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({ onToggleMobileSidebar, onSignOut }) => {
  const {
    activeView, setActiveView, setSelectedLocationCode, cart, orders, cashRegister,
    guestAssistanceRequests, resolveGuestAssistanceRequest,
  } = useBalneario();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  // Live real-time clock updating every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Notifications calculation
  const pendingOrders = orders.filter((o) => o.status === 'pendiente_confirmacion');
  const readyOrders = orders.filter((o) => o.status === 'listo_para_entrega');
  const totalNotifications = pendingOrders.length + readyOrders.length + guestAssistanceRequests.length;

  const formattedDate = currentTime.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = currentTime.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="sticky top-0 z-40 bg-[#34313A] text-white border-b border-[#47434e] shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger + Personalized greetings */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 -ml-1 text-gray-300 hover:text-white rounded-xl hover:bg-white/10 transition"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white tracking-tight">
                ¡Hola, equipo!
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F68F57] text-white">
                DEMO LOCAL
              </span>
            </div>
            <p className="text-[11px] text-[#C1E7FF] font-medium truncate leading-tight mt-0.5">
              Todo listo para un gran día en la playa
            </p>
          </div>
        </div>

        {/* Center: Live Date & Time + Logged User */}
        <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-2xl text-xs">
          {/* Clock */}
          <div className="flex items-center gap-1.5 text-gray-200 font-semibold">
            <Clock className="w-3.5 h-3.5 text-[#FBEEB9]" />
            <span className="capitalize">{formattedDate}</span>
            <span className="text-[#C1E7FF] font-black">•</span>
            <span className="font-mono text-white font-black">{formattedTime} hs</span>
          </div>

          <div className="h-4 w-[1px] bg-white/20" />

          {/* User role */}
          <div className="flex items-center gap-1.5 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#C1E7FF]" />
            <span className="text-gray-300 font-medium">Operador:</span>
            <span className="text-white font-bold">{cashRegister.cashierName}</span>
          </div>
        </div>

        {/* Right switchers & notifications */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition"
              title="Avisos y Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F68F57] text-white font-black text-[10px] flex items-center justify-center animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Modal */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-[#34313A] rounded-3xl p-4 shadow-2xl border border-[#E2E2E2] z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E2]">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#F68F57]" />
                    <h4 className="font-black text-xs text-[#34313A]">Avisos & Notificaciones</h4>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-[#34313A]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {guestAssistanceRequests.map((request) => (
                    <div key={request.id} className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                      <div className="font-black text-rose-700 flex items-center gap-1">
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Llamado de mozo · {request.locationCode}</span>
                      </div>
                      <p className="text-[11px] text-[#34313A]/80 mt-1">
                        {request.locationName}{request.requestCount > 1 ? ` · ${request.requestCount} llamados` : ''}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedLocationCode(request.locationCode);
                            setActiveView('pos');
                            setShowNotifications(false);
                          }}
                          className="text-[11px] font-bold underline text-[#34313A]"
                        >
                          Ver ubicación en POS →
                        </button>
                        <button
                          onClick={() => void resolveGuestAssistanceRequest(request.id)}
                          className="rounded-lg bg-white border border-rose-200 px-2 py-1 text-[10px] font-black text-rose-700 hover:bg-rose-100"
                        >
                          Marcar atendido
                        </button>
                      </div>
                    </div>
                  ))}

                  {pendingOrders.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-[#F68F57]/15 border border-[#F68F57]/30 text-xs">
                      <div className="font-black text-[#F68F57] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{pendingOrders.length} pedido(s) por confirmar</span>
                      </div>
                      <p className="text-[11px] text-[#34313A]/80 mt-1">
                        Hay clientes esperando aprobación de pedido desde carpas o sombrillas.
                      </p>
                      <button
                        onClick={() => {
                          setActiveView('comandas');
                          setShowNotifications(false);
                        }}
                        className="mt-2 text-[11px] font-bold underline text-[#34313A]"
                      >
                        Ver pedidos pendientes →
                      </button>
                    </div>
                  )}

                  {readyOrders.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-[#C1E7FF]/40 border border-[#C1E7FF] text-xs">
                      <div className="font-black text-[#34313A] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{readyOrders.length} orden(es) listas en cocina</span>
                      </div>
                      <p className="text-[11px] text-[#34313A]/80 mt-1">
                        Los platos están listos en la barra para despacho hacia la playa.
                      </p>
                      <button
                        onClick={() => {
                          setActiveView('cocina');
                          setShowNotifications(false);
                        }}
                        className="mt-2 text-[11px] font-bold underline text-[#34313A]"
                      >
                        Ver KDS de Cocina →
                      </button>
                    </div>
                  )}

                  {totalNotifications === 0 && (
                    <div className="py-6 text-center text-xs text-gray-400">
                      ✓ No hay avisos pendientes en este momento.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Module Switchers */}
          <button
            onClick={() => setActiveView('carta')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'carta'
                ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm ring-1 ring-[#C1E7FF]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Ver carta digital para clientes móviles"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Carta QR</span>
          </button>

          <button
            onClick={() => setActiveView('personalizar')}
            className={`relative hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'personalizar'
                ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm ring-1 ring-[#C1E7FF]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Personalizar producto y ver carrito"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Carrito</span>
            {totalCartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#F68F57] text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('pos')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'pos'
                ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm ring-1 ring-[#C1E7FF]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Punto de venta y cobro directo"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">POS</span>
          </button>

          <button
            onClick={() => setActiveView('panel')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'panel'
                ? 'bg-[#C1E7FF] text-[#34313A] shadow-sm ring-1 ring-[#C1E7FF]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Panel de administración y control"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Inicio</span>
          </button>

          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton variant="header" />
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
