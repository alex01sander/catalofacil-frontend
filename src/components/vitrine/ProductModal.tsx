import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category_id: string | null;
  image: string;
  images: string[];
  stock: number;
  is_active: boolean;
  user_id: string;
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

  // Garantir que o estoque seja sempre um número válido
  const stock = typeof product.stock === 'number' ? product.stock : 0;
  const price = typeof product.price === 'number' ? product.price : 0;

  // Resetar quantidade quando o modal abrir ou produto mudar
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedImage(0);
    }
  }, [isOpen, product.id]);

  // Combinar images em uma única array
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  const handleAddToCart = () => {
    // Validar quantidade antes de adicionar
    if (quantity <= 0 || quantity > stock) {
      console.error('Quantidade inválida:', quantity);
      return;
    }

    // Adicionar a quantidade selecionada ao carrinho
    addToCart(product, quantity);
    onClose();
  };

  const handleQuantityChange = (newQuantity: number) => {
    // Garantir que a quantidade seja sempre um número válido
    const validQuantity = Math.max(1, Math.min(stock, newQuantity));
    setQuantity(validQuantity);
  };

  const ProductContent = () => (
    <>
      <div className={`${isMobile ? 'space-y-4' : 'grid md:grid-cols-2 gap-8'}`}>
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-white flex items-center justify-center">
            <img
              src={allImages[selectedImage] || product.image || '/img/no-image.png'}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={e => e.currentTarget.src = '/img/no-image.png'}
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
              Produto
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
                R$ {price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-sm text-gray-500">
                {stock} em estoque
              </span>
            </div>
            
            {stock < 10 && stock > 0 && (
              <Badge className="bg-orange-500">
                Últimas unidades disponíveis!
              </Badge>
            )}

            {stock === 0 && (
              <Badge className="bg-red-500">
                Fora de estoque
              </Badge>
            )}
          </div>

          {/* Quantity Selector */}
          {stock > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Quantidade:
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
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
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= stock}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Total Price */}
          {stock > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
                  R$ {(price * quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              onClick={handleAddToCart}
              disabled={stock === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {stock === 0 ? 'Fora de Estoque' : 'Adicionar ao Carrinho'}
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
