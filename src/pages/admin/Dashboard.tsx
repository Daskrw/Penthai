import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

const Dashboard = () => {
  const { isAdmin, isCommunityAdmin, communityId, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading) {
      loadStats();
    }
  }, [roleLoading, isAdmin, isCommunityAdmin, communityId]);

  const loadStats = async () => {
    try {
      setLoading(true);

      if (isCommunityAdmin && communityId) {
        // Community admin: filter by their community
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("community_id", communityId)
          .eq("is_archived", false);

        // Get order IDs that contain this community's products
        const { data: orderItemsWithCommunity } = await supabase
          .from("order_items")
          .select("order_id, product_price, quantity")
          .eq("community_id", communityId);

        const orderIds = [...new Set(orderItemsWithCommunity?.map(item => item.order_id) || [])];
        
        let ordersCount = 0;
        let pendingCount = 0;
        let revenue = 0;

        if (orderIds.length > 0) {
          const { data: orders, count } = await supabase
            .from("orders")
            .select("id, status, total", { count: "exact" })
            .in("id", orderIds);

          ordersCount = count || 0;
          pendingCount = orders?.filter(o => o.status === "pending").length || 0;
          
          // Calculate revenue from paid/shipped/delivered orders for this community's items
          const paidOrders = orders?.filter(o => ["paid", "shipped", "delivered"].includes(o.status)) || [];
          const paidOrderIds = paidOrders.map(o => o.id);
          
          revenue = orderItemsWithCommunity
            ?.filter(item => paidOrderIds.includes(item.order_id))
            .reduce((sum, item) => sum + (item.product_price * item.quantity), 0) || 0;
        }

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount,
          totalRevenue: revenue,
          pendingOrders: pendingCount,
        });
      } else if (isAdmin) {
        // Super admin: get all data
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_archived", false);

        const { data: orders, count: ordersCount } = await supabase
          .from("orders")
          .select("id, status, total", { count: "exact" });

        const pendingCount = orders?.filter(o => o.status === "pending").length || 0;
        const revenue = orders
          ?.filter(o => ["paid", "shipped", "delivered"].includes(o.status))
          .reduce((sum, o) => sum + o.total, 0) || 0;

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          totalRevenue: revenue,
          pendingOrders: pendingCount,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {isCommunityAdmin ? "Community Overview" : "System Overview"}
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {isCommunityAdmin ? "Your community products" : "Products in catalog"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders > 0 && (
                <span className="text-yellow-600">{stats.pendingOrders} pending</span>
              )}
              {stats.pendingOrders === 0 && "All orders processed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From paid orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
