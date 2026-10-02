import React, { useState } from 'react';
import { useAgroStore } from '../context/AgroStoreContext';
import { LedgerAccount, LedgerType, Customer } from '../types/agrochemical';
import { formatGHS, CURRENCY_SYMBOL } from '../utils/currency';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Download, 
  Plus, 
  Wallet, 
  Building2, 
  Smartphone, 
  Users, 
  CreditCard, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight,
  X,
  CheckCircle2
} from 'lucide-react';

export const BookkeepingDashboard: React.FC = () => {
  const { 
    ledger, 
    customers, 
    financialSummary, 
    addLedgerExpense, 
    recordCreditRepayment 
  } = useAgroStore();

  const [activeSubTab, setActiveSubTab] = useState<'LEDGER' | 'RECEIVABLES' | 'PL_STATEMENT'>('LEDGER');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  
  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Logistics & Fuel');
  const [expenseAccount, setExpenseAccount] = useState<LedgerAccount>('BANK_ACCOUNT');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseRef, setExpenseRef] = useState('');

  // Repayment Modal
  const [repayingCustomer, setRepayingCustomer] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccount, setRepayAccount] = useState<LedgerAccount>('MOBILE_MONEY');

  const filteredLedger = ledger.filter(entry => {
    const matchesAccount = accountFilter === 'ALL' || entry.account === accountFilter;
    const matchesType = typeFilter === 'ALL' || entry.type === typeFilter;
    return matchesAccount && matchesType;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!amt || amt <= 0) return;

    addLedgerExpense({
      amount: amt,
      category: expenseCategory,
      description: expenseDesc || `${expenseCategory} payment`,
      account: expenseAccount,
      reference: expenseRef || `EXP-${Date.now().toString().slice(-4)}`
    });

    setIsExpenseModalOpen(false);
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseRef('');
  };

  const handleRecordRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingCustomer) return;
    const amt = parseFloat(repayAmount);
    if (!amt || amt <= 0) return;

    recordCreditRepayment(repayingCustomer.id, amt, repayAccount);
    setRepayingCustomer(null);
    setRepayAmount('');
  };

  const exportCSV = () => {
    const headers = ['Date', 'Reference', 'Type', 'Category', 'Account', 'Flow', 'Amount', 'Description'];
    const rows = filteredLedger.map(e => [
      new Date(e.date).toLocaleDateString(),
      e.referenceId,
      e.type,
      `"${e.category}"`,
      e.account,
      e.entryFlow,
      e.amount.toFixed(2),
      `"${e.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrovault_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const grossMargin = financialSummary.totalRevenue > 0 
    ? ((financialSummary.grossProfit / financialSummary.totalRevenue) * 100).toFixed(1) 
    : '0.0';

  const netMargin = financialSummary.totalRevenue > 0 
    ? ((financialSummary.netProfit / financialSummary.totalRevenue) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-6 pb-16">
      
      {/* Financial KPI Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Sales Revenue</span>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900">
            {formatGHS(financialSummary.totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-400">Zero-rated agricultural sales</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Cost of Goods Sold (COGS)</span>
          <div className="text-2xl font-bold font-mono-tabular text-slate-700">
            {formatGHS(financialSummary.cogs)}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium font-mono-tabular">
            Gross Margin: {grossMargin}%
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Operating Expenses</span>
          <div className="text-2xl font-bold font-mono-tabular text-slate-700">
            {formatGHS(financialSummary.operatingExpenses)}
          </div>
          <span className="text-[11px] text-slate-400">Logistics, permits & storage</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Net Realized Profit</span>
          <div className={`text-2xl font-bold font-mono-tabular ${financialSummary.netProfit >= 0 ? 'text-emerald-800' : 'text-red-600'}`}>
            {formatGHS(financialSummary.netProfit)}
          </div>
          <span className="text-[11px] text-emerald-800 font-medium font-mono-tabular">
            Net Margin: {netMargin}%
          </span>
        </div>
      </div>

      {/* Liquid Account Balances Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cash in Till / Drawer</span>
          </div>
          <div className="text-lg font-bold font-mono-tabular text-white">
            {formatGHS(financialSummary.cashDrawerBalance)}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Commercial Bank Account</span>
          </div>
          <div className="text-lg font-bold font-mono-tabular text-white">
            {formatGHS(financialSummary.bankBalance)}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>MoMo Merchant Wallet</span>
          </div>
          <div className="text-lg font-bold font-mono-tabular text-white">
            {formatGHS(financialSummary.mobileMoneyBalance)}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5 text-rose-400" />
            <span>Accounts Receivable (Credit)</span>
          </div>
          <div className="text-lg font-bold font-mono-tabular text-rose-300">
            {formatGHS(financialSummary.outstandingReceivables)}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveSubTab('LEDGER')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'LEDGER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General Ledger Journal
          </button>
          <button
            onClick={() => setActiveSubTab('RECEIVABLES')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'RECEIVABLES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Farmer Store Credit (AR)
          </button>
          <button
            onClick={() => setActiveSubTab('PL_STATEMENT')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'PL_STATEMENT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profit & Loss Summary
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Tab 1: General Ledger Journal */}
      {activeSubTab === 'LEDGER' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Liquid & Debt Accounts</option>
              <option value="CASH_DRAWER">Cash Drawer</option>
              <option value="BANK_ACCOUNT">Commercial Bank</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="ACCOUNTS_RECEIVABLE">Accounts Receivable</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="INCOME_SALE">Sales Income</option>
              <option value="EXPENSE_PURCHASE">Stock Purchases</option>
              <option value="EXPENSE_OPERATIONAL">Operational Expenses</option>
              <option value="CUSTOMER_CREDIT_REPAYMENT">Credit Repayments</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Date & Time</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Flow</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((entry) => {
                    const isDebit = entry.entryFlow === 'DEBIT';
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-mono-tabular text-slate-600 whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular font-medium text-slate-800">
                          {entry.referenceId}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{entry.category}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono-tabular text-[11px]">
                          {entry.account.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 font-semibold text-[11px]">
                            {isDebit ? (
                              <span className="text-emerald-700 flex items-center">
                                <ArrowDownLeft className="w-3 h-3 mr-0.5" /> Debit (In)
                              </span>
                            ) : (
                              <span className="text-amber-800 flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" /> Credit (Out)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-tabular font-bold">
                          <span className={isDebit ? 'text-emerald-800' : 'text-slate-900'}>
                            {formatGHS(entry.amount)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 truncate max-w-xs">
                          {entry.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Accounts Receivable (Farmer Store Credit) */}
      {activeSubTab === 'RECEIVABLES' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <div className="font-semibold">Agricultural Credit Line & Harvest Settlement Ledger</div>
            <p className="text-slate-600 leading-relaxed">
              Enables registered farmers and farming cooperatives to draw certified crop protection and fertilizer inputs on credit with repayment scheduled post-harvest.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">Farmer / Cooperative</th>
                    <th className="py-3 px-3">Contact & Location</th>
                    <th className="py-3 px-3">Acreage & Crops</th>
                    <th className="py-3 px-3 text-right">Credit Limit</th>
                    <th className="py-3 px-3 text-right">Current Debt</th>
                    <th className="py-3 px-3 text-right">Available Credit</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const available = c.creditLimit - c.outstandingBalance;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-emerald-800 font-medium">
                            {c.kycVerified ? 'KYC Verified Landowner' : 'Standard'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{c.farmLocation}</div>
                          <div className="text-[10px] font-mono-tabular text-slate-400">{c.phone}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{c.farmSizeAcres} Acres</div>
                          <div className="text-[10px] text-slate-400">{c.primaryCrops.join(', ')}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-slate-700">
                          {formatGHS(c.creditLimit)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular font-bold">
                          <span className={c.outstandingBalance > 0 ? 'text-red-600' : 'text-slate-400'}>
                            {formatGHS(c.outstandingBalance)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-emerald-800 font-semibold">
                          {formatGHS(available)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.outstandingBalance > 0 ? (
                            <button
                              onClick={() => {
                                setRepayingCustomer(c);
                                setRepayAmount(c.outstandingBalance.toString());
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-md transition-colors cursor-pointer"
                            >
                              Record Repayment
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Zero Debt</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Profit & Loss Statement */}
      {activeSubTab === 'PL_STATEMENT' && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">AgroVault Retail Income Statement (P&L)</h3>
            <p className="text-xs text-slate-500">Period: Current Financial Year · Method: Accrual / Double-Entry</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Revenue (Gross Invoiced Sales)</span>
                <span className="font-mono-tabular">{formatGHS(financialSummary.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span>Crop Protection Chemical Sales</span>
                <span className="font-mono-tabular">{formatGHS(financialSummary.totalRevenue * 0.65)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span>Granular & Water-Soluble Fertilizers</span>
                <span className="font-mono-tabular">{formatGHS(financialSummary.totalRevenue * 0.35)}</span>
              </div>
            </div>

            {/* COGS */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Cost of Goods Sold (Wholesale Inflow Acquisition)</span>
                <span className="font-mono-tabular text-slate-700">-{formatGHS(financialSummary.cogs)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span>Raw Chemical Formulation Stock Cost</span>
                <span className="font-mono-tabular">{formatGHS(financialSummary.cogs)}</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between font-bold text-emerald-900 text-sm pt-2 border-t border-slate-200 bg-emerald-50/60 p-2.5 rounded-lg">
              <span>Gross Profit (Gross Margin: {grossMargin}%)</span>
              <span className="font-mono-tabular">{formatGHS(financialSummary.grossProfit)}</span>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Operating & Compliance Expenses</span>
                <span className="font-mono-tabular text-slate-700">-{formatGHS(financialSummary.operatingExpenses)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span>Hazardous Freight & Rural Farm Transport</span>
                <span className="font-mono-tabular">{formatGHS(financialSummary.operatingExpenses * 0.55)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span>EPA Chemical Facility Licensing & Inspection</span>
                <span className="font-mono-tabular">{formatGHS(financialSummary.operatingExpenses * 0.45)}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between font-bold text-slate-900 text-base pt-3 border-t-2 border-slate-900">
              <span>Net Operating Profit</span>
              <span className={`font-mono-tabular ${financialSummary.netProfit >= 0 ? 'text-emerald-900' : 'text-red-600'}`}>
                {formatGHS(financialSummary.netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Record Operational Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Expense Amount ({CURRENCY_SYMBOL})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 font-mono-tabular border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Expense Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Logistics & Delivery Fuel">Logistics & Delivery Fuel</option>
                  <option value="EPA Licensing & Permits">EPA Licensing & Permits</option>
                  <option value="Warehouse Cold Storage Power">Warehouse Cold Storage Power</option>
                  <option value="Safety Gear & Spill Kit Restock">Safety Gear & Spill Kit Restock</option>
                  <option value="Staff Agronomist Wages">Staff Agronomist Wages</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Deduct From Account</label>
                <select
                  value={expenseAccount}
                  onChange={(e) => setExpenseAccount(e.target.value as LedgerAccount)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono-tabular"
                >
                  <option value="BANK_ACCOUNT">Commercial Bank Account</option>
                  <option value="CASH_DRAWER">Cash Till / Drawer</option>
                  <option value="MOBILE_MONEY">Mobile Money Merchant</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Invoice / Receipt Reference</label>
                <input
                  type="text"
                  value={expenseRef}
                  onChange={(e) => setExpenseRef(e.target.value)}
                  placeholder="e.g. INV-FUEL-8902"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Description / Memo</label>
                <textarea
                  rows={2}
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Purpose of disbursement..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {repayingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Farmer Debt Settlement</h3>
                <p className="text-xs text-slate-500">{repayingCustomer.name}</p>
              </div>
              <button onClick={() => setRepayingCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div>Total Outstanding Debt: <strong className="font-mono-tabular text-red-600">{formatGHS(repayingCustomer.outstandingBalance)}</strong></div>
              <div>Farmer Farm Location: <span>{repayingCustomer.farmLocation}</span></div>
            </div>

            <form onSubmit={handleRecordRepayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Repayment Amount Received ({CURRENCY_SYMBOL})</label>
                <input
                  type="number"
                  step="0.01"
                  max={repayingCustomer.outstandingBalance}
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono-tabular border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Deposit Into Account</label>
                <select
                  value={repayAccount}
                  onChange={(e) => setRepayAccount(e.target.value as LedgerAccount)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="MOBILE_MONEY">Mobile Money Merchant</option>
                  <option value="CASH_DRAWER">Cash Drawer Till</option>
                  <option value="BANK_ACCOUNT">Commercial Bank Account</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRepayingCustomer(null)}
                  className="flex-1 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-850 hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
