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
import { useOptimizedCategories } from '@/hooks/useOptimizedCategories';

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
  const { user, token } = useAuth();
  const { store, loading: storeLoading, storeId } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FormProduct | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  // Usar hook centralizado para produtos
  const { products, loading, error, refetch } = useOptimizedProducts();
  const { categories } = useOptimizedCategories();
  
  // Função para obter o nome da categoria
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sem categoria";
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || "Sem categoria";
  };
  
  // Log para debug do store
  useEffect(() => {
    console.log('[ProductManagement] Store:', store);
    console.log('[ProductManagement] Store ID:', store?.id);
    console.log('[ProductManagement] storeId do contexto:', storeId);
  }, [store, storeId]);


  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    console.log('[DEBUG] Botão editar clicado para produto:', product);
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
    console.log('[DEBUG] handleFormSubmit chamado', { editingProduct, productData });
    console.log('[DEBUG handleFormSubmit] Dados recebidos do ProductForm:', productData);
    console.log('[DEBUG handleFormSubmit] user:', user);
    console.log('[DEBUG handleFormSubmit] token:', token);
    console.log('[DEBUG handleFormSubmit] store completo:', store);
    console.log('[DEBUG handleFormSubmit] store.id:', store?.id);
    console.log('[DEBUG handleFormSubmit] storeId do contexto:', storeId);
    
    // Verificar todas as possíveis localizações do ID da loja
    const effectiveStoreId = storeId || 
                           store?.id || 
                           store?.store_id || 
                           (store?.store && store.store.id) || 
                           (store?.settings && store.settings.store_id) || 
                           (store?.store_settings && store.store_settings.store_id) || 
                           (store?.store_settings && store.store_settings.id);
    
    console.log('[DEBUG handleFormSubmit] effectiveStoreId:', effectiveStoreId);
    
    // Verificação adicional para encontrar o ID da loja
    if (!effectiveStoreId && store) {
      console.log('[DEBUG handleFormSubmit] Tentando encontrar ID da loja em propriedades aninhadas:');
      console.log('- store:', store);
      
      // Verificar todas as propriedades do objeto store
      Object.keys(store).forEach(key => {
        console.log(`- Propriedade ${key}:`, store[key]);
        if (typeof store[key] === 'object' && store[key] !== null) {
          console.log(`  - Subpropriedades de ${key}:`, Object.keys(store[key]));
        }
      });
    }
    
    if (!user || !token) {
      console.warn('[DEBUG handleFormSubmit] BLOQUEADO: user ou token ausente');
      return;
    }
    
    if (!effectiveStoreId) {
      console.warn('[DEBUG handleFormSubmit] BLOQUEADO: Não foi possível encontrar o ID da loja');
      return;
    }
    try {
      if (editingProduct) {
        console.log('[DEBUG handleFormSubmit] Enviando PUT para:', `/products/${editingProduct.id}`);
        const payload = {
          store_id: effectiveStoreId,
          name: productData.name,
          price: Number(productData.price),
          description: productData.description,
          category_id: productData.category === 'todos' || productData.category === '' ? null : productData.category,
          stock: Number(productData.stock),
          is_active: productData.isActive,
          image: productData.image,
          images: productData.images || [],
        };
        console.log('[DEBUG handleFormSubmit] Payload PUT:', payload);
        console.log('[DEBUG handleFormSubmit] Valores detalhados do payload:', {
          store_id: payload.store_id,
          name: payload.name,
          price: payload.price,
          description: payload.description,
          category_id: payload.category_id,
          stock: payload.stock,
          is_active: payload.is_active,
          image: payload.image,
          images: payload.images
        });
        console.log('[DEBUG handleFormSubmit] Tipos dos campos:', {
          store_id: typeof payload.store_id,
          name: typeof payload.name,
          price: typeof payload.price,
          description: typeof payload.description,
          category_id: typeof payload.category_id,
          stock: typeof payload.stock,
          is_active: typeof payload.is_active,
          image: typeof payload.image,
          images: typeof payload.images
        });
        console.log('[DEBUG handleFormSubmit] Prestes a enviar requisição PUT...');
        const response = await api.put(`/products/${editingProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[DEBUG handleFormSubmit] Resposta PUT:', response);
        console.log('[DEBUG handleFormSubmit] Dados retornados pelo backend:', response.data);
        console.log('[DEBUG handleFormSubmit] Produto atualizado com sucesso, fazendo refetch...');
        toast({ title: "Produto atualizado", description: "Produto atualizado com sucesso!" });
      } else {
                  console.log('[DEBUG handleFormSubmit] Enviando POST para:', '/products');
        const payload = {
          store_id: effectiveStoreId,
          name: productData.name,
          price: Number(productData.price),
          description: productData.description,
          category_id: productData.category === 'todos' || productData.category === '' ? null : productData.category,
          stock: Number(productData.stock),
          is_active: productData.isActive,
          image: productData.image,
          images: productData.images || [],
        };
        console.log('[DEBUG handleFormSubmit] Payload POST:', payload);
                  const response = await api.post('/products', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[DEBUG handleFormSubmit] Resposta POST:', response);
        console.log('[DEBUG handleFormSubmit] Dados retornados pelo backend:', response.data);
        console.log('[DEBUG handleFormSubmit] Produto criado com sucesso, fazendo refetch...');
        toast({ title: "Produto criado", description: "Novo produto adicionado com sucesso!" });
      }
      setShowForm(false);
      setEditingProduct(null);
      console.log('[DEBUG handleFormSubmit] Chamando refetch...');
      if (typeof refetch === 'function') {
        await refetch();
        console.log('[DEBUG handleFormSubmit] Refetch concluído');
      } else {
        console.warn('[DEBUG handleFormSubmit] refetch não é uma função:', refetch);
      }
      
    } catch (error: any) {
      // Log detalhado para qualquer erro, inclusive erros de rede, CORS ou resposta indefinida
      console.error('[DEBUG handleFormSubmit][CATCH] Erro ao salvar produto:', error);
      if (error?.response) {
        console.error('[DEBUG handleFormSubmit][CATCH] error.response:', error.response);
        console.error('[DEBUG handleFormSubmit][CATCH] error.response.data:', error.response.data);
        if (error.response.data?.details) {
          console.error('[DEBUG handleFormSubmit][CATCH] error.response.data.details:', error.response.data.details);
          error.response.data.details.forEach((detail, index) => {
            console.error(`[DEBUG handleFormSubmit][CATCH] Detail ${index}:`, detail);
            console.error(`[DEBUG handleFormSubmit][CATCH] Campo com problema (path):`, detail.path);
          });
        }
      } else if (error?.request) {
        console.error('[DEBUG handleFormSubmit][CATCH] error.request:', error.request);
      } else {
        console.error('[DEBUG handleFormSubmit][CATCH] error.message:', error.message);
      }
      toast({ 
        title: "Erro inesperado",         description: error?.response?.data?.error || error?.message || "Erro inesperado ao salvar produto.", 
        variant: "destructive" 
      });
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const toggleProductStatus = async (productId: string) => {
    console.log('[DEBUG] toggleProductStatus chamado para produto:', productId);
    console.log('[DEBUG] user:', user);
    console.log('[DEBUG] token:', token);
    if (!user || !token) {
      console.warn('[DEBUG] BLOQUEADO: user ou token ausente para toggle status');
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.warn('[DEBUG] Produto não encontrado:', productId);
      return;
    }
    console.log('[DEBUG] Produto atual is_active:', product.is_active);
    console.log('[DEBUG] Novo status será:', !product.is_active);
    try {
      const payload = { is_active: !product.is_active };
      console.log('[DEBUG] Enviando PUT para toggle status:', `/products/${productId}`, payload);
      const response = await api.put(`/products/${productId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[DEBUG] Resposta toggle status:', response);
      toast({ title: "Status atualizado", description: "Status do produto atualizado com sucesso!" });
      console.log('[DEBUG] Fazendo refetch após toggle status...');
      if (typeof refetch === 'function') {
        await refetch();
        console.log('[DEBUG] Refetch toggle status concluído');
      }
    } catch (error) {
      console.error('[DEBUG] Error updating product status:', error);
      if (error?.response) {
        console.error('[DEBUG] error.response:', error.response);
        console.error('[DEBUG] error.response.data:', error.response.data);
      }
      toast({ title: "Erro ao atualizar status", description: "Não foi possível atualizar o status do produto.", variant: "destructive" });
    }
  };

  const confirmDelete = (productId: string) => {
    setShowDeleteConfirm(productId);
  };

  const deleteProduct = async (productId: string) => {
    console.log('[DEBUG] Botão excluir clicado para produtoId:', productId);
    console.log('[DEBUG] user:', user);
    console.log('[DEBUG] token:', token);
    if (!user || !token) {
      console.warn('[DEBUG] BLOQUEADO: user ou token ausente para exclusão');
      return;
    }
    try {
      console.log('[DEBUG] Enviando DELETE para:', `/products/${productId}`);
      const response = await api.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[DEBUG] Resposta DELETE:', response);
      toast({ title: "Produto removido", description: "Produto removido com sucesso!" });
      setShowDeleteConfirm(null);
      if (typeof refetch === 'function') refetch();
      
    } catch (error) {
      console.error('[DEBUG] Error deleting product:', error);
      if (error?.response) {
        console.error('[DEBUG] error.response:', error.response);
        console.error('[DEBUG] error.response.data:', error.response.data);
      }
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
                            {getCategoryName(product.category_id)}
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
                            {getCategoryName(product.category_id)}
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
