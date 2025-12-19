import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, UserPlus, Shield, Users } from "lucide-react";

interface Community {
  id: string;
  name: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "community_admin" | "moderator" | "user";
  community_id: string | null;
  created_at: string;
  profile?: {
    email: string;
    full_name: string | null;
  };
  community?: {
    name: string;
  };
}

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "community_admin" as "admin" | "community_admin",
    communityId: "",
  });

  const { data: communities } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_profiles")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data as Community[];
    },
  });

  const { data: userRoles, isLoading } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          community_id,
          created_at
        `)
        .in("role", ["admin", "community_admin"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for these users
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);
      
      // Fetch communities
      const communityIds = data.filter(r => r.community_id).map(r => r.community_id);
      const { data: communityData } = await supabase
        .from("community_profiles")
        .select("id, name")
        .in("id", communityIds);
      
      return data.map(role => ({
        ...role,
        profile: profiles?.find(p => p.id === role.user_id),
        community: communityData?.find(c => c.id === role.community_id),
      })) as UserRole[];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Add role
      const roleData = {
        user_id: authData.user.id,
        role: data.role as 'admin' | 'community_admin' | 'user',
        community_id: data.role === "community_admin" && data.communityId ? data.communityId : null,
      };

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert(roleData);

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({
        title: "User created",
        description: "The admin user has been created successfully.",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({
        title: "Role removed",
        description: "The admin role has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove role.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
      role: "community_admin",
      communityId: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.role === "community_admin" && !formData.communityId) {
      toast({
        title: "Error",
        description: "Please select a community for the community admin.",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate(formData);
  };

  const handleDeleteRole = (roleId: string) => {
    if (!confirm("Are you sure you want to remove this admin role?")) return;
    deleteRoleMutation.mutate(roleId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage admin and community admin users</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin or community admin user
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "community_admin") => 
                    setFormData({ ...formData, role: value, communityId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Super Admin
                      </span>
                    </SelectItem>
                    <SelectItem value="community_admin">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Community Admin
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.role === "community_admin" && (
                <div className="space-y-2">
                  <Label htmlFor="community">Assigned Community</Label>
                  <Select
                    value={formData.communityId}
                    onValueChange={(value) => setFormData({ ...formData, communityId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities?.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users ({userRoles?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles?.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {role.profile?.full_name || "-"}
                  </TableCell>
                  <TableCell>{role.profile?.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={role.role === "admin" ? "default" : "secondary"}>
                      {role.role === "admin" ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Community Admin
                        </span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {role.community?.name || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(role.created_at).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {userRoles?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No admin users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
