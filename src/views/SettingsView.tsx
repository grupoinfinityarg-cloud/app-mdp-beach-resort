import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { CommercialPlan } from '../types';
import { PWAInstallButton } from '../components/PWAInstallButton';
import {
  Settings,
  Gem,
  Check,
  RotateCcw,
  Database,
  Smartphone,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { config, updateConfig, switchPlan, resetAllDemoData } = useBalneario();

  const [name, setName] = useState(config.name);
  const [branchName, setBranchName] = useState(config.branchName);
  const [address, setAddress] = useState(config.address);
  const [phone, setPhone] = useState(config.phone);
  const [schedule, setSchedule] = useState(config.schedule);
  const [serviceFeeCover, setServiceFeeCover] = useState(config.serviceFeeCover);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name,
      branchName,
      address,
      phone,
      schedule,
      serviceFeeCover,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    resetAllDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const plans: {
    id: CommercialPlan;
    name: string;
    tag: string;
    description: string;
    badgeColor: string;
  }[] = [
    {
      id: 'DEMO',
      name: 'Plan Demostración Completa',
      tag: 'ACTIVO ACTUALMENTE',
      description: 'Acceso total e irrestricto a todos los módulos: Carpas, Sombrillas, KDS de Cocina, POS, Carta Digital QR y Caja.',
      badgeColor: 'bg-[#34313A] text-white',
    },
    {
      id: 'ORO',
      name: 'Plan Oro (Paradores Ágiles)',
      tag: 'COMERCIAL',
      description: 'Gestión básica de sombra y carta digital QR para paradores medianos.',
      badgeColor: 'bg-[#FBEEB9] text-[#34313A] border border-[#e8d799]',
    },
    {
      id: 'PLATINO',
      name: 'Plan Platino (Complejo Turístico)',
      tag: 'COMERCIAL',
      description: 'Incluye KDS multipantalla, control de comandas, mozos y reservas avanzadas.',
      badgeColor: 'bg-[#C1E7FF] text-[#34313A] border border-[#a9dbfa]',
    },
    {
      id: 'DIAMANTE',
      name: 'Plan Diamante (Full Balneario & Salón)',
      tag: 'EMPRESARIAL',
      description: 'Gestión ilimitada de sectores, carpas VIP, múltiples barras, POS concurrentes y reportes ejecutivos.',
      badgeColor: 'bg-[#F68F57]/20 text-[#34313A] border border-[#F68F57]/30',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto text-[#34313A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#34313A] tracking-tight">
            Configuración & Planes Comerciales
          </h1>
          <p className="text-xs text-[#34313A]/70 mt-0.5">
            Personalización del establecimiento, instalación PWA y arquitectura de planes.
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#FBEEB9] text-[#34313A] flex items-center justify-center font-bold">
          <Settings className="w-5 h-5 text-[#34313A]" />
        </div>
      </div>

      {/* 4 Commercial Plans Matrix */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-[#34313A]" />
            <h2 className="text-base font-black text-[#34313A]">Modalidades Comerciales</h2>
          </div>
          <p className="text-xs text-[#34313A]/70 mt-0.5">
            Durante la etapa DEMO todas las funciones permanecen 100% activas sin bloqueos artificiales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((p) => {
            const isSelected = config.activePlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => switchPlan(p.id)}
                className={`p-5 rounded-3xl border cursor-pointer transition shadow-sm flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#C1E7FF] bg-[#C1E7FF]/20 ring-2 ring-[#C1E7FF]'
                    : 'border-[#E2E2E2] bg-white hover:bg-[#FBEEB9]/15'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${p.badgeColor}`}>
                      {p.tag}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#34313A] text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm text-[#34313A] mt-3">{p.name}</h3>
                  <p className="text-xs text-[#34313A]/80 mt-1 leading-relaxed">{p.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E2E2] flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#34313A]">
                    {isSelected ? '✓ Plan Activo' : 'Seleccionar Modalidad'}
                  </span>
                  <span className="text-[#34313A]/60">Sin límite de prueba fijado</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Settings Form */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E2E2] shadow-sm space-y-5">
        <h2 className="text-base font-black text-[#34313A]">Datos del Establecimiento</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">Nombre del Sistema:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs font-bold text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">Nombre del Balneario / Parador:</label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs font-bold text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">Dirección en Mar del Plata:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">Teléfono / WhatsApp de Atención:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">Horarios de Temporada:</label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">
                Servicio de Mesa / Cubierto por Pax ($):
              </label>
              <input
                type="number"
                value={serviceFeeCover}
                onChange={(e) => setServiceFeeCover(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-[#C1E7FF]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E2E2E2]">
            {savedSuccess ? (
              <span className="text-xs font-bold text-[#34313A] flex items-center gap-1">
                <Check className="w-4 h-4 text-[#34313A]" /> Configuración guardada correctamente
              </span>
            ) : (
              <span className="text-[11px] text-[#34313A]/60">
                Los datos se guardan localmente en el navegador.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#C1E7FF] hover:bg-[#aee0ff] text-[#34313A] border border-[#a9dbfa] font-black text-xs shadow-sm transition"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>

      {/* PWA & Local Storage Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PWA Info */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#34313A]" />
            <h3 className="font-black text-sm text-[#34313A]">Instalación PWA</h3>
          </div>
          <p className="text-xs text-[#34313A]/80 leading-relaxed">
            Esta aplicación está configurada con Web App Manifest y Service Worker para funcionar offline y en pantalla completa en celulares y tablets.
          </p>
          <div className="pt-2">
            <PWAInstallButton variant="sidebar" />
          </div>
        </div>

        {/* Reset Demo Data */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#34313A]" />
            <h3 className="font-black text-sm text-[#34313A]">Restablecer Datos Demo</h3>
          </div>
          <p className="text-xs text-[#34313A]/80 leading-relaxed">
            Si realizaste pruebas y deseás volver al estado inicial de MDP BEACH & RESORT, podés reiniciar los registros.
          </p>
          {resetSuccess ? (
            <div className="p-2.5 rounded-xl bg-[#FBEEB9] border border-[#e8d799] text-xs font-bold text-[#34313A] text-center">
              ✓ Datos restablecidos con éxito
            </div>
          ) : (
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#E2E2E2] text-[#34313A] bg-[#FBEEB9]/40 font-bold text-xs hover:bg-[#FBEEB9] transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#34313A]" />
              <span>Restablecer Datos de Demostración</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
