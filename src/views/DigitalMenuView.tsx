import React, { useMemo, useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { ProductCustomizeModal } from './ProductCustomizeModal';
import { Product } from '../types';
import { formatCurrencyARS, calculateTop5Products } from '../utils/balnearioLogic';
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
    productBeingCustomized,
    setProductBeingCustomized,
  } = useBalneario();

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderMode, setOrderMode] = useState<'mesa' | 'retirar'>('mesa');
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [assistanceRequested, setAssistanceRequested] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Dynamic Top 5 ranking
  const { products: top5List, isDemonstrationOnly } = useMemo(
    () => calculateTop5Products(products, orders),
    [products, orders]
  );

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (!prod.isActive) return false;
      if (selectedCategory !== 'todos' && prod.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesDesc = prod.description.toLowerCase().includes(query);
        const matchesSku = prod.sku.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesSku;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart totals
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Voice Search via Web Speech API
  const handleVoiceSearch = () => {
    setVoiceError(null);
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Búsqueda por voz no soportada en este navegador. Podés escribir arriba.');
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
        }
        setIsListeningVoice(false);
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
        setVoiceError('No se pudo capturar audio. Escribí el producto.');
        setTimeout(() => setVoiceError(null), 3000);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
      setVoiceError('Error al iniciar micrófono.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${config.name} - ${config.branchName}`,
        text: '¡Mirá la carta digital del balneario y hacé tu pedido!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleRequestAssistance = () => {
    setAssistanceRequested(true);
    setTimeout(() => setAssistanceRequested(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#f3f6f4] pb-28">
      {/* Maximum Mobile/Tablet Container */}
      <div className="max-w-xl mx-auto bg-white shadow-xl min-h-screen relative overflow-hidden">
        {/* Hero Section */}
        <div className="relative h-64 sm:h-72 w-full bg-gray-900">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
            alt="Balneario Gastronomía"
            className="w-full h-full object-cover brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30" />

          {/* Top floating chips */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-emerald-950 text-[11px] font-bold shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                Powered by <strong className="font-extrabold">{config.name}</strong>
              </span>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold hover:bg-black/80 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>
          </div>

          {/* Bottom chips over image */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
            {/* Location selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLocationSelectorOpen(!isLocationSelectorOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold border border-white/20 hover:bg-black/90 transition shadow-lg"
              >
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Estás en: <strong>{selectedLocationCode}</strong>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {isLocationSelectorOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-gray-900 max-h-60 overflow-y-auto">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                          selectedLocationCode === loc.code
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{loc.name}</span>
                        <span className="font-mono text-[10px] text-gray-400">{loc.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cocina Activa Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-emerald-900 text-xs font-bold shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="tracking-wider text-[11px]">COCINA ACTIVA</span>
            </div>
          </div>
        </div>

        {/* Parador Info Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                GASTRONOMÍA & PARADOR DE PLAYA
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
                {config.branchName.toUpperCase()}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Sector Playa Grande • Mar del Plata
              </p>
            </div>

            {/* Rating badge */}
            <div className="px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center shrink-0">
              <div className="flex items-center justify-center gap-1 text-emerald-800 font-black text-base leading-none">
                <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>4.9</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 mt-0.5 block">
                1.2k+ reseñas
              </span>
            </div>
          </div>

          {/* Schedule & Address badges */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200/60">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>{config.schedule}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{config.address}</span>
            </div>
          </div>

          {/* Order Mode Selection */}
          <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setOrderMode('mesa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  orderMode === 'mesa'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                En Carpa / Mesa
              </button>
              <button
                type="button"
                onClick={() => setOrderMode('retirar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  orderMode === 'retirar'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Para Retirar (Barra)
              </button>
            </div>

            {/* Call waiter / Assistance */}
            <button
              onClick={handleRequestAssistance}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs ${
                assistanceRequested
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BellRing className={`w-3.5 h-3.5 ${assistanceRequested ? 'animate-bounce' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">
                {assistanceRequested ? '¡Mozo notificado!' : 'Llamar Mozo'}
              </span>
              <span className="sm:hidden">
                {assistanceRequested ? '¡Llamado!' : 'Mozo'}
              </span>
            </button>
          </div>

          {assistanceRequested && (
            <div className="mt-2 text-xs font-semibold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>El mozo del sector {selectedLocationCode} se acerca a tu ubicación.</span>
            </div>
          )}
        </div>

        {/* Search Bar & Voice Input */}
        <div className="p-4 bg-white sticky top-14 z-20 shadow-xs border-b border-gray-100">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar hamburguesas, rabas, licuados, pizzas..."
              className="w-full bg-gray-50 hover:bg-gray-100/80 focus:bg-white pl-10 pr-12 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium text-gray-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            />
            {/* Voice Search Button */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`absolute right-2.5 p-1.5 rounded-xl transition ${
                isListeningVoice
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
              title="Buscar por voz"
              aria-label="Buscar por voz"
            >
              {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {voiceError && (
            <div className="mt-2 text-[11px] text-rose-600 font-semibold px-2">
              {voiceError}
            </div>
          )}
        </div>

        {/* Horizontal Categories Scroll */}
        <div className="bg-white px-4 py-2.5 border-b border-gray-100 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedCategory === 'todos'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-600 shadow-xs'
                : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Destacados</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-600 shadow-xs'
                    : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Top 5 Section (Priority Module requirement) */}
        {selectedCategory === 'todos' && !searchQuery.trim() && (
          <div className="p-4 sm:p-5 bg-gradient-to-b from-emerald-50/40 to-transparent border-b border-emerald-100/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  ★
                </span>
                <div>
                  <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight">
                    LOS 5 MÁS ELEGIDOS DEL BALNEARIO
                  </h3>
                  <p className="text-[10px] text-emerald-800 font-semibold">
                    {isDemonstrationOnly
                      ? 'Ranking recomendado por los chefs del parador'
                      : 'Calculado en vivo según unidades vendidas y valoraciones'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold" title="Métrica transparente">
                <Info className="w-3 h-3 text-emerald-600" />
                <span>Top 5</span>
              </div>
            </div>

            {/* Horizontal Scroll for Top 5 */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {top5List.map((item, index) => (
                <div
                  key={item.id}
                  className="w-56 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="relative h-28 w-full bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-black shadow-xs">
                      #{index + 1}
                    </div>
                    {item.tag && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold">
                        {item.tag}
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className="font-black text-xs text-emerald-800">
                        {formatCurrencyARS(item.price)}
                      </span>
                      <button
                        onClick={() => setProductBeingCustomized(item)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>AGREGAR</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Products List */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold px-1">
            <span>
              {filteredProducts.length} productos disponibles
            </span>
            <span>Precios con IVA incluido</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-3.5 shadow-xs hover:shadow-md transition flex gap-3.5 items-stretch"
              >
                {/* Photo thumbnail */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.tag && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[9px] font-black uppercase">
                      {product.tag}
                    </div>
                  )}
                  {product.isVeggie && (
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold">
                      Veggie
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 shrink-0">
                        <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                        <span>{product.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100">
                    <div>
                      <span className="font-black text-sm sm:text-base text-gray-900">
                        {formatCurrencyARS(product.price)}
                      </span>
                      <span className="text-[10px] text-gray-400 block -mt-0.5">
                        {product.prepTimeMinutes} min preparación
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setProductBeingCustomized(product)}
                      className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
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
              <p className="text-xs font-semibold">No se encontraron productos con ese criterio.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todos');
                }}
                className="mt-2 text-xs font-bold text-emerald-700 underline"
              >
                Ver todos los productos
              </button>
            </div>
          )}

          {/* Footer Official Seal */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center pb-6 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Carta digital oficial y menú verificado</span>
            </div>
            <p className="text-[11px] text-gray-400">
              {config.branchName} • Mar del Plata, Argentina. Los precios incluyen IVA.
            </p>
          </div>
        </div>

        {/* Sticky Floating Bottom Bar (Matching ref-site.png) */}
        {totalCartCount > 0 && (
          <aside className="fixed bottom-0 left-0 right-0 z-30 flex justify-center p-3 pointer-events-none">
            <div className="max-w-xl w-full bg-[#1e2925] text-white rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-3 pointer-events-auto border border-emerald-900/60 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-emerald-300" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-emerald-950 font-black text-xs flex items-center justify-center shadow-xs">
                    {totalCartCount}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {totalCartCount} {totalCartCount === 1 ? 'PRODUCTO' : 'PRODUCTOS'} SELECCIONADOS
                  </div>
                  <div className="text-base font-black text-white leading-tight">
                    {formatCurrencyARS(totalCartAmount)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveView('personalizar')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95"
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
    </div>
  );
};
