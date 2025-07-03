import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, Check, X, Upload, ImageIcon } from "lucide-react";
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
      const colors = ["#2980B9", "#34495E", "#27AE60", "#E74C3C", "#8E44AD"];
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
      <div className="space-y-8 pb-24 lg:pb-0">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Categorias
          </h1>
          <p className="text-muted-foreground mt-2">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 lg:pb-0 max-w-7xl mx-auto px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
          Categorias
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Organize seus produtos por categorias</p>
      </div>

      {/* Add New Category */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-2xl">
            <div className="p-3 bg-primary/10 rounded-2xl mr-4">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            Nova Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input 
                placeholder="Nome da categoria" 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && addCategory()} 
                className="flex-1 h-12 rounded-2xl border-2 focus:border-primary/50 transition-all" 
              />
              <Button 
                onClick={addCategory} 
                className="h-12 px-8 rounded-2xl font-semibold"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar
              </Button>
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-4 bg-muted/30 rounded-2xl p-6">
              <Label className="text-base font-semibold">Imagem da Categoria</Label>
              <div className="flex items-center space-x-6">
                {newCategoryImage && (
                  <div className="relative">
                    <img 
                      src={newCategoryImage} 
                      alt="Preview" 
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20" 
                    />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <Input 
                    placeholder="Cole o link de uma imagem" 
                    value={newCategoryImage} 
                    onChange={(e) => setNewCategoryImage(e.target.value)} 
                    className="rounded-2xl border-2"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">ou</span>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e)} 
                      className="hidden" 
                      id="new-category-image-upload" 
                    />
                    <Label 
                      htmlFor="new-category-image-upload" 
                      className="flex items-center space-x-2 cursor-pointer bg-secondary/10 hover:bg-secondary/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Anexar Arquivo</span>
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all">
          <CardContent className="p-8 text-center">
            <div className="text-4xl font-bold text-primary mb-2">{categories.length}</div>
            <p className="text-muted-foreground font-medium">Total de Categorias</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-xl transition-all">
          <CardContent className="p-8 text-center">
            <div className="text-4xl font-bold text-secondary mb-2">
              {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
            </div>
            <p className="text-muted-foreground font-medium">Produtos Categorizados</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all sm:col-span-2 lg:col-span-1">
          <CardContent className="p-8 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {categories.filter(cat => (cat.productCount || 0) > 0).length}
            </div>
            <p className="text-muted-foreground font-medium">Categorias Ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category) => (
          <Card key={category.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
            <CardContent className="p-0">
              <div className="relative">
                {/* Category Image/Color Header */}
                <div 
                  className="h-32 relative overflow-hidden"
                  style={{ 
                    background: category.image 
                      ? `url(${category.image}) center/cover`
                      : `linear-gradient(135deg, ${category.color}, ${category.color}cc)`
                  }}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 right-4 flex space-x-2">
                    {editingCategory === category.id ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={saveEdit} className="rounded-xl">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={cancelEdit} className="rounded-xl">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : deleteConfirm === category.id ? (
                      <>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => deleteCategory(category.id)} 
                          className="rounded-xl"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={cancelDelete} className="rounded-xl">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => startEditing(category)} className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => confirmDelete(category.id)} 
                          className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  {!category.image && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-white/80" />
                    </div>
                  )}
                </div>

                {/* Category Content */}
                <div className="p-6 space-y-4">
                  {editingCategory === category.id ? (
                    <div className="space-y-3">
                      <Input 
                        value={editingName} 
                        onChange={(e) => setEditingName(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()} 
                        className="text-xl font-bold border-2 rounded-2xl" 
                        autoFocus 
                      />
                      <Input 
                        placeholder="URL da imagem" 
                        value={editingImage} 
                        onChange={(e) => setEditingImage(e.target.value)} 
                        className="rounded-2xl" 
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
                        className="flex items-center space-x-2 cursor-pointer bg-secondary/10 hover:bg-secondary/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors w-fit"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Atualizar Imagem</span>
                      </Label>
                    </div>
                  ) : (
                    <h3 className="text-2xl font-bold text-foreground">{category.name}</h3>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="px-4 py-2 rounded-xl font-medium">
                      {category.productCount || 0} produtos
                    </Badge>
                    <div 
                      className="w-6 h-6 rounded-full ring-2 ring-white shadow-md" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{
                          width: `${Math.min((category.productCount || 0) / 30 * 100, 100)}%`,
                          backgroundColor: category.color
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(category.productCount || 0) === 0 ? "Nenhum produto" : `${Math.round((category.productCount || 0) / 67 * 100)}% do catálogo`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="border-0 shadow-lg rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="p-6 bg-muted/30 rounded-full w-fit mx-auto mb-6">
              <Tag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Nenhuma categoria criada</h3>
            <p className="text-muted-foreground mb-6">Comece criando sua primeira categoria para organizar seus produtos.</p>
            <Button onClick={() => document.getElementById('new-category-input')?.focus()} className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CategoryManagement;