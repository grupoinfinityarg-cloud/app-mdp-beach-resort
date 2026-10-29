import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { Product } from '../types';
import { formatCurrencyARS } from '../utils/balnearioLogic';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Search,
  Check,
  X,
  Sparkles,
  Eye,
  EyeOff,
  FolderPlus,
} from 'lucide-react';

export const ProductsAdminView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    editProduct,
    toggleProductAvailable,
    toggleProductActive,
    addCategory,
  } = useBalneario();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // New product form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-burgers');
  const [price, setPrice] = useState<number>(10000);
  const [cost, setCost] = useState<number>(3500);
  const [sku, setSku] = useState('');
  const [image, setImage] = useState('');
  const [tag, setTag] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
  const [removableList, setRemovableList] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍽️');

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'todos' && p.categoryId !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setCategoryId(p.categoryId);
    setPrice(p.price);
    setCost(p.cost || 0);
    setSku(p.sku);
    setImage(p.image);
    setTag(p.tag || '');
    setPrepTimeMinutes(p.prepTimeMinutes);
    setRemovableList(p.removableIngredients?.join(', ') || '');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const removableIngredients = removableList
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingProduct) {
      editProduct(editingProduct.id, {
        name,
        description,
        categoryId,
        price,
        cost,
        sku,
        image: image || editingProduct.image,
        tag: tag || undefined,
        prepTimeMinutes,
        removableIngredients,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name,
        description,
        categoryId,
        price,
        cost,
        sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
        image: image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        tag: tag || undefined,
        prepTimeMinutes,
        removableIngredients,
        isAvailable: true,
        isActive: true,
        rating: 4.8,
        reviewsCount: 1,
      });
      setShowNewModal(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice(10000);
    setCost(3500);
    setSku('');
    setImage('');
    setTag('');
    setPrepTimeMinutes(15);
    setRemovableList('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      emoji: newCatEmoji.trim() || '🍴',
      iconName: 'utensils',
      order: categories.length + 1,
    });
    setNewCatName('');
    setShowCategoryModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Menú & Administración de Productos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              {products.length} PLATOS & BEBIDAS
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configuración de precios, stock, modificadores de cocina e ingredientes personalizables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50"
          >
            <FolderPlus className="w-4 h-4 text-emerald-700" />
            <span>Nueva Categoría</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowNewModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Producto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full bg-white pl-10 pr-4 py-2 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600 shadow-2xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'todos'
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table / Cards */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Precio Venta</th>
                <th className="py-3 px-4">Costo</th>
                <th className="py-3 px-4 text-center">Disponibilidad (Stock)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-gray-900">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {p.sku} • {p.prepTimeMinutes}m cocina
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-700">
                        {cat?.emoji} {cat?.name}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-black text-emerald-800">
                      {formatCurrencyARS(p.price)}
                    </td>

                    <td className="py-3 px-4 text-gray-500">
                      {p.cost ? formatCurrencyARS(p.cost) : '—'}
                    </td>

                    {/* Stock switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleProductAvailable(p.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          p.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.isAvailable ? 'EN STOCK' : 'AGOTADO'}
                      </button>
                    </td>

                    {/* Active/Inactive */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleProductActive(p.id)}
                        className={`p-1.5 rounded-lg transition ${
                          p.isActive
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={p.isActive ? 'Activo en la carta' : 'Desactivado (oculto)'}
                      >
                        {p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Edit button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal (Create or Edit) */}
      {(showNewModal || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-black text-base text-gray-900">
                {editingProduct ? 'Editar Producto Gastronómico' : 'Crear Nuevo Producto'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setShowNewModal(false);
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-gray-700">Nombre del plato o bebida:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Hamburguesa de Novillo con Papas"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 font-semibold"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-gray-700">Descripción apetitosa:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalle de ingredientes y preparación..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Categoría:</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Código / SKU:</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="BUR-05"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Precio Venta (ARS):</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-black text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Costo (ARS opcional):</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-gray-700">URL Fotografía:</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-gray-700">
                  Ingredientes que el cliente puede quitar (separados por coma):
                </label>
                <input
                  type="text"
                  value={removableList}
                  onChange={(e) => setRemovableList(e.target.value)}
                  placeholder="Cebolla, Tomate, Panceta, Salsa"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setShowNewModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-md"
              >
                Guardar Producto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleCreateCategory}
            className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-black text-base text-gray-900">Nueva Categoría Gastronómica</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Nombre:</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej: Mariscos, Tragos, Minutas"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Emoji representativo:</label>
              <input
                type="text"
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                placeholder="🍤"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-center text-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Crear Categoría
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
