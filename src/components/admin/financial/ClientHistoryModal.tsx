import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, DollarSign, FileText, Phone } from 'lucide-react';
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

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              Number(client.total_debt) > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                Number(client.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{client.customer_name}</h2>
              <p className="text-sm text-muted-foreground">Histórico Completo</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Client Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.customer_phone || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className={`font-medium ${
                  Number(client.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {Number(client.total_debt) > 0 
                    ? `Deve: R$ ${Number(client.total_debt).toFixed(2).replace('.', ',')}`
                    : 'Em dia'
                  }
                </span>
              </div>
              <div className="flex gap-2">
                <Badge variant={Number(client.total_debt) > 0 ? "destructive" : "default"}>
                  {Number(client.total_debt) > 0 ? 'Em débito' : 'Quitado'}
                </Badge>
                {client.customer_phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={sendWhatsAppReminder}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    💬 WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Histórico de Transações
          </h3>
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={transaction.type === 'debt' ? "destructive" : "default"}>
                            {transaction.type === 'debt' ? '📝 Débito' : '💰 Pagamento'}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientHistoryModal;