import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "admin" | "community_admin" | "moderator" | "user";

interface UserRoleInfo {
  role: UserRole | null;
  communityId: string | null;
  isAdmin: boolean;
  isCommunityAdmin: boolean;
  loading: boolean;
}

export const useUserRole = (): UserRoleInfo => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setCommunityId(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        // Check for admin role first
        const { data: adminRole } = await supabase
          .from("user_roles")
          .select("role, community_id")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (adminRole) {
          setRole("admin");
          setCommunityId(null);
          setLoading(false);
          return;
        }

        // Check for community_admin role
        const { data: communityAdminRole } = await supabase
          .from("user_roles")
          .select("role, community_id")
          .eq("user_id", user.id)
          .eq("role", "community_admin")
          .maybeSingle();

        if (communityAdminRole) {
          setRole("community_admin");
          setCommunityId(communityAdminRole.community_id);
          setLoading(false);
          return;
        }

        // Default to user role
        setRole("user");
        setCommunityId(null);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("user");
        setCommunityId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    communityId,
    isAdmin: role === "admin",
    isCommunityAdmin: role === "community_admin",
    loading,
  };
};
