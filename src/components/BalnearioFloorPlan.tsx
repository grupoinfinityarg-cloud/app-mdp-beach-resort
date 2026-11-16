import React, { useState } from 'react';
import { LocationItem, LocationStatus } from '../types';
import { INITIAL_LOCATIONS } from '../data/seedData';
import {
  Tent,
  Umbrella,
  Utensils,
  Beer,
  Waves,
  QrCode,
  ShoppingCart,
  Users,
  Compass,
  Sparkles,
  Maximize2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkle,
  Sun,
  ChevronRight,
} from 'lucide-react';

interface BalnearioFloorPlanProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  onOpenStatusModal: (loc: LocationItem) => void;
  onOpenPOS: (loc: LocationItem) => void;
  onOpenQR: (loc: LocationItem) => void;
  onQuickChangeStatus?: (locId: string, newStatus: LocationStatus) => void;
}

export type DiagramSectorMode = 'playa' | 'piscina' | 'deck' | 'salon' | 'integral';

export const BalnearioFloorPlan: React.FC<BalnearioFloorPlanProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onOpenStatusModal,
  onOpenPOS,
  onOpenQR,
  onQuickChangeStatus,
}) => {
  const [sectorMode, setSectorMode] = useState<DiagramSectorMode>('playa');
  const [activeStatusFilter, setActiveStatusFilter] = useState<LocationStatus | 'todos'>('todos');

  // Count by status
  const counts = {
    todos: locations.length,
    disponible: locations.filter((l) => l.status === 'disponible').length,
    ocupada: locations.filter((l) => l.status === 'ocupada').length,
    reservada: locations.filter((l) => l.status === 'reservada').length,
    limpieza: locations.filter((l) => l.status === 'limpieza').length,
  };

  // Helper to test if a spot matches current status filter
  const isMatch = (loc: LocationItem) => {
    if (activeStatusFilter === 'todos') return true;
    return loc.status === activeStatusFilter;
  };

  const getStatusColorConfig = (status: LocationStatus) => {
    switch (status) {
      case 'disponible':
        return {
          bg: 'bg-emerald-500/15 text-emerald-950 border-emerald-500',
          border: 'border-emerald-500',
          badge: 'bg-emerald-500 text-white',
          dot: 'bg-emerald-500 beacon-pulse-available',
          label: 'Disponible',
          glow: 'ring-2 ring-emerald-400/80',
        };
      case 'ocupada':
        return {
          bg: 'bg-rose-500/15 text-rose-950 border-rose-500',
          border: 'border-rose-500',
          badge: 'bg-rose-500 text-white',
          dot: 'bg-rose-500 beacon-pulse-occupied',
          label: 'Ocupada',
          glow: 'ring-2 ring-rose-400/80',
        };
      case 'reservada':
        return {
          bg: 'bg-sky-500/15 text-sky-950 border-sky-500',
          border: 'border-sky-500',
          badge: 'bg-sky-500 text-white',
          dot: 'bg-sky-500 beacon-pulse-reserved',
          label: 'Reservada',
          glow: 'ring-2 ring-sky-400/80',
        };
      case 'limpieza':
        return {
          bg: 'bg-amber-500/15 text-amber-950 border-amber-500',
          border: 'border-amber-500',
          badge: 'bg-amber-400 text-slate-950',
          dot: 'bg-amber-400 beacon-pulse-cleaning',
          label: 'Limpieza',
          glow: 'ring-2 ring-amber-400/80',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-900 border-gray-300',
          border: 'border-gray-300',
          badge: 'bg-gray-400 text-white',
          dot: 'bg-gray-400',
          label: status,
          glow: '',
        };
    }
  };

  // Find location by code helper (with robust fallback to seed data)
  const findLoc = (code: string) =>
    locations.find((l) => l.code === code) ||
    INITIAL_LOCATIONS.find((l) => l.code === code);

  // Render a spot tile in the diagram
  const renderSpotTile = (
    code: string,
    label: string,
    type: 'carpa' | 'sombrilla' | 'mesa' | 'pileta' | 'barra' | 'solarium',
    extraClasses = ''
  ) => {
    const loc = findLoc(code);
    if (!loc) {
      return (
        <div className={`p-2 rounded-xl border border-dashed border-slate-300 bg-white/40 flex items-center justify-center text-[10px] text-slate-400 ${extraClasses}`}>
          {code}
        </div>
      );
    }

    const matches = isMatch(loc);
    const isSelected = selectedLocation?.id === loc.id;
    const cfg = getStatusColorConfig(loc.status);

    return (
      <button
        key={loc.id}
        type="button"
        onClick={() => onSelectLocation(loc)}
        className={`relative transition-all duration-300 rounded-2xl flex flex-col justify-between p-2.5 text-left border-2 cursor-pointer select-none group ${extraClasses} ${
          isSelected
            ? `ring-4 ring-[#0284C7] scale-105 z-20 ${cfg.bg} border-[#0284C7] shadow-lg`
            : matches
            ? `bg-white hover:scale-102 hover:shadow-md ${cfg.border || 'border-slate-300'}`
            : 'opacity-25 grayscale-[70%] border-dashed border-slate-300 bg-slate-100/70 scale-95 pointer-events-auto'
        }`}
        style={{
          boxShadow: isSelected
            ? '0 10px 25px -5px rgba(2, 132, 199, 0.35)'
            : matches && activeStatusFilter !== 'todos'
            ? '0 0 14px rgba(2, 132, 199, 0.2)'
            : undefined,
        }}
        title={`${loc.code}: ${loc.name} (${loc.status})`}
      >
        {/* Top Header: Code, QR button & Gentle Blinking Status Dot */}
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="font-heading font-black text-sm sm:text-base text-[#0F172A] tracking-tight">
            {loc.code}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenQR(loc);
              }}
              className="p-1 rounded-lg bg-[#F0F4F8] hover:bg-[#0284C7] hover:text-white text-[#0284C7] border border-[#CBD5E1] shadow-xs transition hover:scale-110 active:scale-95 cursor-pointer"
              title={`Escanear QR de ${loc.code}`}
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
            {/* Gentle Blinking Status Dot */}
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`}
              title={cfg.label}
            />
          </div>
        </div>

        {/* Center: Visual Representation */}
        <div className="my-1.5 flex items-center justify-center">
          {type === 'carpa' && (
            <div className={`w-9 h-8 rounded-lg flex items-center justify-center border ${
              loc.status === 'ocupada' ? 'bg-rose-100 text-rose-700 border-rose-300' :
              loc.status === 'disponible' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
              loc.status === 'reservada' ? 'bg-sky-100 text-sky-700 border-sky-300' :
              'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <Tent className="w-5 h-5" />
            </div>
          )}

          {type === 'sombrilla' && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-xs ${
              loc.status === 'ocupada' ? 'bg-rose-100 text-rose-700 border-rose-300' :
              loc.status === 'disponible' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
              loc.status === 'reservada' ? 'bg-sky-100 text-sky-700 border-sky-300' :
              'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <Umbrella className="w-4 h-4" />
            </div>
          )}

          {type === 'mesa' && (
            <div className={`w-9 h-8 rounded-xl flex items-center justify-center border ${
              loc.status === 'ocupada' ? 'bg-rose-100 text-rose-700 border-rose-300' :
              loc.status === 'disponible' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
              loc.status === 'reservada' ? 'bg-sky-100 text-sky-700 border-sky-300' :
              'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <Utensils className="w-4 h-4" />
            </div>
          )}

          {(type === 'pileta' || loc.type === 'pileta') && (
            <div className={`w-9 h-7 rounded-md flex items-center justify-center border shadow-xs ${
              loc.status === 'ocupada' ? 'bg-rose-100 text-rose-700 border-rose-300' :
              loc.status === 'disponible' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
              loc.status === 'reservada' ? 'bg-sky-100 text-sky-700 border-sky-300' :
              'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <Waves className="w-4 h-4" />
            </div>
          )}

          {(type === 'solarium' || loc.type === 'solarium') && (
            <div className={`w-9 h-7 rounded-md flex items-center justify-center border shadow-xs ${
              loc.status === 'ocupada' ? 'bg-rose-100 text-rose-700 border-rose-300' :
              loc.status === 'disponible' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
              loc.status === 'reservada' ? 'bg-sky-100 text-sky-700 border-sky-300' :
              'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <Sun className="w-4 h-4" />
            </div>
          )}

          {type === 'barra' && (
            <div className={`w-9 h-7 rounded-md flex items-center justify-center border ${
              loc.status === 'ocupada' ? 'bg-rose-100 text-rose-700 border-rose-300' :
              loc.status === 'disponible' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
              loc.status === 'reservada' ? 'bg-sky-100 text-sky-700 border-sky-300' :
              'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <Beer className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Footer info: guest or capacity */}
        <div className="w-full text-center truncate">
          {loc.currentGuestName ? (
            <span className="text-xs font-bold text-slate-800 truncate block">
              {loc.currentGuestName}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-semibold">
              Cap: {loc.capacity}p
            </span>
          )}
        </div>

        {/* Status pill bottom */}
        <div className="mt-1 w-full text-center">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${cfg.badge}`}>
            {loc.status}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* 1. SECTOR TABS (SCHEMAS) & STATUS FILTER CONTROLS */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-4 shadow-sm space-y-4">
        {/* Schema Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-start gap-3 sm:gap-5 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="p-2 rounded-xl bg-[#E0F2FE] text-[#0284C7]">
              <Compass className="w-4 h-4" />
            </span>
            <h3 className="font-heading font-black text-base sm:text-lg text-[#0F172A] tracking-tight">
              DISTRIBUCIÓN
            </h3>
          </div>

          {/* Diagram Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-[#F0F4F8] p-1.5 rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <button
              onClick={() => setSectorMode('playa')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                sectorMode === 'playa'
                  ? 'bg-[#0F2942] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
              }`}
            >
              <Tent className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Carpas & Sombrillas</span>
            </button>

            <button
              onClick={() => setSectorMode('piscina')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                sectorMode === 'piscina'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Piscina & Solárium</span>
            </button>

            <button
              onClick={() => setSectorMode('deck')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                sectorMode === 'deck'
                  ? 'bg-[#0F2942] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Deck & Terraza Marina</span>
            </button>

            <button
              onClick={() => setSectorMode('salon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                sectorMode === 'salon'
                  ? 'bg-[#0F2942] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
              }`}
            >
              <Beer className="w-3.5 h-3.5 text-emerald-400" />
              <span>4. Salón & Barra Interior</span>
            </button>

            <button
              onClick={() => setSectorMode('integral')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                sectorMode === 'integral'
                  ? 'bg-[#0F2942] text-white shadow-sm ring-2 ring-[#0284C7]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plano Maestro</span>
            </button>
          </div>
        </div>

        {/* Status Filters with Gentle Blinking Beacon Lights */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
          <span className="text-sm font-bold text-[#64748B] shrink-0 mr-1">
            Filtro de Estado en Vivo:
          </span>

          {/* Botón Disponible */}
            <button
              type="button"
              onClick={() => setActiveStatusFilter(activeStatusFilter === 'disponible' ? 'todos' : 'disponible')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                activeStatusFilter === 'disponible'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-500 ring-2 ring-emerald-400/50 shadow-sm font-black'
                  : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 beacon-pulse-available" />
              <span>Disponible</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900">
                {counts.disponible}
              </span>
            </button>

            {/* Botón Ocupada */}
            <button
              type="button"
              onClick={() => setActiveStatusFilter(activeStatusFilter === 'ocupada' ? 'todos' : 'ocupada')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                activeStatusFilter === 'ocupada'
                  ? 'bg-rose-100 text-rose-950 border-rose-500 ring-2 ring-rose-400/50 shadow-sm font-black'
                  : 'bg-white hover:bg-rose-50 text-slate-800 border-slate-200 hover:border-rose-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 beacon-pulse-occupied" />
              <span>Ocupada</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-200 text-rose-900">
                {counts.ocupada}
              </span>
            </button>

            {/* Botón Reservada */}
            <button
              type="button"
              onClick={() => setActiveStatusFilter(activeStatusFilter === 'reservada' ? 'todos' : 'reservada')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                activeStatusFilter === 'reservada'
                  ? 'bg-sky-100 text-sky-950 border-sky-500 ring-2 ring-sky-400/50 shadow-sm font-black'
                  : 'bg-white hover:bg-sky-50 text-slate-800 border-slate-200 hover:border-sky-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 beacon-pulse-reserved" />
              <span>Reservada</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-sky-200 text-sky-900">
                {counts.reservada}
              </span>
            </button>

            {/* Botón Limpieza */}
            <button
              type="button"
              onClick={() => setActiveStatusFilter(activeStatusFilter === 'limpieza' ? 'todos' : 'limpieza')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                activeStatusFilter === 'limpieza'
                  ? 'bg-amber-100 text-amber-950 border-amber-500 ring-2 ring-amber-400/50 shadow-sm font-black'
                  : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200 hover:border-amber-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 beacon-pulse-cleaning" />
              <span>Limpieza</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                {counts.limpieza}
              </span>
            </button>

            {/* Botón Todos / Reset */}
            <button
              type="button"
              onClick={() => setActiveStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeStatusFilter === 'todos'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Ver Todos ({counts.todos})
            </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. THE DIAGRAM CANVAS + RIGHT INSPECTOR (SPLIT VIEW) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Architectural Floor Plan Canvas (Takes 3 columns on large screens) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden p-4 sm:p-6 relative">
          
          {/* ========================================================== */}
          {/* DIAGRAM 1: CARPAS, SOMBRILLAS & PILETA / SOLÁRIUM */}
          {/* ========================================================== */}
          {(sectorMode === 'playa' || sectorMode === 'integral') && (
            <div className="space-y-6">
              {/* Ocean Coastline Banner */}
              <div className="relative rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-700 p-3 text-white overflow-hidden shadow-inner flex items-center justify-between">
                <div className="flex items-center gap-2 z-10">
                  <Waves className="w-5 h-5 text-cyan-200 animate-pulse" />
                  <span className="font-heading font-black text-xs sm:text-sm tracking-wider uppercase">
                    🌊 Océano Atlántico · Línea de Mar & Oleaje Costero
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-100 uppercase tracking-widest hidden sm:inline z-10">
                  Sector Frente de Playa (Arena Seca)
                </span>
                {/* Decorative wave shimmer */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
              </div>

              {/* Beach Layout Arena Canvas */}
              <div className="rounded-3xl bg-[#FFFDF5] border-2 border-[#FDE68A] p-4 sm:p-6 relative overflow-hidden shadow-xs">
                {/* Sand subtle grain pattern overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5d8b8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

                {/* Section Title */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      <Tent className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-heading font-black text-xs sm:text-sm text-[#92400E] uppercase tracking-wide">
                        Hilera Carpas VIP Frente al Mar & Sombrillas
                      </h4>
                      <p className="text-[11px] text-[#B45309]">
                        Distribución en arena seca con pasarela de madera central
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[10px] font-black uppercase font-mono">
                    Zona 1 · Playa
                  </span>
                </div>

                {/* FILA 1: CARPAS FRENTE AL MAR */}
                <div className="space-y-2 relative z-10 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                    <span>Fila 1 (Primera Línea de Mar):</span>
                    <span className="text-[10px] text-slate-400">Carpas C-01 a C-06</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {renderSpotTile('C-01', 'Carpa 01', 'carpa')}
                    {renderSpotTile('C-02', 'Carpa 02', 'carpa')}
                    {renderSpotTile('C-03', 'Carpa 03', 'carpa')}
                    {renderSpotTile('C-04', 'Carpa 04', 'carpa')}
                    {renderSpotTile('C-05', 'Carpa 05', 'carpa')}
                    {renderSpotTile('C-06', 'Carpa 06', 'carpa')}
                  </div>
                </div>

                {/* WOODEN BOARDWALK AISLE (PASARELA DE MADERA) */}
                <div className="my-4 py-2 px-4 rounded-xl bg-[#D97706]/15 border border-[#D97706]/30 flex items-center justify-between text-xs text-[#92400E] font-mono relative z-10">
                  <span>━━━ 🚶‍♂️ Pasarela de Madera Central hacia la Rompiente ━━━</span>
                  <span className="hidden sm:inline text-[10px]">Puesto de Guardavidas & Toallas</span>
                </div>

                {/* FILA 2: CARPAS SEGUNDA LÍNEA */}
                <div className="space-y-2 relative z-10 mb-6">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                    <span>Fila 2 (Sombra Intermedia):</span>
                    <span className="text-[10px] text-slate-400">Carpas C-07 a C-12</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {renderSpotTile('C-07', 'Carpa 07', 'carpa')}
                    {renderSpotTile('C-08', 'Carpa 08', 'carpa')}
                    {renderSpotTile('C-09', 'Carpa 09', 'carpa')}
                    {renderSpotTile('C-10', 'Carpa 10', 'carpa')}
                    {renderSpotTile('C-11', 'Carpa 11', 'carpa')}
                    {renderSpotTile('C-12', 'Carpa 12', 'carpa')}
                  </div>
                </div>

                {/* LOWER SPLIT: SOMBRILLAS (LEFT) + SWIMMING POOL (RIGHT - LIKE MORPHI PHOTO) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10 pt-4 border-t border-[#FDE68A]">
                  {/* Left: Sombrillas Grid */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Umbrella className="w-3.5 h-3.5 text-amber-600" />
                        <strong>Sector Sombrillas & Reposeras (S-01 a S-08):</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {renderSpotTile('S-01', 'Sombrilla 01', 'sombrilla')}
                      {renderSpotTile('S-02', 'Sombrilla 02', 'sombrilla')}
                      {renderSpotTile('S-03', 'Sombrilla 03', 'sombrilla')}
                      {renderSpotTile('S-04', 'Sombrilla 04', 'sombrilla')}
                      {renderSpotTile('S-05', 'Sombrilla 05', 'sombrilla')}
                      {renderSpotTile('S-06', 'Sombrilla 06', 'sombrilla')}
                      {renderSpotTile('S-07', 'Sombrilla 07', 'sombrilla')}
                      {renderSpotTile('S-08', 'Sombrilla 08', 'sombrilla')}
                    </div>
                  </div>

                  {/* Right: SWIMMING POOL & SOLARIUM (EXACTLY AS IN MORPHI PHOTO) */}
                  <div className="md:col-span-5 rounded-2xl bg-[#0F2942] p-4 border-2 border-[#1E3A5F] shadow-md relative overflow-hidden flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#0284C7] text-white">
                          <Waves className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-heading font-black text-xs uppercase tracking-wider text-white">
                            Piscina Climatizada & Solárium
                          </h4>
                          <span className="text-[10px] text-cyan-200 font-mono">
                            Agua a 28°C · Nado & Chapoteadero
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSectorMode('piscina')}
                        className="text-[10px] font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white px-2 py-1 rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Ver plano CAD ampliado de la piscina"
                      >
                        <span>Ver Plano</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Realistic CAD Swimming Pool Water Basin with Roman Steps (Morphi CAD reference) */}
                    <div className="relative my-2 rounded-2xl bg-gradient-to-b from-[#0284C7] via-[#0284C7] to-[#0369A1] border-4 border-white shadow-inner p-3 overflow-hidden text-center ring-2 ring-[#0F2942]">
                      {/* Water shimmer effect */}
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff30_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                      {/* Roman Curved Steps into Pool (Top-Right Corner like Morphi photo) */}
                      <div className="absolute top-0 right-2 w-12 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-full bg-white/20 pointer-events-none" />
                      <div className="absolute top-0 right-3 w-8 h-4 border-b-2 border-l-2 border-white/90 rounded-bl-full bg-white/30 pointer-events-none" />

                      <div className="relative z-10 py-1">
                        <div className="text-xs font-black tracking-wider text-white uppercase drop-shadow-sm flex items-center justify-center gap-1.5">
                          <span>🏊‍♂️ Espejo de Agua Principal</span>
                        </div>
                        <div className="text-[10px] text-cyan-100 font-mono mt-0.5">
                          Profundidad 1.40m · Carril Boyado
                        </div>
                      </div>
                    </div>

                    {/* Perimeter Sun Loungers & Gazebo */}
                    <div className="relative z-10 pt-2 border-t border-[#1E3A5F]">
                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono mb-2">
                        <span>Reposeras de Borde (P-01 a P-04) & Gazebo:</span>
                        <span className="text-cyan-300 font-bold">Solárium Deck</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {renderSpotTile('P-01', 'Pileta 01', 'pileta', '!p-1.5')}
                        {renderSpotTile('P-02', 'Pileta 02', 'pileta', '!p-1.5')}
                        {renderSpotTile('P-03', 'Pileta 03', 'pileta', '!p-1.5')}
                        {renderSpotTile('P-04', 'Pileta 04', 'pileta', '!p-1.5')}
                        {renderSpotTile('SOL-01', 'Gazebo', 'solarium', '!p-1.5')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* DIAGRAM 2: PISCINA CLIMATIZADA & COMPLEJO SOLARIUM VIP */}
          {/* ========================================================== */}
          {(sectorMode === 'piscina' || sectorMode === 'integral') && (
            <div className={`space-y-4 ${sectorMode === 'integral' ? 'mt-8 pt-8 border-t-2 border-slate-200' : ''}`}>
              {/* Solarium Travertine Deck Container with Architectural Boundary */}
              <div className="rounded-3xl bg-[#F0F7FB] border-4 border-[#0F2942] p-5 sm:p-7 relative overflow-hidden shadow-md">
                
                {/* Architectural Blueprint Grid Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

                {/* Section Header */}
                <div className="flex items-center justify-between mb-5 relative z-10 border-b-2 border-slate-300 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-[#0284C7] text-white shadow-xs">
                      <Waves className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-heading font-black text-sm sm:text-base text-[#0F2942] uppercase tracking-wide flex items-center gap-2">
                        <span>Complejo Piscina Climatizada & Solárium VIP</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-300">
                          Operativa 28°C
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        Distribución de espejo de agua, reposeras de borde perimetral y gazebos VIP
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#0F2942] text-white text-xs font-black uppercase font-mono tracking-wider hidden sm:inline">
                    Zona 2 · Piscina
                  </span>
                </div>

                {/* Specs Bar (Control de Calidad de Agua & Guardavidas) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 relative z-10 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex items-center gap-2">
                    <span className="text-base">🌡️</span>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Agua Climatizada</div>
                      <strong className="text-[#0F172A] text-xs">28°C Constante</strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex items-center gap-2">
                    <span className="text-base">🦺</span>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Seguridad</div>
                      <strong className="text-emerald-700 text-xs">Guardavidas Activo</strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex items-center gap-2">
                    <span className="text-base">🏊‍♂️</span>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Profundidad</div>
                      <strong className="text-[#0284C7] text-xs">0.50m a 1.40m</strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex items-center gap-2">
                    <span className="text-base">🍹</span>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Servicio en Reposera</div>
                      <strong className="text-[#92400E] text-xs">QR Pedidos Directo</strong>
                    </div>
                  </div>
                </div>

                {/* MAIN ARCHITECTURAL CAD POOL & SOLARIUM LAYOUT (MORPHI PHOTO SCHEME) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10 items-center">
                  
                  {/* CENTRAL / LEFT: LARGE SWIMMING POOL BASIN */}
                  <div className="lg:col-span-8 rounded-3xl bg-gradient-to-br from-[#0284C7] via-[#0284C7] to-[#0369A1] p-6 border-6 border-white shadow-xl relative overflow-hidden min-h-[260px] flex flex-col justify-between text-white ring-4 ring-[#0F2942]">
                    
                    {/* Water Shimmer Texture Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff35_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                    {/* Semicircular Roman Steps (Curved staircase inside the pool like Morphi photo) */}
                    <div className="absolute top-0 right-6 w-24 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-full bg-white/20 pointer-events-none flex items-center justify-center">
                      <span className="text-[9px] font-mono text-white/90 font-bold rotate-[-15deg]">Escalera Romana</span>
                    </div>
                    <div className="absolute top-0 right-8 w-16 h-8 border-b-2 border-l-2 border-white/90 rounded-bl-full bg-white/30 pointer-events-none" />

                    {/* Water Basin Top Info */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Waves className="w-5 h-5 text-white animate-pulse" />
                        <span className="font-heading font-black text-sm uppercase tracking-wider text-white drop-shadow-md">
                          🏊‍♂️ Piscina Central Balneario (20m x 8m)
                        </span>
                      </div>
                      <span className="text-[10px] bg-black/25 px-3 py-1 rounded-full font-mono font-black border border-white/20">
                        Área de Nado Libre & Recreación
                      </span>
                    </div>

                    {/* Center Lane Line Markers with depth division */}
                    <div className="my-6 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-xs text-center">
                        <span className="block text-[10px] font-mono text-cyan-100 font-bold uppercase">Sector Infantil</span>
                        <strong className="text-sm font-black text-white">0.50m Chapoteadero</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/20 border-2 border-white/40 backdrop-blur-xs text-center shadow-inner">
                        <span className="block text-[10px] font-mono text-white font-bold uppercase">Carril Central</span>
                        <strong className="text-sm font-black text-white">1.20m Nado Recreativo</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-xs text-center">
                        <span className="block text-[10px] font-mono text-cyan-100 font-bold uppercase">Carril Profundo</span>
                        <strong className="text-sm font-black text-white">1.40m Nado Libre</strong>
                      </div>
                    </div>

                    {/* Bottom Basin Footer */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-cyan-100 border-t border-white/20 pt-2">
                      <span>🌊 Recirculación continua con skimmers de superficie</span>
                      <span className="font-bold text-white">Piso atérmico y antideslizante</span>
                    </div>
                  </div>

                  {/* RIGHT / PERIMETER: SUN LOUNGERS & VIP GAZEBOS */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Borde Solárium: Reposeras P-01 a P-06 */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-[#CBD5E1] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Waves className="w-4 h-4 text-[#0284C7]" />
                          <strong className="text-xs font-black text-[#0F172A] uppercase">
                            Reposeras de Borde (P-01 a P-06)
                          </strong>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">Solárium Húmedo</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {renderSpotTile('P-01', 'Pileta 01', 'pileta')}
                        {renderSpotTile('P-02', 'Pileta 02', 'pileta')}
                        {renderSpotTile('P-03', 'Pileta 03', 'pileta')}
                        {renderSpotTile('P-04', 'Pileta 04', 'pileta')}
                        {renderSpotTile('P-05', 'Pileta 05', 'pileta')}
                        {renderSpotTile('P-06', 'Pileta 06', 'pileta')}
                      </div>
                    </div>

                    {/* Gazebos VIP Solárium */}
                    <div className="bg-[#FFFBEB] p-4 rounded-2xl border-2 border-[#FDE68A] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#FDE68A] pb-2">
                        <div className="flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-amber-600" />
                          <strong className="text-xs font-black text-[#92400E] uppercase">
                            Gazebos Solárium VIP
                          </strong>
                        </div>
                        <span className="text-[10px] font-mono text-amber-700 font-bold">Pérgola Techo Sombra</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {renderSpotTile('SOL-01', 'Gazebo 01', 'solarium')}
                        {renderSpotTile('SOL-02', 'Gazebo 02', 'solarium')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* DIAGRAM 3: DECK & TERRAZA MARINA */}
          {/* ========================================================== */}
          {(sectorMode === 'deck' || sectorMode === 'integral') && (
            <div className={`space-y-4 ${sectorMode === 'integral' ? 'mt-8 pt-8 border-t-2 border-slate-200' : ''}`}>
              {/* Deck Planks Container */}
              <div className="rounded-3xl bg-[#F7F3EA] border-4 border-[#1E3A5F] p-5 sm:p-6 relative overflow-hidden shadow-sm">
                {/* Wood plank horizontal lines texture */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_39px,#e8dfcf_40px)] [background-size:100%_40px] opacity-40 pointer-events-none" />

                {/* Section Header */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                      <Utensils className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-heading font-black text-xs sm:text-sm text-[#0F2942] uppercase tracking-wide">
                        Deck Exterior & Terraza Marina sobre Tarima
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        Mesas de exterior con sombrillón y vista franca a la rompiente
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] text-[10px] font-black uppercase font-mono">
                    Zona 3 · Deck
                  </span>
                </div>

                {/* Perimeter Glass Railing along the Ocean */}
                <div className="mb-4 py-1.5 px-4 rounded-xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-between text-xs text-[#0369A1] font-mono relative z-10">
                  <span>🌊 ━━━━ Baranda Perimetral de Vidrio Templado (Frente al Mar) ━━━━</span>
                  <span className="hidden sm:inline text-[10px]">Vista 180° a la Playa</span>
                </div>

                {/* Row 1: Tables directly in front of the railing (D-01 to D-04) */}
                <div className="space-y-2 relative z-10 mb-4">
                  <div className="text-[11px] font-bold text-slate-700 px-1">
                    Mesas Primera Línea (Baranda de Playa):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {renderSpotTile('D-01', 'Deck 01', 'mesa')}
                    {renderSpotTile('D-02', 'Deck 02', 'mesa')}
                    {renderSpotTile('D-03', 'Deck 03', 'mesa')}
                    {renderSpotTile('D-04', 'Deck 04', 'mesa')}
                  </div>
                </div>

                {/* Pergola Shaded Area Divider */}
                <div className="my-3 py-1.5 px-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E] font-mono flex items-center justify-between relative z-10">
                  <span>⛱️ ━━ Pérgola de Madera Teca con Lonas Microperforadas ━━</span>
                  <span className="hidden sm:inline text-[10px]">Sector Protección Solar</span>
                </div>

                {/* Row 2: Pergola Tables (D-05 to D-08) + Barra Exterior */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 relative z-10">
                  <div className="sm:col-span-8">
                    <div className="text-[11px] font-bold text-slate-700 px-1 mb-2">
                      Mesas en Pérgola:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {renderSpotTile('D-05', 'Deck 05', 'mesa')}
                      {renderSpotTile('D-06', 'Deck 06', 'mesa')}
                      {renderSpotTile('D-07', 'Deck 07', 'mesa')}
                      {renderSpotTile('D-08', 'Deck 08', 'mesa')}
                    </div>
                  </div>

                  {/* Barra Exterior & DJ */}
                  <div className="sm:col-span-4 rounded-2xl bg-[#0F2942] p-3 text-white flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-cyan-300 font-bold mb-1">
                        🍹 Barra Exterior & Sunsets
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Cocktails, jugos frescos y música lounge
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {renderSpotTile('B-01', 'Barra 01', 'barra', '!border-slate-600')}
                      {renderSpotTile('B-02', 'Barra 02', 'barra', '!border-slate-600')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* DIAGRAM 3: SALÓN RESTAURANTE & BARRA INTERIOR */}
          {/* ========================================================== */}
          {(sectorMode === 'salon' || sectorMode === 'integral') && (
            <div className={`space-y-4 ${sectorMode === 'integral' ? 'mt-8 pt-8 border-t-2 border-slate-200' : ''}`}>
              {/* Architectural Room Floor Plan with Thick Walls (as in Morphi photo) */}
              <div className="rounded-3xl bg-[#F8FAFC] border-8 border-[#0F2942] p-5 sm:p-6 relative overflow-hidden shadow-md">
                
                {/* Structural Walls & Blueprint Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

                {/* Section Header */}
                <div className="flex items-center justify-between mb-4 relative z-10 border-b-2 border-slate-300 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#0F2942] text-white">
                      <Beer className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-heading font-black text-xs sm:text-sm text-[#0F2942] uppercase tracking-wide">
                        Salón Restaurante Interior & Barra Cafetería
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        Plano edilicio con muros estructurales, accesos y pase de cocina
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0F2942] text-white text-[10px] font-black uppercase font-mono">
                    Zona 4 · Salón
                  </span>
                </div>

                {/* Top architectural zone: Glass window toward the sea */}
                <div className="mb-4 py-1.5 px-4 rounded-xl bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-between text-xs text-slate-700 font-mono relative z-10">
                  <span>🪟 ━━━━ Ventanal Panorámico Corredizo (Vista al Mar) ━━━━</span>
                  <span className="text-[10px] text-slate-500">M-01 y M-02 Frente a Cristal</span>
                </div>

                {/* Tables Grid organized by Aisle like Morphi */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
                  {/* Left Column: Tables M-01 to M-04 */}
                  <div className="md:col-span-4 space-y-2">
                    <div className="text-[11px] font-mono text-slate-500 font-bold px-1">Ala Norte (Ventana):</div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {renderSpotTile('M-01', 'Mesa 01', 'mesa')}
                      {renderSpotTile('M-02', 'Mesa 02', 'mesa')}
                      {renderSpotTile('M-03', 'Mesa 03', 'mesa')}
                      {renderSpotTile('M-04', 'Mesa 04', 'mesa')}
                    </div>
                  </div>

                  {/* Central Service Aisle with Wall Partitions */}
                  <div className="md:col-span-1 hidden md:flex flex-col items-center justify-center">
                    <div className="w-1.5 h-full bg-[#0F2942] rounded-full my-auto opacity-80" />
                    <span className="text-[9px] font-mono text-slate-400 rotate-90 my-2 whitespace-nowrap">
                      PASILLO MOZOS
                    </span>
                    <div className="w-1.5 h-full bg-[#0F2942] rounded-full my-auto opacity-80" />
                  </div>

                  {/* Center-Right Column: Tables M-05 to M-08 */}
                  <div className="md:col-span-4 space-y-2">
                    <div className="text-[11px] font-mono text-slate-500 font-bold px-1">Ala Sur (Salón Central):</div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {renderSpotTile('M-05', 'Mesa 05', 'mesa')}
                      {renderSpotTile('M-06', 'Mesa 06', 'mesa')}
                      {renderSpotTile('M-07', 'Mesa 07', 'mesa')}
                      {renderSpotTile('M-08', 'Mesa 08', 'mesa')}
                    </div>
                  </div>

                  {/* Right Column: Service Station / KDS & Cashier / Barra */}
                  <div className="md:col-span-3 space-y-3">
                    {/* Kitchen KDS Pass */}
                    <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Utensils className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pase Cocina (KDS)</span>
                      </div>
                      <p className="text-[10px] text-amber-800">
                        Comandas en pantalla táctil con campana sonoro
                      </p>
                    </div>

                    {/* POS Cashier Box */}
                    <div className="p-3 rounded-2xl bg-[#0F2942] text-white text-xs border border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-cyan-300">Caja Principal POS</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-slate-300 mb-2">
                        Arqueo y cobro táctil Mercado Pago / Efectivo
                      </p>
                      {renderSpotTile('B-03', 'Cafetería', 'barra', '!border-slate-600')}
                    </div>
                  </div>
                </div>

                {/* Bottom Entryway & Restrooms */}
                <div className="mt-4 pt-3 border-t-2 border-slate-300 flex items-center justify-between text-xs text-slate-500 font-mono relative z-10">
                  <span>🚪 Puerta Principal de Entrada (Acceso Balneario)</span>
                  <span>🚻 Sanitarios / Vestuarios</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 3. RIGHT SIDE INSPECTOR PANEL (AS IN MORPHI POS SCREEN) */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
              <h4 className="font-heading font-black text-sm text-[#0F172A] uppercase tracking-wide">
                Detalle de Ubicación
              </h4>
            </div>
            {selectedLocation && (
              <span className="text-[10px] font-mono text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded-full font-bold">
                {selectedLocation.code}
              </span>
            )}
          </div>

          {selectedLocation ? (
            <div className="space-y-4">
              {/* Badge & Name */}
              <div className="p-3.5 rounded-2xl bg-[#F0F4F8] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-base text-[#0F172A]">
                    {selectedLocation.code} · {selectedLocation.name}
                  </span>
                </div>
                <div className="text-xs text-[#64748B]">
                  Sector: <strong className="text-[#0F172A]">{selectedLocation.sectorName}</strong>
                </div>
                <div className="text-xs text-[#64748B]">
                  Capacidad: <strong className="text-[#0F172A]">{selectedLocation.capacity} personas</strong>
                </div>

                {selectedLocation.currentGuestName && (
                  <div className="mt-2 p-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]">
                    Huésped asignado: <strong className="font-black text-[#B45309] block">{selectedLocation.currentGuestName}</strong>
                  </div>
                )}
              </div>

              {/* Status Pill & Gentle Beacon Indicator */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#64748B] block">
                  Estado actual (cambio en 1 toque):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onQuickChangeStatus?.(selectedLocation.id, 'disponible')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                      selectedLocation.status === 'disponible'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                        : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-pulse-available" />
                    <span>Disponible</span>
                  </button>

                  <button
                    onClick={() => onQuickChangeStatus?.(selectedLocation.id, 'ocupada')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                      selectedLocation.status === 'ocupada'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-black'
                        : 'bg-white hover:bg-rose-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400 beacon-pulse-occupied" />
                    <span>Ocupada</span>
                  </button>

                  <button
                    onClick={() => onQuickChangeStatus?.(selectedLocation.id, 'reservada')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                      selectedLocation.status === 'reservada'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm font-black'
                        : 'bg-white hover:bg-sky-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400 beacon-pulse-reserved" />
                    <span>Reservada</span>
                  </button>

                  <button
                    onClick={() => onQuickChangeStatus?.(selectedLocation.id, 'limpieza')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                      selectedLocation.status === 'limpieza'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
                        : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-300 beacon-pulse-cleaning" />
                    <span>Limpieza</span>
                  </button>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => onOpenPOS(selectedLocation)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Abrir Venta POS ({selectedLocation.code})</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenQR(selectedLocation)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F0F4F8] hover:bg-[#E0F2FE] hover:text-[#0369A1] text-[#0F172A] font-bold text-xs transition flex items-center justify-center gap-2 border border-[#E2E8F0] cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Ver Código QR Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenStatusModal(selectedLocation)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <span>Editar Huésped / Notas</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2 text-slate-400">
              <Compass className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">
                Seleccioná una carpa, sombrilla o mesa en el diagrama
              </p>
              <p className="text-[11px] text-slate-400">
                Hacé clic en cualquier elemento para consultar o cambiar su estado en tiempo real.
              </p>
            </div>
          )}

          {/* Mini Sector Quick Summary */}
          <div className="p-3 rounded-2xl bg-[#0F2942] text-white text-xs space-y-1.5 font-mono">
            <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
              Resumen Ocupación Total:
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Capacidad Total:</span>
              <strong className="text-white">{locations.length} ubicaciones</strong>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Ocupadas / Reservadas:</span>
              <strong className="text-rose-400">{counts.ocupada + counts.reservada}</strong>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Disponibles en Arena:</span>
              <strong className="text-emerald-400">{counts.disponible}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
