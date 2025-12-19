import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "./AdminLayout";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Shop from "@/pages/Shop";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Account from "@/pages/Account";
import Dashboard from "@/pages/admin/Dashboard";
import Orders from "@/pages/admin/Orders";
import Products from "@/pages/admin/Products";
import Enterprises from "@/pages/admin/Enterprises";
import SellerRequests from "@/pages/admin/SellerRequests";
import AdminPortfolio from "@/pages/admin/Portfolio";
import AdminCommunities from "@/pages/admin/Communities";
import AdminReviews from "@/pages/admin/Reviews";
import NotFound from "@/pages/NotFound";
import CommunityRegistration from "@/pages/CommunityRegistration";
import SellerRegistration from "@/pages/SellerRegistration";
import OurWork from "@/pages/OurWork";
import CommunitySupport from "@/pages/CommunitySupport";
import Reviews from "@/pages/Reviews";
import RegisterEnterprise from "@/pages/RegisterEnterprise";
import CheckStatus from "@/pages/CheckStatus";
import RenewRegistration from "@/pages/RenewRegistration";
import Documents from "@/pages/Documents";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <PageTransition><Checkout /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/order-success" element={
          <ProtectedRoute>
            <PageTransition><OrderSuccess /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/community-registration" element={<PageTransition><CommunityRegistration /></PageTransition>} />
        <Route path="/seller-registration" element={<PageTransition><SellerRegistration /></PageTransition>} />
        <Route path="/our-work" element={<PageTransition><OurWork /></PageTransition>} />
        <Route path="/community-support" element={<PageTransition><CommunitySupport /></PageTransition>} />
        <Route path="/register-enterprise" element={<PageTransition><RegisterEnterprise /></PageTransition>} />
        <Route path="/check-status" element={<PageTransition><CheckStatus /></PageTransition>} />
        <Route path="/renew-registration" element={<PageTransition><RenewRegistration /></PageTransition>} />
        <Route path="/documents" element={<PageTransition><Documents /></PageTransition>} />
        <Route path="/reviews" element={<PageTransition><Reviews /></PageTransition>} />
        <Route path="/account" element={
          <ProtectedRoute>
            <PageTransition><Account /></PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Admin Routes - no transition for nested routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="enterprises" element={<Enterprises />} />
          <Route path="seller-requests" element={<SellerRequests />} />
          <Route path="portfolio" element={<AdminPortfolio />} />
          <Route path="communities" element={<AdminCommunities />} />
          <Route path="reviews" element={<AdminReviews />} />
        </Route>

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
