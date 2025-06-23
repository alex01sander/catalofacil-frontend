import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Instagram, MessageCircle } from "lucide-react";

const HeroBanner = () => {
  const { settings } = useStoreSettings();

  const handleWhatsAppClick = () => {
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(
        "Olá! Gostaria de saber mais sobre os produtos da loja."
      )}`,
      "_blank"
    );
  };

  const handleInstagramClick = () => {
    window.open(settings.instagram_url, "_blank");
  };

  return (
    <section className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white overflow-hidden">
      {/* Background image */}
      {settings.desktop_banner && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${settings.desktop_banner}')` }}
        />
      )}
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in drop-shadow-lg">
            {settings.store_name}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mt-2">
              {settings.store_subtitle}
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto whitespace-pre-line drop-shadow-md">
            {settings.store_description}
          </p>
          <div className="flex justify-center items-center gap-6">
            <div className="relative">
              <button
                onClick={handleInstagramClick}
                className="bg-white text-black p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-100"
                aria-label="Seguir no Instagram"
                type="button"
              >
                <Instagram className="h-6 w-6" />
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs">
                {settings.instagram_url.replace(/^https?:\/\//, "")}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={handleWhatsAppClick}
                className="bg-black text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-800"
                aria-label="Contato via WhatsApp"
                type="button"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs">
                {settings.whatsapp_number}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
