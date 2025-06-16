
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/vitrine/Header";
import HeroBanner from "@/components/vitrine/HeroBanner";
import ProductGrid from "@/components/vitrine/ProductGrid";
import Footer from "@/components/vitrine/Footer";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroBanner />
      
      {/* Search and Filter Section */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {["todos", "eletrônicos", "roupas", "casa", "beleza"].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProductGrid searchTerm={searchTerm} selectedCategory={selectedCategory} />
      <Footer />
    </div>
  );
};

export default Index;
