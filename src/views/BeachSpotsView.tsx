import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { QRCodeModal } from '../components/QRCodeModal';
import { LocationItem } from '../types';
import {
  Umbrella,
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#34313A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#34313A] tracking-tight">
              Gestión de Carpas & Sombrillas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#C1E7FF] text-[#34313A]">
              SOMBRA DE PLAYA
            </span>
          </div>
          <p className="text-xs text-[#34313A]/70 mt-0.5">
            Control visual de parcelas en arena seca, huéspedes asignados y pedidos asociados por QR.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'todos'
                ? 'bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa] shadow-sm font-black'
                : 'bg-white border border-[#E2E2E2] text-[#34313A]'
            }`}
          >
            Todas ({locations.filter((l) => l.type === 'carpa' || l.type === 'sombrilla').length})
          </button>
          <button
            onClick={() => setFilterType('carpa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'carpa'
                ? 'bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa] shadow-sm font-black'
                : 'bg-white border border-[#E2E2E2] text-[#34313A]'
            }`}
          >
            Carpas ({locations.filter((l) => l.type === 'carpa').length})
          </button>
          <button
            onClick={() => setFilterType('sombrilla')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'sombrilla'
                ? 'bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa] shadow-sm font-black'
                : 'bg-white border border-[#E2E2E2] text-[#34313A]'
            }`}
          >
            Sombrillas ({locations.filter((l) => l.type === 'sombrilla').length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#34313A]/50 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o nombre de cliente..."
          className="w-full bg-white pl-10 pr-4 py-2 rounded-2xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF] shadow-sm"
        />
      </div>

      {/* Beach Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {beachSpots.map((spot) => {
          const isOccupied = spot.status === 'ocupada';
          const isReserved = spot.status === 'reservada';
          const isAvailable = spot.status === 'disponible';

          return (
            <div
              key={spot.id}
              className={`p-4 rounded-3xl border shadow-sm bg-white transition hover:shadow-md flex flex-col justify-between space-y-3 ${
                isOccupied
                  ? 'border-[#F68F57] ring-2 ring-[#F68F57]/20'
                  : isReserved
                  ? 'border-[#FBEEB9] ring-2 ring-[#FBEEB9]'
                  : 'border-[#E2E2E2]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FBEEB9] text-[#34313A] flex items-center justify-center font-bold text-xs">
                      <Umbrella className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#34313A] block leading-tight">
                        {spot.code}
                      </span>
                      <span className="text-[10px] text-[#34313A]/60 block">{spot.sectorName}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isOccupied
                        ? 'bg-[#F68F57] text-white'
                        : isReserved
                        ? 'bg-[#FBEEB9] text-[#34313A] border border-[#e8d799]'
                        : 'bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]'
                    }`}
                  >
                    {spot.status}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-[#FBEEB9]/20 text-xs space-y-1 border border-[#E2E2E2]">
                  <div className="flex justify-between text-[#34313A]/70 text-[11px]">
                    <span>Capacidad:</span>
                    <strong className="text-[#34313A]">{spot.capacity} personas</strong>
                  </div>
                  <div className="flex justify-between text-[#34313A]/70 text-[11px]">
                    <span>Huésped:</span>
                    <strong className="text-[#34313A] truncate max-w-[120px]">
                      {spot.currentGuestName || 'Libre'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-[#E2E2E2] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedQRLoc(spot)}
                  className="p-2 rounded-xl border border-[#E2E2E2] text-[#34313A] hover:bg-[#C1E7FF] transition"
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
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa] font-black text-xs transition"
                  >
                    Ocupar / Asignar
                  </button>
                ) : (
                  <button
                    onClick={() => updateLocationStatus(spot.id, 'disponible')}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-[#E2E2E2] text-[#34313A] font-bold text-xs hover:bg-[#FBEEB9]/20 transition"
                  >
                    Liberar Sombra
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedLocationCode(spot.code);
                    setActiveView('pos');
                  }}
                  className="py-1.5 px-3 rounded-xl bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa] font-black text-xs transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34313A]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E2E2]">
            <h3 className="font-black text-base text-[#34313A]">
              Asignar Huésped a {assigningSpot.code}
            </h3>
            <p className="text-xs text-[#34313A]/70">
              Registrá el nombre del titular para control de consumos y comanda gastronómica.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#34313A]">Nombre y Apellido del Titular:</label>
              <input
                type="text"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder="Ej: Familia Rossi"
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAssigningSpot(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#34313A]/70 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa]"
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
