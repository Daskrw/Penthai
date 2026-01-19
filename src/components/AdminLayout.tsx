import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingCart, LogOut, ClipboardCheck, Home, Store, Newspaper, Users, MessageSquare, UserCog } from "lucide-react";
const AdminLayout = () => {
  const {
    signOut
  } = useAuth();
  const {
    isAdmin,
    isCommunityAdmin
  } = useUserRole();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  return <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">PenThai Admin</h1>
        </div>
        
        <nav className="px-4 space-y-2 flex-1">
          <Link to="/admin">
            <Button variant={isActive("/admin") ? "secondary" : "ghost"} className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          
          <Link to="/admin/orders">
            <Button variant={isActive("/admin/orders") ? "secondary" : "ghost"} className="w-full justify-start">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Orders
            </Button>
          </Link>
          
          <Link to="/admin/products">
            <Button variant={isActive("/admin/products") ? "secondary" : "ghost"} className="w-full justify-start">
              <Package className="mr-2 h-4 w-4" />
              Products
            </Button>
          </Link>
          
          {isAdmin && <>
              <Link to="/admin/enterprises">
                <Button variant={isActive("/admin/enterprises") ? "secondary" : "ghost"} className="w-full justify-start">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  ทะเบียนวิสาหกิจ
                </Button>
              </Link>
              
              <Link to="/admin/seller-requests">
                <Button variant={isActive("/admin/seller-requests") ? "secondary" : "ghost"} className="w-full justify-start">
                  <Store className="mr-2 h-4 w-4" />
                  คำขอจำหน่ายสินค้า
                </Button>
              </Link>
              
              <Link to="/admin/portfolio">
                <Button variant={isActive("/admin/portfolio") ? "secondary" : "ghost"} className="w-full justify-start">
                  <Newspaper className="mr-2 h-4 w-4" />
                  จัดการผลงาน/ข่าวสาร
                </Button>
              </Link>
              
              <Link to="/admin/communities">
                <Button variant={isActive("/admin/communities") ? "secondary" : "ghost"} className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  ​ เครือข่ายชุมชน
                </Button>
              </Link>
              
              <Link to="/admin/reviews">
                <Button variant={isActive("/admin/reviews") ? "secondary" : "ghost"} className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  จัดการรีวิว
                </Button>
              </Link>
              
              <Link to="/admin/users">
                <Button variant={isActive("/admin/users") ? "secondary" : "ghost"} className="w-full justify-start">
                  <UserCog className="mr-2 h-4 w-4" />
                  จัดการผู้ใช้งาน
                </Button>
              </Link>
            </>}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>;
};
export default AdminLayout;