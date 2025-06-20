
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StoreSettings = () => {
  const { toast } = useToast();
  
  // Estado para as configurações da loja
  const [settings, setSettings] = useState({
    storeName: localStorage.getItem('storeName') || 'LinkStore',
    storeDescription: localStorage.getItem('storeDescription') || 'Catálogo de todos os seus produtos\nque você sempre desejou encontrar',
    mobileLogo: localStorage.getItem('mobileLogo') || '/lovable-uploads/481d6627-3dbb-4c82-8d6f-53e1613133b2.png',
    desktopBanner: localStorage.getItem('desktopBanner') || '/lovable-uploads/c43cdca8-1978-4d87-a0d8-4241b90270c6.png',
    mobileBannerColor: localStorage.getItem('mobileBannerColor') || 'from-green-400 via-green-500 to-green-600'
  });

  const [previewFiles, setPreviewFiles] = useState({
    mobileLogo: null as string | null,
    desktopBanner: null as string | null
  });

  const handleFileUpload = (type: 'mobileLogo' | 'desktopBanner', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewFiles(prev => ({
          ...prev,
          [type]: result
        }));
        setSettings(prev => ({
          ...prev,
          [type]: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlInput = (type: 'mobileLogo' | 'desktopBanner', url: string) => {
    setSettings(prev => ({
      ...prev,
      [type]: url
    }));
    setPreviewFiles(prev => ({
      ...prev,
      [type]: url
    }));
  };

  const handleSave = () => {
    // Salva as configurações no localStorage
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    // Dispara evento customizado para atualizar a loja
    window.dispatchEvent(new CustomEvent('storeSettingsUpdated', { 
      detail: settings 
    }));

    toast({
      title: "Configurações salvas!",
      description: "As alterações foram aplicadas na loja.",
    });
  };

  const gradientOptions = [
    { name: 'Verde', value: 'from-green-400 via-green-500 to-green-600' },
    { name: 'Roxo', value: 'from-purple-600 via-purple-700 to-purple-800' },
    { name: 'Azul', value: 'from-blue-500 via-blue-600 to-blue-700' },
    { name: 'Rosa', value: 'from-pink-500 via-pink-600 to-pink-700' },
    { name: 'Laranja', value: 'from-orange-500 via-orange-600 to-orange-700' },
    { name: 'Violeta', value: 'from-violet-600 via-violet-700 to-violet-800' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configurações da Loja</h2>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Informações da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storeName">Nome da Loja</Label>
              <Input
                id="storeName"
                value={settings.storeName}
                onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                placeholder="Nome da sua loja"
              />
            </div>
            
            <div>
              <Label htmlFor="storeDescription">Descrição da Loja</Label>
              <Textarea
                id="storeDescription"
                value={settings.storeDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, storeDescription: e.target.value }))}
                placeholder="Descrição que aparece na loja"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Mobile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Logo Mobile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mobileLogoUrl">URL da Logo</Label>
              <Input
                id="mobileLogoUrl"
                value={settings.mobileLogo}
                onChange={(e) => handleUrlInput('mobileLogo', e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
            
            <div>
              <Label htmlFor="mobileLogoFile">Ou faça upload</Label>
              <Input
                id="mobileLogoFile"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('mobileLogo', e)}
              />
            </div>
            
            {(previewFiles.mobileLogo || settings.mobileLogo) && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="w-24 h-24 bg-white/20 rounded-full overflow-hidden border border-gray-200">
                  <img 
                    src={previewFiles.mobileLogo || settings.mobileLogo} 
                    alt="Logo preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Banner Desktop */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Banner Desktop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="desktopBannerUrl">URL do Banner</Label>
              <Input
                id="desktopBannerUrl"
                value={settings.desktopBanner}
                onChange={(e) => handleUrlInput('desktopBanner', e.target.value)}
                placeholder="https://exemplo.com/banner.png"
              />
            </div>
            
            <div>
              <Label htmlFor="desktopBannerFile">Ou faça upload</Label>
              <Input
                id="desktopBannerFile"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('desktopBanner', e)}
              />
            </div>
            
            {(previewFiles.desktopBanner || settings.desktopBanner) && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={previewFiles.desktopBanner || settings.desktopBanner} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cor do Banner Mobile */}
        <Card>
          <CardHeader>
            <CardTitle>Cor do Banner Mobile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {gradientOptions.map((option) => (
                <div
                  key={option.value}
                  className={`h-16 bg-gradient-to-br ${option.value} rounded-lg cursor-pointer border-2 transition-all ${
                    settings.mobileBannerColor === option.value 
                      ? 'border-white shadow-lg scale-105' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setSettings(prev => ({ ...prev, mobileBannerColor: option.value }))}
                >
                  <div className="h-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{option.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de ação no final */}
      <div className="flex justify-center pt-6">
        <Button onClick={handleSave} size="lg" className="bg-green-600 hover:bg-green-700">
          <Save className="h-5 w-5 mr-2" />
          Salvar e Aplicar Configurações
        </Button>
      </div>
    </div>
  );
};

export default StoreSettings;
