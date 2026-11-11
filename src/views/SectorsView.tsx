import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { LocationItem, LocationStatus, LocationType } from '../types';
import { QRCodeModal } from '../components/QRCodeModal';
import {
  QrCode,
  Edit2,
  Plus,
  Filter,
  Tent,
  Umbrella,
  Utensils,
  Beer,
  Waves,
} from 'lucide-react';

export const getLocationTypeIcon = (type: LocationType, className = "w-4 h-4") => {
  switch (type) {
    case 'carpa':
      return <Tent className={className} />;
    case 'sombrilla':
      return <Umbrella className={className} />;
    case 'mesa_exterior':
    case 'mesa_interior':
      return <Utensils className={className} />;
    case 'mostrador':
      return <Beer className={className} />;
    case 'pileta':
    case 'solarium':
      return <Waves className={className} />;
    default:
      return <Tent className={className} />;
  }
};

export const getLocationTypeLabel = (type: LocationType) => {
  switch (type) {
    case 'carpa':
      return 'Carpa';
    case 'sombrilla':
      return 'Sombrilla';
    case 'mesa_exterior':
      return 'Mesa Exterior';
    case 'mesa_interior':
      return 'Mesa Salón';
    case 'mostrador':
      return 'Barra / Mostrador';
    case 'pileta':
      return 'Pileta';
    case 'solarium':
      return 'Solárium';
    default:
      return type;
  }
};

