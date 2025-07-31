import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, DollarSign, Search, FileDown, MessageCircle, Calendar, MapPin, Phone, User, FileText, Trash2, Eye, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancial } from "@/contexts/FinancialContext";
import ClientHistoryModal from "./ClientHistoryModal";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

type CreditAccount = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  total_debt: number;
  created_at: string;
};

type InstallmentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface SelectedProduct {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface NewDebtFormData {
  // Dados do Cliente
  is_new_customer: boolean;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  existing_customer_id: string;
  
  // Detalhes da Venda
  selected_products: SelectedProduct[];
  total_value: string;
  
  // Parcelamento
  installments: string;
  installment_value: string;
  frequency: InstallmentFrequency;
  
  // Datas
  first_payment_date: string;
  final_due_date: string;
  
  // Observações
  observations: string;
}

// Função para formatar data para dd/mm/yyyy
const formatDateToBR = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Função para converter data de dd/mm/yyyy para yyyy-mm-dd
const formatDateToISO = (dateStr: string): string => {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

// Função para converter data de yyyy-mm-dd para dd/mm/yyyy
const formatDateFromISO = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

// Função para formatar data enquanto digita
const formatDateInput = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara DD/MM/AAAA
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
};

// Função para validar se a data é válida
const isValidDate = (dateStr: string): boolean => {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year &&
         year >= 2020 && year <= 2030;
};

const CreditTab = () => {
  const { toast } = useToast();
  const { data, addCreditTransaction, refreshData } = useFinancial();
  const { token } = useAuth();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CreditAccount | null>(null);
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para seleção de produtos
  const [productToAdd, setProductToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  
  const [formData, setFormData] = useState<NewDebtFormData>({
    is_new_customer: true,
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    existing_customer_id: '',
    selected_products: [],
    total_value: '',
    installments: '1',
    installment_value: '',
    frequency: 'monthly',
    first_payment_date: formatDateToBR(new Date()),
    final_due_date: '',
    observations: ''
  });

  const accounts = data.creditAccounts || [];
  const filteredAccounts = Array.isArray(accounts) ? accounts.filter(account => 
    account.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.customer_phone || '').includes(searchTerm)
  ) : [];

  // Calcular valor total dos produtos selecionados
  const totalProductsValue = (formData.selected_products || []).reduce((sum, product) => sum + product.total, 0);

  // Atualizar valor total quando produtos mudam
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      total_value: totalProductsValue.toFixed(2)
    }));
  }, [totalProductsValue]);

  // Calcular valor da parcela automaticamente
  useEffect(() => {
    if (formData.total_value && formData.installments && parseFloat(formData.installments) > 0) {
      const total = parseFloat(formData.total_value);
      const installments = parseFloat(formData.installments);
      const installmentValue = total / installments;
      setFormData(prev => ({
        ...prev,
        installment_value: installmentValue.toFixed(2)
      }));
    }
  }, [formData.total_value, formData.installments]);

  // Calcular data final automaticamente
  useEffect(() => {
    if (formData.first_payment_date && formData.installments && parseFloat(formData.installments) > 0 && formData.frequency) {
      // Validar formato da data
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(formData.first_payment_date)) return;
      
      const firstDateISO = formatDateToISO(formData.first_payment_date);
      if (!firstDateISO) return;
      
      const firstDate = new Date(firstDateISO);
      let finalDate = new Date(firstDate);
      const installments = parseFloat(formData.installments);
      
      console.log('[CreditTab] 📅 Calculando data final:', {
        firstDate: formData.first_payment_date,
        installments,
        frequency: formData.frequency
      });
      
      switch (formData.frequency) {
        case 'daily':
          finalDate.setDate(firstDate.getDate() + (installments - 1));
          break;
        case 'weekly':
          finalDate.setDate(firstDate.getDate() + (installments - 1) * 7);
          break;
        case 'biweekly':
          finalDate.setDate(firstDate.getDate() + (installments - 1) * 14);
          break;
        case 'monthly':
          finalDate.setMonth(firstDate.getMonth() + (installments - 1));
          break;
      }
      
      const finalDateFormatted = formatDateToBR(finalDate);
      
      setFormData(prev => ({
        ...prev,
        final_due_date: finalDateFormatted
      }));
      
      console.log('[CreditTab] ✅ Data final calculada:', {
        frequency: formData.frequency,
        installments: formData.installments,
        firstDate: formData.first_payment_date,
        finalDate: finalDateFormatted
      });
    }
  }, [formData.first_payment_date, formData.installments, formData.frequency]);

  // Gerar opções de parcelas de 1x até 24x
  const installmentOptions = Array.from({ length: 24 }, (_, i) => i + 1).map(num => ({
    value: num.toString(),
    label: `${num}x`
  }));

  // Adicionar produto à lista
  const handleAddProduct = () => {
    if (!productToAdd) return;
    
    const product = (data.products || []).find(p => p.id === productToAdd);
    if (!product) return;
    
    const newProduct: SelectedProduct = {
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: quantityToAdd,
      total: Number(product.price) * quantityToAdd
    };
    
    setFormData(prev => ({
      ...prev,
      selected_products: [...prev.selected_products, newProduct]
    }));
    
    setProductToAdd('');
    setQuantityToAdd(1);
  };

  // Remover produto da lista
  const handleRemoveProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_products: prev.selected_products.filter(p => p.product_id !== productId)
    }));
  };

  // Preencher dados do cliente quando selecionado
  const handleClientSelect = (client: CreditAccount) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      is_new_customer: false,
      customer_name: client.customer_name,
      customer_phone: client.customer_phone,
      customer_address: client.customer_address || '',
      existing_customer_id: client.id
    }));
  };

  // Buscar cliente existente pelo telefone ou nome
  const searchExistingClient = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanName = name.toLowerCase().trim();
    
    return (accounts || []).find(account => 
      account.customer_phone === cleanPhone || 
      account.customer_name.toLowerCase() === cleanName
    );
  };

  // Verificar cliente existente quando telefone ou nome mudam
  const handleCustomerDataChange = (field: 'name' | 'phone', value: string) => {
    setFormData(prev => ({ ...prev, [field === 'name' ? 'customer_name' : 'customer_phone']: value }));
    
    if (formData.is_new_customer && value.trim()) {
      const existingClient = searchExistingClient(
        field === 'phone' ? value : formData.customer_phone,
        field === 'name' ? value : formData.customer_name
      );
      
      if (existingClient) {
        console.log('[CreditTab] 🔍 Cliente existente encontrado:', existingClient);
        toast({
          title: 'Cliente encontrado',
          description: `Cliente "${existingClient.customer_name}" já existe. Deseja usar este cliente?`,
          variant: 'default',
          action: (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  handleClientSelect(existingClient);
                  toast({ title: 'Cliente selecionado', description: 'Cliente existente selecionado com sucesso!' });
                }}
              >
                Usar existente
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast({ title: 'Continuando', description: 'Continuando com novo cliente' })}
              >
                Novo cliente
              </Button>
            </div>
          )
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.customer_name.trim()) {
      toast({ title: 'Erro', description: 'Nome do cliente é obrigatório', variant: 'destructive' });
      return;
    }
    
    if (!formData.customer_phone.trim()) {
      toast({ title: 'Erro', description: 'Telefone do cliente é obrigatório', variant: 'destructive' });
      return;
    }
    
    // Validar formato do telefone (apenas números)
    const phoneRegex = /^\d+$/;
    if (!phoneRegex.test(formData.customer_phone.replace(/\D/g, ''))) {
      toast({ title: 'Erro', description: 'Telefone deve conter apenas números', variant: 'destructive' });
      return;
    }
    
    if (formData.selected_products.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um produto à venda', variant: 'destructive' });
      return;
    }
    
    if (!formData.total_value || parseFloat(formData.total_value) <= 0) {
      toast({ title: 'Erro', description: 'Valor total deve ser maior que zero', variant: 'destructive' });
      return;
    }
    
    if (!formData.installments || parseFloat(formData.installments) <= 0) {
      toast({ title: 'Erro', description: 'Número de parcelas deve ser maior que zero', variant: 'destructive' });
      return;
    }

    // Validar formato de data
    if (!isValidDate(formData.first_payment_date)) {
      toast({ title: 'Erro', description: 'Data da primeira cobrança deve estar no formato DD/MM/AAAA e ser uma data válida', variant: 'destructive' });
      return;
    }

    try {
      console.log('[CreditTab] 📤 ENVIANDO NOVA OPERAÇÃO DE DÉBITO:', formData);
      
      let creditAccountId = formData.existing_customer_id;
      
      // Se for cliente novo, verificar se já existe antes de criar
      if (formData.is_new_customer) {
        const phone = formData.customer_phone.replace(/\D/g, ''); // Remove caracteres não numéricos
        
        console.log('[CreditTab] 🔍 Verificando se cliente já existe:', { phone, name: formData.customer_name });
        
        try {
          // Verificar se o cliente já existe pelo telefone
          const existingClients = accounts.filter(account => 
            account.customer_phone === phone || 
            account.customer_name.toLowerCase() === formData.customer_name.toLowerCase()
          );
          
          if (existingClients.length > 0) {
            const existingClient = existingClients[0];
            console.log('[CreditTab] ✅ Cliente já existe:', existingClient);
            
            // Perguntar ao usuário se quer usar o cliente existente
            if (window.confirm(`Cliente "${existingClient.customer_name}" já existe com o telefone ${existingClient.customer_phone}. Deseja usar este cliente existente?`)) {
              creditAccountId = existingClient.id;
              
              // Atualizar formulário com dados do cliente existente
              setFormData(prev => ({
                ...prev,
                is_new_customer: false,
                customer_name: existingClient.customer_name,
                customer_phone: existingClient.customer_phone,
                customer_address: existingClient.customer_address || '',
                existing_customer_id: existingClient.id
              }));
              
              console.log('[CreditTab] ✅ Usando cliente existente:', creditAccountId);
            } else {
              console.log('[CreditTab] ❌ Usuário cancelou operação');
              toast({ title: 'Operação cancelada', description: 'Operação cancelada pelo usuário', variant: 'default' });
              return;
            }
          } else {
            // Cliente não existe, criar novo
            const clientData = {
              customer_name: formData.customer_name.trim(),
              customer_phone: phone,
              customer_address: formData.customer_address.trim() || null // Envia null se vazio
            };
            
            console.log('[CreditTab] 📤 Criando novo cliente:', clientData);
            
            const createClientRes = await api.post('/credit-accounts', clientData);
            creditAccountId = createClientRes.data.id;
            console.log('[CreditTab] ✅ Cliente criado:', creditAccountId);
          }
        } catch (error: any) {
          console.error('[CreditTab] ❌ Erro ao verificar/criar cliente:', error);
          console.error('[CreditTab] 📋 Resposta do servidor:', error.response?.data);
          console.error('[CreditTab] 📋 Status:', error.response?.status);
          
          // Mostrar erro específico do backend
          const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao processar cliente';
          toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
          return;
        }
      }
      
      // Converter data para formato ISO
      const firstPaymentDateISO = formatDateToISO(formData.first_payment_date);
      const finalDueDateISO = formatDateToISO(formData.final_due_date);
      
      // Criar a operação de débito
      const debtOperation = {
        credit_account_id: creditAccountId,
        type: 'debt',
        amount: parseFloat(formData.total_value),
        description: `Venda de ${formData.selected_products.length} produtos`,
        installments: parseFloat(formData.installments),
        installment_value: parseFloat(formData.installment_value),
        frequency: formData.frequency,
        first_payment_date: firstPaymentDateISO,
        final_due_date: finalDueDateISO,
        observations: formData.observations,
        products: (formData.selected_products || []).map(p => ({
          product_id: p.product_id,
          quantity: p.quantity,
          price: p.price
        }))
      };
      
      console.log('[CreditTab] 📤 Operação de débito com parcelamento:', debtOperation);
      
      // Usar rota específica para parcelamento (não a rota simples de transações)
      const debtRes = await api.post('/creditTransactions/debit-with-installments', debtOperation);
      console.log('[CreditTab] ✅ Débito com parcelamento registrado:', debtRes.data);
      
      // Atualizar dados
      await refreshData();
      
      // Limpar formulário
      setFormData({
        is_new_customer: true,
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        existing_customer_id: '',
        selected_products: [],
        total_value: '',
        installments: '1',
        installment_value: '',
        frequency: 'monthly',
        first_payment_date: formatDateToBR(new Date()),
        final_due_date: '',
        observations: ''
      });
      
      setShowTransactionForm(false);
      setSelectedClient(null);
      
      toast({ title: 'Sucesso', description: 'Operação de débito com parcelamento registrada com sucesso!' });
      
    } catch (error) {
      console.error('[CreditTab] ❌ Erro ao registrar débito:', error);
      toast({ title: 'Erro', description: 'Não foi possível registrar a operação', variant: 'destructive' });
    }
  };

  const handleClientClick = (client: CreditAccount) => {
    setSelectedClient(client);
    setShowClientHistory(true);
  };

  const handleDeleteClient = (clientId: string) => {
    setShowDeleteConfirm(clientId);
  };

  const deleteClient = async (clientId: string) => {
    try {
      // Verificar se o cliente tem dívidas pendentes
      const client = accounts?.find(acc => acc.id === clientId);
      if (client && Number(client.total_debt) > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir um cliente com dívidas pendentes. Quite todas as dívidas primeiro.",
          variant: "destructive",
        });
        return;
      }

      // Excluir cliente
      await api.delete(`/credit-accounts/${clientId}`);
      
      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });

      // Recarregar dados
      await refreshData();
      
    } catch (error) {
      console.error('[CreditTab] ❌ Erro ao excluir cliente:', error);
      
      let errorMessage = "Falha ao excluir cliente. Tente novamente.";
      if (error.response?.status === 404) {
        errorMessage = "Cliente não encontrado.";
      } else if (error.response?.status === 400) {
        errorMessage = "Não é possível excluir um cliente com dívidas pendentes.";
      } else if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Crediário', 20, 20);
    doc.text(`Total de clientes: ${(accounts || []).length}`, 20, 40);
    doc.text(`Total em dívida: R$ ${(accounts || []).reduce((sum, acc) => sum + acc.total_debt, 0).toFixed(2)}`, 20, 50);
    doc.save('crediario.pdf');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet((accounts || []).map(acc => ({
      Nome: acc.customer_name,
      Telefone: acc.customer_phone,
      'Total em Dívida': acc.total_debt,
      'Data de Criação': new Date(acc.created_at).toLocaleDateString('pt-BR')
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Crediário');
    XLSX.writeFile(wb, 'crediario.xlsx');
  };

  const totalDebt = data.totalDebt;
  const clientsWithDebt = (accounts || []).filter(account => Number(account.total_debt) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            💳 Crediário
          </h2>
          <p className="text-muted-foreground">Sistema inteligente de crédito para sua loja</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setShowTransactionForm(!showTransactionForm)} 
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showTransactionForm ? 'Fechar' : 'Nova Operação'}
          </Button>
          <Button variant="outline" onClick={exportToPDF} className="border-orange-200 text-orange-600 hover:bg-orange-50">
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel} className="border-green-200 text-green-600 hover:bg-green-50">
            <FileDown className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-red-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">💰 Dinheiro em Aberto</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalDebt.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">⚠️ Clientes Devendo</p>
                <p className="text-2xl font-bold text-orange-600">{clientsWithDebt}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">👥 Total de Clientes</p>
                <p className="text-2xl font-bold text-blue-600">{(accounts || []).length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Pesquisa */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="🔍 Buscar cliente por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Nova Operação */}
      {showTransactionForm && (
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
            <CardTitle className="flex items-center text-orange-700">
              <Plus className="h-5 w-5 mr-2" />
              Nova Operação do Crediário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tipo de Operação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  true ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-700">Novo Débito</h3>
                      <p className="text-sm text-red-600">Cliente ficou devendo</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-all hover:border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">Pagamento</h3>
                      <p className="text-sm text-gray-600">Cliente pagou</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Dados do Cliente
                </h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_new_customer}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new_customer: checked }))}
                  />
                  <Label>Cliente novo</Label>
                </div>

                {formData.is_new_customer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Nome do Cliente *</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) => handleCustomerDataChange('name', e.target.value)}
                        placeholder="Ex: João Silva"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">WhatsApp *</Label>
                      <Input
                        id="customer_phone"
                        value={formData.customer_phone}
                        onChange={(e) => handleCustomerDataChange('phone', e.target.value)}
                        placeholder="Ex: 11987654321"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="customer_address">Endereço</Label>
                      <Input
                        id="customer_address"
                        value={formData.customer_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                        placeholder="Ex: Rua das Flores, 123 - Centro"
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label>Selecionar Cliente Existente</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                      {Array.isArray(filteredAccounts) && (filteredAccounts || []).map((client) => (
                        <div
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedClient?.id === client.id
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{client.customer_name}</div>
                          <div className="text-xs text-gray-600">{client.customer_phone}</div>
                          <div className="text-xs text-red-600 font-medium">
                            Dívida: R$ {Number(client.total_debt).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seleção de Produtos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Produtos da Venda
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="product_to_add">Selecionar Produto *</Label>
                    <Select value={productToAdd} onValueChange={setProductToAdd}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Escolha um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(data.products) && (data.products || []).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - R$ {Number(product.price).toFixed(2).replace('.', ',')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity_to_add">Quantidade *</Label>
                    <Input
                      id="quantity_to_add"
                      type="number"
                      min="1"
                      value={quantityToAdd}
                      onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
                      placeholder="Ex: 2"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={!productToAdd}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Produtos Selecionados</Label>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 mt-1">
                      {(formData.selected_products || []).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhum produto adicionado.</p>
                      ) : (
                        Array.isArray(formData.selected_products) && (formData.selected_products || []).map((product) => (
                          <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.quantity}x R$ {Number(product.price).toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">R$ {Number(product.total).toFixed(2).replace('.', ',')}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(product.product_id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="total_value">Valor Total da Venda</Label>
                    <Input
                      id="total_value"
                      type="number"
                      step="0.01"
                      value={formData.total_value}
                      readOnly
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculado automaticamente</p>
                  </div>
                </div>
              </div>

              {/* Parcelamento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Parcelamento
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="installments">Parcelas (vezes que vai pagar) *</Label>
                    <Select
                      value={formData.installments}
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, installments: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Escolha o número de parcelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(installmentOptions) && (installmentOptions || []).map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="installment_value">Valor de cada parcela</Label>
                    <Input
                      id="installment_value"
                      type="number"
                      step="0.01"
                      value={formData.installment_value}
                      readOnly
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculado automaticamente</p>
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequência *</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: InstallmentFrequency) => setFormData(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Datas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_payment_date">Data da primeira cobrança *</Label>
                    <Input
                      id="first_payment_date"
                      type="text"
                      value={formData.first_payment_date}
                      onChange={(e) => {
                        const formatted = formatDateInput(e.target.value);
                        setFormData(prev => ({ ...prev, first_payment_date: formatted }));
                      }}
                      placeholder="DD/MM/AAAA"
                      className={`mt-1 ${formData.first_payment_date && !isValidDate(formData.first_payment_date) ? 'border-red-500' : ''}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">Formato: DD/MM/AAAA</p>
                    {formData.first_payment_date && !isValidDate(formData.first_payment_date) && (
                      <p className="text-xs text-red-500 mt-1">Data inválida</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="final_due_date">Data de vencimento final</Label>
                    <Input
                      id="final_due_date"
                      type="text"
                      value={formData.final_due_date}
                      readOnly
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculado automaticamente</p>
                  </div>
                </div>
                
                {/* Exemplo de cálculo */}
                {formData.first_payment_date && isValidDate(formData.first_payment_date) && formData.installments && formData.frequency && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">📅 Exemplo de Parcelas:</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      {(() => {
                        const installments = parseFloat(formData.installments);
                        const firstDateISO = formatDateToISO(formData.first_payment_date);
                        if (!firstDateISO) return null;
                        
                        const firstDate = new Date(firstDateISO);
                        const examples = [];
                        
                        for (let i = 1; i <= Math.min(installments, 3); i++) {
                          let dueDate = new Date(firstDate);
                          
                          switch (formData.frequency) {
                            case 'daily':
                              dueDate.setDate(firstDate.getDate() + (i - 1));
                              break;
                            case 'weekly':
                              dueDate.setDate(firstDate.getDate() + (i - 1) * 7);
                              break;
                            case 'biweekly':
                              dueDate.setDate(firstDate.getDate() + (i - 1) * 14);
                              break;
                            case 'monthly':
                              dueDate.setMonth(firstDate.getMonth() + (i - 1));
                              break;
                          }
                          
                          examples.push(
                            <div key={i} className="flex justify-between">
                              <span>{i}ª parcela:</span>
                              <span className="font-medium">{formatDateToBR(dueDate)}</span>
                            </div>
                          );
                        }
                        
                        if (installments > 3) {
                          examples.push(
                            <div key="more" className="text-blue-600 italic">
                              ... e mais {installments - 3} parcelas
                            </div>
                          );
                        }
                        
                        return examples;
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Observações
                </h3>
                
                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Ex: Combinado pagar toda sexta-feira, Vai pagar parcelado via Pix, Cliente pediu pra começar a pagar dia 5"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransactionForm(false)}
                >
                  ❌ Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  💾 Salvar operação
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  📨 Enviar no WhatsApp
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Clientes em Tabela */}
      {filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </h3>
              <p className="text-sm mb-4">
                {searchTerm ? 'Tente uma busca diferente' : 'Registre sua primeira operação para começar'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Client Cards */}
          <div className="block md:hidden">
            <div className="space-y-4">
              {Array.isArray(filteredAccounts) && (filteredAccounts || []).map((account) => (
                <Card key={account.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        Number(account.total_debt) > 0 ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        <Users className={`h-6 w-6 ${
                          Number(account.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{account.customer_name}</h3>
                          <Badge variant={Number(account.total_debt) > 0 ? "destructive" : "default"}>
                            {Number(account.total_debt) > 0 ? 'Em débito' : 'Quitado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {account.customer_phone || 'Telefone não informado'}
                        </p>
                        <p className={`text-lg font-bold ${
                          Number(account.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {Number(account.total_debt) > 0 
                            ? `R$ ${Number(account.total_debt).toFixed(2).replace('.', ',')}`
                            : '✅ Quitado'
                          }
                        </p>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClientClick(account);
                            }}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(account.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Desktop Table - Hidden on Mobile */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Meus Clientes ({filteredAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Cliente</th>
                      <th className="text-left p-3">Telefone</th>
                      <th className="text-left p-3">Débito Total</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredAccounts) && (filteredAccounts || []).map((account) => (
                      <tr key={account.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              Number(account.total_debt) > 0 ? 'bg-red-100' : 'bg-green-100'
                            }`}>
                              <Users className={`h-5 w-5 ${
                                Number(account.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                              }`} />
                            </div>
                            <span className="font-medium">{account.customer_name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">
                          {account.customer_phone || 'Não informado'}
                        </td>
                        <td className="p-3">
                          <span className={`font-semibold ${
                            Number(account.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {Number(account.total_debt) > 0 
                              ? `R$ ${Number(account.total_debt).toFixed(2).replace('.', ',')}`
                              : 'R$ 0,00'
                            }
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant={Number(account.total_debt) > 0 ? "destructive" : "default"}>
                            {Number(account.total_debt) > 0 ? 'Em débito' : 'Quitado'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {showDeleteConfirm === account.id ? (
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteClient(account.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelDelete}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClientClick(account)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClient(account.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de Histórico */}
      <ClientHistoryModal
        isOpen={showClientHistory}
        onClose={() => setShowClientHistory(false)}
        client={selectedClient}
      />
    </div>
  );
};

export default CreditTab;