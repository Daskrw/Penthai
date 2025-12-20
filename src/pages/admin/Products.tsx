import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import CreatableCategorySelect from "@/components/admin/CreatableCategorySelect";
import ProductImageUpload from "@/components/admin/ProductImageUpload";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  image_url: string;
  product_type: 'consumer' | 'consumable';
  community_id: string | null;
}

interface Community {
  id: string;
  name: string;
}

const Products = () => {
  const { isAdmin, isCommunityAdmin, communityId } = useUserRole();
  const [products, setProducts] = useState<Product[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock: "",
    image_url: "",
    product_type: "consumer" as 'consumer' | 'consumable',
    community_id: "" as string
  });

  useEffect(() => {
    loadProducts();
    if (isAdmin) {
      loadCommunities();
    }
  }, [isAdmin, communityId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      // Community admins only see their community's products
      if (isCommunityAdmin && communityId) {
        query = query.eq("community_id", communityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from("community_profiles")
        .select("id, name")
        .order("name");

      if (error) throw error;
      if (data) setCommunities(data);
    } catch (error) {
      console.error("Error loading communities:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        stock: parseInt(formData.stock),
        image_url: formData.image_url,
        product_type: formData.product_type as 'consumer' | 'consumable',
        community_id: null as string | null,
      };

      // Set community_id based on role
      if (isCommunityAdmin && communityId) {
        productData.community_id = communityId;
      } else if (isAdmin && formData.community_id) {
        productData.community_id = formData.community_id;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;
        toast({ title: "Success", description: "Product added successfully" });
      }

      setDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive this product? It will be hidden from the shop.")) return;

    try {
      // Soft delete - archive instead of hard delete
      const { error } = await supabase
        .from("products")
        .update({ is_archived: true })
        .eq("id", id);

      if (error) {
        console.error("Error archiving product:", error);
        throw error;
      }
      toast({ title: "Success", description: "Product archived successfully" });
      loadProducts();
    } catch (error: any) {
      console.error("Error archiving product:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to archive product",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || "",
      category: product.category,
      stock: product.stock.toString(),
      image_url: product.image_url || "",
      product_type: product.product_type || "consumer",
      community_id: product.community_id || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      description: "",
      category: "",
      stock: "",
      image_url: "",
      product_type: "consumer",
      community_id: ""
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product details" : "Fill in the details to add a new product"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (฿)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <CreatableCategorySelect
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <ProductImageUpload
                imageUrl={formData.image_url}
                onImageChange={(url) => setFormData({ ...formData, image_url: url })}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_type">Product Type *</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value: 'consumer' | 'consumable') => 
                    setFormData({ ...formData, product_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumer">สินค้าอุปโภค (Consumer Goods)</SelectItem>
                    <SelectItem value="consumable">สินค้าบริโภค (Consumables)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="community">Community (Optional)</Label>
                  <Select
                    value={formData.community_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, community_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select community..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Community</SelectItem>
                      {communities.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingProduct ? "Update" : "Add Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No products yet. Add your first product to get started!
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>฿{product.price.toLocaleString()}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Products;