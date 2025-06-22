
// Input validation utilities for security

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email é obrigatório';
  if (!emailRegex.test(email)) return 'Email inválido';
  if (email.length > 254) return 'Email muito longo';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Senha é obrigatória';
  if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
  if (password.length > 100) return 'Senha muito longa';
  return null;
};

export const validateStoreName = (name: string): string | null => {
  if (!name) return 'Nome da loja é obrigatório';
  if (name.trim().length < 2) return 'Nome da loja deve ter pelo menos 2 caracteres';
  if (name.length > 100) return 'Nome da loja muito longo (máximo 100 caracteres)';
  return null;
};

export const validateStoreDescription = (description: string): string | null => {
  if (description && description.length > 1000) return 'Descrição muito longa (máximo 1000 caracteres)';
  return null;
};

export const validateCategoryName = (name: string): string | null => {
  if (!name) return 'Nome da categoria é obrigatório';
  if (name.trim().length < 2) return 'Nome da categoria deve ter pelo menos 2 caracteres';
  if (name.length > 50) return 'Nome da categoria muito longo (máximo 50 caracteres)';
  return null;
};

export const validateProductName = (name: string): string | null => {
  if (!name) return 'Nome do produto é obrigatório';
  if (name.trim().length < 2) return 'Nome do produto deve ter pelo menos 2 caracteres';
  if (name.length > 100) return 'Nome do produto muito longo (máximo 100 caracteres)';
  return null;
};

export const validateProductDescription = (description: string): string | null => {
  if (description && description.length > 2000) return 'Descrição muito longa (máximo 2000 caracteres)';
  return null;
};

export const validatePrice = (price: number): string | null => {
  if (price < 0) return 'Preço não pode ser negativo';
  if (price > 999999.99) return 'Preço muito alto';
  return null;
};

export const validateStock = (stock: number): string | null => {
  if (stock < 0) return 'Estoque não pode ser negativo';
  if (stock > 999999) return 'Estoque muito alto';
  return null;
};

export const validateImageUrl = (url: string): string | null => {
  if (!url) return null; // URL is optional
  
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    if (!validProtocols.includes(urlObj.protocol)) {
      return 'URL deve usar protocolo HTTP ou HTTPS';
    }
    
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      return 'URL deve apontar para uma imagem válida (.jpg, .jpeg, .png, .gif, .webp)';
    }
    
    return null;
  } catch {
    return 'URL inválida';
  }
};

export const validateFileUpload = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return 'Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP';
  }
  
  if (file.size > maxSize) {
    return 'Arquivo muito grande. Máximo 5MB';
  }
  
  return null;
};

export const sanitizeText = (text: string): string => {
  return text.trim().replace(/[<>]/g, '');
};
