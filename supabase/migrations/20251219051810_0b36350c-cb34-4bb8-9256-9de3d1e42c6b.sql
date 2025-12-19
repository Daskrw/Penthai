-- Add community_id to user_roles table to link community admins to their community
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.community_profiles(id) ON DELETE SET NULL;

-- Add community_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.community_profiles(id) ON DELETE SET NULL;

-- Update products RLS to allow community admins to manage their products
CREATE POLICY "Community admins can view their community products" 
ON public.products 
FOR SELECT 
USING (
  has_role(auth.uid(), 'community_admin') AND 
  community_id IN (
    SELECT ur.community_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Community admins can insert their community products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'community_admin') AND 
  community_id IN (
    SELECT ur.community_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Community admins can update their community products" 
ON public.products 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'community_admin') AND 
  community_id IN (
    SELECT ur.community_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Community admins can delete their community products" 
ON public.products 
FOR DELETE 
USING (
  has_role(auth.uid(), 'community_admin') AND 
  community_id IN (
    SELECT ur.community_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- Add community_id to order_items to track which community sold the product
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.community_profiles(id) ON DELETE SET NULL;

-- Update order_items RLS for community admins
CREATE POLICY "Community admins can view their community order items" 
ON public.order_items 
FOR SELECT 
USING (
  has_role(auth.uid(), 'community_admin') AND 
  community_id IN (
    SELECT ur.community_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- Create function to check community admin status
CREATE OR REPLACE FUNCTION public.is_community_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'community_admin'
  )
$$;

-- Create function to get user's community_id
CREATE OR REPLACE FUNCTION public.get_user_community_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT community_id
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = 'community_admin'
  LIMIT 1
$$;