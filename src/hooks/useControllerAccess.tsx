
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useControllerAccess = () => {
  const { user } = useAuth();

  const { data: isControllerAdmin = false, isLoading } = useQuery({
    queryKey: ['controller_access', user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('controller_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking controller access:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user,
  });

  return {
    isControllerAdmin,
    loading: isLoading,
  };
};
