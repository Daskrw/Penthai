import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, CreditCard, Star, Building2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: string;
  card_brand: string | null;
  last_four: string | null;
  cardholder_name: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  bank_name: string | null;
  is_default: boolean;
}

const cardBrandIcons: Record<string, string> = {
  visa: "💳",
  mastercard: "💳",
  amex: "💳",
};

const PaymentMethodManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [methodType, setMethodType] = useState<"card" | "promptpay" | "bank_transfer">("card");
  const [formData, setFormData] = useState({
    cardholder_name: "",
    last_four: "",
    expiry_month: "",
    expiry_year: "",
    card_brand: "visa",
    bank_name: "",
    is_default: false,
  });

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ["user-payment-methods", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_payment_methods")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentMethod[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (formData.is_default) {
        await supabase
          .from("user_payment_methods")
          .update({ is_default: false })
          .eq("user_id", user!.id);
      }

      const insertData = {
        user_id: user!.id,
        method_type: methodType,
        is_default: formData.is_default,
        card_brand: methodType === "card" ? formData.card_brand : null,
        last_four: methodType === "card" ? formData.last_four : null,
        cardholder_name: methodType === "card" ? formData.cardholder_name : null,
        expiry_month: methodType === "card" ? parseInt(formData.expiry_month) : null,
        expiry_year: methodType === "card" ? parseInt(formData.expiry_year) : null,
        bank_name: methodType === "bank_transfer" ? formData.bank_name : null,
      };

      const { error } = await supabase.from("user_payment_methods").insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] });
      toast({ title: "Success", description: "Payment method added" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] });
      toast({ title: "Success", description: "Payment method removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("user_payment_methods")
        .update({ is_default: false })
        .eq("user_id", user!.id);
      
      const { error } = await supabase
        .from("user_payment_methods")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] });
      toast({ title: "Success", description: "Default payment method updated" });
    },
  });

  const resetForm = () => {
    setFormData({
      cardholder_name: "",
      last_four: "",
      expiry_month: "",
      expiry_year: "",
      card_brand: "visa",
      bank_name: "",
      is_default: false,
    });
    setMethodType("card");
    setDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.method_type) {
      case "card":
        return <CreditCard className="h-5 w-5" />;
      case "promptpay":
        return <QrCode className="h-5 w-5" />;
      case "bank_transfer":
        return <Building2 className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method.method_type) {
      case "card":
        return `${method.card_brand?.toUpperCase() || "Card"} ending in ${method.last_four}`;
      case "promptpay":
        return "PromptPay";
      case "bank_transfer":
        return `Bank Transfer - ${method.bank_name}`;
      default:
        return method.method_type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage your payment options</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Method
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(method)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getMethodLabel(method)}</span>
                        {method.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.method_type === "card" && method.expiry_month && method.expiry_year && (
                        <p className="text-sm text-muted-foreground">
                          Expires {method.expiry_month}/{method.expiry_year}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!method.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(method.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Remove this payment method?")) {
                          deleteMutation.mutate(method.id);
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
            No payment methods saved yet
          </p>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Choose a payment method type
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <RadioGroup
              value={methodType}
              onValueChange={(value) => setMethodType(value as typeof methodType)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <CreditCard className="mb-2 h-6 w-6" />
                  <span className="text-sm">Credit Card</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="promptpay" id="promptpay" className="peer sr-only" />
                <Label
                  htmlFor="promptpay"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <QrCode className="mb-2 h-6 w-6" />
                  <span className="text-sm">PromptPay</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="bank_transfer" id="bank_transfer" className="peer sr-only" />
                <Label
                  htmlFor="bank_transfer"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Building2 className="mb-2 h-6 w-6" />
                  <span className="text-sm">Bank</span>
                </Label>
              </div>
            </RadioGroup>

            {methodType === "card" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardholder_name">Cardholder Name</Label>
                  <Input
                    id="cardholder_name"
                    value={formData.cardholder_name}
                    onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="last_four">Last 4 Digits</Label>
                    <Input
                      id="last_four"
                      maxLength={4}
                      value={formData.last_four}
                      onChange={(e) => setFormData({ ...formData, last_four: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      placeholder="4242"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card_brand">Card Type</Label>
                    <select
                      id="card_brand"
                      value={formData.card_brand}
                      onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
                      className="w-full h-10 px-3 border border-input rounded-md bg-background"
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry_month">Expiry Month</Label>
                    <Input
                      id="expiry_month"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.expiry_month}
                      onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })}
                      placeholder="12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_year">Expiry Year</Label>
                    <Input
                      id="expiry_year"
                      type="number"
                      min="2024"
                      max="2040"
                      value={formData.expiry_year}
                      onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })}
                      placeholder="2025"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {methodType === "bank_transfer" && (
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="e.g., Bangkok Bank"
                  required
                />
              </div>
            )}

            {methodType === "promptpay" && (
              <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                PromptPay is ready for quick payments. No additional setup needed.
              </p>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default_payment"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_default_payment" className="text-sm font-normal cursor-pointer">
                Set as default payment method
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Method"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PaymentMethodManagement;
