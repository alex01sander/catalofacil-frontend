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
  // Outros campos que podem existir em CreditTransaction
};

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: CreditAccount | null;
}

const ClientHistoryModal = ({ isOpen, onClose, client }: ClientHistoryModalProps) => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (client && isOpen) {
      fetchTransactions();
    }
  }, [client, isOpen]);

  const fetchTransactions = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      
      // Tentar rota específica primeiro, depois fallback
      let data = [];
      try {
        // Primeira tentativa: rota específica para histórico
        const response = await api.get(`/credit-accounts/${client.id}/transactions`);
        data = response.data || [];
        console.log('[ClientHistoryModal] ✅ Histórico carregado via rota específica');
      } catch (error) {
        console.log('[ClientHistoryModal] ⚠️ Rota específica não disponível, tentando rota geral...');
        
        // Segunda tentativa: buscar todas as transações e filtrar
        const response = await api.get('/creditTransactions');
        const allTransactions = response.data || [];
        
        // Filtrar transações do cliente atual
        data = allTransactions.filter((transaction: CreditTransaction) => 
          transaction.credit_account_id === client.id
        ) || [];
        
        console.log('[ClientHistoryModal] ✅ Histórico carregado via rota geral (filtrado)');
      }
      
      // Garantir que data seja sempre um array
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[ClientHistoryModal] ❌ Erro ao buscar histórico do cliente:', error);
      
      let errorMessage = "Falha ao carregar histórico do cliente";
      if (error.response?.status === 404) {
        errorMessage = "Rota de histórico não disponível. Aguarde reinicialização do servidor.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Em caso de erro, definir array vazio
      setTransactions([]);
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
      
      // Solução temporária: usar formato "pagamento" em vez de "payment"
      const paymentData = {
        credit_account_id: client.id,
        type: 'pagamento', // Usar formato em português temporariamente
        amount: amount,
        description: paymentDescription || `Pagamento de R$ ${amount.toFixed(2).replace('.', ',')}`,
        date: new Date().toISOString()
      };

      console.log('[ClientHistoryModal] 📤 Registrando pagamento:', paymentData);
      
      // Tentar rota que funciona primeiro, depois fallback
      let response;
      try {
        // Primeira tentativa: rota específica de pagamentos (se disponível)
        response = await api.post('/creditTransactions/payment', paymentData);
        console.log('[ClientHistoryModal] ✅ Pagamento registrado via rota específica:', response.data);
      } catch (error) {
        console.log('[ClientHistoryModal] ⚠️ Rota específica não disponível, tentando rota geral...');
        
        // Segunda tentativa: rota geral com formato em português
        response = await api.post('/creditTransactions', paymentData);
        console.log('[ClientHistoryModal] ✅ Pagamento registrado via rota geral:', response.data);
      }
      
      toast({
        title: "Sucesso",
        description: `Pagamento de R$ ${amount.toFixed(2).replace('.', ',')} registrado com sucesso!`,
      });

      // Limpar formulário
      setPaymentAmount('');
      setPaymentDescription('');
      setShowPaymentForm(false);
      
      // Recarregar transações
      await fetchTransactions();
      
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

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5" />
                <CardTitle>Histórico de Transações</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Carregando histórico...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(transactions) && transactions.length > 0 ? (
                    transactions.map((transaction) => (
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
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientHistoryModal;