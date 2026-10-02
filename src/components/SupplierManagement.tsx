import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { Supplier, SupplierPerformanceRecord, ProductCategory } from '../types/agrochemical';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { requestSupplierAiAdvisor } from '../services/geminiSupplierAi';
import { 
  Building2, 
  Phone, 
  Mail, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  Star, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  FileText, 
  Truck, 
  X, 
  ChevronDown, 
  ChevronUp, 
  History, 
  Edit3, 
  Trash2, 
  Award, 
  Layers,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Bot
} from 'lucide-react';

export const SupplierManagement: React.FC = () => {
  const { 
    suppliers, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    recordSupplierPerformance,
    products,
    setActiveTab
  } = useAgroStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [creditFilter, setCreditFilter] = useState('ALL');
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [evaluatingSupplier, setEvaluatingSupplier] = useState<Supplier | null>(null);

  // AI Advisor Modal / Panel State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSelectedVendor, setAiSelectedVendor] = useState<Supplier | null>(null);
  const [aiActionType, setAiActionType] = useState<'EVALUATE_VENDOR' | 'NEGOTIATE_TERMS' | 'ALTERNATIVE_SOURCING' | 'CUSTOM_QUERY'>('EVALUATE_VENDOR');
  const [aiCustomQuery, setAiCustomQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultText, setAiResultText] = useState<string | null>(null);
  const [aiIsFallback, setAiIsFallback] = useState(false);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Accra');
  const [formRegion, setFormRegion] = useState('Greater Accra');
  const [formEpaLicense, setFormEpaLicense] = useState('EPA/DIST-REG/2026-GH-');
  const [formLeadTime, setFormLeadTime] = useState('2');
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30 Days Credit');
  const [formCreditLimit, setFormCreditLimit] = useState('50000');
  const [formOutstanding, setFormOutstanding] = useState('0');
  const [formCreditStatus, setFormCreditStatus] = useState<'APPROVED' | 'GOOD_STANDING' | 'UNDER_REVIEW' | 'PREPAID_ONLY'>('APPROVED');
  const [formBankName, setFormBankName] = useState('Stanbic Bank Ghana');
  const [formAccountNo, setFormAccountNo] = useState('');
  const [formBranch, setFormBranch] = useState('Commercial Area Branch');
  const [formMomo, setFormMomo] = useState('');
  const [formCategories, setFormCategories] = useState<ProductCategory[]>(['HERBICIDE', 'INSECTICIDE']);
  const [formNotes, setFormNotes] = useState('');

  // Performance Log Form State
  const [perfPoNumber, setPerfPoNumber] = useState(`PO-AGV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [perfOrderDate, setPerfOrderDate] = useState('2026-09-18');
  const [perfDeliveryDate, setPerfDeliveryDate] = useState('2026-09-20');
  const [perfOnTime, setPerfOnTime] = useState(true);
  const [perfLeadDays, setPerfLeadDays] = useState('2');
  const [perfSummary, setPerfSummary] = useState('');
  const [perfAmountGHS, setPerfAmountGHS] = useState('1200.00');
  const [perfQualityPass, setPerfQualityPass] = useState(true);
  const [perfAccuracy, setPerfAccuracy] = useState('100');
  const [perfDefectNotes, setPerfDefectNotes] = useState('');
  const [perfEvaluatorNotes, setPerfEvaluatorNotes] = useState('Quality inspection verified. Seals intact.');

  // Financial & Metrics Computations
  const totalVendors = suppliers.length;
  const totalCreditFacility = suppliers.reduce((acc, s) => acc + (s.creditLimitGHS || 0), 0);
  const totalOutstanding = suppliers.reduce((acc, s) => acc + (s.outstandingBalanceGHS || 0), 0);
  const overallUtilization = totalCreditFacility > 0 ? Math.round((totalOutstanding / totalCreditFacility) * 100) : 0;
  const avgOnTime = suppliers.length > 0
    ? Math.round(suppliers.reduce((acc, s) => acc + (s.onTimeDeliveryRate || 95), 0) / suppliers.length)
    : 95;

  const filteredSuppliers = suppliers.filter(s => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.city.toLowerCase().includes(q) ||
      (s.epaLicenseNumber && s.epaLicenseNumber.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'ALL' || (s.suppliedCategories && s.suppliedCategories.includes(categoryFilter as ProductCategory));
    const matchesCredit = creditFilter === 'ALL' || s.creditStatus === creditFilter;

    return matchesSearch && matchesCategory && matchesCredit;
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormContactPerson('');
    setFormPhone('+233 ');
    setFormWhatsapp('+233');
    setFormEmail('');
    setFormAddress('');
    setFormCity('Accra');
    setFormRegion('Greater Accra');
    setFormEpaLicense(`EPA/DIST-REG/2026-GH-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormLeadTime('2');
    setFormPaymentTerms('Net 30 Days Credit');
    setFormCreditLimit('60000');
    setFormOutstanding('0');
    setFormCreditStatus('APPROVED');
    setFormBankName('Stanbic Bank Ghana');
    setFormAccountNo('');
    setFormBranch('Main Branch');
    setFormMomo('');
    setFormCategories(['HERBICIDE', 'INSECTICIDE']);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormContactPerson(s.contactPerson);
    setFormPhone(s.phone);
    setFormWhatsapp(s.whatsappNumber);
    setFormEmail(s.email);
    setFormAddress(s.address);
    setFormCity(s.city);
    setFormRegion(s.region);
    setFormEpaLicense(s.epaLicenseNumber || '');
    setFormLeadTime(String(s.leadTimeDays));
    setFormPaymentTerms(s.paymentTerms);
    setFormCreditLimit(String(s.creditLimitGHS || 50000));
    setFormOutstanding(String(s.outstandingBalanceGHS || 0));
    setFormCreditStatus(s.creditStatus || 'APPROVED');
    setFormBankName(s.bankDetails?.bankName || '');
    setFormAccountNo(s.bankDetails?.accountNumber || '');
    setFormBranch(s.bankDetails?.branch || '');
    setFormMomo(s.bankDetails?.momoMerchantNumber || '');
    setFormCategories(s.suppliedCategories || []);
    setFormNotes(s.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formContactPerson || !formPhone) return;

    const supplierPayload: Omit<Supplier, 'id'> = {
      name: formName,
      contactPerson: formContactPerson,
      phone: formPhone,
      whatsappNumber: formWhatsapp || formPhone.replace(/\D/g, ''),
      email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '')}@distributor.com.gh`,
      address: formAddress || 'Commercial Area, Heavy Industrial Zone',
      city: formCity,
      region: formRegion,
      epaLicenseNumber: formEpaLicense,
      leadTimeDays: parseInt(formLeadTime) || 2,
      paymentTerms: formPaymentTerms,
      creditLimitGHS: parseFloat(formCreditLimit) || 50000,
      outstandingBalanceGHS: parseFloat(formOutstanding) || 0,
      creditStatus: formCreditStatus,
      currencySettlement: 'Ghana Cedis (GH₵)',
      bankDetails: {
        bankName: formBankName,
        accountNumber: formAccountNo,
        branch: formBranch,
        momoMerchantNumber: formMomo
      },
      rating: editingSupplier ? editingSupplier.rating : 4.8,
      onTimeDeliveryRate: editingSupplier ? editingSupplier.onTimeDeliveryRate : 96.0,
      fulfillmentAccuracyRate: editingSupplier ? editingSupplier.fulfillmentAccuracyRate : 98.0,
      qualityComplianceRate: editingSupplier ? editingSupplier.qualityComplianceRate : 100.0,
      totalOrdersCompleted: editingSupplier ? editingSupplier.totalOrdersCompleted : 0,
      totalProcurementSpentGHS: editingSupplier ? editingSupplier.totalProcurementSpentGHS : 0,
      performanceHistory: editingSupplier ? editingSupplier.performanceHistory : [],
      suppliedCategories: formCategories,
      notes: formNotes
    };

    if (editingSupplier) {
      updateSupplier({
        ...supplierPayload,
        id: editingSupplier.id
      });
    } else {
      addSupplier(supplierPayload);
    }

    setIsAddModalOpen(false);
  };

  const handleSavePerformance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingSupplier) return;

    recordSupplierPerformance(evaluatingSupplier.id, {
      poNumber: perfPoNumber,
      orderDate: perfOrderDate,
      deliveryDate: perfDeliveryDate,
      onTime: perfOnTime,
      leadTimeDaysTaken: parseInt(perfLeadDays) || 2,
      itemsSummary: perfSummary || 'Routine agrochemical restock consignment',
      totalAmountGHS: parseFloat(perfAmountGHS) || 1000,
      qualityCheckPassed: perfQualityPass,
      defectNotes: perfDefectNotes,
      fulfillmentAccuracyRate: parseFloat(perfAccuracy) || 100,
      evaluatorNotes: perfEvaluatorNotes
    });

    setEvaluatingSupplier(null);
  };

  // Run AI Advisor Tool
  const triggerAiAdvisor = async (type: 'EVALUATE_VENDOR' | 'NEGOTIATE_TERMS' | 'ALTERNATIVE_SOURCING' | 'CUSTOM_QUERY', vendor?: Supplier) => {
    const targetVendor = vendor || aiSelectedVendor || suppliers[0];
    setAiSelectedVendor(targetVendor);
    setAiActionType(type);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiResultText(null);

    try {
      const response = await requestSupplierAiAdvisor({
        action: type,
        supplier: targetVendor,
        allSuppliers: suppliers,
        products: products,
        query: aiCustomQuery
      });

      setAiResultText(response.text);
      setAiIsFallback(response.isFallback);
    } catch (err: any) {
      setAiResultText('Failed to reach AI service.');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleCategory = (cat: ProductCategory) => {
    if (formCategories.includes(cat)) {
      setFormCategories(formCategories.filter(c => c !== cat));
    } else {
      setFormCategories([...formCategories, cat]);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              Agrochemical Vendor & Supplier Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store contact details, manage credit facilities, audit historical delivery performance, and leverage Gemini AI procurement intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerAiAdvisor('ALTERNATIVE_SOURCING')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>AI Procurement Advisor</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Registered Importers & Formulators</span>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900">{totalVendors} Vendors</div>
          <span className="text-[11px] text-slate-400">EPA Registered Ghanaian input distributors</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Approved Credit Line</span>
          <div className="text-2xl font-bold font-mono-tabular text-emerald-900">{formatGHS(totalCreditFacility)}</div>
          <span className="text-[11px] text-slate-400">Combined credit purchasing facility</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Outstanding Accounts Payable</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
              overallUtilization > 75 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {overallUtilization}% utilized
            </span>
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900">{formatGHS(totalOutstanding)}</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${overallUtilization > 75 ? 'bg-rose-500' : 'bg-emerald-600'}`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Avg On-Time Supply Velocity</span>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900">{avgOnTime}% On-Time</div>
          <span className="text-[11px] text-emerald-700 font-medium">100% EPA batch safety compliance</span>
        </div>
      </div>

      {/* Filter and Search Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor name, contact person, phone, city, or EPA ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Supplied Categories</option>
              <option value="HERBICIDE">Herbicides</option>
              <option value="FUNGICIDE">Fungicides</option>
              <option value="INSECTICIDE">Insecticides</option>
              <option value="FERTILIZER">Fertilizers</option>
              <option value="SEED_TREATMENT">Seed Treatment</option>
              <option value="EQUIPMENT_PPE">Equipment & PPE</option>
            </select>

            <select
              value={creditFilter}
              onChange={(e) => setCreditFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Credit Statuses</option>
              <option value="APPROVED">Approved Active</option>
              <option value="GOOD_STANDING">Good Standing</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PREPAID_ONLY">Prepaid Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendor Cards List */}
      <div className="space-y-4">
        {filteredSuppliers.map((supplier) => {
          const isExpanded = expandedVendorId === supplier.id;
          const utilizationPct = supplier.creditLimitGHS > 0 
            ? Math.round((supplier.outstandingBalanceGHS / supplier.creditLimitGHS) * 100) 
            : 0;
          const availableCredit = Math.max(0, (supplier.creditLimitGHS || 0) - (supplier.outstandingBalanceGHS || 0));

          return (
            <div 
              key={supplier.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Card Header & Primary Stats */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{supplier.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {supplier.creditStatus || 'APPROVED'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-tabular bg-slate-100 text-slate-600">
                      {supplier.epaLicenseNumber || 'EPA License Verified'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{supplier.rating || 4.8}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{supplier.city}, {supplier.region}</span>
                    <span>·</span>
                    <span>{supplier.address}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(supplier.suppliedCategories || []).map(cat => (
                      <span key={cat} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                        {cat.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/${(supplier.whatsappNumber || supplier.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${supplier.contactPerson}, this is AgroVault Retail Shop inquiring about agrochemical stock availability.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-700" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`mailto:${supplier.email}?subject=${encodeURIComponent(`AgroVault Agrochemical Supply Order Request`)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>Email PO</span>
                  </a>

                  <button
                    onClick={() => triggerAiAdvisor('EVALUATE_VENDOR', supplier)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-xs"
                    title="Audit vendor risk and performance with Gemini AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Audit</span>
                  </button>

                  <button
                    onClick={() => triggerAiAdvisor('NEGOTIATE_TERMS', supplier)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer shadow-xs"
                    title="Generate credit negotiation strategy"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    <span>Negotiate</span>
                  </button>

                  <button
                    onClick={() => openEditModal(supplier)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit supplier credentials"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3-Column Key Insights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-xs p-4 bg-slate-50/50">
                
                {/* Column 1: Contact Credentials */}
                <div className="space-y-2 p-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Contact Person & Line</span>
                  </span>
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <div>Official Rep: <strong>{supplier.contactPerson}</strong></div>
                    <div>Phone: <strong className="font-mono-tabular">{supplier.phone}</strong></div>
                    <div>Email: <strong className="font-mono-tabular">{supplier.email}</strong></div>
                    <div className="text-slate-500">
                      Standard Dispatch Turnaround: <strong>~{supplier.leadTimeDays} business days</strong>
                    </div>
                  </div>
                </div>

                {/* Column 2: Credit Terms & Working Capital */}
                <div className="space-y-2 p-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                    <span>Credit Terms & Limit ({CURRENCY_SYMBOL})</span>
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Agreed Terms:</span>
                      <strong className="text-slate-900">{supplier.paymentTerms}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Credit Limit:</span>
                      <strong className="font-mono-tabular">{formatGHS(supplier.creditLimitGHS || 0)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Outstanding Balance:</span>
                      <strong className="font-mono-tabular text-rose-700">{formatGHS(supplier.outstandingBalanceGHS || 0)}</strong>
                    </div>
                    
                    {/* Utilization Bar */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                        <span>Utilization</span>
                        <span>{utilizationPct}% ({formatGHS(availableCredit)} headroom)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${utilizationPct > 80 ? 'bg-rose-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, utilizationPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Historical Supply Performance */}
                <div className="space-y-2 p-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Supply Performance Record</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular">
                    <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">On-Time Rate</span>
                      <strong className="text-emerald-800 text-sm">{supplier.onTimeDeliveryRate || 95}%</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">Fulfillment Acc.</span>
                      <strong className="text-slate-900 text-sm">{supplier.fulfillmentAccuracyRate || 98}%</strong>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Lifetime Procurement:</span>
                    <strong className="font-mono-tabular text-slate-900">{formatGHS(supplier.totalProcurementSpentGHS || 0)}</strong>
                  </div>
                </div>

              </div>

              {/* Expandable Section Toggle */}
              <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setExpandedVendorId(isExpanded ? null : supplier.id)}
                  className="font-semibold text-emerald-850 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>
                    {isExpanded ? 'Hide Delivery Performance History' : `View Delivery History & Consignment Logs (${(supplier.performanceHistory || []).length})`}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    setEvaluatingSupplier(supplier);
                    setPerfPoNumber(`PO-AGV-2026-${Math.floor(100 + Math.random() * 900)}`);
                    setPerfSummary('');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log Delivery Evaluation</span>
                </button>
              </div>

              {/* Expanded Delivery History Log Table */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Historical Consignments & Quality Audits for {supplier.name}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Standard Quality Threshold: 100% EPA Compliant
                    </span>
                  </div>

                  {(supplier.performanceHistory || []).length === 0 ? (
                    <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                      No delivery logs recorded yet. Use the "Log Delivery Evaluation" button after receiving a restock consignment.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                          <tr>
                            <th className="py-2.5 px-3">PO Reference</th>
                            <th className="py-2.5 px-2">Order Date</th>
                            <th className="py-2.5 px-2">Delivered Date</th>
                            <th className="py-2.5 px-3">Items Summary</th>
                            <th className="py-2.5 px-2 text-right">Cost ({CURRENCY_SYMBOL})</th>
                            <th className="py-2.5 px-2 text-center">Velocity</th>
                            <th className="py-2.5 px-2 text-center">QA Check</th>
                            <th className="py-2.5 px-3">Inspector Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {supplier.performanceHistory.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-mono-tabular font-bold text-slate-900">
                                {record.poNumber}
                              </td>
                              <td className="py-2.5 px-2 text-slate-500 font-mono-tabular">
                                {record.orderDate}
                              </td>
                              <td className="py-2.5 px-2 text-slate-500 font-mono-tabular">
                                {record.deliveryDate} ({record.leadTimeDaysTaken}d)
                              </td>
                              <td className="py-2.5 px-3 text-slate-800">
                                {record.itemsSummary}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono-tabular font-semibold text-emerald-900">
                                {formatGHS(record.totalAmountGHS)}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  record.onTime ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {record.onTime ? 'On Time' : 'Delayed'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  record.qualityCheckPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {record.qualityCheckPassed ? 'Passed' : 'Defect'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                {record.evaluatorNotes || record.defectNotes || 'Standard receipt check.'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          AI PROCUREMENT ADVISOR MODAL / PANEL
          ───────────────────────────────────────────────────────────── */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[88vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    AgroVault AI Supply Chain & Procurement Intelligence
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Powered by Gemini AI · Grounded in Ghanaian agricultural logistics, EPA regulations, and chemical distributor terms
                </p>
              </div>
              <button 
                onClick={() => setAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Action Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => triggerAiAdvisor('EVALUATE_VENDOR', aiSelectedVendor || suppliers[0])}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                  aiActionType === 'EVALUATE_VENDOR'
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Vendor Risk Audit
              </button>

              <button
                type="button"
                onClick={() => triggerAiAdvisor('NEGOTIATE_TERMS', aiSelectedVendor || suppliers[0])}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                  aiActionType === 'NEGOTIATE_TERMS'
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Credit Terms Strategist
              </button>

              <button
                type="button"
                onClick={() => triggerAiAdvisor('ALTERNATIVE_SOURCING')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                  aiActionType === 'ALTERNATIVE_SOURCING'
                    ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Cross-Vendor Sourcing
              </button>
            </div>

            {/* Target Vendor Picker */}
            {aiActionType !== 'ALTERNATIVE_SOURCING' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Selected Vendor:</span>
                <select
                  value={aiSelectedVendor?.id || suppliers[0]?.id}
                  onChange={(e) => {
                    const found = suppliers.find(s => s.id === e.target.value);
                    if (found) {
                      setAiSelectedVendor(found);
                      triggerAiAdvisor(aiActionType, found);
                    }
                  }}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Question input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiCustomQuery}
                onChange={(e) => setAiCustomQuery(e.target.value)}
                placeholder="Ask custom question e.g. Which distributor offers the best terms for bulk Glyphosate?"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiCustomQuery.trim()) {
                    triggerAiAdvisor('CUSTOM_QUERY');
                  }
                }}
              />
              <button
                onClick={() => aiCustomQuery.trim() && triggerAiAdvisor('CUSTOM_QUERY')}
                disabled={aiLoading}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                Ask AI
              </button>
            </div>

            {/* AI Output Content Window */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[220px] max-h-[380px] overflow-y-auto text-xs text-slate-800 space-y-2">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2 text-slate-500">
                  <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium">Synthesizing supply chain intelligence & Ghanaian trade terms...</p>
                </div>
              ) : aiResultText ? (
                <div className="whitespace-pre-wrap leading-relaxed space-y-2 font-sans">
                  {aiResultText}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Select an evaluation mode above to run AI supply chain intelligence.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Recommendations strictly conform to Ghana EPA guidelines and WHO Hazard Classes.</span>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ADD / EDIT SUPPLIER MODAL
          ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[88vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingSupplier ? 'Edit Vendor Credentials' : 'Register New Agrochemical Vendor'}
                </h3>
                <p className="text-xs text-slate-500">
                  Record official Ghana contact channels, credit terms, and EPA registration numbers
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
              
              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Company / Importer Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sidalco Ghana Ltd"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person & Title</label>
                  <input
                    type="text"
                    required
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. Samuel K. Mensah (Key Accounts)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+233 24 000 0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">WhatsApp Line</label>
                  <input
                    type="text"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="+233240000000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="orders@vendor.com.gh"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Location & EPA */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Accra / Tema / Kumasi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Region</label>
                  <input
                    type="text"
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="Greater Accra"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">EPA License ID</label>
                  <input
                    type="text"
                    value={formEpaLicense}
                    onChange={(e) => setFormEpaLicense(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-tabular"
                  />
                </div>
              </div>

              {/* Warehouse Address */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Physical Warehouse / Depot Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Heavy Industrial Area, Harbour Road, Tema"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Credit Terms & Finance */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                  <span>Credit Facility & Payment Settlement Terms</span>
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Payment Terms</label>
                    <select
                      value={formPaymentTerms}
                      onChange={(e) => setFormPaymentTerms(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-medium"
                    >
                      <option value="Net 30 Days Credit">Net 30 Days Credit</option>
                      <option value="Net 15 Days Credit">Net 15 Days Credit</option>
                      <option value="Net 45 Days Credit">Net 45 Days Credit</option>
                      <option value="Pay on Delivery / MoMo">Pay on Delivery / MoMo</option>
                      <option value="100% Advance Prepayment">100% Advance Prepayment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Credit Limit ({CURRENCY_SYMBOL})</label>
                    <input
                      type="number"
                      value={formCreditLimit}
                      onChange={(e) => setFormCreditLimit(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono-tabular font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Lead Time (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={formLeadTime}
                      onChange={(e) => setFormLeadTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono-tabular"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Bank Name & Branch</label>
                    <input
                      type="text"
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      placeholder="e.g. Stanbic Bank Ghana"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Bank Account / MoMo Line</label>
                    <input
                      type="text"
                      value={formAccountNo}
                      onChange={(e) => setFormAccountNo(e.target.value)}
                      placeholder="e.g. 9040003182901"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono-tabular"
                    />
                  </div>
                </div>
              </div>

              {/* Supplied Chemical Categories */}
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Authorized Chemical Categories</label>
                <div className="flex flex-wrap gap-2">
                  {(['HERBICIDE', 'FUNGICIDE', 'INSECTICIDE', 'FERTILIZER', 'SEED_TREATMENT', 'EQUIPMENT_PPE'] as ProductCategory[]).map(cat => {
                    const isSelected = formCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {editingSupplier ? 'Save Updates' : 'Register Vendor'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LOG DELIVERY PERFORMANCE MODAL
          ───────────────────────────────────────────────────────────── */}
      {evaluatingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Consignment Performance</h3>
                <p className="text-xs text-slate-500">Log delivery lead time, on-time status, and EPA batch inspection</p>
              </div>
              <button onClick={() => setEvaluatingSupplier(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePerformance} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div>Vendor: <strong className="text-slate-900">{evaluatingSupplier.name}</strong></div>
                <div>Standard Lead Time: <span className="font-mono-tabular">{evaluatingSupplier.leadTimeDays} business days</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">PO Number</label>
                  <input
                    type="text"
                    required
                    value={perfPoNumber}
                    onChange={(e) => setPerfPoNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Consignment Value ({CURRENCY_SYMBOL})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={perfAmountGHS}
                    onChange={(e) => setPerfAmountGHS(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Delivered On-Time?</label>
                  <select
                    value={perfOnTime ? 'YES' : 'NO'}
                    onChange={(e) => setPerfOnTime(e.target.value === 'YES')}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-medium"
                  >
                    <option value="YES">Yes · On-Time</option>
                    <option value="NO">No · Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Actual Lead Time (Days)</label>
                  <input
                    type="number"
                    value={perfLeadDays}
                    onChange={(e) => setPerfLeadDays(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Quality Inspection</label>
                  <select
                    value={perfQualityPass ? 'PASS' : 'FAIL'}
                    onChange={(e) => setPerfQualityPass(e.target.value === 'PASS')}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-medium"
                  >
                    <option value="PASS">Pass · 100% Intact</option>
                    <option value="FAIL">Defect / Leaks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Items Delivered Summary</label>
                <input
                  type="text"
                  value={perfSummary}
                  onChange={(e) => setPerfSummary(e.target.value)}
                  placeholder="e.g. 50 units GlyphoMax 480 SL + 30 units Apron Star"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Quality & EPA Inspection Notes</label>
                <input
                  type="text"
                  value={perfEvaluatorNotes}
                  onChange={(e) => setPerfEvaluatorNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvaluatingSupplier(null)}
                  className="flex-1 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg cursor-pointer"
                >
                  Commit Performance Log
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
