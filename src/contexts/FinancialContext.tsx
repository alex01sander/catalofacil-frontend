import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type CashFlowEntry = Tables<'cash_flow'>;
type CreditAccount = Tables<'credit_accounts'>;
type Expense = Tables<'expenses'>;
type Sale = Tables<'sales'>;
type Product = Tables<'products'>;

interface FinancialData {
  cashFlow: CashFlowEntry[];
  creditAccounts: CreditAccount[];
  expenses: Expense[];
  sales: Sale[];
  products: Product[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  totalDebt: number;
  isLoading: boolean;
}

interface FinancialContextType {
  data: FinancialData;
  refreshData: () => Promise<void>;
  addCashFlowEntry: (entry: Omit<CashFlowEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  registerSale: (saleData: any) => Promise<void>;
  addCreditTransaction: (accountId: string, type: 'debt' | 'payment', amount: number, description?: string) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [data, setData] = useState<FinancialData>({
    cashFlow: [],
    creditAccounts: [],
    expenses: [],
    sales: [],
    products: [],
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    totalDebt: 0,
    isLoading: true,
  });

  const fetchAllData = async () => {
    if (!user) return;
    
    try {
      // Logar o valor de user.id antes da consulta
      console.log('user.id usado na consulta stores:', user?.id);
      // Buscar store_id do usuário
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (storeData) {
        setStoreId(storeData.id);
      }
      
      const [cashFlowRes, creditRes, expensesRes, salesRes, productsRes] = await Promise.all([
        supabase.from('cash_flow').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('credit_accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('due_date', { ascending: false }),
        supabase.from('sales').select('*').eq('user_id', user.id).order('sale_date', { ascending: false }),
        supabase.from('products').select('*').eq('user_id', user.id).eq('is_active', true).order('name')
      ]);

      const cashFlow = cashFlowRes.data || [];
      const creditAccounts = creditRes.data || [];
      const expenses = expensesRes.data || [];
      const sales = salesRes.data || [];
      const products = productsRes.data || [];

      const totalIncome = cashFlow.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
      const totalExpenses = cashFlow.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
      const totalDebt = creditAccounts.reduce((sum, acc) => sum + Number(acc.total_debt), 0);

      setData({
        cashFlow,
        creditAccounts,
        expenses,
        sales,
        products,
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        totalDebt,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const refreshData = async () => {
    setData(prev => ({ ...prev, isLoading: true }));
    await fetchAllData();
  };

  const addCashFlowEntry = async (entry: Omit<CashFlowEntry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newEntry, error } = await supabase
        .from('cash_flow')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        cashFlow: [newEntry, ...prev.cashFlow],
        totalIncome: entry.type === 'income' 
          ? prev.totalIncome + Number(entry.amount)
          : prev.totalIncome,
        totalExpenses: entry.type === 'expense' 
          ? prev.totalExpenses + Number(entry.amount)
          : prev.totalExpenses,
        balance: entry.type === 'income' 
          ? prev.balance + Number(entry.amount)
          : prev.balance - Number(entry.amount)
      }));

      toast({
        title: "Sucesso",
        description: "Lançamento adicionado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao adicionar lançamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o lançamento",
        variant: "destructive",
      });
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newExpense, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        expenses: [newExpense, ...prev.expenses]
      }));

      toast({
        title: "Sucesso",
        description: "Despesa adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a despesa",
        variant: "destructive",
      });
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const { data: updatedExpense, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        expenses: prev.expenses.map(exp => exp.id === id ? updatedExpense : exp)
      }));

      toast({
        title: "Sucesso",
        description: "Despesa atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a despesa",
        variant: "destructive",
      });
    }
  };

  const registerSale = async (saleData: any) => {
    try {
      const product = data.products.find(p => p.id === saleData.product_id);
      if (!product) throw new Error('Produto não encontrado');

      const quantity = parseInt(saleData.quantity);
      const unitPrice = parseFloat(saleData.unit_price);
      const totalPrice = quantity * unitPrice;

      if (product.stock < quantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${product.stock}`);
      }

      // Registrar venda
      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          user_id: user!.id,
          store_id: storeId,
          product_name: product.name,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          sale_date: saleData.date,
          status: 'completed'
        }]);

      if (saleError) throw saleError;

      // Atualizar estoque
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: product.stock - quantity })
        .eq('id', product.id);

      if (stockError) throw stockError;

      // Adicionar ao fluxo de caixa
      await addCashFlowEntry({
        user_id: user!.id,
        store_id: storeId,
        type: 'income',
        category: 'sale',
        description: `Venda: ${product.name} (${quantity}x)`,
        amount: totalPrice,
        date: saleData.date,
        payment_method: saleData.payment_method
      });

      // Atualizar produtos no estado
      setData(prev => ({
        ...prev,
        products: prev.products.map(p => 
          p.id === product.id ? { ...p, stock: p.stock - quantity } : p
        )
      }));

      toast({
        title: "Sucesso",
        description: `Venda registrada! Estoque atualizado: ${product.name} (${product.stock - quantity} restante)`,
      });
    } catch (error: any) {
      console.error('Erro ao registrar venda:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a venda",
        variant: "destructive",
      });
    }
  };

  const addCreditTransaction = async (accountId: string, type: 'debt' | 'payment', amount: number, description?: string) => {
    try {
      // Adicionar transação
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          credit_account_id: accountId,
          user_id: user!.id,
          type,
          amount,
          description: description || '',
          date: new Date().toISOString().split('T')[0]
        }]);

      if (transactionError) throw transactionError;

      // Atualizar saldo da conta
      const account = data.creditAccounts.find(acc => acc.id === accountId);
      if (!account) throw new Error('Conta não encontrada');

      const newDebt = type === 'debt' 
        ? Number(account.total_debt) + amount
        : Number(account.total_debt) - amount;

      const { error: updateError } = await supabase
        .from('credit_accounts')
        .update({ total_debt: Math.max(0, newDebt) })
        .eq('id', accountId);

      if (updateError) throw updateError;

      // Atualizar estado local
      setData(prev => ({
        ...prev,
        creditAccounts: prev.creditAccounts.map(acc => 
          acc.id === accountId ? { ...acc, total_debt: Math.max(0, newDebt) } : acc
        ),
        totalDebt: prev.totalDebt + (type === 'debt' ? amount : -amount)
      }));

      toast({
        title: "Sucesso",
        description: `${type === 'debt' ? 'Débito' : 'Pagamento'} registrado com sucesso!`,
      });
    } catch (error: any) {
      console.error('Erro ao registrar transação:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a transação",
        variant: "destructive",
      });
    }
  };

  // Configurar realtime
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase.channel('cash_flow_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'cash_flow',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('Cash flow updated, refreshing data...');
          fetchAllData();
        })
        .subscribe(),

      supabase.channel('expenses_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'expenses',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('Expenses updated, refreshing data...');
          fetchAllData();
        })
        .subscribe(),

      supabase.channel('credit_accounts_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'credit_accounts',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('Credit accounts updated, refreshing data...');
          fetchAllData();
        })
        .subscribe(),

      supabase.channel('products_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('Products updated, refreshing data...');
          fetchAllData();
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

  // Buscar dados iniciais
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const value = {
    data,
    refreshData,
    addCashFlowEntry,
    addExpense,
    updateExpense,
    registerSale,
    addCreditTransaction,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};