
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  onViewDetails: () => void;
}

const ProductCard = ({ product, onViewDetails }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-32 md:h-48 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {product.stock < 10 && (
          <Badge className="absolute top-1 right-1 md:top-2 md:right-2 bg-orange-500 text-xs">
            Últimas
          </Badge>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      
      <CardContent className="p-2 md:p-4">
        <div className="mb-2 md:mb-3">
          <h3 className="font-semibold text-sm md:text-lg text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-xs md:text-sm line-clamp-1 md:line-clamp-2 mb-1 md:mb-2">
            {product.description}
          </p>
        </div>

        <div className="mb-3 md:mb-4">
          <span className="text-lg md:text-2xl font-bold text-purple-600">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Mobile: Stack buttons vertically, Desktop: Side by side */}
        <div className="space-y-1 md:space-y-0 md:flex md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="w-full md:flex-1 text-xs md:text-sm h-8 md:h-9"
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Ver mais
          </Button>
          <Button
            size="sm"
            onClick={handleAddToCart}
            className="w-full md:flex-1 bg-purple-600 hover:bg-purple-700 text-xs md:text-sm h-8 md:h-9"
          >
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Comprar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
