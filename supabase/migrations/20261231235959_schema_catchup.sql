-- supabase/migrations/20261231235959_schema_catchup.sql
-- ONE-SHOT schema reconciliation to sync DB with frontend types.ts

-- ============================================================
-- 1. ENUM CATCH-UP
-- ============================================================
-- Frontend expects: "admin" | "user" | "community_admin"
-- Base migration only has: "admin" | "user"
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'community_admin';

-- These types should already exist from the base migration,
-- but guard against partial failures
DO $$ BEGIN
    CREATE TYPE public.enterprise_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.seller_application_status AS ENUM ('pending', 'contacted', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. TABLE COLUMN CATCH-UP
-- ============================================================
-- user_roles: frontend selects "role, community_id" but base migration has no community_id
ALTER TABLE IF EXISTS public.user_roles
  ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.community_profiles(id);

-- ============================================================
-- 3. MISSING TRIGGER: handle_new_user on auth.users
-- ============================================================
-- The base pg_dump contained the function but NOT the trigger binding.
-- This ensures new signups auto-create profiles and default roles.
DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 4. MISSING FUNCTION: get_user_community_id
-- ============================================================
-- Frontend types.ts expects this function to exist
CREATE OR REPLACE FUNCTION public.get_user_community_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT community_id
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = 'community_admin'
  LIMIT 1;
$$;

-- ============================================================
-- 5. MISSING FUNCTION: is_community_admin
-- ============================================================
-- Frontend types.ts expects this function to exist
CREATE OR REPLACE FUNCTION public.is_community_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'community_admin'
  );
$$;

-- ============================================================
-- 6. RLS POLICY CATCH-UP
-- ============================================================
-- Ensure RLS is enabled on all core tables
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seller_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_enterprises ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) read access to products (storefront)
DO $$ BEGIN
  CREATE POLICY "Anyone can view non-archived products" ON public.products
    FOR SELECT USING (is_archived = false);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Allow public (anon) read access to community profiles
DO $$ BEGIN
  CREATE POLICY "Anyone can view community profiles" ON public.community_profiles
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admin full CRUD on community_profiles (base migration didn't cover this)
DO $$ BEGIN
  CREATE POLICY "Admins can manage community profiles" ON public.community_profiles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users can read their own profile
DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users can update their own profile
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users can read their own roles
DO $$ BEGIN
  CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admin full CRUD on portfolio_posts
DO $$ BEGIN
  CREATE POLICY "Admins can manage portfolio posts" ON public.portfolio_posts
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Anyone can read published portfolio posts
DO $$ BEGIN
  CREATE POLICY "Anyone can view published portfolio" ON public.portfolio_posts
    FOR SELECT USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admin full CRUD on seller_applications
DO $$ BEGIN
  CREATE POLICY "Admins can manage seller applications" ON public.seller_applications
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admin full CRUD on community_enterprises
DO $$ BEGIN
  CREATE POLICY "Admins can manage enterprises" ON public.community_enterprises
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;
