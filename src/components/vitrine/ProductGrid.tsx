import React, { memo, useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { Box } from "lucide-react";
import axios from "axios";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { useStore } from "@/contexts/StoreSettingsContext";

interface ProductGridProps {
  searchTerm: string;
  selectedCategory: string;
}

const ProductGrid = memo(({ searchTerm, selectedCategory, publicView = false }: ProductGridProps & { publicView?: boolean }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Novo: hook para produtos públicos
  const { slug } = useStore();
  const { products: publicProducts, loading: publicLoading } = usePublicProducts(slug);

  useEffect(() => {
    if (publicView) {
      setLoading(publicLoading);
      setProducts(publicProducts);
      setError(null);
      return;
    }
    // Aqui você pode manter a lógica autenticada se necessário
    // Exemplo:
    // setLoading(true);
    // setError(null);
    // api.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } }) ...
  }, [searchTerm, selectedCategory, publicView, publicProducts, publicLoading]);

  const handleViewDetails = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };
  if (loading) {
    return <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>;
  }
  if (error) {
    return <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">{error}</p>
        </div>
      </section>;
  }
  if (products.length === 0) {
    return <section className="py-8 px-4 min-h-[40vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-6xl mx-auto text-center flex flex-col items-center justify-center gap-4">
          <Box className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-600 text-lg font-medium">
            {searchTerm ? 'Nenhum produto encontrado para sua pesquisa.' : 'Nenhum produto disponível nesta loja.'}
          </p>
        </div>
      </section>;
  }

  // Filtrar produtos por categoria, termo de busca, estoque e status ativo
  const filteredProducts = products.filter(product => {
    // Verificar diferentes possíveis campos de categoria
    const categoryId = product.categories?.id || product.category_id || product.category;
    
    // Filtro por categoria
    const matchesCategory = selectedCategory === 'todos' || 
                           categoryId === selectedCategory ||
                           categoryId?.toString() === selectedCategory?.toString();
    
    // Filtro por termo de busca
    const matchesSearch = !searchTerm || 
                         product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por estoque e ativo (apenas se os campos existirem)
    const hasStock = product.stock !== undefined ? product.stock > 0 : true;
    const isActive = product.is_active !== undefined ? product.is_active === true : true;
    
    return matchesCategory && matchesSearch && hasStock && isActive;
  });

  console.log('[ProductGrid] Produtos filtrados:', filteredProducts);
  console.log('[ProductGrid] Quantidade de produtos filtrados:', filteredProducts.length);

  return <>
      <section className="px-4 bg-gray-50 py-px">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                onViewDetails={() => handleViewDetails(product)}
              />
            ))}
          </div>
        </div>
      </section>

      {selectedProduct && <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={handleCloseModal} />}
    </>;
});
ProductGrid.displayName = 'ProductGrid';
export default ProductGrid;