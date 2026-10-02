import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { PaymentModal } from './PaymentModal';
import { formatGHS } from '../utils/currency';
import { X, Trash2, ShoppingBag, ShieldAlert, ArrowRight } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    updateCartQty, 
    removeFromCart, 
    clearCart, 
    cartTotal,
    setActiveTab,
    setSelectedOrderForTracking
  } = useAgroStore();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">Current Sale Staging</h2>
            <span className="text-xs text-slate-500 font-mono-tabular">
              ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body: Itemized List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Sale Cart is Empty</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Select products from the catalog or quick-sale counter to stage an order.
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setActiveTab('catalog');
                }}
                className="mt-2 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Browse Chemicals & Fertilizers
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex gap-3"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Info & Controls */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {product.tradeName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {product.packageSize} · Batch: {product.batchNumber}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-md bg-white text-xs">
                        <button
                          onClick={() => updateCartQty(product.id, quantity - 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-mono-tabular font-medium">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(product.id, quantity + 1)}
                          disabled={quantity >= product.stock}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold font-mono-tabular text-slate-900">
                          {formatGHS(product.price * quantity)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono-tabular">
                          @ {formatGHS(product.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-500 hover:text-red-600 transition-colors underline"
                >
                  Clear all items
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-slate-50/75 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono-tabular font-semibold text-slate-900">
                  {formatGHS(cartTotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Taxes & Agricultural Exemptions:</span>
                <span className="font-mono-tabular">{formatGHS(0)} (Zero-Rated Inputs)</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Staged:</span>
                <span className="font-mono-tabular text-emerald-950 text-base">
                  {formatGHS(cartTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsPaymentOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-850 hover:bg-emerald-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Proceed to Payment Gateway</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Payment Gateway Modal */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={(orderId) => {
            setIsPaymentOpen(false);
            setIsCartOpen(false);
            setActiveTab('orders');
          }}
        />
      )}
    </>
  );
};
