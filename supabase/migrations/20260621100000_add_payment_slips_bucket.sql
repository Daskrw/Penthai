-- Create storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-slips', 'payment-slips', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload payment slips
CREATE POLICY "Authenticated users can upload payment slips"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-slips');

-- Anyone can view payment slips (for admin review)
CREATE POLICY "Anyone can view payment slips"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-slips');

-- Admins can delete payment slips
CREATE POLICY "Admins can delete payment slips"
ON storage.objects
FOR DELETE
USING (bucket_id = 'payment-slips' AND has_role(auth.uid(), 'admin'::app_role));
