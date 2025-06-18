import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Menu, X, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Cart from "./Cart";
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        

        {/* Mobile Menu */}
        {isMobileMenuOpen && <div className="md:hidden border-t bg-white">
            <div className="py-4 space-y-4">
              <Link to="/" className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>
                Início
              </Link>
              <Link to="/categorias" className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>
                Categorias
              </Link>
              <Link to="/ofertas" className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>
                Ofertas
              </Link>
              <Link to="/contato" className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>
                Contato
              </Link>
              <div className="flex items-center justify-around pt-4 border-t">
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
                <Cart />
              </div>
            </div>
          </div>}
      </div>
    </header>;
};
export default Header;