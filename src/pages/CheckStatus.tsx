import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Building2, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  enterprise_name: string;
  status: "pending" | "approved" | "rejected";
  province: string;
}

const CheckStatus = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSearched(true);
    setNotFound(false);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from("community_enterprises")
        .select("enterprise_name, status, province")
        .or(`citizen_id.eq.${searchQuery},id.eq.${searchQuery}`)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setResult(data as SearchResult);
      }
    } catch (error) {
      console.error("Search error:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "approved":
        return {
          text: "อนุมัติแล้ว",
          className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200"
        };
      case "pending":
        return {
          text: "รอตรวจสอบ",
          className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200"
        };
      case "rejected":
        return {
          text: "ไม่อนุมัติ",
          className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200"
        };
      default:
        return {
          text: status,
          className: "bg-gray-100 text-gray-700 border-gray-200"
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            {/* Back Button */}
            <Link to="/community-registration" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้าหลัก
            </Link>

            {/* Search Card */}
            <Card className="border-2">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">ตรวจสอบสถานะการจดทะเบียน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    กรอกเลขบัตรประชาชน หรือ รหัสทะเบียน
                  </label>
                  <Input
                    placeholder="เช่น 1234567890123 หรือ REG-XXXXXX"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12"
                  />
                </div>
                
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || !searchQuery.trim()}
                  className="w-full h-12 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังค้นหา...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      ค้นหา
                    </>
                  )}
                </Button>

                {/* Search Result */}
                {searched && !loading && (
                  <div className="pt-4 border-t">
                    {notFound ? (
                      <div className="text-center py-6">
                        <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                          ไม่พบข้อมูลในระบบ
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          กรุณาตรวจสอบเลขบัตรประชาชนหรือรหัสทะเบียนอีกครั้ง
                        </p>
                      </div>
                    ) : result && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {result.enterprise_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              จ.{result.province}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">สถานะ:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusDisplay(result.status).className}`}>
                              {getStatusDisplay(result.status).text}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CheckStatus;
