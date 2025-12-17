import ProductCard from "./ProductCard";

const products = [
  {
    id: "1",
    name: "Thai Silk Scarf - Traditional Pattern",
    price: 890,
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400",
    rating: 4.8,
    reviews: 124,
    stock: 10,
  },
  {
    id: "2",
    name: "Handcrafted Teak Wood Bowl",
    price: 1250,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400",
    rating: 4.9,
    reviews: 89,
    stock: 10,
  },
  {
    id: "3",
    name: "Thai Aromatherapy Gift Set",
    price: 680,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400",
    rating: 4.7,
    reviews: 156,
    stock: 10,
  },
  {
    id: "4",
    name: "Traditional Thai Ceramic Vase",
    price: 1450,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400",
    rating: 4.9,
    reviews: 67,
    stock: 10,
  },
  {
    id: "5",
    name: "Premium Thai Tea Collection",
    price: 540,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
    rating: 4.6,
    reviews: 203,
    stock: 10,
  },
  {
    id: "6",
    name: "Embroidered Thai Cushion Cover",
    price: 420,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
    rating: 4.8,
    reviews: 142,
    stock: 10,
  },
  {
    id: "7",
    name: "Thai Silver Jewelry Set",
    price: 2100,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
    rating: 5.0,
    reviews: 98,
    stock: 10,
  },
  {
    id: "8",
    name: "Handwoven Thai Basket",
    price: 780,
    image: "https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=400",
    rating: 4.7,
    reviews: 76,
    stock: 10,
  },
];

const BestSellers = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Best Sellers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our most loved products, chosen by customers like you
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div className="text-center mt-10">
          <button className="text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-2 group">
            View All Products
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
