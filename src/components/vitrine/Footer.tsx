import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from "lucide-react";
const Footer = () => {
  return <footer className="bg-gray-900 text-white">
      {/* Mobile Footer - Simplified */}
      <div className="block md:hidden py-4 px-4 text-center text-gray-400 text-sm">
        <p>© 2025 LinkStore. Todos os direitos reservados.</p>
      </div>

      {/* Desktop Footer - Full version */}
      <div className="hidden md:block">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">LinkStore</h3>
              <p className="text-gray-300">
                Sua loja online de confiança com os melhores produtos e atendimento excepcional.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <Instagram className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contato</h3>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>(11) 99999-9999</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>contato@linkstore.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>São Paulo, SP</span>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Horário de Funcionamento</h3>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <div>Seg - Sex: 9h às 18h</div>
                    <div>Sáb: 9h às 16h</div>
                    <div>Dom: Fechado</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Links Úteis</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Política de Privacidade
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Termos de Uso
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Trocas e Devoluções
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  FAQ
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LinkStore. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;