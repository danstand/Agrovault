import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { Order, OrderStatus } from '../types/agrochemical';
import { formatGHS } from '../utils/currency';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Truck, 
  PackageCheck, 
  MapPin, 
  User, 
  Phone, 
  Printer, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const ORDER_STAGES: Array<{ id: OrderStatus; label: string; desc: string }> = [
  { id: 'ORDER_PLACED', label: 'Order Placed', desc: 'Order logged with staged chemical formulations' },
  { id: 'PAYMENT_VERIFIED', label: 'Payment Verified', desc: 'Financial transaction token confirmed' },
  { id: 'PACKED_SAFETY_CHECK', label: 'Safety Pack & QA', desc: 'Containers sealed, batch verified, hazard labeled' },
  { id: 'DISPATCHED', label: 'In Transit / Dispatched', desc: 'Out on rural farm delivery run or staged at Pickup Bay' },
  { id: 'DELIVERED', label: 'Delivered & Handed Over', desc: 'Proof of receipt certified by farmer' }
];

export const OrderTracker: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    setSelectedOrderForReceipt, 
    currentRole 
  } = useAgroStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Driver Assignment inputs
  const [driverName, setDriverName] = useState('Emmanuel Darko');
  const [driverPhone, setDriverPhone] = useState('+233 24 883 1199');
  const [vehiclePlate, setVehiclePlate] = useState('AS-4819-24 (Toyota Hilux)');
  const [statusNote, setStatusNote] = useState('');

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const filteredOrders = orders.filter(o => {
    const matchesFilter = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      o.id.toLowerCase().includes(q) || 
      o.customerName.toLowerCase().includes(q) || 
      o.customerPhone.includes(q) ||
      o.customerLocation.toLowerCase().includes(q);

    return matchesFilter && matchesQuery;
  });

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'ORDER_PLACED': return 0;
      case 'PAYMENT_VERIFIED': return 1;
      case 'PACKED_SAFETY_CHECK': return 2;
      case 'DISPATCHED': return 3;
      case 'DELIVERED': return 4;
      default: return 0;
    }
  };

  const handleAdvanceStatus = (nextStatus: OrderStatus) => {
    if (!selectedOrder) return;
    updateOrderStatus(
      selectedOrder.id,
      nextStatus,
      statusNote || `Advanced to ${nextStatus.replace('_', ' ')}`,
      nextStatus === 'DISPATCHED' ? { name: driverName, phone: driverPhone, vehiclePlate } : undefined
    );
    setStatusNote('');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Agrochemical Dispatch & Delivery Tracking</h2>
            <p className="text-xs text-slate-500">Live safety audit, rural farm transit tracking, and proof of chemical delivery</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Order Ref (e.g. AGV-2026-9841) or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Quick Filter */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-500 font-medium">Filter:</span>
          {['ALL', 'ORDER_PLACED', 'PAYMENT_VERIFIED', 'PACKED_SAFETY_CHECK', 'DISPATCHED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Orders List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>Orders Matching ({filteredOrders.length})</span>
            <span>Select to inspect</span>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                No orders match your criteria.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const stageIdx = getStageIndex(ord.orderStatus);

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'border-emerald-850 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-850/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular font-bold text-slate-900">{ord.id}</span>
                      <span className="font-mono-tabular font-bold text-slate-900">{formatGHS(ord.totalAmount)}</span>
                    </div>

                    <div className="text-slate-700 font-medium truncate">
                      {ord.customerName}
                    </div>

                    {/* Unboxed Metadata */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>{ord.orderType === 'FARM_DELIVERY' ? 'Farm Logistics' : 'Counter Pickup'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-emerald-900">
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono-tabular">
                      {new Date(ord.orderDate).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Tracker View for Selected Order */}
        {selectedOrder ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Main Tracker Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-mono-tabular text-slate-900">
                      {selectedOrder.id}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono-tabular">
                      · Txn: {selectedOrder.paymentTransactionId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Placed on {new Date(selectedOrder.orderDate).toLocaleString()} via {selectedOrder.paymentMethod.replace('_', ' ')}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrderForReceipt(selectedOrder)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt / Manifest</span>
                </button>
              </div>

              {/* Visual Progress Stepper */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-slate-800 block">Fulfillment & Safety Pipeline</span>
                
                <div className="relative">
                  <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10">
                    {ORDER_STAGES.map((st, index) => {
                      const currentIdx = getStageIndex(selectedOrder.orderStatus);
                      const isComplete = currentIdx >= index;
                      const isCurrent = currentIdx === index;

                      return (
                        <div key={st.id} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isComplete 
                              ? 'bg-emerald-850 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {isComplete ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                          </div>

                          <div className="space-y-0.5">
                            <div className={`text-xs font-semibold ${isCurrent ? 'text-emerald-950 font-bold' : isComplete ? 'text-slate-800' : 'text-slate-400'}`}>
                              {st.label}
                            </div>
                            <div className="text-[10px] text-slate-500 hidden sm:block">
                              {st.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700 block">Farmer / Consignee Details</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono-tabular">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedOrder.customerLocation}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700 block">Logistics & Carrier Assignment</span>
                  {selectedOrder.driverInfo ? (
                    <div className="space-y-1 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-medium">{selectedOrder.driverInfo.name}</span>
                      </div>
                      <div className="text-slate-500 font-mono-tabular">Tel: {selectedOrder.driverInfo.phone}</div>
                      <div className="text-slate-500">Vehicle: {selectedOrder.driverInfo.vehiclePlate}</div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">
                      {selectedOrder.orderType === 'PICKUP' 
                        ? 'Counter Collection at Depot Bay 2' 
                        : 'Rural delivery carrier pending dispatch'}
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Manifest */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-800 block">
                  Enclosed Chemical Formulations ({selectedOrder.items.length} items)
                </span>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Agrochemical Product</th>
                        <th className="py-2.5 px-2">Hazard Class</th>
                        <th className="py-2.5 px-2">Batch No</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="text-[11px] text-slate-500">{item.packageSize}</div>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="text-[11px] font-medium text-slate-700">{item.hazardBand} Band</span>
                          </td>
                          <td className="py-2.5 px-2 font-mono-tabular text-slate-600">{item.batchNumber}</td>
                          <td className="py-2.5 px-2 text-center font-mono-tabular font-semibold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono-tabular font-bold text-slate-900">
                            {formatGHS(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-right text-xs pt-1 text-slate-700">
                  Total Order Amount: <strong className="font-mono-tabular text-emerald-950 text-sm">{formatGHS(selectedOrder.totalAmount)}</strong>
                </div>
              </div>

              {/* Storekeeper Action Control Panel */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Storekeeper Dispatch & Status Controller</span>
                  <span className="text-[11px] text-slate-500">Current Status: {selectedOrder.orderStatus}</span>
                </div>

                {/* Progress Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder.orderStatus === 'ORDER_PLACED' && (
                    <button
                      onClick={() => handleAdvanceStatus('PAYMENT_VERIFIED')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Confirm Payment Verification
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'PAYMENT_VERIFIED' && (
                    <button
                      onClick={() => handleAdvanceStatus('PACKED_SAFETY_CHECK')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Pass Safety Check & Stage Packing
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'PACKED_SAFETY_CHECK' && (
                    <button
                      onClick={() => handleAdvanceStatus('DISPATCHED')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
                    >
                      Dispatch on Route / Ready at Bay
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'DISPATCHED' && (
                    <button
                      onClick={() => handleAdvanceStatus('DELIVERED')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
                    >
                      Certify Final Handover to Farmer
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'DELIVERED' && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Fulfillment & Delivery Complete</span>
                    </div>
                  )}
                </div>

                {/* Status History Timeline */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 block">Audit Trail Log</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedOrder.statusHistory.map((h, idx) => (
                      <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-2">
                        <span className="font-mono-tabular text-slate-400 shrink-0">
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>
                          <strong>{h.status.replace(/_/g, ' ')}</strong>: {h.note} ({h.operator})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500">Select an order from the left column to view tracking details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
