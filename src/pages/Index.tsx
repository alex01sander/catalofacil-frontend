import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useStore } from "@/contexts/StoreSettingsContext";
import { usePublicCategories } from "@/hooks/usePublicCategories";
import Header from "@/components/vitrine/Header";
import HeroBanner from "@/components/vitrine/HeroBanner";
import ProductGrid from "@/components/vitrine/ProductGrid";
import Footer from "@/components/vitrine/Footer";
import Cart from "@/components/vitrine/Cart";
import WhatsAppFloat from "@/components/vitrine/WhatsAppFloat";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const { store, loading: storeLoading, slug } = useStore();
  const { categories, loading: categoriesLoading } = usePublicCategories(slug);
  const loading = storeLoading || categoriesLoading;

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">
            Loja não encontrada.<br/>A URL não contém o identificador (slug) da loja.
          </p>
          <p className="mt-2 text-gray-500">
            Verifique se o endereço está correto ou acesse pelo link oficial da loja.
          </p>
        </div>
      </div>
    );
  }

  if (!store && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Loja não encontrada.</p>
          <p className="mt-2 text-gray-500">
            O identificador da loja informado não existe ou está incorreto.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando loja...</p>
        </div>
      </div>
    );
  }

  console.log('[Index] store:', store);
  console.log('[Index] categories:', categories);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroBanner />
      
      {/* Search and Filter Section */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6">
            {/* Search Bar with Cart */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Cart />
              </div>
            </div>
            
            {/* Categories */}
            <div className="flex justify-center gap-8 flex-wrap">
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => setSelectedCategory("todos")}
              >
                <div className={`w-20 h-20 rounded-full overflow-hidden border-3 transition-all duration-200 ${
                  selectedCategory === "todos" 
                    ? 'border-green-500 shadow-lg scale-105' 
                    : 'border-gray-200 group-hover:border-gray-300 group-hover:scale-105'
                }`}>
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                    TODOS
                  </div>
                </div>
                <span className={`text-sm mt-3 font-medium transition-colors ${
                  selectedCategory === "todos" 
                    ? 'text-green-600' 
                    : 'text-gray-700 group-hover:text-gray-900'
                }`}>
                  Todos
                </span>
              </div>
              
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-3 transition-all duration-200 ${
                    selectedCategory === category.id 
                      ? 'border-green-500 shadow-lg scale-105' 
                      : 'border-gray-200 group-hover:border-gray-300 group-hover:scale-105'
                  }`}>
                    <img
                      src={category.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className={`text-sm mt-3 font-medium transition-colors ${
                    selectedCategory === category.id 
                      ? 'text-green-600' 
                      : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProductGrid searchTerm={searchTerm} selectedCategory={selectedCategory} publicView={true} />
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Index;