
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Upload, ImageIcon, Trash2 } from "lucide-react";

interface Product {
  id?: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  isActive: boolean;
  image: string;
  images?: string[];
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

const categories = ["Eletrônicos", "Roupas", "Casa", "Beleza", "Esportes", "Livros", "Brinquedos"];

const ProductForm = ({
  product,
  onSubmit,
  onCancel
}: ProductFormProps) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: product?.name || "",
    price: 0,
    description: product?.description || "",
    category: product?.category || "",
    stock: 0,
    isActive: product?.isActive ?? true,
    image: product?.image || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=400&fit=crop",
    images: product?.images || []
  });

  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>(product?.images || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      images: images
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
          const imageUrl = event.target?.result as string;
          setImages(prev => [...prev, imageUrl]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addImageFromUrl = () => {
    if (imageUrl.trim()) {
      setImages(prev => [...prev, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setMainImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {product ? 'Editar Produto' : 'Novo Produto'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagens do produto */}
          <div className="space-y-4">
            <Label>Imagens do Produto</Label>
            
            {/* Preview da imagem principal */}
            <div className="flex items-center space-x-4">
              <img src={formData.image} alt="Preview principal" className="w-20 h-20 rounded-lg object-cover border" />
              <div className="flex-1 space-y-3">
                {/* Input para URL */}
                <div>
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Cole o link de uma imagem" 
                      value={imageUrl} 
                      onChange={e => setImageUrl(e.target.value)} 
                    />
                    <Button type="button" onClick={addImageFromUrl} size="sm">
                      Adicionar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cole o link de uma imagem da internet
                  </p>
                </div>
                
                {/* Divisor */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-xs text-gray-500 px-2">OU</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                
                {/* Input para arquivos múltiplos */}
                <div>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleImageUpload} 
                      className="hidden" 
                      id="image-upload" 
                    />
                    <Label htmlFor="image-upload" className="flex items-center space-x-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>Anexar imagens</span>
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione múltiplas imagens do seu computador (JPG, PNG, etc.)
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery de imagens */}
            {images.length > 0 && (
              <div className="space-y-2">
                <Label>Galeria de Imagens ({images.length})</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img} 
                        alt={`Imagem ${index + 1}`} 
                        className="w-full h-20 rounded-lg object-cover border cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => setMainImage(img)}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      {formData.image === img && (
                        <Badge className="absolute bottom-1 left-1 text-xs py-0 px-1">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Clique em uma imagem para defini-la como principal
                </p>
              </div>
            )}
          </div>

          {/* Nome do produto */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input 
              id="name" 
              placeholder="Digite o nome do produto" 
              value={formData.name} 
              onChange={e => handleInputChange('name', e.target.value)} 
              required 
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description" 
              placeholder="Descreva o produto..." 
              value={formData.description} 
              onChange={e => handleInputChange('description', e.target.value)} 
              rows={3} 
            />
          </div>

          {/* Preço e Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                min="0" 
                placeholder="0,00" 
                value={formData.price || ""} 
                onChange={e => handleInputChange('price', parseFloat(e.target.value) || 0)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque *</Label>
              <Input 
                id="stock" 
                type="number" 
                min="0" 
                placeholder="0" 
                value={formData.stock || ""} 
                onChange={e => handleInputChange('stock', parseInt(e.target.value) || 0)} 
                required 
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={formData.category} onValueChange={value => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch 
              id="isActive" 
              checked={formData.isActive} 
              onCheckedChange={checked => handleInputChange('isActive', checked)} 
            />
            <Label htmlFor="isActive">
              Produto ativo na vitrine
            </Label>
            <Badge variant={formData.isActive ? "default" : "secondary"}>
              {formData.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              {product ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
