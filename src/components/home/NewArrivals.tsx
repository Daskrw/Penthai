import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock: number;
}
const NewArrivals = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadNewArrivals();
  }, []);
  const loadNewArrivals = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("products").select("id, name, price, image_url, stock").order("created_at", {
        ascending: false
      }).limit(4);
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading new arrivals:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
            สินค้ามาใหม่
          </h2>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>;
  }
  if (products.length === 0) {
    return null;
  }
  return <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            สินค้ามาใหม่
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">สินค้าใหม่ล่าสุดจากชุมชนไทย คัดสรรมาเพื่อคุณโดยเฉพาะ</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => <ProductCard key={product.id} id={product.id} name={product.name} price={product.price} image={product.image_url || "/placeholder.svg"} rating={4.5} reviews={0} stock={product.stock} />)}
        </div>

        <div className="text-center mt-10">
          <Button asChild size="lg" variant="outline">
            <Link to="/shop">
              ดูสินค้าทั้งหมด
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>;
};
export default NewArrivals;