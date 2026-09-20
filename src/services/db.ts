import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Sale, SaleItem, Expense, StockTransaction, CartItem, ShopSettings, StockSecurity, DeletedSaleRecord } from '../types';

// Configuration keys for localStorage
const SB_URL_KEY = 'icecream_supabase_url';
const SB_KEY_KEY = 'icecream_supabase_key';
const SHOP_SETTINGS_KEY = 'icecream_shop_settings';
const STOCK_SECURITY_KEY = 'icecream_stock_security';

let supabase: SupabaseClient | null = null;

// Default Shop Settings
export const defaultShopSettings: ShopSettings = {
  shop_name: 'Creamee Ballz 🍨',
  tagline: 'Fresh & Delicious Creamee Ballz 🍨',
  phone: '+91 91068 35321',
  address: 'Main Bazaar Road, Gujarat, India',
  upi_id: 'creameeballz@upi',
};

// Initialize Supabase Client if keys are configured
export const initSupabase = (url: string, key: string): boolean => {
  try {
    if (!url || !key) {
      supabase = null;
      return false;
    }
    // Clean URL: remove trailing /rest/v1 or /rest/v1/ or trailing slashes
    const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const cleanKey = key.trim();
    supabase = createClient(cleanUrl, cleanKey);
    return true;
  } catch (error) {
    console.error('Supabase initialization failed:', error);
    supabase = null;
    return false;
  }
};

const DEFAULT_SUPABASE_URL = 'https://tcikymhncoqgqpzxrjlw.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaWt5bWhuY29xZ3Fwenhyamx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDUzMDUsImV4cCI6MjEwNTIyMTMwNX0.sfzAxgU-bnADEeyJuMVY5AWxxya8mfucDftbXtILtVw';

// Check and load stored Supabase settings
const loadStoredSupabase = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  const url = localStorage.getItem(SB_URL_KEY) || envUrl;
  const key = localStorage.getItem(SB_KEY_KEY) || envKey;
  if (url && key) {
    initSupabase(url, key);
  }
};

loadStoredSupabase();

export const isSupabaseConnected = (): boolean => {
  return supabase !== null;
};

export const getSupabaseConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return {
    url: localStorage.getItem(SB_URL_KEY) || envUrl,
    key: localStorage.getItem(SB_KEY_KEY) || envKey,
  };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (!url || !key) {
    localStorage.removeItem(SB_URL_KEY);
    localStorage.removeItem(SB_KEY_KEY);
    supabase = null;
  } else {
    const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const cleanKey = key.trim();
    localStorage.setItem(SB_URL_KEY, cleanUrl);
    localStorage.setItem(SB_KEY_KEY, cleanKey);
    initSupabase(cleanUrl, cleanKey);
  }
};

// ==========================================
// LOCAL STORAGE SIMULATOR (FALLBACK DATABASE)
// ==========================================

const LOCAL_PRODUCTS = 'icecream_db_products';
const LOCAL_SALES = 'icecream_db_sales';
const LOCAL_SALE_ITEMS = 'icecream_db_sale_items';
const LOCAL_EXPENSES = 'icecream_db_expenses';
const LOCAL_TRANSACTIONS = 'icecream_db_transactions';
const LOCAL_DELETED_SALES = 'icecream_db_deleted_sales';

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Crunchy Mava Malai',
    category: 'Ice Cream',
    price: 200,
    current_stock: 0,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/mava_malai.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Chocolate Crunchy',
    category: 'Ice Cream',
    price: 200,
    current_stock: 0,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/chocolate_crunchy.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Crunchy Vanilla',
    category: 'Ice Cream',
    price: 200,
    current_stock: 0,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/crunchy_vanilla.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Crunchy Strawberry',
    category: 'Ice Cream',
    price: 200,
    current_stock: 0,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/crunchy_strawberry.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Crunchy Orange',
    category: 'Ice Cream',
    price: 200,
    current_stock: 0,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/crunchy_orange.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // 1 Kg Pack Section (5 Flavors @ ₹600)
  {
    id: 'prod-1kg-1',
    name: 'Crunchy Mava Malai (1 Kg)',
    category: '1 Kg Pack',
    price: 600,
    current_stock: 0,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/mava_malai.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-1kg-2',
    name: 'Chocolate Crunchy (1 Kg)',
    category: '1 Kg Pack',
    price: 600,
    current_stock: 0,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/chocolate_crunchy.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-1kg-3',
    name: 'Crunchy Vanilla (1 Kg)',
    category: '1 Kg Pack',
    price: 600,
    current_stock: 0,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/crunchy_vanilla.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-1kg-4',
    name: 'Crunchy Strawberry (1 Kg)',
    category: '1 Kg Pack',
    price: 600,
    current_stock: 0,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/crunchy_strawberry.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-1kg-5',
    name: 'Crunchy Orange (1 Kg)',
    category: '1 Kg Pack',
    price: 600,
    current_stock: 0,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 0,
    sold_quantity: 0,
    image_url: '/images/crunchy_orange.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to initialize Local Storage Tables
export const seedLocalDatabase = (force = false) => {
  if (force || !localStorage.getItem(LOCAL_PRODUCTS) || localStorage.getItem(LOCAL_PRODUCTS) === '[]') {
    localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(initialProducts));
    localStorage.setItem(LOCAL_SALES, JSON.stringify([]));
    localStorage.setItem(LOCAL_SALE_ITEMS, JSON.stringify([]));
    localStorage.setItem(LOCAL_EXPENSES, JSON.stringify([]));

    const initialTransactions: StockTransaction[] = initialProducts.map((p) => ({
      id: `tx-init-${p.id}`,
      product_id: p.id,
      product_name: p.name,
      action_type: 'added',
      quantity: p.current_stock,
      prev_stock: 0,
      new_stock: p.current_stock,
      notes: 'Initial stock setup',
      created_at: p.created_at,
    }));
    localStorage.setItem(LOCAL_TRANSACTIONS, JSON.stringify(initialTransactions));
    localStorage.setItem('icecream_db_initialized', 'true');
  } else {
    // If local products already exist, ensure any missing initial products (e.g. 1 Kg packs) get added
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS) || '[]');
      const storedIds = new Set(stored.map((p: any) => p.id));
      const missing = initialProducts.filter((p) => !storedIds.has(p.id));
      if (missing.length > 0) {
        const merged = [...stored, ...missing];
        localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(merged));
      }
    } catch {
      // fallback
    }
  }

  if (!localStorage.getItem(SHOP_SETTINGS_KEY)) {
    localStorage.setItem(SHOP_SETTINGS_KEY, JSON.stringify(defaultShopSettings));
  }
};

// Run initial seed
seedLocalDatabase(true);

// --- Database operations mapping ---

