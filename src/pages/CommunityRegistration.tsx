import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Search, 
  RefreshCw, 
  FileText, 
  MapPin, 
  Users, 
  Package, 
  Building2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const serviceCards = [
  {
    icon: UserPlus,
    title: "จดทะเบียนใหม่",
    description: "สำหรับกลุ่มที่ยังไม่เคยจดทะเบียน",
    href: "/register-enterprise"
  },
  {
    icon: Search,
    title: "ตรวจสอบสถานะ",
    description: "ติดตามผลการอนุมัติของคุณ",
    href: "#"
  },
  {
    icon: RefreshCw,
    title: "ต่ออายุทะเบียน",
    description: "ยื่นเรื่องต่ออายุประจำปี",
    href: "#"
  },
  {
    icon: FileText,
    title: "คู่มือ/เอกสาร",
    description: "ดาวน์โหลดแบบฟอร์มที่จำเป็น",
    href: "#"
  }
];

const stats = [
  { label: "วิสาหกิจชุมชนทั้งหมด", value: "1,250+", icon: Building2 },
  { label: "สมาชิกเครือข่าย", value: "8,500+", icon: Users },
  { label: "สินค้าในระบบ", value: "3,200+", icon: Package }
];

const qualifications = [
  "มีสมาชิกไม่น้อยกว่า 7 คน และไม่อยู่ในครอบครัวเดียวกัน",
  "ดำเนินกิจการร่วมกันโดยมีวัตถุประสงค์เพื่อสร้างรายได้",
  "มีที่ตั้งสำนักงานแน่นอน สามารถติดต่อได้",
  "จดทะเบียนต่อนายทะเบียนในพื้นที่"
];

const recentRegistrations = [
  { name: "วิสาหกิจชุมชนกลุ่มแม่บ้านทอผ้า", location: "จ.เชียงใหม่", status: "อนุมัติแล้ว" },
  { name: "วิสาหกิจชุมชนผลิตภัณฑ์สมุนไพร", location: "จ.นครราชสีมา", status: "รอตรวจสอบ" },
  { name: "วิสาหกิจชุมชนเกษตรอินทรีย์", location: "จ.อุบลราชธานี", status: "อนุมัติแล้ว" },
  { name: "วิสาหกิจชุมชนหัตถกรรมพื้นบ้าน", location: "จ.ลำพูน", status: "อนุมัติแล้ว" }
];

const CommunityRegistration = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            PENTHAI Community Enterprise
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            ระบบจดทะเบียนวิสาหกิจชุมชน
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            ยกระดับภูมิปัญญาท้องถิ่นสู่มาตรฐานสากล ด้วยระบบฐานข้อมูลที่เชื่อมโยงถึงกัน
          </p>
          <Link to="/register-enterprise">
            <Button size="lg" className="font-semibold px-8">
              เริ่มต้นจดทะเบียน
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Service Dashboard */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {serviceCards.map((service) => (
              <Link key={service.title} to={service.href}>
                <Card className="group h-full border-2 border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                      <service.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-center gap-4 text-primary-foreground">
                <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-primary-foreground/80">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Map Preview Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              ค้นหาวิสาหกิจชุมชน / เครือข่าย
            </h2>
            
            {/* Search Bar */}
            <div className="flex gap-3 mb-10">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="ค้นหาชื่อวิสาหกิจ, จังหวัด, หรือประเภทสินค้า..." 
                  className="pl-12 h-14 text-base border-2 focus:border-primary"
                />
              </div>
              <Button size="lg" className="h-14 px-8 font-semibold">
                ค้นหา
              </Button>
            </div>

            {/* Map Placeholder & Recent Registrations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map Placeholder */}
              <Card className="overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center p-8">
                  <MapPin className="w-16 h-16 text-primary/30 mb-4" />
                  <p className="text-muted-foreground text-center font-medium">
                    แผนที่แสดงที่ตั้งวิสาหกิจชุมชน
                  </p>
                  <p className="text-sm text-muted-foreground/70 text-center mt-1">
                    เลือกจังหวัดเพื่อดูรายละเอียด
                  </p>
                </div>
              </Card>

              {/* Recent Registrations */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    การจดทะเบียนล่าสุด
                  </h3>
                  <div className="space-y-3">
                    {recentRegistrations.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.status === "อนุมัติแล้ว" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Qualifications Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  คุณสมบัติเบื้องต้น
                </h2>
                <ul className="space-y-4">
                  {qualifications.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-6 border-t border-primary/20">
                  <Link to="/register-enterprise">
                    <Button size="lg" className="w-full sm:w-auto font-semibold">
                      เริ่มต้นจดทะเบียน
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CommunityRegistration;
