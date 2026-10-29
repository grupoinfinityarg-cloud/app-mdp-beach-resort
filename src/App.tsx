import React, { useState, useEffect } from 'react';
import { BalnearioProvider, useBalneario } from './context/BalnearioContext';
import { HeaderTopBar } from './components/HeaderTopBar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { SectorsView } from './views/SectorsView';
import { BeachSpotsView } from './views/BeachSpotsView';
import { DigitalMenuView } from './views/DigitalMenuView';
import { CartView } from './views/CartView';
import { OrderManagementView } from './views/OrderManagementView';
import { KitchenKDSView } from './views/KitchenKDSView';
import { PosView } from './views/PosView';
import { ProductsAdminView } from './views/ProductsAdminView';
import { PromotionsView } from './views/PromotionsView';
import { ReservationsView } from './views/ReservationsView';
import { CashRegisterView } from './views/CashRegisterView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { WifiOff } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, setSelectedLocationCode } = useBalneario();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Monitor online / offline status for PWA
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle URL query parameters (e.g. ?mesa=C-01 for QR scan, ?view=carta, ?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaParam = params.get('mesa') || params.get('carpa') || params.get('spot');
    const viewParam = params.get('view');

    if (mesaParam) {
      setSelectedLocationCode(mesaParam.toUpperCase());
      setActiveView('carta');
    } else if (viewParam) {
      setActiveView(viewParam as any);
    }
  }, [setActiveView, setSelectedLocationCode]);

  // When on customer digital menu or kitchen KDS, we can give a dedicated immersive layout
  const isImmersiveView = activeView === 'cocina';

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Offline PWA Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo Sin Conexión — La aplicación continúa funcionando con datos locales en caché.</span>
        </div>
      )}

      {/* Top Experience Switcher Bar (Matches reference header) */}
      <HeaderTopBar onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar (Hidden in full-screen kitchen or mobile unless toggled) */}
        {!isImmersiveView && (
          <Sidebar
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-x-hidden min-w-0">
          {activeView === 'panel' && <DashboardView />}
          {activeView === 'sectores' && <SectorsView />}
          {activeView === 'carpas' && <BeachSpotsView />}
          {activeView === 'carta' && <DigitalMenuView />}
          {activeView === 'personalizar' && <CartView />}
          {activeView === 'comandas' && <OrderManagementView />}
          {activeView === 'cocina' && <KitchenKDSView />}
          {activeView === 'pos' && <PosView />}
          {activeView === 'productos' && <ProductsAdminView />}
          {activeView === 'promociones' && <PromotionsView />}
          {activeView === 'reservas' && <ReservationsView />}
          {activeView === 'caja' && <CashRegisterView />}
          {activeView === 'reportes' && <ReportsView />}
          {activeView === 'configuracion' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BalnearioProvider>
      <AppContent />
    </BalnearioProvider>
  );
}
