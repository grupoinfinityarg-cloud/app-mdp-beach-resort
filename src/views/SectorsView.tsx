import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { LocationItem, LocationStatus, LocationType } from '../types';
import { QRCodeModal } from '../components/QRCodeModal';
import {
  Map,
  Umbrella,
  Utensils,
  QrCode,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Waves,
  Eye,
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
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'ocupada':
        return 'bg-emerald-800 text-white border-emerald-900';
      case 'reservada':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'limpieza':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'mantenimiento':
        return 'bg-rose-100 text-rose-900 border-rose-300';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Mapa & Sectores del Balneario
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              {locations.length} UBICACIONES
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Organización de zonas de playa, carpas, sombrillas y restaurante con códigos QR vinculados.
          </p>
        </div>

        <button
          onClick={() => setShowNewLocationModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
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
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200'
              }`}
            >
              <div>
                <div className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {sec.type}
                </div>
                <h4 className="font-extrabold text-xs mt-0.5 leading-snug line-clamp-1">
                  {sec.name}
                </h4>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                <span className={isSelected ? 'text-emerald-200' : 'text-gray-500'}>Ocupación</span>
                <span className="font-extrabold">{occupied}/{locsInSector.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="font-bold text-gray-700">Filtrando:</span>
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
            {selectedSectorFilter === 'todos' ? 'Todos los sectores' : sectors.find((s) => s.id === selectedSectorFilter)?.name}
          </span>
          {selectedSectorFilter !== 'todos' && (
            <button
              onClick={() => setSelectedSectorFilter('todos')}
              className="text-emerald-700 underline text-xs font-bold"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-900" /> Ocupada
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reservada
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Limpieza
          </span>
        </div>
      </div>

      {/* Locations Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredLocations.map((loc) => {
          return (
            <div
              key={loc.id}
              className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-gray-900">{loc.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(loc.status)}`}>
                      {loc.status}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedLocationForQR(loc)}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 transition"
                    title="Ver Código QR Oficial"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs font-bold text-gray-800 mt-1">{loc.name}</div>
                <div className="text-[11px] text-gray-500">{loc.sectorName}</div>

                {loc.currentGuestName && (
                  <div className="mt-2 text-xs font-semibold text-emerald-900 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                    Ocupante: <strong>{loc.currentGuestName}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenStatusEdit(loc)}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Estado</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedLocationCode(loc.code);
                    setActiveView('pos');
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition flex items-center justify-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900">
              Modificar Estado de {editingLocation.name} ({editingLocation.code})
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Estado Operativo:</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as LocationStatus)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600 font-semibold"
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
                <label className="text-xs font-bold text-gray-700">Nombre del Huésped o Cliente:</label>
                <input
                  type="text"
                  value={editGuestName}
                  onChange={(e) => setEditGuestName(e.target.value)}
                  placeholder="Ej: Familia Rossi, Martín Pérez..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLocation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatus}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Location Modal */}
      {showNewLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleCreateLocation}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-black text-base text-gray-900">Nueva Ubicación en Balneario</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Código Único (Ej: C-21, S-30, M-15):</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="C-07"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Nombre descriptivo:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Carpa VIP 07"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Tipo de Ubicación:</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as LocationType)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
              >
                <option value="carpa">Carpa de Playa</option>
                <option value="sombrilla">Sombrilla de Playa</option>
                <option value="mesa_exterior">Mesa Exterior / Deck</option>
                <option value="mesa_interior">Mesa Restaurante Interior</option>
                <option value="mostrador">Mostrador / Barra</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Sector de Asignación:</label>
              <select
                value={newSectorId}
                onChange={(e) => setNewSectorId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800"
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
