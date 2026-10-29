import React, { useState, useMemo } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { formatCurrencyARS, calculateTop5Products } from '../utils/balnearioLogic';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  DollarSign,
  ShoppingBag,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { orders, products, categories, locations } = useBalneario();
  const [period, setPeriod] = useState<'hoy' | 'semana' | 'mes'>('hoy');

  const paidOrders = orders.filter((o) => o.paymentStatus === 'cobrado');

  // Financial aggregates
  const grossSales = paidOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscounts = paidOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalServiceFees = paidOrders.reduce((sum, o) => sum + o.serviceFee, 0);
  const netRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  // Dynamic Top 5
  const { products: topRanked, isDemonstrationOnly } = useMemo(
    () => calculateTop5Products(products, orders),
    [products, orders]
  );

  // Sales by Category
  const categorySales = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; revenue: number; units: number }> = {};
    for (const cat of categories) {
      map[cat.id] = { name: cat.name, emoji: cat.emoji, revenue: 0, units: 0 };
    }

    for (const ord of paidOrders) {
      for (const item of ord.items) {
        const prod = products.find((p) => p.id === item.productId);
        const catId = prod?.categoryId || 'cat-burgers';
        if (map[catId]) {
          map[catId].revenue += item.subtotal;
          map[catId].units += item.quantity;
        }
      }
    }

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [paidOrders, categories, products]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {
      efectivo: 0,
      mercadopago_qr: 0,
      tarjeta_credito: 0,
      tarjeta_debito: 0,
      transferencia: 0,
    };

    for (const ord of paidOrders) {
      const pm = ord.paymentMethod || 'efectivo';
      map[pm] = (map[pm] || 0) + ord.total;
    }

    return [
      { name: 'Mercado Pago QR', amount: map.mercadopago_qr, color: 'bg-blue-600' },
      { name: 'Efectivo', amount: map.efectivo, color: 'bg-emerald-600' },
      { name: 'Tarjetas (Débito/Crédito)', amount: map.tarjeta_credito + map.tarjeta_debito, color: 'bg-purple-600' },
      { name: 'Transferencias', amount: map.transferencia, color: 'bg-amber-600' },
    ];
  }, [paidOrders]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            Reportes & Rendimiento Comercial
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Métricas de ventas, productos de mayor demanda y ocupación de sectores del balneario.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
          {[
            { id: 'hoy', label: 'Turno Hoy' },
            { id: 'semana', label: 'Última Semana' },
            { id: 'mes', label: 'Mes en Curso' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                period === tab.id
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Ventas Brutas
          </span>
          <div className="text-2xl font-black text-gray-900">{formatCurrencyARS(grossSales)}</div>
          <p className="text-[11px] text-gray-500">{paidOrders.length} transacciones</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
            Descuentos Otorgados
          </span>
          <div className="text-2xl font-black text-amber-700">-{formatCurrencyARS(totalDiscounts)}</div>
          <p className="text-[11px] text-gray-500">Promociones y cortesías</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Servicio de Mesa / Playa
          </span>
          <div className="text-2xl font-black text-gray-700">{formatCurrencyARS(totalServiceFees)}</div>
          <p className="text-[11px] text-gray-500">Adicional de cubierto</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Recaudación Neta
          </span>
          <div className="text-2xl font-black text-emerald-800">{formatCurrencyARS(netRevenue)}</div>
          <p className="text-[11px] text-emerald-700 font-semibold">Total cobrado efectivo y digital</p>
        </div>
      </div>

      {/* 2-Column charts: Top Ranked & Category performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Top 5 Products */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-base text-gray-900">
                Ranking Oficial: Los 5 Más Elegidos
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-gray-400">
              {isDemonstrationOnly ? 'Recomendación Demo' : 'Ventas Reales'}
            </span>
          </div>

          <div className="space-y-3">
            {topRanked.map((item, index) => {
              const maxUnits = Math.max(1, topRanked[0]?.dynamicUnitsSold || 10);
              const pct = Math.round(((item.dynamicUnitsSold || item.salesCount) / maxUnits) * 100);

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">
                      #{index + 1} {item.name}
                    </span>
                    <span className="font-black text-emerald-800">
                      {item.dynamicUnitsSold || item.salesCount} vendidos ({formatCurrencyARS(item.price)})
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              <h3 className="font-black text-base text-gray-900">Ventas por Categoría</h3>
            </div>
            <span className="text-[11px] font-semibold text-gray-400">Distribución</span>
          </div>

          <div className="space-y-3">
            {categorySales.slice(0, 5).map((cat) => {
              const maxCatRev = Math.max(1, categorySales[0]?.revenue || 1);
              const pct = Math.round((cat.revenue / maxCatRev) * 100);

              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800">
                      {cat.emoji} {cat.name}
                    </span>
                    <span className="font-black text-gray-900">
                      {formatCurrencyARS(cat.revenue)} ({cat.units} unid.)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment methods breakdown bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <h3 className="font-black text-base text-gray-900">Canales de Cobro Utilizados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentBreakdown.map((pm) => (
            <div key={pm.name} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-xs font-bold text-gray-600 block">{pm.name}</span>
              <div className="text-xl font-black text-gray-900">{formatCurrencyARS(pm.amount)}</div>
              <div className="text-[10px] text-gray-400">
                {netRevenue > 0 ? Math.round((pm.amount / netRevenue) * 100) : 0}% del volumen
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
