
import { useState } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

// Dados de exemplo dos produtos
const sampleProducts = [
  {
    id: 1,
    name: "Smartphone Galaxy Pro",
    price: 1299.99,
    description: "Smartphone com câmera de 108MP, tela AMOLED e 5G",
    category: "eletrônicos",
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&h=600&fit=crop"
    ],
    stock: 15,
    isActive: true
  },
  {
    id: 2,
    name: "Camiseta Premium Cotton",
    price: 89.90,
    description: "Camiseta 100% algodão com estampa exclusiva",
    category: "roupas",
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=600&h=600&fit=crop"
    ],
    stock: 25,
    isActive: true
  },
  {
    id: 3,
    name: "Sofá Moderno 3 Lugares",
    price: 2499.99,
    description: "Sofá confortável ideal para sala de estar",
    category: "casa",
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&h=600&fit=crop"
    ],
    stock: 8,
    isActive: true
  },
  {
    id: 4,
    name: "Kit Skincare Completo",
    price: 149.90,
    description: "Kit completo para cuidados com a pele",
    category: "beleza",
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=600&h=600&fit=crop"
    ],
    stock: 30,
    isActive: true
  }
];

interface ProductGridProps {
  searchTerm: string;
  selectedCategory: string;
}

const ProductGrid = ({ searchTerm, selectedCategory }: ProductGridProps) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const filteredProducts = sampleProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "todos" || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory && product.isActive;
  });

  return (
    <>
      <section id="produtos" className="py-8 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Mobile-first title */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
              PRODUTOS EM DESTAQUE
            </h2>
            <p className="text-gray-600 text-sm md:text-lg max-w-2xl mx-auto">
              Descubra nossa seleção cuidadosa de produtos de alta qualidade
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhum produto encontrado para sua busca.
              </p>
            </div>
          ) : (
            /* Mobile: 2 columns, Desktop: 3-4 columns */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

export default ProductGrid;
