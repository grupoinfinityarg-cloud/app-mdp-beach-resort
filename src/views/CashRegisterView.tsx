import React, { useState, useMemo } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { formatCurrencyARS, calculateCashDifference } from '../utils/balnearioLogic';
import {
  Wallet,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  QrCode,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  History,
} from 'lucide-react';

export const CashRegisterView: React.FC = () => {
  const {
    cashRegister,
    cashMovements,
    orders,
    openCashRegister,
    closeCashRegister,
    addManualCashMovement,
  } = useBalneario();

  const [showInflowModal, setShowInflowModal] = useState(false);
  const [showOutflowModal, setShowOutflowModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);

  // Manual movement form
  const [amount, setAmount] = useState<number>(5000);
  const [concept, setConcept] = useState('');
  const [cashier, setCashier] = useState(cashRegister.cashierName);

  // Close register counted cash
  const [countedCash, setCountedCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [closeResult, setCloseResult] = useState<any | null>(null);

  // Open register form
  const [initialCashInput, setInitialCashInput] = useState<number>(150000);
  const [shiftNameInput, setShiftNameInput] = useState('Turno Mañana / Playa');

  // Breakdown calculations
  const breakdown = useMemo(() => {
    const cashSales = cashMovements
      .filter((m) => m.type === 'venta' && m.paymentMethod === 'efectivo')
      .reduce((s, m) => s + m.amount, 0);

    const manualInflows = cashMovements
      .filter((m) => m.type === 'ingreso')
      .reduce((s, m) => s + m.amount, 0);

    const manualOutflows = cashMovements
      .filter((m) => m.type === 'egreso')
      .reduce((s, m) => s + m.amount, 0);

    const expectedCashInDrawer =
      cashRegister.initialCash + cashSales + manualInflows - manualOutflows;

    // Sales by other payment methods
    const paidOrders = orders.filter((o) => o.paymentStatus === 'cobrado');
    const mpSales = paidOrders
      .filter((o) => o.paymentMethod === 'mercadopago_qr')
      .reduce((s, o) => s + o.total, 0);
    const cardSales = paidOrders
      .filter((o) => o.paymentMethod === 'tarjeta_debito' || o.paymentMethod === 'tarjeta_credito')
      .reduce((s, o) => s + o.total, 0);
    const transferSales = paidOrders
      .filter((o) => o.paymentMethod === 'transferencia')
      .reduce((s, o) => s + o.total, 0);

    const totalRevenue = cashSales + mpSales + cardSales + transferSales;

    return {
      cashSales,
      manualInflows,
      manualOutflows,
      expectedCashInDrawer,
      mpSales,
      cardSales,
      transferSales,
      totalRevenue,
    };
  }, [cashMovements, orders, cashRegister]);

  const handleManualMovement = (type: 'ingreso' | 'egreso') => {
    if (!concept.trim() || amount <= 0) return;
    addManualCashMovement(type, amount, concept.trim(), cashier || 'Cajero');
    setConcept('');
    setAmount(5000);
    setShowInflowModal(false);
    setShowOutflowModal(false);
  };

  const handleCloseRegister = () => {
    const diff = calculateCashDifference(breakdown.expectedCashInDrawer, countedCash);
    closeCashRegister(countedCash, closeNotes);
    setCloseResult(diff);
    setShowCloseModal(false);
  };

  const handleOpenRegister = () => {
    openCashRegister(initialCashInput, cashier || 'Cajero', shiftNameInput);
    setShowOpenModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Caja, Arqueos & Medios de Pago
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                cashRegister.isOpen
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {cashRegister.isOpen ? 'CAJA ABIERTA' : 'CAJA CERRADA'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Responsable: <strong>{cashRegister.cashierName}</strong> • {cashRegister.shiftName}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {cashRegister.isOpen ? (
            <>
              <button
                onClick={() => setShowInflowModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ingreso Manual</span>
              </button>

              <button
                onClick={() => setShowOutflowModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition"
              >
                <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Egreso / Gasto</span>
              </button>

              <button
                onClick={() => {
                  setCountedCash(breakdown.expectedCashInDrawer);
                  setShowCloseModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-md transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Arqueo y Cierre</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Nuevo Turno de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* Cash Reconciliation Result Banner */}
      {closeResult && (
        <div
          className={`p-4 rounded-3xl border text-xs flex items-center justify-between gap-3 ${
            closeResult.status === 'exact'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : closeResult.status === 'surplus'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <strong className="block font-bold">Resultado del Último Arqueo:</strong>
              <span>{closeResult.message}</span>
            </div>
          </div>
          <button
            onClick={() => setCloseResult(null)}
            className="text-xs font-bold underline shrink-0"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Efectivo Esperado en Cajón */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-500">
            <span>Efectivo en Cajón</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {formatCurrencyARS(breakdown.expectedCashInDrawer)}
          </div>
          <div className="text-[11px] text-gray-400">
            Fondo inicial: {formatCurrencyARS(cashRegister.initialCash)}
          </div>
        </div>

        {/* Mercado Pago QR */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-500">
            <span>Mercado Pago QR</span>
            <QrCode className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {formatCurrencyARS(breakdown.mpSales)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            Acreditación instantánea
          </div>
        </div>

        {/* Tarjetas Débito y Crédito */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-500">
            <span>Tarjetas de Playa</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {formatCurrencyARS(breakdown.cardSales)}
          </div>
          <div className="text-[11px] text-gray-400">POS inalámbrico de parador</div>
        </div>

        {/* Total Facturado del Turno */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-500">
            <span>Recaudación Total</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800">
            {formatCurrencyARS(breakdown.totalRevenue)}
          </div>
          <div className="text-[11px] text-gray-400">Suma de todos los canales</div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-700" />
            <h3 className="font-black text-base text-gray-900">Historial Cronológico de Movimientos</h3>
          </div>
          <span className="text-xs text-gray-400">{cashMovements.length} movimientos auditados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Hora</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Concepto</th>
                <th className="py-2.5 px-3">Medio</th>
                <th className="py-2.5 px-3">Cajero</th>
                <th className="py-2.5 px-3 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashMovements.map((move) => {
                const isSale = move.type === 'venta';
                const isInflow = move.type === 'ingreso' || move.type === 'apertura';
                const isOutflow = move.type === 'egreso';

                return (
                  <tr key={move.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-2.5 px-3 font-mono text-gray-400">
                      {new Date(move.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isSale
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInflow
                            ? 'bg-blue-100 text-blue-800'
                            : isOutflow
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {move.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{move.concept}</td>
                    <td className="py-2.5 px-3 text-gray-500 uppercase text-[11px]">
                      {move.paymentMethod || 'Efectivo'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{move.cashierName}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-black ${
                        isOutflow ? 'text-rose-600' : 'text-emerald-800'
                      }`}
                    >
                      {isOutflow ? '-' : '+'}
                      {formatCurrencyARS(move.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Movement Modal (Inflow / Outflow) */}
      {(showInflowModal || showOutflowModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900">
              {showInflowModal ? 'Registrar Ingreso Manual' : 'Registrar Egreso / Gasto Menor'}
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Monto en Pesos ($):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-lg font-black text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Concepto / Motivo:</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder={showInflowModal ? 'Ej: Aporte para cambio' : 'Ej: Bolsas de hielo, propinas'}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowInflowModal(false);
                  setShowOutflowModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleManualMovement(showInflowModal ? 'ingreso' : 'egreso')}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white ${
                  showInflowModal ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirmar {showInflowModal ? 'Ingreso' : 'Egreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900">Arqueo y Cierre de Turno</h3>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Efectivo esperado según sistema:</span>
                <strong className="text-gray-900">{formatCurrencyARS(breakdown.expectedCashInDrawer)}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Efectivo Contado Físicamente en Cajón ($):
              </label>
              <input
                type="number"
                value={countedCash}
                onChange={(e) => setCountedCash(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-gray-200 text-xl font-black text-center text-gray-900"
              />
            </div>

            {/* Live difference preview */}
            <div className="text-center text-xs">
              <span className="text-gray-500">Diferencia calculada: </span>
              <strong
                className={`font-black ${
                  countedCash - breakdown.expectedCashInDrawer === 0
                    ? 'text-emerald-700'
                    : countedCash - breakdown.expectedCashInDrawer > 0
                    ? 'text-blue-700'
                    : 'text-rose-700'
                }`}
              >
                {countedCash - breakdown.expectedCashInDrawer >= 0 ? '+' : ''}
                {formatCurrencyARS(countedCash - breakdown.expectedCashInDrawer)}
              </strong>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Observaciones de cierre:</label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Ej: Turno mediodía cerrado sin novedades..."
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseRegister}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-black"
              >
                Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Register Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900">Apertura de Turno de Caja</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Fondo Inicial de Cambio ($):</label>
              <input
                type="number"
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-gray-200 text-lg font-black text-center text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Nombre del Turno:</label>
              <input
                type="text"
                value={shiftNameInput}
                onChange={(e) => setShiftNameInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowOpenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenRegister}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Abrir Caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
