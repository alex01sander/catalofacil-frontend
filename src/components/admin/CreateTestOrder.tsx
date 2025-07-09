import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedProducts } from "@/hooks/useOptimizedProducts";
import { toast } from "sonner";

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name?: string;
}

const CreateTestOrder = ({ onOrderCreated }: { onOrderCreated: () => void }) => {
  const { user } = useAuth();
  const { products } = useOptimizedProducts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [orderData, setOrderData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
  });
  
  const [items, setItems] = useState<OrderItem[]>([{
    product_id: "",
    quantity: 1,
    unit_price: 0,
    total_price: 0
  }]);

  const addItem = () => {
    setItems([...items, {
      product_id: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.price;
        newItems[index].total_price = product.price * newItems[index].quantity;
        newItems[index].product_name = product.name;
      }
    } else if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const createOrder = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Validações
      if (!orderData.customer_name.trim()) {
        toast.error("Nome do cliente é obrigatório");
        return;
      }
      
      const validItems = items.filter(item => item.product_id && item.quantity > 0);
      if (validItems.length === 0) {
        toast.error("Adicione pelo menos um item ao pedido");
        return;
      }
      
      const totalAmount = validItems.reduce((sum, item) => sum + item.total_price, 0);
      
      // Buscar store_id do usuário
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email || null,
          customer_phone: orderData.customer_phone || null,
          total_amount: totalAmount,
          status: 'pending',
          store_id: storeData?.id || null,
          store_owner_id: user.id
        }])
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Criar itens do pedido
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          validItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))
        );
      
      if (itemsError) throw itemsError;
      
      toast.success("Pedido de teste criado com sucesso!");
      setOpen(false);
      setOrderData({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
      });
      setItems([{
        product_id: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0
      }]);
      onOrderCreated();
      
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error("Erro ao criar pedido de teste");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <TestTube className="h-4 w-4" />
          Criar Pedido de Teste
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Pedido de Teste</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Dados do Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nome do Cliente *</Label>
              <Input
                id="customer_name"
                value={orderData.customer_name}
                onChange={(e) => setOrderData({...orderData, customer_name: e.target.value})}
                placeholder="João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={orderData.customer_email}
                onChange={(e) => setOrderData({...orderData, customer_email: e.target.value})}
                placeholder="joao@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Telefone</Label>
              <Input
                id="customer_phone"
                value={orderData.customer_phone}
                onChange={(e) => setOrderData({...orderData, customer_phone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          
          {/* Itens do Pedido */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Itens do Pedido</h4>
              <Button onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Produto</Label>
                    <Select
                      value={item.product_id}
                      onValueChange={(value) => updateItem(index, 'product_id', value)}
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
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  
                  <div className="w-32 space-y-2">
                    <Label>Preço Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="w-32 space-y-2">
                    <Label>Total</Label>
                    <div className="h-10 flex items-center px-3 border rounded-md bg-gray-50">
                      R$ {item.total_price.toFixed(2)}
                    </div>
                  </div>
                  
                  {items.length > 1 && (
                    <Button
                      onClick={() => removeItem(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Total */}
          <div className="text-right">
            <div className="text-2xl font-bold">
              Total: R$ {items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
            </div>
          </div>
          
          {/* Botões */}
          <div className="flex gap-3">
            <Button 
              onClick={() => setOpen(false)} 
              variant="outline" 
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={createOrder} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Pedido"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTestOrder;