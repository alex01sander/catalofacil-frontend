
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "./ProductForm";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  isActive: boolean;
  image: string;
}

const ProductManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Dados de exemplo dos produtos
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Smartphone Galaxy Pro",
      price: 1299.99,
      description: "Smartphone premium com câmera profissional",
      category: "Eletrônicos",
      stock: 15,
      isActive: true,
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop"
    },
    {
      id: 2,
      name: "Camiseta Premium Cotton",
      price: 89.90,
      description: "Camiseta 100% algodão premium",
      category: "Roupas",
      stock: 25,
      isActive: true,
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=100&h=100&fit=crop"
    },
    {
      id: 3,
      name: "Sofá Moderno 3 Lugares",
      price: 2499.99,
      description: "Sofá confortável para sala de estar",
      category: "Casa",
      stock: 8,
      isActive: false,
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=100&h=100&fit=crop"
    },
    {
      id: 4,
      name: "Kit Skincare Completo",
      price: 149.90,
      description: "Kit completo para cuidados com a pele",
      category: "Beleza",
      stock: 2,
      isActive: true,
      image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=100&h=100&fit=crop"
    }
  ]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormSubmit = (productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      // Editando produto existente
      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id 
          ? { ...productData, id: editingProduct.id }
          : product
      ));
      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso!",
      });
    } else {
      // Adicionando novo produto
      const newProduct = {
        ...productData,
        id: Math.max(...products.map(p => p.id)) + 1
      };
      setProducts(prev => [...prev, newProduct]);
      toast({
        title: "Produto criado",
        description: "Novo produto adicionado com sucesso!",
      });
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const toggleProductStatus = (productId: number) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, isActive: !product.isActive }
        : product
    ));
    
    const product = products.find(p => p.id === productId);
    toast({
      title: "Status atualizado",
      description: `Produto ${product?.isActive ? 'desativado' : 'ativado'} com sucesso!`,
    });
  };

  const deleteProduct = (productId: number) => {
    setProducts(prev => prev.filter(product => product.id !== productId));
    toast({
      title: "Produto removido",
      description: "Produto removido com sucesso!",
    });
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <ProductForm
          product={editingProduct || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie seu catálogo de produtos</p>
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={handleAddProduct}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-sm text-gray-600">Total de Produtos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.isActive).length}
              </p>
              <p className="text-sm text-gray-600">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.stock < 10).length}
              </p>
              <p className="text-sm text-gray-600">Estoque Baixo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {products.filter(p => !p.isActive).length}
              </p>
              <p className="text-sm text-gray-600">Inativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Produto</th>
                  <th className="text-left p-3">Categoria</th>
                  <th className="text-left p-3">Preço</th>
                  <th className="text-left p-3">Estoque</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="p-3 font-semibold">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-3">
                      <span className={`${product.stock < 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {product.stock} unidades
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleProductStatus(product.id)}
                        >
                          {product.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;
