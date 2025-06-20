
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShoppingBag, User, MapPin, CreditCard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface CheckoutFormProps {
  onBack: () => void;
}

const CheckoutForm = ({ onBack }: CheckoutFormProps) => {
  const { items, totalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'pix',
    deliveryMethod: 'delivery'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || (formData.deliveryMethod === 'delivery' && !formData.address)) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const orderSummary = items.map(item => 
      `• ${item.name} - Qtd: ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
    ).join('\n');

    const paymentMethodText = {
      pix: 'PIX',
      money: 'Dinheiro',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito'
    }[formData.paymentMethod];

    const deliveryMethodText = formData.deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada no Local';

    const message = `🛍️ *Novo Pedido*

👤 *Dados do Cliente:*
• Nome: ${formData.name}
• Telefone: ${formData.phone}
${formData.deliveryMethod === 'delivery' ? `• Endereço: ${formData.address}` : ''}

📋 *Itens do Pedido:*
${orderSummary}

💰 *Resumo Financeiro:*
• Total: R$ ${totalPrice.toFixed(2).replace('.', ',')}
• Forma de Pagamento: ${paymentMethodText}
• Forma de Entrega: ${deliveryMethodText}

📅 Data: ${new Date().toLocaleDateString('pt-BR')}
⏰ Horário: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}

Obrigado pela preferência! 😊`;

    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
    clearCart();
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-50 md:bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4 max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Finalizar Compra</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Resumo do Pedido */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="h-5 w-5 text-violet-600" />
              Resumo do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-violet-600">
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center p-4 bg-violet-50 rounded-lg">
                <span className="font-bold text-lg text-gray-900">Total:</span>
                <span className="font-bold text-xl text-violet-600">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Pessoais */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-violet-600" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forma de Entrega */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-violet-600" />
              Forma de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup 
              value={formData.deliveryMethod} 
              onValueChange={(value) => handleInputChange('deliveryMethod', value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="font-medium cursor-pointer">
                  🚚 Entrega no endereço
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="font-medium cursor-pointer">
                  🏪 Retirada no Local
                </Label>
              </div>
            </RadioGroup>
            
            {formData.deliveryMethod === 'delivery' && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Endereço Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Rua, número, bairro, cidade, CEP"
                  className="h-11"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forma de Pagamento */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-violet-600" />
              Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={formData.paymentMethod} 
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="font-medium cursor-pointer">
                  📱 PIX
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="money" id="money" />
                <Label htmlFor="money" className="font-medium cursor-pointer">
                  💵 Dinheiro
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="credit" id="credit" />
                <Label htmlFor="credit" className="font-medium cursor-pointer">
                  💳 Cartão de Crédito
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="debit" id="debit" />
                <Label htmlFor="debit" className="font-medium cursor-pointer">
                  💳 Cartão de Débito
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Botão de Finalizar */}
        <div className="sticky bottom-0 bg-white border-t p-4 -mx-4">
          <Button 
            className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700" 
            onClick={handleSubmit}
          >
            Confirmar Pedido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
