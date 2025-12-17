import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  itemCount: number;
  href: string;
}

const CategoryCard = ({ name, icon: Icon, itemCount, href }: CategoryCardProps) => {
  return (
    <Link to={href}>
      <div className="group relative bg-card rounded-xl p-8 shadow-md hover:shadow-thai-lg transition-all duration-300 hover-lift overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {itemCount} Products
          </p>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
