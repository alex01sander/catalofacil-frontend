import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useOptimizedCategories } from "@/hooks/useOptimizedCategories";
import Header from "@/components/vitrine/Header";
import HeroBanner from "@/components/vitrine/HeroBanner";
import ProductGrid from "@/components/vitrine/ProductGrid";
import Footer from "@/components/vitrine/Footer";
import Cart from "@/components/vitrine/Cart";
import WhatsAppFloat from "@/components/vitrine/WhatsAppFloat";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  
  const { settings: storeSettings, loading: settingsLoading } = useStoreSettings();
  const { categories, loading: categoriesLoading } = useOptimizedCategories();

  const loading = settingsLoading || categoriesLoading;

  const handleWhatsAppClick = () => {
    const phoneNumber = storeSettings.whatsapp_number || "5511999999999";
    const message = "Olá! Gostaria de saber mais sobre os produtos da loja.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleInstagramClick = () => {
    window.open(storeSettings.instagram_url || 'https://instagram.com/', '_blank');
  };
  
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
        <section className={`text-white px-4 py-8 rounded-b-3xl relative overflow-hidden ${storeSettings.mobile_banner_image ? 'bg-white' : `bg-gradient-to-br ${storeSettings.mobile_banner_color === 'verde' ? 'from-green-400 via-green-500 to-green-600' : 
          storeSettings.mobile_banner_color === 'roxo' ? 'from-purple-600 via-purple-700 to-purple-800' :
          storeSettings.mobile_banner_color === 'azul' ? 'from-blue-500 via-blue-600 to-blue-700' :
          storeSettings.mobile_banner_color === 'rosa' ? 'from-pink-500 via-pink-600 to-pink-700' :
          storeSettings.mobile_banner_color === 'laranja' ? 'from-orange-500 via-orange-600 to-orange-700' :
          storeSettings.mobile_banner_color === 'violeta' ? 'from-violet-600 via-violet-700 to-violet-800' :
          'from-green-400 via-green-500 to-green-600'}`}`} 
        style={storeSettings.mobile_banner_image ? {
          backgroundImage: `url('${storeSettings.mobile_banner_image}')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: 180,
          height: 180
        } : {}}>
          
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
            
            {/* Instagram and WhatsApp Icons */}
            <div className="flex justify-center gap-4 mb-6">
              <button 
                onClick={handleInstagramClick} 
                className="bg-white text-black p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-100" 
                aria-label="Seguir no Instagram"
              >
                {/* Ícone oficial Instagram */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 448 512" fill="currentColor"><path d="M224 202.7A53.3 53.3 0 1 0 277.3 256 53.38 53.38 0 0 0 224 202.7Zm124.71-41a54 54 0 0 0-30.22-30.22C293.19 120 256.6 118.4 224 118.4s-69.19 1.61-94.49 13.08a54 54 0 0 0-30.22 30.22C120 162.81 118.4 199.4 118.4 232s1.61 69.19 13.08 94.49a54 54 0 0 0 30.22 30.22C162.81 392 199.4 393.6 232 393.6s69.19-1.61 94.49-13.08a54 54 0 0 0 30.22-30.22C392 349.19 393.6 312.6 393.6 280s-1.61-69.19-13.08-94.49ZM224 338.6A82.6 82.6 0 1 1 306.6 256 82.68 82.68 0 0 1 224 338.6Zm85.4-148.6a19.2 19.2 0 1 1-19.2-19.2 19.2 19.2 0 0 1 19.2 19.2ZM398.8 80A80 80 0 0 0 368 51.2C341.19 32 299.6 32 224 32S106.81 32 80 51.2A80 80 0 0 0 51.2 80C32 106.81 32 148.4 32 224s0 117.19 19.2 144A80 80 0 0 0 80 460.8C106.81 480 148.4 480 224 480s117.19 0 144-19.2a80 80 0 0 0 28.8-28.8C480 405.19 480 363.6 480 288s0-117.19-19.2-144ZM224 416c-70.58 0-128-57.42-128-128s57.42-128 128-128 128 57.42 128 128-57.42 128-128 128Zm144-208a16 16 0 1 1-16-16 16 16 0 0 1 16 16Z"/></svg>
              </button>
              
              <button 
                onClick={handleWhatsAppClick} 
                aria-label="Contato via WhatsApp" 
                className="p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-zinc-50 text-zinc-950"
              >
                {/* Ícone oficial WhatsApp */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339-3.6 221.1-35.3 132.3 25.1c-88.8 60.4-120.5 178.3-61.1 267.1l-25.2 92.7c-3.5 12.8 8.4 24.7 21.2 21.2l92.7-25.2c88.8 59.4 206.7 27.7 267.1-61.1 60.4-88.8 28.7-206.7-61.1-267.1zM224 400c-39.8 0-77.2-15.5-105.3-43.7C90.5 334.2 80 320.6 80 304c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16h-16c-8.8 0-16-7.2-16-16 0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16h-16c-8.8 0-16-7.2-16-16 0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16h-16c-8.8 0-16-7.2-16-16 0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16h-16c-8.8 0-16-7.2-16-16 0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16h-16c-8.8 0-16-7.2-16-16 0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16h-16c-8.8 0-16-7.2-16-16 0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16h-16c-8.8 0-16-7.2-16-16 0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16h-16c-8.8 0-16-7.2-16-16 0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16 0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16 0-8.8-7.2-16-16-16z"/></svg>
              </button>
            </div>
            
            {/* Search Bar with Cart */}
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="O que você está procurando?" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            {categories.map((category) => (
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
                  <img 
                    src={category.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"} 
                    alt={category.name} 
                    className="w-full h-full object-cover" 
                  />
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
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 text-sm">🎁</span>
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

      <ProductGrid searchTerm={searchTerm} selectedCategory={selectedCategory} />
      <Footer />
      
      <WhatsAppFloat />
    </div>
  );
};

export default Index;
