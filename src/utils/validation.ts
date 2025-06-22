
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
  
  // Enhanced password validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número';
  }
  
  return null;
};

export const validateStoreName = (name: string): string | null => {
  if (!name) return 'Nome da loja é obrigatório';
  const sanitized = sanitizeText(name);
  if (sanitized.trim().length < 2) return 'Nome da loja deve ter pelo menos 2 caracteres';
  if (sanitized.length > 100) return 'Nome da loja muito longo (máximo 100 caracteres)';
  return null;
};

export const validateStoreDescription = (description: string): string | null => {
  if (description) {
    const sanitized = sanitizeText(description);
    if (sanitized.length > 1000) return 'Descrição muito longa (máximo 1000 caracteres)';
  }
  return null;
};

export const validateCategoryName = (name: string): string | null => {
  if (!name) return 'Nome da categoria é obrigatório';
  const sanitized = sanitizeText(name);
  if (sanitized.trim().length < 2) return 'Nome da categoria deve ter pelo menos 2 caracteres';
  if (sanitized.length > 50) return 'Nome da categoria muito longo (máximo 50 caracteres)';
  return null;
};

export const validateProductName = (name: string): string | null => {
  if (!name) return 'Nome do produto é obrigatório';
  const sanitized = sanitizeText(name);
  if (sanitized.trim().length < 2) return 'Nome do produto deve ter pelo menos 2 caracteres';
  if (sanitized.length > 100) return 'Nome do produto muito longo (máximo 100 caracteres)';
  return null;
};

export const validateProductDescription = (description: string): string | null => {
  if (description) {
    const sanitized = sanitizeText(description);
    if (sanitized.length > 2000) return 'Descrição muito longa (máximo 2000 caracteres)';
  }
  return null;
};

export const validatePrice = (price: number): string | null => {
  if (isNaN(price)) return 'Preço deve ser um número válido';
  if (price < 0) return 'Preço não pode ser negativo';
  if (price > 999999.99) return 'Preço muito alto';
  return null;
};

export const validateStock = (stock: number): string | null => {
  if (isNaN(stock)) return 'Estoque deve ser um número válido';
  if (stock < 0) return 'Estoque não pode ser negativo';
  if (stock > 999999) return 'Estoque muito alto';
  if (!Number.isInteger(stock)) return 'Estoque deve ser um número inteiro';
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
  
  // Enhanced security: Check file signature (magic numbers)
  return validateFileSignature(file);
};

const validateFileSignature = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }
      
      // Check magic numbers for common image formats
      const validSignatures = [
        'ffd8ffe0', // JPEG
        'ffd8ffe1', // JPEG
        'ffd8ffe2', // JPEG
        '89504e47', // PNG
        '47494638', // GIF
        '52494646', // WebP (RIFF)
      ];
      
      const isValidSignature = validSignatures.some(sig => header.startsWith(sig));
      resolve(isValidSignature ? null : 'Arquivo não é uma imagem válida');
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

// Enhanced sanitization with XSS protection
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
};

// Sanitize HTML content for rich text fields
export const sanitizeHtml = (html: string): string => {
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/gi;
  
  return html.replace(tagRegex, (match, tagName) => {
    return allowedTags.includes(tagName.toLowerCase()) ? match : '';
  });
};

// Rate limiting for authentication attempts
let authAttempts: { [key: string]: { count: number; lastAttempt: number } } = {};

export const checkRateLimit = (identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const attempts = authAttempts[identifier];
  
  if (!attempts) {
    authAttempts[identifier] = { count: 1, lastAttempt: now };
    return true;
  }
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > windowMs) {
    authAttempts[identifier] = { count: 1, lastAttempt: now };
    return true;
  }
  
  // Check if limit exceeded
  if (attempts.count >= maxAttempts) {
    return false;
  }
  
  // Increment count
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  
  Object.keys(authAttempts).forEach(key => {
    if (now - authAttempts[key].lastAttempt > windowMs) {
      delete authAttempts[key];
    }
  });
}, 5 * 60 * 1000); // Clean up every 5 minutes
