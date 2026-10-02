export type HazardBand = 'RED' | 'YELLOW' | 'BLUE' | 'GREEN';

export type ProductCategory = 
  | 'HERBICIDE' 
  | 'FUNGICIDE' 
  | 'INSECTICIDE' 
  | 'FERTILIZER' 
  | 'SEED_TREATMENT' 
  | 'EQUIPMENT_PPE';

export interface SupplierPerformanceRecord {
  id: string;
  poNumber: string;
  orderDate: string;
  deliveryDate: string;
  onTime: boolean;
  leadTimeDaysTaken: number;
  itemsSummary: string;
  totalAmountGHS: number;
  qualityCheckPassed: boolean;
  defectNotes?: string;
  fulfillmentAccuracyRate: number; // e.g. 100%
  evaluatorNotes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  region: string;
  epaLicenseNumber?: string;
  leadTimeDays: number;
  // Credit Terms & Finance
  paymentTerms: string;
  creditLimitGHS: number;
  outstandingBalanceGHS: number;
  creditStatus: 'APPROVED' | 'GOOD_STANDING' | 'UNDER_REVIEW' | 'PREPAID_ONLY';
  currencySettlement: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    branch: string;
    momoMerchantNumber?: string;
  };
  // Historical Supply Performance Metrics
  rating: number; // 1.0 to 5.0
  onTimeDeliveryRate: number; // e.g. 96 (%)
  fulfillmentAccuracyRate: number; // e.g. 98 (%)
  qualityComplianceRate: number; // e.g. 100 (%)
  totalOrdersCompleted: number;
  totalProcurementSpentGHS: number;
  performanceHistory: SupplierPerformanceRecord[];
  suppliedCategories: ProductCategory[];
  notes?: string;
  aiProcurementInsight?: string;
}

export interface RestockPurchaseOrder {
  id: string;
  poNumber: string;
  productId: string;
  productName: string;
  tradeName: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  quantityOrdered: number;
  unit: string;
  unitCostPrice: number;
  totalCostAmount: number;
  status: 'ALERT_SENT' | 'SUPPLIER_ACKNOWLEDGED' | 'IN_TRANSIT' | 'RESTOCKED_RECEIVED' | 'CANCELLED';
  channelUsed: 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'SYSTEM';
  dateCreated: string;
  dateSent?: string;
  expectedDeliveryDate: string;
  dateReceived?: string;
  invoiceReference?: string;
  notes?: string;
}

export interface SupplierAlert {
  id: string;
  productId: string;
  productName: string;
  tradeName: string;
  category: ProductCategory;
  currentStock: number;
  restockLevel: number;
  reorderQuantity: number;
  unit: string;
  unitCostPrice: number;
  estimatedRestockCost: number;
  urgency: 'CRITICAL' | 'WARNING';
  supplierId: string;
  supplierName: string;
  supplierContact: string;
  supplierWhatsapp: string;
  supplierEmail: string;
  leadTimeDays: number;
  dateTriggered: string;
  activeStatus: 'TRIGGERED' | 'ALERTED_SUPPLIER' | 'ORDER_IN_TRANSIT' | 'RESTOCKED';
  lastAlertChannel?: 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'SYSTEM';
  lastAlertTimestamp?: string;
  activePoNumber?: string;
}

export interface AgrochemicalProduct {
  id: string;
  name: string;
  tradeName: string;
  activeIngredient: string;
  category: ProductCategory;
  hazardBand: HazardBand;
  hazardClassText: string;
  regNumber: string;
  manufacturer: string;
  packageSize: string;
  unit: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockLevel: number;
  restockLevel?: number; // Configurable restock trigger point
  reorderQuantity?: number; // Standard reorder batch size
  supplierId?: string;
  supplierName?: string;
  supplierContact?: string;
  supplierEmail?: string;
  supplierLeadTimeDays?: number;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  storageLocation: string;
  dosageGuidance: string;
  targetCrops: string[];
  preHarvestIntervalDays: number;
  image: string;
  msdsSummary: string;
  restrictedPrescription: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  farmLocation: string;
  farmSizeAcres: number;
  primaryCrops: string[];
  creditLimit: number;
  outstandingBalance: number;
  kycVerified: boolean;
}

export type PaymentMethod = 'CARD' | 'MOBILE_MONEY' | 'CASH' | 'FARMER_CREDIT' | 'BANK_TRANSFER';
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'CREDIT_ISSUED';
export type OrderStatus = 
  | 'ORDER_PLACED' 
  | 'PAYMENT_VERIFIED' 
  | 'PACKED_SAFETY_CHECK' 
  | 'DISPATCHED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  tradeName: string;
  category: ProductCategory;
  hazardBand: HazardBand;
  packageSize: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  batchNumber: string;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId: string;
  orderStatus: OrderStatus;
  orderType: 'PICKUP' | 'FARM_DELIVERY';
  driverInfo?: {
    name: string;
    phone: string;
    vehiclePlate: string;
  };
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note: string;
    operator: string;
  }>;
  safetyCheckCompleted: boolean;
  notes?: string;
}

export type LedgerAccount = 
  | 'CASH_DRAWER' 
  | 'BANK_ACCOUNT' 
  | 'MOBILE_MONEY' 
  | 'ACCOUNTS_RECEIVABLE' 
  | 'ACCOUNTS_PAYABLE';

export type LedgerType = 
  | 'INCOME_SALE' 
  | 'EXPENSE_PURCHASE' 
  | 'EXPENSE_OPERATIONAL' 
  | 'CUSTOMER_CREDIT_REPAYMENT' 
  | 'REFUND';

export interface LedgerEntry {
  id: string;
  date: string;
  type: LedgerType;
  category: string;
  referenceId: string;
  amount: number;
  entryFlow: 'DEBIT' | 'CREDIT';
  account: LedgerAccount;
  description: string;
  balanceAfter: number;
}

export interface DosageRecommendation {
  crop: string;
  problem: string;
  recommendedCategory: ProductCategory;
  productName: string;
  applicationRatePerAcre: number;
  rateUnit: string;
  waterPerAcreLitres: number;
  knapsackCapacityLitres: number;
  knapsackFillCount: number;
  chemicalPerKnapsack: number;
  chemicalUnit: string;
  phiDays: number;
  safetyInstructions: string;
}
