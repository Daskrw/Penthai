import { Link } from "react-router-dom";

const activities = [
  {
    title: "จดทะเบียนวิสาหกิจชุมชน",
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
    title: "สนับสนุนชุมชน",
    href: "/community-support",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80",
  },
];

const ActivityNavigation = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {activities.map((activity) => (
            <Link
              key={activity.href}
              to={activity.href}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-thai-lg transition-all duration-300 hover-lift"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={activity.image}
                  alt={activity.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white text-sm md:text-base lg:text-lg font-semibold text-center">
                  {activity.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActivityNavigation;
