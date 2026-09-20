import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Sale, SaleItem, Expense } from '../types';
import {
  FileText,
  Search,
  Calendar,
  RefreshCw,
  MessageSquare,
  Printer,
  Banknote,
  QrCode,
  CreditCard,
  X,
  Download,
  Filter,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Wallet,
  Tag,
  Receipt,
  Scale,
  Copy,
  ListPlus,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  generateSalesReportPDF,
  generateExpenseReportPDF,
  generateCompleteStatementPDF,
} from '../utils/pdfGenerator';

export const EXPENSE_CATEGORIES = [
  { value: 'Milk & Raw Materials', label: '🥛 Milk & Raw Materials' },
  { value: 'Electricity & Utility', label: '⚡ Electricity & Bills' },
  { value: 'Staff Wages & Salary', label: '👤 Staff Salary & Wages' },
  { value: 'Packaging & Dry Ice', label: '📦 Packaging & Cups' },
  { value: 'Shop Rent', label: '🏪 Shop Rent' },
  { value: 'Tea & Snacks', label: '☕ Tea & Refreshments' },
  { value: 'Maintenance & Repair', label: '🔧 Maintenance & Repair' },
  { value: 'Other Expenses', label: '📝 Other Expense' },
];

export interface BulkExpenseRow {
  id: string;
  amount: number | '';
  payment_method: 'cash' | 'upi';
  category: string;
  description: string;
}

