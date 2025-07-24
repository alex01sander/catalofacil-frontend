import { useStore } from "@/contexts/StoreSettingsContext";
import { Instagram, MessageCircle } from "lucide-react";
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';

const HeroBanner = () => {
  const { store } = useStore();
  
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${store?.whatsapp_number}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os produtos da loja.")}` , "_blank");
  };
  const handleInstagramClick = () => {
    window.open(store?.instagram_url, "_blank");
  };
  return (
    <section className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white overflow-hidden min-h-[350px] md:min-h-[400px] flex flex-col items-center justify-center px-4" style={{
      minHeight: 350,
      height: 400
    }}>
      {/* Background image */}
      {store?.banner_url && (
        <div 
          style={{
            backgroundImage: `url('${store.banner_url}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%'
          }} 
          className="absolute inset-0 bg-center bg-no-repeat bg-gray-50" 
        />
      )}
      
      {/* Overlay escuro para melhor legibilidade */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Conteúdo */}
      <div className="relative z-10 text-center">
        {/* Logo Circle */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full shadow-lg overflow-hidden border border-white/30 flex items-center justify-center">
            {store?.logo_url ? (
              <img 
                alt={`${store?.name || 'Logo da loja'}`} 
                className="w-full h-full object-cover" 
                src={store?.logo_url} 
              />
            ) : (
              <div className="text-white/70 text-xs">Logo</div>
            )}
          </div>
        </div>
        
        {/* Store Name */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in drop-shadow-lg text-center">
          {store?.name || 'Nome da Loja'}
        </h1>
        
        {/* Store Description */}
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto whitespace-pre-line drop-shadow-md text-center">
          {store?.description || 'Descrição da loja'}
        </p>
        
        {/* Social Media Buttons */}
        <div className="flex justify-center items-center gap-6 mb-2">
          <div className="relative">
            <button 
              onClick={handleInstagramClick} 
              className="bg-white text-black p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-100" 
              aria-label="Seguir no Instagram" 
              type="button"
            >
              <FaInstagram size={24} />
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={handleWhatsAppClick} 
              aria-label="Contato via WhatsApp" 
              type="button" 
              className="p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-zinc-50 text-zinc-950"
            >
              <FaWhatsapp size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
export default HeroBanner;