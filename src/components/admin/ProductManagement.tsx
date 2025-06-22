
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Check, X } from "lucide-react";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  // Lista vazia de produtos - usuários irão adicionar seus próprios produtos
  const [products, setProducts] = useState<Product[]>([]);

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
      const newProduct = {
        ...productData,
        id: Math.max(0, ...products.map(p => p.id)) + 1
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

  const confirmDelete = (productId: number) => {
    setShowDeleteConfirm(productId);
  };

  const deleteProduct = (productId: number) => {
    setProducts(prev => prev.filter(product => product.id !== productId));
    setShowDeleteConfirm(null);
    toast({
      title: "Produto removido",
      description: "Produto removido com sucesso!",
    });
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Total de Produtos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {products.filter(p => p.isActive).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-orange-600">
                {products.filter(p => p.stock < 10).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Estoque Baixo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-red-600">
                {products.filter(p => !p.isActive).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Inativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
              <p className="text-sm mb-4">Comece adicionando seu primeiro produto à loja</p>
              <Button onClick={handleAddProduct} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Produto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Product Cards */}
          <div className="block md:hidden">
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                          <Badge variant={product.isActive ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                            {product.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                          <span className="font-bold text-green-600">
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-sm ${product.stock < 10 ? 'text-orange-600' : 'text-gray-600'}`}>
                            {product.stock} unidades
                          </span>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          {showDeleteConfirm === product.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelDelete}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
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
                                onClick={() => confirmDelete(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Desktop Table - Hidden on Mobile */}
          <Card className="hidden md:block">
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
                          {showDeleteConfirm === product.id ? (
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelDelete}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
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
                                onClick={() => confirmDelete(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProductManagement;
