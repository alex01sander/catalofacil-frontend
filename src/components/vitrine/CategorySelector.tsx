
import React from "react";
import { usePublicCategories } from "@/hooks/usePublicCategories";

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const { categories, loading } = usePublicCategories();

  if (loading) {
    return (
      <section className="py-4 px-4 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-2"></div>
                <div className="w-12 h-3 bg-gray-200 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length <= 1) {
    return null;
  }

  return (
    <section className="py-4 px-4 bg-white border-b">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg transition-all ${
                selectedCategory === category.id
                  ? "bg-green-100 text-green-700"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-gray-200">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-medium text-center">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySelector;
