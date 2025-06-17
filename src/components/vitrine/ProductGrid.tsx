
import { useState } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

// Dados expandidos dos produtos
const sampleProducts = [
  // Eletrônicos
  {
    id: 1,
    name: "Smartphone Galaxy Pro Max",
    price: 1299.99,
    description: "Smartphone premium com câmera de 108MP, tela AMOLED 6.7 polegadas e 5G",
    category: "eletrônicos",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop"
    ],
    stock: 15,
    isActive: true
  },
  {
    id: 2,
    name: "Fone de Ouvido Bluetooth Premium",
    price: 299.90,
    description: "Fone wireless com cancelamento de ruído ativo e bateria de 30h",
    category: "eletrônicos",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop"
    ],
    stock: 22,
    isActive: true
  },
  {
    id: 3,
    name: "Notebook Gaming Ultra",
    price: 3499.99,
    description: "Notebook gamer com RTX 4060, Intel i7 12ª geração, 16GB RAM, 512GB SSD",
    category: "eletrônicos",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=600&fit=crop"
    ],
    stock: 8,
    isActive: true
  },
  {
    id: 4,
    name: "Smart TV 55 4K OLED",
    price: 2199.99,
    description: "Smart TV 55 polegadas 4K OLED com HDR, Google TV e som Dolby Atmos",
    category: "eletrônicos",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=600&fit=crop"
    ],
    stock: 12,
    isActive: true
  },

  // Roupas
  {
    id: 5,
    name: "Camiseta Premium Cotton",
    price: 89.90,
    description: "Camiseta 100% algodão premium com estampa exclusiva e corte moderno",
    category: "roupas",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=600&h=600&fit=crop"
    ],
    stock: 35,
    isActive: true
  },
  {
    id: 6,
    name: "Jaqueta Jeans Vintage",
    price: 149.90,
    description: "Jaqueta jeans vintage com lavagem especial e detalhes únicos",
    category: "roupas",
    image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop"
    ],
    stock: 18,
    isActive: true
  },
  {
    id: 7,
    name: "Tênis Esportivo Pro",
    price: 299.90,
    description: "Tênis esportivo com tecnologia de amortecimento e design moderno",
    category: "roupas",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=600&fit=crop"
    ],
    stock: 28,
    isActive: true
  },
  {
    id: 8,
    name: "Vestido Floral Elegante",
    price: 199.90,
    description: "Vestido floral elegante ideal para ocasiões especiais",
    category: "roupas",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop"
    ],
    stock: 14,
    isActive: true
  },

  // Casa e Decoração
  {
    id: 9,
    name: "Sofá Moderno 3 Lugares",
    price: 2499.99,
    description: "Sofá moderno de 3 lugares em tecido premium, super confortável",
    category: "casa",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop"
    ],
    stock: 6,
    isActive: true
  },
  {
    id: 10,
    name: "Mesa de Centro Design",
    price: 899.90,
    description: "Mesa de centro com design moderno em madeira maciça",
    category: "casa",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop"
    ],
    stock: 10,
    isActive: true
  },
  {
    id: 11,
    name: "Luminária Pendente Moderna",
    price: 249.90,
    description: "Luminária pendente com design contemporâneo e LED integrado",
    category: "casa",
    image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=600&h=600&fit=crop"
    ],
    stock: 15,
    isActive: true
  },
  {
    id: 12,
    name: "Conjunto de Panelas Gourmet",
    price: 399.90,
    description: "Conjunto de panelas antiaderentes com 7 peças e cabos isolantes",
    category: "casa",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&h=600&fit=crop"
    ],
    stock: 20,
    isActive: true
  },

  // Beleza e Cuidados
  {
    id: 13,
    name: "Kit Skincare Completo",
    price: 149.90,
    description: "Kit completo para cuidados com a pele com 5 produtos essenciais",
    category: "beleza",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop"
    ],
    stock: 30,
    isActive: true
  },
  {
    id: 14,
    name: "Perfume Feminino Luxo",
    price: 199.90,
    description: "Perfume feminino importado com fragrância marcante e duradoura",
    category: "beleza",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&h=600&fit=crop"
    ],
    stock: 25,
    isActive: true
  },
  {
    id: 15,
    name: "Escova Alisadora Profissional",
    price: 89.90,
    description: "Escova alisadora com tecnologia íon e controle de temperatura",
    category: "beleza",
    image: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=600&h=600&fit=crop"
    ],
    stock: 18,
    isActive: true
  },
  {
    id: 16,
    name: "Kit Maquiagem Professional",
    price: 299.90,
    description: "Kit de maquiagem profissional com paleta de cores e pincéis",
    category: "beleza",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583952734374-571c3279d49c?w=600&h=600&fit=crop"
    ],
    stock: 12,
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