interface SalesHistoryProps {
  triggerToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ triggerToast }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Main View: 'summary' | 'sales' | 'expenses'
  const [mainView, setMainView] = useState<'summary' | 'sales' | 'expenses'>('summary');

  // Sub-filter for payment mode: 'all' | 'cash' | 'upi'
  const [activePaymentTab, setActivePaymentTab] = useState<'all' | 'cash' | 'upi'>('all');

  // Time / Date range filter
  const [dateFilterPreset, setDateFilterPreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Expense Modal (Single & Multiple / Bulk Mode)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalMode, setExpenseModalMode] = useState<'single' | 'multiple'>('single');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Single Expense Form State
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expPayment, setExpPayment] = useState<'cash' | 'upi'>('cash');
  const [expCategory, setExpCategory] = useState('Milk & Raw Materials');
  const [expDescription, setExpDescription] = useState('');

  // Multiple / Bulk Expense Rows State
  const [bulkExpenseRows, setBulkExpenseRows] = useState<BulkExpenseRow[]>([
    { id: 'row-1', amount: '', payment_method: 'cash', category: 'Milk & Raw Materials', description: '' },
    { id: 'row-2', amount: '', payment_method: 'cash', category: 'Packaging & Dry Ice', description: '' },
    { id: 'row-3', amount: '', payment_method: 'cash', category: 'Electricity & Utility', description: '' },
  ]);

  // Receipt Modal state
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptItems, setReceiptItems] = useState<SaleItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);

  const loadAllData = async () => {
    try {
      const sls = await db.getSales();
      const items = await db.getSaleItems();
      const exps = await db.getExpenses();
      setSales(sls);
      setSaleItems(items);
      setExpenses(exps);
    } catch {
      triggerToast('Failed to load records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenReceipt = (sale: Sale) => {
    const items = saleItems.filter((i) => i.sale_id === sale.id);
    setSelectedSale(sale);
    setReceiptItems(items);
    setShowReceipt(true);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Date Filtering Calculations
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);

  // Filter function for Date
  const filterByDate = (created_at: string) => {
    const itemDate = new Date(created_at);
    const itemDateStr = itemDate.toDateString();

    if (dateFilterPreset === 'today') return itemDateStr === todayStr;
    if (dateFilterPreset === 'yesterday') return itemDateStr === yesterdayStr;
    if (dateFilterPreset === 'week') return itemDate >= weekAgo;
    if (dateFilterPreset === 'month') return itemDate >= monthAgo;
    if (dateFilterPreset === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
    }
    return true;
  };

  // Filtered Lists
  const dateFilteredSales = sales.filter((s) => filterByDate(s.created_at));
  const dateFilteredExpenses = expenses.filter((e) => filterByDate(e.created_at));

  // Sales Pools
  const cashSales = dateFilteredSales.filter((s) => s.payment_method === 'cash' || !s.payment_method);
  const upiSales = dateFilteredSales.filter((s) => s.payment_method === 'upi');

  // Expense Pools
  const cashExpenses = dateFilteredExpenses.filter((e) => e.payment_method === 'cash');
  const upiExpenses = dateFilteredExpenses.filter((e) => e.payment_method === 'upi');

  // Totals Calculations
  const totalSalesRevenue = dateFilteredSales.reduce((acc, s) => acc + s.total_price, 0);
  const totalCashSales = cashSales.reduce((acc, s) => acc + s.total_price, 0);
  const totalUpiSales = upiSales.reduce((acc, s) => acc + s.total_price, 0);

  const totalExpenseAmount = dateFilteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalCashExpenseAmount = cashExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalUpiExpenseAmount = upiExpenses.reduce((acc, e) => acc + e.amount, 0);

  // NET BALANCES (Sales - Expenses)
  const netCashInHand = totalCashSales - totalCashExpenseAmount;
  const netUpiBankBalance = totalUpiSales - totalUpiExpenseAmount;
  const netShopProfit = totalSalesRevenue - totalExpenseAmount;

  // Search filtered Sales
  const displaySales = dateFilteredSales.filter((s) => {
    if (activePaymentTab === 'cash' && s.payment_method !== 'cash' && s.payment_method !== undefined) return false;
    if (activePaymentTab === 'upi' && s.payment_method !== 'upi') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = s.id.toLowerCase().includes(q);
      const matchCustomer = s.customer_name?.toLowerCase().includes(q);
      const matchPhone = s.customer_phone?.includes(q);
      if (!matchId && !matchCustomer && !matchPhone) return false;
    }
    return true;
  });

  // Search filtered Expenses
  const displayExpenses = dateFilteredExpenses.filter((e) => {
    if (activePaymentTab === 'cash' && e.payment_method !== 'cash') return false;
    if (activePaymentTab === 'upi' && e.payment_method !== 'upi') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchCat = e.category?.toLowerCase().includes(q);
      if (!matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Date label string
  const getDateLabel = () => {
    if (dateFilterPreset === 'today') return `Today (${new Date().toLocaleDateString('en-IN')})`;
    if (dateFilterPreset === 'yesterday') return `Yesterday (${yesterday.toLocaleDateString('en-IN')})`;
    if (dateFilterPreset === 'week') return 'Last 7 Days';
    if (dateFilterPreset === 'month') return 'Last 30 Days';
    if (dateFilterPreset === 'custom') {
      return `${customStartDate || 'Start'} to ${customEndDate || 'End'}`;
    }
    return 'All Time';
  };

  // -------------------------------------------------------------------------
  // EXPENSE HANDLERS (SINGLE & MULTIPLE BULK ENTRY)
  // -------------------------------------------------------------------------

  // Helper to add a blank row to bulk list
  const handleAddBulkRow = () => {
    setBulkExpenseRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        amount: '',
        payment_method: 'cash',
        category: 'Other Expenses',
        description: '',
      },
    ]);
  };

  // Helper to add multiple blank rows
  const handleAddMultipleEmptyRows = (count: number) => {
    const newRows: BulkExpenseRow[] = Array.from({ length: count }, (_, i) => ({
      id: `row-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      amount: '',
      payment_method: 'cash',
      category: 'Other Expenses',
      description: '',
    }));
    setBulkExpenseRows((prev) => [...prev, ...newRows]);
    triggerToast(`Added ${count} blank expense lines`, 'info');
  };

  // Helper to remove a row
  const handleRemoveBulkRow = (id: string) => {
    if (bulkExpenseRows.length <= 1) {
      setBulkExpenseRows([
        { id: `row-${Date.now()}`, amount: '', payment_method: 'cash', category: 'Milk & Raw Materials', description: '' },
      ]);
      return;
    }
    setBulkExpenseRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Helper to duplicate a row
  const handleDuplicateBulkRow = (row: BulkExpenseRow) => {
    setBulkExpenseRows((prev) => [
      ...prev,
      {
        ...row,
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      },
    ]);
    triggerToast(`Duplicated expense line`, 'info');
  };

  // Helper to update field in row
  const handleUpdateBulkRow = (id: string, field: keyof BulkExpenseRow, value: any) => {
    setBulkExpenseRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Quick 1-click Preset Add
  const handleQuickAddPreset = (category: string, defaultDesc: string, defaultAmount?: number) => {
    setBulkExpenseRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        amount: defaultAmount || '',
        payment_method: 'cash',
        category,
        description: defaultDesc,
      },
    ]);
    triggerToast(`Added preset line for "${defaultDesc}"`, 'info');
  };

  // 1. Single Expense Submit
  const handleAddSingleExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) {
      triggerToast('Please enter a valid expense amount (> ₹0)', 'error');
      return;
    }

    setIsSavingExpense(true);
    try {
      await db.createExpense({
        amount: Number(expAmount),
        payment_method: expPayment,
        category: expCategory,
        description: expDescription.trim() || expCategory,
      });

      triggerToast(
        `Added expense of ₹${expAmount} (${expPayment.toUpperCase()}) - ${expDescription || expCategory}`,
        'success'
      );
      setIsExpenseModalOpen(false);
      setExpAmount('');
      setExpDescription('');
      loadAllData();
    } catch {
      triggerToast('Failed to record expense', 'error');
    } finally {
      setIsSavingExpense(false);
    }
  };

  // 2. Multiple / Bulk Expenses Submit
  const handleSaveBulkExpenses = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkExpenseRows.filter(
      (r) => r.amount !== '' && Number(r.amount) > 0
    );

    if (validRows.length === 0) {
      triggerToast('Please enter at least one valid expense amount (> ₹0)!', 'error');
      return;
    }

    setIsSavingExpense(true);
    try {
      const listToInsert = validRows.map((r) => ({
        amount: Number(r.amount),
        payment_method: r.payment_method,
        category: r.category,
        description: r.description.trim() || r.category,
      }));

      await db.createMultipleExpenses(listToInsert);

      const totalBulkAmount = validRows.reduce((acc, r) => acc + Number(r.amount), 0);
      triggerToast(
        `Successfully saved ${validRows.length} expenses (Total: -₹${totalBulkAmount.toLocaleString('en-IN')})! 📉`,
        'success'
      );

      setIsExpenseModalOpen(false);
      // Reset bulk rows to fresh defaults
      setBulkExpenseRows([
        { id: 'row-1', amount: '', payment_method: 'cash', category: 'Milk & Raw Materials', description: '' },
        { id: 'row-2', amount: '', payment_method: 'cash', category: 'Packaging & Dry Ice', description: '' },
        { id: 'row-3', amount: '', payment_method: 'cash', category: 'Electricity & Utility', description: '' },
      ]);
      loadAllData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save multiple expenses', 'error');
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Delete Expense Handler
  const handleDeleteExpense = async (id: string, amount: number, desc: string) => {
    if (window.confirm(`Delete expense of ₹${amount} (${desc})?`)) {
      try {
        await db.deleteExpense(id);
        triggerToast(`Deleted expense entry`, 'info');
        loadAllData();
      } catch {
        triggerToast('Failed to delete expense', 'error');
      }
    }
  };

  // PDF Download Handlers
  const handleDownloadSalesPDF = (type: 'cash' | 'upi' | 'all') => {
    const targetSales = type === 'cash' ? cashSales : type === 'upi' ? upiSales : dateFilteredSales;
    if (targetSales.length === 0) {
      triggerToast(`No ${type.toUpperCase()} sales found for ${getDateLabel()}!`, 'warning');
      return;
    }
    generateSalesReportPDF({
      type,
      sales: targetSales,
      saleItems,
      dateLabel: getDateLabel(),
    });
    triggerToast(`Downloaded ${type.toUpperCase()} Sales PDF Report! 📄`, 'success');
  };

  const handleDownloadExpensePDF = () => {
    if (dateFilteredExpenses.length === 0 && dateFilteredSales.length === 0) {
      triggerToast('No sales or expenses data found for this period to export!', 'warning');
      return;
    }
    generateExpenseReportPDF({
      expenses: dateFilteredExpenses,
      sales: dateFilteredSales,
      dateLabel: getDateLabel(),
    });
    triggerToast('Downloaded Expense Outflow PDF Report! 📄', 'success');
  };

  const handleDownloadCompleteStatementPDF = () => {
    if (dateFilteredExpenses.length === 0 && dateFilteredSales.length === 0) {
      triggerToast('No sales or expenses data found for this period to export!', 'warning');
      return;
    }
    generateCompleteStatementPDF({
      sales: dateFilteredSales,
      saleItems,
      expenses: dateFilteredExpenses,
      dateLabel: getDateLabel(),
    });
    triggerToast('Downloaded Complete Master Financial Statement PDF! 📄', 'success');
  };

  // WhatsApp Comprehensive Daily Summary Share
  const handleShareDaySummary = () => {
    const shop = db.getShopSettings();
    const dateLabel = getDateLabel();
    let msg = `🍦 *${shop.shop_name.toUpperCase()}*\n`;
    msg += `🗓️ *Daily Statement & Net Balance (${dateLabel})*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🟢 *TOTAL SALES:* ₹${totalSalesRevenue.toLocaleString('en-IN')} (${dateFilteredSales.length} bills)\n`;
    msg += `   ├ 💵 Cash Sales: ₹${totalCashSales.toLocaleString('en-IN')}\n`;
    msg += `   └ 📱 UPI Sales: ₹${totalUpiSales.toLocaleString('en-IN')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🔴 *TOTAL EXPENSES:* -₹${totalExpenseAmount.toLocaleString('en-IN')} (${dateFilteredExpenses.length} entries)\n`;
    msg += `   ├ 💵 Cash Expenses: -₹${totalCashExpenseAmount.toLocaleString('en-IN')}\n`;
    msg += `   └ 📱 UPI Expenses: -₹${totalUpiExpenseAmount.toLocaleString('en-IN')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *CURRENT NET BALANCE:*\n`;
    msg += `💵 *CASH IN DRAWER:* ₹${netCashInHand.toLocaleString('en-IN')}\n`;
    msg += `📱 *UPI IN BANK:* ₹${netUpiBankBalance.toLocaleString('en-IN')}\n`;
    msg += `💎 *TOTAL NET PROFIT:* *₹${netShopProfit.toLocaleString('en-IN')}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}\n`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>📊 Sales & Expenses</span>
          </h1>
          <p className="text-xs text-slate-400">
            Track shop expenses and view automatic Cash & UPI balance breakdowns
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Single Expense */}
          <button
            onClick={() => {
              setExpenseModalMode('single');
              setIsExpenseModalOpen(true);
            }}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-rose-950"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>

          {/* Add Multiple / Bulk Expenses */}
          <button
            onClick={() => {
              setExpenseModalMode('multiple');
              setIsExpenseModalOpen(true);
            }}
            className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 active:scale-95 text-rose-200 hover:text-white rounded-xl text-xs font-bold border border-rose-500/40 transition flex items-center gap-1.5 shadow-sm"
          >
            <ListPlus className="w-4 h-4 text-rose-400" />
            <span>+ Multiple Expenses</span>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleShareDaySummary}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Summary</span>
          </button>

          <button
            onClick={loadAllData}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-white/10 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. NET BALANCE CARDS (CASH IN HAND, UPI BALANCE, NET PROFIT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        
        {/* Card 1: NET CASH IN HAND (Cash Sales - Cash Expenses) */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 space-y-1.5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" />
              <span>Net Cash In Hand</span>
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
              💵 In Drawer
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${
              netCashInHand >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}>
              ₹{netCashInHand.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-1.5 mt-1 font-medium">
            <span className="text-emerald-400 font-semibold">+₹{totalCashSales} Sales</span>
            <span className="text-rose-400 font-semibold">-₹{totalCashExpenseAmount} Expenses</span>
          </div>
        </div>

        {/* Card 2: NET UPI IN BANK (UPI Sales - UPI Expenses) */}
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3.5 sm:p-4 space-y-1.5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              <span>Net UPI In Bank</span>
            </span>
            <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
              📱 Online / QR
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${
              netUpiBankBalance >= 0 ? 'text-purple-300' : 'text-rose-400'
            }`}>
              ₹{netUpiBankBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-1.5 mt-1 font-medium">
            <span className="text-purple-400 font-semibold">+₹{totalUpiSales} Sales</span>
            <span className="text-rose-400 font-semibold">-₹{totalUpiExpenseAmount} Expenses</span>
          </div>
        </div>

        {/* Card 3: NET TOTAL SHOP PROFIT (Total Sales - Total Expenses) */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-1.5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              <span>Net Shop Profit</span>
            </span>
            <span className="text-[9px] bg-white/10 text-slate-300 font-bold px-1.5 py-0.5 rounded">
              {dateFilteredSales.length} Sales • {dateFilteredExpenses.length} Expenses
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${
              netShopProfit >= 0 ? 'text-white' : 'text-rose-400'
            }`}>
              ₹{netShopProfit.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-1.5 mt-1 font-medium">
            <span className="text-slate-300 font-semibold">+₹{totalSalesRevenue} Total In</span>
            <span className="text-rose-400 font-semibold">-₹{totalExpenseAmount} Total Out</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. DATE FILTER & PDF DOWNLOADS */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Select Date Range</span>
          </div>

          <span className="text-[10px] text-purple-300 font-bold bg-purple-950/60 px-2.5 py-0.5 rounded-md border border-purple-500/20">
            {getDateLabel()}
          </span>
        </div>

        {/* Date Preset Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setDateFilterPreset('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
              dateFilterPreset === 'today'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilterPreset('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
              dateFilterPreset === 'yesterday'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setDateFilterPreset('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
              dateFilterPreset === 'week'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateFilterPreset('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
              dateFilterPreset === 'month'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateFilterPreset('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
              dateFilterPreset === 'custom'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Custom 📅
          </button>
        </div>

        {/* Custom Pickers */}
        {dateFilterPreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">From Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">To Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* PDF Download Action Buttons */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          {/* Master Statement Button (Primary) */}
          <button
            onClick={handleDownloadCompleteStatementPDF}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-purple-950 transition flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Download Master Statement PDF (+ Sales & - Expenses Ledger with Date/Time)</span>
          </button>

          {/* Sub-PDFs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleDownloadSalesPDF('cash')}
              className="py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cash Inflow (+) Sales PDF</span>
            </button>

            <button
              onClick={() => handleDownloadSalesPDF('upi')}
              className="py-2 px-3 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>UPI Inflow (+) Sales PDF</span>
            </button>

            <button
              onClick={handleDownloadExpensePDF}
              className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Expense Outflow (-) PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN NAVIGATION TABS: 'summary' | 'sales' | 'expenses' */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Main View Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 gap-1">
            <button
              onClick={() => setMainView('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mainView === 'summary'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Net Summary</span>
            </button>

            <button
              onClick={() => setMainView('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mainView === 'sales'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sales ({dateFilteredSales.length})</span>
            </button>

            <button
              onClick={() => setMainView('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mainView === 'expenses'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Expenses ({dateFilteredExpenses.length})</span>
            </button>
          </div>

          {/* Sub Payment Filter (All / Cash / UPI) */}
          {mainView !== 'summary' && (
            <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 gap-1">
              <button
                onClick={() => setActivePaymentTab('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  activePaymentTab === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActivePaymentTab('cash')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  activePaymentTab === 'cash' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setActivePaymentTab('upi')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  activePaymentTab === 'upi' ? 'bg-purple-600 text-white' : 'text-purple-400'
                }`}
              >
                UPI
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              mainView === 'expenses'
                ? 'Search expenses by description, category...'
                : 'Search sales by invoice #, customer name, phone...'
            }
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900 text-white placeholder-slate-500 rounded-xl border border-white/10 focus:border-purple-500 outline-none text-xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 my-auto text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CONTENT VIEWPORT */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : mainView === 'summary' ? (
        /* ========================================================================= */
        /* VIEW 1: NET SUMMARY (SALES VS EXPENSES STATEMENT) */
        /* ========================================================================= */
        <div className="space-y-3">
          {/* Income vs Expense Statement Card */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
              <span>Financial Statement ({getDateLabel()})</span>
              <span className="text-[10px] text-purple-300 font-bold">Ledger</span>
            </h3>

            <div className="space-y-2 text-xs">
              {/* Total Inflow */}
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-emerald-500/20">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Total Sales Revenue</span>
                </span>
                <span className="font-black text-emerald-400 text-sm">
                  +₹{totalSalesRevenue.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Total Outflow */}
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-rose-500/20">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span>Total Shop Expenses</span>
                </span>
                <span className="font-black text-rose-400 text-sm">
                  -₹{totalExpenseAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Net Cash & Bank */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold">Cash In Hand</span>
                  <span className="text-base font-black text-emerald-300 block mt-0.5">
                    ₹{netCashInHand.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-slate-500">Sales ₹{totalCashSales} - Exp ₹{totalCashExpenseAmount}</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold">UPI In Bank</span>
                  <span className="text-base font-black text-purple-300 block mt-0.5">
                    ₹{netUpiBankBalance.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-slate-500">Sales ₹{totalUpiSales} - Exp ₹{totalUpiExpenseAmount}</span>
                </div>
              </div>

              {/* Net Profit Banner */}
              <div className="p-3 bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/40 rounded-xl flex items-center justify-between mt-2">
                <div>
                  <span className="text-xs font-black text-white block">NET SHOP PROFIT</span>
                  <span className="text-[10px] text-slate-400">After deducting all shop expenses</span>
                </div>
                <span className={`text-xl font-black ${netShopProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  ₹{netShopProfit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Recent Lists Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Recent Sales Preview */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recent Sales ({dateFilteredSales.length})</span>
                </span>
                <button
                  onClick={() => setMainView('sales')}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-1.5">
                {dateFilteredSales.slice(0, 4).map((s) => (
                  <div key={s.id} onClick={() => handleOpenReceipt(s)} className="p-2 bg-slate-950 rounded-xl border border-white/5 flex justify-between items-center text-xs cursor-pointer hover:border-purple-500/30">
                    <div>
                      <span className="font-mono text-purple-300 font-bold">#{s.id.substring(5, 11).toUpperCase()}</span>
                      <span className="text-[10px] text-slate-400 block">{formatTime(s.created_at)} • {(s.payment_method || 'cash').toUpperCase()}</span>
                    </div>
                    <span className="font-black text-white">₹{s.total_price}</span>
                  </div>
                ))}
                {dateFilteredSales.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No sales recorded for this date range.</p>
                )}
              </div>
            </div>

            {/* Recent Expenses Preview */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>Recent Expenses ({dateFilteredExpenses.length})</span>
                </span>
                <button
                  onClick={() => setMainView('expenses')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-1.5">
                {dateFilteredExpenses.slice(0, 4).map((e) => (
                  <div key={e.id} className="p-2 bg-slate-950 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-white truncate block">{e.description}</span>
                      <span className="text-[10px] text-slate-400">{e.category} • {e.payment_method.toUpperCase()}</span>
                    </div>
                    <span className="font-black text-rose-400 shrink-0">-₹{e.amount}</span>
                  </div>
                ))}
                {dateFilteredExpenses.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No expenses recorded for this date range.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : mainView === 'expenses' ? (
        /* ========================================================================= */
        /* VIEW 2: EXPENSES MANAGEMENT LIST (WITH DESCRIPTION & CATEGORY) */
        /* ========================================================================= */
        <div className="space-y-2.5">
          {displayExpenses.length > 0 ? (
            displayExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-900/90 border border-rose-500/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-rose-500/40 transition"
              >
                {/* Left: Description, Category, Time */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">
                      {exp.description}
                    </span>
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                      {exp.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{formatDate(exp.created_at)} at {formatTime(exp.created_at)}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-300">Paid via {exp.payment_method.toUpperCase()}</span>
                  </div>
                </div>

                {/* Right: Amount & Delete */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Expense</span>
                    <span className="text-base sm:text-lg font-black text-rose-400">-₹{exp.amount.toLocaleString('en-IN')}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteExpense(exp.id, exp.amount, exp.description)}
                    className="p-2 bg-slate-950 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 rounded-xl border border-white/5 transition"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center bg-slate-900/60 rounded-2xl border border-white/5 text-slate-400 space-y-2">
              <TrendingDown className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-medium">No expenses recorded for this date range.</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={() => {
                    setExpenseModalMode('single');
                    setIsExpenseModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                >
                  + Add Single Expense
                </button>
                <button
                  onClick={() => {
                    setExpenseModalMode('multiple');
                    setIsExpenseModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 flex items-center gap-1.5"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>+ Add Multiple Expenses</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 3: SALES LISTING */
        /* ========================================================================= */
        <div className="space-y-2.5">
          {displaySales.length > 0 ? (
            displaySales.map((sale) => {
              const items = saleItems.filter((i) => i.sale_id === sale.id);
              const isUpi = sale.payment_method === 'upi';
              const isCard = sale.payment_method === 'card';

              return (
                <div
                  key={sale.id}
                  onClick={() => handleOpenReceipt(sale)}
                  className={`bg-slate-900/90 border rounded-2xl p-3.5 transition cursor-pointer active:scale-[0.99] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isUpi
                      ? 'border-purple-500/25 hover:border-purple-500/50'
                      : isCard
                      ? 'border-blue-500/25 hover:border-blue-500/50'
                      : 'border-emerald-500/25 hover:border-emerald-500/50'
                  }`}
                >
                  {/* Left: Bill Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-purple-400 text-xs font-black">
                        #{sale.id.substring(5, 11).toUpperCase()}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isUpi
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                            : isCard
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isUpi ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                        <span>{isUpi ? 'UPI / ONLINE' : isCard ? 'CARD' : 'CASH 💵'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatDate(sale.created_at)} at {formatTime(sale.created_at)}
                      </span>
                    </div>

                    {sale.customer_name && (
                      <p className="text-xs text-white font-bold">
                        Customer: <span className="text-purple-300">{sale.customer_name}</span>
                        {sale.customer_phone && <span className="text-slate-400 text-[10px] ml-1">({sale.customer_phone})</span>}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {items.map((item) => (
                        <span
                          key={item.id}
                          className="bg-slate-950 px-2 py-0.5 rounded-md text-[10px] text-slate-300 border border-white/5 font-medium"
                        >
                          🍦 {item.product_name} × <strong className="text-white">{item.quantity}</strong> (₹{item.price})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Bill Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        {isUpi ? 'UPI Amount' : 'Cash Amount'}
                      </span>
                      <span className="text-lg font-black text-white">₹{sale.total_price.toLocaleString('en-IN')}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReceipt(sale);
                      }}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Bill</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center bg-slate-900/60 rounded-2xl border border-white/5 text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-medium">No sales found for this date range.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD EXPENSE MODAL (SINGLE & MULTIPLE BULK ENTRY) */}
      {/* ========================================================================= */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)} />

          <div className="relative max-w-2xl w-full bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 space-y-4 animate-scale-pop max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Add Shop Expense
                </h3>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setExpenseModalMode('single')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  expenseModalMode === 'single'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>⚡ Single Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setExpenseModalMode('multiple')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  expenseModalMode === 'multiple'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Multiple Expenses ({bulkExpenseRows.length} Lines)</span>
              </button>
            </div>

            {/* =================================================================== */}
            {/* TAB 1: SINGLE EXPENSE ENTRY */}
            {/* =================================================================== */}
            {expenseModalMode === 'single' ? (
              <form onSubmit={handleAddSingleExpense} className="space-y-3.5 overflow-y-auto pr-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-300 font-bold">
                      Expense Amount (₹) *
                    </label>
                    {/* Quick Amount Chips */}
                    <div className="flex gap-1">
                      {[100, 200, 500, 1000, 2000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setExpAmount((prev) => (Number(prev) || 0) + val)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-rose-300 rounded font-bold transition"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      autoFocus
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-base font-bold text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Payment Mode (Cash or UPI) */}
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    Paid From *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExpPayment('cash')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                        expPayment === 'cash'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-white/10'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpPayment('upi')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                        expPayment === 'upi'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-white/10'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>UPI</span>
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-rose-500 outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description / Notes */}
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    Description / Notes *
                  </label>
                  <input
                    type="text"
                    required
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    placeholder="e.g. 50L Fresh Milk, Staff daily wage..."
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingExpense}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-950"
                  >
                    {isSavingExpense ? 'Saving...' : `Save Expense (-₹${expAmount || 0})`}
                  </button>
                </div>
              </form>
            ) : (
              /* =================================================================== */
              /* TAB 2: MULTIPLE / BULK EXPENSES ENTRY */
              /* =================================================================== */
              <form onSubmit={handleSaveBulkExpenses} className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* 1-Click Quick Preset Buttons */}
                <div className="space-y-1 shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>Quick Add Common Lines:</span>
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => handleQuickAddPreset('Milk & Raw Materials', 'Fresh Milk / Dairy')}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950/40 text-[11px] text-slate-300 hover:text-rose-300 border border-white/10 rounded-lg whitespace-nowrap transition active:scale-95"
                    >
                      + 🥛 Milk
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddPreset('Packaging & Dry Ice', 'Cups, Spoons & Packing')}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950/40 text-[11px] text-slate-300 hover:text-rose-300 border border-white/10 rounded-lg whitespace-nowrap transition active:scale-95"
                    >
                      + 📦 Cups / Packing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddPreset('Staff Wages & Salary', 'Staff Daily Wage')}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950/40 text-[11px] text-slate-300 hover:text-rose-300 border border-white/10 rounded-lg whitespace-nowrap transition active:scale-95"
                    >
                      + 👤 Staff Wage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddPreset('Electricity & Utility', 'Electricity / Ice Bill')}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950/40 text-[11px] text-slate-300 hover:text-rose-300 border border-white/10 rounded-lg whitespace-nowrap transition active:scale-95"
                    >
                      + ⚡ Power / Ice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddPreset('Tea & Snacks', 'Staff Tea & Snacks')}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950/40 text-[11px] text-slate-300 hover:text-rose-300 border border-white/10 rounded-lg whitespace-nowrap transition active:scale-95"
                    >
                      + ☕ Tea / Refreshment
                    </button>
                  </div>
                </div>

                {/* Scrollable Rows List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px] max-h-[42vh]">
                  {bulkExpenseRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="bg-slate-950/90 border border-white/10 rounded-xl p-2.5 sm:p-3 space-y-2 hover:border-rose-500/30 transition shadow-sm"
                    >
                      {/* Top Bar of Row: Row Index, Payment Mode, Duplicate & Delete */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-500/30">
                          Expense #{idx + 1}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Payment Method Pills */}
                          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-white/10">
                            <button
                              type="button"
                              onClick={() => handleUpdateBulkRow(row.id, 'payment_method', 'cash')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                                row.payment_method === 'cash'
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Banknote className="w-3 h-3" />
                              <span>Cash</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBulkRow(row.id, 'payment_method', 'upi')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                                row.payment_method === 'upi'
                                  ? 'bg-purple-600 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <QrCode className="w-3 h-3" />
                              <span>UPI</span>
                            </button>
                          </div>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateBulkRow(row)}
                            className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-950/30 rounded-md transition"
                            title="Duplicate Line"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-md transition"
                            title="Delete Line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inputs Grid: Amount, Category, Description */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        {/* Amount */}
                        <div className="sm:col-span-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              min={0}
                              value={row.amount}
                              onChange={(e) =>
                                handleUpdateBulkRow(
                                  row.id,
                                  'amount',
                                  e.target.value === '' ? '' : Number(e.target.value)
                                )
                              }
                              placeholder="Amount *"
                              className="w-full pl-6 pr-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs font-bold text-white focus:border-rose-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Category */}
                        <div className="sm:col-span-4">
                          <select
                            value={row.category}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'category', e.target.value)}
                            className="w-full p-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:border-rose-500 outline-none"
                          >
                            {EXPENSE_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'description', e.target.value)}
                            placeholder="Description / Note (e.g. 50L milk)"
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Row Controls */}
                <div className="flex items-center justify-between gap-2 pt-1 shrink-0">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddBulkRow}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-rose-400" />
                      <span>+ Add Line</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMultipleEmptyRows(3)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white rounded-xl text-xs font-semibold border border-white/5 flex items-center gap-1 transition"
                    >
                      <span>+ 3 Lines</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-semibold">
                    {bulkExpenseRows.filter((r) => Number(r.amount) > 0).length} of {bulkExpenseRows.length} filled
                  </span>
                </div>

                {/* Live Real-time Calculation Summary Bar */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/20 text-xs flex items-center justify-between gap-2 flex-wrap shrink-0">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-400">
                      💵 Cash:{' '}
                      <strong className="text-emerald-400 font-black">
                        ₹{bulkExpenseRows
                          .filter((r) => r.payment_method === 'cash')
                          .reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
                          .toLocaleString('en-IN')}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      📱 UPI:{' '}
                      <strong className="text-purple-400 font-black">
                        ₹{bulkExpenseRows
                          .filter((r) => r.payment_method === 'upi')
                          .reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
                          .toLocaleString('en-IN')}
                      </strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Bulk Amount</span>
                    <span className="text-sm sm:text-base font-black text-rose-400">
                      -₹{bulkExpenseRows
                        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
                        .toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingExpense || bulkExpenseRows.filter((r) => Number(r.amount) > 0).length === 0}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-lg shadow-rose-950 transition"
                  >
                    {isSavingExpense
                      ? 'Saving...'
                      : `Save All (${bulkExpenseRows.filter((r) => Number(r.amount) > 0).length}) Expenses (-₹${bulkExpenseRows
                          .reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
                          .toLocaleString('en-IN')})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bill Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        sale={selectedSale}
        items={receiptItems}
      />
    </div>
  );
};
