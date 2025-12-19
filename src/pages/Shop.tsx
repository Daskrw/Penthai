import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  product_type: 'consumer' | 'consumable';
  stock: number;
  description: string | null;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<'all' | 'consumer' | 'consumable'>('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategories, priceRange, selectedProductType]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setProducts(data);
        const uniqueCategories = [...new Set(data.map(p => p.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by product type
    if (selectedProductType !== 'all') {
      filtered = filtered.filter(p => p.product_type === selectedProductType);
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Filter by price range
    filtered = filtered.filter(
      p => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    setFilteredProducts(filtered);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getPageTitle = () => {
    if (selectedProductType === 'consumer') return 'สินค้าอุปโภค';
    if (selectedProductType === 'consumable') return 'สินค้าบริโภค';
    return 'สินค้าทั้งหมด';
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-foreground mb-8">{getPageTitle()}</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-64 space-y-6">
              <div className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-foreground mb-4">ตัวกรอง</h2>
                
                {/* Product Type Filter */}
                <div className="mb-6">
                  <Label className="text-lg font-medium mb-3 block">ประเภทสินค้า</Label>
                  <RadioGroup value={selectedProductType} onValueChange={(value: any) => setSelectedProductType(value)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="all" id="type-all" />
                      <label htmlFor="type-all" className="text-sm font-medium cursor-pointer">
                        ทั้งหมด
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="consumer" id="type-consumer" />
                      <label htmlFor="type-consumer" className="text-sm font-medium cursor-pointer">
                        สินค้าอุปโภค
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="consumable" id="type-consumable" />
                      <label htmlFor="type-consumable" className="text-sm font-medium cursor-pointer">
                        สินค้าบริโภค
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <Label className="text-lg font-medium mb-3 block">หมวดหมู่</Label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <label
                          htmlFor={category}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <Label className="text-lg font-medium mb-3 block">
                    ช่วงราคา: ฿{priceRange[0].toLocaleString()} - ฿{priceRange[1].toLocaleString()}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10000}
                    step={100}
                    className="mt-4"
                  />
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-muted-foreground">ไม่พบสินค้า</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image_url || "/placeholder.svg"}
                      rating={4.5}
                      reviews={0}
                      stock={product.stock}
                      description={product.description || undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Shop;
