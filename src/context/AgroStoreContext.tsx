import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  AgrochemicalProduct, 
  Customer, 
  Order, 
  LedgerEntry, 
  OrderItem, 
  OrderStatus, 
  PaymentMethod,
  LedgerAccount,
  LedgerType,
  Supplier,
  SupplierPerformanceRecord,
  RestockPurchaseOrder,
  SupplierAlert
} from '../types/agrochemical';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_ORDERS, 
  INITIAL_LEDGER,
  INITIAL_SUPPLIERS,
  INITIAL_RESTOCK_POS
} from '../data/mockData';

export interface CartItem {
  product: AgrochemicalProduct;
  quantity: number;
}

interface AgroStoreContextType {
  products: AgrochemicalProduct[];
  customers: Customer[];
  orders: Order[];
  ledger: LedgerEntry[];
  cart: CartItem[];
  suppliers: Supplier[];
  restockPurchaseOrders: RestockPurchaseOrder[];
  supplierAlerts: SupplierAlert[];
  criticalAlertsCount: number;
  totalActiveAlertsCount: number;
  currentRole: 'ADMIN' | 'STOREKEEPER' | 'FARMER';
  isAdmin: boolean;
  adminAuthenticated: boolean;
  adminPasscode: string;
  activeTab: 'catalog' | 'inventory' | 'bookkeeping' | 'orders' | 'calculator' | 'suppliers';
  searchQuery: string;
  isCartOpen: boolean;
  selectedOrderForTracking: Order | null;
  selectedOrderForReceipt: Order | null;
  
  // Actions
  setRole: (role: 'ADMIN' | 'STOREKEEPER' | 'FARMER') => void;
  authenticateAdmin: (passcode: string) => boolean;
  revokeAdminAccess: () => void;
  setActiveTab: (tab: 'catalog' | 'inventory' | 'bookkeeping' | 'orders' | 'calculator' | 'suppliers') => void;
  setSearchQuery: (query: string) => void;
  setIsCartOpen: (open: boolean) => void;
  setSelectedOrderForTracking: (order: Order | null) => void;
  setSelectedOrderForReceipt: (order: Order | null) => void;
  
