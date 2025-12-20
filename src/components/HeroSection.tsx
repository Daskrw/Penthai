import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import heroBanner from "@/assets/hero-banner.png";
const HeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const sectionRef = useRef(null);

  // Parallax effect
  const {
    scrollY
  } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, 200]);
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
      }
    }
  };
  const trustBadgeVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
      }
    }
  };
  return <section ref={sectionRef} className="relative h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div className="absolute inset-0" style={{
      y
    }}>
        <img src={heroBanner} alt="สินค้าไทยแท้คุณภาพสูง" className="w-full h-[120%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <motion.div className="max-w-2xl text-white" variants={containerVariants} initial="hidden" animate={isLoaded ? "visible" : "hidden"}>
          {/* Headline */}
          <motion.h1 className="text-5xl md:text-7xl font-bold mb-6" variants={itemVariants}>
            จากความเป็นไทย…
            <br />
            <span className="text-accent">สู่โอกาสใหม่ของชุมชน</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p className="text-xl md:text-2xl mb-8 text-gray-200" variants={itemVariants}>
            สนับสนุนโครงการพัฒนาและเลือกซื้อผลิตภัณฑ์คุณภาพจากฝีมือคนในชุมชน
          </motion.p>

          {/* CTA Buttons */}
          <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
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
          </motion.div>

          {/* Trust Badges */}
          <motion.div className="mt-12 flex flex-wrap gap-6 text-base" variants={containerVariants} initial="hidden" animate={isLoaded ? "visible" : "hidden"} transition={{
          delayChildren: 0.8
        }}>
            <motion.div className="flex items-center gap-2" variants={trustBadgeVariants}>
              <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                ✓
              </div>
              <span>​พัฒนาชุมชน</span>
            </motion.div>
            <motion.div className="flex items-center gap-2" variants={trustBadgeVariants}>
              <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                ✓
              </div>
              <span>สร้างความยั่งยืน</span>
            </motion.div>
            <motion.div className="flex items-center gap-2" variants={trustBadgeVariants}>
              <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                ✓
              </div>
              <span>พัฒนาเศรษฐกิจชุมชน</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>;
};
export default HeroSection;