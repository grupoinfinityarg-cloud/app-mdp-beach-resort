import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { QRCodeModal } from '../components/QRCodeModal';
import { LocationItem } from '../types';
import {
  Umbrella,
  Tent,
  Utensils,
  Beer,
  QrCode,
  Search,
} from 'lucide-react';

export const BeachSpotsView: React.FC = () => {
  const { locations, updateLocationStatus, setSelectedLocationCode, setActiveView } = useBalneario();
  const [filterType, setFilterType] = useState<'todos' | 'carpa' | 'sombrilla'>('todos');
  const [search, setSearch] = useState('');
  const [selectedQRLoc, setSelectedQRLoc] = useState<LocationItem | null>(null);
  const [assigningSpot, setAssigningSpot] = useState<LocationItem | null>(null);
  const [guestNameInput, setGuestNameInput] = useState('');

  const beachSpots = locations.filter((l) => {
    if (l.type !== 'carpa' && l.type !== 'sombrilla') return false;
    if (filterType !== 'todos' && l.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q) || (l.currentGuestName?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const handleConfirmAssign = () => {
    if (assigningSpot) {
      updateLocationStatus(assigningSpot.id, 'ocupada', guestNameInput.trim() || 'Huésped Balneario');
      setAssigningSpot(null);
      setGuestNameInput('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#0F172A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
              Gestión de Carpas & Sombrillas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E0F2FE] text-[#0369A1]">
              SOMBRA DE PLAYA
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Control visual de parcelas en arena seca, huéspedes asignados y pedidos asociados por QR.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'todos'
                ? 'bg-[#0284C7] text-white border border-[#0284C7] shadow-sm font-black'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Todas ({locations.filter((l) => l.type === 'carpa' || l.type === 'sombrilla').length})
          </button>
          <button
            onClick={() => setFilterType('carpa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'carpa'
                ? 'bg-[#0284C7] text-white border border-[#0284C7] shadow-sm font-black'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Carpas ({locations.filter((l) => l.type === 'carpa').length})
          </button>
          <button
            onClick={() => setFilterType('sombrilla')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'sombrilla'
                ? 'bg-[#0284C7] text-white border border-[#0284C7] shadow-sm font-black'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Sombrillas ({locations.filter((l) => l.type === 'sombrilla').length})
          </button>
        </div>
      </div>

      {/* Search Input & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre de cliente..."
            className="w-full bg-white pl-10 pr-4 py-2 rounded-2xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] shadow-sm"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#64748B] bg-white px-3.5 py-2 rounded-2xl border border-[#E2E8F0]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-emerald-600" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Ocupada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] border border-[#0369A1]" /> Reservada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] border border-amber-500" /> Limpieza
          </span>
        </div>
      </div>

      {/* Beach Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {beachSpots.map((spot) => {
          const isOccupied = spot.status === 'ocupada';
          const isReserved = spot.status === 'reservada';
          const isCleaning = spot.status === 'limpieza';
          const isAvailable = spot.status === 'disponible';

          return (
            <div
              key={spot.id}
              className={`p-4 rounded-3xl border shadow-sm bg-white transition hover:shadow-md flex flex-col justify-between space-y-3 ${
                isOccupied
                  ? 'border-rose-400 ring-2 ring-rose-400/20'
                  : isReserved
                  ? 'border-sky-400 ring-2 ring-sky-400/20'
                  : isCleaning
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : 'border-emerald-300 ring-2 ring-emerald-300/15'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isOccupied ? 'bg-rose-100 text-rose-700' : isReserved ? 'bg-sky-100 text-sky-700' : isCleaning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {spot.type === 'carpa' ? (
                        <Tent className="w-4 h-4" />
                      ) : spot.type === 'sombrilla' ? (
                        <Umbrella className="w-4 h-4" />
                      ) : spot.type === 'mostrador' ? (
                        <Beer className="w-4 h-4" />
                      ) : (
                        <Utensils className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#0F172A] block leading-tight">
                        {spot.code}
                      </span>
                      <span className="text-[10px] text-[#64748B] block font-medium">
                        {spot.type === 'carpa' ? 'Carpa' : spot.type === 'sombrilla' ? 'Sombrilla' : 'Ubicación'} · {spot.sectorName}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isOccupied
                        ? 'bg-[#EF4444] text-white'
                        : isReserved
                        ? 'bg-[#E0F2FE] text-[#0369A1] border border-sky-300'
                        : isCleaning
                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-[#D1FAE5] text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {spot.status}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-[#FFFBEB] text-xs space-y-1 border border-[#FDE68A]">
                  <div className="flex justify-between text-[#92400E] text-[11px]">
                    <span>Capacidad:</span>
                    <strong className="text-[#0F172A]">{spot.capacity} personas</strong>
                  </div>
                  <div className="flex justify-between text-[#92400E] text-[11px]">
                    <span>Huésped:</span>
                    <strong className="text-[#0F172A] truncate max-w-[120px]">
                      {spot.currentGuestName || 'Libre'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedQRLoc(spot)}
                  className="p-2 rounded-xl border border-[#E2E8F0] text-[#0284C7] hover:bg-[#E0F2FE] transition"
                  title="Ver QR del cliente"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                {isAvailable ? (
                  <button
                    onClick={() => {
                      setAssigningSpot(spot);
                      setGuestNameInput('');
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white border border-[#0284C7] font-black text-xs transition"
                  >
                    Ocupar / Asignar
                  </button>
                ) : (
                  <button
                    onClick={() => updateLocationStatus(spot.id, 'disponible')}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-[#E2E8F0] text-[#64748B] font-bold text-xs hover:bg-[#F0F4F8] transition"
                  >
                    Liberar Sombra
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedLocationCode(spot.code);
                    setActiveView('pos');
                  }}
                  className="py-1.5 px-3 rounded-xl bg-[#E0F2FE] hover:bg-sky-200 text-[#0369A1] border border-sky-300 font-black text-xs transition"
                  title="Abrir venta POS para este spot"
                >
                  POS
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Spot Modal */}
      {assigningSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E8F0]">
            <h3 className="font-black text-base text-[#0F172A]">
              Asignar Huésped a {assigningSpot.code}
            </h3>
            <p className="text-xs text-[#64748B]">
              Registrá el nombre del titular para control de consumos y comanda gastronómica.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Nombre y Apellido del Titular:</label>
              <input
                type="text"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder="Ej: Familia Rossi"
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAssigningSpot(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F0F4F8]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#0284C7] hover:bg-[#0369A1] text-white border border-[#0284C7]"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedQRLoc && (
        <QRCodeModal location={selectedQRLoc} onClose={() => setSelectedQRLoc(null)} />
      )}
    </div>
  );
};
