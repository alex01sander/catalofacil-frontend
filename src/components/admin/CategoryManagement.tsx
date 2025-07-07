
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, Check, X, Upload, ImageIcon, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Category {
  id: string;
  name: string;
  color: string;
  image?: string;
  productCount?: number;
}

const CategoryManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingImage, setEditingImage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch categories from database
  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar categorias",
          variant: "destructive"
        });
        return;
      }

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('user_id', user.id);
          
          return {
            ...category,
            productCount: count || 0
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const addCategory = async () => {
    if (!newCategory.trim() || !user) return;

    try {
      const colors = ["#8B5CF6", "#06D6A0", "#F59E0B", "#EF4444", "#3B82F6"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: newCategory.trim(),
          color: randomColor,
          image: newCategoryImage || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar categoria",
          variant: "destructive"
        });
        return;
      }

      setCategories(prev => [...prev, { ...data, productCount: 0 }]);
      setNewCategory("");
      setNewCategoryImage("");
      toast({
        title: "Categoria criada",
        description: `Categoria "${newCategory}" criada com sucesso!`
      });
    } catch (error) {
      console.error('Error adding category:', error);
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
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingName.trim(),
          image: editingImage || null
        })
        .eq('id', editingCategory)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating category:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar categoria",
          variant: "destructive"
        });
        return;
      }

      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory 
          ? { ...cat, name: editingName.trim(), image: editingImage }
          : cat
      ));

      toast({
        title: "Categoria atualizada",
        description: "Categoria atualizada com sucesso!"
      });
    } catch (error) {
      console.error('Error updating category:', error);
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
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting category:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover categoria",
          variant: "destructive"
        });
        return;
      }

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setDeleteConfirm(null);
      toast({
        title: "Categoria removida",
        description: "Categoria removida com sucesso!"
      });
    } catch (error) {
      console.error('Error deleting category:', error);
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
    <div className="space-y-6 pb-24 lg:pb-0">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
          🏷️ Categorias
        </h1>
        <p className="text-muted-foreground">Organize seus produtos de forma inteligente</p>
      </div>

      {/* Add New Category */}
      <Card className="shadow-xl border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-orange-50 border-b">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            ✨ Nova Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                placeholder="Nome da categoria" 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && addCategory()} 
                className="flex-1" 
              />
              <Button 
                onClick={addCategory} 
                className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white shadow-lg w-full sm:w-auto h-11"
              >
                <Plus className="h-4 w-4 mr-2" />
                ➕ Adicionar
              </Button>
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-3">
              <Label>Imagem da Categoria</Label>
              <div className="flex items-center space-x-4">
                {newCategoryImage && (
                  <img 
                    src={newCategoryImage} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-lg object-cover border" 
                  />
                )}
                <div className="flex-1 space-y-2">
                  <Input 
                    placeholder="Cole o link de uma imagem" 
                    value={newCategoryImage} 
                    onChange={(e) => setNewCategoryImage(e.target.value)} 
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">ou</span>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e)} 
                      className="hidden" 
                      id="new-category-image-upload" 
                    />
                    <Label 
                      htmlFor="new-category-image-upload" 
                      className="flex items-center space-x-1 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Anexar</span>
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">🏷️ Total de Categorias</p>
                <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">📦 Produtos Categorizados</p>
                <p className="text-2xl font-bold text-purple-600">
                  {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1 shadow-lg border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">✅ Categorias Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {categories.filter(cat => (cat.productCount || 0) > 0).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Categories Cards - Visible only on mobile */}
      <div className="block lg:hidden space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Lista de Categorias</h2>
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.image && (
                        <img 
                          src={category.image} 
                          alt={category.name} 
                          className="w-8 h-8 rounded object-cover" 
                        />
                      )}
                    </div>
                    {editingCategory === category.id ? (
                      <div className="flex-1 space-y-2">
                        <Input 
                          value={editingName} 
                          onChange={(e) => setEditingName(e.target.value)} 
                          onKeyPress={(e) => e.key === 'Enter' && saveEdit()} 
                          className="text-lg font-semibold" 
                          autoFocus 
                        />
                        <div className="flex items-center space-x-2">
                          <Input 
                            placeholder="URL da imagem" 
                            value={editingImage} 
                            onChange={(e) => setEditingImage(e.target.value)} 
                            className="text-sm" 
                          />
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, true)} 
                            className="hidden" 
                            id={`edit-image-${category.id}`} 
                          />
                          <Label 
                            htmlFor={`edit-image-${category.id}`} 
                            className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-1 rounded"
                          >
                            <Upload className="h-4 w-4" />
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <h3 className="text-lg font-semibold truncate">{category.name}</h3>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Produtos:</span>
                    <Badge variant="secondary">
                      {category.productCount || 0} itens
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Cor:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {category.color}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{
                      width: `${Math.min((category.productCount || 0) / 30 * 100, 100)}%`,
                      backgroundColor: category.color
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-gray-500">
                    {(category.productCount || 0) === 0 ? "Nenhum produto" : `${Math.round((category.productCount || 0) / 67 * 100)}% do catálogo`}
                  </p>
                  
                  <div className="flex space-x-2">
                    {editingCategory === category.id ? (
                      <>
                        <Button variant="outline" size="sm" onClick={saveEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : deleteConfirm === category.id ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteCategory(category.id)} 
                          className="text-red-600 hover:text-red-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelDelete}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => startEditing(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => confirmDelete(category.id)} 
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

      {/* Categories Grid - Hidden on mobile */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {category.image && (
                      <img 
                        src={category.image} 
                        alt={category.name} 
                        className="w-10 h-10 rounded object-cover" 
                      />
                    )}
                  </div>
                  {editingCategory === category.id ? (
                    <div className="flex-1 space-y-2">
                      <Input 
                        value={editingName} 
                        onChange={(e) => setEditingName(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()} 
                        className="text-lg font-semibold" 
                        autoFocus 
                      />
                      <div className="flex items-center space-x-2">
                        <Input 
                          placeholder="URL da imagem" 
                          value={editingImage} 
                          onChange={(e) => setEditingImage(e.target.value)} 
                          className="text-sm" 
                        />
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, true)} 
                          className="hidden" 
                          id={`edit-image-grid-${category.id}`} 
                        />
                        <Label 
                          htmlFor={`edit-image-grid-${category.id}`} 
                          className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-1 rounded"
                        >
                          <Upload className="h-4 w-4" />
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                  )}
                </div>
                <div className="flex space-x-2">
                  {editingCategory === category.id ? (
                    <>
                      <Button variant="outline" size="sm" onClick={saveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : deleteConfirm === category.id ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteCategory(category.id)} 
                        className="text-red-600 hover:text-red-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelDelete}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => startEditing(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => confirmDelete(category.id)} 
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Produtos:</span>
                  <Badge variant="secondary">
                    {category.productCount || 0} itens
                  </Badge>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{
                      width: `${Math.min((category.productCount || 0) / 30 * 100, 100)}%`,
                      backgroundColor: category.color
                    }}
                  ></div>
                </div>
                
                <p className="text-xs text-gray-500">
                  {(category.productCount || 0) === 0 ? "Nenhum produto nesta categoria" : `${Math.round((category.productCount || 0) / 67 * 100)}% do catálogo`}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories Table - Hidden on mobile */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Categoria</th>
                  <th className="text-left p-3">Produtos</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        {category.image && (
                          <img 
                            src={category.image} 
                            alt={category.name} 
                            className="w-8 h-8 rounded object-cover" 
                          />
                        )}
                        {editingCategory === category.id ? (
                          <div className="space-y-1">
                            <Input 
                              value={editingName} 
                              onChange={(e) => setEditingName(e.target.value)} 
                              onKeyPress={(e) => e.key === 'Enter' && saveEdit()} 
                              className="font-medium" 
                              autoFocus 
                            />
                            <div className="flex items-center space-x-1">
                              <Input 
                                placeholder="URL da imagem" 
                                value={editingImage} 
                                onChange={(e) => setEditingImage(e.target.value)} 
                                className="text-xs" 
                              />
                              <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(e, true)} 
                                className="hidden" 
                                id={`edit-image-table-${category.id}`} 
                              />
                              <Label 
                                htmlFor={`edit-image-table-${category.id}`} 
                                className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-1 rounded"
                              >
                                <Upload className="h-3 w-3" />
                              </Label>
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium">{category.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">
                        {category.productCount || 0} produtos
                      </Badge>
                    </td>
                    <td className="p-3">
                      {editingCategory === category.id ? (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : deleteConfirm === category.id ? (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteCategory(category.id)} 
                            className="text-red-600 hover:text-red-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelDelete}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => startEditing(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => confirmDelete(category.id)} 
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
    </div>
  );
};

export default CategoryManagement;
