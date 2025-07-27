import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, RefreshCw, CheckCircle, Calendar, Filter, Search, X } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
}

export default function OrderManagement() {
  const { user, token } = useAuth();
  const { registerSale } = useFinancial();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Buscar pedidos apenas uma vez ao carregar
  useEffect(() => {
    if (user && token) {
      fetchOrders();
      fetchProducts();
    }
  }, [user, token]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/pedidos');
      const ordersData = response.data?.data || response.data || [];
      setOrders(ordersData);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const productsData = response.data?.data || response.data || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const confirmOrder = async (order: Order) => {
    try {
      // Atualizar status do pedido
      await api.put(`/pedidos/${order.id}`, { status: 'confirmed' });

      // Registrar vendas para cada item do pedido
      for (const item of order.items) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          // Registrar venda
          await registerSale({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            date: order.created_at,
            customer_name: order.customer_name,
            payment_method: 'cash'
          });

          // Atualizar estoque do produto
          const newStock = product.stock - item.quantity;
          await api.put(`/products/${item.product_id}`, { stock: newStock });
        }
      }

      // Atualizar lista de pedidos localmente
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status: 'confirmed' } : o
      ));

      // Atualizar lista de produtos localmente
      setProducts(prev => prev.map(p => {
        const item = order.items.find(i => i.product_id === p.id);
        if (item) {
          return { ...p, stock: p.stock - item.quantity };
        }
        return p;
      }));

      toast({
        title: 'Sucesso',
        description: 'Pedido confirmado e vendas registradas automaticamente!'
      });

    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar o pedido',
        variant: 'destructive'
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_phone.includes(searchTerm);
    const matchesDate = !selectedDate || order.created_at.startsWith(selectedDate);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setStatusFilter('all');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM', { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            Pedidos
          </h1>
          <p className="text-muted-foreground">Gerencie os pedidos dos seus clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredOrders.length} de {orders.length} pedidos
          </Badge>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, telefone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-left py-3 px-4">Cliente</th>
                  <th className="text-left py-3 px-4">Telefone</th>
                  <th className="text-left py-3 px-4">Itens</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-4 font-medium">{order.customer_name}</td>
                    <td className="py-3 px-4">{order.customer_phone}</td>
                    <td className="py-3 px-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.quantity}x {item.product_name}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            onClick={() => confirmOrder(order)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Confirmar
                          </Button>
                        )}
                      </div>
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
}