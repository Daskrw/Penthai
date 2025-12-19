import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, MapPin, Star, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  is_default: boolean;
}

const AddressManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    recipient_name: "",
    phone_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    is_default: false,
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["user-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.is_default) {
        // Remove default from other addresses first
        await supabase
          .from("user_addresses")
          .update({ is_default: false })
          .eq("user_id", user!.id);
      }

      if (data.id) {
        const { error } = await supabase
          .from("user_addresses")
          .update({
            recipient_name: data.recipient_name,
            phone_number: data.phone_number,
            address_line1: data.address_line1,
            address_line2: data.address_line2 || null,
            city: data.city,
            postal_code: data.postal_code,
            is_default: data.is_default,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_addresses").insert({
          user_id: user!.id,
          recipient_name: data.recipient_name,
          phone_number: data.phone_number,
          address_line1: data.address_line1,
          address_line2: data.address_line2 || null,
          city: data.city,
          postal_code: data.postal_code,
          is_default: data.is_default,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      toast({ title: "Success", description: editingAddress ? "Address updated" : "Address saved" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      toast({ title: "Success", description: "Address deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user!.id);
      
      const { error } = await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      toast({ title: "Success", description: "Default address updated" });
    },
  });

  const resetForm = () => {
    setEditingAddress(null);
    setFormData({
      recipient_name: "",
      phone_number: "",
      address_line1: "",
      address_line2: "",
      city: "",
      postal_code: "",
      is_default: false,
    });
    setDialogOpen(false);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      recipient_name: address.recipient_name,
      phone_number: address.phone_number,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingAddress ? { ...formData, id: editingAddress.id } : formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Addresses
            </CardTitle>
            <CardDescription>Manage your delivery addresses</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Address
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : addresses && addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{address.recipient_name}</span>
                      {address.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{address.phone_number}</p>
                    <p className="text-sm mt-1">
                      {address.address_line1}
                      {address.address_line2 && `, ${address.address_line2}`}
                    </p>
                    <p className="text-sm">{address.city}, {address.postal_code}</p>
                  </div>
                  <div className="flex gap-1">
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDefaultMutation.mutate(address.id)}
                        title="Set as default"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(address)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this address?")) {
                          deleteMutation.mutate(address.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No addresses saved yet
          </p>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <DialogDescription>
              Enter the shipping address details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_name">Recipient Name</Label>
                <Input
                  id="recipient_name"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City/Province</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">
                Set as default address
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Address"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AddressManagement;
