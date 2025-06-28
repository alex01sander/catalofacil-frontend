import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Instagram, MessageCircle } from "lucide-react";

const HeroBanner = () => {
  const { settings } = useStoreSettings();

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os produtos da loja.")}`, "_blank");
  };

  const handleInstagramClick = () => {
    window.open(settings.instagram_url, "_blank");
  };

  return (
    <section className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white overflow-hidden min-h-[350px] md:min-h-[400px] flex items-center justify-center" style={{
      minHeight: 350,
      height: 400
    }}>
      {/* Background image */}
      {settings.desktop_banner && (
        <div 
          style={{
            backgroundImage: `url('${settings.desktop_banner}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%'
          }} 
          className="absolute inset-0 bg-center bg-no-repeat bg-gray-50" 
        />
      )}
      <div className="relative max-w-6xl w-full px-4 flex flex-col items-center justify-center z-10">
        {/* Logo Circle - igual ao mobile */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full shadow-lg overflow-hidden border border-white/30 flex items-center justify-center">
            {settings.mobile_logo && (
              <img 
                alt={`${settings.store_name} Logo`} 
                className="w-full h-full object-cover" 
                src={settings.mobile_logo} 
              />
            )}
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in drop-shadow-lg text-center">
          {settings.store_name}
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto whitespace-pre-line drop-shadow-md text-center">
          {settings.store_description}
        </p>
        <div className="flex justify-center items-center gap-6 mb-2">
          <div className="relative">
            <button 
              onClick={handleInstagramClick} 
              className="bg-white text-black p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-100" 
              aria-label="Seguir no Instagram" 
              type="button"
            >
              <Instagram className="h-6 w-6" />
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={handleWhatsAppClick} 
              aria-label="Contato via WhatsApp" 
              type="button" 
              className="p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-zinc-50 text-zinc-950"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