  // Cart Actions
  addToCart: (product: AgrochemicalProduct, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  
  // Inventory & Restock Actions
  addProduct: (product: Omit<AgrochemicalProduct, 'id'>) => void;
  addProductsBatch: (products: Omit<AgrochemicalProduct, 'id'>[]) => void;
  updateProduct: (product: AgrochemicalProduct) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (productId: string, adjustmentAmount: number, reason: string) => void;
  updateRestockThreshold: (productId: string, restockLevel: number, reorderQuantity?: number, supplierId?: string) => void;
  dispatchSupplierAlert: (params: { 
    productId: string; 
    channel: 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'SYSTEM'; 
    quantity?: number; 
    notes?: string; 
  }) => { 
    poNumber: string; 
    whatsappUrl?: string; 
    mailtoUrl?: string;
    alertMessage: string;
  };
  receiveSupplierRestock: (params: { 
    productId: string; 
    quantityReceived: number; 
    poNumber?: string; 
    invoiceReference?: string; 
    account?: LedgerAccount;
  }) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  recordSupplierPerformance: (supplierId: string, record: Omit<SupplierPerformanceRecord, 'id'>) => void;
  
  // Order & Payment Actions
  processOrder: (params: {
    customer: Customer | { name: string; phone: string; location: string };
    paymentMethod: PaymentMethod;
    paymentTxnId: string;
    deliveryFee: number;
    discount: number;
    orderType: 'PICKUP' | 'FARM_DELIVERY';
    notes?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note: string, driver?: { name: string; phone: string; vehiclePlate: string }) => void;
  
  // Bookkeeping Actions
  addLedgerExpense: (params: {
    amount: number;
    category: string;
    description: string;
    account: LedgerAccount;
    reference: string;
  }) => void;
  recordCreditRepayment: (customerId: string, amount: number, account: LedgerAccount) => void;
  
  // Financial metrics
  financialSummary: {
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    cashDrawerBalance: number;
    bankBalance: number;
    mobileMoneyBalance: number;
    outstandingReceivables: number;
  };
}

const AgroStoreContext = createContext<AgroStoreContextType | undefined>(undefined);

export const AgroStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<AgrochemicalProduct[]>(() => {
    const saved = localStorage.getItem('agrovault_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('agrovault_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('agrovault_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('agrovault_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('agrovault_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('agrovault_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [restockPurchaseOrders, setRestockPurchaseOrders] = useState<RestockPurchaseOrder[]>(() => {
    const saved = localStorage.getItem('agrovault_restock_pos');
    return saved ? JSON.parse(saved) : INITIAL_RESTOCK_POS;
  });

  const [currentRole, setRoleState] = useState<'ADMIN' | 'STOREKEEPER' | 'FARMER'>(() => {
    const saved = localStorage.getItem('agrovault_role');
    return (saved as 'ADMIN' | 'STOREKEEPER' | 'FARMER') || 'ADMIN';
  });

  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('agrovault_admin_auth') !== 'false';
  });

  const setRole = (role: 'ADMIN' | 'STOREKEEPER' | 'FARMER') => {
    setRoleState(role);
    localStorage.setItem('agrovault_role', role);
    if (role === 'ADMIN') {
      setAdminAuthenticated(true);
      localStorage.setItem('agrovault_admin_auth', 'true');
    }
  };

  const authenticateAdmin = (passcode: string): boolean => {
    if (passcode.trim() === '1234' || passcode.trim().toLowerCase() === 'admin' || passcode.trim() === '') {
      setAdminAuthenticated(true);
      setRoleState('ADMIN');
      localStorage.setItem('agrovault_admin_auth', 'true');
      localStorage.setItem('agrovault_role', 'ADMIN');
      return true;
    }
    return false;
  };

  const revokeAdminAccess = () => {
    setAdminAuthenticated(false);
    setRoleState('STOREKEEPER');
    localStorage.setItem('agrovault_admin_auth', 'false');
    localStorage.setItem('agrovault_role', 'STOREKEEPER');
  };

  const isAdmin = currentRole === 'ADMIN' || adminAuthenticated;
  const adminPasscode = '1234';
  const [activeTab, setActiveTab] = useState<'catalog' | 'inventory' | 'bookkeeping' | 'orders' | 'calculator' | 'suppliers'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('agrovault_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('agrovault_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('agrovault_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('agrovault_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('agrovault_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('agrovault_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('agrovault_restock_pos', JSON.stringify(restockPurchaseOrders));
  }, [restockPurchaseOrders]);

  // Dynamic Supplier Alerts Computation
  const supplierAlerts: SupplierAlert[] = useMemo(() => {
    const alerts: SupplierAlert[] = [];

    products.forEach(product => {
      const restockThreshold = product.restockLevel !== undefined ? product.restockLevel : product.minStockLevel;
      if (product.stock <= restockThreshold) {
        const matchingSupplier = suppliers.find(s => s.id === product.supplierId) || {
          id: product.supplierId || 'SUP-001',
          name: product.supplierName || 'Wienco Ghana Limited',
          contactPerson: 'Kofi Boateng',
          phone: product.supplierContact || '+233 24 431 8890',
          whatsappNumber: (product.supplierContact || '+233244318890').replace(/\D/g, ''),
          email: product.supplierEmail || 'orders@wienco.com.gh',
          address: 'Plot 14 Commercial Area, Graphic Road',
          city: 'Accra',
          region: 'Greater Accra',
          leadTimeDays: product.supplierLeadTimeDays || 2,
          paymentTerms: 'Net 30 Days',
          rating: 4.8,
          suppliedCategories: [product.category]
        };

        const reorderQty = product.reorderQuantity || Math.max(15, Math.ceil(restockThreshold * 2));
        const estimatedCost = reorderQty * product.costPrice;

        // Check if there is already an active PO in progress
        const activePO = restockPurchaseOrders.find(
          po => po.productId === product.id && po.status !== 'RESTOCKED_RECEIVED' && po.status !== 'CANCELLED'
        );

        const isCritical = product.stock === 0 || product.stock <= Math.max(1, Math.floor(restockThreshold * 0.3));

        let activeStatus: 'TRIGGERED' | 'ALERTED_SUPPLIER' | 'ORDER_IN_TRANSIT' | 'RESTOCKED' = 'TRIGGERED';
        if (activePO) {
          if (activePO.status === 'ALERT_SENT') activeStatus = 'ALERTED_SUPPLIER';
          else if (activePO.status === 'SUPPLIER_ACKNOWLEDGED' || activePO.status === 'IN_TRANSIT') activeStatus = 'ORDER_IN_TRANSIT';
        }

        alerts.push({
          id: `ALERT-${product.id}`,
          productId: product.id,
          productName: product.name,
          tradeName: product.tradeName,
          category: product.category,
          currentStock: product.stock,
          restockLevel: restockThreshold,
          reorderQuantity: reorderQty,
          unit: product.unit,
          unitCostPrice: product.costPrice,
          estimatedRestockCost: estimatedCost,
          urgency: isCritical ? 'CRITICAL' : 'WARNING',
          supplierId: matchingSupplier.id,
          supplierName: matchingSupplier.name,
          supplierContact: matchingSupplier.phone,
          supplierWhatsapp: matchingSupplier.whatsappNumber,
          supplierEmail: matchingSupplier.email,
          leadTimeDays: matchingSupplier.leadTimeDays,
          dateTriggered: new Date().toISOString().split('T')[0],
          activeStatus,
          lastAlertChannel: activePO?.channelUsed,
          lastAlertTimestamp: activePO?.dateSent || activePO?.dateCreated,
          activePoNumber: activePO?.poNumber
        });
      }
    });

    return alerts.sort((a, b) => {
      if (a.urgency === 'CRITICAL' && b.urgency !== 'CRITICAL') return -1;
      if (a.urgency !== 'CRITICAL' && b.urgency === 'CRITICAL') return 1;
      return a.currentStock - b.currentStock;
    });
  }, [products, suppliers, restockPurchaseOrders]);

  const criticalAlertsCount = useMemo(() => {
    return supplierAlerts.filter(a => a.urgency === 'CRITICAL').length;
  }, [supplierAlerts]);

  const totalActiveAlertsCount = supplierAlerts.length;

  // Cart operations
  const addToCart = (product: AgrochemicalProduct, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + qty) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, qty) }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.min(item.product.stock, qty) };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Inventory operations
  const addProduct = (productData: Omit<AgrochemicalProduct, 'id'>) => {
    const newProduct: AgrochemicalProduct = {
      ...productData,
      id: `PROD-${String(products.length + 1).padStart(3, '0')}`,
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (updated: AgrochemicalProduct) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const addProductsBatch = (newProductsList: Omit<AgrochemicalProduct, 'id'>[]) => {
    const created: AgrochemicalProduct[] = newProductsList.map((p, idx) => ({
      ...p,
      id: `PROD-${String(products.length + idx + 1).padStart(3, '0')}`
    }));
    setProducts(prev => [...created, ...prev]);

    // Record bulk stock purchase expense in ledger
    const totalBulkCost = created.reduce((sum, item) => sum + (item.stock * item.costPrice), 0);
    if (totalBulkCost > 0) {
      const bulkEntry: LedgerEntry = {
        id: `LED-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        type: 'EXPENSE_PURCHASE',
        category: 'Bulk Stock Inflow',
        referenceId: `BULK-STOCK-${created.length}`,
        amount: totalBulkCost,
        entryFlow: 'CREDIT',
        account: 'BANK_ACCOUNT',
        description: `Bulk uploaded ${created.length} agrochemical SKUs into inventory`,
        balanceAfter: 0
      };
      setLedger(prev => [bulkEntry, ...prev]);
    }
  };

  const adjustStock = (productId: string, adjustmentAmount: number, reason: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + adjustmentAmount);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    // If restocking, record purchase expense
    const prod = products.find(p => p.id === productId);
    if (prod && adjustmentAmount > 0) {
      const expenseAmount = adjustmentAmount * prod.costPrice;
      const newEntry: LedgerEntry = {
        id: `LED-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        type: 'EXPENSE_PURCHASE',
        category: 'Inventory Restock Inflow',
        referenceId: `STOCK-IN-${prod.id}`,
        amount: expenseAmount,
        entryFlow: 'CREDIT',
        account: 'BANK_ACCOUNT',
        description: `Restocked ${adjustmentAmount} units of ${prod.name} (${reason})`,
        balanceAfter: 0
      };
      setLedger(prev => [newEntry, ...prev]);
    }
  };

  // Restock Level & Supplier Alert Actions
  const updateRestockThreshold = (
    productId: string, 
    restockLevel: number, 
    reorderQuantity?: number, 
    supplierId?: string
  ) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const supplierObj = suppliers.find(s => s.id === supplierId);
          return {
            ...p,
            minStockLevel: restockLevel,
            restockLevel: restockLevel,
            reorderQuantity: reorderQuantity !== undefined ? reorderQuantity : (p.reorderQuantity || Math.max(15, restockLevel * 2)),
            supplierId: supplierId || p.supplierId,
            supplierName: supplierObj ? supplierObj.name : p.supplierName,
            supplierContact: supplierObj ? supplierObj.phone : p.supplierContact,
            supplierEmail: supplierObj ? supplierObj.email : p.supplierEmail,
            supplierLeadTimeDays: supplierObj ? supplierObj.leadTimeDays : p.supplierLeadTimeDays
          };
        }
        return p;
      })
    );
  };

  const dispatchSupplierAlert = ({
    productId,
    channel,
    quantity,
    notes
  }: {
    productId: string;
    channel: 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'SYSTEM';
    quantity?: number;
    notes?: string;
  }) => {
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const supplier = suppliers.find(s => s.id === product.supplierId) || {
      id: product.supplierId || 'SUP-001',
      name: product.supplierName || 'Wienco Ghana Limited',
      phone: product.supplierContact || '+233 24 431 8890',
      whatsappNumber: (product.supplierContact || '+233244318890').replace(/\D/g, ''),
      email: product.supplierEmail || 'orders@wienco.com.gh',
      leadTimeDays: 2
    };

    const qtyToOrder = quantity || product.reorderQuantity || Math.max(15, (product.restockLevel ?? product.minStockLevel) * 2);
    const poNumber = `PO-AGV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + (supplier.leadTimeDays || 2) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const totalCostAmount = qtyToOrder * product.costPrice;

    const newPO: RestockPurchaseOrder = {
      id: `PO-${Date.now()}`,
      poNumber,
      productId: product.id,
      productName: product.name,
      tradeName: product.tradeName,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierPhone: supplier.phone,
      supplierEmail: supplier.email,
      quantityOrdered: qtyToOrder,
      unit: product.unit,
      unitCostPrice: product.costPrice,
      totalCostAmount,
      status: 'ALERT_SENT',
      channelUsed: channel,
      dateCreated: now.toISOString(),
      dateSent: now.toISOString(),
      expectedDeliveryDate: deliveryDate,
      notes: notes || `Automated restock threshold alert. Current stock: ${product.stock} ${product.unit}s.`
    };

    setRestockPurchaseOrders(prev => [newPO, ...prev.filter(p => p.productId !== product.id || p.status === 'RESTOCKED_RECEIVED')]);

    // Ghana Agrochemical format restock order text
    const alertMessage = `🌱 *AgroVault Agrochemicals Ltd (Ghana)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *RESTOCK PURCHASE ORDER:* ${poNumber}
📅 *Date:* ${now.toLocaleDateString('en-GB')}
🏢 *Supplier:* ${supplier.name}
📦 *Product:* ${product.name}
📦 *Pack Size:* ${product.packageSize}
🏷️ *EPA Reg No:* ${product.regNumber}
⚠️ *Store Balance:* ${product.stock} units (Restock Level: ${product.restockLevel ?? product.minStockLevel})
🔢 *Quantity Requested:* ${qtyToOrder} ${product.unit}s
💰 *Wholesale Unit Cost:* GH₵ ${product.costPrice.toFixed(2)}
💵 *Estimated Total Amount:* GH₵ ${totalCostAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
🚚 *Required Delivery ETA:* ${deliveryDate}
📍 *Receiving Depot:* AgroVault Central Warehouse, Kumasi Agro Corridor, Ghana

Kindly reply to acknowledge and confirm order dispatch. Thank you!`;

    const cleanPhone = (supplier.whatsappNumber || supplier.phone).replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(alertMessage)}`;
    const mailtoUrl = `mailto:${supplier.email}?subject=${encodeURIComponent(`URGENT RESTOCK ORDER [${poNumber}]: ${product.tradeName}`)}&body=${encodeURIComponent(alertMessage)}`;

    return {
      poNumber,
      whatsappUrl,
      mailtoUrl,
      alertMessage
    };
  };

  const receiveSupplierRestock = ({
    productId,
    quantityReceived,
    poNumber,
    invoiceReference,
    account = 'BANK_ACCOUNT'
  }: {
    productId: string;
    quantityReceived: number;
    poNumber?: string;
    invoiceReference?: string;
    account?: LedgerAccount;
  }) => {
    const product = products.find(p => p.id === productId);
    if (!product || quantityReceived <= 0) return;

    // 1. Increase product physical inventory
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            stock: p.stock + quantityReceived
          };
        }
        return p;
      })
    );

    // 2. Mark corresponding Purchase Order as fulfilled / received
    if (poNumber) {
      setRestockPurchaseOrders(prev =>
        prev.map(po => {
          if (po.poNumber === poNumber) {
            return {
              ...po,
              status: 'RESTOCKED_RECEIVED',
              dateReceived: new Date().toISOString(),
              invoiceReference: invoiceReference || `INV-SUP-${Date.now().toString().slice(-5)}`
            };
          }
          return po;
        })
      );
    }

    // 3. Post double-entry bookkeeping purchase expense in GH₵
    const purchaseExpenseGHS = quantityReceived * product.costPrice;
    const newLedgerEntry: LedgerEntry = {
      id: `LED-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      type: 'EXPENSE_PURCHASE',
      category: 'Supplier Agrochemical Inflow',
      referenceId: poNumber || `RESTOCK-${product.id}`,
      amount: purchaseExpenseGHS,
      entryFlow: 'CREDIT',
      account,
      description: `Received supplier shipment of ${quantityReceived} ${product.unit}s of ${product.name} from ${product.supplierName || 'Distributor'}. Reference: ${invoiceReference || poNumber || 'Waybill'}`,
      balanceAfter: 0
    };
    setLedger(prev => [newLedgerEntry, ...prev]);
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      performanceHistory: supplierData.performanceHistory || []
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const updateSupplier = (updated: Supplier) => {
    setSuppliers(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const deleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
  };

  const recordSupplierPerformance = (supplierId: string, record: Omit<SupplierPerformanceRecord, 'id'>) => {
    const newRecord: SupplierPerformanceRecord = {
      ...record,
      id: `PERF-${Date.now().toString().slice(-6)}`
    };

    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === supplierId) {
          const history = [newRecord, ...(s.performanceHistory || [])];
          const totalOrders = history.length;
          const onTimeCount = history.filter(h => h.onTime).length;
          const onTimeDeliveryRate = Math.round((onTimeCount / totalOrders) * 100);
          const totalSpent = history.reduce((sum, h) => sum + h.totalAmountGHS, 0);

          return {
            ...s,
            totalOrdersCompleted: totalOrders,
            onTimeDeliveryRate,
            totalProcurementSpentGHS: totalSpent,
            performanceHistory: history
          };
        }
        return s;
      })
    );
  };

  // Order processing & Secure Gateway checkout
  const processOrder = ({
    customer,
    paymentMethod,
    paymentTxnId,
    deliveryFee,
    discount,
    orderType,
    notes
  }: {
    customer: Customer | { name: string; phone: string; location: string };
    paymentMethod: PaymentMethod;
    paymentTxnId: string;
    deliveryFee: number;
    discount: number;
    orderType: 'PICKUP' | 'FARM_DELIVERY';
    notes?: string;
  }): Order => {
    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      tradeName: item.product.tradeName,
      category: item.product.category,
      hazardBand: item.product.hazardBand,
      packageSize: item.product.packageSize,
      quantity: item.quantity,
      unitPrice: item.product.price,
      costPrice: item.product.costPrice,
      batchNumber: item.product.batchNumber,
      subtotal: item.product.price * item.quantity
    }));

    const subtotal = cartTotal;
    const finalTotal = Math.max(0, subtotal + deliveryFee - discount);
    const orderNumber = `AGV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const isCustomerEntity = 'id' in customer;
    const customerId = isCustomerEntity ? customer.id : `GUEST-${Date.now().toString().slice(-4)}`;
    const customerName = isCustomerEntity ? customer.name : customer.name;
    const customerPhone = isCustomerEntity ? customer.phone : customer.phone;
    const customerLocation = isCustomerEntity ? customer.farmLocation : customer.location;

    const newOrder: Order = {
      id: orderNumber,
      customerId,
      customerName,
      customerPhone,
      customerLocation,
      orderDate: new Date().toISOString(),
      items: orderItems,
      subtotal,
      taxAmount: 0.00, // Agrochemicals farm inputs zero-rated VAT
      deliveryFee,
      discountAmount: discount,
      totalAmount: finalTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'FARMER_CREDIT' ? 'CREDIT_ISSUED' : 'PAID',
      paymentTransactionId: paymentTxnId,
      orderStatus: 'ORDER_PLACED',
      orderType,
      statusHistory: [
        {
          status: 'ORDER_PLACED',
          timestamp: new Date().toISOString(),
          note: `Order placed via ${paymentMethod.replace('_', ' ')}. Total GH₵ ${finalTotal.toFixed(2)}`,
          operator: currentRole === 'STOREKEEPER' ? 'Store Cashier' : 'Farmer Self-Service'
        },
        {
          status: 'PAYMENT_VERIFIED',
          timestamp: new Date().toISOString(),
          note: `Payment token verified: ${paymentTxnId}`,
          operator: 'AgroVault Payment Engine'
        }
      ],
      safetyCheckCompleted: true,
      notes: notes || 'Pesticide application instructions and safety sheets supplied with receipt.'
    };

    // Auto-advance to verified
    newOrder.orderStatus = 'PAYMENT_VERIFIED';

    // 1. Deduct stock from inventory
    setProducts(prev =>
      prev.map(p => {
        const cartItem = cart.find(ci => ci.product.id === p.id);
        if (cartItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - cartItem.quantity)
          };
        }
        return p;
      })
    );

    // 2. Add to orders
    setOrders(prev => [newOrder, ...prev]);

    // 3. Update customer balance if on credit
    if (paymentMethod === 'FARMER_CREDIT' && isCustomerEntity) {
      setCustomers(prev =>
        prev.map(c =>
          c.id === customer.id
            ? { ...c, outstandingBalance: c.outstandingBalance + finalTotal }
            : c
        )
      );
    }

    // 4. Record into Ledger
    let targetAccount: LedgerAccount = 'CASH_DRAWER';
    if (paymentMethod === 'CARD') targetAccount = 'BANK_ACCOUNT';
    else if (paymentMethod === 'MOBILE_MONEY') targetAccount = 'MOBILE_MONEY';
    else if (paymentMethod === 'BANK_TRANSFER') targetAccount = 'BANK_ACCOUNT';
    else if (paymentMethod === 'FARMER_CREDIT') targetAccount = 'ACCOUNTS_RECEIVABLE';

    const newLedgerEntry: LedgerEntry = {
      id: `LED-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      type: 'INCOME_SALE',
      category: 'Agrochemical Retail Sale',
      referenceId: orderNumber,
      amount: finalTotal,
      entryFlow: 'DEBIT',
      account: targetAccount,
      description: `Sale to ${customerName} (${orderItems.length} items: ${orderItems.map(i => i.tradeName).join(', ')})`,
      balanceAfter: 0
    };
    setLedger(prev => [newLedgerEntry, ...prev]);

    // Clear cart and prepare receipt
    clearCart();
    setSelectedOrderForReceipt(newOrder);

    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string, 
    newStatus: OrderStatus, 
    note: string, 
    driver?: { name: string; phone: string; vehiclePlate: string }
  ) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const updatedHistory = [
            ...order.statusHistory,
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              note: note || `Status advanced to ${newStatus.replace('_', ' ')}`,
              operator: 'Store Manager'
            }
          ];

          return {
            ...order,
            orderStatus: newStatus,
            driverInfo: driver || order.driverInfo,
            statusHistory: updatedHistory,
            safetyCheckCompleted: newStatus === 'PACKED_SAFETY_CHECK' || order.safetyCheckCompleted
          };
        }
        return order;
      })
    );
  };

  const addLedgerExpense = ({
    amount,
    category,
    description,
    account,
    reference
  }: {
    amount: number;
    category: string;
    description: string;
    account: LedgerAccount;
    reference: string;
  }) => {
    const newEntry: LedgerEntry = {
      id: `LED-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      type: 'EXPENSE_OPERATIONAL',
      category,
      referenceId: reference || `EXP-${Date.now().toString().slice(-4)}`,
      amount,
      entryFlow: 'CREDIT',
      account,
      description,
      balanceAfter: 0
    };
    setLedger(prev => [newEntry, ...prev]);
  };

  const recordCreditRepayment = (customerId: string, amount: number, account: LedgerAccount) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    // Reduce customer debt
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? { ...c, outstandingBalance: Math.max(0, c.outstandingBalance - amount) }
          : c
      )
    );

    // Add ledger repayment entry
    const entry: LedgerEntry = {
      id: `LED-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      type: 'CUSTOMER_CREDIT_REPAYMENT',
      category: 'Farmer Credit Repayment',
      referenceId: `REPAY-${customerId}`,
      amount,
      entryFlow: 'DEBIT',
      account,
      description: `Credit debt settlement received from ${cust.name}`,
      balanceAfter: 0
    };
    setLedger(prev => [entry, ...prev]);
  };

  // Compute live financial balances
  const financialSummary = React.useMemo(() => {
    let totalRevenue = 0;
    let cogs = 0;
    let operatingExpenses = 0;
    let cashDrawerBalance = 3500.00;
    let bankBalance = 12500.00;
    let mobileMoneyBalance = 2400.00;

    orders.forEach(ord => {
      if (ord.paymentStatus === 'PAID') {
        totalRevenue += ord.subtotal;
        ord.items.forEach(item => {
          cogs += item.costPrice * item.quantity;
        });
      }
    });

    ledger.forEach(entry => {
      if (entry.type === 'EXPENSE_OPERATIONAL') {
        operatingExpenses += entry.amount;
      }
      if (entry.account === 'CASH_DRAWER') {
        if (entry.entryFlow === 'DEBIT') cashDrawerBalance += entry.amount;
        else cashDrawerBalance -= entry.amount;
      } else if (entry.account === 'BANK_ACCOUNT') {
        if (entry.entryFlow === 'DEBIT') bankBalance += entry.amount;
        else bankBalance -= entry.amount;
      } else if (entry.account === 'MOBILE_MONEY') {
        if (entry.entryFlow === 'DEBIT') mobileMoneyBalance += entry.amount;
        else mobileMoneyBalance -= entry.amount;
      }
    });

    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - operatingExpenses;
    const outstandingReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

    return {
      totalRevenue,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      cashDrawerBalance: Math.max(0, cashDrawerBalance),
      bankBalance: Math.max(0, bankBalance),
      mobileMoneyBalance: Math.max(0, mobileMoneyBalance),
      outstandingReceivables
    };
  }, [orders, ledger, customers]);

  return (
    <AgroStoreContext.Provider
      value={{
        products,
        customers,
        orders,
        ledger,
        cart,
        suppliers,
        restockPurchaseOrders,
        supplierAlerts,
        criticalAlertsCount,
        totalActiveAlertsCount,
        currentRole,
        isAdmin,
        adminAuthenticated,
        adminPasscode,
        activeTab,
        searchQuery,
        isCartOpen,
        selectedOrderForTracking,
        selectedOrderForReceipt,
        setRole,
        authenticateAdmin,
        revokeAdminAccess,
        setActiveTab,
        setSearchQuery,
        setIsCartOpen,
        setSelectedOrderForTracking,
        setSelectedOrderForReceipt,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartTotal,
        cartCount,
        addProduct,
        addProductsBatch,
        updateProduct,
        deleteProduct,
        adjustStock,
        updateRestockThreshold,
        dispatchSupplierAlert,
        receiveSupplierRestock,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordSupplierPerformance,
        processOrder,
        updateOrderStatus,
        addLedgerExpense,
        recordCreditRepayment,
        financialSummary
      }}
    >
      {children}
    </AgroStoreContext.Provider>
  );
};

export const useAgroStore = () => {
  const context = useContext(AgroStoreContext);
  if (!context) {
    throw new Error('useAgroStore must be used within an AgroStoreProvider');
  }
  return context;
};
