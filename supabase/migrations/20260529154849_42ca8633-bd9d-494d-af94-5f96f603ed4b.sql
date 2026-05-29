
-- Restrict cart policies to authenticated role
DROP POLICY IF EXISTS "Users can view their own cart" ON public.cart;
DROP POLICY IF EXISTS "Users can create their own cart" ON public.cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.cart;
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.cart;

CREATE POLICY "Users can view their own cart" ON public.cart
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cart" ON public.cart
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart" ON public.cart
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart" ON public.cart
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Restrict community_enterprises policies to authenticated role and explicitly deny anonymous access
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.community_enterprises;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.community_enterprises;
DROP POLICY IF EXISTS "Users can create registrations" ON public.community_enterprises;
DROP POLICY IF EXISTS "Admins can update all registrations" ON public.community_enterprises;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.community_enterprises;

CREATE POLICY "Users can view their own registrations" ON public.community_enterprises
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all registrations" ON public.community_enterprises
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create registrations" ON public.community_enterprises
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update all registrations" ON public.community_enterprises
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete registrations" ON public.community_enterprises
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Explicitly revoke any access from anon role
REVOKE ALL ON public.cart FROM anon;
REVOKE ALL ON public.community_enterprises FROM anon;
