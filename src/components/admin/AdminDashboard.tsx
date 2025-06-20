import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, ShoppingCart, DollarSign, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const AdminDashboard = () => {
  // Dados de exemplo para os gráficos
  const salesData = [
    { name: 'Jan', vendas: 4000 },
    { name: 'Fev', vendas: 3000 },
    { name: 'Mar', vendas: 5000 },
    { name: 'Abr', vendas: 4500 },
    { name: 'Mai', vendas: 6000 },
    { name: 'Jun', vendas: 5500 },
  ];

  const categoryData = [
    { name: 'Eletrônicos', value: 40, color: '#8B5CF6' },
    { name: 'Roupas', value: 30, color: '#A78BFA' },
    { name: 'Casa', value: 20, color: '#C4B5FD' },
    { name: 'Beleza', value: 10, color: '#DDD6FE' },
  ];

  const stats = [
    {
      title: "Vendas do Mês",
      value: "R$ 24.500",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Produtos Ativos",
      value: "127",
      change: "+3",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Pedidos Hoje",
      value: "23",
      change: "+8.2%",
      icon: ShoppingCart,
      color: "text-purple-600",
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: "+0.5%",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

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

  const calculatePrice = () => {
    const { cost, margin, taxes, expenses } = priceSimulation;
    
    if (cost === 0) {
      setSuggestedPrice(0);
      setProfitAmount(0);
      return;
    }
    
    // Calcula o preço base com margem
    const basePrice = cost / (1 - (margin / 100));
    
    // Adiciona impostos e despesas como valores absolutos
    const finalPrice = basePrice + taxes + expenses;
    
    // Calcula o lucro líquido
    const profit = finalPrice - cost - taxes - expenses;
    
    setSuggestedPrice(finalPrice);
    setProfitAmount(profit);
  };

  const handleSimulationChange = (field: string, value: number) => {
    setPriceSimulation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simulação de Preço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            Simulação de Preço
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
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Preço Sugerido
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
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 6 Meses</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
          <div className="space-y-4">
            {[
              { action: "Nova venda realizada", product: "Smartphone Galaxy Pro", time: "2 min atrás" },
              { action: "Produto adicionado", product: "Camiseta Premium Cotton", time: "1 hora atrás" },
              { action: "Estoque baixo", product: "Kit Skincare Completo", time: "2 horas atrás" },
              { action: "Nova categoria criada", product: "Acessórios", time: "1 dia atrás" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.product}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
