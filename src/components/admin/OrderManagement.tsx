import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ShoppingBag, 
  User, 
  CalendarIcon, 
  Package, 
  DollarSign, 
  Check, 
  X, 
  Edit3, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Filter,
  Search,
  Plus,
  Trash2
} from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancial } from "@/contexts/FinancialContext";
import { toast } from "sonner";
import { useOptimizedProducts } from "@/hooks/useOptimizedProducts";
import { cn } from "@/lib/utils";
import { API_URL } from "@/constants/api";
import api from '@/services/api';


interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    name: string;
    stock: number;
  };
}

interface Order {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  store_owner_id: string;
  order_items: OrderItem[];
}

const OrderManagement = () => {
  const { user } = useAuth();
  const { addCashFlowEntry, registerSale } = useFinancial();
  const { products, refetch: refetchProducts } = useOptimizedProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingItems, setEditingItems] = useState<OrderItem[]>([]);

  // Buscar pedidos
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('[OrderManagement] Iniciando busca de pedidos...');
      
      // Tentar buscar com include dos itens
      const res = await api.get('/pedidos?include=order_items');
      console.log('[OrderManagement] Resposta completa da API:', res);
      console.log('[OrderManagement] Status da resposta:', res.status);
      console.log('[OrderManagement] Headers da resposta:', res.headers);
      console.log('[OrderManagement] Dados da resposta:', res.data);
      
      if (res.data && Array.isArray(res.data)) {
        console.log('[OrderManagement] Total de pedidos recebidos:', res.data.length);
        
        res.data.forEach((order, index) => {
          console.log(`[OrderManagement] Pedido ${index + 1}:`, {
            id: order.id,
            customer_name: order.customer_name,
            total_amount: order.total_amount,
            status: order.status,
            order_items: order.order_items,
            order_items_length: order.order_items?.length || 0
          });
          
          if (!order.order_items || order.order_items.length === 0) {
            console.warn(`[OrderManagement] ALERTA: Pedido ${order.id} não tem itens!`);
          }
        });
        
        setOrders(res.data);
      } else {
        console.warn('[OrderManagement] Resposta da API não é um array válido:', res.data);
        setOrders([]);
      }
      
    } catch (error) {
      console.error('[OrderManagement] Erro completo ao buscar pedidos:', error);
      if (error.response) {
        console.error('[OrderManagement] Resposta de erro:', error.response.data);
        console.error('[OrderManagement] Status de erro:', error.response.status);
      }
      
      toast({
        title: "Erro",
        description: "Falha ao carregar pedidos. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar pedido
  const confirmOrder = async (order: Order) => {
    if (!user || !user.token) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se o pedido tem itens
    if (!order.order_items || order.order_items.length === 0) {
      toast({
        title: "Erro",
        description: "Este pedido não possui itens. Não é possível confirmar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('[OrderManagement] Confirmando pedido:', order.id);
      console.log('[OrderManagement] Itens do pedido:', order.order_items);
      
      // Verificar estoque
      const stockIssues = [];
      for (const item of order.order_items) {
        const product = products.find(p => p.id === item.product_id);
        if (product && product.stock < item.quantity) {
          stockIssues.push(`${item.product?.name}: estoque insuficiente (${product.stock} disponível, ${item.quantity} solicitado)`);
        }
      }
      if (stockIssues.length > 0) {
        toast({
          title: "Estoque insuficiente",
          description: stockIssues.join('\n'),
          variant: "destructive",
        });
        return;
      }
      // Atualizar status do pedido
      await api.put(`/pedidos/${order.id}`, { status: 'confirmed' });
      // Atualizar estoque
      for (const item of order.order_items) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          await api.put(`/products/${item.product_id}`, { stock: product.stock - item.quantity });
        }
      }
      // Adicionar ao financeiro
      await addCashFlowEntry({
        user_id: user.id,
        store_id: null,
        type: 'income',
        amount: order.total_amount,
        description: `Pedido confirmado - ${order.customer_name}`,
        category: 'Vendas',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'whatsapp'
      });
      toast({
        title: "Sucesso",
        description: 'Pedido confirmado com sucesso!',
        variant: "default",
      });
      await fetchOrders();
      await refetchProducts();
    } catch (error) {
      console.error('[OrderManagement] Erro ao confirmar pedido:', error);
      toast({
        title: "Erro",
        description: 'Erro ao confirmar pedido. Verifique o console para mais detalhes.',
        variant: "destructive",
      });
    }
  };

  // Cancelar pedido
  const cancelOrder = async (orderId: string) => {
    if (!user || !user.token) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('[OrderManagement] Cancelando pedido:', orderId);
      await api.put(`/pedidos/${orderId}`, { status: 'cancelled' });
      toast({
        title: "Sucesso",
        description: 'Pedido cancelado com sucesso',
        variant: "default",
      });
      await fetchOrders();
    } catch (error) {
      console.error('[OrderManagement] Erro ao cancelar pedido:', error);
      toast({
        title: "Erro",
        description: 'Erro ao cancelar pedido. Verifique o console para mais detalhes.',
        variant: "destructive",
      });
    }
  };

  // Abrir modal de edição
  const openEditModal = (order: Order) => {
    console.log('[OrderManagement] Abrindo modal de edição para pedido:', order.id);
    console.log('[OrderManagement] Itens do pedido para edição:', order.order_items);
    
    setEditingOrder(order);
    // Se não há itens, inicializar com array vazio
    setEditingItems(order.order_items ? [...order.order_items] : []);
  };

  // Salvar edições
  const saveOrderEdits = async () => {
    if (!editingOrder || !user || !user.token) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para salvar pedido",
        variant: "destructive",
      });
      return;
    }
    
    if (editingItems.length === 0) {
      toast({
        title: "Erro",
        description: "O pedido deve ter pelo menos um item",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('[OrderManagement] Salvando edições do pedido:', editingOrder.id);
      console.log('[OrderManagement] Novos itens:', editingItems);
      
      // Calcular novo total
      const newTotal = editingItems.reduce((sum, item) => sum + item.total_price, 0);
      console.log('[OrderManagement] Novo total calculado:', newTotal);
      
      // Atualizar pedido
      await api.put(`/pedidos/${editingOrder.id}`, { 
        total_amount: newTotal,
        order_items: editingItems
      });
      
      toast({
        title: "Sucesso",
        description: 'Pedido atualizado com sucesso!',
        variant: "default",
      });
      
      setEditingOrder(null);
      setEditingItems([]);
      await fetchOrders();
    } catch (error) {
      console.error('[OrderManagement] Erro ao salvar pedido:', error);
      toast({
        title: "Erro",
        description: 'Erro ao salvar pedido. Verifique o console para mais detalhes.',
        variant: "destructive",
      });
    }
  };

  // Adicionar item ao pedido em edição
  const addItemToEdit = () => {
    setEditingItems([...editingItems, {
      id: `temp-${Date.now()}`,
      order_id: editingOrder?.id || '',
      product_id: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  // Remover item do pedido em edição
  const removeItemFromEdit = (index: number) => {
    const newItems = editingItems.filter((_, i) => i !== index);
    setEditingItems(newItems);
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_phone?.includes(searchTerm) ||
                         order.id.includes(searchTerm);
    
    // Filtrar por data selecionada
    const orderDate = new Date(order.created_at);
    const matchesDate = selectedDate ? 
      format(orderDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') :
      true;
    
    return matchesFilter && matchesSearch && matchesDate;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          🛒 Pedidos
        </h1>
        <p className="text-muted-foreground">Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          🛒 Pedidos
        </h1>
        <p className="text-muted-foreground">Gerencie os pedidos dos seus clientes</p>
      </div>

      {/* Filtros */}
      <Card className="shadow-lg border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, telefone ou ID do pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Calendário */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      {filteredOrders.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-400">
              {searchTerm || filter !== 'all' || selectedDate
                ? 'Tente ajustar os filtros de busca'
                : 'Os pedidos dos clientes aparecerão aqui'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-l-4 border-l-primary">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm">
                        {format(new Date(order.created_at), "dd/MM", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-xs text-gray-500">#{order.id.slice(0, 8)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {order.customer_phone || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {/* Verificar se há itens no pedido */}
                          {!order.order_items || order.order_items.length === 0 ? (
                            <div className="text-red-500">
                              <div>0 itens</div>
                              <div className="text-xs">⚠️ Sem itens</div>
                            </div>
                          ) : (
                            <div>
                              <div>
                                {/* Calcular quantidade total de itens */}
                                {(() => {
                                  const totalQuantity = (order.order_items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                                  return `${totalQuantity} ${totalQuantity === 1 ? 'item' : 'itens'}`;
                                })()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(order.order_items || []).slice(0, 1).map(item => {
                                  const productName = item.product?.name || item.product_name || 'Produto';
                                  const quantity = item.quantity || 1;
                                  return `${productName} (${quantity}x)`;
                                }).join(', ')}
                                {(order.order_items || []).length > 1 && ' +'}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(order.status)}
                          <span className="hidden sm:inline">{getStatusText(order.status)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="text-green-600">
                          R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.status === 'pending' ? (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => confirmOrder(order)}
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
                              disabled={!order.order_items || order.order_items.length === 0}
                              title={!order.order_items || order.order_items.length === 0 ? "Não é possível confirmar pedido sem itens" : "Confirmar pedido"}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => openEditModal(order)}
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              title="Editar pedido"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => cancelOrder(order.id)}
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              title="Cancelar pedido"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pedido - {editingOrder?.customer_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Lista de Itens */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold">Itens do Pedido</h4>
                <Button onClick={addItemToEdit} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {editingItems.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label>Produto</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => {
                          const product = products.find(p => p.id === value);
                          if (product) {
                            const newItems = [...editingItems];
                            newItems[index] = {
                              ...item,
                              product_id: value,
                              unit_price: product.price,
                              total_price: product.price * item.quantity,
                              product: { name: product.name, stock: product.stock }
                            };
                            setEditingItems(newItems);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - R$ {Number(product.price).toFixed(2)} (Estoque: {product.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-24 space-y-2">
                      <Label>Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value) || 1;
                          const newItems = [...editingItems];
                          newItems[index] = {
                            ...item,
                            quantity,
                            total_price: item.unit_price * quantity
                          };
                          setEditingItems(newItems);
                        }}
                      />
                    </div>
                    
                    <div className="w-32 space-y-2">
                      <Label>Preço Unit.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => {
                          const unitPrice = parseFloat(e.target.value) || 0;
                          const newItems = [...editingItems];
                          newItems[index] = {
                            ...item,
                            unit_price: unitPrice,
                            total_price: unitPrice * item.quantity
                          };
                          setEditingItems(newItems);
                        }}
                      />
                    </div>
                    
                    <div className="w-32 space-y-2">
                      <Label>Total</Label>
                      <div className="h-10 flex items-center px-3 border rounded-md bg-gray-50">
                        R$ {Number(item.total_price).toFixed(2)}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => removeItemFromEdit(index)}
                      size="sm"
                      variant="destructive"
                      className="mb-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="text-right">
              <div className="text-2xl font-bold">
                Total: R$ {editingItems.reduce((sum, item) => sum + Number(item.total_price), 0).toFixed(2)}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button onClick={() => setEditingOrder(null)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={saveOrderEdits} className="flex-1">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;