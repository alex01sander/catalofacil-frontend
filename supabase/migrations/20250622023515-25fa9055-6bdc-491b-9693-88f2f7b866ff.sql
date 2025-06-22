
-- Remove existing conflicting RLS policies and implement comprehensive security policies

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can manage their categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage their products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Store owners can manage their customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can manage their orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Storage policies cleanup
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view store assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload store assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own store assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own store assets" ON storage.objects;

-- PROFILES TABLE POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- STORE_SETTINGS TABLE POLICIES
CREATE POLICY "Users can view own store settings" ON public.store_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own store settings" ON public.store_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own store settings" ON public.store_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CATEGORIES TABLE POLICIES
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- PRODUCTS TABLE POLICIES (Users manage their own, but public can view active products)
CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- CUSTOMERS TABLE POLICIES
CREATE POLICY "Store owners can view own customers" ON public.customers
  FOR SELECT USING (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can insert own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can update own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can delete own customers" ON public.customers
  FOR DELETE USING (auth.uid() = store_owner_id);

-- ORDERS TABLE POLICIES
CREATE POLICY "Store owners can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can delete own orders" ON public.orders
  FOR DELETE USING (auth.uid() = store_owner_id);

-- ORDER_ITEMS TABLE POLICIES
CREATE POLICY "Users can manage order items for own orders" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.store_owner_id = auth.uid()
    )
  );

-- STORAGE POLICIES - Secure file access by user ID
-- Product images bucket policies
CREATE POLICY "Users can view own product images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload own product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Store assets bucket policies
CREATE POLICY "Users can view own store assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'store-assets' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view store assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

CREATE POLICY "Users can upload own store assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own store assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'store-assets' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own store assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'store-assets' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add constraints for security
ALTER TABLE public.store_settings ADD CONSTRAINT store_name_length CHECK (char_length(store_name) <= 100);
ALTER TABLE public.store_settings ADD CONSTRAINT store_description_length CHECK (char_length(store_description) <= 1000);
ALTER TABLE public.categories ADD CONSTRAINT category_name_length CHECK (char_length(name) <= 50);
ALTER TABLE public.products ADD CONSTRAINT product_name_length CHECK (char_length(name) <= 100);
ALTER TABLE public.products ADD CONSTRAINT product_description_length CHECK (char_length(description) <= 2000);
