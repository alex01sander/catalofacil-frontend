
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, Check, X, Upload, ImageIcon, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import api from '@/services/api';
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/constants/api";
import { supabase } from '@/integrations/supabase/client';
import { useStore } from "@/contexts/StoreSettingsContext";

interface Category {
  id: string;
  name: string;
  color: string;
  image?: string;
  productCount?: number;
}

const CategoryManagement = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { store } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingImage, setEditingImage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Função para forçar logout
  const forceLogout = () => {
    console.log('🚨 Forçando logout devido a erro de autenticação');
    signOut();
    toast({ 
      title: "Sessão Expirada", 
      description: "Você foi desconectado. Faça login novamente.", 
      variant: "destructive" 
    });
  };

  // Fetch categories from backend
  const fetchCategories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get('/categorias');
      setCategories(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar categorias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCategories();
  }, [user]);

  const addCategory = async () => {
    if (!newCategory.trim() || !user || !store?.id) return;
    try {
      const colors = ["#8B5CF6", "#06D6A0", "#F59E0B", "#EF4444", "#3B82F6"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      console.log('=== ADICIONAR CATEGORIA ===');
      console.log('User ID (original):', user.id);
      console.log('User ID (tipo):', typeof user.id);
      console.log('User completo:', user);
      console.log('URL:', '/categorias');
      console.log('Token disponível:', !!user.token);
      console.log('Token completo:', user.token);
      
      // Verificar se o token está sendo enviado corretamente
      const storedToken = localStorage.getItem('jwt_token');
      console.log('Token do localStorage:', storedToken);
      
      const payload = {
        store_id: store.id,
        user_id: user.id,
        name: newCategory.trim(),
        color: randomColor,
        image: newCategoryImage || null
      };
      
      console.log('Payload sendo enviado:', payload);
      console.log('Headers da requisição:', api.defaults.headers);
      
      // Tentar enviar com headers explícitos
      const headers = {
        'Authorization': `Bearer ${storedToken}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Headers explícitos:', headers);
      
      const res = await api.post('/categorias', payload, { headers });
      
      console.log('✅ Resposta do servidor:', res.data);
      
      setCategories(prev => [...prev, { ...res.data, productCount: 0 }]);
      setNewCategory("");
      setNewCategoryImage("");
      toast({ title: "Categoria criada", description: `Categoria \"${newCategory}\" criada com sucesso!` });
      // Abrir edição automaticamente para a nova categoria
      setEditingCategory(res.data.id);
      setEditingName(res.data.name);
      setEditingImage(res.data.image || "");
    } catch (error) {
      console.error('❌ Error adding category:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Headers:', error.response?.headers);
      console.error('❌ Config:', error.config);
      console.error('❌ Request headers:', error.config?.headers);
      
      // Mensagem mais específica baseada no erro
      let errorMessage = "Erro ao criar categoria";
      if (error.response?.data?.details?.code === 'P2003') {
        console.error('❌ Erro P2003 - Usuário não existe no banco');
        console.error('❌ User ID sendo enviado:', user.id);
        console.error('❌ Token sendo enviado:', user.token);
        console.error('❌ Verifique se o backend está usando o mesmo banco de dados');
        errorMessage = "Problema de sincronização com o banco. Tente fazer logout e login novamente.";
      }
      
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category.id);
    setEditingName(category.name);
    setEditingImage(category.image || "");
  };

  const saveEdit = async () => {
    if (!editingName.trim() || !user || !editingCategory) return;
    try {
      await api.put(`/categorias/${editingCategory}`, {
        name: editingName.trim(),
        image: editingImage || null
      });
      setCategories(prev => prev.map(cat =>
        cat.id === editingCategory
          ? { ...cat, name: editingName.trim(), image: editingImage }
          : cat
      ));
      toast({ title: "Categoria atualizada", description: "Categoria atualizada com sucesso!" });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({ title: "Erro", description: "Erro ao atualizar categoria", variant: "destructive" });
    }
    setEditingCategory(null);
    setEditingName("");
    setEditingImage("");
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingName("");
    setEditingImage("");
  };

  const confirmDelete = (categoryId: string) => {
    setDeleteConfirm(categoryId);
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user) return;
    try {
      await api.delete(`/categorias/${categoryId}`);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setDeleteConfirm(null);
      toast({ title: "Categoria removida", description: "Categoria removida com sucesso!" });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: "Erro", description: "Erro ao remover categoria", variant: "destructive" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        if (isEditing) {
          setEditingImage(imageUrl);
        } else {
          setNewCategoryImage(imageUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-24 lg:pb-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gerenciar Categorias
          </h1>
          <p className="text-muted-foreground text-lg">Organize seus produtos de forma inteligente e eficiente</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">categorias criadas</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Tag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Produtos</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">categorizados</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {categories.filter(cat => (cat.productCount || 0) > 0).length}
                  </p>
                  <p className="text-xs text-muted-foreground">com produtos</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Category */}
        <Card className="border-none shadow-xl bg-gradient-to-r from-primary/5 via-purple-50/50 to-pink-50/50 dark:from-primary/10 dark:via-purple-950/30 dark:to-pink-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              Nova Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Nome da categoria</Label>
                  <Input 
                    placeholder="Ex: Eletrônicos, Roupas, Casa..." 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()} 
                    className="mt-1 h-12 text-base"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Imagem da categoria</Label>
                  <div className="mt-2 space-y-3">
                    <Input 
                      placeholder="Cole o link de uma imagem" 
                      value={newCategoryImage} 
                      onChange={(e) => setNewCategoryImage(e.target.value)} 
                      className="h-12"
                    />
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `categories/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                            const { data, error } = await supabase.storage.from('store-assets').upload(fileName, file);
                            if (!error) {
                              const { data: { publicUrl } } = supabase.storage.from('store-assets').getPublicUrl(fileName);
                              setNewCategoryImage(publicUrl);
                            }
                          }
                        }} 
                        className="hidden" 
                        id="category-image-upload" 
                      />
                      <Label htmlFor="category-image-upload" className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>Anexar imagem</span>
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-between">
                {newCategoryImage && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Preview</Label>
                    <img 
                      src={newCategoryImage} 
                      alt="Preview" 
                      className="mt-2 w-full h-32 rounded-lg object-cover border-2 border-dashed border-muted-foreground/20" 
                    />
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={addCategory} 
              className="w-full h-12 mt-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-lg text-base font-medium"
              disabled={!newCategory.trim()}
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Categoria
            </Button>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Suas Categorias</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-card via-card/50 to-muted/30 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Category Image */}
                    <div className="w-full h-48 bg-gradient-to-br from-muted to-muted/60 relative overflow-hidden">
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-600/10">
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center" 
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            <Tag className="h-8 w-8" style={{ color: category.color }} />
                          </div>
                        </div>
                      )}
                      
                      {/* Category Color Indicator */}
                      <div 
                        className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white shadow-lg" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      
                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        {editingCategory === category.id ? (
                          <>
                            <Button variant="secondary" size="sm" onClick={saveEdit} className="bg-green-500 hover:bg-green-600 text-white border-none">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="sm" onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white border-none">
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : deleteConfirm === category.id ? (
                          <>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => deleteCategory(category.id)} 
                              className="bg-red-500 hover:bg-red-600 text-white border-none"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="sm" onClick={cancelDelete} className="bg-gray-500 hover:bg-gray-600 text-white border-none">
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="secondary" size="sm" onClick={() => startEditing(category)} className="bg-blue-500 hover:bg-blue-600 text-white border-none">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => confirmDelete(category.id)} 
                              className="bg-red-500 hover:bg-red-600 text-white border-none"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Category Info */}
                    <div className="p-6 space-y-4">
                      {editingCategory === category.id ? (
                        <div className="space-y-3">
                          <Input 
                            value={editingName} 
                            onChange={(e) => setEditingName(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit()} 
                            className="text-lg font-semibold" 
                            autoFocus 
                          />
                          <Input 
                            placeholder="URL da imagem" 
                            value={editingImage} 
                            onChange={(e) => setEditingImage(e.target.value)} 
                            className="text-sm" 
                          />
                          <div className="flex items-center gap-2">
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageUpload(e, true)} 
                              className="hidden" 
                              id={`edit-image-${category.id}`} 
                            />
                            <Label 
                              htmlFor={`edit-image-${category.id}`} 
                              className="flex items-center gap-2 cursor-pointer bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg text-sm transition-colors w-full justify-center"
                            >
                              <Upload className="h-4 w-4" />
                              Alterar imagem
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{category.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {(category.productCount || 0) === 0 ? "Nenhum produto cadastrado" : `${category.productCount} produto${(category.productCount || 0) > 1 ? 's' : ''} cadastrado${(category.productCount || 0) > 1 ? 's' : ''}`}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Progresso</span>
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ backgroundColor: category.color + '20', color: category.color }}
                              >
                                {category.productCount || 0} itens
                              </Badge>
                            </div>
                            
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500 ease-out" 
                                style={{
                                  width: `${Math.min((category.productCount || 0) / 10 * 100, 100)}%`,
                                  backgroundColor: category.color
                                }}
                              ></div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground">
                              {Math.round((category.productCount || 0) / Math.max(categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0), 1) * 100)}% do total de produtos
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {categories.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma categoria ainda</h3>
                <p className="text-muted-foreground mb-4">Crie sua primeira categoria para organizar seus produtos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
