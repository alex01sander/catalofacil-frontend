
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, Instagram, MessageCircle } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const HeroBanner = () => {
  const { settings } = useStoreSettings();

  const handleWhatsAppClick = () => {
    const phoneNumber = "5511999999999";
    const message = "Olá! Gostaria de saber mais sobre os produtos da loja.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/', '_blank');
  };

  return (
    <section className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white overflow-hidden">
      {/* Background image */}
      {settings.desktop_banner && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{
            backgroundImage: `url('${settings.desktop_banner}')`
          }} 
        />
      )}
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in drop-shadow-lg">
            {settings.store_name}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mt-2">
              Produtos Incríveis
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto whitespace-pre-line drop-shadow-md">
            {settings.store_description}
          </p>
          
          <div className="flex justify-center items-center gap-6">
            <button
              onClick={handleInstagramClick}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Seguir no Instagram"
            >
              <Instagram className="h-6 w-6" />
            </button>
            
            <button
              onClick={handleWhatsAppClick}
              className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Contato via WhatsApp"
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