export const db = {
  // SHOP SETTINGS
  getShopSettings(): ShopSettings {
    try {
      const stored = localStorage.getItem(SHOP_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.shop_name && parsed.shop_name.includes('Dhaval Seth')) {
          parsed.shop_name = 'Creamee Ballz 🍨';
          if (parsed.tagline && parsed.tagline.includes('Dhaval')) {
            parsed.tagline = 'Fresh & Delicious Creamee Ballz 🍨';
          }
          if (parsed.upi_id && parsed.upi_id.includes('dhaval')) {
            parsed.upi_id = 'creameeballz@upi';
          }
        }
        if (!parsed.phone || parsed.phone.includes('98765')) {
          parsed.phone = '+91 91068 35321';
        }
        localStorage.setItem(SHOP_SETTINGS_KEY, JSON.stringify(parsed));
        return { ...defaultShopSettings, ...parsed };
      }
      return defaultShopSettings;
    } catch {
      return defaultShopSettings;
    }
  },

  saveShopSettings(settings: ShopSettings) {
    localStorage.setItem(SHOP_SETTINGS_KEY, JSON.stringify(settings));
  },

  // STOCK PASSWORD & PHONE NUMBER SECURITY
  getStockSecurity(): StockSecurity | null {
    try {
      const stored = localStorage.getItem(STOCK_SECURITY_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveStockSecurity(security: StockSecurity) {
    localStorage.setItem(STOCK_SECURITY_KEY, JSON.stringify(security));
  },

  verifyStockPassword(inputPhone: string, inputPassword: string): boolean {
    const security = this.getStockSecurity();
    if (!security) return true; // No password configured yet

    const cleanInputPhone = inputPhone.replace(/[^0-9]/g, '');
    const cleanStoredPhone = security.phone_number.replace(/[^0-9]/g, '');

    const isPhoneMatch = !cleanStoredPhone || cleanInputPhone.endsWith(cleanStoredPhone) || cleanStoredPhone.endsWith(cleanInputPhone);
    const isPassMatch = security.password === inputPassword.trim();

    return isPhoneMatch && isPassMatch;
  },

  resetStockPasswordWithPhone(registeredPhone: string, newPassword: string): boolean {
    const security = this.getStockSecurity();
    if (!security) return false;

    const cleanInputPhone = registeredPhone.replace(/[^0-9]/g, '');
    const cleanStoredPhone = security.phone_number.replace(/[^0-9]/g, '');

    if (cleanStoredPhone && (cleanInputPhone.endsWith(cleanStoredPhone) || cleanStoredPhone.endsWith(cleanInputPhone))) {
      this.saveStockSecurity({
        ...security,
        password: newPassword.trim(),
      });
      return true;
    }
    return false;
  },

  // PRODUCTS CRUD
  async getProducts(): Promise<Product[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('Supabase getProducts fallback:', err);
    }
    const prods = localStorage.getItem(LOCAL_PRODUCTS);
    return prods && JSON.parse(prods).length > 0 ? JSON.parse(prods) : initialProducts;
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const id = `prod-${Date.now()}`;
    const now = new Date().toISOString();
    const cleanStock = Math.max(0, product.current_stock);
    const newProduct: Product = {
      ...product,
      current_stock: cleanStock,
      initial_stock: cleanStock,
      min_stock: product.min_stock || 10,
      id,
      sold_quantity: product.sold_quantity || 0,
      created_at: now,
      updated_at: now,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').insert([newProduct]).select();
        if (!error && data && data.length > 0) {
          await supabase.from('stock_transactions').insert([{
            product_id: data[0].id,
            action_type: 'added',
            quantity: newProduct.current_stock,
            prev_stock: 0,
            new_stock: newProduct.current_stock,
            notes: 'Product added',
          }]);
        }
      } catch (err) {
        console.warn('Supabase createProduct fallback to local');
      }
    }

    const products = await this.getProducts();
    const existingIdx = products.findIndex((p) => p.id === id);
    if (existingIdx === -1) {
      products.push(newProduct);
      localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(products));
    }

    const tx: StockTransaction = {
      id: `tx-${Date.now()}`,
      product_id: id,
      product_name: newProduct.name,
      action_type: 'added',
      quantity: newProduct.current_stock,
      prev_stock: 0,
      new_stock: newProduct.current_stock,
      notes: 'Product added',
      created_at: now,
    };
    const txs = await this.getTransactions();
    txs.unshift(tx);
    localStorage.setItem(LOCAL_TRANSACTIONS, JSON.stringify(txs));

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product> {
    const now = new Date().toISOString();

    if (updates.current_stock !== undefined && updates.current_stock < 0) {
      throw new Error('Stock cannot be negative (minimum is 0)!');
    }

    const products = await this.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    const oldProd = idx > -1 ? products[idx] : null;
    const targetStock = updates.current_stock !== undefined 
      ? Math.max(0, updates.current_stock) 
      : (oldProd ? oldProd.current_stock : 0);

    const cleanUpdates = { ...updates, current_stock: targetStock, updated_at: now };

    if (supabase) {
      try {
        await supabase.from('products').update(cleanUpdates).eq('id', id);
        if (oldProd && updates.current_stock !== undefined && updates.current_stock !== oldProd.current_stock) {
          const diff = updates.current_stock - oldProd.current_stock;
          await supabase.from('stock_transactions').insert([{
            product_id: id,
            action_type: diff > 0 ? 'added' : 'removed',
            quantity: Math.abs(diff),
            prev_stock: oldProd.current_stock,
            new_stock: updates.current_stock,
            notes: `Updated stock (${diff > 0 ? '+' : ''}${diff})`,
          }]);
        }
      } catch (err) {
        console.warn('Supabase updateProduct fallback');
      }
    }

    if (idx > -1) {
      const updatedProduct: Product = {
        ...products[idx],
        ...cleanUpdates,
      };
      products[idx] = updatedProduct;
      localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(products));

      if (oldProd && updates.current_stock !== undefined && updates.current_stock !== oldProd.current_stock) {
        const diff = updates.current_stock - oldProd.current_stock;
        const tx: StockTransaction = {
          id: `tx-${Date.now()}`,
          product_id: id,
          product_name: updatedProduct.name,
          action_type: diff > 0 ? 'added' : 'removed',
          quantity: Math.abs(diff),
          prev_stock: oldProd.current_stock,
          new_stock: updates.current_stock,
          notes: `Stock updated (${diff > 0 ? '+' : ''}${diff})`,
          created_at: now,
        };
        const txs = await this.getTransactions();
        txs.unshift(tx);
        localStorage.setItem(LOCAL_TRANSACTIONS, JSON.stringify(txs));
      }

      return updatedProduct;
    }

    return {
      id,
      name: updates.name || 'Product',
      category: updates.category || 'Ice Cream',
      price: updates.price || 0,
      current_stock: targetStock,
      initial_stock: targetStock,
      min_stock: updates.min_stock || 10,
      max_stock: updates.max_stock || 500,
      sold_quantity: updates.sold_quantity || 0,
      created_at: now,
      updated_at: now,
    };
  },

  async deleteProduct(id: string): Promise<void> {
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete error');
      }
    }
    const products = await this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(filtered));
  },

  async quickAdjustStock(productId: string, delta: number, notes?: string): Promise<Product> {
    const products = await this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    if (delta < 0 && product.current_stock + delta < 0) {
      throw new Error(`Cannot deduct ${Math.abs(delta)} units! Current stock is only ${product.current_stock}. Stock cannot be negative.`);
    }

    const newStock = Math.max(0, product.current_stock + delta);
    return await this.updateProduct(productId, {
      current_stock: newStock,
    });
  },

  async adjustStock(productId: string, actionType: 'added' | 'removed' | 'adjusted', quantity: number, notes: string): Promise<Product> {
    const products = await this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const prevStock = product.current_stock;
    let newStock = prevStock;

    if (actionType === 'added') {
      newStock = prevStock + quantity;
    } else if (actionType === 'removed') {
      if (prevStock < quantity) {
        throw new Error(`Cannot deduct ${quantity} units! Available stock is only ${prevStock}.`);
      }
      newStock = Math.max(0, prevStock - quantity);
    } else if (actionType === 'adjusted') {
      if (quantity < 0) {
        throw new Error('Stock cannot be negative (minimum is 0).');
      }
      newStock = Math.max(0, quantity);
    }

    return await this.updateProduct(productId, { current_stock: newStock });
  },

  async getTransactions(): Promise<StockTransaction[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('stock_transactions')
          .select(`*, products (name)`)
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((t: any) => ({
            ...t,
            product_name: t.products?.name || 'Unknown Product'
          }));
        }
      }
    } catch (err) {
      console.warn('Supabase getTransactions fallback');
    }
    const txs = localStorage.getItem(LOCAL_TRANSACTIONS);
    return txs ? JSON.parse(txs) : [];
  },

  async createSale(
    cartItems: CartItem[],
    details?: {
      payment_method?: 'cash' | 'upi' | 'card' | 'sample';
      customer_name?: string;
      customer_phone?: string;
      discount?: number;
      is_sample?: boolean;
    }
  ): Promise<Sale> {
    if (cartItems.length === 0) throw new Error('Cart is empty');

    const products = await this.getProducts();
    const now = new Date().toISOString();
    const saleId = `sale-${Date.now()}`;
    const isSample = details?.payment_method === 'sample' || details?.is_sample === true;

    let subtotal = 0;
    const productsToUpdate: { product: Product; newStock: number; soldQty: number }[] = [];
    const newTransactions: StockTransaction[] = [];
    const newItems: SaleItem[] = [];

    for (const item of cartItems) {
      const p = products.find((prod) => prod.id === item.product.id);
      if (!p) throw new Error(`Product "${item.product.name}" does not exist in inventory.`);

      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for "${p.name}". Quantity must be at least 1.`);
      }

      if (p.current_stock <= 0) {
        throw new Error(`Bill creation failed: "${p.name}" is OUT OF STOCK (0 units available). Stock cannot go below 0!`);
      }

      if (p.current_stock < item.quantity) {
        throw new Error(
          `Bill creation failed: "${p.name}" has only ${p.current_stock} units left in stock, but ${item.quantity} were requested. Stock cannot be negative!`
        );
      }

      const unitPrice = isSample ? 0 : (item.custom_price !== undefined ? Number(item.custom_price) : p.price);
      const itemTotal = isSample ? 0 : unitPrice * item.quantity;
      subtotal += itemTotal;

      const newStock = p.current_stock - item.quantity;
      if (newStock < 0) {
        throw new Error(`Fatal stock error: "${p.name}" stock would become negative (${newStock}). Transaction cancelled!`);
      }

      productsToUpdate.push({ product: p, newStock, soldQty: item.quantity });

      newItems.push({
        id: `sitem-${p.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sale_id: saleId,
        product_id: p.id,
        product_name: p.name,
        quantity: item.quantity,
        price: unitPrice,
        total: itemTotal,
      });

      newTransactions.push({
        id: `tx-sale-${p.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: p.id,
        product_name: p.name,
        action_type: isSample ? 'sample' : 'sold',
        quantity: item.quantity,
        prev_stock: p.current_stock,
        new_stock: newStock,
        notes: isSample
          ? `🎁 Sample #${saleId.substring(5, 11).toUpperCase()} dispatched (${details?.customer_name ? details.customer_name : 'Client'}) (-${item.quantity})`
          : `Bill #${saleId.substring(5, 11).toUpperCase()} sold (-${item.quantity})`,
        created_at: now,
      });
    }

    const discount = details?.discount || 0;
    const finalTotal = isSample ? 0 : Math.max(0, subtotal - discount);

    const newSale: Sale = {
      id: saleId,
      total_price: finalTotal,
      payment_method: isSample ? 'sample' : (details?.payment_method || 'cash'),
      is_sample: isSample,
      customer_name: details?.customer_name?.trim() || undefined,
      customer_phone: details?.customer_phone?.trim() || undefined,
      discount: discount > 0 ? discount : undefined,
      created_at: now,
    };

    // 1. Immediately persist to Local Storage so data is NEVER lost
    for (const item of productsToUpdate) {
      const idx = products.findIndex((p) => p.id === item.product.id);
      if (idx > -1) {
        products[idx].current_stock = item.newStock;
        products[idx].sold_quantity = (products[idx].sold_quantity || 0) + item.soldQty;
        products[idx].updated_at = now;
      }
    }
    localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(products));

    const existingSalesStr = localStorage.getItem(LOCAL_SALES);
    const existingSales: Sale[] = existingSalesStr ? JSON.parse(existingSalesStr) : [];
    const updatedSales = [newSale, ...existingSales.filter((s) => s.id !== newSale.id)];
    localStorage.setItem(LOCAL_SALES, JSON.stringify(updatedSales));

    const existingItemsStr = localStorage.getItem(LOCAL_SALE_ITEMS);
    const existingItems: SaleItem[] = existingItemsStr ? JSON.parse(existingItemsStr) : [];
    const updatedItems = [...existingItems.filter((i) => i.sale_id !== newSale.id), ...newItems];
    localStorage.setItem(LOCAL_SALE_ITEMS, JSON.stringify(updatedItems));

    const existingTxsStr = localStorage.getItem(LOCAL_TRANSACTIONS);
    const existingTxs: StockTransaction[] = existingTxsStr ? JSON.parse(existingTxsStr) : [];
    const updatedTxs = [...newTransactions, ...existingTxs];
    localStorage.setItem(LOCAL_TRANSACTIONS, JSON.stringify(updatedTxs));

    // 2. Sync to Supabase Cloud if available
    if (supabase) {
      try {
        const supabaseSalePayload: any = {
          id: newSale.id,
          total_price: newSale.total_price,
          payment_method: newSale.payment_method,
          created_at: newSale.created_at,
        };
        if (newSale.customer_name) supabaseSalePayload.customer_name = newSale.customer_name;
        if (newSale.customer_phone) supabaseSalePayload.customer_phone = newSale.customer_phone;
        if (newSale.discount) supabaseSalePayload.discount = newSale.discount;

        await supabase.from('sales').insert([supabaseSalePayload]);
        
        await supabase.from('sale_items').insert(
          newItems.map((item) => ({
            id: item.id,
            sale_id: item.sale_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          }))
        );

        for (const item of productsToUpdate) {
          await supabase.from('products')
            .update({ 
              current_stock: item.newStock, 
              sold_quantity: (item.product.sold_quantity || 0) + item.soldQty,
              updated_at: now 
            })
            .eq('id', item.product.id);
        }
      } catch (err) {
        console.warn('Supabase sale insert error:', err);
      }
    }

    return newSale;
  },

  async deleteSale(saleId: string): Promise<{ restoredItemsCount: number; restoredUnitsCount: number; refundedAmount: number; deletedRecord: DeletedSaleRecord }> {
    const sales = await this.getSales();
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Sale/Bill not found');

    const saleItems = await this.getSaleItems();
    const itemsToDelete = saleItems.filter((i) => i.sale_id === saleId);
    const products = await this.getProducts();

    const now = new Date().toISOString();
    const newTransactions: StockTransaction[] = [];
    let totalRestoredUnits = 0;

    // 1. Restore stock (+) and decrease sold_quantity (-) for every item sold in this bill
    for (const item of itemsToDelete) {
      const prodIndex = products.findIndex((p) => p.id === item.product_id);
      if (prodIndex > -1) {
        const p = products[prodIndex];
        const prevStock = p.current_stock;
        const newStock = prevStock + item.quantity;
        p.current_stock = newStock;
        p.sold_quantity = Math.max(0, (p.sold_quantity || 0) - item.quantity);
        p.updated_at = now;
        totalRestoredUnits += item.quantity;

        newTransactions.push({
          id: `tx-del-${p.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product_id: p.id,
          product_name: p.name,
          action_type: 'added',
          quantity: item.quantity,
          prev_stock: prevStock,
          new_stock: newStock,
          notes: `❌ BILL DELETED #${sale.id.substring(5, 11).toUpperCase()}: Stock returned +${item.quantity} units (${p.name})`,
          created_at: now,
        });
      }
    }

    // 2. Persist updated products to localStorage & Supabase
    localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(products));

    // 3. Remove sale from active sales list
    const remainingSales = sales.filter((s) => s.id !== saleId);
    localStorage.setItem(LOCAL_SALES, JSON.stringify(remainingSales));

    // 4. Remove sale items from active sale items list
    const remainingItems = saleItems.filter((i) => i.sale_id !== saleId);
    localStorage.setItem(LOCAL_SALE_ITEMS, JSON.stringify(remainingItems));

    // 5. Append stock transactions to local storage
    const existingTxsStr = localStorage.getItem(LOCAL_TRANSACTIONS);
    const existingTxs: StockTransaction[] = existingTxsStr ? JSON.parse(existingTxsStr) : [];
    const updatedTxs = [...newTransactions, ...existingTxs];
    localStorage.setItem(LOCAL_TRANSACTIONS, JSON.stringify(updatedTxs));

    // 6. Record deleted sale in audit history
    const deletedRecord: DeletedSaleRecord = {
      id: sale.id,
      original_bill_no: sale.id.substring(5, 11).toUpperCase(),
      total_price: sale.total_price,
      payment_method: sale.payment_method,
      customer_name: sale.customer_name,
      customer_phone: sale.customer_phone,
      is_sample: sale.is_sample,
      restored_items: itemsToDelete.map((it) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: it.quantity,
        price: it.price,
      })),
      restored_units_count: totalRestoredUnits,
      deleted_at: now,
      original_created_at: sale.created_at,
      notes: `❌ BILL DELETED #${sale.id.substring(5, 11).toUpperCase()}: Stock returned (+${totalRestoredUnits} items), -₹${sale.total_price} removed from Sales Hisab`,
    };

    const existingDelStr = localStorage.getItem(LOCAL_DELETED_SALES);
    const existingDel: DeletedSaleRecord[] = existingDelStr ? JSON.parse(existingDelStr) : [];
    const updatedDel = [deletedRecord, ...existingDel];
    localStorage.setItem(LOCAL_DELETED_SALES, JSON.stringify(updatedDel));

    // 7. Sync deletion and stock return to Supabase Cloud if connected
    if (supabase) {
      try {
        await supabase.from('sale_items').delete().eq('sale_id', saleId);
        await supabase.from('sales').delete().eq('id', saleId);

        for (const item of itemsToDelete) {
          const p = products.find((prod) => prod.id === item.product_id);
          if (p) {
            await supabase.from('products').update({
              current_stock: p.current_stock,
              sold_quantity: p.sold_quantity,
              updated_at: now,
            }).eq('id', p.id);
          }
        }

        if (newTransactions.length > 0) {
          await supabase.from('stock_transactions').insert(
            newTransactions.map(({ product_name, ...tx }) => tx)
          );
        }
      } catch (err) {
        console.warn('Supabase deleteSale sync fallback:', err);
      }
    }

    return {
      restoredItemsCount: itemsToDelete.length,
      restoredUnitsCount: totalRestoredUnits,
      refundedAmount: sale.total_price,
      deletedRecord,
    };
  },

  async getDeletedSales(): Promise<DeletedSaleRecord[]> {
    const localStr = localStorage.getItem(LOCAL_DELETED_SALES);
    return localStr ? JSON.parse(localStr) : [];
  },

  async getSales(): Promise<Sale[]> {
    const localSalesStr = localStorage.getItem(LOCAL_SALES);
    const localSales: Sale[] = localSalesStr ? JSON.parse(localSalesStr) : [];
    const saleMap = new Map<string, Sale>();
    
    // Seed with local sales first
    localSales.forEach((s) => {
      saleMap.set(s.id, {
        ...s,
        is_sample: s.is_sample === true || s.payment_method === 'sample' || s.total_price === 0,
      });
    });

    try {
      if (supabase) {
        const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          data.forEach((s: any) => {
            saleMap.set(s.id, {
              ...s,
              is_sample: s.is_sample === true || s.payment_method === 'sample' || s.total_price === 0,
            });
          });
        }
      }
    } catch (err) {
      console.warn('Supabase getSales fallback');
    }

    const mergedSales = Array.from(saleMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    localStorage.setItem(LOCAL_SALES, JSON.stringify(mergedSales));
    return mergedSales;
  },

  async getSaleItems(saleId?: string): Promise<SaleItem[]> {
    const products = await this.getProducts();
    const productMap = new Map<string, string>();
    products.forEach((p) => productMap.set(p.id, p.name));
    initialProducts.forEach((p) => productMap.set(p.id, p.name));

    const localItemsStr = localStorage.getItem(LOCAL_SALE_ITEMS);
    const localItems: SaleItem[] = localItemsStr ? JSON.parse(localItemsStr) : [];
    const itemMap = new Map<string, SaleItem>();

    // Seed with local items first
    localItems.forEach((item) => {
      itemMap.set(item.id, {
        ...item,
        product_name: item.product_name || productMap.get(item.product_id) || 'Ice Cream Flavor',
      });
    });

    try {
      if (supabase) {
        let query = supabase.from('sale_items').select(`*, products (name)`);
        if (saleId) {
          query = query.eq('sale_id', saleId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          data.forEach((item: any) => {
            const resolvedName = item.products?.name || item.product_name || productMap.get(item.product_id) || 'Ice Cream Flavor';
            itemMap.set(item.id, {
              id: item.id,
              sale_id: item.sale_id,
              product_id: item.product_id,
              product_name: resolvedName,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            });
          });
        }
      }
    } catch (err) {
      console.warn('Supabase getSaleItems fallback');
    }

    const mergedItems = Array.from(itemMap.values());
    localStorage.setItem(LOCAL_SALE_ITEMS, JSON.stringify(mergedItems));

    if (saleId) {
      return mergedItems.filter((item) => item.sale_id === saleId);
    }
    return mergedItems;
  },

  // EXPENSES CRUD
  async getExpenses(): Promise<Expense[]> {
    if (supabase) {
      const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (error) {
        const expenses = localStorage.getItem(LOCAL_EXPENSES);
        return expenses ? JSON.parse(expenses) : [];
      }
      return data || [];
    } else {
      const expenses = localStorage.getItem(LOCAL_EXPENSES);
      return expenses ? JSON.parse(expenses) : [];
    }
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    const id = `exp-${Date.now()}`;
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expense,
      amount: Number(expense.amount),
      id,
      created_at: now,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('expenses').insert([newExpense]).select();
        if (!error && data && data.length > 0) {
          return data[0];
        }
      } catch (err) {
        console.warn('Supabase expense insert failed, saving to local storage');
      }
    }

    const expenses = await this.getExpenses();
    expenses.unshift(newExpense);
    localStorage.setItem(LOCAL_EXPENSES, JSON.stringify(expenses));
    return newExpense;
  },

  async createMultipleExpenses(expenseList: Array<Omit<Expense, 'id' | 'created_at'>>): Promise<Expense[]> {
    if (!expenseList || expenseList.length === 0) return [];
    const baseTime = Date.now();
    const newExpenses: Expense[] = expenseList.map((exp, idx) => ({
      ...exp,
      amount: Number(exp.amount),
      id: `exp-${baseTime}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date(baseTime + idx * 500).toISOString(),
    }));

    if (supabase) {
      try {
        const { data, error } = await supabase.from('expenses').insert(newExpenses).select();
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase multiple expenses insert failed, saving to local storage');
      }
    }

    const existingExpenses = await this.getExpenses();
    const merged = [...newExpenses, ...existingExpenses];
    localStorage.setItem(LOCAL_EXPENSES, JSON.stringify(merged));
    return newExpenses;
  },

  async deleteExpense(id: string): Promise<void> {
    if (supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase expense delete error');
      }
    }
    const expenses = await this.getExpenses();
    const filtered = expenses.filter((e) => e.id !== id);
    localStorage.setItem(LOCAL_EXPENSES, JSON.stringify(filtered));
  },

  async clearHisabOnly(): Promise<void> {
    if (supabase) {
      try {
        await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stock_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Supabase clearHisabOnly error:', err);
      }
    }

    localStorage.setItem(LOCAL_SALES, JSON.stringify([]));
    localStorage.setItem(LOCAL_SALE_ITEMS, JSON.stringify([]));
    localStorage.setItem(LOCAL_EXPENSES, JSON.stringify([]));
    localStorage.setItem(LOCAL_TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(LOCAL_DELETED_SALES, JSON.stringify([]));
  },

  async wipeAllData(includeProducts: boolean = true): Promise<void> {
    if (supabase) {
      try {
        await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stock_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (includeProducts) {
          await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
      } catch (err) {
        console.warn('Supabase wipe error:', err);
      }
    }

    localStorage.setItem(LOCAL_SALES, JSON.stringify([]));
    localStorage.setItem(LOCAL_SALE_ITEMS, JSON.stringify([]));
    localStorage.setItem(LOCAL_EXPENSES, JSON.stringify([]));
    localStorage.setItem(LOCAL_TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(LOCAL_DELETED_SALES, JSON.stringify([]));
    if (includeProducts) {
      localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify([]));
    }
    localStorage.setItem('icecream_db_initialized', 'true');
  },

  exportAllData(): string {
    const data = {
      products: localStorage.getItem(LOCAL_PRODUCTS),
      sales: localStorage.getItem(LOCAL_SALES),
      sale_items: localStorage.getItem(LOCAL_SALE_ITEMS),
      expenses: localStorage.getItem(LOCAL_EXPENSES),
      transactions: localStorage.getItem(LOCAL_TRANSACTIONS),
      deleted_sales: localStorage.getItem(LOCAL_DELETED_SALES),
      settings: localStorage.getItem(SHOP_SETTINGS_KEY),
      security: localStorage.getItem(STOCK_SECURITY_KEY),
      exported_at: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.products) localStorage.setItem(LOCAL_PRODUCTS, data.products);
      if (data.sales) localStorage.setItem(LOCAL_SALES, data.sales);
      if (data.sale_items) localStorage.setItem(LOCAL_SALE_ITEMS, data.sale_items);
      if (data.expenses) localStorage.setItem(LOCAL_EXPENSES, data.expenses);
      if (data.transactions) localStorage.setItem(LOCAL_TRANSACTIONS, data.transactions);
      if (data.deleted_sales) localStorage.setItem(LOCAL_DELETED_SALES, data.deleted_sales);
      if (data.settings) localStorage.setItem(SHOP_SETTINGS_KEY, data.settings);
      if (data.security) localStorage.setItem(STOCK_SECURITY_KEY, data.security);
      return true;
    } catch {
      return false;
    }
  },
};

export const getProductStatus = (p: Product): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
  if (p.current_stock <= 0) return 'Out of Stock';
  if (p.current_stock <= 10) return 'Low Stock';
  return 'In Stock';
};
