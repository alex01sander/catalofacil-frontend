
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

const HeroBanner = () => {
  return (
    <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: "url('/lovable-uploads/c43cdca8-1978-4d87-a0d8-4241b90270c6.png')"
        }}
      ></div>
      
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Produtos Incríveis,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Preços Imbatíveis
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-2xl mx-auto">
            Descubra nossa coleção exclusiva de produtos selecionados especialmente para você.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              className="bg-white text-purple-700 hover:bg-purple-50 px-8 py-3 text-lg font-semibold"
              onClick={() => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Produtos
              <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-purple-700 px-8 py-3 text-lg"
              onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre os produtos.', '_blank')}
            >
              Falar no WhatsApp
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 fill-white">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroBanner;
