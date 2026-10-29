import React, { useState } from 'react';
import { Product, ProductVariant, SelectedAddon, CartItem } from '../types';
import { useBalneario } from '../context/BalnearioContext';
import { formatCurrencyARS, calculateItemUnitPrice } from '../utils/balnearioLogic';
import {
  X,
  Plus,
  Minus,
  Check,
  Flame,
  Utensils,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ProductCustomizeModalProps {
  product: Product | null;
  onClose: () => void;
  onAddedToCart?: () => void;
}

export const ProductCustomizeModal: React.FC<ProductCustomizeModalProps> = ({
  product,
  onClose,
  onAddedToCart,
}) => {
  const { addToCart, selectedLocationCode } = useBalneario();

  if (!product) return null;

  // Selected variant
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );

  // Doneness / cooking point if burger or meat
  const isMeatDish = product.categoryId === 'cat-burgers' || product.includedIngredients?.some((i) => i.toLowerCase().includes('carne') || i.toLowerCase().includes('novillo'));
  const [doneness, setDoneness] = useState<string>('A punto (recomendado)');

  // Removed ingredients
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);

  // Selected addons
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

  // Notes
  const [notes, setNotes] = useState<string>('');

  // Quantity
  const [quantity, setQuantity] = useState<number>(1);

  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const unitPrice = calculateItemUnitPrice(basePrice, undefined, selectedAddons);
  const subtotal = unitPrice * quantity;

  const toggleRemoveIngredient = (ing: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const toggleAddon = (addon: { id: string; name: string; price: number }) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, { id: addon.id, name: addon.name, price: addon.price }];
    });
  };

  const handleConfirm = () => {
    // Include cooking point in notes if applicable
    const completeNotes = [
      isMeatDish ? `Punto de cocción: ${doneness}` : null,
      notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join(' • ');

    const cartItem: CartItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      basePrice: product.price,
      unitPrice,
      quantity,
      variant: selectedVariant,
      removedIngredients,
      selectedAddons,
      notes: completeNotes,
      subtotal,
    };

    addToCart(cartItem);
    if (onAddedToCart) onAddedToCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden text-gray-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 transition"
          >
            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              ←
            </span>
            <span>Volver a la Carta</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              ● {selectedLocationCode}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Hero Image & Badge */}
          <div className="relative rounded-2xl overflow-hidden shadow-md bg-gray-900 h-56 sm:h-64">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Tag over image */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{product.tag || 'Plato Recomendado'}</span>
            </div>

            {/* Price badge & Title over image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  {product.sku} • {product.prepTimeMinutes} min
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {product.name}
                </h2>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-sm sm:text-base shadow-lg">
                {formatCurrencyARS(unitPrice)}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>

          {/* Variants (if any) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Presentación / Tamaño</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Requerido
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {v.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-800">
                        {formatCurrencyARS(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cooking point (doneness) */}
          {isMeatDish && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Punto de cocción de la carne</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Requerido
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'jugoso', title: 'Jugoso', desc: 'Centro rojo brillante y muy tierno' },
                  { id: 'punto', title: 'A punto (recomendado)', desc: 'Centro rosado jugoso y textura tierna' },
                  { id: 'cocido', title: 'Bien cocida', desc: 'Cocción completa sin partes rosadas' },
                ].map((item) => {
                  const isSelected = doneness === item.title;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDoneness(item.title)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-gray-900">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-gray-500">{item.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Removable ingredients */}
          {product.removableIngredients && product.removableIngredients.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                <span>¿Deseás quitar algún ingrediente?</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.removableIngredients.map((ing) => {
                  const isRemoved = removedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleRemoveIngredient(ing)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                        isRemoved
                          ? 'border-rose-300 bg-rose-50/70 text-rose-900'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-xs font-semibold">
                        {isRemoved ? `Sin ${ing}` : `Quitar ${ing}`}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isRemoved ? 'bg-rose-200 text-rose-900' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isRemoved ? 'QUITADO' : 'INCLUIDO'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Addons */}
          {product.availableAddons && product.availableAddons.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span>Adicionales con costo</span>
              </label>
              <div className="space-y-2">
                {product.availableAddons.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-emerald-800">
                        +{formatCurrencyARS(addon.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Observaciones especiales para la cocina
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Salsa aparte, pan bien tostado, sin hielo..."
              rows={2}
              className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden resize-none"
            />
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center gap-3">
          {/* Stepper */}
          <div className="flex items-center justify-between w-full sm:w-auto bg-white border border-gray-200 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 text-sm font-bold text-gray-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full flex-1 flex items-center justify-between py-3 px-5 rounded-2xl bg-emerald-700 text-white font-extrabold text-sm hover:bg-emerald-800 shadow-lg shadow-emerald-700/25 transition active:scale-[0.99]"
          >
            <span>AGREGAR AL PEDIDO</span>
            <span className="bg-emerald-800/80 px-3 py-1 rounded-xl text-emerald-100">
              {formatCurrencyARS(subtotal)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
