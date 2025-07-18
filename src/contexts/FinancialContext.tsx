import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/constants/api';

interface FinancialData {
  cashFlow: any[];
  creditAccounts: any[];
  expenses: any[];
  sales: any[];
  products: any[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  totalDebt: number;
  isLoading: boolean;
}

interface FinancialContextType {
  data: FinancialData;
  refreshData: () => Promise<void>;
  addCashFlowEntry: (entry: any) => Promise<void>;
  addExpense: (expense: any) => Promise<void>;
  updateExpense: (id: string, updates: any) => Promise<void>;
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

// Função utilitária para formatar data para dd/mm/aaaa
function formatarDataBR(dataISO: string) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const { toast } = useToast();
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
    if (!user || !token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [cashFlowRes, creditRes, expensesRes, salesRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/fluxo-caixa`, { headers }),
        axios.get(`${API_URL}/credit-accounts`, { headers }),
        axios.get(`${API_URL}/despesas`, { headers }),
        axios.get(`${API_URL}/vendas`, { headers }),
        axios.get(`${API_URL}/products`, { headers })
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

  const addCashFlowEntry = async (entry: any) => {
    if (!user || !token) return;
    try {
      const payload = {
        ...entry,
        amount: String(Number(entry.amount)),
        date: new Date(entry.date).toISOString(),
      };
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/fluxo-caixa`, payload, { headers });
      setData(prev => ({
        ...prev,
        cashFlow: [res.data, ...prev.cashFlow],
        totalIncome: entry.type === 'income' ? prev.totalIncome + Number(entry.amount) : prev.totalIncome,
        totalExpenses: entry.type === 'expense' ? prev.totalExpenses + Number(entry.amount) : prev.totalExpenses,
        balance: entry.type === 'income' ? prev.balance + Number(entry.amount) : prev.balance - Number(entry.amount)
      }));
      toast({ title: 'Sucesso', description: 'Lançamento adicionado com sucesso!' });
    } catch (error) {
      console.error('Erro ao adicionar lançamento:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar o lançamento', variant: 'destructive' });
    }
  };

  const addExpense = async (expense: any) => {
    if (!user || !token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // Remover campos duplicados e garantir apenas um user_id
      const payload = { ...expense, user_id: user.id };
      delete payload["userId"];
      const res = await axios.post(`${API_URL}/despesas`, payload, { headers });
      setData(prev => ({ ...prev, expenses: [res.data, ...prev.expenses] }));
      toast({ title: 'Sucesso', description: 'Despesa adicionada com sucesso!' });
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar a despesa', variant: 'destructive' });
    }
  };

  const updateExpense = async (id: string, updates: any) => {
    if (!user || !token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(`${API_URL}/despesas/${id}`, updates, { headers });
      setData(prev => ({
        ...prev,
        expenses: prev.expenses.map(exp => exp.id === id ? res.data : exp)
      }));
      toast({ title: 'Sucesso', description: 'Despesa atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a despesa', variant: 'destructive' });
    }
  };

  const registerSale = async (saleData: any) => {
    if (!user || !token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // Buscar nome do produto pelo product_id
      const selectedProduct = data.products.find((p) => p.id === saleData.product_id);
      if (!selectedProduct) throw new Error('Produto não encontrado');
      const payload = {
        product_id: saleData.product_id,
        user_id: user?.id,
        product_name: selectedProduct.name,
        quantity: Number(saleData.quantity),
        unit_price: String(Number(saleData.unit_price)),
        total_price: String(Number(saleData.quantity) * Number(saleData.unit_price)),
        sale_date: new Date(saleData.date).toISOString(),
        status: 'completed',
        store_id: selectedProduct.store_id || null
      };
      const res = await axios.post(`${API_URL}/vendas`, payload, { headers });
      // Lançar também no fluxo de caixa
      await axios.post(`${API_URL}/fluxo-caixa`, {
        user_id: user?.id,
        store_id: payload.store_id,
        type: 'income',
        category: 'Venda',
        description: `Venda: ${payload.product_name}`,
        amount: payload.total_price,
        date: payload.sale_date,
        payment_method: saleData.payment_method || 'cash'
      }, { headers });
      await refreshData();
      toast({ title: 'Sucesso', description: 'Venda registrada!' });
    } catch (error: any) {
      console.error('Erro ao registrar venda:', error);
      toast({ title: 'Erro', description: error.message || 'Não foi possível registrar a venda', variant: 'destructive' });
    }
  };

  const addCreditTransaction = async (accountId: string, type: 'debt' | 'payment', amount: number, description?: string) => {
    if (!user || !token) return;
    try {
      if (!accountId) {
        toast({ title: 'Selecione uma conta de crédito', description: 'Você deve escolher uma conta para registrar a transação.', variant: 'destructive' });
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/credit-transactions`, {
        credit_account_id: accountId,
        type,
        amount,
        description: description || ''
      }, { headers });
      setData(prev => ({ ...prev, creditAccounts: prev.creditAccounts })); // Atualização real pode ser feita via refreshData
      toast({ title: 'Sucesso', description: `${type === 'debt' ? 'Débito' : 'Pagamento'} registrado com sucesso!` });
    } catch (error: any) {
      console.error('Erro ao registrar transação:', error);
      toast({ title: 'Erro', description: error.message || 'Não foi possível registrar a transação', variant: 'destructive' });
    }
  };

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