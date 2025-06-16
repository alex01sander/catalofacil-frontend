
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface Sale {
  id?: number;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
  status: string;
}

interface SaleFormProps {
  onSubmit: (sale: Omit<Sale, 'id'>) => void;
  onCancel: () => void;
}

const products = [
  { name: "Smartphone Galaxy Pro", price: 1299.99 },
  { name: "Camiseta Premium Cotton", price: 89.90 },
  { name: "Sofá Moderno 3 Lugares", price: 2499.99 },
  { name: "Kit Skincare Completo", price: 149.90 },
];

const SaleForm = ({ onSubmit, onCancel }: SaleFormProps) => {
  const [formData, setFormData] = useState({
    product: "",
    quantity: 1,
    unitPrice: 0,
    date: new Date().toISOString().split('T')[0],
    status: "completed"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.quantity * formData.unitPrice;
    
    onSubmit({
      ...formData,
      total,
    });
  };

  const handleProductChange = (productName: string) => {
    const selectedProduct = products.find(p => p.name === productName);
    setFormData(prev => ({
      ...prev,
      product: productName,
      unitPrice: selectedProduct?.price || 0
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Registrar Nova Venda</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Produto */}
          <div className="space-y-2">
            <Label>Produto *</Label>
            <Select value={formData.product} onValueChange={handleProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.name} value={product.name}>
                    {product.name} - R$ {product.price.toFixed(2).replace('.', ',')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade e Preço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Preço Unitário (R$) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date">Data da Venda *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>

          {/* Total calculado */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total da Venda:</span>
              <span className="text-2xl font-bold text-purple-600">
                R$ {(formData.quantity * formData.unitPrice).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              Registrar Venda
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

export default SaleForm;
