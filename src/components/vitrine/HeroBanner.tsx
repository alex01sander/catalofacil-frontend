import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
const HeroBanner = () => {
  const {
    settings
  } = useStoreSettings();
  return <section className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white overflow-hidden">
      {/* Background image */}
      {settings.desktop_banner && <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url('${settings.desktop_banner}')`
    }} />}
      
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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white/90 text-gray-800 hover:bg-white hover:text-gray-900 px-8 py-3 text-lg font-semibold shadow-lg backdrop-blur-sm" onClick={() => document.getElementById('produtos')?.scrollIntoView({
            behavior: 'smooth'
          })}>
              Ver Produtos
              <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
            
            <Button variant="outline" size="lg" onClick={() => window.open('https://wa.me/?text=Olá! Gostaria de saber mais sobre os produtos.', '_blank')} className="border-white/70 hover:bg-white/10 hover:border-white px-8 py-3 text-lg backdrop-blur-sm text-zinc-950">
              Falar no WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroBanner;