
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/4e76fa9e-adfb-440b-a373-b991de11248f.png" 
              alt="LinkStore Logo" 
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-gray-900">LinkStore</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Início
            </Link>
            <Link to="/categorias" className="text-gray-600 hover:text-gray-900 transition-colors">
              Categorias
            </Link>
            <Link to="/ofertas" className="text-gray-600 hover:text-gray-900 transition-colors">
              Ofertas
            </Link>
            <Link to="/contato" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contato
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
            <Cart />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
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
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
