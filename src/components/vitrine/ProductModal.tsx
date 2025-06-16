
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  gallery: string[];
  stock: number;
}

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal = ({ product, isOpen, onClose }: ProductModalProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const handleWhatsAppClick = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const orderNumber = Math.floor(Math.random() * 10000);
    const subtotal = product.price * quantity;
    
    const message = `🛍️ *Novo Pedido*

📋 *Detalhes do Pedido:*
• Produto: ${product.name}
• Preço Unitário: R$ ${product.price.toFixed(2).replace('.', ',')}
• Quantidade: ${quantity}
• Categoria: ${product.category}
• Descrição: ${product.description}

💰 *Resumo Financeiro:*
• Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}
• Taxa de Entrega: A combinar
• Pagamento: A combinar
• *Total: R$ ${subtotal.toFixed(2).replace('.', ',')}*

📅 Data: ${currentDate}
⏰ Horário: ${currentTime}
📝 Pedido: #${orderNumber}

📍 *Endereço para entrega:*
(Aguardando informação do cliente)

🎯 *Próximos Passos:*
Por favor, me informe:
• Seu endereço completo para entrega
• Forma de pagamento (PIX, Cartão, Dinheiro)
• Observações especiais ou preferências

Muito obrigado pela preferência! Vamos finalizar seu pedido. 😊`;

    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden">
              <img
                src={product.gallery[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {product.gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.gallery.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-purple-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-purple-600">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm text-gray-500">
                  {product.stock} em estoque
                </span>
              </div>
              
              {product.stock < 10 && (
                <Badge className="bg-orange-500">
                  Últimas unidades disponíveis!
                </Badge>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Quantidade:
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 border rounded text-center min-w-[60px]">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-2xl font-bold text-purple-600">
                  R$ {(product.price * quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                onClick={handleWhatsAppClick}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Fazer Pedido pelo WhatsApp
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Continuar Navegando
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
