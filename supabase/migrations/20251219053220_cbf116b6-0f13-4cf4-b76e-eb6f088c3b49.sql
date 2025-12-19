-- Create user_addresses table for shipping addresses
CREATE TABLE public.user_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  phone_number text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postal_code text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_payment_methods table (non-sensitive info only)
CREATE TABLE public.user_payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type text NOT NULL, -- 'card', 'promptpay', 'bank_transfer'
  card_brand text, -- 'visa', 'mastercard', 'amex', etc.
  last_four text, -- Last 4 digits of card
  cardholder_name text,
  expiry_month integer,
  expiry_year integer,
  bank_name text, -- For bank transfers
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_addresses
CREATE POLICY "Users can view their own addresses" 
ON public.user_addresses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addresses" 
ON public.user_addresses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
ON public.user_addresses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON public.user_addresses 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for user_payment_methods
CREATE POLICY "Users can view their own payment methods" 
ON public.user_payment_methods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment methods" 
ON public.user_payment_methods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" 
ON public.user_payment_methods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" 
ON public.user_payment_methods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_addresses_updated_at
BEFORE UPDATE ON public.user_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_payment_methods_updated_at
BEFORE UPDATE ON public.user_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();