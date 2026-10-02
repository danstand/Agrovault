import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { AgrochemicalProduct } from '../types/agrochemical';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { X, Sliders, Building2, Check, AlertTriangle } from 'lucide-react';

interface RestockThresholdModalProps {
  product: AgrochemicalProduct;
  onClose: () => void;
}

export const RestockThresholdModal: React.FC<RestockThresholdModalProps> = ({
  product,
  onClose
}) => {
  const { suppliers, updateRestockThreshold } = useAgroStore();

  const currentThreshold = product.restockLevel !== undefined ? product.restockLevel : product.minStockLevel;
  const currentReorderQty = product.reorderQuantity || Math.max(15, currentThreshold * 2);

  const [threshold, setThreshold] = useState<number>(currentThreshold);
  const [reorderQty, setReorderQty] = useState<number>(currentReorderQty);
  const [supplierId, setSupplierId] = useState<string>(product.supplierId || suppliers[0]?.id || 'SUP-001');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestockThreshold(product.id, threshold, reorderQty, supplierId);
    onClose();
  };

  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configure Restock Level</h3>
              <p className="text-xs text-slate-500">{product.tradeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
          <div className="flex justify-between">
            <span>Current Physical Stock:</span>
            <strong className="font-mono-tabular text-slate-900">{product.stock} {product.unit}s</strong>
          </div>
          <div className="flex justify-between">
            <span>Active Ingredient:</span>
            <span className="text-slate-700">{product.activeIngredient}</span>
          </div>
          <div className="flex justify-between">
            <span>Wholesale Cost Price:</span>
            <span className="font-mono-tabular font-medium text-slate-900">{formatGHS(product.costPrice)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Restock Trigger Level (Minimum Stock Point)
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              When current inventory falls to or below this number, the system will trigger an automatic supplier alert.
            </p>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-tabular font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {product.unit}s
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Standard Reorder Batch Pack
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              Default quantity to order from supplier when restock alert is sent.
            </p>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={reorderQty}
                onChange={(e) => setReorderQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-tabular font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {product.unit}s
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 font-mono-tabular mt-1">
              Estimated Order Cost: <strong>{formatGHS(reorderQty * product.costPrice)}</strong>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Designated Chemical Supplier
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city} · {s.leadTimeDays}d lead time)
                </option>
              ))}
            </select>
            {selectedSupplier && (
              <p className="text-[11px] text-slate-500 mt-1">
                Primary contact: {selectedSupplier.contactPerson} ({selectedSupplier.phone})
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Restock Settings</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
