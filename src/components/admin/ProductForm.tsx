
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Upload, ImageIcon } from "lucide-react";

interface Product {
  id?: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  isActive: boolean;
  image: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

const categories = [
  "Eletrônicos",
  "Roupas", 
  "Casa",
  "Beleza",
  "Esportes",
  "Livros",
  "Brinquedos"
];

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: product?.name || "",
    price: product?.price || 0,
    description: product?.description || "",
    category: product?.category || "",
    stock: product?.stock || 0,
    isActive: product?.isActive ?? true,
    image: product?.image || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=400&fit=crop"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          image: imageUrl
        }));
      };
      reader.readAsDataURL(file);
    }
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
          {/* Imagem do produto */}
          <div className="space-y-4">
            <Label>Imagem do Produto</Label>
            
            {/* Preview da imagem */}
            <div className="flex items-center space-x-4">
              <img
                src={formData.image}
                alt="Preview"
                className="w-20 h-20 rounded-lg object-cover border"
              />
              <div className="flex-1 space-y-3">
                {/* Input para URL */}
                <div>
                  <Input
                    placeholder="Cole o link de uma imagem"
                    value={formData.image.startsWith('data:') ? '' : formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                  />
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
                
                {/* Input para arquivo */}
                <div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label
                      htmlFor="image-upload"
                      className="flex items-center space-x-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Anexar do computador</span>
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione uma imagem do seu computador (JPG, PNG, etc.)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Nome do produto */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              placeholder="Digite o nome do produto"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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
              onChange={(e) => handleInputChange('description', e.target.value)}
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
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
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
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
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
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
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
