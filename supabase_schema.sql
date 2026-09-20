-- =========================================================================
-- SUPABASE DATABASE SCHEMA FOR CREAMEE BALLZ 🍨 (ICE CREAM POS & STOCK)
-- =========================================================================
-- Copy and run this script in Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Ice Cream',
  price NUMERIC NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  max_stock INTEGER NOT NULL DEFAULT 500,
  initial_stock INTEGER NOT NULL DEFAULT 0,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  total_price NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'upi', 'card'
  customer_name TEXT,
  customer_phone TEXT,
  discount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

-- 4. EXPENSES TABLE (SHOP EXPENSES / KHARCHA)
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'upi'
  category TEXT NOT NULL DEFAULT 'Other Expenses',
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. STOCK TRANSACTIONS / AUDIT LOG
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'added', 'removed', 'adjusted', 'sold'
  quantity INTEGER NOT NULL DEFAULT 0,
  prev_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allows read, insert, update, delete using the anon public key
-- =========================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the POS app
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sale_items" ON public.sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to stock_transactions" ON public.stock_transactions FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- INITIAL SEED PRODUCTS (OPTIONAL DEMO FLAVORS)
-- =========================================================================

INSERT INTO public.products (id, name, category, price, current_stock, min_stock, max_stock, initial_stock, sold_quantity, image_url)
VALUES
  ('prod-1', 'Crunchy Mava Malai', 'Ice Cream', 200, 50, 10, 500, 100, 0, '/images/mava_malai.jpg'),
  ('prod-2', 'Chocolate Crunchy', 'Ice Cream', 200, 50, 10, 500, 100, 0, '/images/chocolate_crunchy.jpg'),
  ('prod-3', 'Crunchy Vanilla', 'Ice Cream', 200, 50, 10, 500, 100, 0, '/images/crunchy_vanilla.jpg'),
  ('prod-4', 'Crunchy Strawberry', 'Ice Cream', 200, 40, 10, 500, 100, 0, '/images/crunchy_strawberry.jpg'),
  ('prod-5', 'Crunchy Orange', 'Ice Cream', 200, 30, 10, 500, 100, 0, '/images/crunchy_orange.jpg'),
  ('prod-1kg-1', 'Crunchy Mava Malai (1 Kg)', '1 Kg Pack', 600, 50, 5, 500, 100, 0, '/images/mava_malai.jpg'),
  ('prod-1kg-2', 'Chocolate Crunchy (1 Kg)', '1 Kg Pack', 600, 50, 5, 500, 100, 0, '/images/chocolate_crunchy.jpg'),
  ('prod-1kg-3', 'Crunchy Vanilla (1 Kg)', '1 Kg Pack', 600, 50, 5, 500, 100, 0, '/images/crunchy_vanilla.jpg'),
  ('prod-1kg-4', 'Crunchy Strawberry (1 Kg)', '1 Kg Pack', 600, 50, 5, 500, 100, 0, '/images/crunchy_strawberry.jpg'),
  ('prod-1kg-5', 'Crunchy Orange (1 Kg)', '1 Kg Pack', 600, 50, 5, 500, 100, 0, '/images/crunchy_orange.jpg')
ON CONFLICT (id) DO NOTHING;
