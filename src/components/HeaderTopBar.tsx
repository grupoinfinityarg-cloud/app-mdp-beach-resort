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
    guestAssistanceRequests, resolveGuestAssistanceRequest, config, businessDisplayName,
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
    <header className="sticky top-0 z-[60] bg-[#0F2942] text-white border-b border-[#1E3A5F] shadow-md">
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

          {config.logoUrl && (
            <img
              src={config.logoUrl}
              alt={businessDisplayName}
              className="w-8 h-8 rounded-xl object-cover border border-white/20 shrink-0"
            />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                {businessDisplayName || config.branchName}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#0284C7] text-white shrink-0">
                {config.activePlan || 'DEMO'}
              </span>
            </div>
            <p className="text-[11px] text-[#E0F2FE] font-medium truncate leading-tight mt-0.5">
              {config.slogan || 'Todo listo para un gran día en la playa'}
            </p>
          </div>
        </div>

        {/* Center: Live Date & Time + Logged User */}
        <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-2xl text-xs">
          {/* Clock */}
          <div className="flex items-center gap-1.5 text-gray-200 font-semibold">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="capitalize">{formattedDate}</span>
            <span className="text-[#38BDF8] font-black">•</span>
            <span className="font-mono text-white font-black">{formattedTime} hs</span>
          </div>

          <div className="h-4 w-[1px] bg-white/20" />

          {/* User role */}
          <div className="flex items-center gap-1.5 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
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
              aria-label="Avisos y Notificaciones"
              aria-expanded={showNotifications}
              aria-controls="header-notifications-panel"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F59E0B] text-white font-black text-[10px] flex items-center justify-center animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Modal */}
            {showNotifications && (
              <div
                id="header-notifications-panel"
                role="dialog"
                aria-label="Avisos y Notificaciones"
                className="fixed left-3 right-3 top-[4.5rem] z-[70] mx-auto flex max-h-[calc(100dvh-5.5rem)] w-auto max-w-sm flex-col space-y-3 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white p-4 text-[#0F172A] shadow-2xl sm:left-auto sm:right-4 sm:mx-0 sm:w-80"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#F59E0B]" />
                    <h4 className="font-black text-xs text-[#0F172A]">Avisos & Notificaciones</h4>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-[#0F172A]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
                  {guestAssistanceRequests.map((request) => (
                    <div key={request.id} className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                      <div className="font-black text-rose-700 flex items-center gap-1">
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Llamado de mozo · {request.locationCode}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1">
                        {request.locationName}{request.requestCount > 1 ? ` · ${request.requestCount} llamados` : ''}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedLocationCode(request.locationCode);
                            setActiveView('pos');
                            setShowNotifications(false);
                          }}
                          className="text-[11px] font-bold underline text-[#0284C7] hover:text-[#0369A1]"
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
                    <div className="p-2.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-xs">
                      <div className="font-black text-[#B45309] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{pendingOrders.length} pedido(s) por confirmar</span>
                      </div>
                      <p className="text-[11px] text-[#92400E] mt-1">
                        Hay clientes esperando aprobación de pedido desde carpas o sombrillas.
                      </p>
                      <button
                        onClick={() => {
                          setActiveView('comandas');
                          setShowNotifications(false);
                        }}
                        className="mt-2 text-[11px] font-bold underline text-[#0284C7] hover:text-[#0369A1]"
                      >
                        Ver pedidos pendientes →
                      </button>
                    </div>
                  )}

                  {readyOrders.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-[#E0F2FE] border border-sky-200 text-xs">
                      <div className="font-black text-[#0369A1] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{readyOrders.length} orden(es) listas en cocina</span>
                      </div>
                      <p className="text-[11px] text-[#0369A1]/80 mt-1">
                        Los platos están listos en la barra para despacho hacia la playa.
                      </p>
                      <button
                        onClick={() => {
                          setActiveView('cocina');
                          setShowNotifications(false);
                        }}
                        className="mt-2 text-[11px] font-bold underline text-[#0284C7] hover:text-[#0369A1]"
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
                ? 'bg-[#0284C7] text-white shadow-sm ring-1 ring-[#0284C7]'
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
                ? 'bg-[#0284C7] text-white shadow-sm ring-1 ring-[#0284C7]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Personalizar producto y ver carrito"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Carrito</span>
            {totalCartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#F59E0B] text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('pos')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'pos'
                ? 'bg-[#0284C7] text-white shadow-sm ring-1 ring-[#0284C7]'
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
                ? 'bg-[#0284C7] text-white shadow-sm ring-1 ring-[#0284C7]'
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
