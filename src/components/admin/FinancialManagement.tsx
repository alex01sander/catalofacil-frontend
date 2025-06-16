import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";
import SaleForm from "./SaleForm";

interface Sale {
  id: number;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
  status: string;
}

const FinancialManagement = () => {
  const { toast } = useToast();
  const [showSaleForm, setShowSaleForm] = useState(false);
  
  const [sales, setSales] = useState<Sale[]>([
    {
      id: 1,
      product: "Smartphone Galaxy Pro",
      quantity: 2,
      unitPrice: 1299.99,
      total: 2599.98,
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: 2,
      product: "Camiseta Premium Cotton",
      quantity: 1,
      unitPrice: 89.90,
      total: 89.90,
      date: "2024-01-14",
      status: "completed"
    },
    {
      id: 3,
      product: "Kit Skincare Completo",
      quantity: 3,
      unitPrice: 149.90,
      total: 449.70,
      date: "2024-01-13",
      status: "completed"
    }
  ]);

  const monthlyData = [
    { month: 'Jan', vendas: 15400, lucro: 4620 },
    { month: 'Fev', vendas: 18200, lucro: 5460 },
    { month: 'Mar', vendas: 22100, lucro: 6630 },
    { month: 'Abr', vendas: 19800, lucro: 5940 },
    { month: 'Mai', vendas: 25600, lucro: 7680 },
    { month: 'Jun', vendas: 28300, lucro: 8490 },
  ];

  const topProducts = [
    { name: "Smartphone Galaxy Pro", sales: 45, revenue: "R$ 58.499,55" },
    { name: "Kit Skincare Completo", sales: 32, revenue: "R$ 4.796,80" },
    { name: "Camiseta Premium Cotton", sales: 28, revenue: "R$ 2.517,20" },
    { name: "Sofá Moderno 3 Lugares", sales: 12, revenue: "R$ 29.999,88" },
  ];

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSales = sales.length;
  const averageTicket = totalRevenue / totalSales;

  const handleAddSale = () => {
    setShowSaleForm(true);
  };

  const handleSaleSubmit = (saleData: Omit<Sale, 'id'>) => {
    const newSale = {
      ...saleData,
      id: Math.max(...sales.map(s => s.id)) + 1
    };
    
    setSales(prev => [newSale, ...prev]);
    setShowSaleForm(false);
    
    toast({
      title: "Venda registrada",
      description: "Nova venda adicionada com sucesso!",
    });
  };

  const handleSaleCancel = () => {
    setShowSaleForm(false);
  };

  if (showSaleForm) {
    return (
      <div className="space-y-6">
        <SaleForm
          onSubmit={handleSaleSubmit}
          onCancel={handleSaleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Controle suas vendas e receitas</p>
        </div>
        <Button onClick={handleAddSale} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Venda
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalRevenue.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12.5%
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                <p className="text-sm text-blue-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +8.2%
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {averageTicket.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-purple-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +5.4%
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lucro Estimado</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(totalRevenue * 0.3).toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +15.2%
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas e Lucro Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `R$ ${value}`, 
                    name === 'vendas' ? 'Vendas' : 'Lucro'
                  ]}
                />
                <Bar dataKey="vendas" fill="#8B5CF6" />
                <Bar dataKey="lucro" fill="#06D6A0" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, 'Vendas']} />
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.sales} vendas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{product.revenue}</p>
                  <Badge variant="secondary" className="text-xs">
                    Top {index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Produto</th>
                  <th className="text-left p-3">Quantidade</th>
                  <th className="text-left p-3">Preço Unit.</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{sale.product}</td>
                    <td className="p-3">{sale.quantity}</td>
                    <td className="p-3">R$ {sale.unitPrice.toFixed(2).replace('.', ',')}</td>
                    <td className="p-3 font-semibold">R$ {sale.total.toFixed(2).replace('.', ',')}</td>
                    <td className="p-3">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">
                      <Badge variant="default">Concluída</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialManagement;
