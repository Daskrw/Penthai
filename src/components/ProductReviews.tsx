import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Props {
  productId: string;
  onStatsChange?: (avg: number, count: number) => void;
}

const ProductReviews = ({ productId, onStatsChange }: Props) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [productId]);

  const load = async () => {
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    const list = data || [];
    setReviews(list);
    if (onStatsChange) {
      const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
      onStatsChange(avg, list.length);
    }
  };

  const submit = async () => {
    if (!user) {
      toast({ title: "กรุณาเข้าสู่ระบบ", description: "คุณต้องเข้าสู่ระบบก่อนรีวิว", variant: "destructive" });
      return;
    }
    if (!comment.trim()) {
      toast({ title: "กรุณาเขียนรีวิว", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    const userName = profile?.full_name || profile?.email?.split("@")[0] || "ผู้ใช้";

    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      user_name: userName,
      rating,
      comment: comment.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
    } else {
      setComment("");
      setRating(5);
      toast({ title: "ขอบคุณสำหรับรีวิว!" });
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("ลบรีวิวนี้?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) toast({ title: "ลบไม่สำเร็จ", variant: "destructive" });
    else load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">รีวิวจากลูกค้า ({reviews.length})</h2>
      </div>

      {/* Write Review */}
      <Card className="p-6 bg-card">
        <h3 className="font-semibold mb-3">เขียนรีวิว</h3>
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  s <= (hover || rating)
                    ? "fill-accent text-accent"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="แบ่งปันประสบการณ์การใช้สินค้า..."
          rows={3}
          className="mb-3"
        />
        <Button onClick={submit} disabled={submitting}>
          {submitting ? "กำลังส่ง..." : "ส่งรีวิว"}
        </Button>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสินค้านี้!</p>
        ) : (
          reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{r.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="flex mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{r.comment}</p>
                </div>
                {user?.id === r.user_id && (
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
