import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProductForm from "./ProductForm";

// Database Product interface (matches database schema)
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category_id: string;
  stock: number;
  is_active: boolean;
  image: string;
  images: string[];
  categories?: {
    id: string;
    name: string;
  };
}

// Form Product interface (for ProductForm component)
interface FormProduct {
  id?: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  isActive: boolean;
  image: string;
  images: string[];
}

const ProductManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FormProduct | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from database
  const fetchProducts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar os produtos.",
          variant: "destructive",
        });
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Erro inesperado ao carregar produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.categories?.name && product.categories.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    // Map database product to form product interface
    const formProduct: FormProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category_id || "",
      stock: product.stock,
      isActive: product.is_active,
      image: product.image,
      images: product.images || []
    };
    setEditingProduct(formProduct);
    setShowForm(true);
  };

  const handleFormSubmit = async (productData: Omit<FormProduct, 'id'>) => {
    if (!user) return;

    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: productData.name,
            price: productData.price,
            description: productData.description,
            category_id: productData.category === 'todos' ? null : productData.category,
            stock: productData.stock,
            is_active: productData.isActive,
            image: productData.image,
            images: productData.images || [],
          })
          .eq('id', editingProduct.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating product:', error);
          toast({
            title: "Erro ao atualizar produto",
            description: "Não foi possível atualizar o produto.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Produto atualizado",
          description: "Produto atualizado com sucesso!",
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([{
            user_id: user.id,
            name: productData.name,
            price: productData.price,
            description: productData.description,
            category_id: productData.category === 'todos' ? null : productData.category,
            stock: productData.stock,
            is_active: productData.isActive,
            image: productData.image,
            images: productData.images || [],
          }]);

        if (error) {
          console.error('Error creating product:', error);
          toast({
            title: "Erro ao criar produto",
            description: "Não foi possível criar o produto.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Produto criado",
          description: "Novo produto adicionado com sucesso!",
        });
      }

      setShowForm(false);
      setEditingProduct(null);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado ao salvar produto.",
        variant: "destructive",
      });
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const toggleProductStatus = async (productId: string) => {
    if (!user) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating product status:', error);
        toast({
          title: "Erro ao atualizar status",
          description: "Não foi possível atualizar o status do produto.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Status atualizado",
        description: `Produto ${product.is_active ? 'desativado' : 'ativado'} com sucesso!`,
      });

      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado ao atualizar status.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (productId: string) => {
    setShowDeleteConfirm(productId);
  };

  const deleteProduct = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Erro ao remover produto",
          description: "Não foi possível remover o produto.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Produto removido",
        description: "Produto removido com sucesso!",
      });

      setShowDeleteConfirm(null);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado ao remover produto.",
        variant: "destructive",
      });
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
            <p className="text-gray-600">Gerencie seu catálogo de produtos</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando produtos...</p>
        </div>
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
                {products.filter(p => p.is_active).length}
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
                {products.filter(p => !p.is_active).length}
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
                          <Badge variant={product.is_active ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                            {product.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {product.categories?.name || "Sem categoria"}
                          </Badge>
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
                                {product.is_active ? (
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
                          <Badge variant="secondary">
                            {product.categories?.name || "Sem categoria"}
                          </Badge>
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
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Ativo" : "Inativo"}
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
                                {product.is_active ? (
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
