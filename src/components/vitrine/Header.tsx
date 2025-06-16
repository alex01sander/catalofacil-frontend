
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Minha Loja</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-purple-600 transition-colors">
              Início
            </Link>
            <Link to="/produtos" className="text-gray-600 hover:text-purple-600 transition-colors">
              Produtos
            </Link>
            <Link to="/sobre" className="text-gray-600 hover:text-purple-600 transition-colors">
              Sobre
            </Link>
            <Link to="/contato" className="text-gray-600 hover:text-purple-600 transition-colors">
              Contato
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin">
                <User className="h-4 w-4 mr-2" />
                Admin
              </Link>
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Vi seus produtos no catálogo e gostaria de saber mais.', '_blank')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="space-y-2">
              <Link to="/" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors">
                Início
              </Link>
              <Link to="/produtos" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors">
                Produtos
              </Link>
              <Link to="/sobre" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors">
                Sobre
              </Link>
              <Link to="/contato" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors">
                Contato
              </Link>
              <div className="flex flex-col gap-2 px-3 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">
                    <User className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-600 to-purple-700"
                  onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Vi seus produtos no catálogo e gostaria de saber mais.', '_blank')}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
