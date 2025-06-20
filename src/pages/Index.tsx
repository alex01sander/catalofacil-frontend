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
  const categories = [{
    id: "todos",
    name: "Todos",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"
  }, {
    id: "eletrônicos",
    name: "Eletrônicos",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&h=80&fit=crop&crop=center"
  }, {
    id: "roupas",
    name: "Roupas",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop&crop=center"
  }, {
    id: "casa",
    name: "Casa",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=80&h=80&fit=crop&crop=center"
  }, {
    id: "beleza",
    name: "Beleza",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=80&h=80&fit=crop&crop=center"
  }];
  return <div className="min-h-screen bg-white">
      <Header />
      
      {/* Mobile-first Layout - Similar to reference image */}
      <div className="block md:hidden">
        {/* Hero Section with Logo and Brand */}
        <section className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white px-4 py-8 rounded-b-3xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-violet-600"></div>
          
          <div className="relative text-center">
            {/* Logo Circle */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center border border-white/30">
                <img src="/lovable-uploads/4e76fa9e-adfb-440b-a373-b991de11248f.png" alt="LinkStore Logo" className="w-10 h-10" />
              </div>
            </div>
            
            {/* Store Name */}
            <h1 className="text-xl font-bold mb-2">
              LinkStore
            </h1>
            
            {/* Store Description */}
            <p className="text-sm text-white/90 mb-6 px-4 leading-relaxed">
              Catálogo de todos os seus produtos<br />
              que você sempre desejou encontrar
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-sm mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="O que você está procurando?" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-700 placeholder:text-gray-500" />
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="px-4 py-6 bg-gray-50">
          <div className="grid grid-cols-5 gap-3">
            {categories.map(category => <div key={category.id} className="flex flex-col items-center cursor-pointer group" onClick={() => setSelectedCategory(category.id)}>
                <div className={`w-14 h-14 rounded-full overflow-hidden border-3 transition-all duration-200 shadow-sm ${selectedCategory === category.id ? 'border-green-500 shadow-lg scale-105' : 'border-gray-200 group-hover:border-gray-300'}`}>
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                </div>
                <span className={`text-xs mt-2 font-medium transition-colors text-center ${selectedCategory === category.id ? 'text-green-600' : 'text-gray-600'}`}>
                  {category.name}
                </span>
              </div>)}
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="mx-4 mb-6">
          
        </section>

        {/* Service Features */}
        <section className="px-4 pb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 text-sm">🚚</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">Entrega Rápida</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 text-sm">💳</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">Desconto no PIX</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 text-sm">🎁</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">Suporte 24h</p>
            </div>
          </div>
        </section>
      </div>

      {/* Desktop Hero Banner */}
      <div className="hidden md:block">
        <HeroBanner />
      </div>
      
      {/* Desktop Search and Filter Section */}
      <section className="hidden md:block py-4 md:py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Buscar produtos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            
            {/* Desktop Visual Categories */}
            <div className="flex justify-center gap-8">
              {categories.map(category => <div key={category.id} className="flex flex-col items-center cursor-pointer group" onClick={() => setSelectedCategory(category.id)}>
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-3 transition-all duration-200 ${selectedCategory === category.id ? 'border-purple-500 shadow-lg scale-105' : 'border-gray-200 group-hover:border-gray-300 group-hover:scale-105'}`}>
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm mt-3 font-medium transition-colors ${selectedCategory === category.id ? 'text-purple-600' : 'text-gray-700 group-hover:text-gray-900'}`}>
                    {category.name}
                  </span>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      <ProductGrid searchTerm={searchTerm} selectedCategory={selectedCategory} />
      <Footer />
    </div>;
};
export default Index;