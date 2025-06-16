
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus } from "lucide-react";

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
  const handleWhatsAppClick = () => {
    const message = `Olá! Tenho interesse no produto: *${product.name}* - R$ ${product.price.toFixed(2).replace('.', ',')}`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {product.stock < 10 && (
          <Badge className="absolute top-2 right-2 bg-orange-500">
            Últimas unidades
          </Badge>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
            {product.description}
          </p>
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-purple-600">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-gray-500">
            {product.stock} em estoque
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ver mais
          </Button>
          <Button
            size="sm"
            onClick={handleWhatsAppClick}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Comprar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
