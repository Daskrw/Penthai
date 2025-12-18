-- Create table for renewal requests
CREATE TABLE public.enterprise_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID REFERENCES public.community_enterprises(id),
  registration_id TEXT NOT NULL,
  enterprise_name TEXT NOT NULL,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.enterprise_renewals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can create renewal requests"
ON public.enterprise_renewals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all renewals"
ON public.enterprise_renewals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own renewals"
ON public.enterprise_renewals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update renewals"
ON public.enterprise_renewals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_renewals;

-- Add trigger for updated_at
CREATE TRIGGER update_enterprise_renewals_updated_at
BEFORE UPDATE ON public.enterprise_renewals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();