import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface PortfolioPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  event_date: string;
  is_published: boolean;
  created_at: string;
}

const AdminPortfolio = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PortfolioPost | null>(null);
  const [deletePost, setDeletePost] = useState<PortfolioPost | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    event_date: new Date(),
    is_published: true,
  });

  // Fetch posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-portfolio-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_posts")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data as PortfolioPost[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("portfolio_posts").insert({
        title: data.title,
        content: data.content,
        image_url: data.image_url || null,
        event_date: format(data.event_date, "yyyy-MM-dd"),
        is_published: data.is_published,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-portfolio-posts"] });
      toast.success("สร้างโพสต์สำเร็จ");
      resetForm();
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("portfolio_posts")
        .update({
          title: data.title,
          content: data.content,
          image_url: data.image_url || null,
          event_date: format(data.event_date, "yyyy-MM-dd"),
          is_published: data.is_published,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-portfolio-posts"] });
      toast.success("อัปเดตโพสต์สำเร็จ");
      resetForm();
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-portfolio-posts"] });
      toast.success("ลบโพสต์สำเร็จ");
      setDeletePost(null);
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image_url: "",
      event_date: new Date(),
      is_published: true,
    });
    setEditingPost(null);
    setIsFormOpen(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (post: PortfolioPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image_url: post.image_url || "",
      event_date: new Date(post.event_date),
      is_published: post.is_published,
    });
    setImagePreview(post.image_url);
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("portfolio-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("อัปโหลดรูปภาพไม่สำเร็จ");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const imageUrl = await uploadImage();
    const submitData = { ...formData, image_url: imageUrl || "" };

    if (editingPost) {
      updateMutation.mutate({ ...submitData, id: editingPost.id });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการผลงาน/ข่าวสาร</h1>
          <p className="text-muted-foreground">จัดการโพสต์ผลงานและกิจกรรม</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          สร้างโพสต์ใหม่
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">รูปภาพ</TableHead>
              <TableHead>หัวข้อ</TableHead>
              <TableHead>วันที่กิจกรรม</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : !posts || posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  ยังไม่มีโพสต์
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>
                    {format(new Date(post.event_date), "d MMM yyyy", { locale: th })}
                  </TableCell>
                  <TableCell>
                    {post.is_published ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Eye className="w-3 h-3 mr-1" />
                        เผยแพร่
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff className="w-3 h-3 mr-1" />
                        ซ่อน
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletePost(post)}
                      >
                        <Trash2 className="w-4 h-4" />
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
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "แก้ไขโพสต์" : "สร้างโพสต์ใหม่"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>รูปภาพ</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setFormData({ ...formData, image_url: "" });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        คลิกเพื่ออัปโหลดรูปภาพ
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">หัวข้อ *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ระบุหัวข้อโพสต์"
              />
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label>วันที่กิจกรรม *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.event_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.event_date ? (
                      format(formData.event_date, "d MMMM yyyy", { locale: th })
                    ) : (
                      <span>เลือกวันที่</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.event_date}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, event_date: date })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">เนื้อหา *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="เขียนเรื่องราวหรือรายละเอียดของกิจกรรม..."
                rows={8}
              />
            </div>

            {/* Published Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>เผยแพร่</Label>
                <p className="text-sm text-muted-foreground">
                  แสดงโพสต์นี้บนหน้าผลงาน
                </p>
              </div>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
            >
              {isUploading
                ? "กำลังอัปโหลด..."
                : createMutation.isPending || updateMutation.isPending
                ? "กำลังบันทึก..."
                : editingPost
                ? "อัปเดต"
                : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบโพสต์ "{deletePost?.title}" ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePost && deleteMutation.mutate(deletePost.id)}
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

export default AdminPortfolio;
