import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Plus, Minus, Trash2, User, MapPin, CreditCard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { toast } from "sonner";
import { useStore } from "@/contexts/StoreSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import api from '@/services/api';
import { getStoreSlug } from "@/utils/getStoreSlug";

const Cart = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    totalItems,
    totalPrice,
    clearCart
  } = useCart();
  const { store, storeId } = useStore();
  const { user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'pix',
    deliveryMethod: 'delivery'
  });
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || formData.deliveryMethod === 'delivery' && !formData.address) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!storeId) {
      toast.error('Erro: ID da loja não encontrado. Tente recarregar a página.');
      console.error('[Cart] storeId não encontrado:', { store, storeId });
      return;
    }

    try {
      console.log('[Cart] Criando pedido com storeId:', storeId);
      console.log('[Cart] Dados da loja:', store);
      console.log('[Cart] store?.user_id:', store?.user_id);
      console.log('[Cart] store?.owner_id:', store?.owner_id);
      console.log('[Cart] store?.created_by:', store?.created_by);
      console.log('[Cart] user autenticado:', user);
      console.log('[Cart] Itens do carrinho:', items);
      
      // Montar payload conforme schema do Prisma
      // NOTA: payment_method NÃO é enviado aqui pois não existe na tabela 'orders'
      // O payment_method será usado apenas na tabela 'cash_flow' quando o pedido for processado
      const payload: any = {
        store_id: storeId, // ID da loja
        customer_name: formData.name,
        customer_phone: formData.phone,
        total_amount: totalPrice,
        status: 'pending',
        order_items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: Number(item.price), // Garantir que seja número
          total_price: Number(item.price) * item.quantity // Garantir que seja número
        }))
      };

      // Adicionar store_owner_id apenas se disponível nos dados da loja (não usar user.id temporário)
      let ownerId = store?.user_id || store?.owner_id || store?.created_by;
      
      // Se não temos o ownerId nos dados da loja, tentar buscar via storeSettings
      if (!ownerId) {
        try {
          console.log('[Cart] Tentando obter store_owner_id via storeSettings para store:', storeId);
          const storeSettingsRes = await api.get(`/storeSettings?store_id=${storeId}`);
          console.log('[Cart] Resposta storeSettings:', storeSettingsRes.data);
          
          // storeSettings retorna um array, acessar o primeiro item
          const storeSettings = Array.isArray(storeSettingsRes.data) ? storeSettingsRes.data[0] : storeSettingsRes.data;
          ownerId = storeSettings?.user_id || storeSettings?.owner_id;
          console.log('[Cart] Owner ID obtido via storeSettings:', ownerId);
        } catch (settingsError) {
          console.log('[Cart] Erro ao buscar storeSettings:', settingsError);
          
          // Fallback: tentar buscar pela API pública da loja
          try {
            const slug = getStoreSlug();
            console.log('[Cart] Tentando obter store_owner_id via API pública para slug:', slug);
            const publicStoreRes = await api.get(`/site/public/${slug}/owner`);
            console.log('[Cart] Resposta API pública:', publicStoreRes.data);
            ownerId = publicStoreRes.data?.owner_id || publicStoreRes.data?.user_id;
            console.log('[Cart] Owner ID obtido via API pública:', ownerId);
          } catch (publicError) {
            console.log('[Cart] Erro ao buscar owner via API pública:', publicError);
          }
        }
      }
      
      // Verificar se é um UUID válido e não é um ID temporário/genérico
      const isValidUUID = ownerId && ownerId !== 'user-id' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId);
      
      if (isValidUUID) {
        payload.store_owner_id = ownerId;
        console.log('[Cart] store_owner_id válido adicionado:', ownerId);
      } else {
        console.log('[Cart] Nenhum store_owner_id válido disponível - erro: campo obrigatório. OwnerId recebido:', ownerId);
        toast.error('Erro: Não foi possível identificar o proprietário da loja. Tente recarregar a página.');
        return;
      }

      // Campos opcionais
      if (formData.deliveryMethod === 'delivery' && formData.address) {
        payload.customer_address = formData.address;
      }

      console.log('[Cart] Payload do pedido:', JSON.stringify(payload, null, 2));

      // Enviar pedido - usar endpoint correto
      const { data: order } = await api.post('/pedidos', payload);
      
      console.log('[Cart] Pedido criado com sucesso:', order);
      // 2. WhatsApp
      // Garantir que o número está no formato internacional (apenas dígitos)
      const whatsappNumber = (store.whatsapp_number || "5511999999999").replace(/\D/g, "");
      const orderSummary = items.map(item => `• ${item.name} — Qtd: ${item.quantity} — R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`).join('\n');
      const paymentMethodText = {
        pix: 'PIX',
        money: 'Dinheiro',
        credit: 'Cartão de Crédito',
        debit: 'Cartão de Débito'
      }[formData.paymentMethod];
      const deliveryMethodText = formData.deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada no Local';
      const message =
        `*🛒 Novo Pedido #${order.id?.slice(0, 8) || ''}*\n\n` +
        `*👤 Dados do Cliente:*\n` +
        `• Nome: ${formData.name}\n` +
        `• Telefone: ${formData.phone}\n` +
        (formData.deliveryMethod === 'delivery' ? `• Endereço: ${formData.address}\n` : '') +
        `\n` +
        `*📦 Itens do Pedido:*\n` +
        `${orderSummary}\n\n` +
        `*💰 Resumo Financeiro:*\n` +
        `• Total: *R$ ${totalPrice.toFixed(2).replace('.', ',')}*\n` +
        `• Forma de Pagamento: ${paymentMethodText}\n` +
        `• Forma de Entrega: ${deliveryMethodText}\n` +
        `\n` +
        `*📅 Data:* ${new Date().toLocaleDateString('pt-BR')}\n` +
        `*⏰ Horário:* ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit',minute: '2-digit'})}\n` +
        `\n` +
        `_Obrigado pela preferência!_`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
      // 3. Sucesso
      setLastOrder({
        ...formData,
        items: [...items],
        total: totalPrice,
        paymentMethodText,
        deliveryMethodText,
        orderId: order.id
      });
      toast.success('Pedido criado com sucesso!');
      setShowThankYou(true);
      clearCart();
      setShowCheckoutForm(false);
    } catch (error: any) {
      console.error('[Cart] Erro ao criar pedido:', error);
      console.error('[Cart] error.response:', error.response);
      console.error('[Cart] error.response.data:', error.response?.data);
      
      // Expandir details se existir
      if (error.response?.data?.details) {
        console.error('[Cart] error.response.data.details:', error.response.data.details);
        console.error('[Cart] details expandido:', JSON.stringify(error.response.data.details, null, 2));
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Erro inesperado';
      toast.error(`Erro ao criar pedido: ${errorMessage}`);
    }
  };
  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="relative p-2 text-neutral-950 bg-zinc-50">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white">
                {totalItems}
              </Badge>}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
            <SheetTitle className="text-xl font-bold">
              {showCheckoutForm ? 'Finalizar Compra' : 'Carrinho de Compras'}
            </SheetTitle>
          </SheetHeader>
          
          {items.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
              <p className="text-gray-400 text-sm mt-2">Adicione produtos para continuar</p>
            </div> : <>
              {!showCheckoutForm ?
            // Visualização do Carrinho
            <>
                    <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
                      {items.map(item => <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
                            <p className="text-violet-600 font-bold text-lg">
                              R$ {Number(item.price || 0).toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>)}
                    </div>
                    
                    <div className="border-t pt-4 pb-6 px-6 space-y-4 bg-white flex-shrink-0">
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold text-violet-600">
                          R$ {totalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <Button className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700" onClick={() => setShowCheckoutForm(true)}>
                        Finalizar Compra
                      </Button>
                    </div>
                  </> :
            // Formulário de Checkout - Agora com scroll único
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
                    {/* Resumo do Pedido */}
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-violet-600" />
                        Resumo do Pedido
                      </h3>
                      <div className="space-y-2 mb-4">
                        {items.map(item => <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                              <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm text-violet-600">
                                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                          </div>)}
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center p-3 bg-violet-50 rounded-lg">
                          <span className="font-bold text-lg text-gray-900">Total:</span>
                          <span className="font-bold text-xl text-violet-600">
                            R$ {totalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dados Pessoais */}
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <User className="h-5 w-5 text-violet-600" />
                        Dados Pessoais
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Nome Completo <span className="text-red-500">*</span>
                          </Label>
                          <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Seu nome completo" className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                            Telefone <span className="text-red-500">*</span>
                          </Label>
                          <Input id="phone" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="(11) 99999-9999" className="h-11" />
                        </div>
                      </div>
                    </div>

                    {/* Forma de Entrega */}
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-violet-600" />
                        Forma de Entrega
                      </h3>
                      <RadioGroup value={formData.deliveryMethod} onValueChange={value => handleInputChange('deliveryMethod', value)} className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                          <RadioGroupItem value="delivery" id="delivery" />
                          <Label htmlFor="delivery" className="font-medium cursor-pointer">
                            🚚 Entrega no endereço
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <Label htmlFor="pickup" className="font-medium cursor-pointer">
                            🏪 Retirada no Local
                          </Label>
                        </div>
                      </RadioGroup>
                      
                      {formData.deliveryMethod === 'delivery' && <div className="space-y-2 mt-4">
                          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                            Endereço Completo <span className="text-red-500">*</span>
                          </Label>
                          <Input id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Rua, número, bairro, cidade, CEP" className="h-11" />
                        </div>}
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-violet-600" />
                        Forma de Pagamento
                      </h3>
                      <RadioGroup value={formData.paymentMethod} onValueChange={value => handleInputChange('paymentMethod', value)} className="grid grid-cols-1 gap-3">
                        <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                          <RadioGroupItem value="pix" id="pix" />
                          <Label htmlFor="pix" className="font-medium cursor-pointer">
                            📱 PIX
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                          <RadioGroupItem value="money" id="money" />
                          <Label htmlFor="money" className="font-medium cursor-pointer">
                            💵 Dinheiro
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                          <RadioGroupItem value="credit" id="credit" />
                          <Label htmlFor="credit" className="font-medium cursor-pointer">
                            💳 Cartão de Crédito
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                          <RadioGroupItem value="debit" id="debit" />
                          <Label htmlFor="debit" className="font-medium cursor-pointer">
                            💳 Cartão de Débito
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Botões de Ação - Agora dentro do scroll, após forma de pagamento */}
                    <div className="pt-6 pb-6 space-y-3">
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-12 text-base font-semibold" onClick={() => setShowCheckoutForm(false)}>
                          Voltar
                        </Button>
                        <Button className="flex-1 h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700" onClick={handleSubmit}>
                          Confirmar Pedido
                        </Button>
                      </div>
                    </div>
                  </div>}
              </>}
          </SheetContent>
        </Sheet>
        <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pedido realizado com sucesso! 🎉</DialogTitle>
              <DialogDescription>
                Obrigado pela sua compra, {lastOrder?.name}!<br />
                Confira abaixo os detalhes do seu pedido:
              </DialogDescription>
            </DialogHeader>
            {lastOrder && (
              <div className="space-y-2 text-sm">
                <div><b>Nome:</b> {lastOrder.name}</div>
                <div><b>Telefone:</b> {lastOrder.phone}</div>
                {lastOrder.deliveryMethod === 'delivery' && (
                  <div><b>Endereço:</b> {lastOrder.address}</div>
                )}
                <div><b>Forma de Entrega:</b> {lastOrder.deliveryMethodText}</div>
                <div><b>Forma de Pagamento:</b> {lastOrder.paymentMethodText}</div>
                <div className="pt-2"><b>Itens:</b>
                  <ul className="list-disc ml-5">
                    {lastOrder.items.map((item: any) => (
                      <li key={item.id}>{item.name} (Qtd: {item.quantity}) - R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2"><b>Total:</b> R$ {lastOrder.total.toFixed(2).replace('.', ',')}</div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
};
export default Cart;