
import { MessageCircle, Instagram } from "lucide-react";

const WhatsAppFloat = () => {
  const handleWhatsAppClick = () => {
    // Número padrão - pode ser configurado depois nas configurações da loja
    const phoneNumber = "5511999999999";
    const message = "Olá! Gostaria de saber mais sobre os produtos da loja.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleInstagramClick = () => {
    // Instagram padrão - pode ser configurado depois nas configurações da loja
    const instagramUrl = "https://instagram.com/";
    window.open(instagramUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Instagram Button */}
      <button
        onClick={handleInstagramClick}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 animate-pulse"
        aria-label="Seguir no Instagram"
      >
        <Instagram className="h-6 w-6" />
      </button>
      
      {/* WhatsApp Button */}
      <button
        onClick={handleWhatsAppClick}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 animate-pulse"
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default WhatsAppFloat;
