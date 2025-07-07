import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, ShoppingCart, DollarSign, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useOptimizedProducts } from "@/hooks/useOptimizedProducts";
import { useOptimizedCategories } from "@/hooks/useOptimizedCategories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancial } from "@/contexts/FinancialContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useOptimizedProducts();
  const { categories } = useOptimizedCategories();
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

  // Buscar pedidos do usuário
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('store_owner_id', user.id);
        
        if (error) {
          console.error('Erro ao buscar pedidos:', error);
        } else {
          setOrders(data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Calcular estatísticas reais combinando pedidos e vendas do contexto financeiro
  const totalRevenueOrders = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const totalRevenueSales = financialData.sales.reduce((sum, sale) => sum + Number(sale.total_price || 0), 0);
  const totalRevenue = totalRevenueOrders + totalRevenueSales + financialData.totalIncome;
  
  const totalProducts = products.filter(p => p.is_active).length;
  const totalOrders = orders.length + financialData.sales.length;
  const conversionRate = totalOrders > 0 ? ((totalOrders / (totalProducts || 1)) * 100).toFixed(1) : "0.0";

  // Dados para gráficos baseados nos dados reais (combinando orders e sales do contexto)
  const currentMonth = new Date().getMonth();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Criar dados dos últimos 6 meses
  const salesData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const monthName = monthNames[monthIndex];
    
    // Vendas dos pedidos
    const monthOrders = orders.filter(order => {
      const orderMonth = new Date(order.created_at).getMonth();
      return orderMonth === monthIndex;
    });
    const monthOrdersTotal = monthOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    
    // Vendas registradas manualmente do contexto
    const monthSales = financialData.sales.filter(sale => {
      const saleMonth = new Date(sale.sale_date).getMonth();
      return saleMonth === monthIndex;
    });
    const monthSalesTotal = monthSales.reduce((sum, sale) => sum + Number(sale.total_price || 0), 0);
    
    // Entradas do fluxo de caixa
    const monthCashFlow = financialData.cashFlow.filter(entry => {
      const entryMonth = new Date(entry.date).getMonth();
      return entryMonth === monthIndex && entry.type === 'income';
    });
    const monthCashFlowTotal = monthCashFlow.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    
    return {
      name: monthName,
      vendas: monthOrdersTotal + monthSalesTotal + monthCashFlowTotal
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
      return;
    }

    // Custo total
    const totalCost = cost + taxes + expenses;
    // Preço sugerido baseado na margem de lucro
    const finalPrice = totalCost / (1 - (margin / 100));
    // Lucro líquido
    const profit = finalPrice - totalCost;

    setSuggestedPrice(finalPrice);
    setProfitAmount(profit);
  };

  const handleSimulationChange = (field: string, value: number) => {
    setPriceSimulation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Atividades recentes baseadas nos dados reais do contexto financeiro
  const recentActivities = [
    ...orders.slice(0, 2).map(order => ({
      action: "Nova venda realizada",
      product: `Pedido #${order.id.slice(0, 8)}`,
      time: new Date(order.created_at).toLocaleDateString('pt-BR')
    })),
    ...financialData.sales.slice(0, 2).map(sale => ({
      action: "Venda registrada",
      product: sale.product_name,
      time: new Date(sale.created_at).toLocaleDateString('pt-BR')
    })),
    ...financialData.cashFlow.slice(0, 2).map(entry => ({
      action: entry.type === 'income' ? "Entrada registrada" : "Despesa registrada",
      product: entry.description,
      time: new Date(entry.date).toLocaleDateString('pt-BR')
    }))
  ].slice(0, 4); // Limitar a 4 atividades

  if (productsLoading || ordersLoading || financialData.isLoading) {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          📊 Dashboard
        </h1>
        <p className="text-muted-foreground">Visão geral completa do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-lg border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm font-medium ${stat.color}`}>{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-green-100' : 
                  index === 1 ? 'bg-blue-100' :
                  index === 2 ? 'bg-purple-100' : 'bg-orange-100'
                }`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="text-sm text-gray-600">Preço Sugerido:</span>
                    <span className="font-bold text-lg text-green-600">
                      R$ {suggestedPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="text-sm text-gray-600">Lucro Líquido:</span>
                    <span className="font-bold text-purple-600">
                      R$ {profitAmount.toFixed(2)}
                    </span>
                  </div>

                  {priceSimulation.currentPrice > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white rounded border">
                      <span className="text-sm text-gray-600">Preço Atual:</span>
                      <span className="font-bold text-blue-600">
                        R$ {priceSimulation.currentPrice.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {suggestedPrice > 0 && priceSimulation.currentPrice > 0 && (
                    <div className="p-3 bg-white rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Comparação:</span>
                        <span className={`font-bold ${
                          suggestedPrice > priceSimulation.currentPrice 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {suggestedPrice > priceSimulation.currentPrice ? '+' : ''}
                          R$ {(suggestedPrice - priceSimulation.currentPrice).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {suggestedPrice > priceSimulation.currentPrice 
                          ? 'Preço sugerido acima do mercado' 
                          : 'Preço sugerido competitivo'}
                      </p>
                    </div>
                  )}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
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
                <Tooltip 
                  formatter={(value) => [`R$ ${value}`, 'Vendas']}
                />
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Chart */}
        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5 text-purple-600" />
              🏷️ Produtos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {categoryData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Nenhuma categoria com produtos encontrada</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.product}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium mb-2">Nenhuma atividade recente</p>
              <p className="text-sm">Suas atividades aparecerão aqui conforme você usar o sistema</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
