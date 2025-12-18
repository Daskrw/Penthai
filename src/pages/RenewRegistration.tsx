import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RefreshCw, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const RenewRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    registrationId: "",
    enterpriseName: "",
    file: null as File | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.registrationId || !formData.enterpriseName) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);
    
    try {
      let documentUrl = null;

      // Upload file if provided
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `renewals/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-slips')
          .upload(filePath, formData.file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Continue without document - not critical
        } else {
          const { data: urlData } = supabase.storage
            .from('payment-slips')
            .getPublicUrl(filePath);
          documentUrl = urlData.publicUrl;
        }
      }

      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // Insert renewal request
      const { error } = await supabase
        .from("enterprise_renewals")
        .insert({
          registration_id: formData.registrationId.trim(),
          enterprise_name: formData.enterpriseName.trim(),
          document_url: documentUrl,
          user_id: user?.id || null,
          status: "pending"
        });

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setSubmitted(true);
      toast.success("ส่งคำขอต่ออายุเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error submitting renewal:", error);
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                ส่งคำขอต่ออายุเรียบร้อยแล้ว
              </h1>
              <p className="text-muted-foreground mb-8">
                เจ้าหน้าที่จะตรวจสอบและดำเนินการภายใน 7 วันทำการ
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/check-status">
                  <Button variant="outline" className="w-full sm:w-auto">
                    ตรวจสอบสถานะ
                  </Button>
                </Link>
                <Link to="/community-registration">
                  <Button className="w-full sm:w-auto">
                    กลับหน้าหลัก
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            {/* Back Button */}
            <Link to="/community-registration" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้าหลัก
            </Link>

            {/* Form Card */}
            <Card className="border-2">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">ต่ออายุทะเบียนวิสาหกิจชุมชน</CardTitle>
                <CardDescription>
                  กรอกข้อมูลและแนบเอกสารเพื่อยื่นคำขอต่ออายุ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="registrationId">รหัสทะเบียนเดิม *</Label>
                    <Input
                      id="registrationId"
                      placeholder="เช่น REG-2024-0001"
                      value={formData.registrationId}
                      onChange={(e) => setFormData(prev => ({ ...prev, registrationId: e.target.value }))}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enterpriseName">ชื่อวิสาหกิจชุมชน *</Label>
                    <Input
                      id="enterpriseName"
                      placeholder="ชื่อกลุ่มตามที่จดทะเบียนไว้"
                      value={formData.enterpriseName}
                      onChange={(e) => setFormData(prev => ({ ...prev, enterpriseName: e.target.value }))}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">แนบเอกสารต่ออายุ</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        {formData.file ? (
                          <p className="text-sm font-medium text-foreground">{formData.file.name}</p>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-foreground">คลิกเพื่อเลือกไฟล์</p>
                            <p className="text-xs text-muted-foreground mt-1">รองรับ PDF, DOC, JPG, PNG</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        กำลังส่งคำขอ...
                      </>
                    ) : (
                      "ส่งคำขอต่ออายุ"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RenewRegistration;
