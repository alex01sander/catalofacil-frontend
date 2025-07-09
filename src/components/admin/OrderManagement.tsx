import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingBag, 
  User, 
  Calendar, 
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancial } from "@/contexts/FinancialContext";
import { toast } from "sonner";
import { useOptimizedProducts } from "@/hooks/useOptimizedProducts";
import CreateTestOrder from "./CreateTestOrder";

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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingItems, setEditingItems] = useState<OrderItem[]>([]);

  // Buscar pedidos
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, stock)
          )
        `)
        .eq('store_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersWithItems = data.map(order => ({
        ...order,
        order_items: order.order_items.map(item => ({
          ...item,
          product: item.products
        }))
      }));

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar pedido
  const confirmOrder = async (order: Order) => {
    try {
      // Verificar estoque
      const stockIssues = [];
      for (const item of order.order_items) {
        const product = products.find(p => p.id === item.product_id);
        if (product && product.stock < item.quantity) {
          stockIssues.push(`${item.product?.name}: estoque insuficiente (${product.stock} disponível, ${item.quantity} solicitado)`);
        }
      }

      if (stockIssues.length > 0) {
        toast.error(`Estoque insuficiente:\n${stockIssues.join('\n')}`);
        return;
      }

      // Atualizar status do pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Atualizar estoque
      for (const item of order.order_items) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.product_id);

          if (stockError) throw stockError;
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

      toast.success('Pedido confirmado com sucesso!');
      await fetchOrders();
      await refetchProducts();
    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      toast.error('Erro ao confirmar pedido');
    }
  };

  // Cancelar pedido
  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Pedido cancelado');
      await fetchOrders();
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast.error('Erro ao cancelar pedido');
    }
  };

  // Abrir modal de edição
  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditingItems([...order.order_items]);
  };

  // Salvar edições
  const saveOrderEdits = async () => {
    if (!editingOrder) return;

    try {
      // Calcular novo total
      const newTotal = editingItems.reduce((sum, item) => sum + item.total_price, 0);

      // Atualizar pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({ total_amount: newTotal })
        .eq('id', editingOrder.id);

      if (orderError) throw orderError;

      // Deletar itens antigos
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', editingOrder.id);

      if (deleteError) throw deleteError;

      // Inserir novos itens
      const { error: insertError } = await supabase
        .from('order_items')
        .insert(
          editingItems.map(item => ({
            order_id: editingOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))
        );

      if (insertError) throw insertError;

      toast.success('Pedido atualizado com sucesso!');
      setEditingOrder(null);
      setEditingItems([]);
      await fetchOrders();
    } catch (error) {
      console.error('Erro ao salvar edições:', error);
      toast.error('Erro ao salvar edições');
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
    return matchesFilter && matchesSearch;
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            🛒 Pedidos
          </h1>
          <p className="text-muted-foreground">Gerencie os pedidos dos seus clientes</p>
        </div>
        <CreateTestOrder onOrderCreated={fetchOrders} />
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

      {/* Lista de Pedidos */}
      <div className="grid gap-6">
        {filteredOrders.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-400">
                {searchTerm || filter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Os pedidos dos clientes aparecerão aqui'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className={`shadow-lg border-l-4 ${
              order.status === 'pending' ? 'border-l-yellow-500' :
              order.status === 'confirmed' ? 'border-l-green-500' : 'border-l-red-500'
            }`}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">
                        {order.customer_name}
                      </CardTitle>
                      <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </div>
                      {order.customer_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {order.customer_phone}
                        </div>
                      )}
                      {order.customer_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {order.customer_email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {order.total_amount.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Pedido #{order.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Items do Pedido */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Itens do Pedido
                  </h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">{item.product?.name || 'Produto não encontrado'}</span>
                          <span className="text-gray-500 ml-2">x{item.quantity}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            R$ {item.total_price.toFixed(2).replace('.', ',')}
                          </div>
                          <div className="text-sm text-gray-500">
                            R$ {item.unit_price.toFixed(2).replace('.', ',')} cada
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                {order.status === 'pending' && (
                  <div className="flex flex-col lg:flex-row gap-3">
                    <Button
                      onClick={() => confirmOrder(order)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar Pedido
                    </Button>
                    <Button
                      onClick={() => openEditModal(order)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar Pedido
                    </Button>
                    <Button
                      onClick={() => cancelOrder(order.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
                              {product.name} - R$ {product.price.toFixed(2)} (Estoque: {product.stock})
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
                        R$ {item.total_price.toFixed(2)}
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
                Total: R$ {editingItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
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