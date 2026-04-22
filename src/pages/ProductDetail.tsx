import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Heart, Minus, Plus, ArrowLeft, Star, Truck, Shield, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import ProductReviews from "@/components/ProductReviews";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category: string;
  stock: number;
  product_type: string;
  subcategory_id: string | null;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [subcategoryName, setSubcategoryName] = useState<string | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (data) {
      setProduct(data as Product);
      if (data.subcategory_id) {
        const { data: sub } = await supabase
          .from("subcategories")
          .select("name")
          .eq("id", data.subcategory_id)
          .maybeSingle();
        setSubcategoryName(sub?.name || null);
      }
      // Related products
      const { data: rel } = await supabase
        .from("products")
        .select("*")
        .eq("category", data.category)
        .eq("is_archived", false)
        .neq("id", data.id)
        .limit(4);
      setRelated((rel as Product[]) || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      await addToCart(product.id);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">ไม่พบสินค้า</h1>
          <Button onClick={() => navigate("/shop")}>กลับไปหน้าสินค้า</Button>
        </div>
        <Footer />
      </>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> ย้อนกลับ
          </Button>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted shadow-md">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className={`w-full h-full object-cover ${isOutOfStock ? "opacity-60 grayscale" : ""}`}
              />
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge variant="destructive" className="text-xl px-6 py-3 font-bold">
                    สินค้าหมด
                  </Badge>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                {subcategoryName && <Badge variant="outline">{subcategoryName}</Badge>}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-5 w-5 ${
                        s <= Math.round(avgRating) ? "fill-accent text-accent" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {avgRating > 0 ? avgRating.toFixed(1) : "ยังไม่มีคะแนน"} ({reviewCount} รีวิว)
                </span>
              </div>

              <div className="text-4xl font-bold text-primary mb-6">฿{product.price.toLocaleString()}</div>

              <div className="mb-6">
                <h2 className="font-semibold text-foreground mb-2">รายละเอียดสินค้า</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description || "ยังไม่มีคำอธิบายสินค้า"}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  คงเหลือ: <span className={`font-semibold ${isOutOfStock ? "text-destructive" : "text-foreground"}`}>
                    {product.stock} ชิ้น
                  </span>
                </p>
              </div>

              {!isOutOfStock && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-semibold">จำนวน:</span>
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mb-6">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isOutOfStock ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
                </Button>
                <Button variant="outline" size="lg" onClick={() => setFavorite(!favorite)}>
                  <Heart className={favorite ? "fill-primary text-primary" : ""} />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t">
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">จัดส่งทั่วไทย</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">ของแท้ 100%</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <Package className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">บรรจุอย่างดี</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mb-12">
            <ProductReviews
              productId={product.id}
              onStatsChange={(avg, count) => {
                setAvgRating(avg);
                setReviewCount(count);
              }}
            />
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">สินค้าที่เกี่ยวข้อง</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((r) => (
                  <Link key={r.id} to={`/product/${r.id}`}>
                    <Card className="overflow-hidden hover:shadow-thai-lg transition-shadow">
                      <div className="aspect-square bg-muted overflow-hidden">
                        <img
                          src={r.image_url || "/placeholder.svg"}
                          alt={r.name}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold line-clamp-2 text-sm mb-1">{r.name}</h3>
                        <p className="text-primary font-bold">฿{r.price.toLocaleString()}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;
