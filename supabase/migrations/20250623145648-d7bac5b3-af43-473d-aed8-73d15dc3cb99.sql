
-- Create sales table to store manual sales records
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  sale_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sales" 
  ON public.sales 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sales" 
  ON public.sales 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sales" 
  ON public.sales 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sales" 
  ON public.sales 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_sales_updated_at 
  BEFORE UPDATE ON public.sales 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
