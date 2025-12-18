import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.png";
const HeroSection = () => {
  return <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img src={heroBanner} alt="สินค้าไทยแท้คุณภาพสูง" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            จากความเป็นไทย…
            <br />
            <span className="text-accent">สู่โอกาสใหม่ของชุมชน</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 animate-fade-in">
            สนับสนุนโครงการพัฒนาและเลือกซื้อผลิตภัณฑ์คุณภาพจากฝีมือคนในชุมชน
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-thai-lg group text-lg px-8 py-6">
              <Link to="/shop">
                เลือกซื้อสินค้า
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-foreground text-lg px-8 py-6">
              <Link to="/about">
                เกี่ยวกับเรา
              </Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap gap-6 text-base">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                ✓
              </div>
              <span>ชำระเงินปลอดภัย</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                ✓
              </div>
              <span>รับประกันคุณภาพ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                ✓
              </div>
              <span>จัดส่งรวดเร็ว</span>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;