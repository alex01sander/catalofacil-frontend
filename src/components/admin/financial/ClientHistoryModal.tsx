import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, DollarSign, FileText, Phone, CreditCard, X, User, MessageCircle } from 'lucide-react';
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
  type: 'debt' | 'payment';
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
      const { data } = await api.get(`/credit-accounts/${client.id}/transactions`);
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico do cliente:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico do cliente",
        variant: "destructive",
      });
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
      
      const paymentData = {
        credit_account_id: client.id,
        type: 'payment',
        amount: amount,
        description: paymentDescription || `Pagamento de R$ ${amount.toFixed(2).replace('.', ',')}`,
        date: new Date().toISOString()
      };

      console.log('[ClientHistoryModal] 📤 Registrando pagamento:', paymentData);
      
      const response = await api.post('/credit-transactions', paymentData);
      
      console.log('[ClientHistoryModal] ✅ Pagamento registrado:', response.data);
      
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
      toast({
        title: "Erro",
        description: "Falha ao registrar pagamento. Tente novamente.",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  {client.customer_name}
                </DialogTitle>
                <p className="text-blue-100 text-sm">Histórico Completo</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Client Info Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                {/* Phone */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-semibold text-gray-900">{client.customer_phone || 'Não informado'}</p>
                  </div>
                </div>

                {/* Debt Amount */}
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Débito Total</p>
                    <p className={`font-bold text-lg ${
                      Number(client.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {Number(client.total_debt) > 0 
                        ? `R$ ${Number(client.total_debt).toFixed(2).replace('.', ',')}`
                        : 'R$ 0,00'
                      }
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Badge variant={Number(client.total_debt) > 0 ? "destructive" : "default"} className="text-xs">
                      {Number(client.total_debt) > 0 ? 'Em débito' : 'Quitado'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900">
                      {Number(client.total_debt) > 0 ? 'Aguardando pagamento' : 'Conta quitada'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {Number(client.total_debt) > 0 && (
                    <Button
                      onClick={() => setShowPaymentForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold h-12"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Registrar Pagamento
                    </Button>
                  )}
                  {client.customer_phone && (
                    <Button
                      variant="outline"
                      onClick={sendWhatsAppReminder}
                      className="border-green-200 text-green-600 hover:bg-green-50 h-12"
                    >
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
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800">Registrar Pagamento</h3>
                      <p className="text-green-600 text-sm">Complete os dados do pagamento</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPaymentForm(false)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Quick Payment Buttons */}
                  <div>
                    <Label className="text-green-800 font-medium mb-3 block">Pagamento Rápido</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[25, 50, 75, 100].map((percentage) => (
                        <Button
                          key={percentage}
                          size="lg"
                          variant="outline"
                          onClick={() => handleQuickPayment(percentage)}
                          className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 h-12"
                        >
                          {percentage}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Amount */}
                  <div>
                    <Label htmlFor="payment-amount" className="text-green-800 font-medium">Valor do Pagamento</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={client.total_debt}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={`Máximo: R$ ${Number(client.total_debt).toFixed(2).replace('.', ',')}`}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 h-12 text-lg"
                    />
                  </div>

                  {/* Payment Description */}
                  <div>
                    <Label htmlFor="payment-description" className="text-green-800 font-medium">Descrição (opcional)</Label>
                    <Textarea
                      id="payment-description"
                      value={paymentDescription}
                      onChange={(e) => setPaymentDescription(e.target.value)}
                      placeholder="Ex: Pagamento parcial, Pagamento em dinheiro, etc."
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      rows={3}
                    />
                  </div>

                  {/* Payment Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handlePayment}
                      disabled={processingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold flex-1 h-12"
                    >
                      {processingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processando Pagamento...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Confirmar Pagamento
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentForm(false)}
                      disabled={processingPayment}
                      className="border-green-300 text-green-600 hover:bg-green-50 h-12"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Histórico de Transações</h3>
                  <p className="text-gray-600 text-sm">Todas as operações financeiras do cliente</p>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando histórico...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h4>
                  <p className="text-gray-600">Este cliente ainda não possui transações registradas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className={`border-l-4 shadow-sm ${
                      transaction.type === 'debt' ? 'border-l-orange-500 bg-orange-50' : 'border-l-green-500 bg-green-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={transaction.type === 'debt' ? "destructive" : "default"} className="text-xs">
                                {transaction.type === 'debt' ? '📝 Débito' : '💰 Pagamento'}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {format(new Date(transaction.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {transaction.description && (
                              <p className="text-sm text-gray-700 mb-2">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              transaction.type === 'debt' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {transaction.type === 'debt' ? '+' : '-'}R$ {Number(transaction.amount).toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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