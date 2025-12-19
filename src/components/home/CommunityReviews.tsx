import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import ReviewModal from "./ReviewModal";
import ScrollReveal from "@/components/ScrollReveal";

const CommunityReviews = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reviews, refetch } = useQuery({
    queryKey: ["site-reviews-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-accent text-accent" : "text-muted-foreground/30"
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              เสียงตอบรับจากสมาชิก PENTHAI
            </h2>
            <p className="text-muted-foreground text-lg">
              ฟังเสียงจากชุมชนของเรา
            </p>
          </div>
        </ScrollReveal>

        {/* Reviews Grid */}
        {reviews && reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {reviews.map((review, index) => (
              <ScrollReveal key={review.id} delay={index * 0.1}>
                <div className="bg-card rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full">
                  <div className="p-6">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {review.avatar_url ? (
                          <img
                            src={review.avatar_url}
                            alt={review.user_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {review.user_name}
                        </p>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-muted-foreground text-sm line-clamp-4 mb-4">
                      {review.comment}
                    </p>

                    {/* Date */}
                    <p className="text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>ยังไม่มีรีวิว เป็นคนแรกที่แชร์ความคิดเห็น!</p>
          </div>
        )}

        {/* Action Buttons */}
        <ScrollReveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              เขียนรีวิว
            </Button>
            <Link to="/reviews">
              <Button variant="outline" className="group">
                ดูรีวิวทั้งหมด
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
      />
    </section>
  );
};

export default CommunityReviews;
