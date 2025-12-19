import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface CommunityProfile {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  social_link: string | null;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  social_link: string;
}

const Communities = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<CommunityProfile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    social_link: "",
  });

  const { data: communities, isLoading } = useQuery({
    queryKey: ["admin-communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CommunityProfile[];
    },
  });

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return editingCommunity?.image_url || null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `communities/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("community-images")
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get the full public URL
    const { data: urlData } = supabase.storage
      .from("community-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    return publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData & { image_url: string | null }) => {
      const { error } = await supabase.from("community_profiles").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      toast.success("เพิ่มข้อมูลชุมชนสำเร็จ");
      resetForm();
    },
    onError: (error) => {
      console.error("Create error:", error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData & { id: string; image_url: string | null }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("community_profiles")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      toast.success("อัปเดตข้อมูลชุมชนสำเร็จ");
      resetForm();
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("community_profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      toast.success("ลบข้อมูลชุมชนสำเร็จ");
      setDeleteId(null);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      social_link: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingCommunity(null);
    setIsFormOpen(false);
  };

  const handleEdit = (community: CommunityProfile) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name,
      description: community.description || "",
      address: community.address || "",
      phone: community.phone || "",
      email: community.email || "",
      social_link: community.social_link || "",
    });
    setImagePreview(community.image_url);
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("กรุณากรอกชื่อชุมชน");
      return;
    }

    try {
      const imageUrl = await uploadImage();
      const submitData = { ...formData, image_url: imageUrl };

      console.log("=== Submit Debug ===");
      console.log("Final submit data:", submitData);

      if (editingCommunity) {
        updateMutation.mutate({ ...submitData, id: editingCommunity.id });
      } else {
        createMutation.mutate(submitData);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการข้อมูลชุมชน</h1>
          <p className="text-muted-foreground">จัดการรายชื่อชุมชนเครือข่าย</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          เพิ่มชุมชน
        </Button>
      </div>

      {/* Communities Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อชุมชน</TableHead>
              <TableHead>โทรศัพท์</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead className="w-[100px]">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : !communities || communities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  ยังไม่มีข้อมูลชุมชน
                </TableCell>
              </TableRow>
            ) : (
              communities.map((community) => (
                <TableRow key={community.id}>
                  <TableCell className="font-medium">{community.name}</TableCell>
                  <TableCell>{community.phone || "-"}</TableCell>
                  <TableCell>{community.email || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(community)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(community.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCommunity ? "แก้ไขข้อมูลชุมชน" : "เพิ่มชุมชนใหม่"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>รูปภาพชุมชน</Label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <Label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  เลือกรูปภาพ
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อชุมชน *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น วิสาหกิจชุมชนกลุ่มแม่บ้าน"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด / เรื่องราว</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="บอกเล่าเรื่องราวหรือความเชี่ยวชาญของชุมชน"
                rows={3}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">ที่อยู่</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="ที่อยู่เต็มของชุมชน"
                rows={2}
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">โทรศัพท์</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08X-XXX-XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* Social Link */}
            <div className="space-y-2">
              <Label htmlFor="social_link">เว็บไซต์ / Facebook</Label>
              <Input
                id="social_link"
                value={formData.social_link}
                onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "กำลังบันทึก..."
                  : editingCommunity
                  ? "อัปเดต"
                  : "บันทึก"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบข้อมูลชุมชนนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Communities;
