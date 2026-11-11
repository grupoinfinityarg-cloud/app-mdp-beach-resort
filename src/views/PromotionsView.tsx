import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { Promotion, CartItem } from '../types';
import { formatCurrencyARS } from '../utils/balnearioLogic';
import {
  Tag,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Percent,
} from 'lucide-react';

export const PromotionsView: React.FC = () => {
  const { promotions, togglePromotion, addPromotion, editPromotion, addToCart, setActiveView } =
    useBalneario();

  const [showNewModal, setShowNewModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promoPrice, setPromoPrice] = useState<number>(15000);
  const [regularPrice, setRegularPrice] = useState<number>(20000);
  const [image, setImage] = useState('');
  const [badge, setBadge] = useState('AHORRÁ $5.000');
  const [conditions, setConditions] = useState('Válido todos los días en carpas y salón.');
  const [includedList, setIncludedList] = useState('');

  const handleOpenEdit = (pr: Promotion) => {
    setEditingPromo(pr);
    setName(pr.name);
    setDescription(pr.description);
    setPromoPrice(pr.promoPrice);
    setRegularPrice(pr.regularPrice);
    setImage(pr.image);
    setBadge(pr.badge);
    setConditions(pr.conditions);
    setIncludedList(pr.includedProductNames.join(', '));
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const includedProductNames = includedList
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPromo) {
      editPromotion(editingPromo.id, {
        name,
        description,
        promoPrice,
        regularPrice,
        image: image || editingPromo.image,
        badge,
        conditions,
        includedProductNames,
      });
      setEditingPromo(null);
    } else {
      addPromotion({
        name,
        description,
        promoPrice,
        regularPrice,
        image:
          image ||
          'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
        badge: badge || 'PROMO EXCLUSIVA',
        validUntil: '2026-12-31',
        includedProductNames,
        conditions,
        isActive: true,
      });
      setShowNewModal(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPromoPrice(15000);
    setRegularPrice(20000);
    setImage('');
    setBadge('AHORRÁ $5.000');
    setConditions('Válido todos los días en carpas y salón.');
    setIncludedList('');
  };

  const handleAddPromoToCart = (pr: Promotion) => {
    const item: CartItem = {
      id: `ci-promo-${Date.now()}`,
      productId: pr.id,
      productName: `[PROMO] ${pr.name}`,
      productImage: pr.image,
      basePrice: pr.promoPrice,
      unitPrice: pr.promoPrice,
      quantity: 1,
      removedIngredients: [],
      selectedAddons: [],
      notes: `Combo promocional: ${pr.includedProductNames.join(' + ')}`,
      subtotal: pr.promoPrice,
    };
    addToCart(item);
    setActiveView('personalizar');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#0F172A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
              Promociones & Combos de Verano
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F59E0B] text-white">
              {promotions.filter((p) => p.isActive).length} ACTIVAS
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Ofertas especiales, combos gastronómicos con descuento y promociones de temporada para la playa.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowNewModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Crear Promoción</span>
        </button>
      </div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {promotions.map((promo) => {
          const discount = promo.regularPrice - promo.promoPrice;
          const discountPct = Math.round((discount / promo.regularPrice) * 100);

          return (
            <div
              key={promo.id}
              className={`bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between transition hover:shadow-md ${
                promo.isActive ? 'border-[#E2E8F0]' : 'border-[#E2E8F0] opacity-60'
              }`}
            >
              <div>
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={promo.image}
                    alt={promo.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                  {/* Warm amber badge for promos */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-[#F59E0B] text-white font-black text-[10px] shadow-md uppercase tracking-wider">
                    {promo.badge}
                  </div>

                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-[#0F2942]/90 backdrop-blur-xs text-white font-extrabold text-[10px]">
                    -{discountPct}% OFF
                  </div>

                  {/* Price overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white">
                    <div>
                      <span className="text-xl font-black text-white">
                        {formatCurrencyARS(promo.promoPrice)}
                      </span>
                      <span className="text-xs text-gray-300 line-through ml-2">
                        {formatCurrencyARS(promo.regularPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="font-black text-sm text-[#0F172A] leading-snug">
                    {promo.name}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {promo.description}
                  </p>

                  {/* Included items */}
                  {promo.includedProductNames.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] text-[11px] space-y-1 border border-[#E2E8F0]">
                      <span className="font-bold text-[#0F172A] block">Incluye:</span>
                      <ul className="list-disc list-inside text-[#64748B] space-y-0.5">
                        {promo.includedProductNames.map((it, i) => (
                          <li key={i}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-[10px] text-[#64748B]">
                    <strong>Condiciones:</strong> {promo.conditions}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                <button
                  onClick={() => togglePromotion(promo.id)}
                  className={`p-2 rounded-xl border text-xs font-bold transition ${
                    promo.isActive
                      ? 'border-[#0284C7] text-[#0284C7] bg-[#E0F2FE]'
                      : 'border-[#E2E8F0] text-gray-400 bg-gray-50'
                  }`}
                  title={promo.isActive ? 'Desactivar promo' : 'Activar promo'}
                >
                  {promo.isActive ? <Eye className="w-4 h-4 text-[#0284C7]" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleOpenEdit(promo)}
                  className="p-2 rounded-xl border border-[#E2E8F0] text-[#0284C7] hover:bg-[#E0F2FE] transition"
                  title="Editar promoción"
                >
                  <Edit2 className="w-4 h-4 text-[#0284C7]" />
                </button>

                {promo.isActive && (
                  <button
                    onClick={() => handleAddPromoToCart(promo)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Agregar al Carrito</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Promo Create / Edit Modal */}
      {(showNewModal || editingPromo) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSavePromo}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-[#E2E8F0]"
          >
            <h3 className="font-black text-base text-[#0F172A]">
              {editingPromo ? 'Editar Promoción' : 'Nueva Promoción Comercial'}
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#64748B]">Nombre de la promo:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Combo Playa Doble"
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] focus:border-[#0284C7] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#64748B]">Descripción:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] resize-none focus:border-[#0284C7] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#64748B]">Precio Promocional:</label>
                <input
                  type="number"
                  required
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] font-bold focus:border-[#0284C7] focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#64748B]">Precio Anterior / Regular:</label>
                <input
                  type="number"
                  required
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] focus:border-[#0284C7] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#64748B]">Texto del Badge:</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="AHORRÁ $5.000 / 2x1"
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] focus:border-[#0284C7] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#64748B]">URL Imagen:</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] focus:border-[#0284C7] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#64748B]">
                Productos incluidos (separados por coma):
              </label>
              <input
                type="text"
                value={includedList}
                onChange={(e) => setIncludedList(e.target.value)}
                placeholder="Burger, Papas, Cerveza"
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] focus:border-[#0284C7] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPromo(null);
                  setShowNewModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#0284C7] hover:bg-[#0369A1] text-white cursor-pointer shadow-xs"
              >
                Guardar Promoción
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
