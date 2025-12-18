import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PortfolioPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  event_date: string;
  created_at: string;
}

const OurWork = () => {
  const [selectedPost, setSelectedPost] = useState<PortfolioPost | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["portfolio-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_posts")
        .select("*")
        .eq("is_published", true)
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data as PortfolioPost[];
    },
  });

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ผลงานของเรา
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            รวบรวมกิจกรรมและผลงานที่ผ่านมาของ PENTHAI ในการส่งเสริมวิสาหกิจชุมชน
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!posts || posts.length === 0) && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              ยังไม่มีผลงาน
            </h3>
            <p className="text-muted-foreground">
              เร็วๆ นี้จะมีผลงานและกิจกรรมมาอัปเดต
            </p>
          </div>
        )}

        {/* Card Feed Grid */}
        {!isLoading && posts && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
                onClick={() => setSelectedPost(post)}
              >
                {/* Image with lazy loading */}
                <AspectRatio ratio={16 / 9} className="bg-muted">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        console.log("Image load error for:", post.image_url);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-muted flex items-center justify-center absolute inset-0 ${post.image_url ? 'hidden' : ''}`}>
                    <Calendar className="w-12 h-12 text-muted-foreground" />
                  </div>
                </AspectRatio>

                <CardContent className="p-4">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  {/* Date Badge */}
                  <Badge variant="secondary" className="mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(post.event_date), "d MMM yyyy", { locale: th })}
                  </Badge>

                  {/* Excerpt */}
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {truncateText(post.content)}
                  </p>

                  {/* Read More */}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary hover:text-primary/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                    }}
                  >
                    อ่านเพิ่มเติม →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Post Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold pr-8">
              {selectedPost?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              {/* Date */}
              <Badge variant="secondary">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(selectedPost.event_date), "d MMMM yyyy", { locale: th })}
              </Badge>

              {/* Image */}
              {selectedPost.image_url && (
                <AspectRatio ratio={16 / 9} className="rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedPost.image_url}
                    alt={selectedPost.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              )}

              {/* Content */}
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedPost.content}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default OurWork;
