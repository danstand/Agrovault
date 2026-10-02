import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { PaymentMethod, Customer } from '../types/agrochemical';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Users, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Truck,
  Store,
  ChevronRight,
  KeyRound
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { 
    cart, 
    cartTotal, 
    customers, 
    processOrder, 
    currentRole 
  } = useAgroStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [orderType, setOrderType] = useState<'PICKUP' | 'FARM_DELIVERY'>('PICKUP');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  
  // Guest / Counter fields
  const [guestName, setGuestName] = useState('Kwesi Boateng');
  const [guestPhone, setGuestPhone] = useState('+233 24 990 1283');
  const [farmAddress, setFarmAddress] = useState('Sunyani Rural Sector, Plot 14');
  
  // Card details
  const [cardNumber, setCardNumber] = useState('4532 8819 2039 4910');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('831');
  const [cardName, setCardName] = useState('Kwesi Boateng');
  
  // MoMo details
  const [momoProvider, setMomoProvider] = useState('MTN_MOMO');
  const [momoNumber, setMomoNumber] = useState('+233 24 558 9102');
  const [momoPushSent, setMomoPushSent] = useState(false);
  
  // Cash details
  const [cashTendered, setCashTendered] = useState<string>('');
  
  // 3D Secure / OTP Simulation modal
  const [is3DSecureActive, setIs3DSecureActive] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const deliveryFee = orderType === 'FARM_DELIVERY' ? 25.00 : 0.00;
  const grandTotal = cartTotal + deliveryFee;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const availableCredit = selectedCustomer ? (selectedCustomer.creditLimit - selectedCustomer.outstandingBalance) : 0;

  const tenderNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderNum - grandTotal);

  const startCheckout = () => {
    setErrorMsg('');

    if (paymentMethod === 'FARMER_CREDIT') {
      if (!selectedCustomer) {
        setErrorMsg('Please select a valid registered farmer account for credit.');
        return;
      }
      if (grandTotal > availableCredit) {
        setErrorMsg(`Credit limit exceeded! Customer only has ${formatGHS(availableCredit)} available.`);
        return;
      }
      // Process credit order directly
      completeOrder('txn_credit_auth_' + Date.now().toString().slice(-6));
      return;
    }

    if (paymentMethod === 'CASH') {
      if (tenderNum < grandTotal) {
        setErrorMsg(`Cash tendered (${formatGHS(tenderNum)}) is less than total amount (${formatGHS(grandTotal)}).`);
        return;
      }
      completeOrder('txn_cash_drawer_' + Date.now().toString().slice(-6));
      return;
    }

    if (paymentMethod === 'MOBILE_MONEY') {
      if (!momoNumber.trim()) {
        setErrorMsg('Please enter a valid Mobile Money recipient phone number.');
        return;
      }
      setMomoPushSent(true);
      return;
    }

    if (paymentMethod === 'CARD') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setErrorMsg('Please enter a valid 16-digit card number.');
        return;
      }
      // Trigger interactive 3D Secure OTP Modal
      setIs3DSecureActive(true);
    }
  };

  const handleVerifyOtp = (codeToTest?: string) => {
    const code = codeToTest || otpCode;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIs3DSecureActive(false);
      completeOrder('txn_card_3ds_' + Date.now().toString().slice(-8));
    }, 900);
  };

  const handleConfirmMomoPrompt = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setMomoPushSent(false);
      completeOrder('txn_momo_verified_' + Date.now().toString().slice(-8));
    }, 1000);
  };

  const completeOrder = (txnId: string) => {
    const customerObj = selectedCustomer || {
      name: guestName || 'Walk-in Farmer',
      phone: guestPhone || 'N/A',
      location: farmAddress || 'Direct Store Counter'
    };

    const newOrder = processOrder({
      customer: customerObj,
      paymentMethod,
      paymentTxnId: txnId,
      deliveryFee,
      discount: 0,
      orderType,
      notes: `Payment completed via ${paymentMethod}. Delivery note: ${orderType === 'FARM_DELIVERY' ? farmAddress : 'Pickup from store'}.`
    });

    onSuccess(newOrder.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/75">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">AgroVault Secure Checkout Terminal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Order Summary Pill-Free Bar */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-emerald-900 font-medium">Cart Total ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <div className="text-2xl font-bold font-mono-tabular text-emerald-950">
                {formatGHS(grandTotal)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div>Subtotal: <strong className="font-mono-tabular">{formatGHS(cartTotal)}</strong></div>
              <div>Delivery: <strong className="font-mono-tabular">{formatGHS(deliveryFee)}</strong></div>
            </div>
          </div>

          {/* Fulfillment Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800 block">Fulfillment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('PICKUP')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  orderType === 'PICKUP' 
                    ? 'border-emerald-800 bg-emerald-50/50 text-emerald-950 shadow-xs' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs mb-1">
                  <Store className="w-4 h-4 text-emerald-800" />
                  <span>Store Counter Pickup</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono-tabular">Free · Collect at Bay 2</div>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('FARM_DELIVERY')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  orderType === 'FARM_DELIVERY' 
                    ? 'border-emerald-800 bg-emerald-50/50 text-emerald-950 shadow-xs' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs mb-1">
                  <Truck className="w-4 h-4 text-emerald-800" />
                  <span>Farm Dispatch & Transport</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono-tabular">+{formatGHS(25)} · Hazardous logistics</div>
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 block">Customer Account</label>
              <span className="text-[11px] text-slate-500">Registered Farmer or Walk-in</span>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="">-- Walk-in Guest Farmer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.farmLocation} · Limit {formatGHS(c.creditLimit)})
                </option>
              ))}
            </select>

            {!selectedCustomer && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Farmer Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md font-mono-tabular"
                  />
                </div>
              </div>
            )}

            {orderType === 'FARM_DELIVERY' && (
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Farm Delivery Address / GPS Land Coordinates</label>
                <input
                  type="text"
                  value={farmAddress}
                  onChange={(e) => setFarmAddress(e.target.value)}
                  placeholder="e.g. Sunyani Valley Farm, Block 4B, Tractor Gate"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800 block">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('MOBILE_MONEY')}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  paymentMethod === 'MOBILE_MONEY'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span>Mobile Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span>Cash Counter</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('FARMER_CREDIT')}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  paymentMethod === 'FARMER_CREDIT'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span>Farm Credit</span>
              </button>
            </div>
          </div>

          {/* Conditional Payment Details */}
          {paymentMethod === 'CARD' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-900">Encrypted Card Payment (3D Secure 2.0)</span>
                <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 0000 0000 0000"
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-slate-200 rounded-md"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-2.5 py-1.5 font-mono-tabular bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="•••"
                    className="w-full px-2.5 py-1.5 font-mono-tabular bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Cardholder</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Cardholder name"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'MOBILE_MONEY' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-xs font-semibold text-slate-900 block">Instant Mobile Money Checkout</span>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Network Provider</label>
                  <select
                    value={momoProvider}
                    onChange={(e) => setMomoProvider(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                  >
                    <option value="MTN_MOMO">MTN Mobile Money</option>
                    <option value="VODAFONE_CASH">Telecel / Vodafone Cash</option>
                    <option value="AIRTEL_TIGO">AirtelTigo Money</option>
                    <option value="MPESA">M-Pesa Express</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Registered Phone No</label>
                  <input
                    type="text"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono-tabular bg-white border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                A USSD push notification will be triggered to this phone for PIN confirmation.
              </div>
            </div>
          )}

          {paymentMethod === 'CASH' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-xs font-semibold text-slate-900 block">Cash Counter Payment Register</span>
              
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Cash Tendered by Customer ({CURRENCY_SYMBOL})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono-tabular text-xs">{CURRENCY_SYMBOL}</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={grandTotal.toFixed(2)}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full pl-12 pr-3 py-2 text-sm font-mono-tabular bg-white border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              {/* Quick Bill presets */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-[11px] text-slate-500">Quick:</span>
                {[Math.ceil(grandTotal), 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt.toString())}
                    className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 font-mono-tabular text-xs"
                  >
                    {CURRENCY_SYMBOL} {amt}
                  </button>
                ))}
              </div>

              {tenderNum > 0 && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Change Due to Customer:</span>
                  <span className={`font-mono-tabular text-sm font-bold ${changeDue >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatGHS(changeDue)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'FARMER_CREDIT' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/40 space-y-3">
              <span className="text-xs font-semibold text-amber-950 block">Authorized Farmer Credit Account</span>
              
              {selectedCustomer ? (
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span>Credit Limit:</span>
                    <strong className="font-mono-tabular">{formatGHS(selectedCustomer.creditLimit)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Outstanding Debt:</span>
                    <strong className="font-mono-tabular text-red-600">{formatGHS(selectedCustomer.outstandingBalance)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-amber-200/60 pt-1 font-medium">
                    <span>Available Credit Remaining:</span>
                    <strong className="font-mono-tabular text-emerald-800">{formatGHS(availableCredit)}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-600">
                  Select a registered farmer from the customer dropdown to bill against their credit balance.
                </p>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={startCheckout}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Process Payment · {formatGHS(grandTotal)}</span>
          </button>
        </div>
      </div>

      {/* 3D Secure OTP Challenge Simulation Modal */}
      {is3DSecureActive && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Verified by Visa / Mastercard ID</h4>
                <p className="text-[10px] text-slate-500">AgroVault 3-D Secure Authentication</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              A temporary security authorization code has been sent via SMS to cardholder mobile ending in <strong>••91</strong>.
            </p>

            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-center justify-between">
              <span>Demo SMS Code: <strong>847291</strong></span>
              <button
                type="button"
                onClick={() => setOtpCode('847291')}
                className="text-[11px] underline font-semibold text-blue-700 cursor-pointer"
              >
                Auto-fill
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Enter 6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="847291"
                className="w-full text-center text-lg tracking-widest font-mono-tabular py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIs3DSecureActive(false)}
                className="flex-1 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={otpCode.length < 6 || isProcessing}
                onClick={() => handleVerifyOtp()}
                className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                {isProcessing ? 'Verifying...' : 'Authorize'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Money USSD Push Simulation Modal */}
      {momoPushSent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Smartphone className="w-5 h-5 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                {momoProvider.replace('_', ' ')} USSD Prompt
              </h4>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-2 font-mono-tabular">
              <p className="text-slate-200">
                Authorize payment of <span className="font-bold text-amber-400">{formatGHS(grandTotal)}</span> to AgroVault Agrochemical Retail?
              </p>
              <p className="text-[11px] text-slate-400">
                Reference: AGV-{Date.now().toString().slice(-4)} · Fee: {formatGHS(0)}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              (Interactive Simulation: Click "Simulate Pin Approval" to confirm)
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMomoPushSent(false)}
                className="flex-1 py-2 text-xs text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800"
              >
                Decline
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmMomoPrompt}
                className="flex-1 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                {isProcessing ? 'Authenticating...' : 'Simulate Pin Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
