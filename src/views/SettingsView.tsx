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
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { config, updateConfig, switchPlan, resetAllDemoData, businessDisplayName } = useBalneario();

  const [name, setName] = useState(config.name);
  const [branchName, setBranchName] = useState(config.branchName);
  const [slogan, setSlogan] = useState(config.slogan || '');
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [address, setAddress] = useState(config.address);
  const [phone, setPhone] = useState(config.phone);
  const [schedule, setSchedule] = useState(config.schedule);
  const [serviceFeeCover, setServiceFeeCover] = useState(config.serviceFeeCover);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Al tipear el nombre o slogan, actualizamos inmediatamente el sistema completo
  const handleBranchNameChange = (val: string) => {
    setBranchName(val);
    updateConfig({ branchName: val });
  };

  const handleSloganChange = (val: string) => {
    setSlogan(val);
    updateConfig({ slogan: val });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoUrl(dataUrl);
      updateConfig({ logoUrl: dataUrl });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    updateConfig({ logoUrl: undefined });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name,
      branchName,
      slogan,
      logoUrl: logoUrl || undefined,
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
    priceMonth: string;
    priceSeason: string;
    priceAnnual: string;
    features: string[];
    description: string;
    badgeColor: string;
  }[] = [
    {
      id: 'DEMO',
      name: 'Plan Demostración Completa',
      tag: 'ACTIVO ACTUALMENTE',
      priceMonth: 'Gratis en Demo',
      priceSeason: 'Sin costo',
      priceAnnual: 'Para pruebas',
      features: [
        'Acceso total a todos los módulos',
        'Carta Digital QR interactiva',
        'KDS Cocina y Barra',
        'Punto de Venta POS y Caja',
      ],
      description: 'Acceso total e irrestricto a todos los módulos para pruebas comerciales.',
      badgeColor: 'bg-[#34313A] text-white',
    },
    {
      id: 'ORO',
      name: 'Plan ORO (Básico / Paradores)',
      tag: 'PARADORES ÁGILES',
      priceMonth: '$ 140.000 / mes',
      priceSeason: '$ 450.000 temporada (4 meses)',
      priceAnnual: '$ 990.000 pago anual',
      features: [
        'Carta Digital interactiva QR por carpa/sombrilla',
        'Pedidos ilimitados del cliente al WhatsApp/mostrador',
        'Catálogo gastronómico con fotos y adicionales',
        'Modo Offline PWA para arena sin señal',
        'Soporte técnico estándar',
      ],
      description: 'Ideal para paradores y balnearios que buscan digitalizar su carta y pedidos sin complejidad.',
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
    },
    {
      id: 'PLATINO',
      name: 'Plan PLATINO (Intermedio / Recomendado)',
      tag: 'MÁS ELEGIDO',
      priceMonth: '$ 260.000 / mes',
      priceSeason: '$ 850.000 temporada (4 meses)',
      priceAnnual: '$ 1.850.000 pago anual',
      features: [
        'Todo lo incluido en el Plan ORO',
        'Punto de Venta táctil (POS Cajero) para personal',
        'Pantalla KDS de Cocina y Bar en tiempo real',
        'Botón "Llamar al Mozo" con alerta sonora',
        'Botones de WhatsApp interactivos con 1 toque',
        'Arqueo de caja y control de turno',
      ],
      description: 'El circuito completo para balnearios medianos y grandes que buscan máxima velocidad en cocina y playa.',
      badgeColor: 'bg-sky-100 text-sky-900 border border-sky-300',
    },
    {
      id: 'DIAMANTE',
      name: 'Plan DIAMANTE (Full Empresarial)',
      tag: 'FULL COMPLEJO',
      priceMonth: '$ 420.000 / mes',
      priceSeason: '$ 1.390.000 temporada (4 meses)',
      priceAnnual: '$ 2.990.000 pago anual',
      features: [
        'Todo lo del Plan PLATINO sin ningún límite',
        'Mapa interactivo de playa (Carpas VIP, Sombrillas, Mesas)',
        'Múltiples pantallas KDS simultáneas (Cocina, Bar, Cafetería)',
        'Módulo de Reservas de Sombra (por día, mes, temporada)',
        'Múltiples cajas concurrentes y arqueos ciegos',
        'Subdominio exclusivo propio (ej: balneario.grupoinfinity.site)',
        'Soporte prioritario VIP 24/7 toda la temporada',
      ],
      description: 'Diseñado para balnearios de primera línea con múltiples sectores, alto volumen y gestión integral.',
      badgeColor: 'bg-rose-100 text-rose-900 border border-rose-300',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto text-[#34313A]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E2E2E2] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#34313A] tracking-tight">
              Configuración de Marca & Planes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              WHITE-LABEL ACTIVO
            </span>
          </div>
          <p className="text-xs text-[#34313A]/70 mt-0.5">
            Personalizá el nombre del cliente, subí su logo y visualizá los planes comerciales de la temporada.
          </p>
        </div>
        <a
          href="https://wa.me/5492236779934?text=Hola!%20Me%20interesa%20contratar%20el%20sistema%20de%20Gesti%C3%B3n%20Balnearia%20para%20la%20temporada."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition shrink-0"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Hablar con Ventas</span>
        </a>
      </div>

      {/* Identidad del Balneario & White-Label en Vivo (Paso 1) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E2E2] shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-[#34313A]">Identidad del Balneario / Cliente</h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
            ⚡ Cambia en vivo en 1 segundo
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#C1E7FF]/20 border border-[#a9dbfa] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Balneario"
                className="w-16 h-16 rounded-2xl object-cover border border-white shadow-md shrink-0 bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#34313A] flex items-center justify-center text-white font-black text-xl shrink-0 shadow-sm">
                🏖️
              </div>
            )}
            <div>
              <div className="text-base font-black text-[#34313A]">
                {branchName || 'Tu Balneario'}
              </div>
              <div className="text-xs text-[#F68F57] font-semibold mt-0.5">
                {slogan || 'Tu balneario, mejor gestionado'}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Logo activo visible en la Carta QR, Barra superior y Comandas.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-[#34313A] font-bold text-xs shadow-xs transition flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>{logoUrl ? 'Cambiar Logo' : 'Subir Logo / Imagen'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                title="Quitar logo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Inputs de Identidad Rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#34313A]">
              Nombre del Balneario / Parador (Cliente):
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => handleBranchNameChange(e.target.value)}
              placeholder="Ej: Balneario San Sebastián, Honu Beach, etc."
              className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs font-black text-[#34313A] focus:outline-none focus:border-emerald-400 bg-emerald-50/20"
            />
            <span className="text-[10px] text-gray-500 block">
              Actualiza en vivo la Carta QR, los mensajes de WhatsApp, el POS y KDS.
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#34313A]">
              Slogan o Subtítulo del Parador:
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => handleSloganChange(e.target.value)}
              placeholder="Ej: Tu parador frente al mar en Playa Grande"
              className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs font-bold text-[#34313A] focus:outline-none focus:border-emerald-400"
            />
            <span className="text-[10px] text-gray-500 block">
              Aparece en la cabecera de la carta digital de los clientes.
            </span>
          </div>
        </div>
      </div>

      {/* 4 Commercial Plans Matrix (Paso 3) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Gem className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-[#34313A]">Planes Comerciales de Temporada</h2>
            </div>
            <p className="text-xs text-[#34313A]/70 mt-0.5">
              Valores sugeridos para contratación mensual, temporada (4 meses) y anual.
            </p>
          </div>
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
                    ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/30'
                    : 'border-[#E2E2E2] bg-white hover:bg-gray-50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${p.badgeColor}`}>
                      {p.tag}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-[#34313A]">{p.name}</h3>
                    <p className="text-xs text-[#34313A]/80 mt-1 leading-relaxed">{p.description}</p>
                  </div>

                  {/* Precios */}
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-gray-600">Por Mes:</span>
                      <span className="text-[#34313A] font-black">{p.priceMonth}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-gray-600">Temporada (4m):</span>
                      <span className="text-emerald-700 font-black">{p.priceSeason}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-500 font-semibold">
                      <span>Pago Anual:</span>
                      <span>{p.priceAnnual}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1 text-xs text-gray-700 pt-1">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E2E2] flex items-center justify-between text-[11px] font-bold">
                  <span className={isSelected ? 'text-emerald-700 font-black' : 'text-gray-500'}>
                    {isSelected ? '✓ Plan Activo en Demo' : 'Seleccionar Modalidad'}
                  </span>
                  <a
                    href={`https://wa.me/5492236779934?text=Hola!%20Quiero%20consultar%20por%20el%20${encodeURIComponent(p.name)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Consultar por este plan →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Settings Form */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E2E2] shadow-sm space-y-5">
        <h2 className="text-base font-black text-[#34313A]">Otros Datos Operativos</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">Dirección en Mar del Plata:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">Teléfono / WhatsApp del Balneario:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#34313A]">Horarios de Temporada:</label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-emerald-400"
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
                className="w-full p-2.5 rounded-xl border border-[#E2E2E2] text-xs text-[#34313A] focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E2E2E2]">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" /> Configuración guardada correctamente
              </span>
            ) : (
              <span className="text-[11px] text-[#34313A]/60">
                Los datos se guardan localmente en el navegador.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition"
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
