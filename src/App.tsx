import React from 'react';
import { AgroStoreProvider, useAgroStore } from './context/AgroStoreContext';
import { Navbar } from './components/Navbar';
import { PosAndStorefront } from './components/PosAndStorefront';
import { InventoryManager } from './components/InventoryManager';
import { BookkeepingDashboard } from './components/BookkeepingDashboard';
import { OrderTracker } from './components/OrderTracker';
import { DosageCalculator } from './components/DosageCalculator';
import { SupplierManagement } from './components/SupplierManagement';
import { CartDrawer } from './components/CartDrawer';
import { PrintableReceipt } from './components/PrintableReceipt';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    selectedOrderForReceipt, 
    setSelectedOrderForReceipt 
  } = useAgroStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'catalog' && <PosAndStorefront />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'suppliers' && <SupplierManagement />}
        {activeTab === 'bookkeeping' && <BookkeepingDashboard />}
        {activeTab === 'orders' && <OrderTracker />}
        {activeTab === 'calculator' && <DosageCalculator />}
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Printable Receipt Modal */}
      {selectedOrderForReceipt && (
        <PrintableReceipt
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">AgroVault Agrochemical Retail Systems</span>
            <span aria-hidden="true">·</span>
            <span>EPA License #EPA/RETAIL/2026-GH-901</span>
          </div>

          <div className="flex items-center gap-4">
            <span>WHO Toxicity Standards Compliant</span>
            <span aria-hidden="true">·</span>
            <span>Double-Entry Financial Audit Trail</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AgroStoreProvider>
      <MainAppContent />
    </AgroStoreProvider>
  );
}
