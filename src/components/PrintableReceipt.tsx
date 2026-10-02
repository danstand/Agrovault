import React from 'react';
import { Order } from '../types/agrochemical';
import { useAgroStore } from '../context/AgroStoreContext';
import { formatGHS } from '../utils/currency';
import { Printer, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PrintableReceiptProps {
  order: Order | null;
  onClose: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto no-print">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Controls Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Official Agrochemical Sales Receipt & Manifest</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="p-8 text-slate-900 bg-white font-sans text-xs space-y-5">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-slate-200 pb-4">
            <h1 className="text-xl font-bold tracking-tight text-emerald-950 font-serif">
              AgroVault Agronomy & Chemical Supplies
            </h1>
            <p className="text-[11px] text-slate-600">
              EPA Licensed Retailer Reg: EPA/RETAIL/2026-GH-901 · TIN: 984-209-11
            </p>
            <p className="text-[11px] text-slate-500">
              Main Regional Depot, Plot 88 Commercial Agro-Zone · Tel: +233 30 200 4892
            </p>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              <div className="text-slate-500">Invoice / Order Ref:</div>
              <div className="font-mono-tabular font-bold text-slate-900">{order.id}</div>
              <div className="text-slate-500 mt-1">Date:</div>
              <div className="font-mono-tabular">{new Date(order.orderDate).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500">Customer Name:</div>
              <div className="font-semibold text-slate-900">{order.customerName}</div>
              <div className="text-slate-500 mt-1">Payment Method:</div>
              <div className="font-medium text-slate-800">
                {order.paymentMethod.replace('_', ' ')} ({order.paymentStatus})
              </div>
              <div className="text-[10px] font-mono-tabular text-slate-400">
                Txn: {order.paymentTransactionId}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Item & Batch No</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Price</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono-tabular">
                        Batch: {item.batchNumber} · Pkg: {item.packageSize}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono-tabular">{item.quantity}</td>
                    <td className="py-2 px-2 text-right font-mono-tabular">{formatGHS(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-mono-tabular font-semibold">{formatGHS(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="space-y-1 text-right text-xs pr-2">
            <div className="text-slate-600">
              Subtotal: <span className="font-mono-tabular font-semibold text-slate-800">{formatGHS(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="text-slate-600">
                Logistics & Transport: <span className="font-mono-tabular">{formatGHS(order.deliveryFee)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="text-emerald-700">
                Discount: <span className="font-mono-tabular">-{formatGHS(order.discountAmount)}</span>
              </div>
            )}
            <div className="text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              Grand Total Paid: <span className="font-mono-tabular text-emerald-950">{formatGHS(order.totalAmount)}</span>
            </div>
          </div>

          {/* Delivery & Dispatch Note */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1">
            <div className="font-semibold text-slate-800">
              Fulfillment: {order.orderType === 'FARM_DELIVERY' ? 'Direct Farm Logistics Delivery' : 'Store Counter Pickup'}
            </div>
            <div className="text-slate-600">Location: {order.customerLocation}</div>
            {order.driverInfo && (
              <div className="text-slate-600">
                Carrier: {order.driverInfo.name} ({order.driverInfo.phone}) · Vehicle: {order.driverInfo.vehiclePlate}
              </div>
            )}
          </div>

          {/* Regulatory Safety Warning Box */}
          <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-lg text-[10px] text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <ShieldAlert className="w-3 h-3 text-amber-700" />
              <span>EPA MANDATORY CHEMICAL SAFETY & DISPOSAL NOTICE</span>
            </div>
            <p className="leading-relaxed">
              Store chemicals strictly in locked cabinets away from human food, drinking water, and children. Triple-rinse empty chemical containers with washings poured directly into spray tank. Never reuse pesticide containers for household water or food storage.
            </p>
          </div>

          {/* Footer Barcode / Validation */}
          <div className="text-center pt-2 border-t border-slate-100 space-y-1">
            <div className="font-mono text-sm tracking-widest text-slate-700">
              *||||| {order.id.replace(/-/g, '')} |||||*
            </div>
            <p className="text-[10px] text-slate-400">
              Thank you for trusting AgroVault. For agronomic advice or emergency spill response call 0800-AGRO-911.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
