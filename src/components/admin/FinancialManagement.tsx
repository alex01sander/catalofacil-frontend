import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SaleForm from "./SaleForm";

interface Sale {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  status: string;
  created_at: string;
}

const FinancialManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar vendas do banco de dados
  useEffect(() => {
    const fetchSales = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao buscar vendas:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as vendas",
            variant: "destructive",
          });
        } else {
          setSales(data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar vendas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [user, toast]);

  // Calcular dados dos gráficos baseado nas vendas reais
  const currentMonth = new Date().getMonth();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const monthName = monthNames[monthIndex];
    const monthSales = sales.filter(sale => {
      const saleMonth = new Date(sale.sale_date).getMonth();
      return saleMonth === monthIndex;
    });
    const monthTotal = monthSales.reduce((sum, sale) => sum + Number(sale.total_price), 0);
    return {
      month: monthName,
      vendas: monthTotal
    };
  });

  // Produtos mais vendidos baseado nas vendas reais
  const productSales = sales.reduce((acc, sale) => {
    const productName = sale.product_name;
    if (!acc[productName]) {
      acc[productName] = { quantity: 0, revenue: 0 };
    }
    acc[productName].quantity += sale.quantity;
    acc[productName].revenue += Number(sale.total_price);
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({
      name,
      sales: data.quantity,
      revenue: `R$ ${data.revenue.toFixed(2).replace('.', ',')}`
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_price), 0);
  const totalSales = sales.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  const handleAddSale = () => {
    setShowSaleForm(true);
  };

  const handleSaleSubmit = async (saleData: {
    product: string;
    quantity: number;
    unitPrice: number;
    total: number;
    date: string;
    status: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sales')
        .insert([
          {
            user_id: user.id,
            product_name: saleData.product,
            quantity: saleData.quantity,
            unit_price: saleData.unitPrice,
            total_price: saleData.total,
            sale_date: saleData.date,
            status: saleData.status
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar venda:', error);
        toast({
          title: "Erro",
          description: "Não foi possível registrar a venda",
          variant: "destructive",
        });
        return;
      }

      // Adicionar a nova venda ao estado local
      setSales(prev => [data, ...prev]);
      setShowSaleForm(false);
      
      toast({
        title: "Venda registrada",
        description: "Nova venda adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive",
      });
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
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
                <p className="text-sm text-gray-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Baseado nas vendas registradas
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
                <p className="text-sm text-gray-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Vendas registradas
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
                <p className="text-sm text-gray-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Média por venda
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
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
                    'Vendas'
                  ]}
                />
                <Bar dataKey="vendas" fill="#8B5CF6" />
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

      {/* Produtos mais vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum produto vendido ainda</p>
              <p className="text-sm">Os produtos mais vendidos aparecerão aqui após você registrar algumas vendas</p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Vendas recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma venda registrada</p>
              <p className="text-sm mb-4">Comece registrando sua primeira venda</p>
              <Button onClick={handleAddSale} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Venda
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Layout */}
              <div className="block md:hidden space-y-4">
                {sales.map((sale) => (
                  <div key={sale.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2">
                        {sale.product_name}
                      </h3>
                      <Badge variant="default" className="text-xs">Concluída</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600 text-xs">Quantidade</p>
                        <p className="font-medium text-gray-900">{sale.quantity} unidades</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Preço Unitário</p>
                        <p className="font-medium text-gray-900">
                          R$ {Number(sale.unit_price).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Data</p>
                        <p className="font-medium text-gray-900">
                          {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600 text-xs">Total</p>
                        <p className="font-bold text-green-600 text-base">
                          R$ {Number(sale.total_price).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
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
                        <td className="p-3 font-medium">{sale.product_name}</td>
                        <td className="p-3">{sale.quantity}</td>
                        <td className="p-3">R$ {Number(sale.unit_price).toFixed(2).replace('.', ',')}</td>
                        <td className="p-3 font-semibold">R$ {Number(sale.total_price).toFixed(2).replace('.', ',')}</td>
                        <td className="p-3">{new Date(sale.sale_date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3">
                          <Badge variant="default">Concluída</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialManagement;
