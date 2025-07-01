import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from "lucide-react";
const Footer = () => {
  return <footer className="bg-gray-900 text-white">
      {/* Mobile Footer - Simplified */}
      <div className="block md:hidden py-4 px-4 text-center text-gray-400 text-sm">
        <p>© 2025 LinkStore. Todos os direitos reservados.</p>
      </div>

      {/* Desktop Footer - Full version */}
      <div className="hidden md:block">
        <div className="">
          

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 CataloFacil. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;