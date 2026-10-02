import React, { useEffect, useState } from 'react';
import { AgrochemicalProduct, HazardBand } from '../types/agrochemical';
import { generateProductQrDataUrl } from '../utils/qrCodeGenerator';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { 
  X, 
  Printer, 
  Download, 
  QrCode, 
  ShieldAlert, 
  Calendar, 
  Layers, 
  Copy, 
  Check, 
  Sparkles,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Box
} from 'lucide-react';

interface ProductQrLabelModalProps {
  product: AgrochemicalProduct;
  onClose: () => void;
  onOpenQuickUpdate?: (product: AgrochemicalProduct) => void;
  onOpenBatchPrint?: () => void;
}

export const ProductQrLabelModal: React.FC<ProductQrLabelModalProps> = ({
  product,
  onClose,
  onOpenQuickUpdate,
  onOpenBatchPrint
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'pallet'>('standard');
  const [includePricing, setIncludePricing] = useState(true);
  const [includeStorageBay, setIncludeStorageBay] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    generateProductQrDataUrl(product, { width: 420 })
      .then(url => {
        if (isMounted) {
          setQrDataUrl(url);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to generate QR code', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `agrovault-qr-${product.id}-${product.tradeName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(product.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHazardBandInfo = (band: HazardBand) => {
    switch (band) {
      case 'RED':
        return {
          bg: 'bg-red-600',
          text: 'text-red-700',
          border: 'border-red-200',
          lightBg: 'bg-red-50',
          label: 'WHO Class Ib · Highly Hazardous (Restricted Prescription)'
        };
      case 'YELLOW':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-800',
          border: 'border-amber-200',
          lightBg: 'bg-amber-50',
          label: 'WHO Class II · Moderately Hazardous / Harmful'
        };
      case 'BLUE':
        return {
          bg: 'bg-blue-600',
          text: 'text-blue-800',
          border: 'border-blue-200',
          lightBg: 'bg-blue-50',
          label: 'WHO Class III · Slightly Hazardous / Caution'
        };
      case 'GREEN':
      default:
        return {
          bg: 'bg-emerald-600',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
          lightBg: 'bg-emerald-50',
          label: 'Class IV · General Agronomic Use'
        };
    }
  };

  const hazard = getHazardBandInfo(product.hazardBand);
  const restockPoint = product.restockLevel !== undefined ? product.restockLevel : product.minStockLevel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 no-print">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <QrCode className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Chemical Inventory QR Label & Barcode
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Scannable warehouse sticker with EPA registration, batch traceability, and hazard compliance
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar (no-print) */}
        <div className="no-print bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Label Format:</span>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setLabelSize('standard')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  labelSize === 'standard' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Standard Shelf (80×55mm)
              </button>
              <button
                type="button"
                onClick={() => setLabelSize('compact')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  labelSize === 'compact' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Compact Bottle (55×35mm)
              </button>
              <button
                type="button"
                onClick={() => setLabelSize('pallet')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  labelSize === 'pallet' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pallet Placard (A5)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePricing}
                onChange={(e) => setIncludePricing(e.target.checked)}
                className="rounded text-emerald-800 focus:ring-0"
              />
              <span>Include Retail GH₵</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeStorageBay}
                onChange={(e) => setIncludeStorageBay(e.target.checked)}
                className="rounded text-emerald-800 focus:ring-0"
              />
              <span>Storage Bay</span>
            </label>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE PRINTABLE LABEL (Has id="printable-qr-label" for @media print)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex justify-center p-2 bg-slate-100/70 rounded-xl border border-slate-200">
          <div 
            id="printable-qr-label"
            className={`bg-white border-2 border-slate-900 rounded-lg p-4 shadow-sm text-slate-900 transition-all ${
              labelSize === 'compact' 
                ? 'w-full max-w-[360px]' 
                : labelSize === 'pallet'
                  ? 'w-full max-w-[560px] p-6'
                  : 'w-full max-w-[480px]'
            }`}
          >
            {/* Top Regulatory Header Strip */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black tracking-tight text-xs uppercase">
                  Agro<span className="text-emerald-700">Vault</span> Ghana
                </span>
                <span className="text-[9px] text-slate-500 font-mono">EPA/RETAIL/2026</span>
              </div>
              <div className="text-[10px] font-mono-tabular font-bold uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                {product.category}
              </div>
            </div>

            {/* WHO Hazard Color Stripe */}
            <div className="mb-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-3 h-3 rounded-full ${hazard.bg}`} />
                <span className={`text-[10px] font-bold ${hazard.text} uppercase`}>
                  {hazard.label}
                </span>
              </div>
              <div className={`w-full h-1 rounded-full ${hazard.bg}`} />
            </div>

            {/* Main Label Body */}
            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Left Column: QR Code & SKU */}
              <div className="col-span-5 flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded-md">
                {loading ? (
                  <div className="w-28 h-28 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${product.name}`}
                    className="w-full aspect-square object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    QR Error
                  </div>
                )}
                <span className="font-mono-tabular font-black text-[11px] tracking-wider text-slate-900 mt-1">
                  {product.id}
                </span>
              </div>

              {/* Right Column: Chemical Information */}
              <div className="col-span-7 space-y-1.5 text-left text-xs">
                <div>
                  <h4 className="font-black text-sm text-slate-950 leading-tight">
                    {product.tradeName}
                  </h4>
                  <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5 font-medium">
                    {product.activeIngredient}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono-tabular border-t border-slate-200 pt-1.5">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">EPA Reg ID:</span>
                    <strong className="text-slate-900">{product.regNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Pack Size:</span>
                    <strong className="text-slate-900">{product.packageSize}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Batch No:</span>
                    <strong className="text-slate-900">{product.batchNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Exp Date:</span>
                    <strong className="text-rose-700">{product.expiryDate}</strong>
                  </div>
                </div>

                {includeStorageBay && (
                  <div className="text-[10px] text-slate-700 bg-slate-50 p-1 rounded border border-slate-200">
                    <span className="text-slate-500 text-[9px]">Location: </span>
                    <span className="font-medium">{product.storageLocation}</span>
                  </div>
                )}

                {includePricing && (
                  <div className="flex items-center justify-between text-[11px] border-t border-slate-200 pt-1 font-mono-tabular">
                    <span className="text-slate-500 text-[10px]">Retail Price:</span>
                    <strong className="font-bold text-slate-950 text-xs">
                      {formatGHS(product.price)}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Caution Footer */}
            <div className="border-t border-slate-200 mt-2.5 pt-1.5 flex items-center justify-between text-[9px] text-slate-500">
              <span className="font-mono">Scan via AgroVault POS or Handheld Wedge</span>
              <span>Reorder: Min {restockPoint} {product.unit}s</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation (no-print) */}
        <div className="no-print space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print QR Sticker</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                title="Copy SKU code to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : product.id}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onOpenQuickUpdate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickUpdate(product);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Scan / Quick Stock Update</span>
                </button>
              )}

              {onOpenBatchPrint && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBatchPrint();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Batch Print Sheet</span>
                </button>
              )}
            </div>

          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Tip for Warehouse Staff:</strong> Affix printed stickers directly to the chemical canister or pallet display. Scanning this QR code from the camera scanner opens the quick stock decrement/increment modal instantly.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
