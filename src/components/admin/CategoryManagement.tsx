import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, Check, X, Upload, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
interface Category {
  id: number;
  name: string;
  productCount: number;
  color: string;
  image?: string;
}
const CategoryManagement = () => {
  const {
    toast
  } = useToast();
  const [categories, setCategories] = useState<Category[]>([{
    id: 1,
    name: "Eletrônicos",
    productCount: 12,
    color: "#8B5CF6",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop"
  }, {
    id: 2,
    name: "Roupas",
    productCount: 25,
    color: "#06D6A0",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop"
  }, {
    id: 3,
    name: "Casa",
    productCount: 8,
    color: "#F59E0B",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop"
  }, {
    id: 4,
    name: "Beleza",
    productCount: 15,
    color: "#EF4444",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop"
  }, {
    id: 5,
    name: "Acessórios",
    productCount: 7,
    color: "#8B5CF6",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop"
  }]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingImage, setEditingImage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const addCategory = () => {
    if (newCategory.trim()) {
      const colors = ["#8B5CF6", "#06D6A0", "#F59E0B", "#EF4444", "#3B82F6"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setCategories(prev => [...prev, {
        id: Date.now(),
        name: newCategory.trim(),
        productCount: 0,
        color: randomColor,
        image: newCategoryImage || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=300&fit=crop"
      }]);
      setNewCategory("");
      setNewCategoryImage("");
      toast({
        title: "Categoria criada",
        description: `Categoria "${newCategory}" criada com sucesso!`
      });
    }
  };
  const startEditing = (category: Category) => {
    setEditingCategory(category.id);
    setEditingName(category.name);
    setEditingImage(category.image || "");
  };
  const saveEdit = () => {
    if (editingName.trim()) {
      setCategories(prev => prev.map(cat => cat.id === editingCategory ? {
        ...cat,
        name: editingName.trim(),
        image: editingImage
      } : cat));
      toast({
        title: "Categoria atualizada",
        description: "Categoria atualizada com sucesso!"
      });
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
  const confirmDelete = (categoryId: number) => {
    setDeleteConfirm(categoryId);
  };
  const deleteCategory = (categoryId: number) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setDeleteConfirm(null);
    toast({
      title: "Categoria removida",
      description: "Categoria removida com sucesso!"
    });
  };
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
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
  return <div className="space-y-6 pb-24 lg:pb-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
        <p className="text-gray-600">Organize seus produtos por categorias</p>
      </div>

      {/* Add New Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Nova Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Nome da categoria" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCategory()} className="flex-1" />
              <Button onClick={addCategory} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-3">
              <Label>Imagem da Categoria</Label>
              <div className="flex items-center space-x-4">
                {newCategoryImage && <img src={newCategoryImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />}
                <div className="flex-1 space-y-2">
                  <Input placeholder="Cole o link de uma imagem" value={newCategoryImage} onChange={e => setNewCategoryImage(e.target.value)} />
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">ou</span>
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e)} className="hidden" id="new-category-image-upload" />
                    <Label htmlFor="new-category-image-upload" className="flex items-center space-x-1 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm">
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
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-sm text-gray-600">Total de Categorias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
              </p>
              <p className="text-sm text-gray-600">Produtos Categorizados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {categories.filter(cat => cat.productCount > 0).length}
              </p>
              <p className="text-sm text-gray-600">Categorias Ativas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Categories Cards - Visible only on mobile */}
      <div className="block lg:hidden space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Lista de Categorias</h2>
        {categories.map(category => <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{
                    backgroundColor: category.color
                  }}></div>
                      {category.image && <img src={category.image} alt={category.name} className="w-8 h-8 rounded object-cover" />}
                    </div>
                    {editingCategory === category.id ? <div className="flex-1 space-y-2">
                        <Input value={editingName} onChange={e => setEditingName(e.target.value)} onKeyPress={e => e.key === 'Enter' && saveEdit()} className="text-lg font-semibold" autoFocus />
                        <div className="flex items-center space-x-2">
                          <Input placeholder="URL da imagem" value={editingImage} onChange={e => setEditingImage(e.target.value)} className="text-sm" />
                          <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} className="hidden" id={`edit-image-${category.id}`} />
                          <Label htmlFor={`edit-image-${category.id}`} className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-1 rounded">
                            <Upload className="h-4 w-4" />
                          </Label>
                        </div>
                      </div> : <h3 className="text-lg font-semibold truncate">{category.name}</h3>}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Produtos:</span>
                    <Badge variant="secondary">
                      {category.productCount} itens
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
                  <div className="h-2 rounded-full" style={{
                width: `${Math.min(category.productCount / 30 * 100, 100)}%`,
                backgroundColor: category.color
              }}></div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-gray-500">
                    {category.productCount === 0 ? "Nenhum produto" : `${Math.round(category.productCount / 67 * 100)}% do catálogo`}
                  </p>
                  
                  <div className="flex space-x-2">
                    {editingCategory === category.id ? <>
                        <Button variant="outline" size="sm" onClick={saveEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </> : deleteConfirm === category.id ? <>
                        <Button variant="outline" size="sm" onClick={() => deleteCategory(category.id)} className="text-red-600 hover:text-red-700">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelDelete}>
                          <X className="h-4 w-4" />
                        </Button>
                      </> : <>
                        <Button variant="outline" size="sm" onClick={() => startEditing(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => confirmDelete(category.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Categories Grid - Hidden on mobile */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full" style={{
                  backgroundColor: category.color
                }}></div>
                    {category.image && <img src={category.image} alt={category.name} className="w-10 h-10 rounded object-cover" />}
                  </div>
                  {editingCategory === category.id ? <div className="flex-1 space-y-2">
                      <Input value={editingName} onChange={e => setEditingName(e.target.value)} onKeyPress={e => e.key === 'Enter' && saveEdit()} className="text-lg font-semibold" autoFocus />
                      <div className="flex items-center space-x-2">
                        <Input placeholder="URL da imagem" value={editingImage} onChange={e => setEditingImage(e.target.value)} className="text-sm" />
                        <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} className="hidden" id={`edit-image-grid-${category.id}`} />
                        <Label htmlFor={`edit-image-grid-${category.id}`} className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-1 rounded">
                          <Upload className="h-4 w-4" />
                        </Label>
                      </div>
                    </div> : <h3 className="text-lg font-semibold">{category.name}</h3>}
                </div>
                <div className="flex space-x-2">
                  {editingCategory === category.id ? <>
                      <Button variant="outline" size="sm" onClick={saveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </> : deleteConfirm === category.id ? <>
                      <Button variant="outline" size="sm" onClick={() => deleteCategory(category.id)} className="text-red-600 hover:text-red-700">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelDelete}>
                        <X className="h-4 w-4" />
                      </Button>
                    </> : <>
                      <Button variant="outline" size="sm" onClick={() => startEditing(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => confirmDelete(category.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Produtos:</span>
                  <Badge variant="secondary">
                    {category.productCount} itens
                  </Badge>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{
                width: `${Math.min(category.productCount / 30 * 100, 100)}%`,
                backgroundColor: category.color
              }}></div>
                </div>
                
                <p className="text-xs text-gray-500">
                  {category.productCount === 0 ? "Nenhum produto nesta categoria" : `${Math.round(category.productCount / 67 * 100)}% do catálogo`}
                </p>
              </div>
            </CardContent>
          </Card>)}
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
                {categories.map(category => <tr key={category.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{
                      backgroundColor: category.color
                    }}></div>
                        {category.image && <img src={category.image} alt={category.name} className="w-8 h-8 rounded object-cover" />}
                        {editingCategory === category.id ? <div className="space-y-1">
                            <Input value={editingName} onChange={e => setEditingName(e.target.value)} onKeyPress={e => e.key === 'Enter' && saveEdit()} className="font-medium" autoFocus />
                            <div className="flex items-center space-x-1">
                              <Input placeholder="URL da imagem" value={editingImage} onChange={e => setEditingImage(e.target.value)} className="text-xs" />
                              <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} className="hidden" id={`edit-image-table-${category.id}`} />
                              <Label htmlFor={`edit-image-table-${category.id}`} className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-1 rounded">
                                <Upload className="h-3 w-3" />
                              </Label>
                            </div>
                          </div> : <span className="font-medium">{category.name}</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">
                        {category.productCount} produtos
                      </Badge>
                    </td>
                    
                    <td className="p-3">
                      {editingCategory === category.id ? <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div> : deleteConfirm === category.id ? <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => deleteCategory(category.id)} className="text-red-600 hover:text-red-700">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelDelete}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div> : <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => startEditing(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => confirmDelete(category.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default CategoryManagement;