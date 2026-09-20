import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, SaleItem, Expense } from '../types';
import { db } from '../services/db';

interface PDFReportOptions {
  type: 'cash' | 'upi' | 'all';
  sales: Sale[];
  saleItems: SaleItem[];
  expenses?: Expense[];
  dateLabel: string;
  startDate?: string;
  endDate?: string;
}

export const generateSalesReportPDF = ({
  type,
  sales,
  saleItems,
  dateLabel,
}: PDFReportOptions) => {
  const shop = db.getShopSettings();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isCash = type === 'cash';
  const isUpi = type === 'upi';

  // Theme colors
  const primaryColor: [number, number, number] = isCash
    ? [5, 150, 105] // Emerald green for cash
    : isUpi
    ? [124, 58, 237] // Purple for UPI
    : [30, 41, 59]; // Slate dark for all

  const typeTitle = isCash
    ? 'CASH INFLOW (+) SALES REPORT'
    : isUpi
    ? 'UPI / ONLINE INFLOW (+) SALES REPORT'
    : 'COMPLETE SALES INFLOW (+) REPORT';

  // Calculate totals
  const totalAmount = sales.reduce((acc, s) => acc + s.total_price, 0);
  const totalBills = sales.length;

  // 1. HEADER - Shop Branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(shop.shop_name.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${shop.tagline} | Phone: ${shop.phone}`, 14, 17);
  doc.text(shop.address, 14, 22);

  // 2. REPORT TITLE & DATE BADGE
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(typeTitle, 14, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Period / Date Range: ${dateLabel}`, 14, 41);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`, 14, 46);

  // 3. KPI SUMMARY CARDS
  // Box 1: Total Bills
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 50, 58, 20, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INVOICES / BILLS', 18, 56);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalBills} Bills`, 18, 65);

  // Box 2: Total Collection (+)
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(5, 150, 105);
  doc.roundedRect(76, 50, 68, 20, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL INFLOW (+) RECEIVED', 80, 56);
  doc.setFontSize(14);
  doc.text(`+ Rs. ${totalAmount.toLocaleString('en-IN')}`, 80, 65);

  // Box 3: Payment Type Badge
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(148, 50, 48, 20, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('PAYMENT METHOD', 152, 56);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(isCash ? 'CASH ONLY' : isUpi ? 'UPI / ONLINE' : 'ALL MODES', 152, 65);

  // 4. TRANSACTION TABLE
  const tableRows = sales.map((sale, index) => {
    const items = saleItems.filter((i) => i.sale_id === sale.id);
    const itemsText = items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ');
    const saleDate = new Date(sale.created_at);
    const dateStr = saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = saleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const customerStr = sale.customer_name
      ? `${sale.customer_name}${sale.customer_phone ? ` (${sale.customer_phone})` : ''}`
      : '-';

    const isSample = sale.payment_method === 'sample' || sale.is_sample;
    return [
      (index + 1).toString(),
      `#${sale.id.substring(5, 11).toUpperCase()}`,
      `${dateStr}\n${timeStr}`,
      customerStr,
      itemsText || 'Ice Cream Items',
      isSample ? 'FREE SAMPLE' : (sale.payment_method || 'cash').toUpperCase(),
      isSample ? 'Rs. 0 (Free)' : `+ Rs. ${sale.total_price.toLocaleString('en-IN')}`,
    ];
  });

  autoTable(doc, {
    startY: 75,
    head: [['#', 'Invoice ID', 'Date & Time', 'Customer', 'Items Sold', 'Payment', 'Inflow (+) Amount']],
    body: tableRows.length > 0 ? tableRows : [['-', '-', '-', '-', 'No sales recorded for this period', '-', 'Rs. 0']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 32 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
      6: { cellWidth: 30, fontStyle: 'bold', halign: 'right', textColor: [5, 150, 105] },
    },
    foot: [
      [
        '',
        '',
        '',
        '',
        `TOTAL INFLOW (+) (${totalBills} Invoices)`,
        '',
        `+ Rs. ${totalAmount.toLocaleString('en-IN')}`,
      ],
    ],
    footStyles: {
      fillColor: [240, 253, 244],
      textColor: [5, 150, 105],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'right',
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - ${shop.shop_name} Official Sales Register`,
        14,
        doc.internal.pageSize.height - 8
      );
    },
  });

  // 5. DOWNLOAD PDF FILE
  const cleanDateStr = dateLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${isCash ? 'Cash_Sales_Report' : isUpi ? 'UPI_Sales_Report' : 'Sales_Inflow_Report'}_${cleanDateStr}.pdf`;
  doc.save(filename);
};

// =========================================================================
// EXPENSES & NET PROFIT PDF REPORT GENERATOR
// =========================================================================

interface ExpenseReportOptions {
  expenses: Expense[];
  sales: Sale[];
  dateLabel: string;
}

export const generateExpenseReportPDF = ({
  expenses,
  sales,
  dateLabel,
}: ExpenseReportOptions) => {
  const shop = db.getShopSettings();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [225, 29, 72]; // Rose/Red for expenses

  const totalSales = sales.reduce((acc, s) => acc + s.total_price, 0);
  const totalCashSales = sales.filter((s) => s.payment_method === 'cash' || !s.payment_method).reduce((acc, s) => acc + s.total_price, 0);
  const totalUpiSales = sales.filter((s) => s.payment_method === 'upi').reduce((acc, s) => acc + s.total_price, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalCashExpenses = expenses.filter((e) => e.payment_method === 'cash').reduce((acc, e) => acc + e.amount, 0);
  const totalUpiExpenses = expenses.filter((e) => e.payment_method === 'upi').reduce((acc, e) => acc + e.amount, 0);

  const netCashInHand = totalCashSales - totalCashExpenses;
  const netUpiBankBalance = totalUpiSales - totalUpiExpenses;
  const netProfit = totalSales - totalExpenses;

  // 1. HEADER
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(shop.shop_name.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${shop.tagline} | Phone: ${shop.phone}`, 14, 17);
  doc.text(shop.address, 14, 22);

  // 2. REPORT TITLE
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OUTFLOW (-) EXPENSES & NET PROFIT STATEMENT', 14, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Period / Date Range: ${dateLabel}`, 14, 41);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`, 14, 46);

  // 3. KPI NET BALANCE SUMMARY BOXES
  // Box 1: Total Expenses (-)
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(225, 29, 72);
  doc.roundedRect(14, 50, 58, 22, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(225, 29, 72);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL OUTFLOW (-) EXPENSES', 18, 56);
  doc.setFontSize(13);
  doc.text(`- Rs. ${totalExpenses.toLocaleString('en-IN')}`, 18, 65);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cash: -Rs.${totalCashExpenses} | UPI: -Rs.${totalUpiExpenses}`, 18, 70);

  // Box 2: Total Sales (+)
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(5, 150, 105);
  doc.roundedRect(76, 50, 58, 22, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL INFLOW (+) SALES', 80, 56);
  doc.setFontSize(13);
  doc.text(`+ Rs. ${totalSales.toLocaleString('en-IN')}`, 80, 65);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cash: +Rs.${totalCashSales} | UPI: +Rs.${totalUpiSales}`, 80, 70);

  // Box 3: Net Cash In Hand & UPI Balance (=)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(138, 50, 58, 22, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('NET BALANCE (=)', 142, 56);
  doc.setFontSize(12);
  doc.setTextColor(netProfit >= 0 ? 5 : 225, netProfit >= 0 ? 150 : 29, netProfit >= 0 ? 105 : 72);
  doc.text(`${netProfit >= 0 ? '+' : ''}Rs. ${netProfit.toLocaleString('en-IN')}`, 142, 64);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cash: Rs.${netCashInHand} | Bank: Rs.${netUpiBankBalance}`, 142, 70);

  // 4. EXPENSE ENTRIES TABLE
  const tableRows = expenses.map((exp, index) => {
    const expDate = new Date(exp.created_at);
    const dateStr = expDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = expDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    return [
      (index + 1).toString(),
      `${dateStr}\n${timeStr}`,
      exp.category || 'General Expense',
      exp.description || '-',
      (exp.payment_method || 'cash').toUpperCase(),
      `- Rs. ${exp.amount.toLocaleString('en-IN')}`,
    ];
  });

  autoTable(doc, {
    startY: 78,
    head: [['#', 'Date & Time', 'Category', 'Description / Details', 'Paid Via', 'Outflow (-) Amount']],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'No expenses recorded for this period', '-', '-', 'Rs. 0']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 35, fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      5: { cellWidth: 32, fontStyle: 'bold', halign: 'right', textColor: [225, 29, 72] },
    },
    foot: [
      [
        '',
        '',
        '',
        `TOTAL OUTFLOW (-) EXPENSES (${expenses.length} Entries)`,
        '',
        `- Rs. ${totalExpenses.toLocaleString('en-IN')}`,
      ],
    ],
    footStyles: {
      fillColor: [255, 241, 242],
      textColor: [225, 29, 72],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'right',
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - ${shop.shop_name} Official Expense Register`,
        14,
        doc.internal.pageSize.height - 8
      );
    },
  });

  const cleanDateStr = dateLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Expense_Outflow_Report_${cleanDateStr}.pdf`);
};

// =========================================================================
// MASTER FINANCIAL STATEMENT PDF (COMBINED + SALES & - EXPENSES LEDGER)
// =========================================================================

interface MasterStatementOptions {
  sales: Sale[];
  saleItems: SaleItem[];
  expenses: Expense[];
  dateLabel: string;
}

export const generateCompleteStatementPDF = ({
  sales,
  saleItems,
  expenses,
  dateLabel,
}: MasterStatementOptions) => {
  const shop = db.getShopSettings();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalSales = sales.reduce((acc, s) => acc + s.total_price, 0);
  const totalCashSales = sales.filter((s) => s.payment_method === 'cash' || !s.payment_method).reduce((acc, s) => acc + s.total_price, 0);
  const totalUpiSales = sales.filter((s) => s.payment_method === 'upi').reduce((acc, s) => acc + s.total_price, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalCashExpenses = expenses.filter((e) => e.payment_method === 'cash').reduce((acc, e) => acc + e.amount, 0);
  const totalUpiExpenses = expenses.filter((e) => e.payment_method === 'upi').reduce((acc, e) => acc + e.amount, 0);

  const netCashInHand = totalCashSales - totalCashExpenses;
  const netUpiBankBalance = totalUpiSales - totalUpiExpenses;
  const netProfit = totalSales - totalExpenses;

  // 1. TOP HEADER BANNER
  doc.setFillColor(15, 23, 42); // Midnight slate
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(shop.shop_name.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${shop.tagline} | Phone: ${shop.phone}`, 14, 17);
  doc.text(shop.address, 14, 22);

  // 2. REPORT TITLE & DATE BADGE
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('COMPLETE FINANCIAL STATEMENT (+ SALES & - EXPENSES)', 14, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Period / Date Range: ${dateLabel}`, 14, 41);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`, 14, 46);

  // 3. KPI 4 SUMMARY CARDS
  // Box 1: Total Sales (+)
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(5, 150, 105);
  doc.roundedRect(14, 50, 42, 22, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('(+) TOTAL SALES', 17, 56);
  doc.setFontSize(11);
  doc.text(`+ Rs.${totalSales.toLocaleString('en-IN')}`, 17, 63);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cash: ${totalCashSales} | UPI: ${totalUpiSales}`, 17, 69);

  // Box 2: Total Expenses (-)
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(225, 29, 72);
  doc.roundedRect(60, 50, 42, 22, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72);
  doc.setFont('helvetica', 'bold');
  doc.text('(-) TOTAL EXPENSES', 63, 56);
  doc.setFontSize(11);
  doc.text(`- Rs.${totalExpenses.toLocaleString('en-IN')}`, 63, 63);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cash: ${totalCashExpenses} | UPI: ${totalUpiExpenses}`, 63, 69);

  // Box 3: Cash In Hand (=)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(106, 50, 42, 22, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('(=) CASH IN HAND', 109, 56);
  doc.setFontSize(11);
  doc.setTextColor(netCashInHand >= 0 ? 5 : 225, netCashInHand >= 0 ? 150 : 29, netCashInHand >= 0 ? 105 : 72);
  doc.text(`Rs.${netCashInHand.toLocaleString('en-IN')}`, 109, 63);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`(Sales - Expenses)`, 109, 69);

  // Box 4: Final Net Profit (=)
  doc.setFillColor(netProfit >= 0 ? 240 : 255, netProfit >= 0 ? 253 : 241, netProfit >= 0 ? 244 : 242);
  doc.setDrawColor(netProfit >= 0 ? 5 : 225, netProfit >= 0 ? 150 : 29, netProfit >= 0 ? 105 : 72);
  doc.roundedRect(152, 50, 44, 22, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(netProfit >= 0 ? 5 : 225, netProfit >= 0 ? 150 : 29, netProfit >= 0 ? 105 : 72);
  doc.setFont('helvetica', 'bold');
  doc.text('(=) NET SHOP PROFIT', 155, 56);
  doc.setFontSize(11);
  doc.text(`${netProfit >= 0 ? '+' : ''}Rs.${netProfit.toLocaleString('en-IN')}`, 155, 63);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Bank UPI: Rs.${netUpiBankBalance}`, 155, 69);

  // 4. COMBINE & SORT TRANSACTIONS CHRONOLOGICALLY
  interface UnifiedTransaction {
    time: number;
    dateStr: string;
    timeStr: string;
    type: 'sale' | 'expense';
    ref: string;
    description: string;
    mode: string;
    amount: number;
  }

  const unifiedList: UnifiedTransaction[] = [
    ...sales.map((s) => {
      const d = new Date(s.created_at);
      const isSample = s.payment_method === 'sample' || s.is_sample;
      const items = saleItems.filter((i) => i.sale_id === s.id);
      const itemsText = items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ');
      return {
        time: d.getTime(),
        dateStr: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        type: 'sale' as const,
        ref: `#${s.id.substring(5, 11).toUpperCase()}`,
        description: isSample
          ? `[SAMPLE] ${s.customer_name ? `${s.customer_name} • ` : ''}${itemsText || 'Tasting Sample'}`
          : s.customer_name ? `${s.customer_name} • ${itemsText || 'Ice Cream'}` : itemsText || 'Ice Cream Sales',
        mode: isSample ? 'SAMPLE' : (s.payment_method || 'cash').toUpperCase(),
        amount: s.total_price,
      };
    }),
    ...expenses.map((e) => {
      const d = new Date(e.created_at);
      return {
        time: d.getTime(),
        dateStr: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        type: 'expense' as const,
        ref: e.category,
        description: e.description || e.category,
        mode: (e.payment_method || 'cash').toUpperCase(),
        amount: e.amount,
      };
    }),
  ].sort((a, b) => a.time - b.time);

  let runningBalance = 0;
  const tableRows = unifiedList.map((tx, idx) => {
    if (tx.type === 'sale') {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }

    const typeLabel = tx.type === 'sale' ? '(+) SALE' : '(-) EXPENSE';
    const amountLabel = tx.type === 'sale' ? `+ Rs.${tx.amount.toLocaleString('en-IN')}` : `- Rs.${tx.amount.toLocaleString('en-IN')}`;

    return [
      (idx + 1).toString(),
      `${tx.dateStr}\n${tx.timeStr}`,
      typeLabel,
      `${tx.ref}\n${tx.description}`,
      tx.mode,
      amountLabel,
      `Rs.${runningBalance.toLocaleString('en-IN')}`,
    ];
  });

  autoTable(doc, {
    startY: 78,
    head: [['#', 'Date & Time', 'Type (+ / -)', 'Ref & Description', 'Mode', 'Amount (+ / -)', 'Net Balance']],
    body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'No transactions recorded for this period', '-', '-', 'Rs. 0']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
      5: { cellWidth: 28, fontStyle: 'bold', halign: 'right' },
      6: { cellWidth: 26, fontStyle: 'bold', halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && (data.column.index === 2 || data.column.index === 5)) {
        const text = String(data.cell.raw);
        if (text.includes('(+)')) {
          data.cell.styles.textColor = [5, 150, 105]; // Green for (+)
        } else if (text.includes('(-)')) {
          data.cell.styles.textColor = [225, 29, 72]; // Red for (-)
        }
      }
    },
    foot: [
      [
        '',
        '',
        '',
        `SUMMARY: (+) Sales Rs.${totalSales} | (-) Expenses Rs.${totalExpenses}`,
        '',
        `NET RESULT:`,
        `${netProfit >= 0 ? '+' : ''}Rs.${netProfit.toLocaleString('en-IN')}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right',
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - ${shop.shop_name} Complete Master Financial Statement`,
        14,
        doc.internal.pageSize.height - 8
      );
    },
  });

  const cleanDateStr = dateLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Complete_Statement_Report_${cleanDateStr}.pdf`);
};

// =========================================================================
// SINGLE INVOICE PDF GENERATOR (A5 / 80mm POS FORMAT)
// =========================================================================
export const generateSingleInvoicePDF = (sale: Sale, items: SaleItem[]) => {
  const shop = db.getShopSettings();
  const isSample = sale.payment_method === 'sample' || sale.is_sample;
  const isUpi = sale.payment_method === 'upi';
  const isCard = sale.payment_method === 'card';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 175], // Clean A6/A5 compact receipt format
  });

  const primaryColor: [number, number, number] = isSample
    ? [217, 119, 6] // Amber / Gold for promotional samples
    : isUpi
    ? [124, 58, 237] // Violet
    : isCard
    ? [37, 99, 235] // Blue
    : [5, 150, 105]; // Emerald

  // 1. HEADER BANNER
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 105, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(shop.shop_name.toUpperCase(), 52.5, 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(shop.tagline, 52.5, 14, { align: 'center' });
  doc.text(`Mo: ${shop.phone} | ${shop.address}`, 52.5, 18.5, { align: 'center' });

  // 2. INVOICE META
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(
    isSample ? `SAMPLE SLIP: #${sale.id.substring(5, 11).toUpperCase()}` : `TAX INVOICE: #${sale.id.substring(5, 11).toUpperCase()}`,
    8,
    29
  );

  const saleDate = new Date(sale.created_at);
  const dateStr = saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = saleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${dateStr} at ${timeStr}`, 8, 33.5);

  if (sale.customer_name) {
    doc.setTextColor(30, 41, 59);
    doc.text(
      `${isSample ? 'Recipient / Client' : 'Customer'}: ${sale.customer_name} ${sale.customer_phone ? `(${sale.customer_phone})` : ''}`,
      8,
      38
    );
  }

  // Payment badge box
  doc.setFillColor(isSample ? 254 : isUpi ? 243 : 236, isSample ? 243 : isUpi ? 232 : 253, isSample ? 199 : isUpi ? 255 : 245);
  doc.setDrawColor(...primaryColor);
  doc.roundedRect(63, 26, 34, 8, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(isSample ? 'FREE SAMPLE (Rs. 0)' : isUpi ? 'PAID VIA UPI' : isCard ? 'PAID VIA CARD' : 'PAID IN CASH', 80, 31, { align: 'center' });

  // 3. ITEMS TABLE
  const startTableY = sale.customer_name ? 42 : 38;
  const tableRows = items.map((item, idx) => [
    (idx + 1).toString(),
    item.product_name,
    item.quantity.toString(),
    isSample ? 'Rs. 0 (Free)' : `Rs.${item.price}`,
    isSample ? 'Rs. 0' : `Rs.${item.total.toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: startTableY,
    head: [['#', 'Flavor / Item', 'Qty', 'Rate', 'Total']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fontSize: 7.5,
      fontStyle: 'bold',
      textColor: [15, 23, 42],
      fillColor: [241, 245, 249],
      cellPadding: 1.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 6, halign: 'center' },
      1: { cellWidth: 44 },
      2: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 80;

  // 4. TOTAL SUMMARY BLOCK
  doc.setDrawColor(226, 232, 240);
  doc.line(8, finalY + 2, 97, finalY + 2);

  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Sample Items: ${totalQty} units`, 8, finalY + 7);

  if (sale.discount && sale.discount > 0 && !isSample) {
    doc.setTextColor(225, 29, 72);
    doc.text(`Discount: -Rs.${sale.discount}`, 8, finalY + 11);
  }

  // Grand Total Box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(8, finalY + (sale.discount && !isSample ? 14 : 10), 89, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(isSample ? 'SAMPLE TOTAL (FREE):' : 'GRAND TOTAL PAID:', 12, finalY + (sale.discount && !isSample ? 21.5 : 17.5));
  doc.setFontSize(11);
  doc.text(
    isSample ? 'Rs. 0 (Free Trial)' : `Rs. ${sale.total_price.toLocaleString('en-IN')}`,
    93,
    finalY + (sale.discount && !isSample ? 21.5 : 17.5),
    { align: 'right' }
  );

  // 5. FOOTER & AUTHENTICITY NOTE
  const footerY = finalY + (sale.discount && !isSample ? 32 : 28);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    isSample ? 'Complimentary Tasting Sample - Creamee Ballz 🍨' : 'Thank you! Visit Creamee Ballz Again! 🍨',
    52.5,
    footerY,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    isSample ? 'Official Sample Dispatch Slip' : 'Computer Generated Smart Electronic Tax Invoice',
    52.5,
    footerY + 4,
    { align: 'center' }
  );
  doc.text(`Mo: ${shop.phone} | UPI: ${shop.upi_id}`, 52.5, footerY + 7.5, { align: 'center' });

  doc.save(`${isSample ? 'Sample_Slip' : 'Invoice'}_${sale.id.substring(5, 11).toUpperCase()}.pdf`);
};
