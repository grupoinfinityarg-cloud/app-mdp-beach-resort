import React, { useState } from 'react';
import { useBalneario } from '../context/BalnearioContext';
import { CommercialPlan } from '../types';
import { PWAInstallButton } from '../components/PWAInstallButton';
import {
  Settings,
  Gem,
  Building,
  Phone,
  Clock,
  RotateCcw,
  Check,
  ShieldCheck,
  Download,
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

  const plans: {
    id: CommercialPlan;
    name: string;
    tag: string;
    description: string;
    color: string;
    badgeColor: string;
  }[] = [
    {
      id: 'DEMO',
      name: 'Plan Demostración Completa',
      tag: 'ACTIVO ACTUALMENTE',
      description: 'Acceso total e irrestricto a todos los módulos: Carpas, Sombrillas, KDS de Cocina, POS, Carta Digital QR y Caja.',
      color: 'border-[#55C7E8] bg-[#55C7E8]/10',
      badgeColor: 'bg-[#202428] text-white',
    },
    {
      id: 'ORO',
      name: 'Plan Oro (Paradores Ágiles)',
      tag: 'COMERCIAL',
      description: 'Gestión básica de sombra y carta digital QR para paradores medianos.',
      color: 'border-gray-200 bg-white hover:border-[#FFD43B]',
      badgeColor: 'bg-[#FFD43B]/20 text-[#202428]',
    },
    {
      id: 'PLATINO',
      name: 'Plan Platino (Complejo Turístico)',
      tag: 'COMERCIAL',
      description: 'Incluye KDS multipantalla, control de comandas, mozos y reservas avanzadas.',
      color: 'border-gray-200 bg-white hover:border-[#55C7E8]',
      badgeColor: 'bg-[#55C7E8]/20 text-[#202428]',
    },
    {
      id: 'DIAMANTE',
      name: 'Plan Diamante (Full Balneario & Salón)',
      tag: 'EMPRESARIAL',
      description: 'Gestión ilimitada de sectores, carpas VIP, múltiples barras, POS concurrentes y reportes ejecutivos.',
      color: 'border-gray-200 bg-white hover:border-[#F47B35]',
      badgeColor: 'bg-[#F47B35]/20 text-[#F47B35]',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto text-[#202428]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#202428] tracking-tight">
            Configuración & Planes Comerciales
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Personalización del establecimiento, instalación PWA y arquitectura de planes.
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#FFD43B]/20 text-[#202428] flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
      </div>

      {/* 4 Commercial Plans Matrix */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-[#202428]" />
            <h2 className="text-base font-black text-[#202428]">Modalidades Comerciales</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
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
                className={`p-5 rounded-3xl border-2 cursor-pointer transition shadow-xs flex flex-col justify-between ${
                  isSelected ? 'border-[#55C7E8] bg-[#55C7E8]/10 ring-2 ring-[#55C7E8]/30' : p.color
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${p.badgeColor}`}>
                      {p.tag}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#202428] text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm text-[#202428] mt-3">{p.name}</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{p.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#202428]">
                    {isSelected ? '✓ Plan Activo' : 'Seleccionar Modalidad'}
                  </span>
                  <span className="text-gray-400">Sin límite de prueba fijado</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Settings Form */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
        <h2 className="text-base font-black text-[#202428]">Datos del Establecimiento</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nombre del Sistema:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#202428]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nombre del Balneario / Parador:</label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#202428]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Dirección en Mar del Plata:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-[#202428]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Teléfono / WhatsApp de Atención:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-[#202428]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Horarios de Temporada:</label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-[#202428]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Servicio de Mesa / Cubierto por Pax ($):
              </label>
              <input
                type="number"
                value={serviceFeeCover}
                onChange={(e) => setServiceFeeCover(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-[#202428]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {savedSuccess ? (
              <span className="text-xs font-bold text-[#202428] flex items-center gap-1">
                <Check className="w-4 h-4 text-[#55C7E8]" /> Configuración guardada correctamente
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">
                Los datos se guardan localmente en el navegador.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#F47B35] hover:bg-[#e06824] text-white font-black text-xs shadow-md transition"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>

      {/* PWA & Local Storage Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PWA Info */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#55C7E8]" />
            <h3 className="font-black text-sm text-[#202428]">Instalación PWA</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Esta aplicación está configurada con Web App Manifest y Service Worker para funcionar offline y en pantalla completa en celulares y tablets.
          </p>
          <div className="pt-2">
            <PWAInstallButton variant="sidebar" />
          </div>
        </div>

        {/* Reset Demo Data */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#FFD43B]" />
            <h3 className="font-black text-sm text-[#202428]">Restablecer Datos Demo</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Si realizaste pruebas y deseás volver al estado inicial del balneario Costa Serena de Mar del Plata, podés reiniciar los registros.
          </p>
          <button
            onClick={() => {
              if (window.confirm('¿Confirmás el reinicio de los datos demo?')) {
                resetAllDemoData();
                alert('Datos restablecidos.');
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#FFD43B] text-[#202428] bg-[#FFD43B]/20 font-bold text-xs hover:bg-[#FFD43B]/30 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos de Demostración</span>
          </button>
        </div>
      </div>
    </div>
  );
};
