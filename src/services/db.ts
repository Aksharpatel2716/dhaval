import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Sale, SaleItem, Expense, StockTransaction, CartItem, ShopSettings, StockSecurity } from '../types';

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

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Crunchy Mava Malai',
    category: 'Ice Cream',
    price: 200,
    current_stock: 50,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 50,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 50,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 40,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 30,
    min_stock: 10,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 50,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 50,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 50,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 50,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 100,
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
    current_stock: 50,
    min_stock: 5,
    max_stock: 100,
    initial_stock: 100,
    sold_quantity: 0,
    image_url: '/images/crunchy_orange.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to initialize Local Storage Tables
export const seedLocalDatabase = (force = false) => {
  if (force || !localStorage.getItem(LOCAL_PRODUCTS)) {
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
seedLocalDatabase();

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
    return prods ? JSON.parse(prods) : initialProducts;
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

      const itemTotal = isSample ? 0 : p.price * item.quantity;
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
        price: isSample ? 0 : p.price,
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
      payment_method: details?.payment_method || 'cash',
      is_sample: isSample,
      customer_name: details?.customer_name?.trim() || undefined,
      customer_phone: details?.customer_phone?.trim() || undefined,
      discount: discount > 0 ? discount : undefined,
      created_at: now,
    };

    if (supabase) {
      try {
        await supabase.from('sales').insert([newSale]);
        await supabase.from('sale_items').insert(
          newItems.map(({ product_name, ...item }) => item)
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

        await supabase.from('stock_transactions').insert(
          newTransactions.map(({ product_name, ...tx }) => tx)
        );
      } catch (err) {
        console.warn('Supabase createSale failed, saving to local storage');
      }
    }

    // Always update local storage
    for (const item of productsToUpdate) {
      const idx = products.findIndex((p) => p.id === item.product.id);
      if (idx > -1) {
        products[idx].current_stock = item.newStock;
        products[idx].sold_quantity = (products[idx].sold_quantity || 0) + item.soldQty;
        products[idx].updated_at = now;
      }
    }
    localStorage.setItem(LOCAL_PRODUCTS, JSON.stringify(products));

    const sales = await this.getSales();
    sales.unshift(newSale);
    localStorage.setItem(LOCAL_SALES, JSON.stringify(sales));

    const saleItems = await this.getSaleItems();
    saleItems.push(...newItems);
    localStorage.setItem(LOCAL_SALE_ITEMS, JSON.stringify(saleItems));

    const transactions = await this.getTransactions();
    transactions.unshift(...newTransactions);
    localStorage.setItem(LOCAL_TRANSACTIONS, JSON.stringify(transactions));

    return newSale;
  },

  async getSales(): Promise<Sale[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          localStorage.setItem(LOCAL_SALES, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('Supabase getSales fallback');
    }
    const sales = localStorage.getItem(LOCAL_SALES);
    return sales ? JSON.parse(sales) : [];
  },

  async getSaleItems(saleId?: string): Promise<SaleItem[]> {
    try {
      if (supabase) {
        let query = supabase.from('sale_items').select(`*, products (name)`);
        if (saleId) {
          query = query.eq('sale_id', saleId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            product_name: item.products?.name || 'Unknown Product'
          }));
        }
      }
    } catch (err) {
      console.warn('Supabase getSaleItems fallback');
    }
    const items = localStorage.getItem(LOCAL_SALE_ITEMS);
    const parsed: SaleItem[] = items ? JSON.parse(items) : [];
    if (saleId) {
      return parsed.filter((item) => item.sale_id === saleId);
    }
    return parsed;
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

  exportAllData(): string {
    const data = {
      products: localStorage.getItem(LOCAL_PRODUCTS),
      sales: localStorage.getItem(LOCAL_SALES),
      sale_items: localStorage.getItem(LOCAL_SALE_ITEMS),
      expenses: localStorage.getItem(LOCAL_EXPENSES),
      transactions: localStorage.getItem(LOCAL_TRANSACTIONS),
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
