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

  useEffect(() => {
    if (!location) return;

    // Build the URL that a customer scans
    const origin = window.location.origin;
    const url = `${origin}/?mesa=${encodeURIComponent(location.code)}`;

    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#064e3b', // Brand deep emerald
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error('Error generating QR', err));
  }, [location]);

  if (!location) return null;

  const targetUrl = `${window.location.origin}/?mesa=${encodeURIComponent(location.code)}`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 text-gray-900 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Código QR Oficial</h3>
              <p className="text-xs text-gray-500">{location.sectorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Card Preview */}
        <div className="my-5 flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white border-2 border-emerald-500/20 shadow-inner flex flex-col items-center text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{location.name} • {location.code}</span>
            </div>
            <div className="text-[10px] text-gray-500 mb-2">Escaneá para ver la carta y pedir</div>

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR ${location.code}`}
                className="w-52 h-52 rounded-xl shadow-xs border border-gray-100 bg-white p-2"
              />
            ) : (
              <div className="w-52 h-52 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                Generando QR...
              </div>
            )}

            <div className="mt-2 text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full font-semibold">
              ID ORIGEN: {location.code}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSimulateScan}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Simular Escaneo (Abrir Carta como {location.code})</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Descargar PNG</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
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
