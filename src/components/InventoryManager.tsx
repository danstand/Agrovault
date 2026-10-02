import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { AgrochemicalProduct, ProductCategory, HazardBand, Supplier } from '../types/agrochemical';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { SupplierAlertModal } from './SupplierAlertModal';
import { RestockThresholdModal } from './RestockThresholdModal';
import { ProductQrLabelModal } from './ProductQrLabelModal';
import { BatchQrPrintModal } from './BatchQrPrintModal';
import { QrInventoryScannerModal } from './QrInventoryScannerModal';
import { ProductEditModal } from './ProductEditModal';
import { BulkStockUploadModal } from './BulkStockUploadModal';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  ShieldAlert, 
  Calendar, 
  Building2, 
  CheckCircle2,
  X,
  History,
  Truck,
  Send,
  Mail,
  Phone,
  Clock,
  Sliders,
  ArrowUpRight,
  Sparkles,
  Layers,
  FileText,
  QrCode,
  Printer,
  ScanLine,
  Camera,
  Upload,
  Pencil,
  ShieldCheck,
  Lock
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    adjustStock, 
    suppliers,
    supplierAlerts,
    criticalAlertsCount,
    totalActiveAlertsCount,
    restockPurchaseOrders,
    setActiveTab,
    currentRole,
    setRole,
    isAdmin
  } = useAgroStore();

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'alerts' | 'suppliers'>('inventory');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [hazardFilter, setHazardFilter] = useState('ALL');
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'LOW_STOCK' | 'EXPIRING_SOON'>('ALL');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<AgrochemicalProduct | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('10');
  const [adjustReason, setAdjustReason] = useState<string>('SUPPLIER_RESTOCK');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Admin Edit & Bulk Upload Modals
  const [editingProduct, setEditingProduct] = useState<AgrochemicalProduct | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Restock and Supplier Modals
  const [alertModalProduct, setAlertModalProduct] = useState<AgrochemicalProduct | null>(null);
  const [thresholdModalProduct, setThresholdModalProduct] = useState<AgrochemicalProduct | null>(null);

  // QR Label and Inventory Scanner Modals
  const [selectedQrProduct, setSelectedQrProduct] = useState<AgrochemicalProduct | null>(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialProduct, setScannerInitialProduct] = useState<AgrochemicalProduct | null>(null);

  // Add Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newTradeName, setNewTradeName] = useState('');
  const [newActiveIngredient, setNewActiveIngredient] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('HERBICIDE');
  const [newHazardBand, setNewHazardBand] = useState<HazardBand>('YELLOW');
  const [newRegNumber, setNewRegNumber] = useState('EPA/AGR/2026-');
  const [newManufacturer, setNewManufacturer] = useState('Syngenta Agro');
  const [newPackageSize, setNewPackageSize] = useState('1 Liter');
  const [newPrice, setNewPrice] = useState('25.00');
  const [newCostPrice, setNewCostPrice] = useState('18.00');
  const [newInitialStock, setNewInitialStock] = useState('40');
  const [newRestockLevel, setNewRestockLevel] = useState('15');
  const [newReorderQty, setNewReorderQty] = useState('30');
  const [newSupplierId, setNewSupplierId] = useState(suppliers[0]?.id || 'SUP-001');
  const [newBatchNumber, setNewBatchNumber] = useState(`BATCH-2026-SKU-${Math.floor(100 + Math.random() * 900)}`);
  const [newExpiryDate, setNewExpiryDate] = useState('2028-06-30');
  const [newStorageLocation, setNewStorageLocation] = useState('Aisle 2 · Shelf B1');
  const [newPhiDays, setNewPhiDays] = useState('14');
  const [newRestricted, setNewRestricted] = useState(false);

  // Calculations
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValuation = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.stock * p.price, 0);
  
  const inTransitOrdersCount = restockPurchaseOrders.filter(
    po => po.status === 'ALERT_SENT' || po.status === 'SUPPLIER_ACKNOWLEDGED' || po.status === 'IN_TRANSIT'
  ).length;

  const isExpiringWithin90Days = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr).getTime();
    const now = new Date('2026-09-25').getTime();
    const diffDays = (expiry - now) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 120;
  };

  const expiringCount = products.filter(p => isExpiringWithin90Days(p.expiryDate)).length;

  const filteredProducts = products.filter(p => {
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesHazard = hazardFilter === 'ALL' || p.hazardBand === hazardFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      p.name.toLowerCase().includes(q) || 
      p.activeIngredient.toLowerCase().includes(q) ||
      p.batchNumber.toLowerCase().includes(q) ||
      p.regNumber.toLowerCase().includes(q) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q));

    let matchesAlert = true;
    const threshold = p.restockLevel !== undefined ? p.restockLevel : p.minStockLevel;
    if (alertFilter === 'LOW_STOCK') matchesAlert = p.stock <= threshold;
    if (alertFilter === 'EXPIRING_SOON') matchesAlert = isExpiringWithin90Days(p.expiryDate);

    return matchesCat && matchesHazard && matchesSearch && matchesAlert;
  });

  const handleStockAdjustment = () => {
    if (!adjustingProduct) return;
    const amt = parseInt(adjustAmount) || 0;
    if (amt === 0) return;

    adjustStock(adjustingProduct.id, amt, `${adjustReason}: ${adjustNotes || 'Routine adjustment'}`);
    setAdjustingProduct(null);
    setAdjustNotes('');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newActiveIngredient) return;

    let hazardText = 'WHO Class II · Moderately Toxic';
    if (newHazardBand === 'RED') hazardText = 'WHO Class Ib · Highly Toxic';
    else if (newHazardBand === 'BLUE') hazardText = 'WHO Class III · Slightly Toxic';
    else if (newHazardBand === 'GREEN') hazardText = 'Class IV · General Use';

    const supplierObj = suppliers.find(s => s.id === newSupplierId);
    const rLevel = parseInt(newRestockLevel) || 10;
    const rQty = parseInt(newReorderQty) || Math.max(15, rLevel * 2);

    addProduct({
      name: newProdName,
      tradeName: newTradeName || newProdName,
      activeIngredient: newActiveIngredient,
      category: newCategory,
      hazardBand: newHazardBand,
      hazardClassText: hazardText,
      regNumber: newRegNumber,
      manufacturer: newManufacturer,
      packageSize: newPackageSize,
      unit: newPackageSize.toLowerCase().includes('kg') ? 'kg' : newPackageSize.toLowerCase().includes('ml') ? 'ml' : 'L',
      price: parseFloat(newPrice) || 10,
      costPrice: parseFloat(newCostPrice) || 7,
      stock: parseInt(newInitialStock) || 10,
      minStockLevel: rLevel,
      restockLevel: rLevel,
      reorderQuantity: rQty,
      supplierId: newSupplierId,
      supplierName: supplierObj?.name || 'Authorized Ghana Supplier',
      supplierContact: supplierObj?.phone || '+233 24 431 8890',
      supplierEmail: supplierObj?.email || 'orders@agrovault-gh.com',
      supplierLeadTimeDays: supplierObj?.leadTimeDays || 2,
      batchNumber: newBatchNumber,
      manufacturingDate: '2026-03-01',
      expiryDate: newExpiryDate,
      storageLocation: newStorageLocation,
      dosageGuidance: 'Apply according to registered agronomic crop schedule with approved PPE.',
      targetCrops: ['Maize', 'Vegetables', 'Field Crops'],
      preHarvestIntervalDays: parseInt(newPhiDays) || 14,
      image: '/src/assets/images/product_herbicide_canister_1790326847619.jpg',
      msdsSummary: 'Store in original container sealed tightly. Avoid drift onto non-target crops or waterways.',
      restrictedPrescription: newRestricted
    });

    setIsAddModalOpen(false);
    // Reset inputs
    setNewProdName('');
    setNewActiveIngredient('');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Role Notice & Administrative Access Banner */}
      {currentRole === 'FARMER' ? (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              You are currently viewing in <strong>Farmer Portal mode</strong> (Read-only inventory). To add or edit products and upload stock files, switch to <strong>Administrator</strong> mode.
            </span>
          </div>
          <button
            onClick={() => setRole('ADMIN')}
            className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Enable Administrator Access
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-emerald-100 text-emerald-800 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Administrative Access Active:</strong> You can edit any product directly, upload stock via CSV spreadsheets, register new chemicals, and manage warehouse inventory.
            </span>
          </div>
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="text-xs font-bold text-emerald-900 hover:text-emerald-950 underline cursor-pointer"
          >
            Upload Stock File →
          </button>
        </div>
      )}

      {/* Top Inventory Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Registered Agrochemical SKUs</span>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900">{products.length} Items</div>
          <span className="text-[11px] text-slate-400 font-mono-tabular">{totalStockCount} Total physical units</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Wholesale Inventory Valuation</span>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900">{formatGHS(totalInventoryValuation)}</div>
          <span className="text-[11px] text-emerald-700 font-mono-tabular">Retail Value: {formatGHS(totalRetailValuation)}</span>
        </div>

        {/* Restock Level Alert Card */}
        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
            totalActiveAlertsCount > 0
              ? criticalAlertsCount > 0
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20'
                : 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Restock Level Alerts</span>
              {totalActiveAlertsCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </span>
            <AlertTriangle className={`w-4 h-4 ${criticalAlertsCount > 0 ? 'text-rose-600' : 'text-amber-500'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono-tabular ${criticalAlertsCount > 0 ? 'text-rose-700' : totalActiveAlertsCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {totalActiveAlertsCount} SKUs
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600">
              {criticalAlertsCount > 0 ? `${criticalAlertsCount} critical stockouts` : 'At or below threshold'}
            </span>
            <span className="font-semibold text-emerald-800 hover:underline">
              Alert Suppliers →
            </span>
          </div>
        </button>

        {/* In-Transit Restock Orders Card */}
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 text-left transition-all cursor-pointer shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Supplier Orders In-Flight</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900">
            {inTransitOrdersCount} Active POs
          </div>
          <span className="text-[11px] text-slate-500">
            {suppliers.length} Registered Ghanaian Importers
          </span>
        </button>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'inventory'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Warehouse Stock Ledger</span>
          </button>

          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'alerts'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Supplier Restock Alerts</span>
            {totalActiveAlertsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full font-mono-tabular text-[10px] font-bold ${
                activeSubTab === 'alerts' ? 'bg-amber-800 text-white' : 'bg-rose-600 text-white'
              }`}>
                {totalActiveAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'suppliers'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Suppliers Directory & POs</span>
            {inTransitOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 font-mono-tabular text-[10px] font-bold">
                {inTransitOrdersCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Upload Stock via CSV / Bulk */}
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            title="Bulk upload stock via CSV spreadsheet, Excel export, or copy-pasting inventory rows"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Stock (CSV / Bulk)</span>
          </button>

          <button
            onClick={() => {
              setScannerInitialProduct(null);
              setIsScannerOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            title="Scan product QR label with device camera or USB barcode wedge scanner"
          >
            <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scan QR / Quick Stock Update</span>
          </button>

          <button
            onClick={() => setIsBatchPrintOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            title="Batch print scannable QR sticker sheets for warehouse inventory"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Batch Print QR Stickers</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Agrochemical</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: WAREHOUSE STOCK LEDGER
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search & Filter Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search SKU, active ingredient, supplier, batch, or EPA Reg..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="HERBICIDE">Herbicides</option>
                  <option value="FUNGICIDE">Fungicides</option>
                  <option value="INSECTICIDE">Insecticides</option>
                  <option value="FERTILIZER">Fertilizers</option>
                  <option value="SEED_TREATMENT">Seed Treatment</option>
                  <option value="EQUIPMENT_PPE">Equipment & PPE</option>
                </select>

                <select
                  value={hazardFilter}
                  onChange={(e) => setHazardFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Hazard Bands</option>
                  <option value="RED">Red (Class Ib)</option>
                  <option value="YELLOW">Yellow (Class II)</option>
                  <option value="BLUE">Blue (Class III)</option>
                  <option value="GREEN">Green (Class IV)</option>
                </select>

                <select
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="LOW_STOCK">Below Restock Level Only</option>
                  <option value="EXPIRING_SOON">Expiring Soon Only</option>
                </select>
              </div>
            </div>

            {alertFilter !== 'ALL' && (
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span>Filtered by: <strong>{alertFilter.replace('_', ' ')}</strong></span>
                <button
                  onClick={() => setAlertFilter('ALL')}
                  className="text-emerald-800 hover:underline font-medium cursor-pointer"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">Chemical & Active Ingredient</th>
                    <th className="py-3 px-3">Hazard Class</th>
                    <th className="py-3 px-3">Current Stock vs Restock Level</th>
                    <th className="py-3 px-3">Designated Supplier</th>
                    <th className="py-3 px-3 text-right">Wholesale Cost</th>
                    <th className="py-3 px-3 text-right">Retail Price</th>
                    <th className="py-3 px-3 text-center">QR Code</th>
                    <th className="py-3 px-4 text-center">Restock & Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const threshold = p.restockLevel !== undefined ? p.restockLevel : p.minStockLevel;
                    const isBelowRestock = p.stock <= threshold;
                    const isCritical = p.stock === 0 || p.stock <= Math.max(1, Math.floor(threshold * 0.3));
                    const isExpSoon = isExpiringWithin90Days(p.expiryDate);
                    const stockPercentage = Math.min(100, Math.round((p.stock / (threshold * 2)) * 100));

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="font-semibold text-slate-900 hover:text-emerald-800 text-left hover:underline cursor-pointer block"
                            title="Click to edit product details"
                          >
                            {p.name}
                          </button>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{p.activeIngredient}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono-tabular mt-0.5">
                            <span>Reg: {p.regNumber}</span>
                            <span>·</span>
                            <span>Pack: {p.packageSize}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              p.hazardBand === 'RED' ? 'bg-red-600' :
                              p.hazardBand === 'YELLOW' ? 'bg-amber-500' :
                              p.hazardBand === 'BLUE' ? 'bg-blue-600' : 'bg-emerald-600'
                            }`} />
                            <span className="text-[11px] font-medium text-slate-700">{p.hazardBand} Band</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{p.hazardClassText.split('·')[0]}</div>
                        </td>

                        {/* Restock Level Meter */}
                        <td className="py-3 px-3">
                          <div className="space-y-1 min-w-[130px]">
                            <div className="flex items-center justify-between">
                              <span className={`font-mono-tabular font-bold ${
                                isCritical ? 'text-rose-600' : isBelowRestock ? 'text-amber-600' : 'text-slate-900'
                              }`}>
                                {p.stock} {p.unit}s
                              </span>
                              <button
                                onClick={() => setThresholdModalProduct(p)}
                                className="text-[10px] text-slate-500 hover:text-emerald-800 font-mono-tabular hover:underline flex items-center gap-0.5 cursor-pointer"
                                title="Click to adjust restock threshold"
                              >
                                <span>Min: {threshold}</span>
                                <Sliders className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Health Progress Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isCritical 
                                    ? 'bg-rose-500' 
                                    : isBelowRestock 
                                      ? 'bg-amber-500' 
                                      : 'bg-emerald-600'
                                }`}
                                style={{ width: `${Math.max(8, stockPercentage)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              {isCritical ? (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Critical Low
                                </span>
                              ) : isBelowRestock ? (
                                <span className="text-amber-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Restock Due
                                </span>
                              ) : (
                                <span className="text-emerald-700">Healthy Stock</span>
                              )}
                              <span className="text-slate-400 font-mono-tabular">Order Pack: {p.reorderQuantity || threshold * 2}</span>
                            </div>
                          </div>
                        </td>

                        {/* Supplier */}
                        <td className="py-3 px-3 text-slate-600">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{p.supplierName || 'National Agro Importer'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Lead time: ~{p.supplierLeadTimeDays || 2} days
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono-tabular text-slate-600">
                          {formatGHS(p.costPrice)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-slate-900">
                          {formatGHS(p.price)}
                        </td>

                        {/* QR Code Sticker */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedQrProduct(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                            title="Generate & Print QR Code Sticker with EPA Reg & Batch Traceability"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-800" />
                            <span>QR Label</span>
                          </button>
                        </td>

                        {/* Manage Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {isBelowRestock ? (
                              <button
                                onClick={() => setAlertModalProduct(p)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-xs ${
                                  isCritical 
                                    ? 'bg-rose-700 hover:bg-rose-800 text-white' 
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                                }`}
                              >
                                <Send className="w-3 h-3" />
                                <span>Alert Supplier</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setAlertModalProduct(p)}
                                className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                              >
                                Order
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setScannerInitialProduct(p);
                                setIsScannerOpen(true);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                              title="Open Quick QR Scanner & stock updater for this chemical"
                            >
                              <ScanLine className="w-3 h-3 text-emerald-700" />
                              <span>Scan/Update</span>
                            </button>

                            <button
                              onClick={() => {
                                setAdjustingProduct(p);
                                setAdjustAmount('10');
                                setAdjustReason('SUPPLIER_RESTOCK');
                              }}
                              className="px-2 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                              title="Manual stocktake correction or write-off"
                            >
                              Adjust
                            </button>

                            {/* Admin Edit Button */}
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              className="px-2 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                              title="Edit agrochemical details, prices, stock count, EPA reg, restock levels"
                            >
                              <Pencil className="w-3 h-3 text-amber-700" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: SUPPLIER RESTOCK ALERTS
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  {supplierAlerts.length} Agrochemical Items Below Restock Level
                </h3>
                <p className="text-xs text-amber-800">
                  {criticalAlertsCount > 0 ? `${criticalAlertsCount} critical stockouts requiring immediate PO dispatch.` : 'Products below minimum safety threshold.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-900 font-mono-tabular">
                Estimated Restock Budget: <strong>{formatGHS(supplierAlerts.reduce((acc, a) => acc + a.estimatedRestockCost, 0))}</strong>
              </span>
            </div>
          </div>

          {supplierAlerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">All Stock Levels Healthy!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No chemical supplies are currently at or below their restock thresholds. When items are sold through POS, automatic alerts will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supplierAlerts.map((alert) => {
                const product = products.find(p => p.id === alert.productId);
                if (!product) return null;

                const isCrit = alert.urgency === 'CRITICAL';

                return (
                  <div 
                    key={alert.id}
                    className={`bg-white rounded-xl border shadow-xs p-4 space-y-3 transition-all ${
                      isCrit ? 'border-rose-300 ring-1 ring-rose-400/20' : 'border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCrit ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isCrit ? 'CRITICAL DEPLETION' : 'RESTOCK THRESHOLD'}
                          </span>
                          <span className="text-[11px] text-slate-400">{alert.category}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{alert.productName}</h4>
                        <p className="text-xs text-slate-500">{alert.tradeName}</p>
                      </div>

                      <button
                        onClick={() => setThresholdModalProduct(product)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                        title="Edit Restock Threshold"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stock Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs font-mono-tabular">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Stock</span>
                        <strong className={isCrit ? 'text-rose-600 text-sm' : 'text-amber-600 text-sm'}>
                          {alert.currentStock} {alert.unit}s
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Restock Level</span>
                        <strong className="text-slate-800 text-sm">{alert.restockLevel} {alert.unit}s</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Suggested Reorder</span>
                        <strong className="text-emerald-800 text-sm">{alert.reorderQuantity} {alert.unit}s</strong>
                      </div>
                    </div>

                    {/* Assigned Supplier & Financials */}
                    <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{alert.supplierName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono-tabular">
                          Contact: {alert.supplierContact}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Estimated Cost</span>
                        <span className="font-bold text-slate-900 font-mono-tabular">
                          {formatGHS(alert.estimatedRestockCost)}
                        </span>
                      </div>
                    </div>

                    {/* Order Status & Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      {alert.activeStatus === 'ALERTED_SUPPLIER' || alert.activeStatus === 'ORDER_IN_TRANSIT' ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                          <Clock className="w-3 h-3" />
                          <span>PO Dispatched: {alert.activePoNumber}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-rose-700 font-medium">
                          Alert not yet sent
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={() => setSelectedQrProduct(product)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Generate & Print QR Code Sticker"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-800" />
                          <span>QR Sticker</span>
                        </button>

                        <button
                          onClick={() => {
                            setScannerInitialProduct(product);
                            setIsScannerOpen(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Scan and adjust physical stock count"
                        >
                          <ScanLine className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Quick Count</span>
                        </button>

                        <button
                          onClick={() => setAlertModalProduct(product)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Alert</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: SUPPLIERS DIRECTORY & PO HISTORY
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-6">
          {/* Suppliers Cards */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-800" />
                <span>Registered Agrochemical Importers & Formulators in Ghana</span>
              </h3>
              <button
                onClick={() => setActiveTab('suppliers')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Open Full Supplier Management & AI Advisor</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                      <p className="text-slate-500 text-[11px]">{s.city}, {s.region} ({s.address})</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-semibold text-[10px]">
                      {s.leadTimeDays}d Lead Time
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <div>Contact: <strong>{s.contactPerson}</strong></div>
                    <div>Phone: <strong className="font-mono-tabular">{s.phone}</strong></div>
                    <div>Email: <strong className="font-mono-tabular">{s.email}</strong></div>
                    <div>Terms: <strong>{s.paymentTerms}</strong></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <a
                      href={`https://wa.me/${s.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp Direct</span>
                    </a>
                    <a
                      href={`mailto:${s.email}`}
                      className="text-blue-800 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email PO</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Restock Purchase Orders Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-800" />
              <span>Restock Purchase Orders & Consignments History</span>
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="py-3 px-4">PO Reference</th>
                      <th className="py-3 px-3">Date Dispatched</th>
                      <th className="py-3 px-3">Chemical Product</th>
                      <th className="py-3 px-3">Supplier</th>
                      <th className="py-3 px-3 text-right">Order Qty</th>
                      <th className="py-3 px-3 text-right">Total (GH₵)</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {restockPurchaseOrders.map((po) => {
                      const product = products.find(p => p.id === po.productId);

                      return (
                        <tr key={po.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono-tabular font-bold text-slate-900">
                            {po.poNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono-tabular">
                            {new Date(po.dateCreated).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{po.productName}</div>
                            <div className="text-[10px] text-slate-400">Via {po.channelUsed}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {po.supplierName}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-tabular font-bold text-slate-900">
                            {po.quantityOrdered} {po.unit}s
                          </td>
                          <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-emerald-800">
                            {formatGHS(po.totalCostAmount)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              po.status === 'RESTOCKED_RECEIVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.status === 'ALERT_SENT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}>
                              {po.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {po.status !== 'RESTOCKED_RECEIVED' && product && (
                              <button
                                onClick={() => setAlertModalProduct(product)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md cursor-pointer shadow-xs"
                              >
                                Receive
                              </button>
                            )}
                            {po.status === 'RESTOCKED_RECEIVED' && (
                              <span className="text-[11px] text-emerald-700 font-medium">
                                In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS
          ───────────────────────────────────────────────────────────── */}
      
      {/* 1. Supplier Alert Modal */}
      {alertModalProduct && (
        <SupplierAlertModal
          product={alertModalProduct}
          onClose={() => setAlertModalProduct(null)}
        />
      )}

      {/* 2. Configure Restock Threshold Modal */}
      {thresholdModalProduct && (
        <RestockThresholdModal
          product={thresholdModalProduct}
          onClose={() => setThresholdModalProduct(null)}
        />
      )}

      {/* 3. Manual Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock Adjustment & Restock</h3>
                <p className="text-xs text-slate-500">{adjustingProduct.name}</p>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div>Current In-Stock: <strong className="font-mono-tabular">{adjustingProduct.stock} units</strong></div>
              <div>Restock Level: <span className="font-mono-tabular">{adjustingProduct.restockLevel ?? adjustingProduct.minStockLevel} units</span></div>
              <div>Wholesale Cost: <span className="font-mono-tabular">{formatGHS(adjustingProduct.costPrice)}</span></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Adjustment Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="SUPPLIER_RESTOCK">Receive Supplier Restock Shipment (+ Inflow)</option>
                  <option value="AUDIT_CORRECTION">Stocktake Audit Count Correction</option>
                  <option value="DAMAGE_EXPIRY_WRITEOFF">Damaged Container / Expired Write-off (- Outflow)</option>
                  <option value="INTERNAL_USE">Agronomy Demonstration Plot (- Outflow)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Quantity Adjustment (positive to add, negative to subtract)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono-tabular border border-slate-200 rounded-lg"
                  placeholder="e.g. 20 or -5"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Audit Notes / Supplier Invoice Ref</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Delivery Note from Supplier"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="flex-1 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStockAdjustment}
                className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
              >
                Commit Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Agrochemical Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Register New Agrochemical Product</h3>
                <p className="text-xs text-slate-500">Record EPA credentials, restock threshold, and supplier link</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Product Full Name</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Karate 5 EC Insecticide"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Active Ingredient (g/L or %)</label>
                  <input
                    type="text"
                    required
                    value={newActiveIngredient}
                    onChange={(e) => setNewActiveIngredient(e.target.value)}
                    placeholder="e.g. Lambda-cyhalothrin 50 g/L"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white font-medium"
                  >
                    <option value="HERBICIDE">Herbicide</option>
                    <option value="FUNGICIDE">Fungicide</option>
                    <option value="INSECTICIDE">Insecticide</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="SEED_TREATMENT">Seed Treatment</option>
                    <option value="EQUIPMENT_PPE">Equipment / PPE</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Hazard Band</label>
                  <select
                    value={newHazardBand}
                    onChange={(e) => setNewHazardBand(e.target.value as HazardBand)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white font-medium"
                  >
                    <option value="RED">Red (Class Ib - Toxic)</option>
                    <option value="YELLOW">Yellow (Class II - Moderate)</option>
                    <option value="BLUE">Blue (Class III - Caution)</option>
                    <option value="GREEN">Green (Class IV - General)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">EPA Reg Number</label>
                  <input
                    type="text"
                    value={newRegNumber}
                    onChange={(e) => setNewRegNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Package Size</label>
                  <input
                    type="text"
                    value={newPackageSize}
                    onChange={(e) => setNewPackageSize(e.target.value)}
                    placeholder="e.g. 5 Liters / 1 kg"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Cost Price ({CURRENCY_SYMBOL})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Retail Price ({CURRENCY_SYMBOL})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular"
                  />
                </div>
              </div>

              {/* Restock Level & Reorder Quantity */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Initial In-Stock</label>
                  <input
                    type="number"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1 text-emerald-900">Restock Alert Level</label>
                  <input
                    type="number"
                    value={newRestockLevel}
                    onChange={(e) => setNewRestockLevel(e.target.value)}
                    placeholder="15"
                    className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-md font-mono-tabular font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1 text-emerald-900">Reorder Batch Pack</label>
                  <input
                    type="number"
                    value={newReorderQty}
                    onChange={(e) => setNewReorderQty(e.target.value)}
                    placeholder="30"
                    className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-md font-mono-tabular font-bold bg-white"
                  />
                </div>
              </div>

              {/* Designated Supplier */}
              <div>
                <label className="text-slate-700 font-medium block mb-1">Authorized Input Supplier</label>
                <select
                  value={newSupplierId}
                  onChange={(e) => setNewSupplierId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white font-medium"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city} · {s.leadTimeDays}d lead time)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={newBatchNumber}
                    onChange={(e) => setNewBatchNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Storage Location Bay</label>
                  <input
                    type="text"
                    value={newStorageLocation}
                    onChange={(e) => setNewStorageLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="restrictedInput"
                  checked={newRestricted}
                  onChange={(e) => setNewRestricted(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0"
                />
                <label htmlFor="restrictedInput" className="text-slate-700 font-medium select-none">
                  Restricted Chemical (Requires Certified Applicator License / Prescription)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
                >
                  Save & Register Chemical
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Product QR Label & Print Modal */}
      {selectedQrProduct && (
        <ProductQrLabelModal
          product={selectedQrProduct}
          onClose={() => setSelectedQrProduct(null)}
          onOpenQuickUpdate={(prod) => {
            setSelectedQrProduct(null);
            setScannerInitialProduct(prod);
            setIsScannerOpen(true);
          }}
          onOpenBatchPrint={() => {
            setSelectedQrProduct(null);
            setIsBatchPrintOpen(true);
          }}
        />
      )}

      {/* Batch QR Label Print Modal */}
      {isBatchPrintOpen && (
        <BatchQrPrintModal
          products={products}
          onClose={() => setIsBatchPrintOpen(false)}
        />
      )}

      {/* QR Inventory Scanner & Quick Stock Update Modal */}
      {isScannerOpen && (
        <QrInventoryScannerModal
          initialProduct={scannerInitialProduct}
          onClose={() => {
            setIsScannerOpen(false);
            setScannerInitialProduct(null);
          }}
        />
      )}

      {/* Admin Edit Product Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Bulk Stock Upload (CSV / Excel / Paste) Modal */}
      {isBulkUploadOpen && (
        <BulkStockUploadModal
          onClose={() => setIsBulkUploadOpen(false)}
        />
      )}
    </div>
  );
};
