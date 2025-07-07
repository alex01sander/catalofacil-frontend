
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Save, Eye, X, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  validateStoreName, 
  validateStoreDescription, 
  validateImageUrl, 
  validateFileUpload,
  sanitizeText 
} from "@/utils/validation";

const RecommendedDimensions = ({ title, dimensions, description }: { title: string; dimensions: string; description: string }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
    <div className="flex items-start space-x-2">
      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800">{title}</p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>Dimensões recomendadas:</strong> {dimensions}
        </p>
        <p className="text-xs text-blue-600 mt-1">{description}</p>
      </div>
    </div>
  </div>
);

const StoreSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings, updateSettings, loading } = useStoreSettings();
  const { setTheme } = useTheme();
  
  const [formSettings, setFormSettings] = useState(settings);
  const [previewFiles, setPreviewFiles] = useState({
    mobile_logo: null as string | null,
    desktop_banner: null as string | null,
    mobile_banner_image: null as string | null
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const uploadFile = async (file: File, bucket: string, folder: string = '') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${folder}${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    const storeNameError = validateStoreName(formSettings.store_name);
    if (storeNameError) newErrors.store_name = storeNameError;
    
    const storeDescriptionError = validateStoreDescription(formSettings.store_description);
    if (storeDescriptionError) newErrors.store_description = storeDescriptionError;
    
    const mobileLogoError = validateImageUrl(formSettings.mobile_logo || '');
    if (mobileLogoError) newErrors.mobile_logo = mobileLogoError;
    
    const desktopBannerError = validateImageUrl(formSettings.desktop_banner || '');
    if (desktopBannerError) newErrors.desktop_banner = desktopBannerError;
    
    const mobileBannerError = validateImageUrl(formSettings.mobile_banner_image || '');
    if (mobileBannerError) newErrors.mobile_banner_image = mobileBannerError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (type: 'mobile_logo' | 'desktop_banner' | 'mobile_banner_image', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileError = await validateFileUpload(file);
    if (fileError) {
      toast({
        title: "Erro no arquivo",
        description: fileError,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const bucket = 'store-assets';
      const publicUrl = await uploadFile(file, bucket, `${type}/`);
      
      setPreviewFiles(prev => ({
        ...prev,
        [type]: publicUrl
      }));
      
      setFormSettings(prev => ({
        ...prev,
        [type]: publicUrl
      }));

      setErrors(prev => ({...prev, [type]: undefined}));

      toast({
        title: "Upload realizado!",
        description: "Arquivo enviado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInput = (type: 'mobile_logo' | 'desktop_banner' | 'mobile_banner_image', url: string) => {
    const sanitizedUrl = sanitizeText(url);
    setFormSettings(prev => ({
      ...prev,
      [type]: sanitizedUrl
    }));
    setPreviewFiles(prev => ({
      ...prev,
      [type]: sanitizedUrl
    }));
    
    if (errors[type]) {
      setErrors(prev => ({...prev, [type]: undefined}));
    }
  };

  const handleTextInput = (field: 'store_name' | 'store_description' | 'store_subtitle' | 'instagram_url' | 'whatsapp_number', value: string) => {
    const sanitizedValue = sanitizeText(value);
    setFormSettings(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const handleRemoveImage = (type: 'mobile_banner_image') => {
    setFormSettings(prev => ({
      ...prev,
      [type]: null
    }));
    setPreviewFiles(prev => ({
      ...prev,
      [type]: null
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSettings(formSettings);
      
      toast({
        title: "Configurações salvas!",
        description: "As alterações foram aplicadas na loja.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const gradientOptions = [
    { name: 'Verde', value: 'verde' },
    { name: 'Roxo', value: 'roxo' },
    { name: 'Azul', value: 'azul' },
    { name: 'Rosa', value: 'rosa' },
    { name: 'Laranja', value: 'laranja' },
    { name: 'Violeta', value: 'violeta' }
  ];

  const colorClasses: { [key: string]: string } = {
    verde: 'from-green-400 via-green-500 to-green-600',
    roxo: 'from-purple-600 via-purple-700 to-purple-800',
    azul: 'from-blue-500 via-blue-600 to-blue-700',
    rosa: 'from-pink-500 via-pink-600 to-pink-700',
    laranja: 'from-orange-500 via-orange-600 to-orange-700',
    violeta: 'from-violet-600 via-violet-700 to-violet-800'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
            ⚙️ Configurações da Loja
          </h2>
          <p className="text-muted-foreground">Personalize sua loja virtual</p>
        </div>
        <Button onClick={handleSave} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg w-full sm:w-auto h-11" disabled={uploading}>
          <Save className="h-4 w-4 mr-2" />
          {uploading ? "💾 Salvando..." : "💾 Salvar Alterações"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Informações Básicas */}
        <Card className="order-1 lg:order-1 shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              🏪 Informações da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storeName" className="text-sm font-medium">Nome da Loja</Label>
              <Input
                id="storeName"
                value={formSettings.store_name}
                onChange={(e) => handleTextInput('store_name', e.target.value)}
                placeholder="Nome da sua loja"
                className={`mt-1 ${errors.store_name ? 'border-red-500' : ''}`}
                maxLength={100}
              />
              {errors.store_name && <p className="text-red-500 text-sm mt-1">{errors.store_name}</p>}
            </div>
            <div>
              <Label htmlFor="storeSubtitle" className="text-sm font-medium">Subtítulo da Loja</Label>
              <Input
                id="storeSubtitle"
                value={formSettings.store_subtitle || ''}
                onChange={(e) => handleTextInput('store_subtitle', e.target.value)}
                placeholder="Ex: Produtos Incríveis"
              />
            </div>
            <div>
              <Label htmlFor="storeDescription" className="text-sm font-medium">Descrição da Loja</Label>
              <Textarea
                id="storeDescription"
                value={formSettings.store_description}
                onChange={(e) => handleTextInput('store_description', e.target.value)}
                placeholder="Descrição que aparece na loja"
                rows={3}
                className={`mt-1 resize-none ${errors.store_description ? 'border-red-500' : ''}`}
                maxLength={1000}
              />
              {errors.store_description && <p className="text-red-500 text-sm mt-1">{errors.store_description}</p>}
            </div>
            <div>
              <Label htmlFor="instagramUrl" className="text-sm font-medium">Instagram da Loja</Label>
              <Input
                id="instagramUrl"
                value={formSettings.instagram_url || ''}
                onChange={(e) => handleTextInput('instagram_url', e.target.value)}
                placeholder="https://instagram.com/sualoja"
              />
            </div>
            <div>
              <Label htmlFor="whatsappNumber" className="text-sm font-medium">WhatsApp da Loja</Label>
              <Input
                id="whatsappNumber"
                value={formSettings.whatsapp_number || ''}
                onChange={(e) => handleTextInput('whatsapp_number', e.target.value)}
                placeholder="5511999999999"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Mobile */}
        <Card className="order-2 lg:order-2 shadow-lg border-l-4 border-l-purple-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
              📱 Logo Mobile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mobileLogoUrl" className="text-sm font-medium">URL da Logo</Label>
              <Input
                id="mobileLogoUrl"
                value={formSettings.mobile_logo || ''}
                onChange={(e) => handleUrlInput('mobile_logo', e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                className={`mt-1 text-sm ${errors.mobile_logo ? 'border-red-500' : ''}`}
              />
              {errors.mobile_logo && <p className="text-red-500 text-sm mt-1">{errors.mobile_logo}</p>}
            </div>
            
            <RecommendedDimensions
              title="Logo Mobile"
              dimensions="200x200 pixels (quadrada)"
              description="Use uma imagem com fundo transparente (PNG) para melhor resultado. A logo aparecerá circular no mobile."
            />
            
            <div>
              <Label htmlFor="mobileLogoFile" className="text-sm font-medium">Ou faça upload</Label>
              <Input
                id="mobileLogoFile"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('mobile_logo', e)}
                className="mt-1"
                disabled={uploading}
              />
            </div>
            
            {(previewFiles.mobile_logo || formSettings.mobile_logo) && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2 font-medium">Preview:</p>
                <div className="w-20 h-20 bg-white/20 rounded-full overflow-hidden border border-gray-200 mx-auto lg:mx-0">
                  <img 
                    src={previewFiles.mobile_logo || formSettings.mobile_logo || ''} 
                    alt="Logo preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Banner Desktop */}
        <Card className="order-3 lg:order-3 shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-green-100 border-b">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              🖥️ Banner Desktop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="desktopBannerUrl" className="text-sm font-medium">URL do Banner</Label>
              <Input
                id="desktopBannerUrl"
                value={formSettings.desktop_banner || ''}
                onChange={(e) => handleUrlInput('desktop_banner', e.target.value)}
                placeholder="https://exemplo.com/banner.png"
                className="mt-1 text-sm"
              />
            </div>
            
            <RecommendedDimensions
              title="Banner Desktop"
              dimensions="1200x300 pixels (formato retangular)"
              description="Para telas de computador e tablets. Use imagens de alta qualidade com texto legível."
            />
            
            <div>
              <Label htmlFor="desktopBannerFile" className="text-sm font-medium">Ou faça upload</Label>
              <Input
                id="desktopBannerFile"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('desktop_banner', e)}
                className="mt-1"
                disabled={uploading}
              />
            </div>
            
            {(previewFiles.desktop_banner || formSettings.desktop_banner) && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2 font-medium">Preview:</p>
                <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={previewFiles.desktop_banner || formSettings.desktop_banner || ''} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Banner Mobile - Imagem ou Cor */}
        <Card className="order-4 lg:order-4 shadow-lg border-l-4 border-l-orange-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-orange-600" />
              </div>
              📱 Banner Mobile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload de Imagem */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Imagem do Banner</Label>
              <div>
                <Label htmlFor="mobileBannerUrl" className="text-xs text-gray-600">URL da Imagem</Label>
                <Input
                  id="mobileBannerUrl"
                  value={formSettings.mobile_banner_image || ''}
                  onChange={(e) => handleUrlInput('mobile_banner_image', e.target.value)}
                  placeholder="https://exemplo.com/banner.png"
                  className="mt-1 text-sm"
                />
              </div>
              
              <RecommendedDimensions
                title="Banner Mobile"
                dimensions="800x400 pixels (formato retangular)"
                description="Para telas de celular. Prefira imagens com elementos centralizados e texto legível em telas pequenas."
              />
              
              <div>
                <Label htmlFor="mobileBannerFile" className="text-xs text-gray-600">Ou faça upload</Label>
                <Input
                  id="mobileBannerFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('mobile_banner_image', e)}
                  className="mt-1"
                  disabled={uploading}
                />
              </div>

              {(previewFiles.mobile_banner_image || formSettings.mobile_banner_image) && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 font-medium">Preview da Imagem:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveImage('mobile_banner_image')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                  <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={previewFiles.mobile_banner_image || formSettings.mobile_banner_image || ''} 
                      alt="Banner mobile preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Separador */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-xs text-gray-500 bg-white">ou escolha uma cor</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Cores do Gradiente */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Cor de Fundo</Label>
              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                {gradientOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`h-12 lg:h-16 bg-gradient-to-br ${colorClasses[option.value]} rounded-lg cursor-pointer border-2 transition-all ${
                      formSettings.mobile_banner_color === option.value && !formSettings.mobile_banner_image
                        ? 'border-white shadow-lg scale-105' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const themeValue = option.value as 'verde' | 'roxo' | 'azul' | 'rosa' | 'laranja' | 'violeta';
                      setFormSettings(prev => ({ ...prev, mobile_banner_color: themeValue }));
                      setTheme(themeValue);
                    }}
                  >
                    <div className="h-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs lg:text-sm">{option.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de ação no final */}
      <div className="flex justify-center pt-4 lg:pt-6">
        <Button onClick={handleSave} size="lg" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" disabled={uploading}>
          <Save className="h-5 w-5 mr-2" />
          {uploading ? "Salvando..." : "Salvar e Aplicar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default StoreSettings;
