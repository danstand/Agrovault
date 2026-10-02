import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { formatGHS } from '../utils/currency';
import { 
  Calculator, 
  FlaskConical, 
  ShieldAlert, 
  Droplet, 
  Layers, 
  Clock, 
  ShoppingBag, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface PestFormula {
  id: string;
  crop: string;
  problem: string;
  targetCategory: string;
  productId: string;
  ratePerAcre: number;
  rateUnit: string;
  waterPerAcreLitres: number;
  phiDays: number;
  safetyTip: string;
}

const FORMULAS: PestFormula[] = [
  {
    id: 'f1',
    crop: 'Maize',
    problem: 'Fall Armyworm (Spodoptera frugiperda)',
    targetCategory: 'INSECTICIDE',
    productId: 'PROD-004', // Belt Expert
    ratePerAcre: 0.1, // 100ml per acre
    rateUnit: 'Liters',
    waterPerAcreLitres: 160,
    phiDays: 5,
    safetyTip: 'Spray late afternoon when armyworm larvae emerge from whorls. Wear safety goggles.'
  },
  {
    id: 'f2',
    crop: 'Maize',
    problem: 'Pre-plant Total Weed Control',
    targetCategory: 'HERBICIDE',
    productId: 'PROD-001', // GlyphoMax
    ratePerAcre: 1.5, // 1.5L per acre
    rateUnit: 'Liters',
    waterPerAcreLitres: 160,
    phiDays: 14,
    safetyTip: 'Apply on actively growing weeds prior to tillage or seeding. Do not spray during windy conditions.'
  },
  {
    id: 'f3',
    crop: 'Tomato',
    problem: 'Late Blight & Downy Mildew',
    targetCategory: 'FUNGICIDE',
    productId: 'PROD-002', // Ridomil Gold
    ratePerAcre: 1.0, // 1kg per acre
    rateUnit: 'kg',
    waterPerAcreLitres: 200,
    phiDays: 7,
    safetyTip: 'Ensure uniform spray coverage under leaves. Repeat every 10 days during rainy conditions.'
  },
  {
    id: 'f4',
    crop: 'Maize',
    problem: 'Basal Soil Nutrition (Planting Flush)',
    targetCategory: 'FERTILIZER',
    productId: 'PROD-003', // YaraMila Complex
    ratePerAcre: 100, // 2 bags = 100kg
    rateUnit: 'kg',
    waterPerAcreLitres: 0,
    phiDays: 0,
    safetyTip: 'Place 5cm away from seed row and incorporate slightly into moist soil.'
  },
  {
    id: 'f5',
    crop: 'Legumes / Soybean',
    problem: 'Seedling Damping-Off & Seed Protection',
    targetCategory: 'SEED_TREATMENT',
    productId: 'PROD-007', // Apron Star
    ratePerAcre: 5, // 5 sachets per acre seed rate
    rateUnit: 'sachets',
    waterPerAcreLitres: 1,
    phiDays: 0,
    safetyTip: 'Coat seeds evenly in container prior to planting. Do not use treated seeds for animal or human food.'
  }
];

export const DosageCalculator: React.FC = () => {
  const { products, addToCart, setIsCartOpen } = useAgroStore();

  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('f1');
  const [areaSize, setAreaSize] = useState<number>(3);
  const [areaUnit, setAreaUnit] = useState<'ACRES' | 'HECTARES'>('ACRES');
  const [knapsackCapacity, setKnapsackCapacity] = useState<number>(16);
  const [addedNotice, setAddedNotice] = useState(false);

  const selectedFormula = FORMULAS.find(f => f.id === selectedFormulaId) || FORMULAS[0];
  const matchedProduct = products.find(p => p.id === selectedFormula.productId);

  // Conversion: 1 Hectare = 2.471 Acres
  const effectiveAcres = areaUnit === 'HECTARES' ? areaSize * 2.471 : areaSize;

  // Total required
  const totalChemicalNeeded = effectiveAcres * selectedFormula.ratePerAcre;
  const totalWaterLitres = effectiveAcres * selectedFormula.waterPerAcreLitres;
  
  // Knapsacks
  const totalKnapsacks = totalWaterLitres > 0 
    ? Math.ceil(totalWaterLitres / knapsackCapacity) 
    : 0;

  const chemicalPerKnapsack = totalKnapsacks > 0 
    ? (totalChemicalNeeded / totalKnapsacks) 
    : 0;

  // Calculate items to purchase
  let unitsToBuy = 1;
  if (matchedProduct) {
    if (selectedFormula.rateUnit === 'Liters') {
      unitsToBuy = Math.ceil(totalChemicalNeeded / (matchedProduct.packageSize.includes('5') ? 5 : 1));
    } else if (selectedFormula.rateUnit === 'kg') {
      unitsToBuy = Math.ceil(totalChemicalNeeded / (matchedProduct.packageSize.includes('50') ? 50 : 1));
    } else {
      unitsToBuy = Math.ceil(totalChemicalNeeded);
    }
  }

  const handleAddCalculatedToCart = () => {
    if (!matchedProduct) return;
    addToCart(matchedProduct, Math.max(1, unitsToBuy));
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-800">
          <Calculator className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-900">Agrochemical Field Dosage & Knapsack Sprayer Calibrator</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Calculate calibrated chemical rates, total water volume, sprayer tank refills, and safe Pre-Harvest Intervals (PHI) based on crop and field acreage.
        </p>
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Inputs */}
        <div className="md:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <span className="font-semibold text-slate-800 block text-sm">Target Agronomy Parameters</span>

          {/* Scenario Selector */}
          <div>
            <label className="text-slate-600 font-medium block mb-1.5">Crop & Problem Target</label>
            <select
              value={selectedFormulaId}
              onChange={(e) => setSelectedFormulaId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              {FORMULAS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.crop}: {f.problem}
                </option>
              ))}
            </select>
          </div>

          {/* Land Area */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-medium block">Land Surface Area</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={areaSize}
                onChange={(e) => setAreaSize(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular font-bold"
              />
              <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setAreaUnit('ACRES')}
                  className={`px-3 py-2 font-medium cursor-pointer ${
                    areaUnit === 'ACRES' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Acres
                </button>
                <button
                  type="button"
                  onClick={() => setAreaUnit('HECTARES')}
                  className={`px-3 py-2 font-medium cursor-pointer ${
                    areaUnit === 'HECTARES' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Hectares
                </button>
              </div>
            </div>
            {areaUnit === 'HECTARES' && (
              <span className="text-[11px] text-slate-400 font-mono-tabular">
                = {effectiveAcres.toFixed(2)} Acres
              </span>
            )}
          </div>

          {/* Knapsack Sprayer Capacity */}
          {selectedFormula.waterPerAcreLitres > 0 && (
            <div>
              <label className="text-slate-600 font-medium block mb-1.5">Knapsack Sprayer Tank Capacity</label>
              <div className="grid grid-cols-2 gap-2">
                {[16, 20].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setKnapsackCapacity(cap)}
                    className={`py-2 px-3 border rounded-lg font-medium cursor-pointer ${
                      knapsackCapacity === cap 
                        ? 'border-emerald-850 bg-emerald-50 text-emerald-950 font-bold' 
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {cap} Liters Tank
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Safety Tip Box */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 space-y-1">
            <div className="font-semibold flex items-center gap-1 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Agronomist Safety Direction</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700">{selectedFormula.safetyTip}</p>
          </div>
        </div>

        {/* Right Output Results */}
        <div className="md:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Calibration Output</span>
            <h3 className="text-lg font-bold text-slate-900">{selectedFormula.crop} Protection Plan</h3>
            <p className="text-xs text-emerald-800 font-medium">Target: {selectedFormula.problem}</p>
          </div>

          {/* Metric Outputs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
              <span className="text-[11px] text-slate-500 font-medium">Chemical Required</span>
              <div className="text-xl font-bold font-mono-tabular text-slate-900">
                {totalChemicalNeeded.toFixed(2)} {selectedFormula.rateUnit}
              </div>
              <span className="text-[10px] text-slate-400">@ {selectedFormula.ratePerAcre} / acre</span>
            </div>

            {selectedFormula.waterPerAcreLitres > 0 ? (
              <>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                  <span className="text-[11px] text-slate-500 font-medium">Spray Water Volume</span>
                  <div className="text-xl font-bold font-mono-tabular text-slate-900">
                    {totalWaterLitres.toFixed(0)} Liters
                  </div>
                  <span className="text-[10px] text-slate-400">Clean carrier water</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                  <span className="text-[11px] text-slate-500 font-medium">Sprayer Tank Refills</span>
                  <div className="text-xl font-bold font-mono-tabular text-emerald-850">
                    {totalKnapsacks} Tanks
                  </div>
                  <span className="text-[10px] text-slate-400">({knapsackCapacity}L each)</span>
                </div>
              </>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                <span className="text-[11px] text-slate-500 font-medium">Application Method</span>
                <div className="text-base font-bold text-slate-900">Dry Banding</div>
                <span className="text-[10px] text-slate-400">Basal placement</span>
              </div>
            )}
          </div>

          {/* Knapsack Mixture Recipe */}
          {selectedFormula.waterPerAcreLitres > 0 && (
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-2">
              <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-emerald-700" />
                <span>Sprayer Tank Calibration Recipe</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Add <strong className="font-mono-tabular text-emerald-950">{(chemicalPerKnapsack * (selectedFormula.rateUnit === 'Liters' ? 1000 : 1000)).toFixed(0)} {selectedFormula.rateUnit === 'Liters' ? 'ml' : 'grams'}</strong> of formulation to each <strong>{knapsackCapacity}L</strong> knapsack sprayer tank filled with half water, agitate thoroughly, then top up to full mark.
              </p>
              <div className="flex items-center gap-1 text-slate-500 text-[11px] pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Pre-Harvest Interval (PHI): <strong>{selectedFormula.phiDays} days</strong> minimum before harvest.</span>
              </div>
            </div>
          )}

          {/* Recommended Inventory SKU Link */}
          {matchedProduct && (
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Available Registered Product in Store</span>
                <span className="text-xs font-mono-tabular text-slate-500">{matchedProduct.stock} units in stock</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{matchedProduct.tradeName}</h4>
                  <p className="text-xs text-slate-500">{matchedProduct.packageSize} · {formatGHS(matchedProduct.price)}</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Suggested Purchase:</div>
                  <div className="text-sm font-bold font-mono-tabular text-emerald-950">
                    {unitsToBuy} package{unitsToBuy > 1 ? 's' : ''} ({formatGHS(unitsToBuy * matchedProduct.price)})
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                {addedNotice ? (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Added to Sale Cart!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Click to load into cart:</span>
                )}

                <button
                  type="button"
                  onClick={handleAddCalculatedToCart}
                  disabled={matchedProduct.stock < unitsToBuy}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add {unitsToBuy} Unit{unitsToBuy > 1 ? 's' : ''} to Cart</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
