
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/vitrine/Header";
import HeroBanner from "@/components/vitrine/HeroBanner";
import ProductGrid from "@/components/vitrine/ProductGrid";
import Footer from "@/components/vitrine/Footer";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const categories = [
    {
      id: "todos",
      name: "Todos",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"
    },
    {
      id: "eletrônicos", 
      name: "Eletrônicos",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&h=80&fit=crop&crop=center"
    },
    {
      id: "roupas",
      name: "Roupas", 
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop&crop=center"
    },
    {
      id: "casa",
      name: "Casa",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=80&h=80&fit=crop&crop=center"
    },
    {
      id: "beleza",
      name: "Beleza",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=80&h=80&fit=crop&crop=center"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Mobile-first Hero Banner - formato igual à imagem */}
      <div className="block md:hidden">
        <section className="bg-white py-8 px-4">
          <div className="text-center">
            {/* Logo centralizada em um círculo */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center">
                <img 
                  src="/lovable-uploads/4e76fa9e-adfb-440b-a373-b991de11248f.png" 
                  alt="LinkStore Logo" 
                  className="w-12 h-12"
                />
              </div>
            </div>
            
            {/* Nome da loja */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              LinkStore
            </h1>
            
            {/* Descrição do negócio */}
            <p className="text-sm text-gray-600 mb-6 px-4">
              Produtos incríveis com os melhores preços do mercado.<br />
              Entregas rápidas e atendimento personalizado.
            </p>
          </div>
        </section>
      </div>

      {/* Desktop Hero Banner */}
      <div className="hidden md:block">
        <HeroBanner />
      </div>
      
      {/* Search and Filter Section - Mobile optimized */}
      <section className="py-4 md:py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout */}
          <div className="block md:hidden space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            {/* Visual Category Selector */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-center">Categorias</h3>
              <div className="flex justify-center gap-4 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex flex-col items-center min-w-[70px] cursor-pointer"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className={`w-16 h-16 rounded-full overflow-hidden border-3 transition-all duration-200 ${
                      selectedCategory === category.id 
                        ? 'border-purple-500 shadow-lg scale-105' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-xs mt-2 font-medium transition-colors ${
                      selectedCategory === category.id 
                        ? 'text-purple-600' 
                        : 'text-gray-600'
                    }`}>
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Desktop Visual Categories */}
            <div className="flex justify-center gap-8">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-3 transition-all duration-200 ${
                    selectedCategory === category.id 
                      ? 'border-purple-500 shadow-lg scale-105' 
                      : 'border-gray-200 group-hover:border-gray-300 group-hover:scale-105'
                  }`}>
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className={`text-sm mt-3 font-medium transition-colors ${
                    selectedCategory === category.id 
                      ? 'text-purple-600' 
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

      <ProductGrid searchTerm={searchTerm} selectedCategory={selectedCategory} />
      <Footer />
    </div>
  );
};

export default Index;
