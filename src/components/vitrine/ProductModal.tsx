
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  gallery?: string[];
  images?: string[];
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
  const { addToCart } = useCart();
  const isMobile = useIsMobile();

  // Combinar images e gallery em uma única array
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : product.gallery && product.gallery.length > 0 
    ? product.gallery 
    : [product.image];

  const handleAddToCart = () => {
    // Adiciona a quantidade selecionada ao carrinho
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    onClose();
  };

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

    // Remove número fictício - cada usuário deve configurar seu próprio número
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const ProductContent = () => (
    <>
      <div className={`${isMobile ? 'space-y-4' : 'grid md:grid-cols-2 gap-8'}`}>
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className={`${isMobile ? 'aspect-[4/3]' : 'aspect-square'} rounded-lg overflow-hidden`}>
            <img
              src={allImages[selectedImage] || product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {allImages.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Galeria ({allImages.length} imagens)
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-green-600' : 'border-gray-200'
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
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category}
            </Badge>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap break-words text-sm">
                {product.description}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-green-600`}>
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
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
                R$ {(product.price * quantity).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Adicionar ao Carrinho
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
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] p-4 overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold break-words text-left">
              {product.name}
            </SheetTitle>
          </SheetHeader>
          <ProductContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold break-words">{product.name}</DialogTitle>
        </DialogHeader>
        <ProductContent />
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
