import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, CreditCard, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";

type CreditAccount = Tables<'credit_accounts'>;
type CreditTransaction = Tables<'credit_transactions'>;

const CreditTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accountData, setAccountData] = useState({
    customer_name: '',
    customer_phone: '',
  });
  const [transactionData, setTransactionData] = useState({
    type: 'debt' as 'debt' | 'payment',
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchCreditAccounts();
  }, [user]);

  const fetchCreditAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('credit_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('total_debt', { ascending: false });
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Erro ao buscar contas de fiado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas de fiado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_accounts')
        .insert([{
          user_id: user.id,
          customer_name: accountData.customer_name,
          customer_phone: accountData.customer_phone,
          total_debt: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      setAccounts(prev => [data, ...prev]);
      setShowAccountForm(false);
      setAccountData({ customer_name: '', customer_phone: '' });
      
      toast({
        title: "Sucesso",
        description: "Cliente adicionado para controle de fiado!",
      });
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cliente",
        variant: "destructive",
      });
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccount) return;

    try {
      const amount = parseFloat(transactionData.amount);
      
      // Inserir transação
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          credit_account_id: selectedAccount,
          user_id: user.id,
          type: transactionData.type,
          amount: amount,
          description: transactionData.description,
        }]);

      if (transactionError) throw transactionError;

      // Atualizar saldo da conta
      const account = accounts.find(a => a.id === selectedAccount);
      if (account) {
        const newDebt = transactionData.type === 'debt' 
          ? Number(account.total_debt) + amount 
          : Number(account.total_debt) - amount;

        const { error: updateError } = await supabase
          .from('credit_accounts')
          .update({ total_debt: Math.max(0, newDebt) })
          .eq('id', selectedAccount);

        if (updateError) throw updateError;
      }
      
      await fetchCreditAccounts();
      setShowTransactionForm(false);
      setTransactionData({ type: 'debt', amount: '', description: '' });
      setSelectedAccount('');
      
      toast({
        title: "Sucesso",
        description: `${transactionData.type === 'debt' ? 'Débito' : 'Pagamento'} registrado!`,
      });
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a transação",
        variant: "destructive",
      });
    }
  };

  const totalDebt = accounts.reduce((sum, account) => sum + Number(account.total_debt), 0);
  const clientsWithDebt = accounts.filter(account => Number(account.total_debt) > 0).length;

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Controle de Fiado</h2>
          <p className="text-gray-600">Veja quem ainda está devendo</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAccountForm(!showAccountForm)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
          <Button onClick={() => setShowTransactionForm(!showTransactionForm)} className="bg-orange-600 hover:bg-orange-700">
            <CreditCard className="h-4 w-4 mr-2" />
            Registrar
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total em Débito</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalDebt.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Devendo</p>
                <p className="text-2xl font-bold text-orange-600">{clientsWithDebt}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-blue-600">{accounts.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário Novo Cliente */}
      {showAccountForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Cliente para Fiado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Nome do Cliente</Label>
                  <Input
                    value={accountData.customer_name}
                    onChange={(e) => setAccountData({...accountData, customer_name: e.target.value})}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">Telefone (WhatsApp)</Label>
                  <Input
                    value={accountData.customer_phone}
                    onChange={(e) => setAccountData({...accountData, customer_phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Adicionar Cliente
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAccountForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulário Nova Transação */}
      {showTransactionForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Débito ou Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.customer_name} - R$ {Number(account.total_debt).toFixed(2).replace('.', ',')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={transactionData.type} onValueChange={(value: 'debt' | 'payment') => setTransactionData({...transactionData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debt">📝 Novo Débito</SelectItem>
                      <SelectItem value="payment">💰 Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={transactionData.amount}
                    onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    value={transactionData.description}
                    onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                    placeholder="Ex: Compra de produtos"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  Registrar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowTransactionForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes e Débitos</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum cliente cadastrado</p>
              <p className="text-sm">Adicione clientes para controlar o fiado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      Number(account.total_debt) > 0 ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <Users className={`h-6 w-6 ${
                        Number(account.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{account.customer_name}</p>
                      {account.customer_phone && (
                        <p className="text-sm text-gray-500">{account.customer_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      Number(account.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {Number(account.total_debt) > 0 ? 'Deve: ' : 'Quitado'}
                      {Number(account.total_debt) > 0 && `R$ ${Number(account.total_debt).toFixed(2).replace('.', ',')}`}
                    </p>
                    <Badge variant={Number(account.total_debt) > 0 ? "destructive" : "default"} className="text-xs">
                      {Number(account.total_debt) > 0 ? 'Em débito' : 'Em dia'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditTab;