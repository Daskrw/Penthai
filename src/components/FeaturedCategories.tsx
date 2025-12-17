import CategoryCard from "./CategoryCard";
import { ShoppingBag, Watch, Sparkles, Shirt, Home, Gift } from "lucide-react";

const categories = [
  {
    name: "Fashion",
    icon: Shirt,
    itemCount: 234,
    href: "/category/fashion",
  },
  {
    name: "Accessories",
    icon: Watch,
    itemCount: 156,
    href: "/category/accessories",
  },
  {
    name: "Traditional Crafts",
    icon: Sparkles,
    itemCount: 89,
    href: "/category/crafts",
  },
  {
    name: "Home & Living",
    icon: Home,
    itemCount: 198,
    href: "/category/home",
  },
  {
    name: "Gifts",
    icon: Gift,
    itemCount: 142,
    href: "/category/gifts",
  },
  {
    name: "Premium Collection",
    icon: ShoppingBag,
    itemCount: 67,
    href: "/category/premium",
  },
];

const FeaturedCategories = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our carefully curated collections of authentic Thai products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.name} {...category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
