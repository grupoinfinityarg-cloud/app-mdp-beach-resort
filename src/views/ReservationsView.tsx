import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { Reservation } from '../types';
import { formatCurrencyARS } from '../utils/balnearioLogic';
import {
  CalendarCheck2,
  Plus,
  Search,
  Calendar,
  Phone,
  Mail,
  Clock,
} from 'lucide-react';

export const ReservationsView: React.FC = () => {
  const { reservations, addReservation, updateReservationStatus, locations } = useBalneario();
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-10-29');
  const [showNewModal, setShowNewModal] = useState(false);

  // New reservation fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [locationCode, setLocationCode] = useState(locations[0]?.code || 'C-01');
  const [timeSlot, setTimeSlot] = useState<Reservation['timeSlot']>('dia_completo');
  const [guestsCount, setGuestsCount] = useState<number>(4);
  const [depositAmount, setDepositAmount] = useState<number>(20000);
  const [totalAmount, setTotalAmount] = useState<number>(60000);
  const [notes, setNotes] = useState('');

  const filteredReservations = reservations.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        r.locationCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    const loc = locations.find((l) => l.code === locationCode);

    addReservation({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      locationId: loc ? loc.id : `loc-${locationCode}`,
      locationCode,
      locationType: loc ? loc.type : 'carpa',
      date: selectedDate,
      timeSlot,
      guestsCount,
      depositAmount,
      totalAmount,
      status: 'confirmada',
      notes: notes.trim() || undefined,
    });

    setShowNewModal(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setDepositAmount(20000);
    setTotalAmount(60000);
    setNotes('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#34313A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#34313A] tracking-tight">
              Clientes & Reservas de Sombra
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#C1E7FF] text-[#34313A]">
              {reservations.length} REGISTRADAS
            </span>
          </div>
          <p className="text-xs text-[#34313A]/70 mt-0.5">
            Agenda de reservas para carpas, sombrillas y mesas gastronómicas con registro de señas.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa] font-black text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-[#34313A]" />
          <span>Nueva Reserva</span>
        </button>
      </div>

      {/* Date & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#34313A]/50 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, teléfono o carpa..."
            className="w-full bg-white pl-10 pr-4 py-2 rounded-2xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF] shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-[#E2E2E2] text-xs font-bold text-[#34313A]">
          <Calendar className="w-4 h-4 text-[#34313A]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold bg-transparent outline-none text-[#34313A]"
          />
        </div>
      </div>

      {/* Reservations Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReservations.map((res) => {
          const isConfirmed = res.status === 'confirmada';
          const isInUse = res.status === 'en_uso';

          return (
            <div
              key={res.id}
              className="bg-white rounded-3xl border border-[#E2E2E2] p-5 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E2E2E2]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-xl bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]">
                      {res.locationCode}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-[#34313A]">{res.customerName}</h4>
                      <span className="text-[10px] text-[#34313A]/60 font-medium">{res.date}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isConfirmed
                        ? 'bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]'
                        : isInUse
                        ? 'bg-[#FBEEB9] text-[#34313A] border border-[#e8d799]'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {res.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-[#34313A]/80">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#34313A]/50" />
                    <span>{res.customerPhone}</span>
                  </div>
                  {res.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#34313A]/50" />
                      <span>{res.customerEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#34313A]/50" />
                    <span className="capitalize">{res.timeSlot.replace(/_/g, ' ')} • {res.guestsCount} personas</span>
                  </div>
                </div>

                {/* Financial note */}
                <div className="mt-3 p-2.5 rounded-xl bg-[#FBEEB9]/20 border border-[#E2E2E2] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#34313A]/60 block text-[10px]">Seña abonada</span>
                    <strong className="text-[#34313A]">{formatCurrencyARS(res.depositAmount)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#34313A]/60 block text-[10px]">Total estadía</span>
                    <strong className="text-[#34313A]">{formatCurrencyARS(res.totalAmount)}</strong>
                  </div>
                </div>

                {res.notes && (
                  <div className="mt-2 text-[11px] text-[#34313A]/70 italic bg-white p-2 rounded-lg border border-[#E2E2E2]">
                    "{res.notes}"
                  </div>
                )}
              </div>

              {/* Status Switcher Buttons */}
              <div className="pt-2 border-t border-[#E2E2E2] flex items-center gap-2">
                {isConfirmed && (
                  <button
                    onClick={() => updateReservationStatus(res.id, 'en_uso')}
                    className="flex-1 py-1.5 rounded-xl bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa] font-black text-xs transition"
                  >
                    Marcar En Uso
                  </button>
                )}
                {isInUse && (
                  <button
                    onClick={() => updateReservationStatus(res.id, 'finalizada')}
                    className="flex-1 py-1.5 rounded-xl border border-[#E2E2E2] text-[#34313A] font-bold text-xs hover:bg-[#FBEEB9]/20 transition"
                  >
                    Finalizar Estadía
                  </button>
                )}
                <button
                  onClick={() => updateReservationStatus(res.id, 'cancelada')}
                  className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          );
        })}

        {filteredReservations.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#34313A]/50 bg-white rounded-3xl border border-[#E2E2E2]">
            <CalendarCheck2 className="w-12 h-12 mx-auto text-[#34313A]/30 mb-2" />
            <p className="text-sm font-bold text-[#34313A]">No hay reservas para esta fecha</p>
          </div>
        )}
      </div>

      {/* New Reservation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34313A]/70 p-4">
          <form
            onSubmit={handleCreateReservation}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-[#E2E2E2]"
          >
            <h3 className="font-black text-base text-[#34313A]">Registrar Nueva Reserva</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#34313A]">Nombre del Huésped:</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Laura Domínguez"
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#34313A]">Teléfono:</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+54 9 223..."
                  className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#34313A]">Email (opcional):</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="laura@gmail.com"
                  className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#34313A]">Ubicación Asignada:</label>
                <select
                  value={locationCode}
                  onChange={(e) => setLocationCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] font-bold focus:outline-none focus:border-[#C1E7FF]"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.code}>
                      {l.code} - {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#34313A]">Franja / Turno:</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
                >
                  <option value="dia_completo">Día Completo (08:30 a 20:30)</option>
                  <option value="turno_manana">Turno Mañana (08:30 a 14:30)</option>
                  <option value="turno_tarde">Turno Tarde (14:30 a 20:30)</option>
                  <option value="semana">Semana Completa</option>
                  <option value="quincena">Quincena de Verano</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#34313A]">Pax:</label>
                <input
                  type="number"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-[#E2E2E2] text-xs text-center text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#34313A]">Seña ($):</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-[#E2E2E2] text-xs text-right font-bold text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#34313A]">Total ($):</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-[#E2E2E2] text-xs text-right font-black text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#34313A]">Observaciones:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Reposera adicional cerca del mar..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] resize-none focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#34313A]/70 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa]"
              >
                Guardar Reserva
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
