import React, { useEffect, useMemo, useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { ProductCustomizeModal } from './ProductCustomizeModal';
import { Product } from '../types';
import { Category, Promotion, BalnearioConfig } from '../types';
import { supabase, supabaseBusinessSlug } from '../utils/supabase';
import { formatCurrencyARS, calculateTop5Products, matchProductSearch } from '../utils/balnearioLogic';
import {
  Search,
  Mic,
  MicOff,
  Star,
  Clock,
  MapPin,
  Share2,
  BellRing,
  ShoppingBag,
  ArrowRight,
  Plus,
  Utensils,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Info,
  Barcode,
  QrCode,
  X,
  Volume2,
} from 'lucide-react';

export const DigitalMenuView: React.FC = () => {
  const {
    products,
    categories,
    orders,
    cart,
    setActiveView,
    selectedLocationCode,
    setSelectedLocationCode,
    locations,
    config,
    businessDisplayName,
    productBeingCustomized,
    setProductBeingCustomized,
  } = useBalneario();
  const qrParams = new URLSearchParams(window.location.search);
  const qrLocationCode = qrParams.get('mesa') || qrParams.get('carpa') || qrParams.get('spot');
  const isQrAccess = ['mesa', 'carpa', 'spot'].some((param) => qrParams.has(param));
  const activeLocationCode = qrLocationCode?.toUpperCase() || selectedLocationCode;

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderMode, setOrderMode] = useState<'mesa' | 'retirar'>('mesa');
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [assistanceRequested, setAssistanceRequested] = useState(false);
  const [assistanceSubmitting, setAssistanceSubmitting] = useState(false);
  const [assistanceError, setAssistanceError] = useState<string | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [qrMenu, setQrMenu] = useState<{ products: Product[]; categories: Category[]; promotions: Promotion[]; business?: Partial<BalnearioConfig> } | null>(null);
  const [qrMenuError, setQrMenuError] = useState<string | null>(null);
  const [qrMenuLoading, setQrMenuLoading] = useState(isQrAccess);

  useEffect(() => {
    if (!isQrAccess) return;
    if (!supabase || !supabaseBusinessSlug) {
      setQrMenuError('La carta QR todavía no está conectada al balneario.');
      setQrMenuLoading(false);
      return;
    }
    let active = true;
    void supabase.rpc('get_qr_menu', { p_business_slug: supabaseBusinessSlug }).then(({ data, error }) => {
      if (!active) return;
      if (error || !data) setQrMenuError(error?.message ?? 'No se pudo cargar la carta.');
      else setQrMenu(data as typeof qrMenu);
      setQrMenuLoading(false);
    });
    return () => { active = false; };
  }, [isQrAccess]);

  const visibleProducts = isQrAccess ? (qrMenu?.products ?? []) : products;
  const visibleCategories = isQrAccess ? (qrMenu?.categories ?? []) : categories;
  const visiblePromotions = isQrAccess ? (qrMenu?.promotions ?? []) : [];
  const visibleConfig = {
    ...config,
    ...(qrMenu?.business ?? {}),
    name: qrMenu?.business?.name || businessDisplayName,
    branchName: qrMenu?.business?.name || businessDisplayName,
  };

  // Dynamic Top 5 ranking
  const { products: top5List, isDemonstrationOnly } = useMemo(
    () => calculateTop5Products(visibleProducts, orders),
    [visibleProducts, orders]
  );

  // Filtered products list using fuzzy matcher for text, voice, and barcodes
  const filteredProducts = useMemo(() => {
    return visibleProducts.filter((prod) => {
      if (!prod.isActive) return false;
      if (selectedCategory !== 'todos' && prod.categoryId !== selectedCategory) {
        return false;
      }
      return matchProductSearch(prod, searchQuery);
    });
  }, [visibleProducts, selectedCategory, searchQuery]);

  // Cart totals
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Barcode / QR modal state
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Voice Search via Web Speech API (configured in es-AR)
  const handleVoiceSearch = () => {
    setVoiceError(null);
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        'El reconocimiento de voz no está disponible en este navegador o dispositivo. Podés utilizar el teclado o el buscador por código.'
      );
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListeningVoice(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        setIsListeningVoice(false);
        if (e.error === 'not-allowed') {
          setVoiceError('Permiso de micrófono denegado. Habilitalo en los permisos del navegador.');
        } else {
          setVoiceError('No se pudo capturar audio claramente. Probá nuevamente o escribí el producto.');
        }
        setTimeout(() => setVoiceError(null), 4000);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
      setVoiceError('Error al iniciar el micrófono. Utilizá la búsqueda por texto.');
      setTimeout(() => setVoiceError(null), 4000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${visibleConfig.name} - ${visibleConfig.branchName}`,
        text: '¡Mirá la carta digital del balneario y hacé tu pedido!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleRequestAssistance = async () => {
    if (!supabase || !supabaseBusinessSlug || assistanceSubmitting) {
      if (!supabase || !supabaseBusinessSlug) setAssistanceError('No se pudo conectar con el personal. Avisale a alguien del balneario.');
      return;
    }
    setAssistanceError(null);
    setAssistanceSubmitting(true);
    try {
      const { error } = await supabase.rpc('request_guest_assistance', {
        p_business_slug: supabaseBusinessSlug,
        p_location_code: activeLocationCode,
      });
      if (error) throw error;
      setAssistanceRequested(true);
    } catch {
      setAssistanceError('No se pudo enviar el llamado. Avisale a alguien del balneario.');
    } finally {
      setAssistanceSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBEEB9] pb-32">
      {/* Maximum Mobile/Tablet Centered Frame in Blanco (#FFFFFF) */}
      <div className="max-w-xl mx-auto bg-white shadow-xl min-h-screen relative overflow-hidden border-x border-[#E2E2E2]">
        {isQrAccess && (qrMenuLoading || qrMenuError) && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/95 p-6 text-center">
            <div className="max-w-sm rounded-2xl border border-[#E2E2E2] bg-white p-5 shadow-lg">
              <h2 className="text-base font-black text-[#34313A]">{qrMenuLoading ? 'Cargando la carta…' : 'No se pudo cargar la carta'}</h2>
              <p className="mt-2 text-xs text-gray-600">{qrMenuLoading ? 'Estamos consultando los productos actuales del balneario.' : qrMenuError}</p>
              {!qrMenuLoading && <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-[#C1E7FF] px-4 py-2 text-xs font-black text-[#34313A]">Volver a intentar</button>}
            </div>
          </div>
        )}
        {/* Hero Section with Gastronomic Atmosphere */}
        <div className="relative h-64 sm:h-72 w-full bg-[#34313A]">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
            alt="Balneario Gastronomía"
            className="w-full h-full object-cover brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#34313A] via-[#34313A]/40 to-transparent" />

          {/* Top floating chips */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#34313A] text-[11px] font-bold shadow-md border border-[#E2E2E2]">
              <span className="w-2 h-2 rounded-full bg-[#F68F57] animate-pulse" />
              <span>
                Powered by <strong className="font-black">{visibleConfig.name}</strong>
              </span>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#34313A]/85 backdrop-blur-md text-white text-[11px] font-bold hover:bg-[#34313A] transition border border-[#34313A]/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>
          </div>

          {/* Bottom chips over hero */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
            {/* Location selector dropdown */}
            <div className="relative">
              {isQrAccess ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#34313A]/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg">
                <Utensils className="w-3.5 h-3.5 text-[#C1E7FF]" />
                <span>
                  Estás en: <strong>{activeLocationCode}</strong>
                </span>
                </div>
              ) : (
                <button
                  onClick={() => setIsLocationSelectorOpen(!isLocationSelectorOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#34313A]/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 hover:bg-[#34313A] transition shadow-lg"
                >
                  <Utensils className="w-3.5 h-3.5 text-[#C1E7FF]" />
                  <span>
                    Estás en: <strong>{activeLocationCode}</strong>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
                </button>
              )}

              {!isQrAccess && isLocationSelectorOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E2E2E2] p-2 z-50 text-[#34313A] max-h-60 overflow-y-auto">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 py-1">
                    Cambiar tu Carpa o Mesa
                  </div>
                  <div className="space-y-0.5">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocationCode(loc.code);
                          setIsLocationSelectorOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold ${
                          activeLocationCode === loc.code
                            ? 'bg-[#C1E7FF] text-[#34313A]'
                            : 'hover:bg-[#FBEEB9]/40 text-[#34313A]'
                        }`}
                      >
                        <span>{loc.name}</span>
                        <span className="font-mono text-[10px] text-gray-500 font-bold">{loc.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cocina Activa Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#34313A] text-xs font-black shadow-lg border border-[#E2E2E2]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F68F57] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F68F57]"></span>
              </span>
              <span className="tracking-wider text-[11px] uppercase">COCINA ACTIVA</span>
            </div>
          </div>
        </div>

        {/* Parador Info Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E2E2] bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F68F57]">
                GASTRONOMÍA & PARADOR DE PLAYA
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#34313A] tracking-tight leading-tight mt-0.5">
                {visibleConfig.branchName.toUpperCase()}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Sector Playa Grande • Mar del Plata
              </p>
            </div>

            {/* Rating badge in #FBEEB9 with border #E2E2E2 */}
            <div className="px-3 py-2 rounded-2xl bg-[#FBEEB9]/70 border border-[#E2E2E2] text-center shrink-0 shadow-xs">
              <div className="flex items-center justify-center gap-1 text-[#34313A] font-black text-base leading-none">
                <Star className="w-4 h-4 fill-[#F68F57] text-[#F68F57]" />
                <span>4.9</span>
              </div>
              <span className="text-[10px] font-black text-[#34313A] mt-0.5 block">
                1.2k+ reseñas
              </span>
            </div>
          </div>

          {/* Schedule & Address */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[#34313A] font-bold text-[11px] border border-[#E2E2E2]">
              <Clock className="w-3 h-3 text-[#F68F57]" />
              <span>{visibleConfig.schedule}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{visibleConfig.address}</span>
            </div>
          </div>

          {/* Order Mode Selection */}
          <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-[#E2E2E2]">
            <div className="flex items-center gap-1.5 bg-[#FBEEB9]/40 p-1 rounded-2xl border border-[#E2E2E2]">
              <button
                type="button"
                onClick={() => setOrderMode('mesa')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderMode === 'mesa'
                    ? 'bg-[#C1E7FF] text-[#34313A] shadow-xs'
                    : 'text-[#34313A] hover:bg-white/60'
                }`}
              >
                En Carpa / Mesa
              </button>
              <button
                type="button"
                onClick={() => setOrderMode('retirar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderMode === 'retirar'
                    ? 'bg-[#C1E7FF] text-[#34313A] shadow-xs'
                    : 'text-[#34313A] hover:bg-white/60'
                }`}
              >
                Para Retirar (Barra)
              </button>
            </div>

            {/* Call waiter / Assistance */}
            <button
              onClick={handleRequestAssistance}
              disabled={assistanceSubmitting || assistanceRequested}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs ${
                assistanceRequested
                  ? 'bg-[#C1E7FF] text-[#34313A] border-[#a9dbfa] font-black'
                  : 'bg-white border-[#E2E2E2] text-[#34313A] hover:bg-gray-50'
              }`}
            >
              <BellRing className={`w-3.5 h-3.5 ${assistanceRequested ? 'animate-bounce text-[#34313A]' : 'text-[#F68F57]'}`} />
              <span className="hidden sm:inline">
                {assistanceSubmitting ? 'Enviando…' : assistanceRequested ? '¡Mozo notificado!' : 'Llamar Mozo'}
              </span>
              <span className="sm:hidden">
                {assistanceSubmitting ? '…' : assistanceRequested ? '¡Llamado!' : 'Mozo'}
              </span>
            </button>
          </div>

          {assistanceRequested && (
            <div className="mt-2 text-xs font-bold text-[#34313A] bg-[#C1E7FF]/40 p-2.5 rounded-2xl border border-[#a9dbfa] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34313A] shrink-0" />
              <span>El personal recibió tu solicitud para la ubicación {activeLocationCode}.</span>
            </div>
          )}
          {assistanceError && <p role="alert" className="mt-2 text-[11px] font-bold text-rose-700">{assistanceError}</p>}
        </div>

        {/* Search Bar & Voice / Barcode Input */}
        <div className="p-4 bg-white sticky top-16 z-20 shadow-xs border-b border-[#E2E2E2]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por texto, voz o código (ej: rabas, hamburguesa, BUR-01)..."
              className="w-full bg-[#FBEEB9]/20 hover:bg-[#FBEEB9]/35 focus:bg-white pl-10 pr-24 py-2.5 rounded-2xl border border-[#E2E2E2] text-xs font-semibold text-[#34313A] focus:outline-hidden focus:border-[#C1E7FF] focus:ring-1 focus:ring-[#C1E7FF] transition"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                  title="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Barcode / QR Search Button */}
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="p-1.5 rounded-xl text-gray-500 hover:text-[#34313A] hover:bg-[#FBEEB9]/50 transition"
                title="Buscar por código de barras o QR"
                aria-label="Buscar por código de barras o QR"
              >
                <Barcode className="w-4 h-4" />
              </button>

              {/* Voice Search Button (Web Speech API es-AR) */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-1.5 rounded-xl transition flex items-center justify-center ${
                  isListeningVoice
                    ? 'bg-[#F68F57] text-white animate-pulse shadow-md ring-2 ring-[#F68F57]/50'
                    : 'text-gray-500 hover:text-[#34313A] hover:bg-[#C1E7FF]/50'
                }`}
                title="Búsqueda por voz (es-AR)"
                aria-label="Búsqueda por voz"
              >
                {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Listening Feedback Banner */}
          {isListeningVoice && (
            <div className="mt-2.5 p-2 rounded-xl bg-[#F68F57]/15 border border-[#F68F57]/40 text-[#34313A] flex items-center justify-between text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F68F57] animate-ping" />
                <span className="font-bold">Escuchando micrófono (es-AR)...</span>
                <span className="text-gray-600 hidden sm:inline text-[11px]">
                  Decí &ldquo;hamburguesa&rdquo;, &ldquo;rabas&rdquo;, &ldquo;coca&rdquo;, &ldquo;limonada&rdquo;...
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsListeningVoice(false)}
                className="text-[10px] font-black uppercase text-[#F68F57] hover:underline ml-2"
              >
                Detener
              </button>
            </div>
          )}

          {voiceError && (
            <div className="mt-2 text-[11px] text-[#F68F57] font-bold px-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{voiceError}</span>
            </div>
          )}
        </div>

        {/* Horizontal Categories Scroll: #C1E7FF para categoría activa con texto #34313A */}
        <div className="bg-white px-4 py-2.5 border-b border-[#E2E2E2] overflow-x-auto flex items-center gap-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedCategory === 'todos'
                ? 'bg-[#C1E7FF] text-[#34313A] shadow-xs border border-[#a9dbfa]'
                : 'bg-white text-[#34313A] border border-[#E2E2E2] hover:bg-[#FBEEB9]/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#34313A]" />
            <span>Destacados</span>
          </button>

          {visibleCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#C1E7FF] text-[#34313A] font-black shadow-xs border border-[#a9dbfa]'
                    : 'bg-white text-[#34313A] border border-[#E2E2E2] hover:bg-[#FBEEB9]/30'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Section: LOS 5 MÁS ELEGIDOS (Destacados en #F68F57 / fondo cálido) */}
        {selectedCategory === 'todos' && !searchQuery.trim() && (
          <div className="p-4 sm:p-5 bg-[#FBEEB9]/40 border-b border-[#E2E2E2]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#F68F57] text-white font-black text-xs flex items-center justify-center shadow-xs">
                  ★
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#34313A] tracking-tight leading-tight">
                    LOS 5 MÁS ELEGIDOS DEL BALNEARIO
                  </h3>
                  <p className="text-[10px] text-gray-600 font-bold">
                    {isDemonstrationOnly
                      ? 'Ranking recomendado por los chefs del parador'
                      : 'Calculado en vivo según unidades vendidas y valoraciones'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-[#34313A]/70 font-bold" title="Métrica transparente">
                <Info className="w-3.5 h-3.5 text-[#34313A]" />
                <span>Top 5</span>
              </div>
            </div>

            {/* Horizontal Scroll for Top 5 */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {top5List.map((item, index) => (
                <div
                  key={item.id}
                  className="w-56 shrink-0 bg-white rounded-2xl border border-[#E2E2E2] shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="relative h-28 w-full bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#34313A] text-[#FBEEB9] text-[10px] font-black shadow-xs">
                      #{index + 1}
                    </div>
                    {item.tag && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#F68F57] text-white text-[9px] font-bold">
                        {item.tag}
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-xs text-[#34313A] line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 font-medium">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#E2E2E2]">
                      <span className="font-black text-xs text-[#34313A]">
                        {formatCurrencyARS(item.price)}
                      </span>
                      {/* Naranja #F68F57 para destacados gastronómicos */}
                      <button
                        onClick={() => setProductBeingCustomized(item)}
                        className="px-2.5 py-1 rounded-xl bg-[#F68F57] hover:bg-[#e27c45] text-white text-[11px] font-black shadow-xs flex items-center gap-1 active:scale-95 transition"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>AGREGAR</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Gastronomic Products List */}
        <div className="p-4 sm:p-5 space-y-4 bg-white">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold px-1">
            <span className="text-[#34313A]">
              {filteredProducts.length} productos gastronómicos disponibles
            </span>
            <span>Precios con IVA incluido</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="bg-white rounded-3xl border border-[#E2E2E2] p-3 sm:p-3.5 shadow-xs hover:shadow-md transition flex gap-3.5 items-stretch"
              >
                {/* Gastronomic Photo Protagonist */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.tag && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#F68F57] text-white text-[9px] font-black uppercase">
                      {product.tag}
                    </div>
                  )}
                  {product.isVeggie && (
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#C1E7FF] text-[#34313A] text-[9px] font-black border border-[#a9dbfa]">
                      Veggie
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-sm sm:text-base text-[#34313A] leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] font-black text-[#34313A] bg-[#FBEEB9] px-2 py-0.5 rounded-md shrink-0 border border-[#E2E2E2]">
                        <Star className="w-3 h-3 fill-[#F68F57] text-[#F68F57]" />
                        <span>{product.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed font-medium">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#E2E2E2]">
                    <div>
                      <span className="font-black text-sm sm:text-base text-[#34313A]">
                        {formatCurrencyARS(product.price)}
                      </span>
                      <span className="text-[10px] text-gray-400 block -mt-0.5 font-medium">
                        {product.prepTimeMinutes} min preparación
                      </span>
                    </div>

                    {/* Naranja gastronómico #F68F57 para agregar productos */}
                    <button
                      type="button"
                      onClick={() => setProductBeingCustomized(product)}
                      className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#F68F57] hover:bg-[#e27c45] text-white font-black text-xs shadow-xs active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>AGREGAR</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Utensils className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold text-[#34313A]">No se encontraron platos con ese nombre.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todos');
                }}
                className="mt-2 text-xs font-bold text-[#34313A] underline"
              >
                Ver todos los productos
              </button>
            </div>
          )}

          {/* Footer Official Seal */}
          <div className="mt-8 pt-6 border-t border-[#E2E2E2] text-center pb-6 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#34313A]">
              <CheckCircle2 className="w-4 h-4 text-[#F68F57]" />
              <span>Carta digital oficial • Identidad Oficial Gestión Balnearia</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {visibleConfig.branchName} • Mar del Plata, Argentina. Los precios incluyen IVA.
            </p>
          </div>
        </div>

        {/* Sticky Floating Bottom Bar: #34313A + #C1E7FF + #F68F57 */}
        {totalCartCount > 0 && (
          <aside className="fixed bottom-0 left-0 right-0 z-30 flex justify-center p-3 pointer-events-none">
            <div className="max-w-xl w-full bg-[#34313A] text-white rounded-3xl shadow-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 pointer-events-auto border border-[#484450] animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#C1E7FF]" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F68F57] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {totalCartCount}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#C1E7FF]">
                    {totalCartCount} {totalCartCount === 1 ? 'PRODUCTO' : 'PRODUCTOS'} SELECCIONADOS
                  </div>
                  <div className="text-base font-black text-white leading-tight">
                    {formatCurrencyARS(totalCartAmount)}
                  </div>
                </div>
              </div>

              {/* Botón de acción principal: #C1E7FF con texto oscuro #34313A */}
              <button
                onClick={() => setActiveView('personalizar')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#C1E7FF] hover:bg-[#a9dbfa] text-[#34313A] font-black text-xs shadow-lg transition active:scale-95"
              >
                <span>VER PEDIDO ({totalCartCount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Product Customizer Modal */}
      {productBeingCustomized && (
        <ProductCustomizeModal
          product={productBeingCustomized}
          onClose={() => setProductBeingCustomized(null)}
          onAddedToCart={() => {}}
        />
      )}

      {/* Barcode & QR Code Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-[#34313A]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#E2E2E2] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E2E2]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C1E7FF] text-[#34313A] flex items-center justify-center font-black">
                  <Barcode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#34313A]">Lector de Código / QR</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Búsqueda rápida por PLU o escáner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-[#34313A] hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated camera viewfinder frame */}
            <div className="relative rounded-2xl bg-[#34313A] h-36 flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-[#C1E7FF]/60 text-white p-4 text-center">
              <div className="w-24 h-16 border-2 border-[#C1E7FF] rounded-lg relative flex items-center justify-center">
                <span className="w-full h-0.5 bg-[#F68F57] animate-pulse absolute" />
                <QrCode className="w-6 h-6 text-white/50" />
              </div>
              <p className="text-[11px] font-bold mt-2 text-[#FBEEB9]">
                Apuntá al código de barras o QR del producto
              </p>
              <p className="text-[9px] text-gray-300">O seleccioná un código de prueba rápido abajo</p>
            </div>

            {/* Quick barcode / PLU chips */}
            <div>
              <p className="text-[11px] font-black text-[#34313A] mb-2 uppercase tracking-wide">
                Códigos de carta balnearia:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {visibleProducts.filter((p) => p.isActive).map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(prod.sku || prod.name);
                      setShowScannerModal(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-[#E2E2E2] bg-gray-50 hover:bg-[#C1E7FF] hover:border-[#a9dbfa] text-left transition flex items-center gap-1.5 text-xs text-[#34313A]"
                  >
                    <span className="font-mono font-black text-[10px] px-1 py-0.5 rounded bg-white border border-[#E2E2E2]">
                      {prod.sku}
                    </span>
                    <span className="font-semibold text-[11px] truncate max-w-[130px]">{prod.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowScannerModal(false)}
              className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#34313A] font-bold text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
