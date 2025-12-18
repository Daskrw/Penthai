import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2,
  FileText,
  CreditCard,
  BookOpen,
  Users,
  ClipboardCheck,
  Award,
  Search,
  LogIn
} from "lucide-react";
import { Link } from "react-router-dom";

const qualifications = [
  "คณะบุคคลตั้งแต่ 7 คนขึ้นไป",
  "ไม่อยู่ในครอบครัวเดียวกัน",
  "มีวัตถุประสงค์เพื่อสร้างรายได้และพึ่งพาตนเอง"
];

const requiredDocuments = [
  { icon: CreditCard, title: "สำเนาบัตรประชาชน" },
  { icon: BookOpen, title: "ทะเบียนบ้าน" },
  { icon: FileText, title: "หนังสือมอบอำนาจ" },
  { icon: Users, title: "ข้อบังคับกลุ่ม" }
];

const processSteps = [
  { step: 1, title: "ยื่นคำขอ", subtitle: "Submit", icon: FileText },
  { step: 2, title: "เจ้าหน้าที่ตรวจสอบ", subtitle: "Verify", icon: ClipboardCheck },
  { step: 3, title: "อนุมัติ/ออกใบสำคัญ", subtitle: "Approve", icon: Award }
];

const CommunityRegistration = () => {
  return (
    <div className="min-h-screen bg-background font-[Kanit]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-background py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            ระบบจดทะเบียนวิสาหกิจชุมชน
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ยกระดับภูมิปัญญาท้องถิ่นสู่มาตรฐานสากล ด้วยระบบฐานข้อมูลที่เชื่อมโยงถึงกัน
          </p>
        </div>
      </section>

      {/* Main Content - 2 Column Layout */}
      <section className="py-10 md:py-14 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column A: Main Information (Left - Wider) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Section 1: Qualifications */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-primary flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    คุณสมบัติของวิสาหกิจชุมชน
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4">
                    {qualifications.map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Section 2: Required Documents */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-primary flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    เอกสารที่ต้องเตรียม
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {requiredDocuments.map((doc, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col items-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <doc.icon className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground text-center">
                          {doc.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Process Timeline */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-primary flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-primary" />
                    </div>
                    ขั้นตอนการดำเนินการ
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {processSteps.map((step, index) => (
                      <div key={step.step} className="flex items-center gap-4 flex-1 w-full md:w-auto">
                        <div className="flex flex-col items-center text-center flex-1">
                          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-3 shadow-lg">
                            <step.icon className="w-7 h-7 text-primary-foreground" />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                            <span className="text-primary font-bold">{step.step}</span>
                          </div>
                          <h4 className="font-semibold text-foreground">{step.title}</h4>
                          <span className="text-sm text-muted-foreground">{step.subtitle}</span>
                        </div>
                        {index < processSteps.length - 1 && (
                          <div className="hidden md:block w-16 h-1 bg-primary/30 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Column B: Action & Login (Right - Narrower, Sticky) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                
                {/* Card 1: Login/Register */}
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className="bg-primary px-6 py-4">
                    <h3 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      เข้าสู่ระบบ / ลงทะเบียน
                    </h3>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">ชื่อผู้ใช้</label>
                      <Input 
                        placeholder="กรอกชื่อผู้ใช้" 
                        className="h-11 border-2 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">รหัสผ่าน</label>
                      <Input 
                        type="password"
                        placeholder="กรอกรหัสผ่าน" 
                        className="h-11 border-2 focus:border-primary"
                      />
                    </div>
                    <Button className="w-full h-11 font-semibold text-base">
                      เข้าสู่ระบบ
                    </Button>
                    <Link to="/seller-registration" className="block">
                      <Button 
                        variant="outline" 
                        className="w-full h-11 font-semibold text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        ลงทะเบียนวิสาหกิจใหม่
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      ลืมรหัสผ่าน? <a href="#" className="text-primary hover:underline">กดที่นี่</a>
                    </p>
                  </CardContent>
                </Card>

                {/* Card 2: Check Status */}
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className="bg-muted px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Search className="w-5 h-5 text-primary" />
                      ตรวจสอบสถานะการยื่น
                    </h3>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">เลขที่คำขอ / รหัสกลุ่ม</label>
                      <Input 
                        placeholder="เช่น CE-2024-XXXXX" 
                        className="h-11 border-2 focus:border-primary"
                      />
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full h-11 font-semibold text-base"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      ค้นหา
                    </Button>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-foreground font-medium mb-1">ต้องการความช่วยเหลือ?</p>
                  <p className="text-xs text-muted-foreground">
                    ติดต่อเจ้าหน้าที่ได้ที่ 02-XXX-XXXX หรือ <a href="mailto:support@penthai.com" className="text-primary hover:underline">support@penthai.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CommunityRegistration;