import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import ReviewModal from "@/components/home/ReviewModal";

const Reviews = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reviews, refetch } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("*")
        .order("created_at", { ascending: false });

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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/30">
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              รีวิวจากสมาชิก PENTHAI
            </h1>
            <p className="text-primary-foreground/80 text-lg mb-6">
              เสียงตอบรับจากชุมชนของเรา
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="secondary"
              className="bg-card text-foreground hover:bg-card/90"
            >
              เขียนรีวิวของคุณ
            </Button>
          </div>
        </section>

        {/* Reviews Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {reviews && reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-card rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {review.avatar_url ? (
                            <img
                              src={review.avatar_url}
                              alt={review.user_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">
                            {review.user_name}
                          </p>
                          <div className="flex">{renderStars(review.rating)}</div>
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="text-muted-foreground mb-4">{review.comment}</p>

                      {/* Date */}
                      <p className="text-sm text-muted-foreground/70">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: th,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-4">
                  ยังไม่มีรีวิว เป็นคนแรกที่แชร์ความคิดเห็น!
                </p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  เขียนรีวิว
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Reviews;
