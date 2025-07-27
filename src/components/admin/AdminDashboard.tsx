import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, ShoppingCart, DollarSign, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useOptimizedProducts } from "@/hooks/useOptimizedProducts";
import { useOptimizedCategories } from "@/hooks/useOptimizedCategories";
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancial } from "@/contexts/FinancialContext";
import api from '@/services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useOptimizedProducts();
  const { categories, loading: categoriesLoading } = useOptimizedCategories();
  const { data: financialData } = useFinancial();
  
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Estado para simulação de preço - todos os campos zerados
  const [priceSimulation, setPriceSimulation] = useState({
    cost: 0,
    margin: 0,
    taxes: 0, // Agora é valor absoluto em R$
    expenses: 0, // Agora é valor absoluto em R$
    currentPrice: 0
  });

  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);

  // Novos estados para simulação dupla
  const [markupResult, setMarkupResult] = useState({ price: 0, profit: 0 });
  const [marginResult, setMarginResult] = useState({ price: 0, profit: 0 });

  // Buscar pedidos do usuário
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.token) {
        setOrdersLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/pedidos?store_owner_id=${user.id}`);
        setOrders(data || []);
      } catch (error) {
        // console.error('Erro ao buscar pedidos:', error);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Calcular estatísticas reais
  // Receita total = apenas entradas do fluxo de caixa (já inclui vendas registradas)
  const totalRevenue = financialData.totalIncome;
  
  const totalProducts = products.filter(p => p.is_active).length;
  // Contar apenas pedidos confirmados (as vendas do contexto já incluem os pedidos confirmados)
  const confirmedOrders = orders.filter(order => order.status === 'confirmed').length;
  const totalOrders = confirmedOrders; // Remover duplicação com financialData.sales.length
  const conversionRate = totalOrders > 0 ? ((totalOrders / (totalProducts || 1)) * 100).toFixed(1) : "0.0";
  
  // Debug das vendas
  console.log('🔍 DEBUG DASHBOARD VENDAS:');
  console.log('- Pedidos confirmados:', confirmedOrders);
  console.log('- Vendas do contexto:', financialData.sales.length);
  console.log('- Total de vendas:', totalOrders);
  console.log('- Receita total:', totalRevenue);
  console.log('- Receita do fluxo de caixa:', financialData.totalIncome);
  console.log('- Pedidos:', orders.map(o => ({ id: o.id, status: o.status, total: o.total_amount })));
  console.log('- Vendas do contexto:', financialData.sales);

  // Dados para gráficos baseados nos dados reais do fluxo de caixa
  const currentMonth = new Date().getMonth();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Criar dados dos últimos 6 meses
  const salesData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const monthName = monthNames[monthIndex];
    
    // Entradas do fluxo de caixa (já inclui todas as vendas registradas)
    const monthCashFlow = financialData.cashFlow.filter(entry => {
      const entryMonth = new Date(entry.date).getMonth();
      return entryMonth === monthIndex && entry.type === 'income';
    });
    const monthCashFlowTotal = monthCashFlow.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    
    return {
      name: monthName,
      vendas: monthCashFlowTotal
    };
  });

  // Dados de categoria baseados nos produtos reais
  const categoryData = categories.map(category => {
    const categoryProducts = products.filter(p => p.category_id === category.id);
    const percentage = totalProducts > 0 ? (categoryProducts.length / totalProducts) * 100 : 0;
    
    return {
      name: category.name,
      value: Math.round(percentage),
      color: '#8B5CF6' // Using default color since color property doesn't exist in Category interface
    };
  }).filter(item => item.value > 0);

  const stats = [
    {
      title: "Receita Total",
      value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`,
      change: totalRevenue > 0 ? "+100%" : "R$ 0,00",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Produtos Ativos",
      value: totalProducts.toString(),
      change: `+${totalProducts}`,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Total de Vendas",
      value: totalOrders.toString(),
      change: totalOrders > 0 ? `+${totalOrders}` : "0",
      icon: ShoppingCart,
      color: "text-purple-600",
    },
    {
      title: "Saldo em Caixa",
      value: `R$ ${financialData.balance.toFixed(2).replace('.', ',')}`,
      change: financialData.balance >= 0 ? `+${conversionRate}%` : `-${conversionRate}%`,
      icon: TrendingUp,
      color: financialData.balance >= 0 ? "text-green-600" : "text-red-600",
    },
  ];

  const calculatePrice = () => {
    const { cost, margin, taxes, expenses } = priceSimulation;
    
    if (cost === 0) {
      setSuggestedPrice(0);
      setProfitAmount(0);
      setMarkupResult({ price: 0, profit: 0 });
      setMarginResult({ price: 0, profit: 0 });
      return;
    }

    const totalCost = cost + taxes + expenses;
    // Markup: preço = custo * (1 + markup)
    const markupPrice = totalCost * (1 + (margin / 100));
    const markupProfit = markupPrice - totalCost;
    // Margem: preço = custo / (1 - margem)
    const marginPercent = margin / 100;
    const marginPrice = marginPercent >= 1 ? 0 : totalCost / (1 - marginPercent);
    const marginProfit = marginPrice - totalCost;
    setSuggestedPrice(marginPrice); // Mantém compatibilidade antiga
    setProfitAmount(marginProfit);
    setMarkupResult({ price: markupPrice, profit: markupProfit });
    setMarginResult({ price: marginPrice, profit: marginProfit });
  };

  const handleSimulationChange = (field: string, value: number) => {
    setPriceSimulation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Atividades recentes baseadas no fluxo de caixa
  const recentActivities = financialData.cashFlow
    .slice(0, 4)
    .map(entry => ({
      action: entry.type === 'income' ? "Entrada registrada" : "Despesa registrada",
      product: entry.description,
      time: new Date(entry.date).toLocaleDateString('pt-BR')
    }));

  if (productsLoading || categoriesLoading || ordersLoading || financialData.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-2 md:px-8 py-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent tracking-tight">📊 Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-1">Visão geral completa do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm border border-border bg-background/80 hover:shadow-lg transition-all">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{stat.title}</p>
                  <p className="text-xl font-bold text-foreground leading-tight break-all min-w-0">{stat.value}</p>
                  <p className={`text-xs font-medium ${stat.color}`}>{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  index === 0 ? 'bg-green-100' : 
                  index === 1 ? 'bg-blue-100' :
                  index === 2 ? 'bg-purple-100' : 'bg-orange-100'
                }`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <Card className="shadow-sm border border-border bg-background/80">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              📈 Vendas dos Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, 'Vendas']} />
                <Line type="monotone" dataKey="vendas" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="shadow-sm border border-border bg-background/80">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Package className="h-5 w-5 text-purple-600" />
              📦 Produtos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {categoryData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Simulação de Preço */}
      <Card className="shadow-xl border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-50 border-b">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            💰 Simulação de Preço Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs de Simulação */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Custo do Produto (R$)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={priceSimulation.cost || ''}
                    onChange={(e) => handleSimulationChange('cost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="margin">Margem Desejada (%)</Label>
                  <Input
                    id="margin"
                    type="number"
                    placeholder="0"
                    value={priceSimulation.margin || ''}
                    onChange={(e) => handleSimulationChange('margin', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxes">Impostos (R$)</Label>
                  <Input
                    id="taxes"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={priceSimulation.taxes || ''}
                    onChange={(e) => handleSimulationChange('taxes', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="expenses">Despesas Operacionais (R$)</Label>
                  <Input
                    id="expenses"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={priceSimulation.expenses || ''}
                    onChange={(e) => handleSimulationChange('expenses', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentPrice">Preço Atual no Mercado (R$)</Label>
                <Input
                  id="currentPrice"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={priceSimulation.currentPrice || ''}
                  onChange={(e) => handleSimulationChange('currentPrice', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Preço de referência da concorrência
                </p>
              </div>

              <Button 
                onClick={calculatePrice} 
                className="w-full h-12 text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-lg"
              >
                <Calculator className="h-4 w-4 mr-2" />
                🎯 Calcular Preço Sugerido
              </Button>
            </div>

            {/* Resultados */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Resultados da Simulação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Markup */}
                  <div className="p-3 bg-white rounded border flex flex-col gap-2">
                    <span className="text-sm text-gray-600 font-medium">Preço por Markup</span>
                    <span className="font-bold text-lg text-blue-600">R$ {markupResult.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Lucro: R$ {markupResult.profit.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Fórmula: custo × (1 + markup)</span>
                  </div>
                  {/* Margem de Lucro */}
                  <div className="p-3 bg-white rounded border flex flex-col gap-2">
                    <span className="text-sm text-gray-600 font-medium">Preço por Margem de Lucro</span>
                    <span className="font-bold text-lg text-green-600">R$ {marginResult.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Lucro: R$ {marginResult.profit.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Fórmula: custo ÷ (1 - margem)</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-700 bg-blue-50 rounded p-3">
                  <strong>O que é Markup?</strong> Markup é o percentual aplicado sobre o custo para formar o preço de venda. Exemplo: 50% de markup em R$ 12 resulta em preço de R$ 18.<br/>
                  <strong>O que é Margem de Lucro?</strong> Margem é o percentual de lucro sobre o preço final. Exemplo: 50% de margem em R$ 12 resulta em preço de R$ 24.
                </div>
              </div>

              {/* Breakdown de custos */}
              {suggestedPrice > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Breakdown de Custos</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Custo do produto:</span>
                      <span>R$ {priceSimulation.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impostos:</span>
                      <span>R$ {priceSimulation.taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Despesas:</span>
                      <span>R$ {priceSimulation.expenses.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-1 flex justify-between font-medium">
                      <span>Margem de lucro:</span>
                      <span className="text-green-600">
                        {suggestedPrice > 0 ? ((profitAmount / suggestedPrice) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-sm border border-border bg-background/80">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calculator className="h-5 w-5 text-orange-600" />
            🕒 Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {recentActivities.length === 0 ? (
              <li className="py-6 text-center text-muted-foreground">Nenhuma atividade recente</li>
            ) : (
              recentActivities.map((activity, idx) => (
                <li key={idx} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.product}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
