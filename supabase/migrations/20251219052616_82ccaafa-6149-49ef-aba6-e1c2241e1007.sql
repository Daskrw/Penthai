-- Add is_archived column for soft delete
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Create index for faster queries on non-archived products
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);