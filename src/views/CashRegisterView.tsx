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
  AlertTriangle,
  QrCode,
  CreditCard,
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#0F172A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
              Caja, Arqueos & Medios de Pago
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                cashRegister.isOpen
                  ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {cashRegister.isOpen ? 'CAJA ABIERTA' : 'CAJA CERRADA'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Responsable: <strong className="text-[#0F172A]">{cashRegister.cashierName}</strong> • {cashRegister.shiftName}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {cashRegister.isOpen ? (
            <>
              <button
                onClick={() => setShowInflowModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] font-bold text-xs hover:bg-[#BAE6FD] transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#0369A1]" />
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F2942] hover:bg-[#1E3A5F] text-white font-bold text-xs shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Arqueo y Cierre</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs shadow-sm transition"
            >
              <Unlock className="w-4 h-4 text-white" />
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
              ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0369A1]'
              : closeResult.status === 'surplus'
              ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
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
            className="text-xs font-bold underline shrink-0 text-[#0F172A]"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Efectivo Esperado en Cajón */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#64748B]">
            <span>Efectivo en Cajón</span>
            <Wallet className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A]">
            {formatCurrencyARS(breakdown.expectedCashInDrawer)}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Fondo inicial: {formatCurrencyARS(cashRegister.initialCash)}
          </div>
        </div>

        {/* Mercado Pago QR */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#64748B]">
            <span>Mercado Pago QR</span>
            <QrCode className="w-4 h-4 text-[#009ee3]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A]">
            {formatCurrencyARS(breakdown.mpSales)}
          </div>
          <div className="text-[11px] text-[#0F172A] font-semibold">
            Acreditación instantánea
          </div>
        </div>

        {/* Tarjetas Débito y Crédito */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#64748B]">
            <span>Tarjetas de Playa</span>
            <CreditCard className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A]">
            {formatCurrencyARS(breakdown.cardSales)}
          </div>
          <div className="text-[11px] text-[#64748B]">POS inalámbrico de parador</div>
        </div>

        {/* Total Facturado del Turno */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#64748B]">
            <span>Recaudación Total</span>
            <DollarSign className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A]">
            {formatCurrencyARS(breakdown.totalRevenue)}
          </div>
          <div className="text-[11px] text-[#64748B]">Suma de todos los canales</div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#0284C7]" />
            <h3 className="font-black text-base text-[#0F172A]">Historial Cronológico de Movimientos</h3>
          </div>
          <span className="text-xs text-[#64748B]">{cashMovements.length} movimientos auditados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase text-[10px] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3">Hora</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Concepto</th>
                <th className="py-2.5 px-3">Medio</th>
                <th className="py-2.5 px-3">Cajero</th>
                <th className="py-2.5 px-3 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {cashMovements.map((move) => {
                const isSale = move.type === 'venta';
                const isInflow = move.type === 'ingreso' || move.type === 'apertura';
                const isOutflow = move.type === 'egreso';

                return (
                  <tr key={move.id} className="hover:bg-[#F0F4F8] transition">
                    <td className="py-2.5 px-3 font-mono text-[#64748B]">
                      {new Date(move.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isSale
                            ? 'bg-[#E0F2FE] text-[#0369A1]'
                            : isInflow
                            ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                            : isOutflow
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {move.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#0F172A]">{move.concept}</td>
                    <td className="py-2.5 px-3 text-[#64748B] uppercase text-[11px]">
                      {move.paymentMethod || 'Efectivo'}
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B]">{move.cashierName}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-black ${
                        isOutflow ? 'text-rose-600' : 'text-[#0F172A]'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E8F0]">
            <h3 className="font-black text-base text-[#0F172A]">
              {showInflowModal ? 'Registrar Ingreso Manual' : 'Registrar Egreso / Gasto Menor'}
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Monto en Pesos ($):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-lg font-black text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Concepto / Motivo:</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder={showInflowModal ? 'Ej: Aporte para cambio' : 'Ej: Bolsas de hielo, propinas'}
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowInflowModal(false);
                  setShowOutflowModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleManualMovement(showInflowModal ? 'ingreso' : 'egreso')}
                className={`px-4 py-2 rounded-xl text-xs font-black ${
                  showInflowModal ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white' : 'bg-rose-600 text-white hover:bg-rose-700'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E8F0]">
            <h3 className="font-black text-base text-[#0F172A]">Arqueo y Cierre de Turno</h3>

            <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#92400E]">Efectivo esperado según sistema:</span>
                <strong className="text-[#92400E] font-black">{formatCurrencyARS(breakdown.expectedCashInDrawer)}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">
                Efectivo Contado Físicamente en Cajón ($):
              </label>
              <input
                type="number"
                value={countedCash}
                onChange={(e) => setCountedCash(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] text-xl font-black text-center text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            {/* Live difference preview */}
            <div className="text-center text-xs">
              <span className="text-[#64748B]">Diferencia calculada: </span>
              <strong
                className={`font-black ${
                  countedCash - breakdown.expectedCashInDrawer === 0
                    ? 'text-[#0F172A]'
                    : countedCash - breakdown.expectedCashInDrawer > 0
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                {countedCash - breakdown.expectedCashInDrawer >= 0 ? '+' : ''}
                {formatCurrencyARS(countedCash - breakdown.expectedCashInDrawer)}
              </strong>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Observaciones de cierre:</label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Ej: Turno mediodía cerrado sin novedades..."
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseRegister}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2942] text-white hover:bg-[#1E3A5F]"
              >
                Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Register Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E8F0]">
            <h3 className="font-black text-base text-[#0F172A]">Apertura de Turno de Caja</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Fondo Inicial de Cambio ($):</label>
              <input
                type="number"
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] text-lg font-black text-center text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Nombre del Turno:</label>
              <input
                type="text"
                value={shiftNameInput}
                onChange={(e) => setShiftNameInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowOpenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenRegister}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-xs"
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
