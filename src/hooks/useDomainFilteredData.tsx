
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainAccess } from '@/hooks/useDomainAccess';

export const useDomainFilteredData = () => {
  const { user } = useAuth();
  const { domainOwner, allowAccess, userId: domainUserId, currentDomain } = useDomainAccess();

  const effectiveUserId = useMemo(() => {
    // For localhost, use current user if authenticated
    const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
    if (isLocalhost) {
      return user?.id || null;
    }
    
    // For real domains, ONLY use domain owner's ID (security fix)
    // No fallback to current user - this was the security vulnerability
    return domainUserId || null;
  }, [domainUserId, user?.id, currentDomain]);

  // Only allow access if there's a valid effective user and domain access is allowed
  const secureAccess = !!effectiveUserId && allowAccess;

  // Security logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('Domain Filtered Data Security Check:', {
      effectiveUserId: effectiveUserId?.substring(0, 8) + '...',
      allowAccess,
      secureAccess,
      currentDomain,
      isDomainOwner: domainUserId === user?.id
    });
  }

  return {
    effectiveUserId,
    allowAccess: secureAccess,
    isDomainOwner: domainUserId === user?.id,
    domainOwner,
    isAuthenticated: !!user
  };
};
