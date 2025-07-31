import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, DollarSign, FileText, Phone, CreditCard, X, User, MessageCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancial } from '@/contexts/FinancialContext';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

type CreditAccount = {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_debt: number;
  // Outros campos que podem existir em CreditAccount
};

type CreditTransaction = {
  id: string;
  credit_account_id: string;
  type: 'debt' | 'payment' | 'debito' | 'pagamento';
  amount: number;
  date: string;
  description?: string;
  installments?: number;
  installment_value?: number;
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  first_payment_date?: string;
  final_due_date?: string;
  observations?: string;
  // Outros campos que podem existir em CreditTransaction
};

type Installment = {
  id: string;
  transaction_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_date?: string;
  paid_amount?: number;
};

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: CreditAccount | null;
}

const ClientHistoryModal = ({ isOpen, onClose, client }: ClientHistoryModalProps) => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showInstallmentPayment, setShowInstallmentPayment] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [installmentFilter, setInstallmentFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const { token } = useAuth();
  const { refreshData: refreshFinancialData } = useFinancial();
  const { toast } = useToast();

  useEffect(() => {
    if (client && isOpen) {
      fetchTransactions();
    }
  }, [client, isOpen]);

  // Função para gerar parcelas baseadas nas transações
  const generateInstallments = (transactions: CreditTransaction[]) => {
    const allInstallments: Installment[] = [];
    
    console.log('[ClientHistoryModal] 🔧 GERANDO PARCELAS');
    console.log('[ClientHistoryModal] 📋 Total de transações:', transactions.length);
    
    // Separar transações de débito e pagamento
    const debtTransactions = transactions.filter(t => t.type === 'debt' || t.type === 'debito');
    const paymentTransactions = transactions.filter(t => t.type === 'payment' || t.type === 'pagamento');
    
    console.log('[ClientHistoryModal] 📊 Transações de débito:', debtTransactions.length);
    console.log('[ClientHistoryModal] 📊 Transações de pagamento:', paymentTransactions.length);
    
    debtTransactions.forEach((transaction, index) => {
      console.log(`[ClientHistoryModal] 🔍 Analisando transação ${index + 1}:`, {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        installments: transaction.installments,
        installment_value: transaction.installment_value,
        frequency: transaction.frequency,
        first_payment_date: transaction.first_payment_date,
        date: transaction.date
      });
      
      // Converter campos numéricos para garantir que sejam números
      const installments = Number(transaction.installments) || 0;
      const installmentValue = Number(transaction.installment_value) || 0;
      
      console.log(`[ClientHistoryModal] 🔢 Valores convertidos:`, {
        installments,
        installmentValue,
        originalInstallments: transaction.installments,
        originalInstallmentValue: transaction.installment_value
      });
      
      if (installments > 1) {
        console.log(`[ClientHistoryModal] 📦 Transação parcelada: ${installments} parcelas`);
        
        // Verificar se temos todos os dados necessários para parcelamento
        if (!transaction.frequency) {
          console.log(`[ClientHistoryModal] ⚠️ Transação parcelada sem frequência definida, usando 'monthly' como padrão`);
        }
        
        // Gerar parcelas para transações parceladas
        const installmentAmount = installmentValue || (transaction.amount / installments);
        const firstDate = transaction.first_payment_date ? new Date(transaction.first_payment_date) : new Date(transaction.date);
        const frequency = transaction.frequency || 'monthly';
        
        console.log(`[ClientHistoryModal] 💰 Valor da parcela: ${installmentAmount}`);
        console.log(`[ClientHistoryModal] 📅 Data inicial: ${firstDate.toISOString()}`);
        console.log(`[ClientHistoryModal] 🔄 Frequência: ${frequency}`);
        
        for (let i = 1; i <= installments; i++) {
          const dueDate = new Date(firstDate);
          
          // Calcular data de vencimento baseada na frequência
          switch (frequency) {
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
            default:
              dueDate.setMonth(firstDate.getMonth() + (i - 1));
          }
          
          const installment = {
            id: `${transaction.id}-${i}`,
            transaction_id: transaction.id,
            installment_number: i,
            due_date: dueDate.toISOString(),
            amount: installmentAmount,
            status: 'pending' as const,
          };
          
          console.log(`[ClientHistoryModal] 📋 Criando parcela ${i}:`, installment);
          allInstallments.push(installment);
        }
      } else {
        console.log(`[ClientHistoryModal] 💳 Transação à vista - criando parcela única`);
        
        // Transação à vista - criar uma parcela única
        allInstallments.push({
          id: `${transaction.id}-1`,
          transaction_id: transaction.id,
          installment_number: 1,
          due_date: transaction.date,
          amount: transaction.amount,
          status: 'pending',
        });
      }
    });
    
    // Agora aplicar os pagamentos para marcar parcelas como pagas
    console.log('[ClientHistoryModal] 🔄 APLICANDO PAGAMENTOS ÀS PARCELAS');
    
    paymentTransactions.forEach((payment, index) => {
      console.log(`[ClientHistoryModal] 💳 Processando pagamento ${index + 1}:`, {
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        date: payment.date
      });
      
             // Tentar identificar qual parcela foi paga baseado na descrição e valor
       const paymentAmount = Number(payment.amount);
       const paymentDate = new Date(payment.date);
       const paymentDescription = payment.description || '';
       
       console.log(`[ClientHistoryModal] 🔍 Procurando parcela para pagamento: R$ ${paymentAmount}`);
       console.log(`[ClientHistoryModal] 📝 Descrição do pagamento: "${paymentDescription}"`);
       
       let installmentToMark = null;
       
       // Primeiro, tentar identificar pela descrição (ex: "Pagamento da 1ª parcela")
       if (paymentDescription.includes('parcela') || paymentDescription.includes('Parcela')) {
         const match = paymentDescription.match(/(\d+)ª?\s*parcela/i);
         if (match) {
           const installmentNumber = parseInt(match[1]);
           installmentToMark = allInstallments.find(inst => 
             inst.installment_number === installmentNumber && 
             Math.abs(inst.amount - paymentAmount) < 0.01 && 
             inst.status === 'pending'
           );
           
           if (installmentToMark) {
             console.log(`[ClientHistoryModal] ✅ Encontrada parcela ${installmentNumber} pela descrição`);
           }
         }
       }
       
       // Se não encontrou pela descrição, procurar pelo valor
       if (!installmentToMark) {
         const matchingInstallments = allInstallments.filter(inst => 
           Math.abs(inst.amount - paymentAmount) < 0.01 && inst.status === 'pending'
         );
         
         if (matchingInstallments.length > 0) {
           // Se encontrou parcelas com o mesmo valor, marcar a primeira como paga
           installmentToMark = matchingInstallments[0];
           console.log(`[ClientHistoryModal] ✅ Encontrada parcela ${installmentToMark.installment_number} pelo valor`);
         }
       }
       
       if (installmentToMark) {
         const installmentIndex = allInstallments.findIndex(inst => inst.id === installmentToMark.id);
         
         if (installmentIndex !== -1) {
           allInstallments[installmentIndex] = {
             ...allInstallments[installmentIndex],
             status: 'paid' as const,
             paid_date: paymentDate.toISOString(),
             paid_amount: paymentAmount
           };
           
           console.log(`[ClientHistoryModal] ✅ Parcela ${installmentToMark.installment_number} marcada como paga:`, allInstallments[installmentIndex]);
         }
       } else {
         console.log(`[ClientHistoryModal] ⚠️ Nenhuma parcela encontrada para o pagamento de R$ ${paymentAmount}`);
         console.log(`[ClientHistoryModal] 📋 Parcelas disponíveis:`, allInstallments.map(inst => ({
           id: inst.id,
           number: inst.installment_number,
           amount: inst.amount,
           status: inst.status
         })));
       }
    });
    
    console.log(`[ClientHistoryModal] ✅ Total de parcelas geradas: ${allInstallments.length}`);
    console.log('[ClientHistoryModal] 📋 Parcelas:', allInstallments);
    
    setInstallments(allInstallments);
  };

  const fetchTransactions = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      
      console.log('[ClientHistoryModal] 🔍 Buscando transações para cliente:', client.id);
      
      // Buscar todas as transações e filtrar por cliente
      const response = await api.get('/creditTransactions');
      console.log('[ClientHistoryModal] 📡 Resposta da API:', response.data);
      console.log('[ClientHistoryModal] 🔍 Tipo da resposta:', typeof response.data);
      console.log('[ClientHistoryModal] 🔍 É array?', Array.isArray(response.data));
      
      // Garantir que temos um array válido
      let allTransactions = [];
      if (Array.isArray(response.data)) {
        allTransactions = response.data;
      } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
        // Fallback para caso ainda receba o formato antigo
        allTransactions = response.data.data;
        console.log('[ClientHistoryModal] ⚠️ Usando formato antigo da API (data.data)');
      } else {
        console.log('[ClientHistoryModal] ⚠️ Resposta não é um array válido, usando array vazio');
        allTransactions = [];
      }
      
      console.log('[ClientHistoryModal] 📋 Total de transações encontradas:', allTransactions.length);
      
      // Filtrar transações do cliente atual
      const clientTransactions = allTransactions.filter((transaction: CreditTransaction) => 
        transaction.credit_account_id === client.id
      ) || [];
      
      console.log('[ClientHistoryModal] ✅ Transações do cliente:', clientTransactions.length);
      console.log('[ClientHistoryModal] 📋 Transações:', clientTransactions);
      
      // Log detalhado de cada transação para debug
      clientTransactions.forEach((transaction, index) => {
        console.log(`[ClientHistoryModal] 🔍 Transação ${index + 1} detalhada:`, {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          installments: transaction.installments,
          installment_value: transaction.installment_value,
          frequency: transaction.frequency,
          first_payment_date: transaction.first_payment_date,
          final_due_date: transaction.final_due_date,
          date: transaction.date,
          description: transaction.description
        });
      });
      
      // Garantir que data seja sempre um array
      const transactionsData = Array.isArray(clientTransactions) ? clientTransactions : [];
      setTransactions(transactionsData);
      
      // Gerar parcelas baseadas nas transações
      generateInstallments(transactionsData);
      
    } catch (error) {
      console.error('[ClientHistoryModal] ❌ Erro ao buscar histórico do cliente:', error);
      
      let errorMessage = "Falha ao carregar histórico do cliente";
      if (error.response?.status === 404) {
        errorMessage = "Rota de transações não disponível. Aguarde reinicialização do servidor.";
      } else if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Em caso de erro, definir array vazio
      setTransactions([]);
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppReminder = () => {
    if (!client?.customer_phone) return;
    
    const phone = client.customer_phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${client.customer_name}! 👋\n\nEste é um lembrete amigável sobre seu saldo pendente no Crediário:\n💰 Valor: R$ ${Number(client.total_debt).toFixed(2).replace('.', ',')}\n\nFique à vontade para entrar em contato para combinarmos o pagamento! 😊`
    );
    
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handlePayment = async () => {
    if (!client || !paymentAmount || Number(paymentAmount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe um valor válido para o pagamento",
        variant: "destructive",
      });
      return;
    }

    const amount = Number(paymentAmount);
    if (amount > Number(client.total_debt)) {
      toast({
        title: "Atenção",
        description: "O valor do pagamento não pode ser maior que o débito total",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingPayment(true);
      
      console.log('[ClientHistoryModal] 💳 INICIANDO REGISTRO DE PAGAMENTO');
      console.log('[ClientHistoryModal] 📋 Cliente:', client.customer_name);
      console.log('[ClientHistoryModal] 💰 Valor:', amount);
      
      // 1. Registrar transação de crédito
      const creditPaymentData = {
        credit_account_id: client.id,
        type: 'pagamento',
        amount: amount,
        description: paymentDescription || `Pagamento de R$ ${amount.toFixed(2).replace('.', ',')}`,
        date: new Date().toISOString()
      };

      console.log('[ClientHistoryModal] 📤 Registrando transação de crédito:', creditPaymentData);
      const creditResponse = await api.post('/creditTransactions', creditPaymentData);
      console.log('[ClientHistoryModal] ✅ Transação de crédito registrada:', creditResponse.data);
      
      // 2. Registrar entrada no fluxo de caixa (receita)
      const cashFlowData = {
        type: 'entrada', // ou 'income'
        category: 'Pagamento Crediário',
        description: `Pagamento de ${client.customer_name} - ${paymentDescription || 'Crediário'}`,
        amount: amount,
        date: new Date().toISOString(),
        payment_method: 'cash' // ou pode ser dinâmico
      };

      console.log('[ClientHistoryModal] 📤 Registrando entrada no fluxo de caixa:', cashFlowData);
      const cashFlowResponse = await api.post('/fluxo-caixa', cashFlowData);
      console.log('[ClientHistoryModal] ✅ Entrada no fluxo de caixa registrada:', cashFlowResponse.data);
      
      toast({
        title: "Sucesso",
        description: `Pagamento de R$ ${amount.toFixed(2).replace('.', ',')} registrado com sucesso!`,
      });

      // Limpar formulário
      setPaymentAmount('');
      setPaymentDescription('');
      setShowPaymentForm(false);
      
      // Recarregar transações e dados financeiros
      await fetchTransactions();
      await refreshFinancialData();
      
      // Fechar modal após sucesso
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('[ClientHistoryModal] ❌ Erro ao registrar pagamento:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = "Falha ao registrar pagamento. Tente novamente.";
      if (error.response?.status === 404) {
        errorMessage = "Rota de pagamento não disponível. Aguarde reinicialização do servidor.";
      } else if (error.response?.status === 400) {
        errorMessage = "Dados inválidos. Verifique o valor e tente novamente.";
      } else if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleQuickPayment = (percentage: number) => {
    const amount = (Number(client?.total_debt) * percentage / 100);
    setPaymentAmount(amount.toFixed(2));
    setPaymentDescription(`Pagamento de ${percentage}% do débito total`);
  };

  const handleInstallmentPayment = (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentAmount(installment.amount.toFixed(2));
    setPaymentDescription(`Pagamento da ${installment.installment_number}ª parcela`);
    setShowInstallmentPayment(true);
  };

  // Função para calcular estatísticas das parcelas
  const getInstallmentStats = () => {
    const total = installments.length;
    const paid = installments.filter(inst => inst.status === 'paid').length;
    const pending = installments.filter(inst => inst.status === 'pending').length;
    const overdue = installments.filter(inst => 
      new Date(inst.due_date) < new Date() && inst.status === 'pending'
    ).length;
    
    const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
    const paidAmount = installments
      .filter(inst => inst.status === 'paid')
      .reduce((sum, inst) => sum + (inst.paid_amount || inst.amount), 0);
    const pendingAmount = totalAmount - paidAmount;
    
    return {
      total,
      paid,
      pending,
      overdue,
      totalAmount,
      paidAmount,
      pendingAmount
    };
  };

  // Função para filtrar parcelas
  const getFilteredInstallments = () => {
    switch (installmentFilter) {
      case 'pending':
        return installments.filter(inst => inst.status === 'pending');
      case 'paid':
        return installments.filter(inst => inst.status === 'paid');
      case 'overdue':
        return installments.filter(inst => 
          new Date(inst.due_date) < new Date() && inst.status === 'pending'
        );
      default:
        return installments;
    }
  };

  const handleInstallmentPaymentSubmit = async () => {
    if (!selectedInstallment || !paymentAmount || Number(paymentAmount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe um valor válido para o pagamento",
        variant: "destructive",
      });
      return;
    }

    const amount = Number(paymentAmount);
    if (amount > selectedInstallment.amount) {
      toast({
        title: "Atenção",
        description: "O valor do pagamento não pode ser maior que o valor da parcela",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingPayment(true);
      
      console.log('[ClientHistoryModal] 💳 INICIANDO PAGAMENTO DE PARCELA');
      console.log('[ClientHistoryModal] 📋 Parcela:', selectedInstallment.installment_number);
      console.log('[ClientHistoryModal] 💰 Valor:', amount);
      
      // 1. Registrar transação de crédito
      const creditPaymentData = {
        credit_account_id: client!.id,
        type: 'pagamento',
        amount: amount,
        description: paymentDescription || `Pagamento da ${selectedInstallment.installment_number}ª parcela`,
        date: new Date().toISOString()
      };

      console.log('[ClientHistoryModal] 📤 Registrando transação de crédito:', creditPaymentData);
      const creditResponse = await api.post('/creditTransactions', creditPaymentData);
      console.log('[ClientHistoryModal] ✅ Transação de crédito registrada:', creditResponse.data);
      
      // 2. Registrar entrada no fluxo de caixa (receita)
      const cashFlowData = {
        type: 'entrada',
        category: 'Pagamento Crediário',
        description: `Pagamento da ${selectedInstallment.installment_number}ª parcela - ${client!.customer_name}`,
        amount: amount,
        date: new Date().toISOString(),
        payment_method: 'cash'
      };

      console.log('[ClientHistoryModal] 📤 Registrando entrada no fluxo de caixa:', cashFlowData);
      const cashFlowResponse = await api.post('/fluxo-caixa', cashFlowData);
      console.log('[ClientHistoryModal] ✅ Entrada no fluxo de caixa registrada:', cashFlowResponse.data);
      
      // Atualizar status da parcela
      setInstallments(prev => prev.map(inst => 
        inst.id === selectedInstallment.id 
          ? { ...inst, status: 'paid', paid_date: new Date().toISOString(), paid_amount: amount }
          : inst
      ));
      
      toast({
        title: "Sucesso",
        description: `Pagamento da ${selectedInstallment.installment_number}ª parcela registrado com sucesso!`,
      });

      // Limpar formulário
      setPaymentAmount('');
      setPaymentDescription('');
      setShowInstallmentPayment(false);
      setSelectedInstallment(null);
      
      // Recarregar transações e dados financeiros
      await fetchTransactions();
      await refreshFinancialData();
      
    } catch (error) {
      console.error('[ClientHistoryModal] ❌ Erro ao pagar parcela:', error);
      
      let errorMessage = "Não foi possível registrar o pagamento da parcela";
      if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      } else if (error.response?.status === 400) {
        errorMessage = "Dados inválidos. Verifique o valor e tente novamente.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold">
                  {client.customer_name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Histórico Completo</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">{client.customer_phone || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Débito Total</p>
                    <p className="text-lg font-semibold">
                      R$ {Number(client.total_debt).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={Number(client.total_debt) > 0 ? "destructive" : "default"}>
                      {Number(client.total_debt) > 0 ? 'Em débito' : 'Quitado'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  {Number(client.total_debt) > 0 && (
                    <Button onClick={() => setShowPaymentForm(true)}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Registrar Pagamento
                    </Button>
                  )}
                  {client.customer_phone && (
                    <Button variant="outline" onClick={sendWhatsAppReminder}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {showPaymentForm && Number(client.total_debt) > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5" />
                    <CardTitle>Registrar Pagamento</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Payment Options */}
                <div>
                  <Label className="text-sm font-medium">Pagamento Rápido</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {[25, 50, 75, 100].map((percentage) => (
                      <Button
                        key={percentage}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPayment(percentage)}
                        className="h-10"
                      >
                        {percentage}%
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Payment Amount */}
                <div>
                  <Label htmlFor="payment-amount" className="text-sm font-medium">
                    Valor do Pagamento
                  </Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={client.total_debt}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Máximo: R$ ${Number(client.total_debt).toFixed(2).replace('.', ',')}`}
                    className="mt-2"
                  />
                </div>

                {/* Payment Description */}
                <div>
                  <Label htmlFor="payment-description" className="text-sm font-medium">
                    Descrição (opcional)
                  </Label>
                  <Textarea
                    id="payment-description"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    placeholder="Ex: Pagamento parcial, Pagamento em dinheiro, etc."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <Separator />

                {/* Payment Actions */}
                <div className="flex space-x-2">
                  <Button
                    onClick={handlePayment}
                    disabled={processingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                    className="flex-1"
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Confirmar Pagamento
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={processingPayment}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

                     {/* Installments Summary */}
           {installments.length > 0 && (
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <CalendarDays className="h-5 w-5" />
                     <CardTitle>Resumo das Parcelas</CardTitle>
                   </div>
                   <Badge variant="outline">{installments.length} parcelas</Badge>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                   <div className="text-center p-3 bg-blue-50 rounded-lg">
                     <p className="text-2xl font-bold text-blue-600">{getInstallmentStats().total}</p>
                     <p className="text-sm text-blue-800">Total</p>
                   </div>
                   <div className="text-center p-3 bg-green-50 rounded-lg">
                     <p className="text-2xl font-bold text-green-600">{getInstallmentStats().paid}</p>
                     <p className="text-sm text-green-800">Pagas</p>
                   </div>
                   <div className="text-center p-3 bg-yellow-50 rounded-lg">
                     <p className="text-2xl font-bold text-yellow-600">{getInstallmentStats().pending}</p>
                     <p className="text-sm text-yellow-800">Pendentes</p>
                   </div>
                   <div className="text-center p-3 bg-red-50 rounded-lg">
                     <p className="text-2xl font-bold text-red-600">{getInstallmentStats().overdue}</p>
                     <p className="text-sm text-red-800">Vencidas</p>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                   <div className="text-center p-3 bg-gray-50 rounded-lg">
                     <p className="text-lg font-semibold text-gray-800">
                       R$ {getInstallmentStats().totalAmount.toFixed(2).replace('.', ',')}
                     </p>
                     <p className="text-sm text-gray-600">Valor Total</p>
                   </div>
                   <div className="text-center p-3 bg-green-50 rounded-lg">
                     <p className="text-lg font-semibold text-green-800">
                       R$ {getInstallmentStats().paidAmount.toFixed(2).replace('.', ',')}
                     </p>
                     <p className="text-sm text-green-600">Valor Pago</p>
                   </div>
                   <div className="text-center p-3 bg-orange-50 rounded-lg">
                     <p className="text-lg font-semibold text-orange-800">
                       R$ {getInstallmentStats().pendingAmount.toFixed(2).replace('.', ',')}
                     </p>
                     <p className="text-sm text-orange-600">Valor Pendente</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Installments List */}
           {installments.length > 0 && (
                          <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <CalendarDays className="h-5 w-5" />
                     <CardTitle>Lista de Parcelas</CardTitle>
                   </div>
                   <div className="flex space-x-2">
                     <Button
                       variant={installmentFilter === 'all' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setInstallmentFilter('all')}
                     >
                       Todas ({installments.length})
                     </Button>
                     <Button
                       variant={installmentFilter === 'pending' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setInstallmentFilter('pending')}
                     >
                       Pendentes ({getInstallmentStats().pending})
                     </Button>
                     <Button
                       variant={installmentFilter === 'overdue' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setInstallmentFilter('overdue')}
                     >
                       Vencidas ({getInstallmentStats().overdue})
                     </Button>
                     <Button
                       variant={installmentFilter === 'paid' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setInstallmentFilter('paid')}
                     >
                       Pagas ({getInstallmentStats().paid})
                     </Button>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                                      {getFilteredInstallments().length > 0 ? (
                     getFilteredInstallments().map((installment) => {
                       const isOverdue = new Date(installment.due_date) < new Date() && installment.status === 'pending';
                       const isPaid = installment.status === 'paid';
                       
                       return (
                         <div
                           key={installment.id}
                           className={`flex items-center justify-between p-4 border rounded-lg ${
                             isOverdue ? 'border-red-200 bg-red-50' : 
                             isPaid ? 'border-green-200 bg-green-50' : 
                             'border-gray-200'
                           }`}
                         >
                           <div className="flex-1">
                             <div className="flex items-center space-x-3 mb-1">
                               <Badge variant={
                                 isOverdue ? "destructive" : 
                                 isPaid ? "default" : 
                                 "secondary"
                               }>
                                 {isOverdue ? 'Vencida' : 
                                  isPaid ? 'Paga' : 
                                  `${installment.installment_number}ª Parcela`}
                               </Badge>
                               <span className="text-xs text-muted-foreground flex items-center space-x-1">
                                 <CalendarDays className="h-3 w-3" />
                                 Vencimento: {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                               </span>
                             </div>
                             {isPaid && installment.paid_date && (
                               <p className="text-xs text-green-600">
                                 Paga em: {format(new Date(installment.paid_date), "dd/MM/yyyy", { locale: ptBR })}
                               </p>
                             )}
                           </div>
                           <div className="text-right">
                             <p className={`font-semibold ${
                               isPaid ? 'text-green-600' : 
                               isOverdue ? 'text-red-600' : 
                               'text-gray-900'
                             }`}>
                               R$ {Number(installment.amount).toFixed(2).replace('.', ',')}
                             </p>
                             {!isPaid && (
                               <Button
                                 size="sm"
                                 onClick={() => handleInstallmentPayment(installment)}
                                 className="mt-2"
                               >
                                 <CreditCard className="h-3 w-3 mr-1" />
                                 Pagar
                               </Button>
                             )}
                           </div>
                         </div>
                       );
                     })
                   ) : (
                     <div className="text-center py-8">
                       <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                       <h4 className="text-lg font-medium mb-2">
                         {installmentFilter === 'all' ? 'Nenhuma parcela encontrada' :
                          installmentFilter === 'pending' ? 'Nenhuma parcela pendente' :
                          installmentFilter === 'overdue' ? 'Nenhuma parcela vencida' :
                          'Nenhuma parcela paga'}
                       </h4>
                       <p className="text-sm text-muted-foreground">
                         {installmentFilter === 'all' ? 'Este cliente ainda não possui parcelas registradas.' :
                          installmentFilter === 'pending' ? 'Todas as parcelas foram pagas ou estão vencidas.' :
                          installmentFilter === 'overdue' ? 'Não há parcelas vencidas no momento.' :
                          'Nenhuma parcela foi paga ainda.'}
                       </p>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5" />
                <CardTitle>Histórico de Transações</CardTitle>
              </div>
            </CardHeader>
                         <CardContent>
               <div className="space-y-3">
                 {loading ? (
                   <div className="flex items-center justify-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                     <span className="ml-2 text-sm text-muted-foreground">Carregando histórico...</span>
                   </div>
                 ) : Array.isArray(transactions) && (transactions || []).length > 0 ? (
                   (transactions || []).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <Badge variant={
                              transaction.type === 'debt' || transaction.type === 'debito' ? "destructive" : "default"
                            }>
                              {transaction.type === 'debt' || transaction.type === 'debito' ? 'Débito' : 'Pagamento'}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center space-x-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(transaction.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'debt' || transaction.type === 'debito' ? 'text-destructive' : 'text-green-600'
                          }`}>
                            {transaction.type === 'debt' || transaction.type === 'debito' ? '+' : '-'}R$ {Number(transaction.amount).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h4 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h4>
                      <p className="text-sm text-muted-foreground">
                        Este cliente ainda não possui transações registradas.
                      </p>
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de Pagamento de Parcela */}
        {showInstallmentPayment && selectedInstallment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pagar Parcela</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowInstallmentPayment(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    {selectedInstallment.installment_number}ª Parcela
                  </p>
                  <p className="text-sm text-blue-600">
                    Vencimento: {format(new Date(selectedInstallment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-lg font-semibold text-blue-800">
                    R$ {Number(selectedInstallment.amount).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="installment-payment-amount" className="text-sm font-medium">
                    Valor do Pagamento
                  </Label>
                  <Input
                    id="installment-payment-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedInstallment.amount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Máximo: R$ ${Number(selectedInstallment.amount).toFixed(2).replace('.', ',')}`}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="installment-payment-description" className="text-sm font-medium">
                    Descrição (opcional)
                  </Label>
                  <Textarea
                    id="installment-payment-description"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    placeholder="Ex: Pagamento em dinheiro, Pagamento via Pix, etc."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleInstallmentPaymentSubmit}
                    disabled={processingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                    className="flex-1"
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Confirmar Pagamento
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInstallmentPayment(false)}
                    disabled={processingPayment}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientHistoryModal;