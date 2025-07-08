import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, AlertCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";

type Expense = Tables<'expenses'>;

const ExpensesTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'variable' as 'fixed' | 'variable',
    type: 'supplier',
    amount: '',
    due_date: '',
    is_recurring: false,
    recurring_frequency: 'monthly',
  });

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const fetchExpenses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as despesas",
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
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          user_id: user.id,
          name: formData.name,
          category: formData.category,
          type: formData.type,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date || null,
          is_recurring: formData.is_recurring,
          recurring_frequency: formData.is_recurring ? formData.recurring_frequency : null,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setExpenses(prev => [data, ...prev]);
      setShowForm(false);
      setFormData({
        name: '',
        category: 'variable',
        type: 'supplier',
        amount: '',
        due_date: '',
        is_recurring: false,
        recurring_frequency: 'monthly',
      });
      
      toast({
        title: "Sucesso",
        description: "Despesa adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a despesa",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', expenseId);

      if (error) throw error;
      
      await fetchExpenses();
      toast({
        title: "Sucesso",
        description: "Despesa marcada como paga!",
      });
    } catch (error) {
      console.error('Erro ao marcar despesa como paga:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a despesa como paga",
        variant: "destructive",
      });
    }
  };

  const totalFixed = expenses.filter(e => e.category === 'fixed').reduce((sum, e) => sum + Number(e.amount), 0);
  const totalVariable = expenses.filter(e => e.category === 'variable').reduce((sum, e) => sum + Number(e.amount), 0);
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0);
  const overdueExpenses = expenses.filter(e => 
    e.status === 'pending' && 
    e.due_date && 
    new Date(e.due_date) < new Date()
  ).length;

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            💸 Controle de Despesas
          </h2>
          <p className="text-muted-foreground">Gerencie seus gastos de forma inteligente</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">📅 Despesas Fixas</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {totalFixed.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">📝 Despesas Variáveis</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {totalVariable.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Receipt className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">💰 A Pagar</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalPending.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-red-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">⚠️ Em Atraso</p>
                <p className="text-2xl font-bold text-red-700">{overdueExpenses}</p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="shadow-xl border-red/20">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Plus className="h-5 w-5 text-red-600" />
              </div>
              💸 Nova Despesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Despesa</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Aluguel, Fornecedor XYZ"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value: 'fixed' | 'variable') => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">📅 Fixa (todo mês)</SelectItem>
                      <SelectItem value="variable">📝 Variável (esporádica)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">📦 Fornecedor</SelectItem>
                      <SelectItem value="delivery">🚚 Entrega</SelectItem>
                      <SelectItem value="bills">📄 Contas (luz, água, etc)</SelectItem>
                      <SelectItem value="rent">🏠 Aluguel</SelectItem>
                      <SelectItem value="other">📝 Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  <Label htmlFor="due_date">Data de Vencimento</Label>
                  <DatePicker
                    selected={formData.due_date ? new Date(formData.due_date) : null}
                    onChange={date => setFormData({ ...formData, due_date: date ? date.toISOString().split('T')[0] : '' })}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="dd/mm/aaaa"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
                  />
                  <Label>Despesa recorrente</Label>
                </div>

                {formData.is_recurring && (
                  <div>
                    <Label htmlFor="recurring_frequency">Frequência</Label>
                    <Select value={formData.recurring_frequency} onValueChange={(value) => setFormData({...formData, recurring_frequency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg h-11">
                  <Plus className="h-4 w-4 mr-2" />
                  💸 Adicionar Despesa
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-11">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Despesas */}
      <Card className="shadow-lg border-l-4 border-l-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-5 w-5 text-purple-600" />
            📋 Suas Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma despesa cadastrada</p>
              <p className="text-sm">Adicione despesas para controlar seus gastos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      expense.status === 'paid' ? 'bg-green-100' : 
                      (expense.due_date && new Date(expense.due_date) < new Date() ? 'bg-red-100' : 'bg-orange-100')
                    }`}>
                      <Receipt className={`h-6 w-6 ${
                        expense.status === 'paid' ? 'text-green-600' : 
                        (expense.due_date && new Date(expense.due_date) < new Date() ? 'text-red-600' : 'text-orange-600')
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {expense.category === 'fixed' ? 'Fixa' : 'Variável'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {expense.type}
                        </Badge>
                        {expense.is_recurring && (
                          <Badge variant="default" className="text-xs">
                            Recorrente
                          </Badge>
                        )}
                      </div>
                      {expense.due_date && (
                        <p className="text-sm text-gray-500">
                          Vence em: {new Date(expense.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      R$ {Number(expense.amount).toFixed(2).replace('.', ',')}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={
                          expense.status === 'paid' ? 'default' : 
                          (expense.due_date && new Date(expense.due_date) < new Date() ? 'destructive' : 'secondary')
                        }
                        className="text-xs"
                      >
                        {expense.status === 'paid' ? 'Pago' : 
                         (expense.due_date && new Date(expense.due_date) < new Date() ? 'Atrasado' : 'Pendente')}
                      </Badge>
                      {expense.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => markAsPaid(expense.id)}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
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

export default ExpensesTab;