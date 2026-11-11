import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { LocationItem } from '../types';
import { useBalneario } from '../context/BalnearioContext';
import { X, Download, Copy, ExternalLink, Check, QrCode as QrIcon, MapPin } from 'lucide-react';

interface QRCodeModalProps {
  location: LocationItem | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ location, onClose }) => {
  const { setActiveView, setSelectedLocationCode } = useBalneario();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const businessSlug = import.meta.env.VITE_SUPABASE_BUSINESS_SLUG?.trim();

  const getTargetUrl = (locationCode: string) => {
    const url = new URL('/', window.location.origin);
    if (businessSlug) url.searchParams.set('balneario', businessSlug);
    url.searchParams.set('mesa', locationCode);
    return url.toString();
  };

  useEffect(() => {
    if (!location) return;

    const url = getTargetUrl(location.code);

    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0F2942',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error('Error generating QR', err));
  }, [location, businessSlug]);

  if (!location) return null;

  const targetUrl = getTargetUrl(location.code);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-GestionBalnearia-${location.code}.png`;
    link.click();
  };

  const handleSimulateScan = () => {
    setSelectedLocationCode(location.code);
    setActiveView('carta');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#E2E8F0] text-[#0F172A] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <QrIcon className="w-5 h-5 text-[#0284C7]" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#0F172A] leading-tight">Código QR Oficial</h3>
              <p className="text-xs text-gray-500">{location.sectorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-[#0F172A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Card Preview */}
        <div className="my-5 flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-[#FFFBEB] border-2 border-[#FDE68A] shadow-inner flex flex-col items-center text-center">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#92400E] mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
              <span>{location.name} • {location.code}</span>
            </div>
            <div className="text-[10px] text-gray-500 mb-2 font-medium">Escaneá para ver la carta y pedir</div>

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR ${location.code}`}
                className="w-52 h-52 rounded-xl shadow-xs border border-[#E2E8F0] bg-white p-2"
              />
            ) : (
              <div className="w-52 h-52 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                Generando QR...
              </div>
            )}

            <div className="mt-2 text-[10px] font-mono text-[#0369A1] bg-[#E0F2FE] border border-sky-200 px-3 py-1 rounded-full font-black">
              ORIGEN VINCULADO: {location.code}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSimulateScan}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0284C7] text-white font-black text-xs hover:bg-[#0369A1] border border-[#0284C7] shadow-xs transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Simular Escaneo (Abrir Carta como {location.code})</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#E2E8F0] text-[#0F172A] font-bold text-xs hover:bg-[#F0F4F8] transition"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Descargar PNG</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#E2E8F0] text-[#0F172A] font-bold text-xs hover:bg-[#F0F4F8] transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span className="text-[#0284C7]">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
