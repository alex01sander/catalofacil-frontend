import { MessageCircle } from "lucide-react";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";

const WhatsAppFloat = () => {
  const { settings } = useStoreSettings();

  const handleWhatsAppClick = () => {
    const phoneNumber = settings.whatsapp_number || "5511999999999";
    const message = "Olá! Gostaria de saber mais sobre os produtos da loja.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

export default WhatsAppFloat;
