
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
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Categorias</h3>
              <div className="flex gap-2 flex-wrap">
                {["todos", "eletrônicos", "roupas", "casa", "beleza"].map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {["todos", "eletrônicos", "roupas", "casa", "beleza"].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
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
