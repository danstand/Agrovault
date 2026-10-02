import React, { useState, useRef } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { AgrochemicalProduct, ProductCategory, HazardBand } from '../types/agrochemical';
import { formatGHS } from '../utils/currency';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  FileSpreadsheet, 
  Sparkles,
  Info,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface BulkStockUploadModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedUploadItem {
  name: string;
  tradeName: string;
  activeIngredient: string;
  category: ProductCategory;
  hazardBand: HazardBand;
  hazardClassText: string;
  regNumber: string;
  manufacturer: string;
  packageSize: string;
  unit: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockLevel: number;
  restockLevel: number;
  reorderQuantity: number;
  supplierId?: string;
  supplierName?: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  storageLocation: string;
  dosageGuidance: string;
  targetCrops: string[];
  preHarvestIntervalDays: number;
  msdsSummary: string;
  restrictedPrescription: boolean;
  image: string;
  isValid: boolean;
  validationError?: string;
}

export const BulkStockUploadModal: React.FC<BulkStockUploadModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { addProductsBatch, suppliers } = useAgroStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedUploadItem[]>([]);
  const [activeStep, setActiveStep] = useState<'input' | 'preview'>('input');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Sample CSV template string
  const sampleCsvContent = `Trade Name,Active Ingredient,Category,Hazard Band,EPA Reg,Initial Stock,Cost Price GHc,Retail Price GHc,Restock Level,Reorder Pack,Package Size,Supplier,Batch No,Expiry Date,Storage Location
GlyphosMax 480 SL,Glyphosate 480 g/L,HERBICIDE,YELLOW,EPA/AGR/2026-H11,60,45.00,65.00,20,40,1 Liter,Wienco Ghana Ltd,BATCH-2026-GLY-1,2028-06-30,Aisle 2 - Shelf B1
Belt Expert 480 SC,Flubendiamide + Thiacloprid,INSECTICIDE,BLUE,EPA/AGR/2026-I09,40,75.00,105.00,15,30,500 ml,Bayer CropScience,BATCH-2026-BLT-4,2028-11-15,Aisle 1 - Shelf A2
Ridomil Gold Plus,Mefenoxam + Copper Oxide,FUNGICIDE,YELLOW,EPA/AGR/2026-F14,80,35.00,50.00,25,50,1 kg,Syngenta West Africa,BATCH-2026-RDM-2,2027-12-31,Aisle 3 - Shelf C1
YaraVera AMIDAS,Granular Urea + Sulphur,FERTILIZER,GREEN,EPA/FERT/2026-Y02,120,180.00,225.00,30,60,50 kg,Yara Ghana Ltd,BATCH-2026-YAR-8,2029-01-20,Pallet Bay 4`;

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'agrovault_stock_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Populate sample data for quick preview
  const handleLoadSample = () => {
    setRawText(sampleCsvContent);
    setUploadedFileName('sample_agrochemical_stock.csv');
    parseCsv(sampleCsvContent);
  };

  // Parse CSV text into items
  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      setParsedItems([]);
      return;
    }

    // Determine if first row is header
    const firstRowLower = lines[0].toLowerCase();
    const hasHeader = firstRowLower.includes('trade') || firstRowLower.includes('name') || firstRowLower.includes('active');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const items: ParsedUploadItem[] = dataLines.map((line, idx) => {
      // Split by comma (allowing quotes) or tab
      const isTab = line.includes('\t');
      let parts: string[] = [];

      if (isTab) {
        parts = line.split('\t').map(p => p.trim());
      } else {
        // Simple CSV regex matching quoted or unquoted
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        parts = matches.map(p => p.replace(/^"|"$/g, '').trim());
      }

      const tradeName = parts[0] || `Imported Chemical #${idx + 1}`;
      const activeIngredient = parts[1] || 'Broad spectrum active formulation';
      const rawCategory = (parts[2] || 'HERBICIDE').toUpperCase().replace(/[^A-Z_]/g, '');
      const validCategories: ProductCategory[] = ['HERBICIDE', 'FUNGICIDE', 'INSECTICIDE', 'FERTILIZER', 'SEED_TREATMENT', 'EQUIPMENT_PPE'];
      const category: ProductCategory = validCategories.find(c => c === rawCategory || rawCategory.includes(c)) || 'HERBICIDE';

      const rawHazard = (parts[3] || 'YELLOW').toUpperCase();
      let hazardBand: HazardBand = 'YELLOW';
      if (rawHazard.includes('RED') || rawHazard.includes('IB') || rawHazard.includes('CLASS 1')) hazardBand = 'RED';
      else if (rawHazard.includes('BLUE') || rawHazard.includes('III')) hazardBand = 'BLUE';
      else if (rawHazard.includes('GREEN') || rawHazard.includes('IV')) hazardBand = 'GREEN';

      let hazardClassText = 'WHO Class II · Moderately Hazardous';
      if (hazardBand === 'RED') hazardClassText = 'WHO Class Ib · Highly Toxic (Restricted)';
      else if (hazardBand === 'BLUE') hazardClassText = 'WHO Class III · Slightly Toxic';
      else if (hazardBand === 'GREEN') hazardClassText = 'Class IV · General Agronomic Use';

      const regNumber = parts[4] || `EPA/AGR/2026-IMP-${100 + idx}`;
      const stock = Math.max(0, parseInt(parts[5]) || 20);
      const costPrice = Math.max(0.1, parseFloat(parts[6]) || 25.0);
      const price = Math.max(costPrice, parseFloat(parts[7]) || (costPrice * 1.35));
      const restockLevel = Math.max(1, parseInt(parts[8]) || 15);
      const reorderQuantity = Math.max(restockLevel, parseInt(parts[9]) || restockLevel * 2);
      const packageSize = parts[10] || '1 Liter';
      const supplierInput = parts[11] || suppliers[0]?.name || 'Wienco Ghana Ltd';

      // Match supplier if possible
      const matchedSupplier = suppliers.find(s => 
        s.name.toLowerCase().includes(supplierInput.toLowerCase()) || 
        supplierInput.toLowerCase().includes(s.name.toLowerCase())
      );

      const batchNumber = parts[12] || `BATCH-2026-IMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const expiryDate = parts[13] || '2028-12-31';
      const storageLocation = parts[14] || 'Warehouse Bay 2';

      const unit = packageSize.toLowerCase().includes('kg') 
        ? 'kg' 
        : packageSize.toLowerCase().includes('ml') 
          ? 'ml' 
          : 'L';

      const isValid = tradeName.length > 1 && costPrice > 0 && price >= costPrice;

      return {
        name: tradeName,
        tradeName,
        activeIngredient,
        category,
        hazardBand,
        hazardClassText,
        regNumber,
        manufacturer: matchedSupplier?.name || 'Authorized Formulator',
        packageSize,
        unit,
        price,
        costPrice,
        stock,
        minStockLevel: restockLevel,
        restockLevel,
        reorderQuantity,
        supplierId: matchedSupplier?.id || suppliers[0]?.id || 'SUP-001',
        supplierName: matchedSupplier?.name || supplierInput,
        supplierContact: matchedSupplier?.phone || '+233 30 222 1234',
        supplierEmail: matchedSupplier?.email || 'orders@agrovault.gh',
        supplierLeadTimeDays: matchedSupplier?.leadTimeDays || 3,
        batchNumber,
        manufacturingDate: '2026-01-15',
        expiryDate,
        storageLocation,
        dosageGuidance: 'Apply 1.5 - 2.5 L/ha with calibrated knapsack sprayer using protective PPE gear.',
        targetCrops: ['Maize', 'Rice', 'Cassava', 'Vegetables', 'Cocoa'],
        preHarvestIntervalDays: 14,
        msdsSummary: 'Keep away from water bodies and domestic food supplies. Store in cool ventilated chemical bay.',
        restrictedPrescription: hazardBand === 'RED',
        image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800',
        isValid,
        validationError: !isValid ? 'Invalid pricing or missing trade name' : undefined
      };
    });

    setParsedItems(items);
    setActiveStep('preview');
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
        parseCsv(text);
      }
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawText(text);
          parseCsv(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // Commit batch upload
  const handleCommitUpload = () => {
    const validOnes = parsedItems.filter(p => p.isValid);
    if (validOnes.length === 0) return;

    const toInsert = validOnes.map(({ isValid, validationError, ...rest }) => rest);
    addProductsBatch(toInsert);
    if (onSuccess) onSuccess();
    onClose();
  };

  const totalValidItems = parsedItems.filter(p => p.isValid).length;
  const totalStockUnits = parsedItems.filter(p => p.isValid).reduce((sum, p) => sum + p.stock, 0);
  const totalWholesaleValue = parsedItems.filter(p => p.isValid).reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Upload className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Bulk Stock Upload & CSV Inventory Importer
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Upload spreadsheets, CSV files, or copy-paste inventory rows to populate or restock warehouse shelves
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Tab */}
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep('input')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeStep === 'input' 
                  ? 'bg-emerald-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>1. Choose CSV File / Paste Rows</span>
            </button>

            <button
              onClick={() => {
                if (rawText.trim()) parseCsv(rawText);
              }}
              disabled={!rawText.trim()}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                activeStep === 'preview' 
                  ? 'bg-emerald-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Review & Verify ({parsedItems.length} SKUs)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-50 rounded-lg cursor-pointer shadow-2xs"
            title="Download CSV spreadsheet template with required columns"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STEP 1: FILE UPLOAD & PASTE AREA
            ───────────────────────────────────────────────────────────── */}
        {activeStep === 'input' && (
          <div className="space-y-4">
            
            {/* Drag & Drop Box */}
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-3 transition-colors cursor-pointer ${
                dragActive 
                  ? 'border-emerald-600 bg-emerald-50/80' 
                  : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file"
                accept=".csv, .txt, .tsv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Click to select CSV file or drag & drop here'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports standard CSV, TSV, or comma-separated exports from Excel / Google Sheets
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg cursor-pointer"
                >
                  Browse Files
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg cursor-pointer"
                >
                  Try Sample CSV Data
                </button>
              </div>
            </div>

            {/* Direct Paste Text Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">
                  Or paste CSV / Tabular Data directly:
                </label>
                <span className="text-slate-400 font-mono text-[11px]">
                  Format: Trade Name, Active Ingredient, Category, Hazard, EPA Reg, Stock, Cost Price, Price...
                </span>
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Trade Name,Active Ingredient,Category,Hazard Band,EPA Reg,Initial Stock,Cost Price GHc,Retail Price GHc...\nExample:\nGlyphosMax 480 SL,Glyphosate 480 g/L,HERBICIDE,YELLOW,EPA/AGR/2026-H11,60,45.00,65.00`}
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Tip: After parsing, you can verify each SKU before committing to the warehouse database.
              </span>
              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={() => parseCsv(rawText)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-850 hover:bg-emerald-950 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Parse & Review SKUs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 2: PREVIEW & VERIFICATION TABLE
            ───────────────────────────────────────────────────────────── */}
        {activeStep === 'preview' && (
          <div className="space-y-4">
            
            {/* Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
              <div>
                <span className="text-slate-500 block">Valid SKUs to Create</span>
                <strong className="text-base font-bold text-emerald-950">{totalValidItems} Products</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Total Inflow Quantity</span>
                <strong className="text-base font-bold text-slate-900">{totalStockUnits} Units / Containers</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Wholesale Ledger Valuation</span>
                <strong className="text-base font-bold text-emerald-800 font-mono-tabular">{formatGHS(totalWholesaleValue)}</strong>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Trade Name & Ingredient</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2">Hazard</th>
                    <th className="py-2.5 px-2 text-right">In-Stock</th>
                    <th className="py-2.5 px-2 text-right">Cost Price</th>
                    <th className="py-2.5 px-2 text-right">Selling Price</th>
                    <th className="py-2.5 px-3">EPA Reg & Batch</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className={item.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/60'}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.tradeName}</div>
                        <div className="text-[11px] text-slate-500">{item.activeIngredient}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-mono text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                          item.hazardBand === 'RED' ? 'bg-red-600' :
                          item.hazardBand === 'YELLOW' ? 'bg-amber-500' :
                          item.hazardBand === 'BLUE' ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}>
                          {item.hazardBand}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {item.stock} {item.unit}s
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                        {formatGHS(item.costPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-emerald-900">
                        {formatGHS(item.price)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        <div>{item.regNumber}</div>
                        <div className="text-[10px] text-slate-400">{item.batchNumber}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-medium" title={item.validationError}>
                            <AlertTriangle className="w-3.5 h-3.5" /> Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commit Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep('input')}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ← Back to Edit Data
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={totalValidItems === 0}
                  onClick={handleCommitUpload}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-850 hover:bg-emerald-950 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Commit {totalValidItems} SKUs to Inventory</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
