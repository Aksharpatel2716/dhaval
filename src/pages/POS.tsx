import React, { useEffect, useState } from 'react';
import { db, getProductStatus } from '../services/db';
import { Product, CartItem, Sale, SaleItem } from '../types';
import { initialProducts } from '../services/db';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  CreditCard,
  QrCode,
  Banknote,
  X,
  Phone,
  User,
  AlertTriangle,
} from 'lucide-react';

interface POSProps {
  triggerToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigate?: (page: string) => void;
}

export const POS: React.FC<POSProps> = ({ triggerToast }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const p = localStorage.getItem('icecream_db_products');
      return p ? JSON.parse(p) : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  // Checkout Drawer / Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for printing bill receipt
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [lastSaleItems, setLastSaleItems] = useState<SaleItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await db.getProducts();
      if (data && data.length > 0) {
        setProducts(data);
      }
    } catch (e) {
      console.warn('POS loadProducts error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Quick Cart Add with Zero/Negative Stock Validation
  const handleAddToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      triggerToast(`⚠️ "${product.name}" is OUT OF STOCK (0 units left)!`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const currentQty = prevCart[existingIdx].quantity;
        if (currentQty >= product.current_stock) {
          triggerToast(
            `Stock limit reached! Only ${product.current_stock} units left for "${product.name}".`,
            'error'
          );
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIdx] = { ...updated[existingIdx], quantity: currentQty + 1 };
        triggerToast(`Added 1 more "${product.name}" (${currentQty + 1} total)`, 'info');
        return updated;
      } else {
        triggerToast(`Added "${product.name}" to bill`, 'success');
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  // Quick Quantity Update with Zero/Negative Stock Validation
  const handleUpdateQuantity = (productId: string, amount: number) => {
    const product = products.find((p) => p.id === productId);

    setCart((prevCart) => {
      const idx = prevCart.findIndex((item) => item.product.id === productId);
      if (idx === -1) return prevCart;

      const item = prevCart[idx];
      const newQty = item.quantity + amount;

      if (newQty <= 0) {
        triggerToast(`Removed "${item.product.name}" from bill`, 'info');
        return prevCart.filter((i) => i.product.id !== productId);
      }

      const availableStock = product ? product.current_stock : item.product.current_stock;
      if (newQty > availableStock) {
        triggerToast(
          `Stock error: Only ${availableStock} units available for "${item.product.name}". Stock cannot go below 0!`,
          'error'
        );
        return prevCart;
      }

      const updated = [...prevCart];
      updated[idx] = { ...item, quantity: newQty };
      return updated;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setIsCheckoutOpen(false);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const finalTotal = Math.max(0, cartSubtotal - (discountAmount || 0));

  // Checkout Complete (With Stock Minus & Error Prevention)
  const handleCompleteSale = async () => {
    if (cart.length === 0 || isSubmitting) return;

    // Fresh validation before checkout
    for (const item of cart) {
      const p = products.find((prod) => prod.id === item.product.id);
      if (!p || p.current_stock <= 0) {
        triggerToast(
          `Bill Error: "${item.product.name}" is Out of Stock (0 remaining). Remove it to proceed!`,
          'error'
        );
        return;
      }
      if (p.current_stock < item.quantity) {
        triggerToast(
          `Bill Error: "${p.name}" has only ${p.current_stock} units left, but ${item.quantity} are in cart!`,
          'error'
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Create sale and minus stock in DB
      const confirmedSale = await db.createSale(cart, {
        payment_method: paymentMethod,
        customer_name: customerName,
        customer_phone: customerPhone,
        discount: discountAmount,
      });

      // 2. Prepare receipt items
      const receiptItems: SaleItem[] = cart.map((item) => ({
        id: `sitem-${item.product.id}-${Date.now()}`,
        sale_id: confirmedSale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      }));

      // 3. Check for low stock (<= 10) or out of stock (0) to warn user
      cart.forEach((item) => {
        const prod = products.find((p) => p.id === item.product.id);
        if (prod) {
          const remaining = prod.current_stock - item.quantity;
          if (remaining === 0) {
            triggerToast(`🔴 Alert: "${prod.name}" is now OUT OF STOCK (0 units left)!`, 'error');
          } else if (remaining <= 10) {
            triggerToast(
              `⚠️ Low Stock Alert: "${prod.name}" has only ${remaining} units left (under 10)!`,
              'warning'
            );
          }
        }
      });

      setLastSale(confirmedSale);
      setLastSaleItems(receiptItems);
      setShowReceipt(true);
      setIsCheckoutOpen(false);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountAmount(0);

      triggerToast('Bill created & stock deducted successfully! 🍦', 'success');
      
      // Reload products to show freshly subtracted stock
      await loadProducts();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create bill', 'error');
      // Reload fresh stock on error
      loadProducts();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get categories from products
  const dynamicCategories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-3 pb-24">
      {/* Top Header & Search Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>🍦 Quick Billing</span>
            </h1>
            <p className="text-[11px] text-slate-400">Tap items to add to bill. Stock auto-deducts.</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-900/40"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>₹{cartSubtotal} ({totalCartCount})</span>
            </button>
          )}
        </div>

        {/* Search & Category Pills */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flavors..."
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

          {/* Category Chips (Smooth Horizontal Scroll) */}
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
      </div>

      {/* Main Grid: Products Catalog */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {filteredProducts.map((p) => {
              const status = getProductStatus(p);
              const isOut = status === 'Out of Stock';
              const isLow = status === 'Low Stock'; // <= 10 units
              const cartItem = cart.find((i) => i.product.id === p.id);
              const inCartQty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={p.id}
                  className={`bg-slate-900/90 border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${
                    inCartQty > 0
                      ? 'border-purple-500/60 ring-1 ring-purple-500/40 bg-purple-950/20'
                      : isOut
                      ? 'border-rose-500/30 bg-rose-950/10 opacity-75'
                      : isLow
                      ? 'border-amber-500/30 bg-amber-950/10'
                      : 'border-white/[0.08]'
                  }`}
                >
                  {/* Image Area */}
                  <div className="h-28 bg-slate-950 rounded-xl mb-2 flex items-center justify-center overflow-hidden relative">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className={`w-full h-full object-cover ${isOut ? 'grayscale contrast-50' : ''}`}
                      />
                    ) : (
                      <span className="text-3xl">🍦</span>
                    )}

                    {/* Stock Status Badge */}
                    <span
                      className={`absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        isOut
                          ? 'bg-rose-600 text-white'
                          : isLow
                          ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                          : 'bg-slate-950/90 text-emerald-400 border border-white/10'
                      }`}
                    >
                      {isOut ? '🔴 0 (OUT)' : isLow ? `⚠️ ${p.current_stock}` : `🟢 ${p.current_stock}`}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="mb-2">
                    <h3 className="text-xs font-bold text-white line-clamp-1">{p.name}</h3>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-sm font-black text-purple-300">₹{p.price}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">{p.category}</span>
                    </div>
                  </div>

                  {/* Add to Cart / Qty Control Button */}
                  <div>
                    {isOut ? (
                      <button
                        disabled
                        className="w-full py-2 bg-rose-950/40 text-rose-400 border border-rose-500/20 text-[10px] font-black text-center rounded-xl cursor-not-allowed"
                      >
                        Out of Stock
                      </button>
                    ) : inCartQty > 0 ? (
                      <div className="flex items-center justify-between bg-purple-600/30 border border-purple-500/40 rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(p.id, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-purple-600 active:scale-90 text-white rounded-lg transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-white">{inCartQty} in bill</span>
                        <button
                          onClick={() => handleUpdateQuantity(p.id, 1)}
                          disabled={inCartQty >= p.current_stock}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition active:scale-90 ${
                            inCartQty >= p.current_stock
                              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add to Bill</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-slate-900/60 rounded-2xl border border-white/5 text-slate-400 space-y-2">
            <span className="text-3xl block">🔍</span>
            <p className="text-xs">No ice creams found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE STICKY FLOATING CART BAR */}
      {/* ========================================================================= */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-lg mx-auto z-40 animate-slide-up">
          <div
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-purple-400/40 active:scale-98 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-purple-200 block">{totalCartCount} item(s) selected</span>
                <span className="text-base font-black text-white">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white text-purple-950 px-4 py-2 rounded-xl text-xs font-black shadow-lg">
              <span>Checkout</span>
              <span>⚡</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE CHECKOUT BOTTOM DRAWER / SHEET */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />

          <div className="relative max-w-lg mx-auto w-full bg-slate-900 border-t border-white/10 rounded-t-3xl p-4 max-h-[85vh] flex flex-col justify-between overflow-y-auto animate-slide-up z-10 space-y-3.5 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Bill & Checkout</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearCart}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase px-2 py-1 bg-rose-950/40 rounded-lg border border-rose-500/20"
                >
                  Clear All
                </button>
                <button onClick={() => setIsCheckoutOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart Items Summary */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {cart.map((item) => {
                const prod = products.find((p) => p.id === item.product.id);
                const isMax = prod ? item.quantity >= prod.current_stock : false;

                return (
                  <div key={item.product.id} className="bg-slate-950 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-white truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-400">
                        ₹{item.product.price} × {item.quantity} = <span className="text-purple-300 font-bold">₹{item.product.price * item.quantity}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-slate-900 text-slate-300 active:scale-90 rounded-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black text-white w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        disabled={isMax}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-90 ${
                          isMax ? 'bg-slate-900 text-slate-600 cursor-not-allowed' : 'bg-purple-600 text-white'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-slate-950 text-slate-400 border border-white/5'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash 💵</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'upi'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-950 text-slate-400 border border-white/5'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI 📱</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-950 text-slate-400 border border-white/5'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card 💳</span>
                </button>
              </div>
            </div>

            {/* Optional Customer info (Phone & Name) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Customer Name (Opt)</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full pl-8 pr-2 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">WhatsApp No. (Opt)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9106835321"
                    className="w-full pl-8 pr-2 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Final Total & Submit */}
            <div className="border-t border-white/10 pt-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase">Grand Total:</span>
                <span className="text-2xl font-black text-white">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                onClick={handleCompleteSale}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-sm font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                <Check className="w-5 h-5" />
                <span>{isSubmitting ? 'Deducting Stock...' : `Confirm & Create Bill (₹${cartSubtotal})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        sale={lastSale}
        items={lastSaleItems}
      />
    </div>
  );
};
