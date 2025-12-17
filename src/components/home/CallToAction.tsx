import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Handshake } from "lucide-react";
const CallToAction = () => {
  return <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Handshake className="h-8 w-8" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            เข้าร่วมโครงการกับเรา หรือ สนับสนุนเรา
          </h2>
          
          <p className="text-lg mb-8 opacity-90">
            คุณก็เป็นส่วนหนึ่งของการเปลี่ยนแปลงได้


          </p>
          
          <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
            <Link to="/contact">
              ติดต่อเรา
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>;
};
export default CallToAction;