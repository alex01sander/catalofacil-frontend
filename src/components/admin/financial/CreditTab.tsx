import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";

type CreditAccount = Tables<'credit_accounts'>;

const CreditTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [formData, setFormData] = useState({
    is_new_customer: true,
    customer_name: '',
    customer_phone: '',
    existing_customer_id: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const amount = parseFloat(formData.amount);
      let accountId = formData.existing_customer_id;

      // Se for cliente novo, criar primeiro
      if (formData.is_new_customer) {
        const { data: newAccount, error: accountError } = await supabase
          .from('credit_accounts')
          .insert([{
            user_id: user.id,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            total_debt: 0
          }])
          .select()
          .single();

        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      // Inserir transação
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          credit_account_id: accountId,
          user_id: user.id,
          type: formData.type,
          amount: amount,
          description: formData.description,
        }]);

      if (transactionError) throw transactionError;

      // Atualizar saldo da conta
      const account = formData.is_new_customer 
        ? { id: accountId, total_debt: 0 }
        : accounts.find(a => a.id === accountId);
      
      if (account) {
        const newDebt = formData.type === 'debt' 
          ? Number(account.total_debt) + amount 
          : Number(account.total_debt) - amount;

        const { error: updateError } = await supabase
          .from('credit_accounts')
          .update({ total_debt: Math.max(0, newDebt) })
          .eq('id', accountId);

        if (updateError) throw updateError;
      }
      
      await fetchCreditAccounts();
      setShowTransactionForm(false);
      setFormData({
        is_new_customer: true,
        customer_name: '',
        customer_phone: '',
        existing_customer_id: '',
        type: 'debt',
        amount: '',
        description: '',
      });
      
      toast({
        title: "Sucesso",
        description: `${formData.type === 'debt' ? 'Débito' : 'Pagamento'} registrado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao processar operação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a operação",
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
          <p className="text-gray-600">Registre débitos e pagamentos de forma simples</p>
        </div>
        <Button 
          onClick={() => setShowTransactionForm(!showTransactionForm)} 
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showTransactionForm ? 'Fechar' : 'Registrar Operação'}
        </Button>
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

      {/* Formulário Unificado */}
      {showTransactionForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Débito ou Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Operação */}
              <div>
                <Label htmlFor="type">Tipo de Operação</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'debt' | 'payment') => 
                    setFormData({...formData, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debt">📝 Novo Débito (Cliente ficou devendo)</SelectItem>
                    <SelectItem value="payment">💰 Pagamento (Cliente pagou)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cliente */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="customer-type"
                    checked={formData.is_new_customer}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, is_new_customer: checked})
                    }
                  />
                  <Label htmlFor="customer-type">
                    {formData.is_new_customer ? "Cliente novo" : "Cliente existente"}
                  </Label>
                </div>

                {formData.is_new_customer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Nome do Cliente</Label>
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">Telefone (WhatsApp)</Label>
                      <Input
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="existing_customer">Selecionar Cliente</Label>
                    <Select 
                      value={formData.existing_customer_id} 
                      onValueChange={(value) => 
                        setFormData({...formData, existing_customer_id: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.customer_name} - Deve: R$ {Number(account.total_debt).toFixed(2).replace('.', ',')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Ex: Compra de produtos"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {formData.type === 'debt' ? '📝 Registrar Débito' : '💰 Registrar Pagamento'}
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
              <p className="text-sm">Registre sua primeira operação para começar</p>
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