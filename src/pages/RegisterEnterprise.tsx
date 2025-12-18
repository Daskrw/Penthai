import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  CheckCircle2, 
  FileText, 
  Shield, 
  Users,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  citizenId: z
    .string()
    .length(13, "เลขบัตรประชาชนต้องมี 13 หลัก")
    .regex(/^\d+$/, "กรุณากรอกเฉพาะตัวเลข"),
  fullName: z
    .string()
    .min(5, "กรุณากรอกชื่อ-นามสกุลให้ครบถ้วน")
    .max(100, "ชื่อยาวเกินไป"),
  phone: z
    .string()
    .min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง")
    .max(10, "เบอร์โทรศัพท์ไม่ถูกต้อง")
    .regex(/^\d+$/, "กรุณากรอกเฉพาะตัวเลข"),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[A-Z]/, "ต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const requiredDocuments = [
  {
    title: "สำเนาบัตรประชาชนสมาชิก",
    description: "อย่างน้อย 7 คน ที่ไม่ใช่บุคคลในครอบครัวเดียวกัน",
  },
  {
    title: "สำเนาทะเบียนบ้าน",
    description: "ของสมาชิกทุกคนในกลุ่ม",
  },
  {
    title: "หนังสือยินยอมใช้สถานที่",
    description: "จากเจ้าของสถานที่ตั้งวิสาหกิจ",
  },
  {
    title: "บันทึกการประชุมจัดตั้งกลุ่ม",
    description: "พร้อมรายชื่อและลายเซ็นสมาชิกผู้ก่อตั้ง",
  },
];

const RegisterEnterprise = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      citizenId: "",
      fullName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: "ลงทะเบียนสำเร็จ",
      description: "ระบบจะนำท่านเข้าสู่กระบวนการยื่นเอกสารออนไลน์",
    });
    
    setIsSubmitting(false);
    form.reset();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row">
          {/* Left Side - Form */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
            <div className="w-full max-w-md space-y-8">
              {/* Form Header */}
              <div className="text-center lg:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                  <Shield className="h-4 w-4" />
                  ระบบปลอดภัย
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  ลงทะเบียนวิสาหกิจชุมชนใหม่
                </h1>
                <p className="text-muted-foreground">
                  กรอกข้อมูลเบื้องต้นเพื่อเปิดบัญชีผู้ใช้งาน
                </p>
              </div>

              {/* Registration Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Citizen ID */}
                  <FormField
                    control={form.control}
                    name="citizenId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">
                          เลขบัตรประชาชน
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="x-xxxx-xxxxx-xx-x"
                            maxLength={13}
                            className="h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">
                          ชื่อ-นามสกุล
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ชื่อจริง นามสกุล"
                            className="h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">
                          เบอร์โทรศัพท์
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0xxxxxxxxx"
                            maxLength={10}
                            className="h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">
                          รหัสผ่าน
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary pr-12"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">
                          ยืนยันรหัสผ่าน
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary pr-12"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        กำลังดำเนินการ...
                      </>
                    ) : (
                      "ลงทะเบียนและตรวจสอบสิทธิ์"
                    )}
                  </Button>
                </form>
              </Form>

              {/* Footer Link */}
              <p className="text-center text-muted-foreground">
                มีบัญชีอยู่แล้ว?{" "}
                <Link
                  to="/auth"
                  className="text-primary font-medium hover:underline"
                >
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
          </div>

          {/* Right Side - Info Panel */}
          <div className="flex-1 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-2 border-primary-foreground rounded-full" />
              <div className="absolute bottom-20 right-10 w-48 h-48 border-2 border-primary-foreground rounded-full" />
              <div className="absolute top-1/2 left-1/4 w-24 h-24 border-2 border-primary-foreground rounded-full" />
            </div>

            <div className="relative z-10 max-w-lg space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/20 text-primary-foreground rounded-full text-sm font-medium backdrop-blur-sm">
                  <FileText className="h-4 w-4" />
                  คู่มือเตรียมเอกสาร
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-primary-foreground">
                  เอกสารที่ต้องเตรียม
                </h2>
                <p className="text-primary-foreground/80">
                  กรุณาเตรียมเอกสารให้พร้อมก่อนเริ่มกระบวนการยื่นขอจดทะเบียน
                </p>
              </div>

              {/* Document List */}
              <div className="space-y-4">
                {requiredDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-primary-foreground/10 rounded-xl backdrop-blur-sm border border-primary-foreground/20 transition-all duration-300 hover:bg-primary-foreground/15"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-foreground">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-primary-foreground/70">
                        {doc.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="p-4 bg-primary-foreground/10 rounded-xl border border-primary-foreground/20 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-primary-foreground/90 leading-relaxed">
                    ระบบจะนำท่านเข้าสู่กระบวนการยื่นเอกสารออนไลน์หลังจากสมัครสมาชิกสำเร็จ 
                    โดยสามารถอัปโหลดเอกสารทั้งหมดผ่านระบบได้ทันที
                  </p>
                </div>
              </div>

              {/* Back Link */}
              <Link
                to="/community-registration"
                className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
              >
                ← กลับไปหน้าศูนย์บริการ
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterEnterprise;
