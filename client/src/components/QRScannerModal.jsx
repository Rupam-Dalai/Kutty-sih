import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Search, AlertCircle, RefreshCw } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCameraError('');
      setManualInput('');
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [isOpen]);

  const startScanner = async () => {
    try {
      if (!document.getElementById('qr-reader-viewport')) return;

      const html5QrCode = new Html5Qrcode('qr-reader-viewport');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleDecodedData(decodedText);
        },
        () => {
          // Frame error callback - ignore standard scan misses
        }
      );

      setIsScanning(true);
      setCameraError('');
    } catch (err) {
      console.warn('Camera start error:', err);
      setIsScanning(false);
      setCameraError(
        'Unable to access live camera stream. You can enter the Team ID / Token manually below.'
      );
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Camera stop error:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const handleDecodedData = (rawText) => {
    stopScanner();
    let identifier = rawText.trim();
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.token) identifier = parsed.token;
      else if (parsed.teamId) identifier = parsed.teamId;
    } catch {
      // Raw string (e.g. token or team ID)
    }

    onScanSuccess(identifier);
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    stopScanner();
    onScanSuccess(manualInput.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md w-full p-5 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scan Team QR Code</h3>
              <p className="text-[11px] text-slate-500">Point camera at the team's printed QR badge</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Camera Viewport */}
        <div className="relative mb-4 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 min-h-[260px] flex items-center justify-center">
          <div id="qr-reader-viewport" className="w-full h-full" />

          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-slate-200 font-medium mb-1">Camera Not Available</p>
              <p className="text-[11px] text-slate-400 max-w-xs">{cameraError}</p>
              <button
                onClick={startScanner}
                className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center space-x-1 border border-slate-700"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Fallback Input */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Or Enter Team ID / Token Manually</span>
            <span className="text-[10px] text-slate-400 font-normal">e.g., TEAM-01</span>
          </p>
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g., TEAM-01 or SIH-TEAM-01-..."
              className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none uppercase font-mono"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-3 py-1.5 bg-blue-700 text-white hover:bg-blue-800 rounded text-xs font-semibold flex items-center space-x-1 disabled:opacity-40"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
