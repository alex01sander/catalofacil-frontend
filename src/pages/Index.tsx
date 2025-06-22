
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import Header from "@/components/vitrine/Header";
import HeroBanner from "@/components/vitrine/HeroBanner";
import ProductGrid from "@/components/vitrine/ProductGrid";
import Footer from "@/components/vitrine/Footer";
import Cart from "@/components/vitrine/Cart";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const { user } = useAuth();
  const { settings: storeSettings, loading } = useStoreSettings();
  
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

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Mobile-first Layout */}
      <div className="block md:hidden">
        {/* Hero Section with Logo and Brand */}
        <section 
          className={`text-white px-4 py-8 rounded-b-3xl relative overflow-hidden ${
            storeSettings.mobile_banner_image 
              ? 'bg-white' 
              : `bg-gradient-to-br ${storeSettings.mobile_banner_color}`
          }`}
          style={storeSettings.mobile_banner_image ? {
            backgroundImage: `url('${storeSettings.mobile_banner_image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : {}}
        >
          {/* Background overlay when using image */}
          {storeSettings.mobile_banner_image && (
            <div className="absolute inset-0 bg-black/40"></div>
          )}
          
          {/* Background decoration for gradient */}
          {!storeSettings.mobile_banner_image && (
            <div className="absolute inset-0 bg-violet-600"></div>
          )}
          
          <div className="relative text-center">
            {/* Logo Circle */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full shadow-lg overflow-hidden border border-white/30">
                {storeSettings.mobile_logo && (
                  <img 
                    alt={`${storeSettings.store_name} Logo`} 
                    className="w-full h-full object-cover" 
                    src={storeSettings.mobile_logo} 
                  />
                )}
              </div>
            </div>
            
            {/* Store Name */}
            <h1 className="text-xl font-bold mb-2">
              {storeSettings.store_name}
            </h1>
            
            {/* Store Description */}
            <p className="text-sm text-white/90 mb-6 px-4 leading-relaxed whitespace-pre-line">
              {storeSettings.store_description}
            </p>
            
            {/* Auth/Admin Links */}
            <div className="flex justify-center gap-2 mb-4">
              {user ? (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    Admin
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Search Bar with Cart */}
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="O que você está procurando?" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 h-12 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-700 placeholder:text-gray-500" 
                />
              </div>
              <div className="backdrop-blur-sm rounded-lg p-2 bg-transparent">
                <Cart />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="px-4 py-6 bg-gray-50">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <div 
                key={category.id} 
                className="flex flex-col items-center cursor-pointer group flex-shrink-0" 
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className={`w-16 h-16 rounded-full overflow-hidden border-3 transition-all duration-200 shadow-sm ${
                  selectedCategory === category.id 
                    ? 'border-green-500 shadow-lg scale-105' 
                    : 'border-gray-200 group-hover:border-gray-300'
                }`}>
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                </div>
                <span className={`text-xs mt-2 font-medium transition-colors text-center min-w-[60px] ${
                  selectedCategory === category.id ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {category.name}
                </span>
              </div>
            ))}
          </div>
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
            {/* Search Bar with Cart */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Buscar produtos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Cart />
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
    </div>
  );
};

export default Index;
