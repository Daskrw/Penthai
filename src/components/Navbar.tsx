import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User, Search, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import penthaiLogo from "@/assets/penthai-logo.png";
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const {
    cartCount
  } = useCart();
  const navigate = useNavigate();
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  return <nav className="sticky top-0 z-50 bg-card shadow-md">
      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground py-2 text-center text-sm">
        <p>🎉 จัดส่งฟรีเมื่อสั่งซื้อครบ 499 บาท!</p>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={penthaiLogo} alt="PENTHAI Logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-primary">PENTHAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10 lg:space-x-12">
            <Link to="/" className="text-lg lg:text-xl font-semibold text-foreground hover:text-primary transition-colors">
              หน้าแรก
            </Link>
            <Link to="/shop" className="text-lg lg:text-xl font-semibold text-foreground hover:text-primary transition-colors">
              สินค้า
            </Link>
            <Link to="/about" className="text-lg lg:text-xl font-semibold text-foreground hover:text-primary transition-colors">
              เกี่ยวกับเรา
            </Link>
            <Link to="/contact" className="text-lg lg:text-xl font-semibold text-foreground hover:text-primary transition-colors">
              ติดต่อเรา
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>
            
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    บัญชีของฉัน
                  </DropdownMenuItem>
                  {isAdmin && <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        แผงควบคุมผู้ดูแล
                      </DropdownMenuItem>
                    </>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
                <User className="h-5 w-5" />
              </Button>}

            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>}
            </Button>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-foreground hover:text-primary transition-colors py-2" onClick={toggleMenu}>
                หน้าแรก
              </Link>
              <Link to="/shop" className="text-foreground hover:text-primary transition-colors py-2" onClick={toggleMenu}>
                สินค้า
              </Link>
              <Link to="/about" className="text-foreground hover:text-primary transition-colors py-2" onClick={toggleMenu}>
                เกี่ยวกับเรา
              </Link>
              <Link to="/contact" className="text-foreground hover:text-primary transition-colors py-2" onClick={toggleMenu}>
                ติดต่อเรา
              </Link>
              <div className="pt-4 border-t border-border">
                <Button variant="outline" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
              </div>
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;