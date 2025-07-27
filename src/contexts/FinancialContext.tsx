import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/constants/api';
import api from '@/services/api';

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

  // Cache para evitar requisições desnecessárias
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const fetchAllData = async () => {
    console.log('=== FinancialContext fetchAllData ===');
    console.log('user:', user);
    console.log('token:', token);
    
    if (!user || !token) {
      console.log('❌ Sem usuário ou token, saindo...');
      return;
    }

    // Evitar múltiplas requisições simultâneas
    if (isFetching) {
      console.log('🔄 Já está buscando dados, aguardando...');
      return;
    }

    // Cache de 30 segundos para evitar requisições excessivas
    const now = Date.now();
    if (now - lastFetchTime < 30000 && data.cashFlow.length > 0) {
      console.log('⏰ Dados em cache, usando dados existentes');
      return;
    }
    
    setIsFetching(true);
    console.log('✅ Iniciando busca de dados financeiros...');
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fazer requisições em paralelo para melhor performance
      const [cashFlowRes, creditRes, expensesRes, salesRes, productsRes] = await Promise.all([
        api.get('/fluxo-caixa'),
        api.get('/credit-accounts'),
        api.get('/despesas'),
        api.get('/vendas'),
        api.get('/products')
      ]);
      
      console.log('✅ Dados financeiros carregados com sucesso');
      
      // Garantir que todos os dados sejam arrays - tratar resposta paginada
      const cashFlow = cashFlowRes.data?.data ? cashFlowRes.data.data : (Array.isArray(cashFlowRes.data) ? cashFlowRes.data : []);
      const creditAccounts = creditRes.data?.data ? creditRes.data.data : (Array.isArray(creditRes.data) ? creditRes.data : []);
      const expenses = expensesRes.data?.data ? expensesRes.data.data : (Array.isArray(expensesRes.data) ? expensesRes.data : []);
      const sales = salesRes.data?.data ? salesRes.data.data : (Array.isArray(salesRes.data) ? salesRes.data : []);
      const products = productsRes.data?.data ? productsRes.data.data : (Array.isArray(productsRes.data) ? productsRes.data : []);
      
      const totalIncome = cashFlow.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
      const totalExpenses = cashFlow.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
      const totalDebt = creditAccounts.reduce((sum, acc) => sum + Number(acc.total_debt), 0);
      
      console.log('✅ Definindo dados e parando loading');
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
      
      setLastFetchTime(now);
    } catch (error) {
      console.error('❌ Erro ao buscar dados financeiros:', error);
      console.log('✅ Parando loading mesmo com erro');
      setData(prev => ({ ...prev, isLoading: false }));
    } finally {
      setIsFetching(false);
    }
  };

  const refreshData = async () => {
    console.log('🔄 RefreshData chamado');
    setLastFetchTime(0); // Forçar nova busca
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
      const res = await api.post('/fluxo-caixa', payload);
      // Recarregar dados para garantir consistência
      await refreshData();
      console.log('[FinancialContext] Dados recarregados após adicionar lançamento');
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
      const res = await api.post('/despesas', payload);
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
      const res = await api.put(`/despesas/${id}`, updates);
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
    console.log('[FinancialContext] 🚀 Iniciando registerSale com dados:', saleData);
    
    if (!user || !token) {
      console.log('[FinancialContext] ❌ Sem usuário ou token');
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Buscar nome do produto pelo product_id
      console.log('[FinancialContext] 🔍 Buscando produto com ID:', saleData.product_id);
      console.log('[FinancialContext] 📦 Produtos disponíveis:', data.products.map(p => ({ id: p.id, name: p.name })));
      
      const selectedProduct = data.products.find((p) => p.id === saleData.product_id);
      if (!selectedProduct) {
        console.error('[FinancialContext] ❌ Produto não encontrado:', saleData.product_id);
        throw new Error('Produto não encontrado');
      }
      
      console.log('[FinancialContext] ✅ Produto encontrado:', selectedProduct.name);
      
      const payload = {
        product_id: saleData.product_id,
        user_id: user?.id,
        product_name: selectedProduct.name,
        quantity: Number(saleData.quantity),
        unit_price: Number(saleData.unit_price),
        total_price: Number(saleData.quantity) * Number(saleData.unit_price),
        sale_date: saleData.date, // Enviar como string em vez de Date object
        status: 'completed',
        store_id: selectedProduct.store_id || null,
        customer_name: saleData.customer_name || 'Cliente não informado'
      };
      
      console.log('[FinancialContext] 📤 Payload para API de vendas:', payload);
      
      const res = await api.post('/vendas', payload);
      console.log('[FinancialContext] ✅ Venda registrada na API:', res.data);
      
      // Lançar também no fluxo de caixa
      const cashFlowPayload = {
        user_id: user?.id,
        store_id: payload.store_id,
        type: 'income',
        category: 'Venda',
        description: `Venda: ${payload.product_name} - Cliente: ${payload.customer_name}`,
        amount: String(Number(payload.total_price)), // Converter para string como addCashFlowEntry
        date: new Date(payload.sale_date).toISOString(), // Converter para ISO string como addCashFlowEntry
        payment_method: saleData.payment_method || 'cash'
      };
      
      console.log('[FinancialContext] 📤 Payload para fluxo de caixa:', cashFlowPayload);
      
      const cashFlowRes = await api.post('/fluxo-caixa', cashFlowPayload);
      console.log('[FinancialContext] ✅ Entrada no fluxo de caixa registrada:', cashFlowRes.data);
      
      // Recarregar dados para garantir que tudo esteja atualizado
      console.log('[FinancialContext] 🔄 Recarregando dados...');
      await refreshData();
      console.log('[FinancialContext] ✅ Dados recarregados após venda');
      
      toast({ title: 'Sucesso', description: 'Venda registrada!' });
    } catch (error: any) {
      console.error('[FinancialContext] ❌ Erro ao registrar venda:', error);
      console.error('[FinancialContext] ❌ Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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
      const res = await api.post('/credit-transactions', {
        credit_account_id: accountId,
        type,
        amount,
        description: description || ''
      });
      setData(prev => ({ ...prev, creditAccounts: prev.creditAccounts })); // Atualização real pode ser feita via refreshData
      toast({ title: 'Sucesso', description: `${type === 'debt' ? 'Débito' : 'Pagamento'} registrado com sucesso!` });
    } catch (error: any) {
      console.error('Erro ao registrar transação:', error);
      toast({ title: 'Erro', description: error.message || 'Não foi possível registrar a transação', variant: 'destructive' });
    }
  };

  useEffect(() => {
    console.log('=== FinancialContext useEffect ===');
    console.log('user:', user);
    console.log('data.isLoading:', data.isLoading);
    
    if (user) {
      console.log('✅ Usuário encontrado, buscando dados...');
      fetchAllData();
    } else {
      console.log('❌ Sem usuário, não buscando dados');
    }
  }, [user]);

  console.log('=== FinancialContext RETURN ===');
  console.log('data.isLoading:', data.isLoading);
  console.log('data:', data);

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