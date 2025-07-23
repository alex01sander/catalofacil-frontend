import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Check, X, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from '@/services/api';
import { useAuth } from "@/contexts/AuthContext";
import ProductForm from "./ProductForm";
import { API_URL } from "@/constants/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/contexts/StoreSettingsContext";
import { useOptimizedProducts } from '@/hooks/useOptimizedProducts';

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
  const { store } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FormProduct | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  // Usar hook centralizado para produtos
  const { products, loading, error, refetch } = useOptimizedProducts();


  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
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
  console.log('[DEBUG handleFormSubmit] Dados recebidos do ProductForm:', productData);
    if (!user || !user.token || !store?.id) return;
    try {
      if (editingProduct) {
        console.log('[DEBUG handleFormSubmit] Enviando PUT para:', `${API_URL}/products/${editingProduct.id}`);
        const response = await api.put(`${API_URL}/products/${editingProduct.id}`, {
          store_id: store.id,
          name: productData.name,
          price: productData.price,
          description: productData.description,
          category_id: productData.category === 'todos' ? null : productData.category,
          stock: productData.stock,
          is_active: productData.isActive,
          image: productData.image,
          images: productData.images || [],
        });
        console.log('[DEBUG handleFormSubmit] Resposta PUT:', response);
        toast({ title: "Produto atualizado", description: "Produto atualizado com sucesso!" });
      } else {
        console.log('[DEBUG handleFormSubmit] Enviando POST para:', `${API_URL}/products`);
        const response = await api.post(`${API_URL}/products`, {
          store_id: store.id,
          user_id: user.id,
          name: productData.name,
          price: productData.price,
          description: productData.description,
          category_id: productData.category === 'todos' ? null : productData.category,
          stock: productData.stock,
          is_active: productData.isActive,
          image: productData.image,
          images: productData.images || [],
        });
        console.log('[DEBUG handleFormSubmit] Resposta POST:', response);
        toast({ title: "Produto criado", description: "Novo produto adicionado com sucesso!" });
      }
      setShowForm(false);
      setEditingProduct(null);
      if (typeof refetch === 'function') refetch();
      
    } catch (error: any) {
      // Log detalhado para qualquer erro, inclusive erros de rede, CORS ou resposta indefinida
      console.error('[DEBUG handleFormSubmit][CATCH] Erro ao salvar produto:', error);
      if (error?.response) {
        console.error('[DEBUG handleFormSubmit][CATCH] error.response:', error.response);
        console.error('[DEBUG handleFormSubmit][CATCH] error.response.data:', error.response.data);
      } else if (error?.request) {
        console.error('[DEBUG handleFormSubmit][CATCH] error.request:', error.request);
      } else {
        console.error('[DEBUG handleFormSubmit][CATCH] error.message:', error.message);
      }
      toast({ 
        title: "Erro inesperado", 
        description: error?.response?.data?.error || error?.message || "Erro inesperado ao salvar produto.", 
        variant: "destructive" 
      });
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const toggleProductStatus = async (productId: string) => {
    if (!user || !user.token) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    try {
      await api.put(`${API_URL}/products/${productId}`, { is_active: !product.is_active });
      toast({ title: "Status atualizado", description: "Status do produto atualizado com sucesso!" });
      
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({ title: "Erro ao atualizar status", description: "Não foi possível atualizar o status do produto.", variant: "destructive" });
    }
  };

  const confirmDelete = (productId: string) => {
    setShowDeleteConfirm(productId);
  };

  const deleteProduct = async (productId: string) => {
    if (!user || !user.token) return;
    try {
      await api.delete(`${API_URL}/products/${productId}`);
      toast({ title: "Produto removido", description: "Produto removido com sucesso!" });
      setShowDeleteConfirm(null);
      if (typeof refetch === 'function') refetch();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Erro ao remover produto", description: "Não foi possível remover o produto.", variant: "destructive" });
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Adicionar log antes do map de produtos
  console.log('Array de produtos para renderizar:', products);
  if (error) {
    return <div className="text-red-500">Erro ao carregar produtos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <div className="my-8">
          <ProductForm
            product={editingProduct || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            📦 Produtos
          </h1>
          <p className="text-muted-foreground">Gerencie seu catálogo com facilidade</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg"
          onClick={handleAddProduct}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="🔍 Buscar produtos por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">📦 Total de Produtos</p>
                <p className="text-2xl font-bold text-blue-600">{products.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">✅ Produtos Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.is_active).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">⚠️ Estoque Baixo</p>
                <p className="text-2xl font-bold text-orange-600">
                  {products.filter(p => p.stock < 10).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">❌ Inativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(p => !p.is_active).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
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
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={product.image || 'https://via.placeholder.com/100'}
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
                            R$ {Number(product.price || 0).toFixed(2).replace('.', ',')}
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
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.image || (product.images && product.images[0]) || '/img/no-image.png'}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={e => e.currentTarget.src = '/img/no-image.png'}
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
                          R$ {Number(product.price || 0).toFixed(2).replace('.', ',')}
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
