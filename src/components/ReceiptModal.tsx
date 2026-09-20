import React, { useState } from 'react';
import { Sale, SaleItem } from '../types';
import { db } from '../services/db';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  QrCode,
  Download,
  Receipt,
  Copy,
  Check,
  ShoppingBag,
  Award,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Banknote,
  Smartphone,
  CreditCard,
  Gift,
  Trash2,
} from 'lucide-react';
import { generateSingleInvoicePDF } from '../utils/pdfGenerator';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  items: SaleItem[];
  onDeleteSale?: (saleId: string) => Promise<void> | void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  items,
  onDeleteSale,
}) => {
  const [copied, setCopied] = useState(false);
  const [themeMode, setThemeMode] = useState<'clean' | 'dark' | 'thermal'>('clean');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !sale) return null;

  const shop = db.getShopSettings();
  const isSample = sale.payment_method === 'sample' || sale.is_sample === true;

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoicePDF = () => {
    generateSingleInvoicePDF(sale, items);
  };

  const getWhatsAppMessage = () => {
    let msg = `🍦 *${shop.shop_name.toUpperCase()}*\n`;
    msg += `📍 _${shop.address}_\n`;
    msg += `📞 *Mo:* ${shop.phone}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (isSample) {
      msg += `🎁 *FREE TASTING / SAMPLE DISPATCH SLIP*\n`;
      msg += `🔖 *Sample No:* #${sale.id.substring(5, 11).toUpperCase()}\n`;
      msg += `📅 *Date:* ${formatDate(sale.created_at)} at ${formatTime(sale.created_at)}\n`;
      if (sale.customer_name) msg += `👤 *Client / Recipient:* ${sale.customer_name} ${sale.customer_phone ? `(${sale.customer_phone})` : ''}\n`;
      msg += `📋 *Type:* 🎁 100% FREE PROMOTIONAL SAMPLE\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `*🍨 SAMPLE FLAVORS PROVIDED:*\n`;
      items.forEach((item, index) => {
        msg += `${index + 1}. *${item.product_name}* (Qty: *${item.quantity}* scoops/packs - Free)\n`;
      });
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 *TOTAL AMOUNT PAYABLE: ₹0 (FREE SAMPLE)*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `✅ *STATUS: SAMPLE DISPATCHED & VERIFIED*\n`;
      msg += `✨ _Enjoy your tasting sample from ${shop.shop_name}! We look forward to your valuable feedback and future orders!_ 🍨✨\n`;
    } else {
      msg += `🧾 *TAX INVOICE / BILL*\n`;
      msg += `🔖 *Invoice No:* #${sale.id.substring(5, 11).toUpperCase()}\n`;
      msg += `📅 *Date:* ${formatDate(sale.created_at)} at ${formatTime(sale.created_at)}\n`;
      if (sale.customer_name) msg += `👤 *Customer:* ${sale.customer_name} ${sale.customer_phone ? `(${sale.customer_phone})` : ''}\n`;
      msg += `💳 *Payment Mode:* ${(sale.payment_method || 'cash').toUpperCase()}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `*🍨 PURCHASED ITEMS:*\n`;
      items.forEach((item, index) => {
        msg += `${index + 1}. *${item.product_name}*\n   └ Qty: *${item.quantity}* × ₹${item.price} = *₹${item.total.toLocaleString('en-IN')}*\n`;
      });
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      if (sale.discount && sale.discount > 0) {
        msg += `🎁 *Discount Applied:* -₹${sale.discount}\n`;
      }
      msg += `💰 *GRAND TOTAL PAID: ₹${sale.total_price.toLocaleString('en-IN')}*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `✅ *STATUS: PAID & VERIFIED*\n`;
      msg += `🌟 _Thank you for visiting ${shop.shop_name}! Have a sweet day!_ 🍨✨\n`;
    }
    return encodeURIComponent(msg);
  };

  const handleShareWhatsApp = () => {
    const encoded = getWhatsAppMessage();
    const phone = sale.customer_phone ? sale.customer_phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = decodeURIComponent(getWhatsAppMessage());
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const isUpi = sale.payment_method === 'upi';
  const isCard = sale.payment_method === 'card';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative max-w-lg w-full bg-slate-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col my-3 animate-scale-pop">
        
        {/* Top App Header with Theme Switcher */}
        <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-950/95 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-2 rounded-xl shrink-0 ${
              isSample
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800 text-white border border-white/20'
            }`}>
              {isSample ? <Gift className="w-4 h-4 text-amber-400" /> : <Receipt className="w-4 h-4 text-white" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 truncate">
                <span>{isSample ? `Sample #${sale.id.substring(5, 11).toUpperCase()}` : `Invoice #${sale.id.substring(5, 11).toUpperCase()}`}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  isSample
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-200 border-slate-600'
                }`}>
                  {isSample ? '🎁 FREE SAMPLE' : 'PAID BILL'}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {formatDate(sale.created_at)} at {formatTime(sale.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 3 Theme Switchers */}
            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setThemeMode('clean')}
                title="Clean White Luxury Receipt"
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition ${
                  themeMode === 'clean'
                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💎 White
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                title="Dark Theme"
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition ${
                  themeMode === 'dark'
                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setThemeMode('thermal')}
                title="Thermal Paper Slip"
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition ${
                  themeMode === 'thermal'
                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🧾 Paper
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RECEIPT VIEWPORT (PRINT TARGET AREA) */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto max-h-[64vh]">
          
          <div
            id="print-receipt-area"
            className={`transition-all duration-300 relative overflow-hidden rounded-2xl shadow-xl ${
              themeMode === 'clean'
                ? 'bg-white text-slate-900 border border-slate-200 p-5 sm:p-6 font-sans'
                : themeMode === 'dark'
                ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border border-white/15 p-5 sm:p-6 font-sans'
                : 'bg-[#fafafa] text-slate-900 border-2 border-dashed border-slate-300 p-5 font-mono shadow-inner'
            }`}
          >
            {/* Top Zigzag Edge for Thermal Mode */}
            {themeMode === 'thermal' && (
              <div className="text-center text-[10px] tracking-widest text-slate-400 pb-2 -mt-3 select-none">
                ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
              </div>
            )}

            {/* 1. BRAND HERO HEADER */}
            <div className={`text-center pb-4 border-b ${
              themeMode === 'clean'
                ? 'border-slate-200'
                : themeMode === 'dark'
                ? 'border-white/15'
                : 'border-dashed border-slate-300'
            }`}>
              {/* Logo Icon Badge */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-950 text-white shadow-lg shadow-black/30 mb-2 border border-white/10">
                <span className="text-2xl drop-shadow">{isSample ? '🎁' : '🍨'}</span>
              </div>

              <h2 className={`text-lg sm:text-xl font-black uppercase tracking-wider ${
                themeMode === 'clean'
                  ? 'text-slate-950'
                  : themeMode === 'dark'
                  ? 'text-white'
                  : 'text-slate-900'
              }`}>
                {shop.shop_name}
              </h2>

              <p className={`text-xs font-bold mt-0.5 ${
                themeMode === 'clean'
                  ? 'text-slate-700'
                  : themeMode === 'dark'
                  ? 'text-slate-300'
                  : 'text-slate-700'
              }`}>
                {isSample ? '🎁 Free Tasting / Promotional Sample Pack' : shop.tagline}
              </p>

              <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] mt-1.5 ${
                themeMode === 'clean'
                  ? 'text-slate-500'
                  : themeMode === 'dark'
                  ? 'text-slate-400'
                  : 'text-slate-600'
              }`}>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span>{shop.address}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span>Mo: {shop.phone}</span>
                </span>
              </div>
            </div>

            {/* 2. INVOICE META & CUSTOMER DETAILS CARD */}
            <div className={`my-3.5 p-3 rounded-xl text-xs space-y-2 ${
              themeMode === 'clean'
                ? 'bg-slate-50 border border-slate-200 text-slate-700'
                : themeMode === 'dark'
                ? 'bg-slate-950/80 border border-white/10 text-slate-300'
                : 'bg-white border border-slate-200 text-slate-800'
            }`}>
              {/* Row 1: Invoice No & Date */}
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    {isSample ? 'Sample No:' : 'Invoice:'}
                  </span>
                  <span className="font-mono font-black text-xs text-slate-950 dark:text-white">
                    #{sale.id.substring(5, 11).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(sale.created_at)}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(sale.created_at)}</span>
                </div>
              </div>

              {/* Row 2: Customer Name (if any) */}
              {sale.customer_name && (
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200/50">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      {isSample ? 'Client / Recipient:' : 'Customer:'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {sale.customer_name}
                    </span>
                  </div>
                  {sale.customer_phone && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {sale.customer_phone}
                    </span>
                  )}
                </div>
              )}

              {/* Row 3: Payment Method Pill (Jet Black Theme) */}
              <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200/50">
                <span className="text-[10px] uppercase font-bold text-slate-500">Bill Type:</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider ${
                  isSample
                    ? 'bg-amber-500 text-slate-950 border border-amber-400'
                    : isUpi
                    ? 'bg-purple-900 text-purple-100 border border-purple-700'
                    : isCard
                    ? 'bg-blue-900 text-blue-100 border border-blue-700'
                    : 'bg-slate-900 text-white border border-slate-700'
                }`}>
                  {isSample ? <Gift className="w-3 h-3 text-slate-950" /> : isUpi ? <Smartphone className="w-3 h-3" /> : isCard ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                  <span>{isSample ? '🎁 FREE TRIAL SAMPLE (₹0)' : isUpi ? 'PAID VIA UPI' : isCard ? 'PAID VIA CARD' : 'PAID IN CASH'}</span>
                </span>
              </div>
            </div>

            {/* 3. ITEMS TABLE (SUPER CLEAN & BEAUTIFUL) */}
            <div className="py-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${
                    themeMode === 'clean'
                      ? 'border-slate-200 text-slate-500 bg-slate-50'
                      : themeMode === 'dark'
                      ? 'border-white/10 text-slate-400 bg-slate-950/50'
                      : 'border-slate-300 text-slate-600'
                  }`}>
                    <th className="py-2 px-1 font-black">Item & Flavor</th>
                    <th className="py-2 text-center font-black">Qty</th>
                    <th className="py-2 text-right font-black">Rate</th>
                    <th className="py-2 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  themeMode === 'clean'
                    ? 'divide-slate-100'
                    : themeMode === 'dark'
                    ? 'divide-white/5'
                    : 'divide-slate-200'
                }`}>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 pr-2 font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{isSample ? '🎁' : '🍨'}</span>
                          <div>
                            <span className={`block text-xs font-bold leading-tight ${
                              themeMode === 'clean'
                                ? 'text-slate-900'
                                : themeMode === 'dark'
                                ? 'text-white'
                                : 'text-slate-900'
                            }`}>
                              {item.product_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {isSample ? 'Free promotional sample' : 'Ice cream scoop / pack'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                          themeMode === 'clean'
                            ? 'bg-slate-100 text-slate-800'
                            : themeMode === 'dark'
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-slate-200 text-slate-900'
                        }`}>
                          × {item.quantity}
                        </span>
                      </td>
                      <td className={`py-2.5 text-right font-medium ${
                        themeMode === 'clean' ? 'text-slate-500' : themeMode === 'dark' ? 'text-slate-400' : 'text-slate-700'
                      }`}>
                        {isSample ? '₹0' : `₹${item.price}`}
                      </td>
                      <td className={`py-2.5 text-right font-black ${
                        isSample
                          ? 'text-amber-600 dark:text-amber-400'
                          : themeMode === 'clean'
                          ? 'text-slate-900'
                          : themeMode === 'dark'
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}>
                        {isSample ? 'FREE' : `₹${item.total.toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. TOTAL SUMMARY BREAKDOWN */}
            <div className={`mt-2 pt-3 border-t space-y-1.5 text-xs ${
              themeMode === 'clean'
                ? 'border-slate-200 text-slate-600'
                : themeMode === 'dark'
                ? 'border-white/10 text-slate-300'
                : 'border-dashed border-slate-300 text-slate-700'
            }`}>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Total Quantity Dispatched:</span>
                <span className="font-bold">{totalItemCount} scoops / packs</span>
              </div>

              {!isSample && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold">
                    ₹{(sale.total_price + (sale.discount || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {sale.discount && sale.discount > 0 && !isSample && (
                <div className="flex justify-between items-center text-[11px] text-rose-500 font-bold">
                  <span>Special Discount:</span>
                  <span>-₹{sale.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">{isSample ? 'Sample Type:' : 'Tax / GST:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isSample ? '100% Free Promotional Sample (₹0)' : 'Inclusive (0% CGST + 0% SGST)'}
                </span>
              </div>

              {/* GRAND TOTAL HERO BANNER (JET BLACK LUXURY THEME) */}
              <div className={`p-3.5 rounded-2xl flex items-center justify-between mt-3 shadow-lg ${
                isSample
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 font-black'
                  : 'bg-gradient-to-r from-slate-950 via-slate-900 to-black text-white border border-slate-800'
              }`}>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest block ${
                    isSample ? 'text-amber-950' : 'text-slate-300'
                  }`}>
                    {isSample ? '🎁 SAMPLE BILL TOTAL' : 'GRAND TOTAL PAID'}
                  </span>
                  <span className={`text-[10px] font-medium ${
                    isSample ? 'text-amber-900' : 'text-slate-400'
                  }`}>
                    {isSample ? '(100% Complimentary Trial)' : '(Net Amount Received)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black tracking-tight">
                    {isSample ? '₹0 FREE' : `₹${sale.total_price.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. VERIFIED AUTHENTICITY STAMP & BARCODE */}
            <div className={`pt-4 mt-3 border-t text-center space-y-2.5 ${
              themeMode === 'clean'
                ? 'border-slate-200'
                : themeMode === 'dark'
                ? 'border-white/10'
                : 'border-dashed border-slate-300'
            }`}>
              {/* Verified Shield Pill (Black / Dark Slate Theme) */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider border ${
                isSample
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}>
                <ShieldCheck className={`w-3.5 h-3.5 ${isSample ? 'text-amber-500' : 'text-slate-300'}`} />
                <span>{isSample ? 'OFFICIAL SAMPLE DISPATCH SLIP' : 'OFFICIAL VERIFIED POS RECEIPT'}</span>
              </div>

              {/* Simulated Crisp Barcode */}
              <div className="py-1 flex flex-col items-center justify-center opacity-70">
                <div className="font-mono text-[13px] tracking-[6px] text-slate-500 select-none">
                  |||| | ||||| || | |||| |||| | |||
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                  {sale.id.toUpperCase()}
                </span>
              </div>

              {/* Thank you note */}
              <p className={`text-xs font-bold ${
                themeMode === 'clean' ? 'text-purple-700' : themeMode === 'dark' ? 'text-purple-300' : 'text-slate-800'
              }`}>
                {isSample
                  ? `🍨 Enjoy your free tasting sample from ${shop.shop_name}! 🍨`
                  : `🍨 Thank you for choosing ${shop.shop_name}! Have a sweet day! 🍨`}
              </p>
              <p className="text-[9px] text-slate-400">
                {isSample ? 'Computer Generated Promotional Sample Slip' : 'Computer Generated Smart Electronic Tax Invoice'}
              </p>
            </div>

            {/* Bottom Zigzag Edge for Thermal Mode */}
            {themeMode === 'thermal' && (
              <div className="text-center text-[10px] tracking-widest text-slate-400 pt-2 -mb-3 select-none">
                ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FAST 1-TAP ACTION BUTTONS (WHATSAPP, PRINT, PDF, COPY) */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-950 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {/* 1. WhatsApp Button */}
            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* 2. Print Receipt */}
            <button
              onClick={handlePrint}
              className="py-2.5 px-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-950"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>

            {/* 3. Download PDF */}
            <button
              onClick={handleDownloadInvoicePDF}
              className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Save PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-slate-300 rounded-xl text-[11px] font-semibold border border-white/10 transition flex items-center justify-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            {/* Delete Bill (Restore Stock & Deduct from Hisab) */}
            {onDeleteSale && (
              <button
                disabled={isDeleting}
                onClick={async () => {
                  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
                  const isSample = sale.payment_method === 'sample' || sale.is_sample;
                  const confirmMsg = `Are you sure you want to DELETE ${isSample ? 'Sample Slip' : 'Bill'} #${sale.id.substring(5, 11).toUpperCase()}?\n\n• ${totalUnits} items will be RETURNED (+) to Stock Inventory\n• ₹${sale.total_price} will be REMOVED (-) from Sales Hisab\n\nશું તમે આ બિલ ડિલીટ કરવા માંગો છો? આઈસ્ક્રીમ સ્ટોકમાં પાછો જમા થઈ જશે.`;
                  if (window.confirm(confirmMsg)) {
                    setIsDeleting(true);
                    try {
                      await onDeleteSale(sale.id);
                      onClose();
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                className="py-2 bg-rose-950/40 hover:bg-rose-900/60 active:scale-98 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
                title="Delete this bill and restore stock"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Bill'}</span>
              </button>
            )}

            {/* Done / Close */}
            <button
              onClick={onClose}
              className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl text-[11px] font-bold transition"
            >
              Done (Close)
            </button>
          </div>
        </div>

        {/* Specialized Thermal Printer CSS Media Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
              background: none !important;
            }
            #print-receipt-area, #print-receipt-area * {
              visibility: visible !important;
            }
            #print-receipt-area {
              position: absolute !important;
              left: 50% !important;
              top: 0 !important;
              transform: translateX(-50%) !important;
              width: 100% !important;
              max-width: 320px !important;
              padding: 12px !important;
              color: #000000 !important;
              background: #ffffff !important;
              border: 1px solid #000000 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            #print-receipt-area * {
              color: #000000 !important;
              background: transparent !important;
              text-shadow: none !important;
              border-color: #e2e8f0 !important;
            }
          }
        `}} />
      </div>
    </div>
  );
};
