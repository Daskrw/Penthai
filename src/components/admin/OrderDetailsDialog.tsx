import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Clock, Truck, Ban, User, Phone, MapPin, Package } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shipping_fee: number;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  payment_slip_url: string | null;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
}

interface OrderDetailsDialogProps {
  order: Order | null;
  orderItems: OrderItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onApprove: (order: Order) => void;
  onReject: (order: Order) => void;
  isUpdating: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500", icon: <Clock className="h-4 w-4" /> },
  paid: { label: "Paid", color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" /> },
  shipped: { label: "Shipped", color: "bg-purple-500", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "Delivered", color: "bg-green-600", icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: <Ban className="h-4 w-4" /> },
};

const OrderDetailsDialog = ({
  order,
  orderItems,
  open,
  onOpenChange,
  onStatusChange,
  onApprove,
  onReject,
  isUpdating,
}: OrderDetailsDialogProps) => {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order {order.order_number}</span>
            <Badge className={`${statusConfig[order.status].color} text-white`}>
              <span className="flex items-center gap-1">
                {statusConfig[order.status].icon}
                {statusConfig[order.status].label}
              </span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Placed on {new Date(order.created_at).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="whitespace-pre-wrap">{order.shipping_address}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items ({orderItems.length})
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              {orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ฿{item.product_price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ฿{(item.product_price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>฿{order.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>฿{order.shipping_fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>฿{order.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No items found</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Slip */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Payment Proof</h3>
            {order.payment_slip_url ? (
              <div className="flex justify-center">
                <img
                  src={order.payment_slip_url}
                  alt="Payment slip"
                  className="max-h-80 rounded-lg border shadow-sm"
                />
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No payment slip uploaded</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Status Management */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Status Management</h3>
            {order.status === "pending" ? (
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove(order)}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Payment
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => onReject(order)}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Order
                </Button>
              </div>
            ) : (
              <Select
                value={order.status}
                onValueChange={(value) => onStatusChange(order.id, value as OrderStatus)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
