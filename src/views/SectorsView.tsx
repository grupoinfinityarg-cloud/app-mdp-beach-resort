import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { LocationItem, LocationStatus, LocationType } from '../types';
import { QRCodeModal } from '../components/QRCodeModal';
import {
  QrCode,
  Edit2,
  Plus,
  Filter,
} from 'lucide-react';

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
        return 'bg-[#C1E7FF] text-[#34313A] border-[#a9dbfa]';
      case 'ocupada':
        return 'bg-[#F68F57] text-white border-[#F68F57]';
      case 'reservada':
        return 'bg-[#FBEEB9] text-[#34313A] border-[#e8d799]';
      case 'limpieza':
        return 'bg-gray-100 text-[#34313A] border-[#E2E2E2]';
      case 'mantenimiento':
        return 'bg-rose-100 text-rose-900 border-rose-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[#34313A]">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#34313A] tracking-tight">
              Mapa & Sectores del Balneario
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#C1E7FF] text-[#34313A]">
              {locations.length} UBICACIONES
            </span>
          </div>
          <p className="text-xs text-[#34313A]/70 mt-0.5">
            Organización de zonas de playa, carpas, sombrillas y restaurante con códigos QR vinculados.
          </p>
        </div>

        <button
          onClick={() => setShowNewLocationModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa] font-black text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-[#34313A]" />
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
                  ? 'bg-[#C1E7FF] text-[#34313A] border-[#a9dbfa] shadow-sm ring-2 ring-[#C1E7FF]/50 font-bold'
                  : 'bg-white hover:bg-[#FBEEB9]/20 text-[#34313A] border-[#E2E2E2]'
              }`}
            >
              <div>
                <div className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-[#34313A]' : 'text-[#F68F57]'}`}>
                  {sec.type}
                </div>
                <h4 className="font-extrabold text-xs mt-0.5 leading-snug line-clamp-1 text-[#34313A]">
                  {sec.name}
                </h4>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                <span className={isSelected ? 'text-[#34313A]/80' : 'text-[#34313A]/60'}>Ocupación</span>
                <span className="font-black text-[#34313A]">{occupied}/{locsInSector.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E2E2] shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#34313A]/50" />
          <span className="font-bold text-[#34313A]/80">Filtrando:</span>
          <span className="font-black text-[#34313A] bg-[#C1E7FF] px-2.5 py-0.5 rounded-md border border-[#a9dbfa]">
            {selectedSectorFilter === 'todos' ? 'Todos los sectores' : sectors.find((s) => s.id === selectedSectorFilter)?.name}
          </span>
          {selectedSectorFilter !== 'todos' && (
            <button
              onClick={() => setSelectedSectorFilter('todos')}
              className="text-[#34313A] underline text-xs font-bold hover:text-[#F68F57]"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#34313A]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C1E7FF] border border-[#a9dbfa]" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F68F57]" /> Ocupada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBEEB9] border border-[#e8d799]" /> Reservada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Limpieza
          </span>
        </div>
      </div>

      {/* Locations Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredLocations.map((loc) => {
          return (
            <div
              key={loc.id}
              className="bg-white rounded-3xl border border-[#E2E2E2] p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-[#34313A]">{loc.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(loc.status)}`}>
                      {loc.status}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedLocationForQR(loc)}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#C1E7FF] text-[#34313A] transition"
                    title="Ver Código QR Oficial"
                  >
                    <QrCode className="w-4 h-4 text-[#34313A]" />
                  </button>
                </div>

                <div className="text-xs font-bold text-[#34313A] mt-1">{loc.name}</div>
                <div className="text-[11px] text-[#34313A]/60">{loc.sectorName}</div>

                {loc.currentGuestName && (
                  <div className="mt-2 text-xs font-semibold text-[#34313A] bg-[#FBEEB9]/40 p-2 rounded-xl border border-[#FBEEB9]">
                    Ocupante: <strong className="text-[#34313A]">{loc.currentGuestName}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#E2E2E2] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenStatusEdit(loc)}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-[#E2E2E2] text-[#34313A] font-bold text-xs hover:bg-[#FBEEB9]/20 transition flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#34313A]" />
                  <span>Estado</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedLocationCode(loc.code);
                    setActiveView('pos');
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa] font-black text-xs transition flex items-center justify-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34313A]/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E2E2]">
            <h3 className="font-black text-base text-[#34313A]">
              Modificar Estado de {editingLocation.name} ({editingLocation.code})
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#34313A]">Estado Operativo:</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as LocationStatus)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF] font-semibold"
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
                <label className="text-xs font-bold text-[#34313A]">Nombre del Huésped o Cliente:</label>
                <input
                  type="text"
                  value={editGuestName}
                  onChange={(e) => setEditGuestName(e.target.value)}
                  placeholder="Ej: Familia Rossi, Martín Pérez..."
                  className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLocation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#34313A]/70 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatus}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa]"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Location Modal */}
      {showNewLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34313A]/70 p-4">
          <form
            onSubmit={handleCreateLocation}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E2E2]"
          >
            <h3 className="font-black text-base text-[#34313A]">Nueva Ubicación en Balneario</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#34313A]">Código Único (Ej: C-21, S-30, M-15):</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="C-07"
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs font-mono font-bold text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#34313A]">Nombre descriptivo:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Carpa VIP 07"
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#34313A]">Tipo de Ubicación:</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as LocationType)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              >
                <option value="carpa">Carpa de Playa</option>
                <option value="sombrilla">Sombrilla de Playa</option>
                <option value="mesa_exterior">Mesa Exterior / Deck</option>
                <option value="mesa_interior">Mesa Restaurante Interior</option>
                <option value="mostrador">Mostrador / Barra</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#34313A]">Sector de Asignación:</label>
              <select
                value={newSectorId}
                onChange={(e) => setNewSectorId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#34313A]/70 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa]"
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
