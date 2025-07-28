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
      
      // DEBUG DETALHADO - Verificar dados brutos do fluxo de caixa
      console.log('[FinancialContext] 🔍 DADOS BRUTOS DO FLUXO DE CAIXA:');
      cashFlow.forEach((entry, index) => {
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
      
      const totalIncome = cashFlow.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
      const totalExpenses = cashFlow.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
      const balance = totalIncome - totalExpenses;
      const totalDebt = creditAccounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);

      const newData = {
        cashFlow,
        creditAccounts,
        expenses,
        sales,
        products,
        totalIncome,
        totalExpenses,
        balance,
        totalDebt,
        isLoading: false,
      };

      console.log('[FinancialContext] Dados processados:', {
        cashFlowCount: cashFlow.length,
        salesCount: sales.length,
        productsCount: products.length,
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
    try {
      const payload = {
        ...entry,
        amount: String(Number(entry.amount)),
        date: new Date(entry.date).toISOString(),
      };
      const headers = { Authorization: `Bearer ${token}` };
      const res = await api.post('/fluxo-caixa', payload);
      
      // Atualizar dados localmente
      const newEntry = res.data;
      setData(prev => {
        const newCashFlow = [newEntry, ...prev.cashFlow];
        
        // Recalcular totais
        const newTotalIncome = newCashFlow.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
        const newTotalExpenses = newCashFlow.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
        
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
      const res = await api.put(`/despesas/${id}`, updates);
      
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
    if (!user || !token) {
      console.log('[FinancialContext] ❌ registerSale - user ou token não disponível');
      return;
    }
    
    console.log('[FinancialContext] 🛒 INICIANDO REGISTRO DE VENDA:', saleData);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Buscar nome do produto pelo product_id
      let selectedProduct = data.products.find((p) => p.id === saleData.product_id);
      
      console.log('[FinancialContext] 🔍 Produto encontrado no cache:', selectedProduct ? 'SIM' : 'NÃO');
      
      // Se não encontrou no cache local, buscar na API
      if (!selectedProduct) {
        try {
          console.log('[FinancialContext] 🔍 Buscando produto na API...');
          const productRes = await api.get(`/products/${saleData.product_id}`);
          selectedProduct = productRes.data;
          console.log('[FinancialContext] ✅ Produto encontrado na API:', selectedProduct.name);
        } catch (productError) {
          console.error('[FinancialContext] ❌ Erro ao buscar produto:', productError);
          // Usar dados fornecidos como fallback
          selectedProduct = {
            id: saleData.product_id,
            name: saleData.product_name || 'Produto não encontrado',
            store_id: null
          };
          console.log('[FinancialContext] ⚠️ Usando fallback para produto:', selectedProduct.name);
        }
      }
      
      const payload = {
        product_id: saleData.product_id,
        user_id: user?.id,
        product_name: selectedProduct.name,
        quantity: Number(saleData.quantity),
        unit_price: Number(saleData.unit_price),
        total_price: Number(saleData.quantity) * Number(saleData.unit_price),
        sale_date: saleData.date,
        status: 'completed',
        store_id: selectedProduct.store_id || null,
        customer_name: saleData.customer_name || 'Cliente não informado'
      };
      
      console.log('[FinancialContext] 📤 Enviando venda para API:', payload);
      
      const res = await api.post('/vendas', payload);
      console.log('[FinancialContext] ✅ Venda salva na API:', res.data);
      
      // Lançar também no fluxo de caixa
      const cashFlowPayload = {
        user_id: user?.id,
        store_id: payload.store_id,
        type: 'income', // ✅ CORRETO: Vendas devem ser income
        category: 'Venda',
        description: `Venda: ${payload.product_name} - ID: ${res.data.id} - Cliente: ${payload.customer_name}`,
        amount: String(Number(payload.total_price)),
        date: new Date(payload.sale_date).toISOString(),
        payment_method: saleData.payment_method || 'cash'
      };
      
      console.log('[FinancialContext] 📤 Enviando fluxo de caixa para API:', cashFlowPayload);
      console.log('[FinancialContext] 🔍 Verificando tipo:', cashFlowPayload.type);
      console.log('[FinancialContext] 🔍 Verificando amount:', cashFlowPayload.amount);
      
      try {
        const cashFlowRes = await api.post('/fluxo-caixa', cashFlowPayload);
        console.log('[FinancialContext] ✅ Fluxo de caixa salvo na API:', cashFlowRes.data);
        console.log('[FinancialContext] 🔍 Tipo retornado pela API:', cashFlowRes.data.type);
        console.log('[FinancialContext] 🔍 Amount retornado pela API:', cashFlowRes.data.amount);
        
        // Verificar se a API alterou o tipo
        if (cashFlowRes.data.type !== 'income') {
          console.error('[FinancialContext] ❌ PROBLEMA: API alterou tipo de income para:', cashFlowRes.data.type);
        } else {
          console.log('[FinancialContext] ✅ Tipo correto retornado pela API');
        }
      } catch (cashFlowError) {
        console.error('[FinancialContext] ❌ ERRO ao salvar fluxo de caixa:', cashFlowError);
        console.error('[FinancialContext] ❌ Detalhes do erro de fluxo de caixa:', {
          message: cashFlowError.message,
          response: cashFlowError.response?.data,
          status: cashFlowError.response?.status
        });
        // Continuar mesmo se o fluxo de caixa falhar
        console.log('[FinancialContext] ⚠️ Continuando sem fluxo de caixa...');
      }
      
      console.log('[FinancialContext] 🔄 FORÇANDO BUSCA REAL DA API...');
      
      // FORÇAR BUSCA REAL DA API - Ignorar cache completamente
      globalFinancialCache.timestamp = 0;
      globalFinancialCache.data = null;
      globalFinancialCache.isFetching = false;
      
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar dados atualizados da API
      await fetchAllData();
      
      console.log('[FinancialContext] ✅ Dados atualizados da API após venda');
      
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