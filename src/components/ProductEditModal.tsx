import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { AgrochemicalProduct, ProductCategory, HazardBand } from '../types/agrochemical';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { 
  X, 
  Save, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  Package, 
  Calendar, 
  Layers, 
  SlidersHorizontal,
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface ProductEditModalProps {
  product: AgrochemicalProduct;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  onClose,
  onSuccess
}) => {
  const { updateProduct, deleteProduct, suppliers, adjustStock, isAdmin } = useAgroStore();

  // Form State initialized with product values
  const [tradeName, setTradeName] = useState(product.tradeName || product.name);
  const [activeIngredient, setActiveIngredient] = useState(product.activeIngredient);
  const [category, setCategory] = useState<ProductCategory>(product.category);
  const [hazardBand, setHazardBand] = useState<HazardBand>(product.hazardBand);
  const [regNumber, setRegNumber] = useState(product.regNumber);
  const [manufacturer, setManufacturer] = useState(product.manufacturer);
  const [packageSize, setPackageSize] = useState(product.packageSize);
  const [price, setPrice] = useState(String(product.price));
  const [costPrice, setCostPrice] = useState(String(product.costPrice));
  const [stock, setStock] = useState(String(product.stock));
  const [restockLevel, setRestockLevel] = useState(String(product.restockLevel ?? product.minStockLevel));
  const [reorderQuantity, setReorderQuantity] = useState(String(product.reorderQuantity ?? product.minStockLevel * 2));
  const [supplierId, setSupplierId] = useState(product.supplierId || suppliers[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState(product.batchNumber);
  const [expiryDate, setExpiryDate] = useState(product.expiryDate);
  const [storageLocation, setStorageLocation] = useState(product.storageLocation);
  const [preHarvestIntervalDays, setPreHarvestIntervalDays] = useState(String(product.preHarvestIntervalDays || 14));
  const [restrictedPrescription, setRestrictedPrescription] = useState(product.restrictedPrescription || false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const getHazardText = (band: HazardBand) => {
    switch (band) {
      case 'RED': return 'WHO Class Ib · Highly Toxic (Restricted)';
      case 'YELLOW': return 'WHO Class II · Moderately Toxic (Warning)';
      case 'BLUE': return 'WHO Class III · Slightly Toxic (Caution)';
      case 'GREEN': return 'Class IV · General Use';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeName.trim()) return;

    const matchedSupplier = suppliers.find(s => s.id === supplierId);
    const parsedPrice = parseFloat(price) || product.price;
    const parsedCostPrice = parseFloat(costPrice) || product.costPrice;
    const parsedStock = parseInt(stock) || product.stock;
    const parsedRestockLevel = parseInt(restockLevel) || 15;
    const parsedReorderQty = parseInt(reorderQuantity) || 30;

    // Check if stock was altered directly to log discrepancy
    const stockDiff = parsedStock - product.stock;
    if (stockDiff !== 0) {
      adjustStock(
        product.id, 
        stockDiff, 
        `Administrative stock edit: adjusted from ${product.stock} to ${parsedStock}`
      );
    }

    const updated: AgrochemicalProduct = {
      ...product,
      name: tradeName,
      tradeName,
      activeIngredient,
      category,
      hazardBand,
      hazardClassText: getHazardText(hazardBand),
      regNumber,
      manufacturer,
      packageSize,
      unit: packageSize.toLowerCase().includes('kg') ? 'kg' : packageSize.toLowerCase().includes('ml') ? 'ml' : 'L',
      price: parsedPrice,
      costPrice: parsedCostPrice,
      stock: parsedStock,
      minStockLevel: parsedRestockLevel,
      restockLevel: parsedRestockLevel,
      reorderQuantity: parsedReorderQty,
      supplierId: matchedSupplier?.id || product.supplierId,
      supplierName: matchedSupplier?.name || product.supplierName,
      supplierContact: matchedSupplier?.phone || product.supplierContact,
      supplierEmail: matchedSupplier?.email || product.supplierEmail,
      supplierLeadTimeDays: matchedSupplier?.leadTimeDays || product.supplierLeadTimeDays,
      batchNumber,
      expiryDate,
      storageLocation,
      preHarvestIntervalDays: parseInt(preHarvestIntervalDays) || 14,
      restrictedPrescription
    };

    updateProduct(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 600);
  };

  const handleDelete = () => {
    deleteProduct(product.id);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Edit Agrochemical SKU: {product.tradeName}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Administrative SKU modification: Update regulatory EPA data, pricing, stock count, and supplier links
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Product successfully updated in warehouse database!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Identity & Trade Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Commercial Trade Name</label>
              <input
                type="text"
                required
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Active Ingredient & Concentration</label>
              <input
                type="text"
                required
                value={activeIngredient}
                onChange={(e) => setActiveIngredient(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          {/* Classification & Toxicity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="HERBICIDE">Herbicide</option>
                <option value="FUNGICIDE">Fungicide</option>
                <option value="INSECTICIDE">Insecticide</option>
                <option value="FERTILIZER">Fertilizer</option>
                <option value="SEED_TREATMENT">Seed Treatment</option>
                <option value="EQUIPMENT_PPE">Equipment & PPE</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">WHO Hazard Class</label>
              <select
                value={hazardBand}
                onChange={(e) => setHazardBand(e.target.value as HazardBand)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="RED">Red Band (Class Ib · Highly Toxic)</option>
                <option value="YELLOW">Yellow Band (Class II · Moderately Toxic)</option>
                <option value="BLUE">Blue Band (Class III · Slightly Toxic)</option>
                <option value="GREEN">Green Band (Class IV · General Agronomy)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">EPA Registration ID</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Pricing & Stock In-Hand */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Wholesale Cost (GH₵)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono-tabular font-bold"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Retail Selling Price (GH₵)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono-tabular font-bold text-emerald-900"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-emerald-950">Current Physical In-Stock</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg font-mono-tabular font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Altering stock adjusts ledger balance</span>
            </div>
          </div>

          {/* Restock Levels & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Restock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={restockLevel}
                onChange={(e) => setRestockLevel(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono-tabular"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Reorder Pack Qty</label>
              <input
                type="number"
                min="1"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono-tabular"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Authorized Importer</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Traceability: Batch, Expiry, Storage Bay */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Batch Number</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Storage Location Bay</label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Additional Agronomic Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editRestricted"
                checked={restrictedPrescription}
                onChange={(e) => setRestrictedPrescription(e.target.checked)}
                className="rounded text-rose-600 focus:ring-0"
              />
              <label htmlFor="editRestricted" className="text-slate-700 font-medium select-none">
                Restricted Agrochemical (Requires Certified Applicator License / Prescription)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-600">PHI (Pre-Harvest Interval):</span>
              <input
                type="number"
                value={preHarvestIntervalDays}
                onChange={(e) => setPreHarvestIntervalDays(e.target.value)}
                className="w-14 px-2 py-1 border border-slate-300 rounded font-mono text-center"
              />
              <span className="text-slate-500">days</span>
            </div>
          </div>

          {/* Action Buttons & Delete Zone */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-700 font-bold">Permanently delete SKU?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg font-medium cursor-pointer transition-colors"
                title="Delete agrochemical SKU from system"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Product</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-850 hover:bg-emerald-950 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save SKU Changes</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
