import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/constants/api';
import api from '@/services/api';

// Cache global para dados financeiros
let globalFinancialCache = {
  data: null,
  timestamp: 0,
  isFetching: false
};

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
    if (!user || !token) {
      console.log('[FinancialContext] fetchAllData - user ou token não disponível');
      return;
    }

    console.log('[FinancialContext] fetchAllData iniciado para user:', user.id);

    // Verificar cache global primeiro
    const now = Date.now();
    const cacheValid = now - globalFinancialCache.timestamp < 60000; // 1 minuto
    
    if (globalFinancialCache.isFetching) {
      console.log('[FinancialContext] Requisição global em andamento, aguardando...');
      return;
    }

    if (cacheValid && globalFinancialCache.data) {
      console.log('[FinancialContext] Usando cache global válido');
      setData(globalFinancialCache.data);
      return;
    }
    
    console.log('[FinancialContext] Cache inválido ou inexistente, buscando dados da API');
    globalFinancialCache.isFetching = true;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('[FinancialContext] Fazendo requisições paralelas...');
      
      // Fazer requisições em paralelo para melhor performance
      const [cashFlowRes, creditRes, expensesRes, salesRes, productsRes] = await Promise.all([
        api.get('/fluxo-caixa'),
        api.get('/credit-accounts'),
        api.get('/despesas'),
        api.get('/vendas'),
        api.get('/products')
      ]);
      
      console.log('[FinancialContext] Requisições concluídas, processando dados...');
      
      // Garantir que todos os dados sejam arrays - tratar resposta paginada
      const cashFlow = cashFlowRes.data?.data ? cashFlowRes.data.data : (Array.isArray(cashFlowRes.data) ? cashFlowRes.data : []);
      const creditAccounts = creditRes.data?.data ? creditRes.data.data : (Array.isArray(creditRes.data) ? creditRes.data : []);
      const expenses = expensesRes.data?.data ? expensesRes.data.data : (Array.isArray(expensesRes.data) ? expensesRes.data : []);
      const sales = salesRes.data?.data ? salesRes.data.data : (Array.isArray(salesRes.data) ? salesRes.data : []);
      
      let products = [];
      if (productsRes.data && productsRes.data.data && Array.isArray(productsRes.data.data)) {
        products = productsRes.data.data;
      } else if (Array.isArray(productsRes.data)) {
        products = productsRes.data;
      } else {
        products = [];
      }
      
      // Garantir que todos os arrays sejam arrays válidos
      const safeCashFlow = Array.isArray(cashFlow) ? cashFlow : [];
      const safeCreditAccounts = Array.isArray(creditAccounts) ? creditAccounts : [];
      const safeExpenses = Array.isArray(expenses) ? expenses : [];
      const safeSales = Array.isArray(sales) ? sales : [];
      const safeProducts = Array.isArray(products) ? products : [];
      
      // DEBUG DETALHADO - Verificar dados brutos do fluxo de caixa
      console.log('[FinancialContext] 🔍 DADOS BRUTOS DO FLUXO DE CAIXA:');
      safeCashFlow.forEach((entry, index) => {
        console.log(`📋 Entrada ${index + 1}:`, {
          id: entry.id,
          type: entry.type,
          type_original: entry.type,
          description: entry.description,
          amount: entry.amount,
          amount_original: entry.amount,
          category: entry.category,
          date: entry.date,
          payment_method: entry.payment_method
        });
      });
      
      // DEBUG DETALHADO - Verificar dados brutos das contas de crédito
      console.log('[FinancialContext] 🔍 DADOS BRUTOS DAS CONTAS DE CRÉDITO:');
      safeCreditAccounts.forEach((account, index) => {
        console.log(`👤 Conta ${index + 1}:`, {
          id: account.id,
          customer_name: account.customer_name,
          customer_phone: account.customer_phone,
          total_debt: account.total_debt,
          total_debt_type: typeof account.total_debt,
          balance: account.balance, // Verificar se existe
          balance_type: typeof account.balance,
          created_at: account.created_at
        });
      });
      
      // Calcular totais
      const totalIncome = safeCashFlow
        .filter(entry => entry.type === 'income' || entry.type === 'entrada')
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      
      const totalExpenses = safeCashFlow
        .filter(entry => entry.type === 'expense' || entry.type === 'saida')
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      const balance = totalIncome - totalExpenses;
      const totalDebt = safeCreditAccounts.reduce((sum, acc) => sum + Number(acc.total_debt || 0), 0);

      const newData = {
        cashFlow: safeCashFlow,
        creditAccounts: safeCreditAccounts,
        expenses: safeExpenses,
        sales: safeSales,
        products: safeProducts,
        totalIncome,
        totalExpenses,
        balance,
        totalDebt,
        isLoading: false,
      };

      console.log('[FinancialContext] Dados processados:', {
        cashFlowCount: safeCashFlow.length,
        salesCount: safeSales.length,
        productsCount: safeProducts.length,
        totalIncome,
        totalExpenses,
        balance,
        totalDebt
      });

      // Atualizar cache global
      globalFinancialCache.data = newData;
      globalFinancialCache.timestamp = Date.now();
      globalFinancialCache.isFetching = false;

      setData(newData);
      
    } catch (error) {
      console.error('[FinancialContext] Erro ao buscar dados financeiros:', error);
      setData(prev => ({ ...prev, isLoading: false }));
      toast({ title: 'Erro', description: 'Não foi possível carregar os dados financeiros', variant: 'destructive' });
    } finally {
      globalFinancialCache.isFetching = false;
    }
  };

  const refreshData = async () => {
    console.log('[FinancialContext] Forçando atualização dos dados...');
    globalFinancialCache.timestamp = 0;
    globalFinancialCache.data = null;
    setData(prev => ({ ...prev, isLoading: true }));
    await fetchAllData();
  };

  const addCashFlowEntry = async (entry: any) => {
    if (!user || !token) return;
    
    console.log('[FinancialContext] 📤 ADICIONANDO ENTRADA NO FLUXO DE CAIXA:', entry);
    console.log('[FinancialContext] 🔍 Tipo da entrada:', entry.type);
    console.log('[FinancialContext] 🔍 Amount da entrada:', entry.amount);
    
    try {
      // Garantir que os dados estão no formato correto
      const payload = {
        user_id: entry.user_id,
        type: entry.type,
        category: entry.category,
        description: entry.description,
        amount: String(Number(entry.amount)), // Garantir que é string numérica
        date: new Date(entry.date).toISOString(),
        payment_method: entry.payment_method || 'cash'
      };
      
      console.log('[FinancialContext] 📤 Payload enviado para API:', payload);
      
      const res = await api.post('/fluxo-caixa', payload);
      
      console.log('[FinancialContext] ✅ Resposta da API:', res.data);
      console.log('[FinancialContext] 🔍 Tipo retornado pela API:', res.data.type);
      console.log('[FinancialContext] 🔍 Amount retornado pela API:', res.data.amount);
      
      // Atualizar dados localmente
      const newEntry = res.data;
      setData(prev => {
        const newCashFlow = [newEntry, ...prev.cashFlow];
        
        console.log('[FinancialContext] 🔄 Recalculando totais...');
        console.log('[FinancialContext] 📊 Total de entradas antes:', prev.totalIncome);
        console.log('[FinancialContext] 📊 Total de saídas antes:', prev.totalExpenses);
        
        // Recalcular totais (suportando ambos os formatos)
        const newTotalIncome = newCashFlow
          .filter(e => e.type === 'income' || e.type === 'entrada')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const newTotalExpenses = newCashFlow
          .filter(e => e.type === 'expense' || e.type === 'saida')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        
        console.log('[FinancialContext] 📊 Total de entradas depois:', newTotalIncome);
        console.log('[FinancialContext] 📊 Total de saídas depois:', newTotalExpenses);
        console.log('[FinancialContext] 📊 Saldo calculado:', newTotalIncome - newTotalExpenses);
        
        const updatedData = {
          ...prev,
          cashFlow: newCashFlow,
          totalIncome: newTotalIncome,
          totalExpenses: newTotalExpenses,
          balance: newTotalIncome - newTotalExpenses,
        };

        // Atualizar cache global
        globalFinancialCache.data = updatedData;
        globalFinancialCache.timestamp = Date.now();
        
        return updatedData;
      });
      
      toast({ title: 'Sucesso', description: 'Lançamento adicionado com sucesso!' });
    } catch (error) {
      console.error('[FinancialContext] ❌ Erro ao adicionar lançamento:', error);
      console.error('[FinancialContext] ❌ Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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
      
      // Atualizar dados localmente
      const newExpense = res.data;
      setData(prev => ({ 
        ...prev, 
        expenses: [newExpense, ...prev.expenses] 
      }));
      
      // Invalidar cache global
      globalFinancialCache.timestamp = 0;
      
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
              const res = await api.put(`/api/despesas/${id}`, updates);
      
      // Atualizar dados localmente
      const updatedExpense = res.data;
      setData(prev => ({
        ...prev,
        expenses: prev.expenses.map(exp => exp.id === id ? updatedExpense : exp)
      }));
      
      // Invalidar cache global
      globalFinancialCache.timestamp = 0;
      
      toast({ title: 'Sucesso', description: 'Despesa atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a despesa', variant: 'destructive' });
    }
  };

  const registerSale = async (saleData: any) => {
    console.log('[FinancialContext] 🛒 INICIANDO REGISTRO DE VENDA');
    console.log('[FinancialContext] 📋 Dados da venda:', saleData);
    
    try {
      // Usar a nova rota que integra automaticamente com fluxo de caixa
      const payload = {
        product_id: saleData.product_id,
        quantity: Number(saleData.quantity),
        unit_price: Number(saleData.unit_price),
        total_price: Number(saleData.quantity) * Number(saleData.unit_price),
        customer_name: saleData.customer_name || 'Cliente não informado',
        sale_date: saleData.date || new Date().toISOString(),
        payment_method: saleData.payment_method || 'cash'
        // O backend pode inferir o store_id do usuário autenticado
      };
      
      console.log('[FinancialContext] 📤 Enviando para nova rota /sales/product-sale:', payload);
      
      // Usar a nova rota que integra automaticamente
      const res = await api.post('/sales/product-sale', payload);
      console.log('[FinancialContext] ✅ Venda registrada com integração automática:', res.data);
      
      // Não precisamos mais criar entrada manual no fluxo de caixa
      // A nova rota já faz isso automaticamente
      console.log('[FinancialContext] ✅ Fluxo de caixa integrado automaticamente');
      
      // Atualizar dados locais
      await refreshData();
      console.log('[FinancialContext] ✅ Dados atualizados');
      
      return res.data;
      
    } catch (error) {
      console.error('[FinancialContext] ❌ ERRO ao registrar venda:', error);
      throw error;
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
      
      // Invalidar cache global para forçar atualização na próxima busca
      globalFinancialCache.timestamp = 0;
      
      toast({ title: 'Sucesso', description: `${type === 'debt' ? 'Débito' : 'Pagamento'} registrado com sucesso!` });
    } catch (error: any) {
      console.error('Erro ao registrar transação:', error);
      toast({ title: 'Erro', description: error.message || 'Não foi possível registrar a transação', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (user) {
      console.log('[FinancialContext] useEffect disparado, user:', user.id);
      
      // Debounce reduzido para melhor UX no carregamento inicial
      const timeoutId = setTimeout(() => {
        console.log('[FinancialContext] Iniciando fetchAllData após debounce');
        fetchAllData();
      }, 500);
      
      return () => {
        console.log('[FinancialContext] Limpando timeout');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('[FinancialContext] useEffect - user não disponível');
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