import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ActivityNavigation from "@/components/home/ActivityNavigation";
import AboutSection from "@/components/home/AboutSection";
import CallToAction from "@/components/home/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ActivityNavigation />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
