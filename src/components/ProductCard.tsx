import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Info } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  stock?: number;
  description?: string;
}

const ProductCard = ({ id, name, price, image, rating, reviews, stock = 0, description }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const { addToCart } = useCart();
  
  const isOutOfStock = stock <= 0;
  const hasDescription = description && description.trim().length > 0;

  return (
    <div className="group bg-card rounded-lg overflow-hidden shadow-md hover:shadow-thai-lg transition-all duration-300 hover-lift">
      {/* Image Container */}
      <div 
        className="relative aspect-square overflow-hidden bg-muted"
        onMouseEnter={() => setShowDescription(true)}
        onMouseLeave={() => setShowDescription(false)}
      >
        <img
          src={image}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? "opacity-60 grayscale" : "group-hover:scale-110"}`}
        />
        
        {/* Description Overlay */}
        <div 
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 ease-out ${
            showDescription ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <p className="text-white text-sm md:text-base text-center leading-relaxed font-medium line-clamp-6">
            {hasDescription ? description : "ยังไม่มีคำอธิบายสินค้า"}
          </p>
        </div>
        
        {/* Sold Out Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Badge variant="destructive" className="text-lg px-4 py-2 font-bold">
              สินค้าหมด
            </Badge>
          </div>
        )}
        
        {/* Mobile Info Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDescription(!showDescription);
          }}
          className="md:hidden absolute bottom-3 left-3 h-9 w-9 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center hover:bg-primary transition-colors shadow-md z-20"
        >
          <Info className="h-5 w-5 text-primary-foreground" />
        </button>
        
        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md z-20"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        </button>

        {/* Quick Add to Cart - Shows on hover */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
            <Button 
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg"
              onClick={() => addToCart(id)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              เพิ่มลงตะกร้า
            </Button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-sm ${
                  i < Math.floor(rating) ? "text-accent" : "text-muted-foreground/30"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            ฿{price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
