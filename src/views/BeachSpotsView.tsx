import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { QRCodeModal } from '../components/QRCodeModal';
import { LocationItem, LocationStatus } from '../types';
import {
  Umbrella,
  QrCode,
  CreditCard,
  User,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const BeachSpotsView: React.FC = () => {
  const { locations, updateLocationStatus, setSelectedLocationCode, setActiveView } = useBalneario();
  const [filterType, setFilterType] = useState<'todos' | 'carpa' | 'sombrilla'>('todos');
  const [search, setSearch] = useState('');
  const [selectedQRLoc, setSelectedQRLoc] = useState<LocationItem | null>(null);

  const beachSpots = locations.filter((l) => {
    if (l.type !== 'carpa' && l.type !== 'sombrilla') return false;
    if (filterType !== 'todos' && l.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q) || (l.currentGuestName?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#202428]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#202428] tracking-tight">
              Gestión de Carpas & Sombrillas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#55C7E8]/20 text-[#202428]">
              SOMBRA DE PLAYA
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Control visual de parcelas en arena seca, huéspedes asignados y pedidos asociados por QR.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'todos'
                ? 'bg-[#55C7E8] text-[#202428] shadow-xs font-black'
                : 'bg-white border border-gray-200 text-[#202428]'
            }`}
          >
            Todas ({locations.filter((l) => l.type === 'carpa' || l.type === 'sombrilla').length})
          </button>
          <button
            onClick={() => setFilterType('carpa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'carpa'
                ? 'bg-[#55C7E8] text-[#202428] shadow-xs font-black'
                : 'bg-white border border-gray-200 text-[#202428]'
            }`}
          >
            Carpas ({locations.filter((l) => l.type === 'carpa').length})
          </button>
          <button
            onClick={() => setFilterType('sombrilla')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'sombrilla'
                ? 'bg-[#55C7E8] text-[#202428] shadow-xs font-black'
                : 'bg-white border border-gray-200 text-[#202428]'
            }`}
          >
            Sombrillas ({locations.filter((l) => l.type === 'sombrilla').length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o nombre de cliente..."
          className="w-full bg-white pl-10 pr-4 py-2 rounded-2xl border border-gray-200 text-xs text-[#202428] focus:outline-hidden focus:border-[#55C7E8] shadow-2xs"
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
              className={`p-4 rounded-3xl border shadow-xs bg-white transition hover:shadow-md flex flex-col justify-between space-y-3 ${
                isOccupied
                  ? 'border-[#F47B35] ring-2 ring-[#F47B35]/15'
                  : isReserved
                  ? 'border-[#FFD43B] ring-2 ring-[#FFD43B]/15'
                  : 'border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FFD43B]/20 text-[#202428] flex items-center justify-center font-bold text-xs">
                      <Umbrella className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#202428] block leading-tight">
                        {spot.code}
                      </span>
                      <span className="text-[10px] text-gray-400 block">{spot.sectorName}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isOccupied
                        ? 'bg-[#F47B35] text-white'
                        : isReserved
                        ? 'bg-[#FFD43B] text-[#202428]'
                        : 'bg-[#55C7E8]/20 text-[#202428]'
                    }`}
                  >
                    {spot.status}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-gray-50 text-xs space-y-1">
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Capacidad:</span>
                    <strong className="text-[#202428]">{spot.capacity} personas</strong>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Huésped:</span>
                    <strong className="text-[#202428] truncate max-w-[120px]">
                      {spot.currentGuestName || 'Libre'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedQRLoc(spot)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-[#55C7E8]/20 hover:text-[#202428] transition"
                  title="Ver QR del cliente"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                {isAvailable ? (
                  <button
                    onClick={() => {
                      const guest = prompt(`Asignar huésped a ${spot.code}:`);
                      if (guest && guest.trim()) {
                        updateLocationStatus(spot.id, 'ocupada', guest.trim());
                      }
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#F47B35] hover:bg-[#e06824] text-white font-extrabold text-xs transition"
                  >
                    Ocupar / Asignar
                  </button>
                ) : (
                  <button
                    onClick={() => updateLocationStatus(spot.id, 'disponible')}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-gray-200 text-[#202428] font-bold text-xs hover:bg-gray-100 transition"
                  >
                    Liberar Sombra
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedLocationCode(spot.code);
                    setActiveView('pos');
                  }}
                  className="py-1.5 px-3 rounded-xl bg-[#55C7E8]/15 text-[#202428] font-bold text-xs hover:bg-[#55C7E8]/30 transition"
                  title="Abrir venta POS para este spot"
                >
                  POS
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedQRLoc && (
        <QRCodeModal location={selectedQRLoc} onClose={() => setSelectedQRLoc(null)} />
      )}
    </div>
  );
};
