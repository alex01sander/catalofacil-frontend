import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Search, Wrench, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancial } from "@/contexts/FinancialContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CashFlowTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: financialData, addCashFlowEntry, registerSale, refreshData } = useFinancial();
  const [showForm, setShowForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash'
  });
  const [saleData, setSaleData] = useState({
    product_id: '',
    quantity: '1',
    unit_price: '',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
  });

  // Função para debug do fluxo de caixa
  const debugCashFlow = () => {
    console.log('🔍 DEBUG FLUXO DE CAIXA:');
    
    // Função auxiliar para verificar se é entrada
    const isIncome = (type: string) => type === 'income' || type === 'entrada';
    const isExpense = (type: string) => type === 'expense' || type === 'saida';
    
    console.log('📊 Total de entradas:', financialData.cashFlow.filter(e => isIncome(e.type)).length);
    console.log('📊 Total de saídas:', financialData.cashFlow.filter(e => isExpense(e.type)).length);
    console.log('💰 Entradas:', financialData.cashFlow.filter(e => isIncome(e.type)));
    console.log('💸 Saídas:', financialData.cashFlow.filter(e => isExpense(e.type)));
    console.log('🛒 Vendas:', financialData.sales);
    
    // DEBUG DETALHADO - Verificar vendas mais recentes
    console.log('🕒 VENDAS MAIS RECENTES (últimas 5):');
    const vendasRecentes = financialData.sales
      .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
      .slice(0, 5);
    vendasRecentes.forEach((venda, index) => {
      console.log(`📋 Venda ${index + 1}:`, {
        id: venda.id,
        product_name: venda.product_name,
        total_price: venda.total_price,
        sale_date: venda.sale_date,
        customer_name: venda.customer_name,
        created_at: venda.created_at
      });
    });
    
    // Verificar se há vendas sendo exibidas como saídas
    const vendasComoSaidas = financialData.cashFlow.filter(e => 
      isExpense(e.type) && e.description.toLowerCase().includes('venda')
    );
    if (vendasComoSaidas.length > 0) {
      console.error('❌ PROBLEMA ENCONTRADO: Vendas sendo exibidas como saídas:', vendasComoSaidas);
    } else {
      console.log('✅ Nenhuma venda encontrada como saída');
    }
    
    // DEBUG DETALHADO - Verificar todos os dados brutos
    console.log('🔍 DADOS BRUTOS DO FLUXO DE CAIXA:');
    financialData.cashFlow.forEach((entry, index) => {
      console.log(`📋 Entrada ${index + 1}:`, {
        id: entry.id,
        type: entry.type,
        type_original: entry.type,
        description: entry.description,
        amount: entry.amount,
        amount_original: entry.amount,
        category: entry.category,
        date: entry.date,
        payment_method: entry.payment_method,
        isIncome: isIncome(entry.type),
        isExpense: isExpense(entry.type)
      });
    });
    
    // Verificar se há problemas de tipo
    const tiposInesperados = financialData.cashFlow.filter(e => 
      !isIncome(e.type) && !isExpense(e.type)
    );
    if (tiposInesperados.length > 0) {
      console.error('❌ TIPOS INESPERADOS ENCONTRADOS:', tiposInesperados);
    }
    
    // Verificar se há problemas de amount
    const amountsNegativos = financialData.cashFlow.filter(e => 
      Number(e.amount) < 0
    );
    if (amountsNegativos.length > 0) {
      console.error('❌ AMOUNTS NEGATIVOS ENCONTRADOS:', amountsNegativos);
    }
    
    toast({
      title: 'Debug Concluído',
      description: `Entradas: ${financialData.cashFlow.filter(e => isIncome(e.type)).length} | Saídas: ${financialData.cashFlow.filter(e => isExpense(e.type)).length}`,
    });
  };

  // Função para identificar e corrigir vendas sem fluxo de caixa
  const fixMissingCashFlowEntries = async () => {
    console.log('[CashFlowTab] 🔧 VERIFICANDO VENDAS SEM FLUXO DE CAIXA...');
    
    try {
      // Buscar vendas que não têm entrada no fluxo de caixa
      const salesWithoutCashFlow = financialData.sales.filter(sale => {
        const hasCashFlowEntry = financialData.cashFlow.some(cf => 
          cf.description.includes(sale.id) || 
          cf.description.includes(sale.product_name)
        );
        return !hasCashFlowEntry;
      });
      
      console.log('[CashFlowTab] 📋 Vendas sem fluxo de caixa:', salesWithoutCashFlow);
      
      if (salesWithoutCashFlow.length === 0) {
        toast({
          title: 'Nenhuma venda pendente',
          description: 'Todas as vendas já têm entradas no fluxo de caixa',
        });
        return;
      }
      
      // Criar entradas no fluxo de caixa para cada venda
      for (const sale of salesWithoutCashFlow) {
        const cashFlowPayload = {
          user_id: user?.id,
          store_id: sale.store_id,
          type: 'income',
          category: 'Venda',
          description: `Venda: ${sale.product_name} - ID: ${sale.id} - Cliente: ${sale.customer_name || 'Cliente não informado'}`,
          amount: String(Number(sale.total_price)),
          date: sale.sale_date,
          payment_method: 'cash'
        };
        
        console.log('[CashFlowTab] 📤 Criando entrada no fluxo de caixa:', cashFlowPayload);
        
        await addCashFlowEntry(cashFlowPayload);
        console.log('[CashFlowTab] ✅ Entrada criada para venda:', sale.id);
      }
      
      toast({
        title: 'Sucesso!',
        description: `${salesWithoutCashFlow.length} entradas criadas no fluxo de caixa`,
      });
      
    } catch (error) {
      console.error('[CashFlowTab] ❌ Erro ao corrigir fluxo de caixa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível corrigir o fluxo de caixa',
        variant: 'destructive'
      });
    }
  };

  // Função para forçar atualização dos dados
  const forceRefreshData = async () => {
    console.log('[CashFlowTab] 🔄 FORÇANDO ATUALIZAÇÃO DOS DADOS...');
    
    try {
      // Forçar refresh dos dados
      await refreshData();
      console.log('[CashFlowTab] ✅ Dados atualizados');
      
      toast({
        title: 'Dados Atualizados',
        description: 'Os dados foram atualizados com sucesso',
      });
      
    } catch (error) {
      console.error('[CashFlowTab] ❌ Erro ao atualizar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os dados',
        variant: 'destructive'
      });
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[CashFlowTab] 🛒 INICIANDO REGISTRO DE VENDA VIA FORMULÁRIO');
    console.log('[CashFlowTab] 📋 Dados da venda:', saleData);
    console.log('[CashFlowTab] 🔍 Produto selecionado:', saleData.product_id);
    console.log('[CashFlowTab] 🔍 Quantidade:', saleData.quantity);
    console.log('[CashFlowTab] 🔍 Preço unitário:', saleData.unit_price);
    
    try {
      await registerSale(saleData);
      console.log('[CashFlowTab] ✅ Venda registrada com sucesso!');
      
      setShowSaleForm(false);
      setSaleData({
        product_id: '',
        quantity: '1',
        unit_price: '',
        payment_method: 'cash',
        date: new Date().toISOString().split('T')[0],
      });
      
      console.log('[CashFlowTab] 🔄 Recarregando página...');
      // Atualiza dashboard e caixa
      window.location.reload();
    } catch (error) {
      console.error('[CashFlowTab] ❌ Erro ao registrar venda:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a venda',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await addCashFlowEntry({
      user_id: user.id,
      store_id: null,
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      payment_method: formData.payment_method
    });
    
    setShowForm(false);
    setFormData({
      type: 'income',
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash'
    });
  };

  if (financialData.isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Controle de Caixa</h2>
          <p className="text-gray-600">Quanto você movimentou hoje?</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSaleForm(!showSaleForm)} className="bg-blue-600 hover:bg-blue-700">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Registrar Venda
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Lançamento Rápido
          </Button>
          <Button onClick={debugCashFlow} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
            <Search className="h-4 w-4 mr-2" />
            Debug
          </Button>
          <Button onClick={fixMissingCashFlowEntries} variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
            <Wrench className="h-4 w-4 mr-2" />
            Corrigir Vendas
          </Button>
          <Button onClick={forceRefreshData} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {financialData.totalIncome.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {financialData.totalExpenses.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${financialData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {financialData.balance.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Lançamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">💰 Entrada</SelectItem>
                      <SelectItem value="expense">💸 Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type === 'income' ? (
                        <>
                          <SelectItem value="sale">🛍️ Venda</SelectItem>
                          <SelectItem value="other">📝 Outros</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="supplier">📦 Fornecedor</SelectItem>
                          <SelectItem value="delivery">🚚 Entrega</SelectItem>
                          <SelectItem value="bills">📄 Contas</SelectItem>
                          <SelectItem value="other">📝 Outros</SelectItem>
                        </>
                      )}
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
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Dinheiro</SelectItem>
                      <SelectItem value="pix">🔄 Pix</SelectItem>
                      <SelectItem value="card">💳 Cartão</SelectItem>
                      <SelectItem value="transfer">🏦 Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={"w-full justify-start text-left font-normal" + (!formData.date ? " text-muted-foreground" : "")}
                      >
                        {formData.date
                          ? format(new Date(formData.date), "dd/MM/yyyy", { locale: ptBR })
                          : "Escolha a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date ? new Date(formData.date) : undefined}
                        onSelect={(date) => {
                          setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' });
                        }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o lançamento..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Salvar Lançamento
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Venda de Produto */}
      {showSaleForm && (
        <Card>
          <CardHeader>
            <CardTitle>🛍️ Registrar Venda de Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Produto</Label>
                  <Select 
                    value={saleData.product_id} 
                    onValueChange={(value) => {
                      const product = financialData.products.find(p => p.id === value);
                      setSaleData({
                        ...saleData, 
                        product_id: value,
                        unit_price: product ? product.price.toString() : ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {financialData.products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {Number(product.price).toFixed(2).replace('.', ',')} (Estoque: {product.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={saleData.quantity}
                    onChange={(e) => setSaleData({...saleData, quantity: e.target.value})}
                    placeholder="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit_price">Preço Unitário</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={saleData.unit_price}
                    onChange={(e) => setSaleData({...saleData, unit_price: e.target.value})}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select 
                    value={saleData.payment_method} 
                    onValueChange={(value) => setSaleData({...saleData, payment_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Dinheiro</SelectItem>
                      <SelectItem value="pix">🔄 Pix</SelectItem>
                      <SelectItem value="card">💳 Cartão</SelectItem>
                      <SelectItem value="transfer">🏦 Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data da Venda *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={"w-full justify-start text-left font-normal" + (!saleData.date ? " text-muted-foreground" : "")}
                      >
                        {saleData.date
                          ? format(new Date(saleData.date), "dd/MM/yyyy", { locale: ptBR })
                          : "Escolha a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={saleData.date ? new Date(saleData.date) : undefined}
                        onSelect={(date) => {
                          setSaleData({ ...saleData, date: date ? date.toISOString().split('T')[0] : '' });
                        }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Resumo da Venda */}
              {saleData.product_id && saleData.quantity && saleData.unit_price && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Resumo da Venda:</h3>
                  <p className="text-blue-700">
                    <strong>Total:</strong> R$ {(parseFloat(saleData.quantity) * parseFloat(saleData.unit_price)).toFixed(2).replace('.', ',')}
                  </p>
                  {(() => {
                    const product = financialData.products.find(p => p.id === saleData.product_id);
                    const quantity = parseInt(saleData.quantity);
                    return product && (
                      <p className="text-blue-700">
                        <strong>Estoque após venda:</strong> {product.stock - quantity} unidades
                      </p>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  🛍️ Registrar Venda
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSaleForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {financialData.cashFlow.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum lançamento ainda</p>
              <p className="text-sm">Adicione sua primeira movimentação financeira</p>
            </div>
          ) : (
            <div className="space-y-3">
              {financialData.cashFlow.map((entry) => {
                 // Determinar se é entrada ou saída (suportando ambos os formatos)
                 const isIncome = entry.type === 'income' || entry.type === 'entrada';
                 const isExpense = entry.type === 'expense' || entry.type === 'saida';
                 
                 return (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isIncome ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isIncome ? 
                        <TrendingUp className="h-5 w-5 text-green-600" /> : 
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{entry.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {entry.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'} R$ {Number(entry.amount).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-gray-500">{entry.payment_method}</p>
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowTab;