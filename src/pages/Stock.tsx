import React, { useEffect, useState } from 'react';
import { db, getProductStatus } from '../services/db';
import { Product, StockTransaction } from '../types';
import { initialProducts } from '../services/db';
import {
  Plus,
  Minus,
  Search,
  AlertTriangle,
  Package,
  Edit2,
  Trash2,
  X,
  History,
  Check,
  Zap,
  ArrowUpRight,
} from 'lucide-react';

interface StockProps {
  triggerToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const Stock: React.FC<StockProps> = ({ triggerToast }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const p = localStorage.getItem('icecream_db_products');
      return p ? JSON.parse(p) : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');

  // Inline custom quantity input per product card
  const [cardCustomQty, setCardCustomQty] = useState<{ [productId: string]: number | '' }>({});

  // Bulk / Custom Stock Adjustment Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkProduct, setBulkProduct] = useState<Product | null>(null);
  const [bulkQty, setBulkQty] = useState<number | ''>('');
  const [bulkMode, setBulkMode] = useState<'add' | 'remove' | 'set'>('add'); // 'add' = +N, 'remove' = -N, 'set' = exact value

  // Add / Edit Product Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Ice Cream');
  const [formPrice, setFormPrice] = useState<number>(200);
  const [formStock, setFormStock] = useState<number>(50);
  const [formMinStock, setFormMinStock] = useState<number>(10);
  const [formImage, setFormImage] = useState('');

  // History Log Modal / Toggle
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  const loadData = async () => {
    try {
      const prods = await db.getProducts();
      if (prods && prods.length > 0) {
        setProducts(prods);
      }
      const txs = await db.getTransactions();
      if (txs) {
        setTransactions(txs.slice(0, 30));
      }
    } catch {
      console.warn('Stock loadData fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick delta adjustment right from card (+1, +5, +10, -1) with Zero Prevention
  const handleQuickAdjust = async (product: Product, delta: number) => {
    if (delta < 0 && product.current_stock <= 0) {
      triggerToast(`Cannot reduce! "${product.name}" stock is already 0.`, 'error');
      return;
    }
    if (delta < 0 && product.current_stock + delta < 0) {
      triggerToast(`Cannot deduct ${Math.abs(delta)}! Only ${product.current_stock} units left in stock.`, 'error');
      return;
    }

    try {
      const updated = await db.quickAdjustStock(product.id, delta);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      
      const newStatus = getProductStatus(updated);
      if (newStatus === 'Out of Stock') {
        triggerToast(`🔴 "${product.name}" is now OUT OF STOCK (0 units)!`, 'error');
      } else if (newStatus === 'Low Stock') {
        triggerToast(`⚠️ "${product.name}" stock is now LOW (${updated.current_stock} units under 10)!`, 'warning');
      } else {
        triggerToast(
          `${delta > 0 ? '+' : ''}${delta} stock for "${product.name}" (Total: ${updated.current_stock})`,
          'success'
        );
      }
    } catch (err: any) {
      triggerToast(err.message || 'Stock adjustment failed', 'error');
    }
  };

  // Inline custom typed quantity submit on card (supports +50, -148, or deduct button)
  const handleInlineCustomAdjust = async (product: Product, isDeduct: boolean = false) => {
    const rawVal = cardCustomQty[product.id];
    if (rawVal === '' || rawVal === undefined || isNaN(Number(rawVal))) {
      triggerToast('Please enter a quantity (e.g. 50, 148)', 'error');
      return;
    }

    const enteredNumber = Number(rawVal);
    if (enteredNumber === 0) {
      triggerToast('Quantity must be greater than 0', 'error');
      return;
    }

    // Determine sign: if isDeduct is true OR user entered a negative number (e.g. -148)
    const delta = isDeduct ? -Math.abs(enteredNumber) : enteredNumber;
    await handleQuickAdjust(product, delta);

    // Clear input for this card
    setCardCustomQty((prev) => ({ ...prev, [product.id]: '' }));
  };

  // Open Bulk / Custom Stock Adjustment Modal for a Product
  const handleOpenBulkModal = (product: Product, defaultMode: 'add' | 'remove' | 'set' = 'add') => {
    setBulkProduct(product);
    setBulkQty('');
    setBulkMode(defaultMode);
    setIsBulkModalOpen(true);
  };

  // Submit Bulk / Custom Stock Adjustment Modal
  const handleBulkRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkProduct || bulkQty === '' || Number(bulkQty) < 0) {
      triggerToast('Please enter a valid quantity', 'error');
      return;
    }

    const qty = Math.abs(Number(bulkQty));

    try {
      if (bulkMode === 'add') {
        if (qty === 0) {
          triggerToast('Quantity to add must be greater than 0', 'error');
          return;
        }
        const updated = await db.quickAdjustStock(bulkProduct.id, qty, `Bulk Refill (+${qty})`);
        setProducts((prev) => prev.map((p) => (p.id === bulkProduct.id ? updated : p)));
        triggerToast(`Added +${qty} units to "${bulkProduct.name}" (New Total: ${updated.current_stock})! 🍦`, 'success');
      } else if (bulkMode === 'remove') {
        if (qty === 0) {
          triggerToast('Quantity to deduct must be greater than 0', 'error');
          return;
        }
        if (qty > bulkProduct.current_stock) {
          triggerToast(`Cannot deduct ${qty} units! Current stock is only ${bulkProduct.current_stock}.`, 'error');
          return;
        }
        const updated = await db.quickAdjustStock(bulkProduct.id, -qty, `Bulk Deduct (-${qty})`);
        setProducts((prev) => prev.map((p) => (p.id === bulkProduct.id ? updated : p)));
        triggerToast(`Deducted -${qty} units from "${bulkProduct.name}" (Remaining: ${updated.current_stock})`, 'warning');
      } else {
        // Set exact stock
        const updated = await db.adjustStock(bulkProduct.id, 'adjusted', qty, `Set exact stock to ${qty}`);
        setProducts((prev) => prev.map((p) => (p.id === bulkProduct.id ? updated : p)));
        triggerToast(`Updated "${bulkProduct.name}" exact stock to ${qty} units!`, 'success');
      }

      setIsBulkModalOpen(false);
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update stock', 'error');
    }
  };

  // Open modal for Adding New Product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Ice Cream');
    setFormPrice(200);
    setFormStock(50);
    setFormMinStock(10);
    setFormImage('');
    setIsModalOpen(true);
  };

  // Open modal for Editing Product
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(p.price);
    setFormStock(p.current_stock);
    setFormMinStock(p.min_stock || 10);
    setFormImage(p.image_url || '');
    setIsModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      triggerToast('Please enter product name', 'error');
      return;
    }
    if (formStock < 0) {
      triggerToast('Stock cannot be negative (minimum is 0)!', 'error');
      return;
    }

