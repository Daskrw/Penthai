import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, User, Package, Award, Upload, CheckCircle2, Phone, MessageCircle } from "lucide-react";

const formSchema = z.object({
  contactName: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  shopName: z.string().min(1, "กรุณากรอกชื่อกลุ่ม/ร้านค้า"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง"),
  lineId: z.string().optional(),
  productName: z.string().optional(),
  category: z.string().optional(),
  price: z.string().optional(),
  description: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  otherCertification: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const categories = [
  { value: "food", label: "อาหาร/เครื่องดื่ม" },
  { value: "textile", label: "ผ้าทอ/เครื่องแต่งกาย" },
  { value: "handicraft", label: "ของใช้/ของตกแต่ง" },
  { value: "herbal", label: "สมุนไพร" },
  { value: "agriculture", label: "สินค้าเกษตร" },
  { value: "other", label: "อื่นๆ" },
];

const certificationOptions = [
  { id: "otop", label: "OTOP (1-5 ดาว)" },
  { id: "fda", label: "อย. (FDA)" },
  { id: "community", label: "มาตรฐานผลิตภัณฑ์ชุมชน (มผช.)" },
  { id: "halal", label: "ฮาลาล (Halal)" },
  { id: "other", label: "อื่นๆ (ระบุ)" },
];

const SellerRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactName: "",
      shopName: "",
      phone: "",
      lineId: "",
      productName: "",
      category: "",
      price: "",
      description: "",
      certifications: [],
      otherCertification: "",
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (uploadedImages.length + files.length > 3) {
      toast.error("สามารถอัปโหลดได้สูงสุด 3 รูป");
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error, data } = await supabase.storage
        .from('seller-product-images')
        .upload(fileName, file);

      if (error) {
        toast.error(`อัปโหลดรูปภาพไม่สำเร็จ: ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('seller-product-images')
        .getPublicUrl(fileName);

      newImages.push(urlData.publicUrl);
    }

    setUploadedImages(prev => [...prev, ...newImages]);
    setUploading(false);
    toast.success("อัปโหลดรูปภาพสำเร็จ");
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('seller_applications').insert({
        contact_name: data.contactName,
        shop_name: data.shopName,
        phone: data.phone,
        line_id: data.lineId || null,
        product_name: data.productName || null,
        category: data.category || null,
        price: data.price ? parseFloat(data.price) : null,
        description: data.description || null,
        product_images: uploadedImages,
        certifications: data.certifications || [],
        other_certification: data.otherCertification || null,
      });

      if (error) throw error;

      setShowSuccess(true);
      form.reset();
      setUploadedImages([]);
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchCertifications = form.watch("certifications") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10 animate-gradient-shift" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Store className="w-4 h-4" />
            PENTHAI Seller Portal
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            ลงทะเบียนจำหน่ายสินค้า
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ร่วมเป็นส่วนหนึ่งของครอบครัว PENTHAI ส่งต่อภูมิปัญญาไทยสู่สากล<br />
            เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันข้อมูลภายใน 3 วันทำการ
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Section 1: Contact Information */}
              <Card className="border-2 border-border/50 shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">ข้อมูลผู้ติดต่อ</CardTitle>
                      <CardDescription>กรอกข้อมูลสำหรับการติดต่อกลับ</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            ชื่อ-นามสกุล <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="ชื่อ-นามสกุล" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shopName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            ชื่อกลุ่ม/ร้านค้า <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="ชื่อกลุ่มหรือร้านค้า" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            เบอร์โทรศัพท์ <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="08X-XXX-XXXX" type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Line ID (ถ้ามี)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Line ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Product Details */}
              <Card className="border-2 border-border/50 shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">ข้อมูลสินค้าเบื้องต้น</CardTitle>
                      <CardDescription>บอกเล่าเรื่องราวสินค้าของคุณ</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อสินค้าหลัก</FormLabel>
                          <FormControl>
                            <Input placeholder="ชื่อสินค้าที่ต้องการจำหน่าย" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>หมวดหมู่สินค้า</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกหมวดหมู่" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ราคาโดยประมาณ (บาท)</FormLabel>
                        <FormControl>
                          <Input placeholder="เช่น 150" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รายละเอียดสินค้า/จุดเด่น</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="เล่าเรื่องราวของสินค้า จุดเด่น วัตถุดิบ กระบวนการผลิต..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section 3: Certifications & Images */}
              <Card className="border-2 border-border/50 shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">มาตรฐานและการรับรอง</CardTitle>
                      <CardDescription>อัปโหลดรูปสินค้าและระบุมาตรฐานที่ได้รับ</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Image Upload */}
                  <div>
                    <FormLabel className="mb-3 block">ภาพสินค้าตัวอย่าง (สูงสุด 3 รูป)</FormLabel>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploading || uploadedImages.length >= 3}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`cursor-pointer flex flex-col items-center ${uploading || uploadedImages.length >= 3 ? 'opacity-50' : ''}`}
                      >
                        <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {uploading ? "กำลังอัปโหลด..." : "คลิกเพื่อเลือกรูปภาพ"}
                        </span>
                      </label>
                    </div>
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certifications */}
                  <FormField
                    control={form.control}
                    name="certifications"
                    render={() => (
                      <FormItem>
                        <FormLabel className="mb-3 block">มาตรฐานที่ได้รับ</FormLabel>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {certificationOptions.map((cert) => (
                            <FormField
                              key={cert.id}
                              control={form.control}
                              name="certifications"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(cert.id)}
                                      onCheckedChange={(checked) => {
                                        const value = field.value || [];
                                        if (checked) {
                                          field.onChange([...value, cert.id]);
                                        } else {
                                          field.onChange(value.filter((v) => v !== cert.id));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {cert.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  {watchCertifications.includes("other") && (
                    <FormField
                      control={form.control}
                      name="otherCertification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ระบุมาตรฐานอื่นๆ</FormLabel>
                          <FormControl>
                            <Input placeholder="ระบุมาตรฐานที่ได้รับ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  className="px-12 py-6 text-lg font-semibold shadow-lg shadow-primary/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "กำลังส่งข้อมูล..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      ส่งข้อมูลลงทะเบียน
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </section>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">บันทึกข้อมูลสำเร็จ!</DialogTitle>
            <DialogDescription className="text-base pt-2">
              เจ้าหน้าที่จะติดต่อกลับภายใน 3 วันทำการ<br />
              เพื่อยืนยันข้อมูลและดำเนินการต่อไป
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowSuccess(false)} className="mt-4">
            ตกลง
          </Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SellerRegistration;
