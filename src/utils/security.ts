// Security utilities for enhanced protection

// Content Security Policy helper
export const getSecurityHeaders = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://unpkg.com", // For Supabase
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};

// CSRF token generation and validation
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const setCSRFToken = () => {
  const token = generateCSRFToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
};

export const getCSRFToken = (): string | null => {
  return sessionStorage.getItem('csrf_token');
};

export const validateCSRFToken = (token: string): boolean => {
  const storedToken = getCSRFToken();
  return storedToken === token;
};

// Secure session management
export const secureSessionStorage = {
  setItem: (key: string, value: string) => {
    try {
      const encrypted = btoa(value); // Basic encoding, should use proper encryption in production
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store secure session data:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const value = sessionStorage.getItem(key);
      return value ? atob(value) : null;
    } catch (error) {
      console.error('Failed to retrieve secure session data:', error);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
  },
  
  clear: () => {
    sessionStorage.clear();
  }
};

// Input sanitization for different contexts
export const sanitizeForHTML = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

export const sanitizeForAttribute = (input: string): string => {
  return input
    .replace(/['"<>&]/g, (match) => {
      const map: { [key: string]: string } = {
        '"': '&quot;',
        "'": '&#x27;',
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
      };
      return map[match];
    });
};

// URL validation and sanitization
export const sanitizeURL = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Remove potentially dangerous URL components
    urlObj.hash = '';
    
    return urlObj.toString();
  } catch {
    return null;
  }
};

// File security checks
export const isSecureFile = async (file: File): Promise<boolean> => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return false;
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return false;
  }
  
  // Check file signature
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 4);
      const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const validSignatures = [
        'ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', // JPEG
        '89504e47', // PNG
        '47494638', // GIF
        '52494646'  // WebP
      ];
      
      resolve(validSignatures.some(sig => header.startsWith(sig)));
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

// Security event logging
export interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'file_upload_blocked';
  details: Record<string, any>;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

const securityEvents: SecurityEvent[] = [];

export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp' | 'userAgent'>) => {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  };
  
  securityEvents.push(securityEvent);
  
  // Keep only last 100 events
  if (securityEvents.length > 100) {
    securityEvents.shift();
  }
  
  // In production, this should be sent to a logging service
  console.warn('Security Event:', securityEvent);
};

export const getSecurityEvents = (): SecurityEvent[] => {
  return [...securityEvents];
};

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use pelo menos 8 caracteres');
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua pelo menos uma letra minúscula');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua pelo menos uma letra maiúscula');
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua pelo menos um número');
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua pelo menos um caractere especial');
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  return { score, feedback };
};
