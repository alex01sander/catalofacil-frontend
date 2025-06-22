
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, MessageCircle } from "lucide-react";

const Footer = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "5511999999999";
    const message = "Olá! Gostaria de saber mais sobre os produtos da loja.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleInstagramClick = () => {
    const instagramUrl = "https://instagram.com/";
    window.open(instagramUrl, '_blank');
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Mobile Footer - Simplified with social icons */}
      <div className="block md:hidden py-6 px-4">
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={handleInstagramClick}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Seguir no Instagram"
          >
            <Instagram className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleWhatsAppClick}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Contato via WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
        
        <div className="text-center text-gray-400 text-sm">
          <p>© 2025 LinkStore. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Desktop Footer - Full version with social icons */}
      <div className="hidden md:block py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center gap-6 mb-8">
            <button
              onClick={handleInstagramClick}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Seguir no Instagram"
            >
              <Instagram className="h-6 w-6" />
            </button>
            
            <button
              onClick={handleWhatsAppClick}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Contato via WhatsApp"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LinkStore. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