export const SectorsView: React.FC = () => {
  const { sectors, locations, updateLocationStatus, addLocation, setActiveView, setSelectedLocationCode } =
    useBalneario();

  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('todos');
  const [selectedLocationForQR, setSelectedLocationForQR] = useState<LocationItem | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [editStatus, setEditStatus] = useState<LocationStatus>('disponible');
  const [editGuestName, setEditGuestName] = useState<string>('');

  const [showNewLocationModal, setShowNewLocationModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<LocationType>('carpa');
  const [newSectorId, setNewSectorId] = useState(sectors[0]?.id || 'sec-carpas-vip');

  const filteredLocations = locations.filter((loc) => {
    if (selectedSectorFilter !== 'todos' && loc.sectorId !== selectedSectorFilter) {
      return false;
    }
    return true;
  });

  const handleOpenStatusEdit = (loc: LocationItem) => {
    setEditingLocation(loc);
    setEditStatus(loc.status);
    setEditGuestName(loc.currentGuestName || '');
  };

  const handleSaveStatus = () => {
    if (!editingLocation) return;
    updateLocationStatus(editingLocation.id, editStatus, editGuestName.trim() || undefined);
    setEditingLocation(null);
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const sector = sectors.find((s) => s.id === newSectorId);
    addLocation({
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      type: newType,
      sectorId: newSectorId,
      sectorName: sector ? sector.name : 'Sector Playa',
      capacity: newType === 'carpa' ? 6 : 4,
      status: 'disponible',
      qrPayload: newCode.trim().toUpperCase(),
    });

    setShowNewLocationModal(false);
    setNewCode('');
    setNewName('');
  };

  const getStatusColor = (status: LocationStatus) => {
    switch (status) {
      case 'disponible':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'ocupada':
        return 'bg-rose-500 text-white border-rose-500';
      case 'reservada':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'limpieza':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'mantenimiento':
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#0F172A]">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
              Mapa & Sectores del Balneario
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E0F2FE] text-[#0369A1]">
              {locations.length} UBICACIONES
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Organización de zonas de playa, carpas, sombrillas y restaurante con códigos QR vinculados.
          </p>
        </div>

        <button
          onClick={() => setShowNewLocationModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Agregar Ubicación</span>
        </button>
      </div>

      {/* Sectors Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {sectors.map((sec) => {
          const locsInSector = locations.filter((l) => l.sectorId === sec.id);
          const occupied = locsInSector.filter((l) => l.status === 'ocupada' || l.status === 'reservada').length;
          const isSelected = selectedSectorFilter === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => setSelectedSectorFilter(isSelected ? 'todos' : sec.id)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#E0F2FE] text-[#0369A1] border-[#0284C7] shadow-sm ring-2 ring-[#0284C7]/30 font-bold'
                  : 'bg-white hover:bg-[#F0F4F8] text-[#0F172A] border-[#E2E8F0]'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded-lg ${isSelected ? 'bg-[#0284C7]/15 text-[#0369A1]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                    {getLocationTypeIcon(sec.type, "w-3 h-3")}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider truncate ${isSelected ? 'text-[#0369A1]' : 'text-[#64748B]'}`}>
                    {getLocationTypeLabel(sec.type)}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs mt-1.5 leading-snug line-clamp-1 text-[#0F172A]">
                  {sec.name}
                </h4>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                <span className={isSelected ? 'text-[#0369A1]' : 'text-[#64748B]'}>Ocupación</span>
                <span className="font-black text-[#0F172A]">{occupied}/{locsInSector.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <span className="font-bold text-[#64748B]">Filtrando:</span>
          <span className="font-black text-[#0369A1] bg-[#E0F2FE] px-2.5 py-0.5 rounded-md border border-[#BAE6FD]">
            {selectedSectorFilter === 'todos' ? 'Todos los sectores' : sectors.find((s) => s.id === selectedSectorFilter)?.name}
          </span>
          {selectedSectorFilter !== 'todos' && (
            <button
              onClick={() => setSelectedSectorFilter('todos')}
              className="text-[#0284C7] underline text-xs font-bold hover:text-[#0369A1]"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#0F172A]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Ocupada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-600" /> Reservada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500" /> Limpieza
          </span>
        </div>
      </div>

      {/* Locations Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredLocations.map((loc) => {
          return (
            <div
              key={loc.id}
              className="bg-white rounded-3xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[#0F172A] shrink-0 border border-gray-200">
                      {getLocationTypeIcon(loc.type, "w-4 h-4 text-[#0F172A]")}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-[#0F172A]">{loc.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusColor(loc.status)}`}>
                          {loc.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium block">{getLocationTypeLabel(loc.type)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedLocationForQR(loc)}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#E0F2FE] hover:text-[#0369A1] text-[#0F172A] transition"
                    title="Ver Código QR Oficial"
                  >
                    <QrCode className="w-4 h-4 text-current" />
                  </button>
                </div>

                <div className="text-xs font-bold text-[#0F172A] mt-1">{loc.name}</div>
                <div className="text-[11px] text-[#64748B]">{loc.sectorName}</div>

                {loc.currentGuestName && (
                  <div className="mt-2 text-xs font-semibold text-[#92400E] bg-[#FFFBEB] p-2 rounded-xl border border-[#FDE68A]">
                    Ocupante: <strong className="text-[#92400E] font-black">{loc.currentGuestName}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenStatusEdit(loc)}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-[#E2E8F0] text-[#0F172A] font-bold text-xs hover:bg-[#F0F4F8] transition flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#0F172A]" />
                  <span>Estado</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedLocationCode(loc.code);
                    setActiveView('pos');
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs transition flex items-center justify-center gap-1 shadow-xs"
                >
                  <span>Abrir POS</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Location Status Modal */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E8F0]">
            <h3 className="font-black text-base text-[#0F172A]">
              Modificar Estado de {editingLocation.name} ({editingLocation.code})
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Estado Operativo:</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as LocationStatus)}
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] font-semibold"
              >
                <option value="disponible">Disponible (Libre)</option>
                <option value="ocupada">Ocupada</option>
                <option value="reservada">Reservada</option>
                <option value="limpieza">En Limpieza / Desinfección</option>
                <option value="mantenimiento">Fuera de Servicio</option>
              </select>
            </div>

            {(editStatus === 'ocupada' || editStatus === 'reservada') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A]">Nombre del Huésped o Cliente:</label>
                <input
                  type="text"
                  value={editGuestName}
                  onChange={(e) => setEditGuestName(e.target.value)}
                  placeholder="Ej: Familia Rossi, Martín Pérez..."
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLocation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatus}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#0284C7] hover:bg-[#0369A1] text-white"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Location Modal */}
      {showNewLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/70 p-4">
          <form
            onSubmit={handleCreateLocation}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E8F0]"
          >
            <h3 className="font-black text-base text-[#0F172A]">Nueva Ubicación en Balneario</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Código Único (Ej: C-21, S-30, M-15):</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="C-07"
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs font-mono font-bold text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Nombre descriptivo:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Carpa VIP 07"
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Tipo de Ubicación:</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as LocationType)}
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              >
                <option value="carpa">⛺ Carpa de Playa</option>
                <option value="sombrilla">🏖️ Sombrilla de Playa</option>
                <option value="mesa_exterior">🍽️ Mesa Exterior / Deck</option>
                <option value="mesa_interior">🍽️ Mesa Restaurante Interior</option>
                <option value="mostrador">🍺 Mostrador / Barra</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Sector de Asignación:</label>
              <select
                value={newSectorId}
                onChange={(e) => setNewSectorId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewLocationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#0284C7] hover:bg-[#0369A1] text-white"
              >
                Crear Ubicación
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR Modal */}
      {selectedLocationForQR && (
        <QRCodeModal
          location={selectedLocationForQR}
          onClose={() => setSelectedLocationForQR(null)}
        />
      )}
    </div>
  );
};
