
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
      
      {/* Mobile-first Hero Banner - shorter on mobile */}
      <div className="block md:hidden">
        <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-3">
              Produtos Incríveis,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Preços Imbatíveis
              </span>
            </h1>
            <p className="text-sm mb-6 text-purple-100">
              SURPREENDA-SE! Faça seu pedido através do nosso catálogo virtual.
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
