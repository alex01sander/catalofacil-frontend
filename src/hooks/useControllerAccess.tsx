
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useControllerAccess = () => {
  const { user } = useAuth();

  const { data: isControllerAdmin = false, isLoading } = useQuery({
    queryKey: ['controller_access', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, denying controller access');
        return false;
      }

      console.log('Checking controller access for user:', user.email);

      const { data, error } = await supabase
        .from('controller_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking controller access:', error);
        return false;
      }

      const hasAccess = !!data;
      console.log('Controller access result:', hasAccess);
      return hasAccess;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isControllerAdmin,
    loading: isLoading,
  };
};
