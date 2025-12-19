import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";

interface CommunityProfile {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  social_link: string | null;
}

const CommunitySupport = () => {
  const { data: communities, isLoading } = useQuery({
    queryKey: ["community-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CommunityProfile[];
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            สนับสนุนชุมชนเครือข่าย
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            เชื่อมต่อโดยตรงกับวิสาหกิจชุมชนทั่วไทย
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!communities || communities.length === 0) && (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              ยังไม่มีข้อมูลชุมชน
            </h3>
            <p className="text-muted-foreground">
              กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูลชุมชน
            </p>
          </div>
        )}

        {/* Community Cards Grid */}
        {!isLoading && communities && communities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Card
                key={community.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Community Image */}
                <AspectRatio ratio={4 / 3} className="bg-muted">
                  {community.image_url ? (
                    <img
                      src={community.image_url}
                      alt={community.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </AspectRatio>

                {/* Community Info */}
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">
                    {community.name}
                  </h3>
                  {community.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {community.description}
                    </p>
                  )}
                </CardContent>

                {/* Contact Area */}
                <div className="bg-muted/50 px-4 py-3 space-y-2 border-t">
                  {community.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground line-clamp-2">
                        {community.address}
                      </span>
                    </div>
                  )}

                  {community.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                      <a
                        href={`tel:${community.phone}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {community.phone}
                      </a>
                    </div>
                  )}

                  {community.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                      <a
                        href={`mailto:${community.email}`}
                        className="text-primary hover:underline truncate"
                      >
                        {community.email}
                      </a>
                    </div>
                  )}

                  {community.social_link && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                      <a
                        href={community.social_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        เยี่ยมชมเว็บไซต์
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CommunitySupport;
