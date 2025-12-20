import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Auth = () => {
  // Separate state for each tab
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!fullName.trim()) {
      toast({
        title: "กรุณากรอกชื่อ-นามสกุล",
        description: "กรุณากรอกชื่อ-นามสกุลของคุณ",
        variant: "destructive"
      });
      return;
    }
    
    if (signUpPassword.length < 6) {
      toast({
        title: "รหัสผ่านสั้นเกินไป",
        description: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    const { error } = await signUp(signUpEmail.trim(), signUpPassword, fullName.trim());

    if (error) {
      toast({
        title: "การลงทะเบียนล้มเหลว",
        description: error.message === "User already registered"
          ? "อีเมลนี้ถูกใช้งานแล้ว"
          : error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "ยินดีต้อนรับสู่เป็นไทย!",
        description: "สร้างบัญชีสำเร็จแล้ว"
      });
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!signInEmail.trim() || !signInPassword.trim()) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "กรุณากรอกอีเมลและรหัสผ่าน",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    const { error } = await signIn(signInEmail.trim(), signInPassword);

    if (error) {
      toast({
        title: "เข้าสู่ระบบล้มเหลว",
        description: error.message === "Invalid login credentials" 
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" 
          : error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "ยินดีต้อนรับกลับมา!",
        description: "เข้าสู่ระบบสำเร็จแล้ว"
      });
      navigate("/");
    }
    setLoading(false);
  };


  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">เข้าสู่ระบบ</TabsTrigger>
                <TabsTrigger value="signup">ลงทะเบียน</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Card>
                  <CardHeader>
                    <CardTitle>เข้าสู่ระบบ</CardTitle>
                    <CardDescription>
                      กรอกข้อมูลเพื่อเข้าสู่บัญชีของคุณ
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">อีเมล</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">รหัสผ่าน</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>ลงทะเบียน</CardTitle>
                    <CardDescription>
                      สร้างบัญชีใหม่เพื่อเริ่มช้อปปิ้ง
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">ชื่อ-นามสกุล</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="กรอกชื่อ-นามสกุล"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">อีเมล</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">รหัสผ่าน</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "กำลังสร้างบัญชี..." : "ลงทะเบียน"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Auth;
