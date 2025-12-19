import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    image_url: string;
    stock: number;
    community_id: string | null;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number, productId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get or create cart
      let { data: cart } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from("cart")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        cart = newCart;
      }

      if (cart) {
        // Load cart items
        const { data: cartItems } = await supabase
          .from("cart_items")
          .select(`
            id,
            product_id,
            quantity,
            products (
              name,
              price,
              image_url,
              stock,
              community_id
            )
          `)
          .eq("cart_id", cart.id);

        if (cartItems) {
          setItems(cartItems.map(item => ({
            ...item,
            product: item.products as any
          })));
        }
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get or create cart
      let { data: cart } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from("cart")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        cart = newCart;
      }

      if (cart) {
        // Check product stock first
        const { data: product } = await supabase
          .from("products")
          .select("stock, name")
          .eq("id", productId)
          .single();

        if (!product || product.stock <= 0) {
          toast({
            title: "สินค้าหมด",
            description: "Sorry, this item is out of stock",
            variant: "destructive"
          });
          return;
        }

        // Check if item already exists
        const { data: existingItem } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("cart_id", cart.id)
          .eq("product_id", productId)
          .maybeSingle();

        if (existingItem) {
          // Check if adding one more exceeds stock
          if (existingItem.quantity >= product.stock) {
            toast({
              title: "Stock limit reached",
              description: `Only ${product.stock} items available`,
              variant: "destructive"
            });
            return;
          }
          // Update quantity
          await supabase
            .from("cart_items")
            .update({ quantity: existingItem.quantity + 1 })
            .eq("id", existingItem.id);
        } else {
          // Add new item
          await supabase
            .from("cart_items")
            .insert({
              cart_id: cart.id,
              product_id: productId,
              quantity: 1
            });
        }

        await loadCart();
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart"
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      await loadCart();
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart"
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number, productId?: string) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      // Check stock limit if productId provided
      if (productId) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", productId)
          .single();

        if (product && quantity > product.stock) {
          toast({
            title: "Stock limit reached",
            description: `Only ${product.stock} items available`,
            variant: "destructive"
          });
          return;
        }
      }

      await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);

      await loadCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { data: cart } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cart) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cart.id);

        await loadCart();
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const cartTotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartTotal, 
      cartCount,
      loading 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};