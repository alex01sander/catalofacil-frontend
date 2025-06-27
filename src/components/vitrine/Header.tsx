import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Menu, X, Search } from "lucide-react";
import { Link } from "react-router-dom";
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header vazio - carrinho movido para dentro das seções de busca */}
        
      </div>
    </header>;
};
export default Header;