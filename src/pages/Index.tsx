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
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const {
    store,
    loading: storeLoading,
    slug
  } = useStore();
  const {
    categories,
    loading: categoriesLoading
  } = usePublicCategories(slug);
  const loading = storeLoading || categoriesLoading;
  const handleWhatsAppClick = () => {
    const phoneNumber = store?.whatsapp_number || "5511999999999";
    const message = "Olá! Gostaria de saber mais sobre os produtos da loja.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  const handleInstagramClick = () => {
    window.open(store?.instagram_url || 'https://instagram.com/', '_blank');
  };
  if (!slug) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-red-600 text-lg font-semibold">Loja não encontrada.<br/>A URL não contém o identificador (slug) da loja.</p>
        <p className="mt-2 text-gray-500">Verifique se o endereço está correto ou acesse pelo link oficial da loja.</p>
      </div>
    </div>;
  }
  if (!store && !loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-red-600 text-lg font-semibold">Loja não encontrada.</p>
        <p className="mt-2 text-gray-500">O identificador da loja informado não existe ou está incorreto.</p>
      </div>
    </div>;
  }
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando loja...</p>
        </div>
      </div>;
  }
  console.log('[Index] store:', store);
  console.log('[Index] categories:', categories);
  return <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Mobile-first Layout */}
      <div className="block md:hidden">
        {/* Hero Section with Logo and Brand */}
        <section className={`text-white px-4 py-8 rounded-b-3xl relative overflow-hidden ${store?.banner_url ? 'bg-white' : `bg-gradient-to-br from-green-400 via-green-500 to-green-600`}`} style={store?.banner_url ? {
        backgroundImage: `url('${store.banner_url}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: 220
      } : {
        minHeight: 220
      }}>
          
          <div className="relative text-center">
            {/* Logo Circle */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full shadow-lg overflow-hidden border border-white/30">
                {store?.logo_url ? (
                  <img alt={`${store?.name || 'Logo da loja'}`} className="w-full h-full object-cover" src={store?.logo_url} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">Sem logo</div>
                )}
              </div>
            </div>
            
            {/* Store Name */}
            <h1 className="text-xl font-bold mb-2">
              {store?.name || 'Nome da loja não cadastrado'}
            </h1>
            
            {/* Store Description */}
            <p className="text-sm text-white/90 mb-6 px-4 leading-relaxed whitespace-pre-line">
              {store?.description || 'Descrição da loja não cadastrada.'}
            </p>
            
            {/* Instagram and WhatsApp Icons */}
            <div className="flex justify-center gap-4 mb-6">
              <button onClick={handleInstagramClick} className="bg-white text-black p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-100" aria-label="Seguir no Instagram">
                <FaInstagram size={24} />
              </button>
              
              <button onClick={handleWhatsAppClick} aria-label="Contato via WhatsApp" className="p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-zinc-50 text-zinc-950">
                <FaWhatsapp size={24} />
              </button>
            </div>
            
            {/* Search Bar with Cart */}
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="O que você está procurando?" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-700 placeholder:text-gray-500" />
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
            {categories.map(category => <div key={category.id} className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => setSelectedCategory(category.id)}>
                <div className={`w-16 h-16 rounded-full overflow-hidden border-3 transition-all duration-200 shadow-sm ${selectedCategory === category.id ? 'border-green-500 shadow-lg scale-105' : 'border-gray-200 group-hover:border-gray-300'}`}>
                  <img src={category.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"} alt={category.name} className="w-full h-full object-cover" />
                </div>
                <span className={`text-xs mt-2 font-medium transition-colors text-center min-w-[60px] ${selectedCategory === category.id ? 'text-green-600' : 'text-gray-600'}`}>
                  {category.name}
                </span>
              </div>)}
          </div>
        </section>

        {/* Service Features */}
        
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
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-3 transition-all duration-200 ${selectedCategory === category.id ? 'border-green-500 shadow-lg scale-105' : 'border-gray-200 group-hover:border-gray-300 group-hover:scale-105'}`}>
                    <img src={category.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"} alt={category.name} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm mt-3 font-medium transition-colors ${selectedCategory === category.id ? 'text-green-600' : 'text-gray-700 group-hover:text-gray-900'}`}>
                    {category.name}
                  </span>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      <ProductGrid searchTerm={searchTerm} selectedCategory={selectedCategory} />
      <Footer />
      
      <WhatsAppFloat />
    </div>;
};
export default Index;