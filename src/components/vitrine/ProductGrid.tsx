import React, { memo, useState } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { useOptimizedProducts } from "@/hooks/useOptimizedProducts";
import { Box } from "lucide-react";
interface ProductGridProps {
  searchTerm: string;
  selectedCategory: string;
}
const ProductGrid = memo(({
  searchTerm,
  selectedCategory
}: ProductGridProps) => {
  const {
    products,
    loading,
    error
  } = useOptimizedProducts({
    searchTerm,
    selectedCategory,
    publicView: true
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleViewDetails = product => {
    console.log('Ver detalhes do produto:', product.name);
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
            {Array.from({
            length: 8
          }).map((_, index) => <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>)}
          </div>
        </div>
      </section>;
  }
  if (error) {
    return <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">Erro ao carregar produtos. Tente novamente.</p>
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
  return <>
      <section className="px-4 bg-gray-50 py-px">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => <ProductCard key={product.id} product={product} onViewDetails={() => handleViewDetails(product)} />)}
          </div>
        </div>
      </section>

      {selectedProduct && <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={handleCloseModal} />}
    </>;
});
ProductGrid.displayName = 'ProductGrid';
export default ProductGrid;