    try {
      if (editingProduct) {
        // Update existing
        await db.updateProduct(editingProduct.id, {
          name: formName.trim(),
          category: formCategory,
          price: Number(formPrice),
          current_stock: Number(formStock),
          min_stock: Number(formMinStock) || 10,
          image_url: formImage.trim() || undefined,
        });
        triggerToast(`Updated "${formName}" successfully!`, 'success');
      } else {
        // Create new
        await db.createProduct({
          name: formName.trim(),
          category: formCategory,
          price: Number(formPrice),
          current_stock: Number(formStock),
          min_stock: Number(formMinStock) || 10,
          max_stock: 500,
          initial_stock: Number(formStock),
          sold_quantity: 0,
          image_url: formImage.trim() || undefined,
        });
        triggerToast(`Added "${formName}" to inventory! 🍦`, 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save product', 'error');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" from inventory?`)) {
      try {
        await db.deleteProduct(id);
        triggerToast(`Deleted "${name}"`, 'info');
        loadData();
      } catch {
        triggerToast('Failed to delete product', 'error');
      }
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Summary Metrics (<= 10 is Low Stock, 0 is Out of Stock)
  const totalItems = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.current_stock, 0);
  const lowStockCount = products.filter((p) => getProductStatus(p) === 'Low Stock').length;
  const outOfStockCount = products.filter((p) => getProductStatus(p) === 'Out of Stock').length;

  const dynamicCategories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const status = getProductStatus(p);
    let matchesFilter = true;
    if (filterType === 'low') matchesFilter = status === 'Low Stock';
    if (filterType === 'out') matchesFilter = status === 'Out of Stock';
    return matchesSearch && matchesCategory && matchesFilter;
  });

