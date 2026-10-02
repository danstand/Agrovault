import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { 
  ShoppingBag, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronDown,
  Check,
  Lock,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    cartCount, 
    setIsCartOpen, 
    currentRole, 
    setRole,
    isAdmin,
    totalActiveAlertsCount,
    criticalAlertsCount
  } = useAgroStore();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const navItems: Array<{ id: 'catalog' | 'inventory' | 'suppliers' | 'bookkeeping' | 'orders' | 'calculator'; label: string; badge?: number }> = [
    { id: 'catalog', label: 'Shop & POS' },
    { id: 'inventory', label: 'Inventory', badge: totalActiveAlertsCount },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'bookkeeping', label: 'Bookkeeping' },
    { id: 'orders', label: 'Order Tracker' },
    { id: 'calculator', label: 'Dosage Calculator' },
  ];

  const roleLabels = {
    ADMIN: { label: 'Administrator', desc: 'Full Access (Add, Edit, Delete, Upload Stock)', icon: ShieldAlert, color: 'text-amber-700 bg-amber-50 border-amber-300' },
    STOREKEEPER: { label: 'Storekeeper', desc: 'Warehouse inventory, POS & QR scanner', icon: ShieldCheck, color: 'text-emerald-800 bg-emerald-50 border-emerald-300' },
    FARMER: { label: 'Farmer Portal', desc: 'Storefront catalog, calculator & orders', icon: UserCheck, color: 'text-blue-800 bg-blue-50 border-blue-300' }
  };

  const currentRoleInfo = roleLabels[currentRole] || roleLabels.ADMIN;
  const RoleIcon = currentRoleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark */}
        <button 
          onClick={() => setActiveTab('catalog')} 
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-xl font-bold tracking-tight text-emerald-950 font-serif">
            Agro<span className="text-emerald-600">Vault</span>
          </span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer rounded-md flex items-center gap-1.5 ${
                  isActive 
                    ? 'text-emerald-900 bg-emerald-50 font-semibold' 
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full font-mono-tabular text-[10px] font-bold ${
                    criticalAlertsCount > 0 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-amber-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary actions (Restock alert quick link + Role switch + Cart drawer trigger) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Restock Alert Trigger */}
          {totalActiveAlertsCount > 0 && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-xs ${
                criticalAlertsCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 ring-1 ring-rose-400/20'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
              title={`${totalActiveAlertsCount} products at or below restock level. Click to alert suppliers.`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Restock Alert</span>
              <span className="font-mono-tabular font-bold">({totalActiveAlertsCount})</span>
            </button>
          )}

          {/* Role Access Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap cursor-pointer shadow-2xs ${currentRoleInfo.color}`}
              title="Click to switch access role: Administrator, Storekeeper, or Farmer"
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentRoleInfo.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isRoleDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsRoleDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1.5 space-y-1 animate-fade-in text-xs">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100">
                    Switch Access Role
                  </div>

                  {/* Admin Option */}
                  <button
                    onClick={() => {
                      setRole('ADMIN');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentRole === 'ADMIN' ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="p-1 bg-amber-100 text-amber-800 rounded-md mt-0.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>Administrator</span>
                        {currentRole === 'ADMIN' && <Check className="w-3.5 h-3.5 text-amber-700" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Add, edit, delete agrochemicals & bulk stock upload
                      </p>
                    </div>
                  </button>

                  {/* Storekeeper Option */}
                  <button
                    onClick={() => {
                      setRole('STOREKEEPER');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentRole === 'STOREKEEPER' ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="p-1 bg-emerald-100 text-emerald-800 rounded-md mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>Storekeeper</span>
                        {currentRole === 'STOREKEEPER' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Warehouse stock ledger, QR scanner, supplier alerts
                      </p>
                    </div>
                  </button>

                  {/* Farmer Option */}
                  <button
                    onClick={() => {
                      setRole('FARMER');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentRole === 'FARMER' ? 'bg-blue-50 text-blue-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="p-1 bg-blue-100 text-blue-800 rounded-md mt-0.5">
                      <UserCheck className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>Farmer Portal</span>
                        {currentRole === 'FARMER' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Customer view, chemical dosing calculator, orders
                      </p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            aria-label="View shopping cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Sale Cart</span>
            {cartCount > 0 && (
              <span className="bg-emerald-500 text-emerald-950 font-mono-tabular font-bold text-[11px] px-1.5 py-0.2 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-100 gap-1 bg-white">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap flex items-center gap-1 ${
              activeTab === item.id 
                ? 'bg-emerald-50 text-emerald-900 font-semibold' 
                : 'text-slate-600'
            }`}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-mono-tabular text-[9px] font-bold bg-amber-500 text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
