import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BalnearioProvider, useBalneario } from './context/BalnearioContext';
import { HeaderTopBar } from './components/HeaderTopBar';
import { DemoRoleSwitcherBar } from './components/DemoRoleSwitcherBar';
import { Sidebar } from './components/Sidebar';
import { DigitalMenuView } from './views/DigitalMenuView';
import { CartView } from './views/CartView';
import { WifiOff } from 'lucide-react';
import { StaffLoginView } from './components/StaffLoginView';
import { isSupabaseConfigured, supabase, supabaseBusinessSlug } from './utils/supabase';

// Carga diferida (React.lazy) de vistas administrativas y operativas
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const SectorsView = lazy(() => import('./views/SectorsView').then(m => ({ default: m.SectorsView })));
const BeachSpotsView = lazy(() => import('./views/BeachSpotsView').then(m => ({ default: m.BeachSpotsView })));
const OrderManagementView = lazy(() => import('./views/OrderManagementView').then(m => ({ default: m.OrderManagementView })));
const KitchenKDSView = lazy(() => import('./views/KitchenKDSView').then(m => ({ default: m.KitchenKDSView })));
const PosView = lazy(() => import('./views/PosView').then(m => ({ default: m.PosView })));
const ProductsAdminView = lazy(() => import('./views/ProductsAdminView').then(m => ({ default: m.ProductsAdminView })));
const PromotionsView = lazy(() => import('./views/PromotionsView').then(m => ({ default: m.PromotionsView })));
const ReservationsView = lazy(() => import('./views/ReservationsView').then(m => ({ default: m.ReservationsView })));
const CashRegisterView = lazy(() => import('./views/CashRegisterView').then(m => ({ default: m.CashRegisterView })));
const ReportsView = lazy(() => import('./views/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

// Indicador de carga discreto para transiciones de módulos administrativos
const ViewLoadingFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center min-h-[350px] p-8 text-[#34313A]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#C1E7FF] border-t-[#F68F57] animate-spin" />
      <span className="text-xs font-bold text-[#34313A]/70">Cargando módulo...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setSelectedLocationCode,
    orders,
    recordQrCustomerApproval,
    recordQrCustomerEditRequest,
    cancelOrder,
  } = useBalneario();
  const qrParams = new URLSearchParams(window.location.search);
  const isQrAccess = ['mesa', 'carpa', 'spot', 'confirmar', 'editar', 'cancelar'].some((param) => qrParams.has(param));
  const [staffSessionReady, setStaffSessionReady] = useState(!isSupabaseConfigured || isQrAccess);
  const [hasBusinessAccess, setHasBusinessAccess] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [authCheckError, setAuthCheckError] = useState('');
  const [authRefreshVersion, setAuthRefreshVersion] = useState(0);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() =>
    new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const handleStaffSignOut = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) window.alert(`No se pudo cerrar la sesión: ${error.message}`);
    } catch (failure) {
      const detail = failure instanceof Error ? failure.message : 'Error de conexión con Auth.';
      window.alert(`No se pudo cerrar la sesión: ${detail}`);
    }
  };

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

  // Handle URL query parameters once on initial mount (e.g. ?mesa=C-01 for QR scan, ?view=carta, ?autostart=1)
  const hasProcessedInitialUrlRef = useRef(false);
  useEffect(() => {
    if (hasProcessedInitialUrlRef.current) return;
    hasProcessedInitialUrlRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const mesaParam = params.get('mesa') || params.get('carpa') || params.get('spot');
    const viewParam = params.get('view') || params.get('role') || params.get('vista');

    if (mesaParam) {
      setSelectedLocationCode(mesaParam.toUpperCase());
      setActiveView('carta');
    } else if (viewParam) {
      setActiveView(viewParam as any);
    }
  }, [setActiveView, setSelectedLocationCode]);

  // Acciones de respuesta rápida desde el mensaje de WhatsApp (1 toque)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmParam = params.get('confirmar');
    const editParam = params.get('editar');
    const cancelParam = params.get('cancelar');

    if (confirmParam || editParam || cancelParam) {
      const targetQuery = (confirmParam || editParam || cancelParam || '').trim();
      const targetOrder = orders.find(
        (o) => o.orderNumber.replace(/[^0-9]/g, '') === targetQuery || o.id === targetQuery
      );
      if (targetOrder) {
        if (confirmParam && targetOrder.customerApprovalStatus !== 'approved') {
          void recordQrCustomerApproval(targetOrder);
          import('canvas-confetti').then((m) => m.default({ particleCount: 70, spread: 60 })).catch(() => {});
          window.alert(`👍 ¡Pedido ${targetOrder.orderNumber} confirmado correctamente! Ya ingresó a cocina.`);
          setActiveView('carta');
        } else if (editParam) {
          void recordQrCustomerEditRequest(targetOrder);
          window.alert(`✏️ Solicitud de cambio recibida para el pedido ${targetOrder.orderNumber}. Enseguida el personal te contactará.`);
          setActiveView('carta');
        } else if (cancelParam) {
          cancelOrder(targetOrder.id, 'Cancelado por el cliente desde WhatsApp.');
          window.alert(`🚫 El pedido ${targetOrder.orderNumber} fue cancelado.`);
          setActiveView('carta');
        }
      }
    }
  }, [orders, recordQrCustomerApproval, recordQrCustomerEditRequest, cancelOrder, setActiveView]);

  useEffect(() => {
    if (!isSupabaseConfigured || isQrAccess || !supabase) return;
    const client = supabase;
    if (new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery') {
      setIsPasswordRecovery(true);
      setStaffSessionReady(true);
    }
    if (!supabaseBusinessSlug) {
      setAccessDenied(true);
      setStaffSessionReady(true);
      return;
    }
    let active = true;
    const verifySession = async () => {
      setStaffSessionReady(false);
      setAuthCheckError('');
      try {
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!active) return;
        if (!session) {
          setHasBusinessAccess(false);
          setAccessDenied(false);
          return;
        }
        const { data, error } = await client
          .from('businesses')
          .select('id')
          .eq('slug', supabaseBusinessSlug)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        setHasBusinessAccess(Boolean(data));
        setAccessDenied(!data);
      } catch (failure) {
        if (!active) return;
        const detail = failure instanceof Error ? failure.message : 'No se pudo consultar Auth o el acceso al balneario.';
        setAuthCheckError(detail);
        setHasBusinessAccess(false);
        setAccessDenied(false);
      } finally {
        if (active) setStaffSessionReady(true);
      }
    };
    void verifySession();
    return () => {
      active = false;
    };
  }, [isQrAccess, authRefreshVersion]);

  useEffect(() => {
    if (!isSupabaseConfigured || isQrAccess || !supabase) return;
    const client = supabase;
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setStaffSessionReady(true);
        return;
      }
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
      if (event === 'USER_UPDATED') setIsPasswordRecovery(false);
      setStaffSessionReady(false);
      setAuthCheckError('');
      setAuthRefreshVersion((version) => version + 1);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [isQrAccess]);

  const isStaffLoginRequested = new URLSearchParams(window.location.search).has('staff') || new URLSearchParams(window.location.search).has('login');

  if (isSupabaseConfigured && isStaffLoginRequested) {
    if (isPasswordRecovery) return <StaffLoginView recoveryMode />;
    if (!staffSessionReady) return <div className="min-h-screen sand-textured-bg flex items-center justify-center text-xs font-bold text-[#34313A]/70">Verificando acceso...</div>;
    if (!hasBusinessAccess) return <StaffLoginView accessDenied={accessDenied} authError={authCheckError} />;
  }

  const visibleView = activeView;
  const isCustomerView = visibleView === 'carta' || visibleView === 'personalizar';
  const isImmersiveView = activeView === 'cocina' || isCustomerView;

  return (
    <div className="min-h-screen sand-textured-bg text-[#34313A] flex flex-col font-sans selection:bg-[#C1E7FF] selection:text-[#34313A]">
      {/* Barra de Demostración Comercial y Selector de Roles */}
      <DemoRoleSwitcherBar />

      {/* Offline PWA Banner */}
      {!isOnline && !isQrAccess && (
        <div className="bg-[#F68F57] text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo Sin Conexión — La aplicación continúa funcionando con datos locales en caché.</span>
        </div>
      )}

      {/* Top Experience Switcher Bar (solo visible para administración y staff, oculta para el cliente) */}
      {!isQrAccess && !isCustomerView && (
        <HeaderTopBar onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} onSignOut={handleStaffSignOut} />
      )}

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        {!isImmersiveView && (
          <Sidebar
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Dynamic Main View with sand texture */}
        <main className="flex-1 overflow-x-hidden min-w-0 sand-textured-bg">
          <Suspense fallback={<ViewLoadingFallback />}>
            {visibleView === 'panel' && <DashboardView />}
            {visibleView === 'sectores' && <SectorsView />}
            {visibleView === 'carpas' && <BeachSpotsView />}
            {visibleView === 'carta' && <DigitalMenuView />}
            {visibleView === 'personalizar' && <CartView />}
            {visibleView === 'comandas' && <OrderManagementView />}
            {visibleView === 'cocina' && <KitchenKDSView />}
            {visibleView === 'pos' && <PosView />}
            {visibleView === 'productos' && <ProductsAdminView />}
            {visibleView === 'promociones' && <PromotionsView />}
            {visibleView === 'reservas' && <ReservationsView />}
            {visibleView === 'caja' && <CashRegisterView />}
            {visibleView === 'reportes' && <ReportsView />}
            {visibleView === 'configuracion' && <SettingsView />}
          </Suspense>
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
