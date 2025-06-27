
import { useState } from "react";
import Header from "@/components/vitrine/Header";
import HeroBanner from "@/components/vitrine/HeroBanner";
import CategorySelector from "@/components/vitrine/CategorySelector";
import ProductGrid from "@/components/vitrine/ProductGrid";
import WhatsAppFloat from "@/components/vitrine/WhatsAppFloat";
import Footer from "@/components/vitrine/Footer";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <HeroBanner />
      <CategorySelector 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <ProductGrid 
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
      />
      <WhatsAppFloat />
      <Footer />
    </div>
  );
};

export default Index;
