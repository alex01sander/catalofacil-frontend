-- Criar tabela para controle de caixa (entradas e saídas)
CREATE TABLE public.cash_flow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL, -- 'sale', 'expense', 'supplier', 'delivery', 'bills', 'other'
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash', -- 'cash', 'pix', 'card', 'transfer'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para despesas fixas e variáveis
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'fixed', 'variable'
  type TEXT NOT NULL, -- 'supplier', 'delivery', 'bills', 'rent', 'other'
  amount NUMERIC NOT NULL,
  due_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- 'monthly', 'weekly', 'yearly'
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para controle de fiado (clientes em débito)
CREATE TABLE public.credit_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_debt NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para transações de fiado
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_account_id UUID NOT NULL REFERENCES public.credit_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debt', 'payment')),
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para simulação de preços
CREATE TABLE public.product_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID,
  product_name TEXT NOT NULL,
  cost_price NUMERIC NOT NULL,
  desired_margin NUMERIC NOT NULL, -- percentual de margem desejada
  suggested_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cash_flow
CREATE POLICY "Users can manage their own cash flow" 
ON public.cash_flow 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for expenses
CREATE POLICY "Users can manage their own expenses" 
ON public.expenses 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for credit_accounts
CREATE POLICY "Users can manage their own credit accounts" 
ON public.credit_accounts 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for credit_transactions
CREATE POLICY "Users can manage their own credit transactions" 
ON public.credit_transactions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for product_costs
CREATE POLICY "Users can manage their own product costs" 
ON public.product_costs 
FOR ALL 
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_cash_flow_updated_at
BEFORE UPDATE ON public.cash_flow
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_accounts_updated_at
BEFORE UPDATE ON public.credit_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_costs_updated_at
BEFORE UPDATE ON public.product_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();