
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
        {/* Mobile Header - apenas carrinho */}
        <div className="md:hidden flex items-center justify-end py-3">
          <Cart />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <Cart />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
