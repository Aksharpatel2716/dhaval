export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  initial_stock: number;
  sold_quantity: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface Sale {
  id: string;
  total_price: number;
  payment_method?: 'cash' | 'upi' | 'card';
  customer_name?: string;
  customer_phone?: string;
  discount?: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Expense {
  id: string;
  amount: number;
  payment_method: 'cash' | 'upi';
  category: string;
  description: string;
  created_at: string;
}

export interface StockTransaction {
  id: string;
  product_id: string;
  product_name: string;
  action_type: 'added' | 'removed' | 'adjusted' | 'sold';
  quantity: number;
  prev_stock: number;
  new_stock: number;
  notes: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShopSettings {
  shop_name: string;
  tagline: string;
  phone: string;
  address: string;
  upi_id?: string;
}

export interface StockSecurity {
  phone_number: string;
  password: string;
  is_enabled: boolean;
  created_at: string;
}
