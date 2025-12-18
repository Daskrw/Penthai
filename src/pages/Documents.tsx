import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  BookOpen, 
  Scale,
  Users,
  Building2,
  FileCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const regulations = [
  {
    id: "1",
    icon: Scale,
    title: "พระราชบัญญัติส่งเสริมวิสาหกิจชุมชน พ.ศ. 2548",
    content: "กฎหมายหลักที่กำหนดนิยาม หลักเกณฑ์ และวิธีการในการส่งเสริมวิสาหกิจชุมชน รวมถึงการจดทะเบียน การรวมกลุ่ม และสิทธิประโยชน์ต่างๆ ที่วิสาหกิจชุมชนจะได้รับ"
  },
  {
    id: "2",
    icon: Users,
    title: "เงื่อนไขการรวมกลุ่ม 7 คน",
    content: "วิสาหกิจชุมชนต้องมีสมาชิกไม่น้อยกว่า 7 คน และสมาชิกต้องไม่อยู่ในครอบครัวเดียวกันทั้งหมด เพื่อให้เกิดการมีส่วนร่วมอย่างแท้จริงจากคนในชุมชน"
  },
  {
    id: "3",
    icon: Building2,
    title: "หลักเกณฑ์การตั้งสำนักงาน",
    content: "วิสาหกิจชุมชนต้องมีที่ตั้งสำนักงานที่แน่นอน สามารถติดต่อได้ และต้องตั้งอยู่ในเขตพื้นที่ของนายทะเบียนที่จะยื่นจดทะเบียน"
  },
  {
    id: "4",
    icon: FileCheck,
    title: "การต่ออายุประจำปี",
    content: "วิสาหกิจชุมชนที่จดทะเบียนแล้วต้องยื่นต่ออายุทะเบียนทุกปี ภายในระยะเวลาที่กำหนด พร้อมรายงานผลการดำเนินงานประจำปี"
  }
];

const downloadFiles = [
  {
    name: "แบบคำขอจดทะเบียน (ท.ว.ช.1)",
    description: "แบบฟอร์มสำหรับยื่นขอจดทะเบียนวิสาหกิจชุมชนใหม่",
    fileType: "PDF",
    size: "245 KB"
  },
  {
    name: "หนังสือมอบอำนาจ",
    description: "สำหรับกรณีที่ไม่สามารถมายื่นเรื่องด้วยตนเอง",
    fileType: "PDF",
    size: "128 KB"
  },
  {
    name: "แบบคำขอต่อทะเบียน (ท.ว.ช.2)",
    description: "แบบฟอร์มสำหรับยื่นต่ออายุทะเบียนประจำปี",
    fileType: "PDF",
    size: "198 KB"
  },
  {
    name: "แบบรายงานผลการดำเนินงาน",
    description: "รายงานผลประจำปีสำหรับประกอบการต่ออายุ",
    fileType: "DOC",
    size: "156 KB"
  }
];

const Documents = () => {
  const handleDownload = (fileName: string) => {
    // Mock download - in production, this would link to actual files
    console.log(`Downloading: ${fileName}`);
    // For demo purposes, show a message
    alert(`กำลังดาวน์โหลด: ${fileName}\n\n(หมายเหตุ: ไฟล์นี้เป็นตัวอย่าง)`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link to="/community-registration" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้าหลัก
            </Link>

            {/* Page Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                กฎระเบียบและดาวน์โหลดเอกสาร
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                รวบรวมข้อมูลกฎระเบียบที่เกี่ยวข้องและแบบฟอร์มสำหรับดาวน์โหลด
              </p>
            </div>

            <div className="grid gap-8">
              {/* Section 1: Rules & Regulations */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-primary" />
                    </div>
                    กฎระเบียบและข้อบังคับ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {regulations.map((reg) => (
                      <AccordionItem key={reg.id} value={reg.id}>
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <reg.icon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{reg.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pl-11">
                          {reg.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Section 2: File Downloads */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    ดาวน์โหลดแบบฟอร์ม
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {downloadFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{file.name}</h4>
                            <p className="text-sm text-muted-foreground">{file.description}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {file.fileType} • {file.size}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file.name)}
                          className="flex-shrink-0"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          ดาวน์โหลด
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Documents;
