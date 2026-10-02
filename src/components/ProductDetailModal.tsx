import React from 'react';
import { AgrochemicalProduct } from '../types/agrochemical';
import { useAgroStore } from '../context/AgroStoreContext';
import { formatGHS } from '../utils/currency';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Clock, MapPin, Building2, Package, FileText } from 'lucide-react';

interface ProductDetailModalProps {
  product: AgrochemicalProduct | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart } = useAgroStore();
  const [quantity, setQuantity] = React.useState(1);

  if (!product) return null;

  const getHazardBandStyle = (band: string) => {
    switch (band) {
      case 'RED':
        return {
          border: 'border-l-4 border-red-600',
          badgeText: 'text-red-700 bg-red-50',
          title: 'WHO Class Ib · Highly Hazardous (Restricted)',
          instruction: 'Mandatory PPE: Full chemical overalls, face shield, and chemical respirator. Antidote on standby.'
        };
      case 'YELLOW':
        return {
          border: 'border-l-4 border-amber-500',
          badgeText: 'text-amber-800 bg-amber-50',
          title: 'WHO Class II · Moderately Hazardous (Warning)',
          instruction: 'Wear nitrile gloves, eye goggles, and protective footwear during mixing and application.'
        };
      case 'BLUE':
        return {
          border: 'border-l-4 border-blue-600',
          badgeText: 'text-blue-800 bg-blue-50',
          title: 'WHO Class III · Slightly Hazardous (Caution)',
          instruction: 'Avoid skin contact and inhalation of spray mist. Wash thoroughly with soap and water after handling.'
        };
      case 'GREEN':
      default:
        return {
          border: 'border-l-4 border-emerald-600',
          badgeText: 'text-emerald-800 bg-emerald-50',
          title: 'WHO Class IV / General Agronomy (Caution)',
          instruction: 'General agricultural input. Keep sealed in dry environment away from livestock and children.'
        };
    }
  };

  const hazard = getHazardBandStyle(product.hazardBand);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
              {product.category.replace('_', ' ')}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-mono-tabular text-slate-500">
              Reg: {product.regNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Title and Image Preview */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-48 h-48 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>
              <p className="text-sm font-medium text-emerald-800">
                Active Ingredient: <span className="font-semibold text-slate-800">{product.activeIngredient}</span>
              </p>
              
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl font-bold font-mono-tabular text-slate-900">
                  {formatGHS(product.price)}
                </span>
                <span className="text-xs text-slate-500">
                  per {product.packageSize}
                </span>
              </div>

              {/* Stock and Batch */}
              <div className="pt-2 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current Stock: <strong className="font-mono-tabular text-slate-900">{product.stock} units</strong> available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manufacturer: {product.manufacturer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Storage: {product.storageLocation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* WHO Chemical Toxicity Hazard Classification Notice */}
          <div className={`p-4 rounded-lg bg-slate-50 border ${hazard.border} space-y-1`}>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-900">{hazard.title}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {hazard.instruction}
            </p>
            {product.restrictedPrescription && (
              <div className="mt-2 text-xs font-semibold text-red-700 bg-red-100/70 px-2.5 py-1 rounded inline-block">
                Prescription / Certified Applicator ID required before release.
              </div>
            )}
          </div>

          {/* Dosage & Target Crops */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="font-semibold text-slate-700 block mb-1.5">Dosage & Field Calibration</span>
              <p className="text-slate-600 leading-relaxed">{product.dosageGuidance}</p>
            </div>
            
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="font-semibold text-slate-700 block mb-1.5">Target Crops & Pre-Harvest Interval</span>
              <div className="text-slate-600 space-y-1">
                <div>Crops: {product.targetCrops.join(', ')}</div>
                <div className="flex items-center gap-1 font-medium text-amber-900 mt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Safe Pre-Harvest Interval (PHI): {product.preHarvestIntervalDays} Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Tracking & Expiry */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              Batch No: <strong className="font-mono-tabular text-slate-700">{product.batchNumber}</strong>
            </div>
            <div>
              Mfg: <span className="font-mono-tabular">{product.manufacturingDate}</span>
            </div>
            <div>
              Exp: <span className="font-mono-tabular font-semibold text-slate-800">{product.expiryDate}</span>
            </div>
          </div>

          {/* Material Safety Data Sheet Summary */}
          <div className="text-xs text-slate-600 bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-100/60">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-950 mb-1">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>MSDS Safety & Environmental Summary</span>
            </div>
            <p className="leading-relaxed text-slate-700">{product.msdsSummary}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-medium">Quantity:</label>
            <div className="flex items-center border border-slate-300 rounded-md bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-l-md font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                className="w-12 text-center text-xs font-mono-tabular font-medium focus:outline-none"
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-r-md font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 rounded-lg transition-colors shadow-xs"
            >
              {product.stock > 0 ? `Add ${quantity} to Sale Cart (${formatGHS(product.price * quantity)})` : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
