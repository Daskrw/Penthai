import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin } from "lucide-react";
const Contact = () => {
  return <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">ติดต่อเราได้ที่</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              มีคำถามไหม? เรายินดีรับฟังความคิดเห็นของคุณ ส่งข้อความมาหาเรา แล้วเราจะตอบกลับโดยเร็วที่สุด
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-6">ช่องทางการติดต่อ</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">สถานที่ติดต่องาน</h3>
                      <p className="text-muted-foreground">
                        85/1 ถนนแจ้งวัฒนะ ตำบลบางตลาด อำเภอปากเกร็ด <br />
                        จังหวัดนนทบุรี 11120<br />
                        Thailand / ประเทศไทย 
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">เบอร์ติดต่อ</h3>
                      <p className="text-muted-foreground">
                        095-678-5840
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-muted-foreground">
                        penthai.pim@gmail.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold text-foreground mb-2">ช่วงเวลาทำการ</h3>
                <div className="space-y-1 text-muted-foreground">
                  <p>
วันจันทร์ - ศุกร์ : 8:00 - 16:00 น.</p>
                  <p>วันเสาร์ - อาทิตย์ : ปิดทำการ </p>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Contact;