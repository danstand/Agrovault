import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useAgroStore } from '../context/AgroStoreContext';
import { AgrochemicalProduct } from '../types/agrochemical';
import { parseScannedQrCode } from '../utils/qrCodeGenerator';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { 
  X, 
  Camera, 
  QrCode, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Box, 
  Sliders, 
  Calendar, 
  ShieldAlert, 
  Building2,
  ScanLine,
  ArrowRight,
  Sparkles,
  Barcode
} from 'lucide-react';

interface QrInventoryScannerModalProps {
  onClose: () => void;
  initialProduct?: AgrochemicalProduct | null;
}

export const QrInventoryScannerModal: React.FC<QrInventoryScannerModalProps> = ({
  onClose,
  initialProduct = null
}) => {
  const { products, adjustStock } = useAgroStore();

  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [scannedProduct, setScannedProduct] = useState<AgrochemicalProduct | null>(initialProduct);
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Adjustment Controls
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(10);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT' | 'SET_EXACT'>('ADD');
  const [exactStocktakeCount, setExactStocktakeCount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('SUPPLIER_RESTOCK');
  const [auditNotes, setAuditNotes] = useState<string>('');
  const [recentUpdatedProduct, setRecentUpdatedProduct] = useState<{ name: string; newStock: number } | null>(null);

  // Video and Canvas refs for live scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Beep sound on scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext not allowed or not supported, ignore
    }
  };

  // Start Camera Stream
  useEffect(() => {
    if (activeTab !== 'camera' || scannedProduct) {
      stopCamera();
      return;
    }

    let isSubscribed = true;

    async function startCamera() {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera device access is not supported by your browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        if (!isSubscribed) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          requestScanFrame();
        }
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setCameraError(err.message || 'Unable to access video camera. Please use manual SKU search below.');
      }
    }

    startCamera();

    return () => {
      isSubscribed = false;
      stopCamera();
    };
  }, [activeTab, scannedProduct]);

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Scanning loop using jsQR
  const requestScanFrame = () => {
    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || scannedProduct) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        return; // stop scanning loop on hit
      }
    }

    requestScanFrame();
  };

  const handleCodeDetected = (rawText: string) => {
    playBeep();
    const parsed = parseScannedQrCode(rawText);
    if (!parsed) return;

    const matched = products.find(
      p => p.id.toLowerCase() === parsed.productId.toLowerCase() ||
           p.name.toLowerCase().includes(parsed.productId.toLowerCase()) ||
           p.tradeName.toLowerCase().includes(parsed.productId.toLowerCase())
    );

    if (matched) {
      setScannedProduct(matched);
      setExactStocktakeCount(String(matched.stock));
      setRecentUpdatedProduct(null);
    } else {
      setCameraError(`Scanned code "${parsed.productId}" does not match any SKU in current warehouse inventory.`);
      setTimeout(() => setCameraError(null), 3500);
      requestScanFrame();
    }
  };

  // Handle Manual Input Search or Barcode Reader Submit
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    handleCodeDetected(manualInput.trim());
    setManualInput('');
  };

  // Commit stock adjustment
  const handleCommitStockUpdate = () => {
    if (!scannedProduct) return;

    let delta = 0;
    if (adjustmentType === 'ADD') {
      delta = Math.abs(adjustmentAmount);
    } else if (adjustmentType === 'SUBTRACT') {
      delta = -Math.abs(adjustmentAmount);
    } else if (adjustmentType === 'SET_EXACT') {
      const target = parseInt(exactStocktakeCount);
      if (isNaN(target)) return;
      delta = target - scannedProduct.stock;
    }

    if (delta === 0) return;

    adjustStock(
      scannedProduct.id, 
      delta, 
      `${adjustReason}: ${auditNotes || 'Quick QR Scanner Update'}`
    );

    const updatedStock = Math.max(0, scannedProduct.stock + delta);
    setRecentUpdatedProduct({
      name: scannedProduct.tradeName,
      newStock: updatedStock
    });

    // Update local state copy
    setScannedProduct(prev => prev ? { ...prev, stock: updatedStock } : null);
    setExactStocktakeCount(String(updatedStock));
    setAuditNotes('');
  };

  const resetToScanNext = () => {
    setScannedProduct(null);
    setExactStocktakeCount('');
    setAdjustmentAmount(10);
    setAdjustmentType('ADD');
    setRecentUpdatedProduct(null);
    setCameraError(null);
    setActiveTab('camera');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <ScanLine className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Quick QR Barcode Scanner & Stock Updater
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Scan product QR labels using camera or wedge scanner for rapid warehouse inventory adjustments
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            IF A PRODUCT HAS BEEN SCANNED: SHOW QUICK ADJUSTMENT INTERFACE
            ───────────────────────────────────────────────────────────── */}
        {scannedProduct ? (
          <div className="space-y-4">
            
            {/* Scanned Hit Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      IDENTIFIED SKU
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">{scannedProduct.id}</span>
                    <span className="text-[11px] text-slate-400 font-mono">Reg: {scannedProduct.regNumber}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-950">{scannedProduct.name}</h4>
                  <p className="text-xs text-slate-600 font-medium">{scannedProduct.tradeName} · {scannedProduct.activeIngredient}</p>
                </div>

                <div className="text-right font-mono-tabular shrink-0">
                  <span className="text-[10px] text-slate-400 block">Retail Price</span>
                  <span className="text-sm font-bold text-slate-900">{formatGHS(scannedProduct.price)}</span>
                </div>
              </div>

              {/* Status and Diagnostics */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono-tabular">
                <div>
                  <span className="text-[10px] text-slate-400 block">Current In-Stock</span>
                  <strong className="text-base font-bold text-emerald-800">
                    {scannedProduct.stock} {scannedProduct.unit}s
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Restock Threshold</span>
                  <strong className="text-base font-bold text-slate-700">
                    {scannedProduct.restockLevel ?? scannedProduct.minStockLevel} {scannedProduct.unit}s
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Batch / Expiry</span>
                  <div className="truncate text-slate-800 font-semibold">{scannedProduct.batchNumber}</div>
                  <span className="text-[10px] text-rose-700 font-bold block">{scannedProduct.expiryDate}</span>
                </div>
              </div>
            </div>

            {/* Success Feedback banner if updated */}
            {recentUpdatedProduct && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>
                    Successfully committed! New balance for <strong>{recentUpdatedProduct.name}</strong> is <strong>{recentUpdatedProduct.newStock} units</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetToScanNext}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-md cursor-pointer"
                >
                  Scan Next SKU →
                </button>
              </div>
            )}

            {/* Quick Adjustment Controls */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Quick Stock Count Adjustment</span>
                </h5>

                {/* Mode Selector */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('ADD')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      adjustmentType === 'ADD' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    + Restock / Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('SUBTRACT')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      adjustmentType === 'SUBTRACT' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    - Deduct / Outflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('SET_EXACT')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      adjustmentType === 'SET_EXACT' ? 'bg-blue-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Set Exact Count
                  </button>
                </div>
              </div>

              {/* Incremental Adjusters */}
              {adjustmentType !== 'SET_EXACT' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-medium">Quantity to {adjustmentType === 'ADD' ? 'Add' : 'Deduct'}:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAdjustmentAmount(Math.max(1, adjustmentAmount - 1))}
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 h-8 text-center border border-slate-300 rounded-lg font-mono-tabular font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setAdjustmentAmount(adjustmentAmount + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-mono text-slate-500">{scannedProduct.unit}s</span>

                    {/* Quick increment presets */}
                    <div className="flex items-center gap-1 ml-auto">
                      {[1, 5, 10, 25, 50].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAdjustmentAmount(val)}
                          className={`px-2 py-1 rounded border text-[11px] font-mono-tabular font-semibold cursor-pointer ${
                            adjustmentAmount === val ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Projected Balance */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono-tabular">
                    <span className="text-slate-600">Calculated New Inventory Level:</span>
                    <strong className="text-sm text-slate-950 font-bold">
                      {Math.max(0, scannedProduct.stock + (adjustmentType === 'ADD' ? adjustmentAmount : -adjustmentAmount))} {scannedProduct.unit}s
                    </strong>
                  </div>
                </div>
              ) : (
                /* Set Exact Count */
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Physical Shelf Count (Stocktake Audit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={exactStocktakeCount}
                      onChange={(e) => setExactStocktakeCount(e.target.value)}
                      placeholder="Enter verified shelf count"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-tabular font-bold text-sm text-slate-900"
                    />
                  </div>

                  {exactStocktakeCount !== '' && !isNaN(parseInt(exactStocktakeCount)) && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono-tabular">
                      <span className="text-slate-600">Discrepancy Correction:</span>
                      <strong className={parseInt(exactStocktakeCount) - scannedProduct.stock >= 0 ? 'text-emerald-800' : 'text-rose-700'}>
                        {parseInt(exactStocktakeCount) - scannedProduct.stock > 0 ? '+' : ''}
                        {parseInt(exactStocktakeCount) - scannedProduct.stock} {scannedProduct.unit}s
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Reason & Audit Notes */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Operation Reason</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="SUPPLIER_RESTOCK">Receive Supplier Restock (+ Inflow)</option>
                    <option value="AUDIT_CORRECTION">Stocktake Audit Count Correction</option>
                    <option value="DAMAGE_EXPIRY_WRITEOFF">Damaged / Leaked Container Write-off (- Outflow)</option>
                    <option value="INTERNAL_USE">Demonstration Farm Plot (- Outflow)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Audit Notes / Delivery Ref</label>
                  <input
                    type="text"
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    placeholder="e.g. Scanned at warehouse bay 3"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetToScanNext}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg font-medium cursor-pointer"
                >
                  Scan Another Product
                </button>

                <button
                  type="button"
                  onClick={handleCommitStockUpdate}
                  className="flex-1 py-2 bg-emerald-850 hover:bg-emerald-950 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Inventory Update</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              SCANNING INTERFACE: CAMERA FEED OR MANUAL ENTRY
              ───────────────────────────────────────────────────────────── */
          <div className="space-y-4">
            
            {/* View Switcher: Camera vs Manual Code */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('camera')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'camera' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera Viewfinder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'manual' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Wedge Scanner / Manual SKU</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400">Aim camera at AgroVault QR label</span>
            </div>

            {/* Camera Viewfinder */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative w-full aspect-video sm:aspect-[4/3] max-h-72 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                  {cameraError ? (
                    <div className="p-6 text-center text-xs text-rose-300 space-y-2">
                      <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                      <p className="font-semibold text-white">Camera Feed Notice</p>
                      <p className="max-w-sm mx-auto text-slate-300">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Use Barcode Search / Direct SKU
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Viewfinder Target Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                          {/* Corner reticles */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
                          
                          {/* Animated laser line */}
                          <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-center text-[11px] text-slate-500">
                  Align the QR sticker inside the green frame. Detection triggers instantaneous lookup and stock adjustment.
                </p>
              </div>
            )}

            {/* Manual SKU / Barcode Wedge Input */}
            <form onSubmit={handleManualSearch} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Barcode Wedge Scanner Input / Paste QR Data / SKU Code
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Scan with handheld laser or type SKU (e.g. PROD-001)..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    autoFocus={activeTab === 'manual'}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Lookup SKU
                </button>
              </div>
            </form>

            {/* Quick Test / Shelf Chips for convenience */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500 text-[11px]">
                Or select warehouse product to quick-adjust:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto">
                {products.map(p => {
                  const isLow = p.stock <= (p.restockLevel ?? p.minStockLevel);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        playBeep();
                        setScannedProduct(p);
                        setExactStocktakeCount(String(p.stock));
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] border font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isLow 
                          ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-slate-500">{p.id}</span>
                      <span>{p.tradeName}</span>
                      <span className="font-mono-tabular font-bold text-slate-900">({p.stock})</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
