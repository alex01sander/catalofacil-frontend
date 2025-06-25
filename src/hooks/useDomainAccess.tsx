
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DomainOwner {
  id: string;
  domain: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useDomainAccess = () => {
  const { user } = useAuth();
  const [currentDomain, setCurrentDomain] = useState<string>('');

  useEffect(() => {
    // Get current domain securely
    const domain = window.location.hostname;
    setCurrentDomain(domain);
  }, []);

  const fetchDomainOwnership = async (): Promise<DomainOwner | null> => {
    if (!currentDomain) return null;

    // Only controller admins can access domain ownership data now
    const { data, error } = await supabase
      .from('domain_owners')
      .select('*')
      .eq('domain', currentDomain)
      .maybeSingle();

    if (error) {
      // Log security events for failed domain access attempts
      console.warn('Domain access attempt:', {
        domain: currentDomain,
        userId: user?.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return null;
    }

    return data;
  };

  const {
    data: domainOwner,
    isLoading,
    error
  } = useQuery({
    queryKey: ['domain_ownership', currentDomain],
    queryFn: fetchDomainOwnership,
    enabled: !!currentDomain,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: false // Don't retry failed domain access attempts
  });

  // Check if current user is domain owner
  const isOwner = user && domainOwner && user.id === domainOwner.user_id;
  
  // Secure localhost handling for development only
  const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
  
  // SECURE ACCESS CONTROL: Only allow access if:
  // 1. localhost (development environment)
  // 2. User is confirmed domain owner
  // 3. NO fallback for unconfigured domains (security fix)
  const allowAccess = isLocalhost || !!isOwner;

  // Security logging (remove sensitive data in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Domain Access Control:', {
      currentDomain,
      userId: user?.id?.substring(0, 8) + '...',
      hasUser: !!user,
      isOwner: !!isOwner,
      allowAccess,
      isLocalhost
    });
  }

  return {
    currentDomain,
    domainOwner,
    isOwner: !!isOwner,
    allowAccess,
    loading: isLoading,
    error,
    userId: domainOwner?.user_id
  };
};
