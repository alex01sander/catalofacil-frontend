import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, RefreshCw, CheckCircle, Calendar, Filter, Search, X, Edit, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product?: {
      id: string;
      name: string;
      stock: number;
    };
  }>;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export default function OrderManagement() {
  const { user, token } = useAuth();
  const { registerSale, refreshData } = useFinancial();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Estados para modais
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Partial<Order>>({});
  const [editingItems, setEditingItems] = useState<Array<{
    id?: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>>([]);

  // Buscar pedidos apenas uma vez ao carregar
  useEffect(() => {
    if (user && token) {
      fetchOrders();
      fetchProducts();
    }
  }, [user, token]);

  const fetchOrders = async () => {
    try {
      // Buscar pedidos com os itens incluídos
      const response = await api.get('/pedidos?include=order_items');
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
      console.log('[OrderManagement] 🔍 INICIANDO CONFIRMAÇÃO DO PEDIDO:', order.id);
      console.log('[OrderManagement] 📦 Itens do pedido:', order.order_items);
      
      // Verificar se o pedido tem itens
      if (!order.order_items || order.order_items.length === 0) {
        toast({
          title: 'Erro',
          description: 'Este pedido não possui itens para confirmar',
          variant: 'destructive'
        });
        return;
      }

      console.log('[OrderManagement] ✅ Pedido tem itens, atualizando status...');
      
      // Atualizar status do pedido
      await api.put(`/pedidos/${order.id}`, { status: 'confirmed' });
      console.log('[OrderManagement] ✅ Status do pedido atualizado para confirmed');

      // Registrar vendas para cada item do pedido usando a nova rota
      console.log('[OrderManagement] 🛒 Iniciando registro de vendas com nova rota...');
      for (const item of order.order_items) {
        console.log('[OrderManagement] 📋 Processando item:', item);
        
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          console.log('[OrderManagement] 🎯 Registrando venda com nova rota:', {
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price,
            customer_name: order.customer_name,
            date: order.created_at
          });
          
          // Usar a nova rota que integra automaticamente com fluxo de caixa
          await registerSale({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            date: order.created_at,
            customer_name: order.customer_name,
            payment_method: 'cash'
          });
          
          console.log('[OrderManagement] ✅ Venda registrada com integração automática para produto:', product.name);
          
          // Não precisamos mais atualizar estoque manualmente
          // A nova rota já faz isso automaticamente
          console.log('[OrderManagement] ✅ Estoque atualizado automaticamente pela nova rota');
        } else {
          console.error('[OrderManagement] ❌ Produto não encontrado:', item.product_id);
          toast({
            title: 'Aviso',
            description: `Produto ${item.product_id} não encontrado`,
            variant: 'destructive'
          });
        }
      }

      console.log('[OrderManagement] 🔄 Atualizando lista de pedidos localmente...');
      
      // Atualizar lista de pedidos localmente
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status: 'confirmed' } : o
      ));

      // Atualizar lista de produtos localmente
      setProducts(prev => prev.map(p => {
        const item = order.order_items?.find(i => i.product_id === p.id);
        if (item) {
          return { ...p, stock: p.stock - item.quantity };
        }
        return p;
      }));

      console.log('[OrderManagement] 🎉 CONFIRMAÇÃO CONCLUÍDA COM SUCESSO!');
      
      // FORÇAR ATUALIZAÇÃO DOS DADOS FINANCEIROS
      console.log('[OrderManagement] 🔄 Forçando atualização dos dados financeiros...');
      try {
        // Aguardar um pouco para o backend processar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Forçar refresh dos dados financeiros
        await refreshData();
        
        console.log('[OrderManagement] ✅ Dados financeiros atualizados!');
      } catch (refreshError) {
        console.error('[OrderManagement] ⚠️ Erro ao atualizar dados financeiros:', refreshError);
      }
      
      toast({
        title: 'Sucesso',
        description: 'Pedido confirmado e vendas registradas automaticamente!'
      });

    } catch (error) {
      console.error('[OrderManagement] ❌ Erro ao confirmar pedido:', error);
      console.error('[OrderManagement] ❌ Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar o pedido',
        variant: 'destructive'
      });
    }
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setEditingOrder({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      status: order.status
    });
    // Mapear order_items para o formato correto
    const mappedItems = (order.order_items || []).map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product?.name || products.find(p => p.id === item.product_id)?.name || 'Produto não encontrado',
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));
    setEditingItems(mappedItems);
    setEditModalOpen(true);
  };

  const openDeleteModal = (order: Order) => {
    setSelectedOrder(order);
    setDeleteModalOpen(true);
  };

  const saveOrderEdits = async () => {
    if (!selectedOrder) return;

    try {
      // Preparar dados para atualização
      const updateData = {
        ...editingOrder,
        order_items: editingItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      };

      await api.put(`/pedidos/${selectedOrder.id}`, updateData);
      
      // Atualizar lista localmente
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id 
          ? { 
              ...o, 
              ...editingOrder,
              order_items: editingItems.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                product: products.find(p => p.id === item.product_id)
              }))
            }
          : o
      ));

      setEditModalOpen(false);
      setSelectedOrder(null);
      setEditingOrder({});
      setEditingItems([]);

      toast({
        title: 'Sucesso',
        description: 'Pedido atualizado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o pedido',
        variant: 'destructive'
      });
    }
  };

  const deleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      await api.delete(`/pedidos/${selectedOrder.id}`);
      
      // Remover da lista localmente
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));

      setDeleteModalOpen(false);
      setSelectedOrder(null);

      toast({
        title: 'Sucesso',
        description: 'Pedido excluído com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o pedido',
        variant: 'destructive'
      });
    }
  };

  const addItemToEdit = () => {
    const newItem = {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setEditingItems(prev => [...prev, newItem]);
  };

  const removeItemFromEdit = (index: number) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemInEdit = (index: number, field: string, value: any) => {
    setEditingItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        // Recalcular total_price se quantity ou unit_price mudaram
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        // Atualizar product_name se product_id mudou
        if (field === 'product_id') {
          const product = products.find(p => p.id === value);
          updatedItem.product_name = product?.name || 'Produto não encontrado';
          updatedItem.unit_price = product?.price || 0;
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer_phone || '').includes(searchTerm);
    const matchesDate = !selectedDate || (order.created_at || '').startsWith(selectedDate);
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
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM', { locale: ptBR });
    } catch (error) {
      return '-';
    }
  };

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return 'R$ 0,00';
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
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item, index) => {
                          // Buscar nome do produto se não estiver disponível no item
                          const product = products.find(p => p.id === item.product_id);
                          const productName = item.product?.name || product?.name || 'Produto não encontrado';
                          
                          return (
                            <div key={index} className="text-sm">
                              {item.quantity}x {productName}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Nenhum item
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => openEditModal(order)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => openDeleteModal(order)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            onClick={() => confirmOrder(order)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
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

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pedido</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias no pedido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome do Cliente</label>
                <Input
                  value={editingOrder.customer_name || ''}
                  onChange={(e) => setEditingOrder(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={editingOrder.customer_phone || ''}
                  onChange={(e) => setEditingOrder(prev => ({ ...prev, customer_phone: e.target.value }))}
                  placeholder="Telefone do cliente"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editingOrder.status || 'pending'}
                onValueChange={(value) => setEditingOrder(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gestão de Produtos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">Produtos do Pedido</label>
                <Button
                  onClick={addItemToEdit}
                  size="sm"
                  variant="outline"
                  className="text-blue-600 hover:text-blue-700"
                >
                  + Adicionar Produto
                </Button>
              </div>
              
              <div className="space-y-3">
                {editingItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      <Button
                        onClick={() => removeItemFromEdit(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Produto</label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => updateItemInEdit(index, 'product_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - R$ {formatCurrency(product.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground">Quantidade</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemInEdit(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground">Preço Unitário</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItemInEdit(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        Total: {formatCurrency(item.total_price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {editingItems.length > 0 && (
                <div className="text-right pt-4 border-t">
                  <span className="text-lg font-bold">
                    Total do Pedido: {formatCurrency(editingItems.reduce((sum, item) => sum + item.total_price, 0))}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveOrderEdits}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Cliente:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Telefone:</strong> {selectedOrder.customer_phone}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedOrder.total_amount)}</p>
                <p><strong>Status:</strong> {selectedOrder.status}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={deleteOrder}>
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}