  return (
    <div className="space-y-3 pb-24">
      {/* Header & Main Stats */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>📦 Stock Inventory</span>
          </h1>
          <p className="text-[11px] text-slate-400">
            Quick adjust stock (+10, -10, or custom qty)
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Logs */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1 transition active:scale-95"
            title="Stock Logs"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Logs</span>
          </button>

          {/* Add Ice Cream */}
          <button
            onClick={handleOpenAdd}
            className="px-3 py-2 bg-purple-600 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-md shadow-purple-900/40 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      {/* Quick Status KPI Cards (<=10 is Low Stock) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Total Flavors */}
        <div
          onClick={() => setFilterType('all')}
          className={`bg-slate-900/90 p-2.5 rounded-2xl border transition cursor-pointer active:scale-95 ${
            filterType === 'all' ? 'border-purple-500 bg-purple-950/30 ring-1 ring-purple-500/30' : 'border-white/5'
          }`}
        >
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Items</span>
          <span className="text-lg font-black text-white block mt-0.5">{totalItems}</span>
          <span className="text-[9px] text-purple-300 font-semibold">{totalStockUnits} units</span>
        </div>

        {/* Low Stock Warning (<= 10 units) */}
        <div
          onClick={() => setFilterType('low')}
          className={`bg-slate-900/90 p-2.5 rounded-2xl border transition cursor-pointer active:scale-95 ${
            filterType === 'low' ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/30' : 'border-white/5'
          }`}
        >
          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3" />
            <span>Low (&le;10)</span>
          </span>
          <span className="text-lg font-black text-amber-300 block mt-0.5">{lowStockCount}</span>
          <span className="text-[9px] text-slate-400 font-semibold">Refill now</span>
        </div>

        {/* Out of Stock (0 units) */}
        <div
          onClick={() => setFilterType('out')}
          className={`bg-slate-900/90 p-2.5 rounded-2xl border transition cursor-pointer active:scale-95 ${
            filterType === 'out' ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500/30' : 'border-white/5'
          }`}
        >
          <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">Out (0)</span>
          <span className="text-lg font-black text-rose-400 block mt-0.5">{outOfStockCount}</span>
          <span className="text-[9px] text-slate-400 font-semibold">0 left</span>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 text-white placeholder-slate-500 rounded-xl border border-white/10 focus:border-purple-500 outline-none text-sm transition"
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

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Stock Cards List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-2.5">
          {filteredProducts.map((p) => {
            const status = getProductStatus(p);
            const isOut = status === 'Out of Stock'; // 0
            const isLow = status === 'Low Stock';   // <= 10

            return (
              <div
                key={p.id}
                className={`bg-slate-900/90 border rounded-2xl p-3 flex flex-col justify-between transition ${
                  isOut
                    ? 'border-rose-500/40 bg-rose-950/15'
                    : isLow
                    ? 'border-amber-500/40 bg-amber-950/15'
                    : 'border-white/[0.08]'
                }`}
              >
                {/* Product Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🍦</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-purple-300">₹{p.price}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">{p.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition active:scale-90"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg transition active:scale-90"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stock Level Indicator (Click to open bulk modal) */}
                <div 
                  onClick={() => handleOpenBulkModal(p)}
                  className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between cursor-pointer active:scale-98 transition"
                  title="Click to add custom/bulk stock"
                >
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                      <span>Available Stock</span>
                      <Zap className="w-2.5 h-2.5 text-purple-400" />
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-black text-white">
                        {p.current_stock}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">units</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                      isOut
                        ? 'bg-rose-600 text-white'
                        : isLow
                        ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isOut ? '🔴 Out of Stock' : isLow ? '⚠️ Low Stock' : '🟢 In Stock'}
                  </span>
                </div>

                {/* 1. Quick Refill Buttons (-10, -1, +1, +10) */}
                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">⚡ Fast Adjust:</span>
                    <button
                      onClick={() => handleOpenBulkModal(p, 'add')}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline flex items-center gap-0.5"
                    >
                      <span>Custom Sheet</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => handleQuickAdjust(p, -10)}
                      disabled={p.current_stock <= 0}
                      className="py-1.5 bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 rounded-lg text-xs font-bold border border-rose-500/20 transition active:scale-90"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(p, -1)}
                      disabled={p.current_stock <= 0}
                      className="py-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-lg text-xs font-bold border border-white/10 transition active:scale-90"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(p, 1)}
                      className="py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-bold border border-purple-500/30 transition active:scale-90"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(p, 10)}
                      className="py-1.5 bg-emerald-600/40 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-xs font-black border border-emerald-500/40 transition active:scale-90"
                    >
                      +10
                    </button>
                  </div>

                  {/* 2. INLINE CUSTOM TYPE INPUT (TYPE ANY NUMBER E.G. +50 OR -148) */}
                  <div className="flex gap-1.5 pt-0.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={cardCustomQty[p.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setCardCustomQty((prev) => ({ ...prev, [p.id]: val }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineCustomAdjust(p, false);
                        }
                      }}
                      placeholder="Qty (e.g. 50)"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none font-bold"
                    />

                    <button
                      onClick={() => handleInlineCustomAdjust(p, true)}
                      title="Deduct typed quantity"
                      disabled={p.current_stock <= 0}
                      className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-black shrink-0 transition flex items-center gap-0.5 active:scale-95 shadow-sm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>- Deduct</span>
                    </button>

                    <button
                      onClick={() => handleInlineCustomAdjust(p, false)}
                      title="Add typed quantity"
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-lg text-xs font-black shrink-0 transition flex items-center gap-0.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-900 rounded-2xl border border-white/5 text-slate-400 space-y-2">
          <Package className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs">No products found matching criteria.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. BULK / CUSTOM STOCK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {isBulkModalOpen && bulkProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBulkModalOpen(false)} />

          <div className="relative max-w-sm w-full bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-5 z-10 space-y-4 animate-scale-pop">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Bulk Stock Adjustment
                </h3>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Summary Header */}
            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{bulkProduct.name}</span>
                <span className="text-[10px] text-purple-300 font-semibold">₹{bulkProduct.price} • {bulkProduct.category}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Current Stock</span>
                <span className="text-base font-black text-white">{bulkProduct.current_stock} units</span>
              </div>
            </div>

            <form onSubmit={handleBulkRefillSubmit} className="space-y-3.5">
              {/* 3 Mode Tabs: +Add, -Deduct, =Set Exact */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setBulkMode('add')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                    bulkMode === 'add'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkMode('remove')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                    bulkMode === 'remove'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Deduct (-)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkMode('set')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                    bulkMode === 'set'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Exact (=)</span>
                </button>
              </div>

              {/* Fast Preset Chips */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                  {bulkMode === 'remove' ? '⚡ Fast Deduct Presets:' : '⚡ Fast Refill Presets:'}
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {(bulkMode === 'remove'
                    ? [10, 25, 50, 100, 148]
                    : [25, 50, 100, 200, 500]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBulkQty(preset)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition active:scale-95 text-center border ${
                        bulkMode === 'remove'
                          ? 'bg-slate-950 hover:bg-rose-600/30 text-rose-300 hover:text-white border-rose-500/20'
                          : 'bg-slate-950 hover:bg-purple-600/30 text-purple-300 hover:text-white border-purple-500/20'
                      }`}
                    >
                      {bulkMode === 'remove' ? `-${preset}` : `+${preset}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Quantity Input */}
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  {bulkMode === 'add'
                    ? 'Quantity to Add (+)'
                    : bulkMode === 'remove'
                    ? 'Quantity to Deduct (-)'
                    : 'Set New Exact Stock Quantity (=)'} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={bulkMode === 'set' ? 0 : 1}
                    autoFocus
                    value={bulkQty}
                    onChange={(e) => setBulkQty(e.target.value === '' ? '' : Math.abs(Number(e.target.value)))}
                    placeholder={bulkMode === 'remove' ? 'e.g. 148, 50, 10...' : 'e.g. 50, 100, 250...'}
                    className={`w-full p-2.5 bg-slate-950 border rounded-xl text-sm font-black text-white outline-none ${
                      bulkMode === 'remove'
                        ? 'border-rose-500/40 focus:border-rose-500'
                        : 'border-white/10 focus:border-purple-500'
                    }`}
                  />
                </div>

                {/* Calculation / Warning Preview */}
                {bulkQty !== '' && (
                  <div className="mt-2 text-xs">
                    {bulkMode === 'remove' && (
                      Number(bulkQty) > bulkProduct.current_stock ? (
                        <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
                          ⚠️ Cannot deduct {bulkQty} units! Current stock is only {bulkProduct.current_stock}.
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-300 text-[11px] flex justify-between font-bold">
                          <span>New Stock Balance:</span>
                          <span className="text-rose-400 font-black">
                            {bulkProduct.current_stock} - {bulkQty} = {bulkProduct.current_stock - Number(bulkQty)} units
                          </span>
                        </div>
                      )
                    )}

                    {bulkMode === 'add' && (
                      <div className="p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-300 text-[11px] flex justify-between font-bold">
                        <span>New Stock Balance:</span>
                        <span className="text-emerald-400 font-black">
                          {bulkProduct.current_stock} + {bulkQty} = {bulkProduct.current_stock + Number(bulkQty)} units
                        </span>
                      </div>
                    )}

                    {bulkMode === 'set' && (
                      <div className="p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-300 text-[11px] flex justify-between font-bold">
                        <span>New Stock Balance:</span>
                        <span className="text-blue-400 font-black">
                          Exact {bulkQty} units
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkMode === 'remove' && bulkQty !== '' && Number(bulkQty) > bulkProduct.current_stock}
                  className={`flex-1 py-2.5 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg transition ${
                    bulkMode === 'remove'
                      ? (bulkQty !== '' && Number(bulkQty) > bulkProduct.current_stock)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                      : bulkMode === 'add'
                      ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                  }`}
                >
                  {bulkMode === 'remove'
                    ? `Confirm Deduct (-${bulkQty || 0})`
                    : bulkMode === 'add'
                    ? `Confirm Add (+${bulkQty || 0})`
                    : `Update Stock to ${bulkQty || 0}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADD / EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 z-10 space-y-4 animate-scale-pop">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase">
                {editingProduct ? 'Edit Ice Cream Product' : 'Add New Ice Cream'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Flavor / Item Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Kesar Pista, Choco Dip..."
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  >
                    <option value="Ice Cream">Ice Cream</option>
                    <option value="1 Kg Pack">1 Kg Pack</option>
                    <option value="Cone & Cups">Cone & Cups</option>
                    <option value="Kulfi">Kulfi</option>
                    <option value="Tubs & Family">Tubs & Family</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Opening Stock (units) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Low Alert Limit</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="/images/mava_malai.jpg"
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-900/30"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STOCK AUDIT HISTORY MODAL */}
      {/* ========================================================================= */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />

          <div className="relative max-w-lg w-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 z-10 space-y-4 max-h-[85vh] flex flex-col justify-between animate-scale-pop">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-black text-white uppercase">Stock Audit & Activity Log</h3>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-950 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{tx.product_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{tx.notes}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        tx.action_type === 'sold'
                          ? 'bg-rose-500/20 text-rose-400'
                          : tx.action_type === 'added'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {tx.action_type === 'added' ? '+' : tx.action_type === 'sold' ? '-' : ''}{tx.quantity} units
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        {tx.prev_stock} → {tx.new_stock}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">No stock transactions recorded yet.</p>
              )}
            </div>

            <button
              onClick={() => setIsHistoryOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-white/10 transition mt-2"
            >
              Close Logs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
