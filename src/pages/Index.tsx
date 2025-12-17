import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import NewArrivals from "@/components/home/NewArrivals";
import CallToAction from "@/components/home/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <NewArrivals />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
