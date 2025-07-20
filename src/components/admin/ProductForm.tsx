
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Upload, Trash2, GripVertical, Info } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import api from '@/services/api';

interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  isActive: boolean;
  image: string;
  images?: string[];
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

const RecommendedDimensions = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
    <div className="flex items-start space-x-2">
      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800">Imagens do Produto</p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>Dimensões recomendadas:</strong> 600x600 pixels (quadrada)
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Use imagens com boa iluminação e fundo limpo. A primeira imagem será a principal.
        </p>
      </div>
    </div>
  </div>
);

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showRequiredFieldsMsg, setShowRequiredFieldsMsg] = useState(false);
  
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: product?.name || "",
    price: product?.price || 0,
    description: product?.description || "",
    category: product?.category || "",
    stock: product?.stock || 0,
    isActive: product?.isActive ?? true,
    image: product?.image || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=400&fit=crop",
    images: product?.images || []
  });

  // Estados para simulação de margem
  const [costPrice, setCostPrice] = useState(0);
  const [marginPercent, setMarginPercent] = useState(0);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [calcMethod, setCalcMethod] = useState<'margin' | 'markup'>('margin');

  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>(product?.images || []);

  // Buscar categorias do backend
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const headers = user && user.token ? { Authorization: `Bearer ${user.token}` } : {};
      const res = await api.get(`${API_URL}/categorias`, { headers });
      setCategories(res.data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Cálculo automático do preço sugerido baseado na margem
  useEffect(() => {
    if (costPrice > 0 && marginPercent > 0) {
      let calculated = 0;
      if (calcMethod === 'margin') {
        calculated = costPrice / (1 - marginPercent / 100);
      } else {
        calculated = costPrice * (1 + marginPercent / 100);
      }
      setSuggestedPrice(calculated);
      setFormData(prev => ({
        ...prev,
        price: calculated
      }));
    }
  }, [costPrice, marginPercent, calcMethod]);

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('handleSubmit chamado!');
    console.log('handleSubmit chamado!');
    // Validação dos campos obrigatórios
    if (!formData.name || !formData.price || !formData.category) {
      setShowRequiredFieldsMsg(true);
      return;
    }
    setShowRequiredFieldsMsg(false);
    
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        // 1. Upload para o Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const { error } = await supabase.storage.from('store-assets').upload(filePath, file);
        if (error) {
          toast({ title: 'Erro ao enviar imagem', description: error.message, variant: 'destructive' });
          continue;
        }
        // 2. Obter URL pública
        const { data } = supabase.storage.from('store-assets').getPublicUrl(filePath);
        if (data?.publicUrl) {
          setImages(prev => {
            const newImages = [...prev, data.publicUrl];
            // Se for a primeira imagem, definir como principal
            if (prev.length === 0) {
              setFormData(prevForm => ({ ...prevForm, image: data.publicUrl }));
            }
            return newImages;
          });
        }
      }
    }
  };

  const addImageFromUrl = () => {
    if (imageUrl.trim()) {
      setImages(prev => {
        const newImages = [...prev, imageUrl.trim()];
        // Se for a primeira imagem, definir como principal
        if (prev.length === 0) {
          setFormData(prevForm => ({
            ...prevForm,
            image: imageUrl.trim()
          }));
        }
        return newImages;
      });
      setImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Se a imagem removida era a principal, definir a primeira restante como principal
    if (formData.image === imageToRemove) {
      const remainingImages = images.filter((_, i) => i !== index);
      if (remainingImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          image: remainingImages[0]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          image: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=400&fit=crop"
        }));
      }
    }
  };

  const setMainImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setImages(items);
  };

  try {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {showRequiredFieldsMsg && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3 text-sm">
                Preencha todos os campos obrigatórios antes de salvar.
              </div>
            )}
            {/* Imagens do produto */}
            <div className="space-y-4">
              <Label>Imagens do Produto</Label>
              
              <RecommendedDimensions />
              
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

              {/* Gallery de imagens com drag and drop */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <Label>Galeria de Imagens ({images.length}) - Arraste para reordenar</Label>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="images" direction="horizontal">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="grid grid-cols-3 md:grid-cols-4 gap-3"
                        >
                          {images.map((img, index) => (
                            <Draggable key={`image-${index}`} draggableId={`image-${index}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative group ${snapshot.isDragging ? 'z-50' : ''}`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute top-1 left-1 z-10 bg-gray-800 bg-opacity-70 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="h-3 w-3 text-white" />
                                  </div>
                                  <img 
                                    src={img} 
                                    alt={`Imagem ${index + 1}`} 
                                    className="w-full h-20 rounded-lg object-cover border cursor-pointer hover:opacity-75 transition-opacity"
                                    onClick={() => setMainImage(img)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 z-10 bg-red-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                  {formData.image === img && (
                                    <Badge className="absolute bottom-1 left-1 text-xs bg-green-600">
                                      Principal
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}
            </div>

            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Produto incrível"
                  required
                />
              </div>
            </div>

            {/* Simulação de Margem */}
            <div className="border rounded-lg p-4 bg-blue-50 mt-4">
              <h4 className="font-semibold mb-2">Simulação de Preço</h4>
              <RadioGroup value={calcMethod} onValueChange={v => setCalcMethod(v as 'margin' | 'markup')} className="flex gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="margin" id="margin" />
                  <label htmlFor="margin" className="text-sm">Margem de Lucro</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="markup" id="markup" />
                  <label htmlFor="markup" className="text-sm">Markup</label>
                </div>
              </RadioGroup>
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <Label>Preço de Custo (R$)</Label>
                  <Input type="number" step="0.01" value={costPrice || ''} onChange={e => setCostPrice(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>{calcMethod === 'margin' ? 'Margem Desejada (%)' : 'Markup (%)'}</Label>
                  <Input type="number" step="0.01" value={marginPercent || ''} onChange={e => setMarginPercent(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Preço Sugerido (R$)</Label>
                  <Input type="number" step="0.01" value={suggestedPrice.toFixed(2)} readOnly className="bg-green-50 border-green-200" />
                </div>
              </div>
              {costPrice > 0 && marginPercent > 0 && (
                <div className="bg-blue-100 border border-blue-200 rounded p-3 mt-3 text-sm text-blue-800">
                  <strong>Resumo:</strong> Com custo de R$ {costPrice.toFixed(2)} e {calcMethod === 'margin' ? `margem de ${marginPercent}%` : `markup de ${marginPercent}%`}, o preço sugerido é R$ {suggestedPrice.toFixed(2)} (lucro de R$ {(suggestedPrice - costPrice).toFixed(2)})<br/>
                  <span className="block mt-1 text-xs text-blue-700">
                    {calcMethod === 'margin'
                      ? 'Fórmula: Preço = Custo ÷ (1 - Margem)'
                      : 'Fórmula: Preço = Custo × (1 + Markup)'}
                  </span>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-600">
                <strong>O que é Margem?</strong> Percentual de lucro sobre o preço final.<br/>
                <strong>O que é Markup?</strong> Percentual aplicado sobre o custo para formar o preço de venda.
              </div>
            </div>

            {/* Preço Final */}
            <div>
              <Label htmlFor="price">Preço de Venda Final (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ""}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                required
                className="font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode usar o preço sugerido ou modificar conforme necessário
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os produtos</SelectItem>
                    {loadingCategories ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stock">Estoque *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock || ""}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o produto..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Produto ativo</Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                {product ? 'Atualizar Produto' : 'Criar Produto'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  } catch (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Erro ao carregar formulário</h3>
        <p className="text-red-600">Ocorreu um erro ao carregar o formulário de produto.</p>
        <Button onClick={onCancel} className="mt-2">
          Voltar
        </Button>
      </div>
    );
  }
};

export default ProductForm;
