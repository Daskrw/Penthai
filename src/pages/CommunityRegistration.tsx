import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CommunityRegistration = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          จดทะเบียนวิสาหกิจชุมชน
        </h1>
        <p className="text-muted-foreground">
          เนื้อหาจะถูกเพิ่มในภายหลัง
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default CommunityRegistration;
