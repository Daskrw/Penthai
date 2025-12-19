import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const About = () => {
  return <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">เกี่ยวกับเป็นไทย</h1>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-lg text-foreground leading-relaxed">
                  ยินดีต้อนรับสู่ <span className="font-semibold text-primary">เป็นไทย</span> จากรากฐานเรื่องราวและภูมิปัญญาที่สืบทอดกันมา เรามุ่งมั่นที่จะต่อยอดและสร้างคุณค่าใหม่ให้กับชุมชน ด้วยความเชื่อมั่นอย่างแท้จริง
ในศักยภาพ ความฝัน และรอยยิ้มของผู้คนท้องถิ่นทุกคน
                </p>
                
                <p className="text-lg text-foreground leading-relaxed">
                  <span className="text-[#a81212]">จุดมุ่งหมายของเรา</span> : เรามุ่งมั่นที่จะ ยกระดับคุณค่าและอัตลักษณ์ของชุมชนไทย ผ่านการถ่ายทอดภูมิปัญญา วัฒนธรรม และทรัพยากรท้องถิ่นให้เกิดเป็นผลิตภัณฑ์และบริการที่สร้างมูลค่าเพิ่ม สอดคล้องกับวิถีชีวิตยุคใหม่ เราเชื่อว่าการพัฒนาที่แท้จริงต้องเกิดจากการ เสริมพลังให้ชุมชนมีความเข้มแข็ง พึ่งพาตนเองได้ และสามารถก้าวไปสู่ตลาดในระดับประเทศและนานาชาติได้อย่างภาคภูมิ  
                </p>
                
                <p className="text-lg text-foreground leading-relaxed">
                  <span className="text-[#a81212]">ผลลัพธ์ที่เราสร้าง</span> : ตลอดการทำงาน เราได้ร่วมกับชุมชนในการสร้างผลลัพธ์ที่เป็นรูปธรรม ไม่ว่าจะเป็น
การเพิ่มรายได้และโอกาสทางเศรษฐกิจ
การอนุรักษ์ภูมิปัญญาและวัฒนธรรมไทย
การสร้างเครือข่ายความร่วมมือ
การพัฒนาแบรนด์และผลิตภัณฑ์ของชุมชน

ทั้งหมดนี้สะท้อนถึงการพัฒนาอย่างยั่งยืน ที่ไม่เพียงแต่สร้างผลลัพธ์ทางเศรษฐกิจ แต่ยังช่วยสร้างความภาคภูมิใจและคุณค่าให้กับชุมชนไทยในระยะยาว  
                </p>

                <div className="bg-card p-6 rounded-lg shadow-md border-l-4 border-primary">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">ปณิธานเพื่อชุมชนยั่งยืน</h2>
                  <ul className="space-y-3 text-foreground">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span><strong>สร้างรายได้สู่ท้องถิ่น:</strong> ทุกยอดสั่งซื้อคือรายได้ที่ส่งตรงถึงมือผู้ผลิตในชุมชนอย่างเป็นธรรม</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span><strong>สืบสานภูมิปัญญาไทย:</strong> ร่วมรักษาและต่อยอดมรดกทางวัฒนธรรมท้องถิ่นไม่ให้สูญหาย</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span><strong>เป็นมิตรต่อสิ่งแวดล้อม:</strong> สนับสนุนกระบวนการผลิตที่ใส่ใจธรรมชาติและใช้วัสดุในท้องถิ่น</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span><strong>เติบโตไปด้วยกัน:</strong> มุ่งมั่นพัฒนาศักยภาพวิสาหกิจชุมชนไทยให้ก้าวไกลสู่สากล</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="relative">
                <img src="/placeholder.svg" alt="งานฝีมือไทย" className="rounded-lg shadow-thai-lg w-full h-[500px] object-cover" />
                <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-lg shadow-lg max-w-xs">
                  <p className="font-semibold text-lg">นำความเป็นไทยมาสู่คุณ</p>
                  <p className="text-sm mt-2 opacity-90">ตั้งแต่ 2024</p>
                </div>
              </div>
            </div>

            <div className="mt-20 grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-card rounded-lg shadow-md">
                <div className="text-4xl font-bold text-primary mb-2">1000+</div>
                <p className="text-foreground">ลูกค้าที่พึงพอใจ</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg shadow-md">
                <div className="text-4xl font-bold text-primary mb-2">7+</div>
                <p className="text-foreground">สินค้า</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg shadow-md">
                <div className="text-4xl font-bold text-primary mb-2">100+</div>
                <p className="text-foreground">ชุมชนท้องถิ่น</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>;
};
export default About;