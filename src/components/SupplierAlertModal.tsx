import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { AgrochemicalProduct, Supplier } from '../types/agrochemical';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { 
  X, 
  Send, 
  Mail, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Package, 
  Printer, 
  FileText, 
  Truck, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface SupplierAlertModalProps {
  product: AgrochemicalProduct;
  onClose: () => void;
  defaultChannel?: 'WHATSAPP' | 'EMAIL';
}

export const SupplierAlertModal: React.FC<SupplierAlertModalProps> = ({
  product,
  onClose,
  defaultChannel = 'WHATSAPP'
}) => {
  const { 
    suppliers, 
    dispatchSupplierAlert, 
    receiveSupplierRestock, 
    restockPurchaseOrders 
  } = useAgroStore();

  const restockThreshold = product.restockLevel !== undefined ? product.restockLevel : product.minStockLevel;
  const defaultReorder = product.reorderQuantity || Math.max(15, Math.ceil(restockThreshold * 2));
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    product.supplierId || suppliers[0]?.id || 'SUP-001'
  );
  const [orderQuantity, setOrderQuantity] = useState<number>(defaultReorder);
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'EMAIL' | 'PHONE'>(defaultChannel);
  const [specialNotes, setSpecialNotes] = useState<string>(
    `Urgent seasonal restock for AgroVault retail store. Please confirm stock availability.`
  );
  const [dispatchedInfo, setDispatchedInfo] = useState<{
    poNumber: string;
    whatsappUrl?: string;
    mailtoUrl?: string;
    alertMessage: string;
  } | null>(null);
  
  const [isReceiveMode, setIsReceiveMode] = useState<boolean>(false);
  const [receiveQty, setReceiveQty] = useState<number>(defaultReorder);
  const [invoiceRef, setInvoiceRef] = useState<string>(`INV-${Date.now().toString().slice(-5)}`);
  const [showPrintPO, setShowPrintPO] = useState<boolean>(false);

  const activeSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  const totalCost = orderQuantity * product.costPrice;
  const isCritical = product.stock === 0 || product.stock <= Math.max(1, Math.floor(restockThreshold * 0.3));

  // Check if an existing PO is open
  const existingPO = restockPurchaseOrders.find(
    po => po.productId === product.id && po.status !== 'RESTOCKED_RECEIVED' && po.status !== 'CANCELLED'
  );

  const handleSendAlert = () => {
    try {
      const result = dispatchSupplierAlert({
        productId: product.id,
        channel: selectedChannel,
        quantity: orderQuantity,
        notes: specialNotes
      });

      setDispatchedInfo(result);

      if (selectedChannel === 'WHATSAPP' && result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
      } else if (selectedChannel === 'EMAIL' && result.mailtoUrl) {
        window.location.href = result.mailtoUrl;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceiveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiveQty <= 0) return;

    receiveSupplierRestock({
      productId: product.id,
      quantityReceived: receiveQty,
      poNumber: existingPO?.poNumber || dispatchedInfo?.poNumber,
      invoiceReference: invoiceRef
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isCritical 
                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {isCritical ? 'CRITICAL STOCKOUT RISK' : 'RESTOCK THRESHOLD TRIGGERED'}
              </span>
              <span className="text-xs text-slate-500 font-mono-tabular">EPA Reg: {product.regNumber}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
            <p className="text-xs text-slate-500">{product.activeIngredient} · Pack: {product.packageSize}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stock Level Diagnostic Card */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 block">Current In-Stock</span>
            <span className={`text-xl font-bold font-mono-tabular ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
              {product.stock} {product.unit}s
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Restock Level Threshold</span>
            <span className="text-xl font-bold font-mono-tabular text-slate-800">
              {restockThreshold} {product.unit}s
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Deficit Below Target</span>
            <span className="text-xl font-bold font-mono-tabular text-slate-700">
              {Math.max(0, restockThreshold - product.stock)} {product.unit}s
            </span>
          </div>
        </div>

        {/* Existing Active PO alert banner */}
        {existingPO && !dispatchedInfo && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold text-blue-900">Active Restock Order: {existingPO.poNumber}</span>
                <p className="text-blue-700 text-[11px]">
                  Ordered {existingPO.quantityOrdered} units via {existingPO.channelUsed}. Expected delivery: <strong>{existingPO.expectedDeliveryDate}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsReceiveMode(true);
                setReceiveQty(existingPO.quantityOrdered);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shrink-0 cursor-pointer shadow-xs"
            >
              Receive Delivery
            </button>
          </div>
        )}

        {/* Dispatched Confirmation Screen */}
        {dispatchedInfo ? (
          <div className="space-y-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Restock Purchase Order Generated: {dispatchedInfo.poNumber}
            </div>
            <p className="text-slate-600">
              The restock alert notification has been generated for <strong>{activeSupplier?.name}</strong>.
            </p>

            <div className="p-3 bg-white rounded-lg border border-emerald-100 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {dispatchedInfo.alertMessage}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {dispatchedInfo.whatsappUrl && (
                <a
                  href={dispatchedInfo.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Open WhatsApp Chat
                </a>
              )}
              {dispatchedInfo.mailtoUrl && (
                <a
                  href={dispatchedInfo.mailtoUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Open Email Client
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsReceiveMode(true);
                  setReceiveQty(orderQuantity);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg shadow-xs cursor-pointer ml-auto"
              >
                <Truck className="w-3.5 h-3.5" />
                Receive Physical Shipment
              </button>
            </div>
          </div>
        ) : isReceiveMode ? (
          /* Receive Stock Form */
          <form onSubmit={handleReceiveStock} className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>Receive Supplier Agrochemical Consignment</span>
              </div>
              <p className="text-slate-600">
                Receiving stock updates warehouse count, marks the restock alert as fulfilled, and enters an inventory purchase debit in Ghana Cedis ({CURRENCY_SYMBOL}).
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Quantity Received ({product.unit}s)</label>
                  <input
                    type="number"
                    min="1"
                    value={receiveQty}
                    onChange={(e) => setReceiveQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-tabular font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Supplier Waybill / Invoice Ref</label>
                  <input
                    type="text"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    placeholder="e.g. WB-2026-9021"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-tabular"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-slate-700">
                <span>Total Bookkeeping Expense:</span>
                <span className="font-mono-tabular font-bold text-emerald-800 text-sm">
                  {formatGHS(receiveQty * product.costPrice)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReceiveMode(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Back to Alert Dispatch
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Confirm & Add to Inventory
              </button>
            </div>
          </form>
        ) : (
          /* Dispatch Alert Form */
          <div className="space-y-4 text-xs">
            
            {/* Supplier Picker */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-semibold">Registered Agro Chemical Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.city}, {s.region} (Lead time: ~{s.leadTimeDays} days)
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Details Card */}
            {activeSupplier && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-600">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeSupplier.name}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-700">
                    Lead time: {activeSupplier.leadTimeDays} days
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Contact: <strong>{activeSupplier.contactPerson}</strong></div>
                  <div>Phone / WhatsApp: <strong className="font-mono-tabular">{activeSupplier.phone}</strong></div>
                  <div>Email: <strong className="font-mono-tabular">{activeSupplier.email}</strong></div>
                  <div>Payment Terms: <strong>{activeSupplier.paymentTerms}</strong></div>
                </div>
              </div>
            )}

            {/* Order Quantity & Cost Calculations */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Reorder Pack Qty ({product.unit}s)
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-tabular font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Wholesale Unit Cost
                </label>
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono-tabular font-semibold text-slate-700">
                  {formatGHS(product.costPrice)}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-700 font-medium mb-1">
                  Total Order Value ({CURRENCY_SYMBOL})
                </label>
                <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg font-mono-tabular font-bold text-emerald-900">
                  {formatGHS(totalCost)}
                </div>
              </div>
            </div>

            {/* Notification Channel Picker */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-semibold">Immediate Supplier Alert Channel</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel('WHATSAPP')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    selectedChannel === 'WHATSAPP'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-600/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp Message</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('EMAIL')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    selectedChannel === 'EMAIL'
                      ? 'bg-blue-700 text-white border-blue-700 shadow-xs ring-2 ring-blue-600/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email PO PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('PHONE')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    selectedChannel === 'PHONE'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Call Order</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Special Delivery Instructions / Agronomic Notes
              </label>
              <input
                type="text"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g. Please supply latest manufacturing batch with 2+ years shelf life"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Dismiss
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsReceiveMode(true);
                  setReceiveQty(orderQuantity);
                }}
                className="py-2.5 px-3 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
              >
                Already Arrived? Receive Stock
              </button>

              <button
                type="button"
                onClick={handleSendAlert}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Supplier Restock Alert Now</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
