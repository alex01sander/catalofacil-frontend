
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Menu, X, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Cart from "./Cart";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Search className="h-5 w-5" />
            </Button>
            <Cart />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-bold text-purple-600">
            LinkStore
          </Link>
          
          <nav className="flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Início
            </Link>
            <Link to="/categorias" className="text-gray-600 hover:text-gray-900">
              Categorias
            </Link>
            <Link to="/ofertas" className="text-gray-600 hover:text-gray-900">
              Ofertas
            </Link>
            <Link to="/contato" className="text-gray-600 hover:text-gray-900">
              Contato
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
            <Cart />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="py-4 space-y-4">
              <Link 
                to="/" 
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Início
              </Link>
              <Link 
                to="/categorias" 
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categorias
              </Link>
              <Link 
                to="/ofertas" 
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ofertas
              </Link>
              <Link 
                to="/contato" 
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contato
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
