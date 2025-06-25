// Enhanced authentication security utilities

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

// Enhanced password validation with security requirements
export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Minimum length requirement
  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }

  // Character type requirements
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLowercase) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  if (!hasUppercase) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  if (!hasNumbers) {
    errors.push('A senha deve conter pelo menos um número');
  }
  if (!hasSymbols) {
    errors.push('A senha deve conter pelo menos um caractere especial');
  }

  // Common password patterns to avoid
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push('A senha não pode conter padrões comuns como "123456" ou "password"');
  }

  // Calculate strength
  const criteriasMet = [hasLowercase, hasUppercase, hasNumbers, hasSymbols, password.length >= 8].filter(Boolean).length;
  
  if (criteriasMet >= 5 && password.length >= 12) {
    strength = 'strong';
  } else if (criteriasMet >= 4) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

// Email validation with security considerations
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email é obrigatório' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email muito longo' };
  }
  
  return { isValid: true };
};

// Security event logging
export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failed' | 'password_change' | 'access_denied';
  userId?: string;
  email?: string;
  domain?: string;
  timestamp: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp' | 'userAgent'>) => {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.warn('Security Event:', securityEvent);
  }
  
  // In production, this should be sent to a security monitoring service
  // For now, we'll store in session storage for debugging
  try {
    const events = JSON.parse(sessionStorage.getItem('security_events') || '[]');
    events.push(securityEvent);
    // Keep only last 50 events
    if (events.length > 50) {
      events.splice(0, events.length - 50);
    }
    sessionStorage.setItem('security_events', JSON.stringify(events));
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Domain validation for security
export const validateDomain = (domain: string): { isValid: boolean; error?: string } => {
  if (!domain) {
    return { isValid: false, error: 'Domínio é obrigatório' };
  }
  
  if (domain.length > 253) {
    return { isValid: false, error: 'Domínio muito longo' };
  }
  
  if (domain.length === 0) {
    return { isValid: false, error: 'Domínio não pode estar vazio' };
  }
  
  // Check for valid domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]$/;
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: 'Formato de domínio inválido' };
  }
  
  // Check for consecutive dots or hyphens
  if (/[\-\.]{2,}/.test(domain)) {
    return { isValid: false, error: 'Domínio não pode ter pontos ou hífens consecutivos' };
  }
  
  return { isValid: true };
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};
