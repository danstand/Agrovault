import React, { useEffect, useState } from 'react';
import { AgrochemicalProduct, HazardBand } from '../types/agrochemical';
import { generateProductQrDataUrl } from '../utils/qrCodeGenerator';
import { formatGHS } from '../utils/currency';
import { 
  X, 
  Printer, 
  CheckSquare, 
  Square, 
  Layers, 
  Filter, 
  Search, 
  CheckCircle2,
  QrCode
} from 'lucide-react';

interface BatchQrPrintModalProps {
  products: AgrochemicalProduct[];
  onClose: () => void;
}

export const BatchQrPrintModal: React.FC<BatchQrPrintModalProps> = ({
  products,
  onClose
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => products.map(p => p.id));
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const promises = products.map(async (p) => {
      const url = await generateProductQrDataUrl(p, { width: 280 });
      return { id: p.id, url };
    });

    Promise.all(promises).then(results => {
      if (isMounted) {
        const map: Record<string, string> = {};
        results.forEach(r => {
          map[r.id] = r.url;
        });
        setQrMap(map);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [products]);

  const handlePrint = () => {
    window.print();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectLowStockOnly = () => {
    const low = products.filter(p => p.stock <= (p.restockLevel !== undefined ? p.restockLevel : p.minStockLevel));
    setSelectedIds(low.map(p => p.id));
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.activeIngredient.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  const getHazardBadge = (band: HazardBand) => {
    switch (band) {
      case 'RED': return 'bg-red-600 text-white';
      case 'YELLOW': return 'bg-amber-500 text-white';
      case 'BLUE': return 'bg-blue-600 text-white';
      case 'GREEN': return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Batch Print Agrochemical QR Stickers
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Generate warehouse sticker sheets for thermal barcode printers or standard A4 adhesive paper
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection & Controls Bar (no-print) */}
        <div className="no-print bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-semibold text-slate-700 cursor-pointer"
              >
                {selectedIds.length === products.length ? <CheckSquare className="w-3.5 h-3.5 text-emerald-700" /> : <Square className="w-3.5 h-3.5" />}
                <span>{selectedIds.length === products.length ? 'Deselect All' : 'Select All'} ({products.length})</span>
              </button>

              <button
                type="button"
                onClick={selectLowStockOnly}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-medium text-amber-800 cursor-pointer"
              >
                <span>Select Low Stock Only</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={selectedProducts.length === 0 || loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-850 hover:bg-emerald-950 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Print {selectedProducts.length} Sticker Labels</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-2.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter products list below..."
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="HERBICIDE">Herbicides</option>
              <option value="FUNGICIDE">Fungicides</option>
              <option value="INSECTICIDE">Insecticides</option>
              <option value="FERTILIZER">Fertilizers</option>
              <option value="SEED_TREATMENT">Seed Treatment</option>
              <option value="EQUIPMENT_PPE">Equipment / PPE</option>
            </select>
          </div>

          {/* Quick toggle chips */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pt-1">
            {filteredProducts.map(p => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleItem(p.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? <CheckSquare className="w-3 h-3 text-emerald-700" /> : <Square className="w-3 h-3 text-slate-400" />}
                  <span>{p.tradeName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PRINTABLE STICKER SHEET CONTAINER
            (Has id="printable-qr-batch" for @media print)
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-slate-100/60 p-3 rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Rendering high-resolution QR codes...</p>
            </div>
          ) : selectedProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No products selected. Check items above to preview labels.
            </div>
          ) : (
            <div 
              id="printable-qr-batch"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            >
              {selectedProducts.map((p) => {
                const qrUrl = qrMap[p.id];
                const restockPoint = p.restockLevel !== undefined ? p.restockLevel : p.minStockLevel;

                return (
                  <div
                    key={p.id}
                    className="bg-white border-2 border-slate-900 rounded-lg p-3 shadow-2xs text-slate-900 space-y-2 break-inside-avoid page-break-inside-avoid"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1">
                      <span className="font-serif font-black text-[10px] tracking-tight uppercase">
                        AgroVault GH
                      </span>
                      <span className={`text-[8px] font-bold px-1 rounded ${getHazardBadge(p.hazardBand)}`}>
                        {p.hazardBand}
                      </span>
                    </div>

                    {/* QR Code and Info */}
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-20 shrink-0 bg-white border border-slate-300 rounded p-0.5 flex flex-col items-center justify-center">
                        {qrUrl ? (
                          <img src={qrUrl} alt={p.name} className="w-full aspect-square object-contain" />
                        ) : (
                          <div className="text-[8px] text-slate-400">QR</div>
                        )}
                        <span className="font-mono font-bold text-[8px] mt-0.5">{p.id}</span>
                      </div>

                      <div className="space-y-0.5 text-left text-[10px] min-w-0 flex-1">
                        <h5 className="font-bold text-slate-950 truncate leading-tight">{p.tradeName}</h5>
                        <p className="text-[9px] text-slate-500 truncate">{p.activeIngredient}</p>
                        
                        <div className="font-mono text-[8px] text-slate-600 space-y-0.5 pt-0.5">
                          <div className="truncate">EPA: <strong>{p.regNumber}</strong></div>
                          <div>Batch: <strong>{p.batchNumber}</strong></div>
                          <div>Exp: <strong className="text-rose-700">{p.expiryDate}</strong></div>
                        </div>

                        <div className="font-bold text-slate-900 font-mono text-[10px] pt-0.5">
                          {formatGHS(p.price)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[8px] text-slate-500">
                      <span>Bay: {p.storageLocation.split('·')[0]}</span>
                      <span>Min: {restockPoint} {p.unit}s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
