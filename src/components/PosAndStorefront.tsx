import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { AgrochemicalProduct, ProductCategory, HazardBand } from '../types/agrochemical';
import { heroImg } from '../data/mockData';
import { ProductDetailModal } from './ProductDetailModal';
import { formatGHS } from '../utils/currency';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  ScanBarcode, 
  LayoutGrid, 
  ListOrdered,
  ArrowRight,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

export const PosAndStorefront: React.FC = () => {
  const { 
    products, 
    addToCart, 
    cart, 
    currentRole, 
    setIsCartOpen,
    setActiveTab 
  } = useAgroStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedHazard, setSelectedHazard] = useState<string>('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'catalog' | 'pos_quick'>('catalog');
  const [detailProduct, setDetailProduct] = useState<AgrochemicalProduct | null>(null);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Products' },
    { id: 'HERBICIDE', label: 'Herbicides' },
    { id: 'FUNGICIDE', label: 'Fungicides' },
    { id: 'INSECTICIDE', label: 'Insecticides' },
    { id: 'FERTILIZER', label: 'Fertilizers' },
    { id: 'SEED_TREATMENT', label: 'Seed Treatment' },
    { id: 'EQUIPMENT_PPE', label: 'Equipment & PPE' },
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesHazard = selectedHazard === 'ALL' || product.hazardBand === selectedHazard;
    const matchesStock = !inStockOnly || product.stock > 0;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      product.name.toLowerCase().includes(query) ||
      product.activeIngredient.toLowerCase().includes(query) ||
      product.tradeName.toLowerCase().includes(query) ||
      product.regNumber.toLowerCase().includes(query) ||
      product.batchNumber.toLowerCase().includes(query);

    return matchesCategory && matchesHazard && matchesStock && matchesSearch;
  });

  const getHazardLineColor = (band: HazardBand) => {
    switch (band) {
      case 'RED': return 'bg-red-600';
      case 'YELLOW': return 'bg-amber-500';
      case 'BLUE': return 'bg-blue-600';
      case 'GREEN': return 'bg-emerald-600';
    }
  };

  const getHazardText = (band: HazardBand) => {
    switch (band) {
      case 'RED': return 'WHO Class Ib · Highly Toxic';
      case 'YELLOW': return 'WHO Class II · Moderately Toxic';
      case 'BLUE': return 'WHO Class III · Slightly Toxic';
      case 'GREEN': return 'Class IV · General Use';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Editorial Storefront Hero Banner */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 text-white shadow-xs">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Agrochemical Store Interior"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-slate-950/85 to-transparent" />
        </div>

        <div className="relative max-w-4xl px-6 py-10 sm:px-10 sm:py-14 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <span>Official Agronomy Distribution Hub</span>
            <span aria-hidden="true">·</span>
            <span>EPA Certified & Batch Tracked</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white max-w-2xl leading-tight">
            Certified Crop Protection, Soil Nutrition & Precision Chemical Supplies.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Full batch traceability, strict toxicity hazard compliance, and calibrated field dosage support for commercial farmers and retail co-ops.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('calculator')}
              className="px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Field Dosage Calculator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className="px-4 py-2 text-xs font-medium text-slate-200 border border-slate-600 hover:border-slate-400 rounded-lg transition-colors cursor-pointer"
            >
              Track Ongoing Orders
            </button>
          </div>
        </div>
      </section>

      {/* Control Bar: Categories, Search, Filters, View Modes */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, active ingredient, EPA reg no, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right Tools: View Mode Toggle & Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Toxicity filter */}
            <select
              value={selectedHazard}
              onChange={(e) => setSelectedHazard(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
              title="Filter by WHO Toxicity Hazard Band"
            >
              <option value="ALL">All Hazard Classes</option>
              <option value="RED">Red Band (Highly Toxic)</option>
              <option value="YELLOW">Yellow Band (Moderate)</option>
              <option value="BLUE">Blue Band (Caution)</option>
              <option value="GREEN">Green Band (General)</option>
            </select>

            {/* In stock toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 px-2 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-emerald-800 focus:ring-0"
              />
              <span>In Stock</span>
            </label>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode('catalog')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'catalog' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Catalog Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('pos_quick')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'pos_quick' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Fast POS Counter View"
              >
                <ScanBarcode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-850 text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No Agrochemicals Matching Filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, clearing hazard band filters, or checking out-of-stock items.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedHazard('ALL');
              setInStockOnly(false);
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'catalog' ? (
        /* Catalog Grid View (3-column desktop layout adhering to reference 1) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const inCart = cart.find(item => item.product.id === product.id);
            const isLowStock = product.stock <= product.minStockLevel && product.stock > 0;
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className="group relative bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Hazard Color Band Indicator Line at Top */}
                <div className={`h-1.5 w-full ${getHazardLineColor(product.hazardBand)}`} />

                {/* Product Image Slot */}
                <div 
                  onClick={() => setDetailProduct(product)}
                  className="relative h-48 bg-slate-50 overflow-hidden cursor-pointer flex items-center justify-center p-3"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain group-hover:scale-103 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {product.restrictedPrescription && (
                    <div className="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      RESTRICTED
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Unboxed Metadata Line with Separator */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <span>{product.category.replace('_', ' ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{getHazardText(product.hazardBand)}</span>
                    </div>

                    {/* Product Title */}
                    <h3 
                      onClick={() => setDetailProduct(product)}
                      className="text-sm font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {product.name}
                    </h3>

                    {/* Active Ingredient */}
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {product.activeIngredient}
                    </p>

                    {/* Package and Stock status */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Pkg: <strong className="text-slate-700">{product.packageSize}</strong></span>
                      <span className="font-mono-tabular">
                        {isOutOfStock ? (
                          <span className="text-red-600 font-semibold">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="text-amber-600 font-medium">Only {product.stock} left</span>
                        ) : (
                          <span className="text-slate-600">{product.stock} in stock</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold font-mono-tabular text-slate-900">
                        {formatGHS(product.price)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Reg: {product.regNumber}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDetailProduct(product)}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="View safety and dosage details"
                      >
                        Specs
                      </button>

                      <button
                        onClick={() => addToCart(product, 1)}
                        disabled={isOutOfStock}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCart ? `Add (${inCart.quantity})` : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Fast POS Counter View (High efficiency counter register table) */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Quick-Sale Cashier Terminal</span>
            <span>Click "+" to instantly stage items into customer sale cart</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Chemical & Active Ingredient</th>
                  <th className="py-2.5 px-3">Hazard Class</th>
                  <th className="py-2.5 px-3">Packaging</th>
                  <th className="py-2.5 px-3">Batch Code</th>
                  <th className="py-2.5 px-3 text-right">Available Stock</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const cartItem = cart.find(ci => ci.product.id === p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{p.tradeName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{p.activeIngredient}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${getHazardLineColor(p.hazardBand)}`} />
                          <span className="text-[11px] text-slate-700">{p.hazardBand}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{p.packageSize}</td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-500">{p.batchNumber}</td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular">
                        <span className={p.stock <= p.minStockLevel ? 'text-amber-600 font-semibold' : 'text-slate-800'}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular font-bold text-slate-900">
                        {formatGHS(p.price)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => addToCart(p, 1)}
                            disabled={p.stock <= 0}
                            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-200 text-white rounded font-medium text-xs transition-colors cursor-pointer"
                          >
                            + Add {cartItem ? `(${cartItem.quantity})` : ''}
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
      )}

      {/* Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  );
};
