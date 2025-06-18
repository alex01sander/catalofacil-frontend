
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
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
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">Finalizar Compra</h2>
      </div>

      {/* Resumo do Pedido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <div className="flex-1">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-gray-500 ml-2">(x{item.quantity})</span>
              </div>
              <span className="font-semibold text-sm">
                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span className="text-purple-600">
                R$ {totalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Seu nome completo"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Forma de Entrega */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Forma de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={formData.deliveryMethod} 
            onValueChange={(value) => handleInputChange('deliveryMethod', value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery" className="font-medium">Entrega</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="font-medium">Retirada no Local</Label>
            </div>
          </RadioGroup>
          
          {formData.deliveryMethod === 'delivery' && (
            <div className="space-y-2 mt-4">
              <Label htmlFor="address" className="text-sm font-medium">Endereço Completo *</Label>
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.paymentMethod} 
            onValueChange={(value) => handleInputChange('paymentMethod', value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="font-medium">PIX</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="money" id="money" />
              <Label htmlFor="money" className="font-medium">Dinheiro</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="credit" id="credit" />
              <Label htmlFor="credit" className="font-medium">Cartão de Crédito</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="debit" id="debit" />
              <Label htmlFor="debit" className="font-medium">Cartão de Débito</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Button className="w-full h-12 text-base font-semibold" onClick={handleSubmit}>
        Confirmar Pedido
      </Button>
    </div>
  );
};

export default CheckoutForm;
