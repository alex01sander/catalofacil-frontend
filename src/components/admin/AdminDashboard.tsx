
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, ShoppingCart, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
