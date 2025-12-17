import { Heart, Users, Leaf } from "lucide-react";
const AboutSection = () => {
  return <section className="py-16 bg-card">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            เกี่ยวกับโครงการเป็นไทย
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            เราคือกลุ่มคนที่มุ่งมั่นในการสร้างความเปลี่ยนแปลงที่ยั่งยืนให้กับชุมชน โดยเชื่อว่าศักยภาพของคนในท้องถิ่นคือหัวใจสำคัญของการพัฒนา เราทำงานร่วมกับชาวบ้านเพื่อสร้างอาชีพ ส่งเสริมการศึกษา และอนุรักษ์วัฒนธรรมท้องถิ่น
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 rounded-lg bg-background shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">สนับสนุนชุมชน</h3>
              <p className="text-sm text-muted-foreground">ทุกการซื้อคือการสนับสนุนฝีมือชุมชนและครอบครัวในชุมชนท้องถิ่น</p>
            </div>
            
            <div className="p-6 rounded-lg bg-background shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">ฝีมือชาวไทย</h3>
              <p className="text-sm text-muted-foreground">สินค้าทุกชิ้นผลิตด้วยฝีมือชุมชนไทยที่สืบทอดภูมิปัญญามาอย่างยาวนาน</p>
            </div>
            
            <div className="p-6 rounded-lg bg-background shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">เป็นมิตรกับสิ่งแวดล้อม</h3>
              <p className="text-sm text-muted-foreground">
                เราใส่ใจสิ่งแวดล้อมด้วยการเลือกใช้วัสดุธรรมชาติและบรรจุภัณฑ์ที่ยั่งยืน
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default AboutSection;