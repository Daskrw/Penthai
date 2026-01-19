import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";

interface Activity {
  title: string;
  subtitle?: string;
  href: string;
  image: string;
  isExternal?: boolean;
  badge?: string;
}

const activities: Activity[] = [
  {
    title: "การเข้าร่วมการพัฒนาชุมชุน",
    href: "/community-registration",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80",
  },
  {
    title: "ลงทะเบียนการจำหน่ายสินค้า",
    href: "/seller-registration",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
  },
  {
    title: "ผลงานของเรา",
    href: "/our-work",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  },
  {
    title: "เครือข่ายชุมชน",
    href: "/community-support",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80",
  },
  {
    title: "การประเมิน",
    subtitle: "ทำแบบประเมิน/ข้อเสนอแนะ",
    href: "https://example.com/form-demo",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    isExternal: true,
    badge: "Demo (ลิงก์จะอัปเดตภายหลัง)",
  },
];

const ActivityNavigation = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {activities.map((activity, index) => (
            <ScrollReveal key={activity.href} delay={index * 0.1}>
              {activity.isExternal ? (
                <a
                  href={activity.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] block"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  {/* Dark overlay for text legibility */}
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-300" />
                  {/* Badge */}
                  {activity.badge && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-3 right-3 bg-amber-500/90 text-white text-xs px-2 py-1 font-medium"
                    >
                      {activity.badge}
                    </Badge>
                  )}
                  {/* Centered text container */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                    <h3 
                      className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-center leading-tight tracking-tight drop-shadow-lg"
                      style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
                    >
                      {activity.title}
                    </h3>
                    {activity.subtitle && (
                      <p 
                        className="text-white/90 text-sm sm:text-base md:text-lg mt-2 text-center drop-shadow-md"
                        style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}
                      >
                        {activity.subtitle}
                      </p>
                    )}
                  </div>
                </a>
              ) : (
                <Link
                  to={activity.href}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] block"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  {/* Dark overlay for text legibility */}
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-300" />
                  {/* Centered text container */}
                  <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
                    <h3 
                      className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-center leading-tight tracking-tight drop-shadow-lg"
                      style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
                    >
                      {activity.title}
                    </h3>
                  </div>
                </Link>
              )}
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActivityNavigation;
