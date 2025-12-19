import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generatePromptPayPayload, PROMPTPAY_PHONE } from "@/lib/promptpay";
import { Clock, QrCode, ArrowLeft, ArrowRight, RefreshCw, CheckCircle, AlertCircle, Upload, ImageIcon, MapPin, Building2 } from "lucide-react";

const SHIPPING_FEE = 50;
const PAYMENT_TIMEOUT = 15 * 60; // 15 minutes in seconds

// Bank account details for display
const BANK_DETAILS = {
  bankName: "ธนาคารกสิกรไทย",
  accountName: "สำนักงานเกษตรจังหวัดเพชรบูรณ์",
  accountNumber: "123-4-56789-0"
};

type Step = "address" | "payment";

interface AddressForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface SavedAddress {
  id: string;
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  is_default: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  
  const [step, setStep] = useState<Step>("address");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [addressForm, setAddressForm] = useState<AddressForm>({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: ""
  });
  const [timeRemaining, setTimeRemaining] = useState(PAYMENT_TIMEOUT);
  const [isExpired, setIsExpired] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grandTotal = cartTotal + SHIPPING_FEE;

  // Fetch saved addresses on mount
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("user_addresses")
          .select("*")
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSavedAddresses(data);
          
          // Find default or most recent address
          const defaultAddress = data.find(a => a.is_default) || data[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setAddressForm({
              name: defaultAddress.recipient_name,
              phone: defaultAddress.phone_number,
              address: `${defaultAddress.address_line1}${defaultAddress.address_line2 ? `, ${defaultAddress.address_line2}` : ""}`,
              city: defaultAddress.city,
              postalCode: defaultAddress.postal_code
            });
          }
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
      } finally {
        setAddressLoading(false);
      }
    };

    loadSavedAddresses();
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (step !== "payment" || isExpired) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, isExpired]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find(a => a.id === addressId);
    if (selected) {
      setAddressForm({
        name: selected.recipient_name,
        phone: selected.phone_number,
        address: `${selected.address_line1}${selected.address_line2 ? `, ${selected.address_line2}` : ""}`,
        city: selected.city,
        postalCode: selected.postal_code
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.phone || !addressForm.address || !addressForm.city || !addressForm.postalCode) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        variant: "destructive"
      });
      return;
    }
    setStep("payment");
    setTimeRemaining(PAYMENT_TIMEOUT);
    setIsExpired(false);
  };

  const handleRefreshOrder = () => {
    setTimeRemaining(PAYMENT_TIMEOUT);
    setIsExpired(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "ไฟล์ไม่ถูกต้อง",
          description: "กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG ฯลฯ)",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ไฟล์ใหญ่เกินไป",
          description: "กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB",
          variant: "destructive"
        });
        return;
      }

      setSlipFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async () => {
    if (!user || !slipFile) return;
    
    setIsProcessing(true);
    
    try {
      // Upload slip to Supabase Storage
      const fileExt = slipFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("payment-slips")
        .upload(fileName, slipFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("payment-slips")
        .getPublicUrl(fileName);

      // Generate order number
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
      
      // Create order with pending status
      const fullAddress = `${addressForm.address}, ${addressForm.city} ${addressForm.postalCode}`;
      
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: "pending",
          payment_method: "promptpay",
          subtotal: cartTotal,
          shipping_fee: SHIPPING_FEE,
          total: grandTotal,
          customer_name: addressForm.name,
          customer_phone: addressForm.phone,
          shipping_address: fullAddress,
          payment_slip_url: publicUrl,
          paid_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Deduct stock for each item
      for (const item of items) {
        // Get current stock
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();
        
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", item.product_id);
        }
      }

      // Clear cart
      await clearCart();

      // Navigate to success page
      navigate(`/order-success?order=${orderNumber}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate PromptPay QR payload
  const promptPayPayload = generatePromptPayPayload(PROMPTPAY_PHONE, grandTotal);

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-4">ตะกร้าสินค้าว่างเปล่า</h1>
            <Button onClick={() => navigate("/shop")}>เลือกซื้อสินค้า</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === "address" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "address" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                1
              </div>
              <span className="font-medium hidden sm:inline">ที่อยู่</span>
            </div>
            <div className="w-12 h-0.5 bg-border" />
            <div className={`flex items-center gap-2 ${step === "payment" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="font-medium hidden sm:inline">ชำระเงิน</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === "address" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      ที่อยู่จัดส่ง
                    </CardTitle>
                    <CardDescription>กรอกข้อมูลสำหรับการจัดส่งสินค้า</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleAddressSubmit}>
                    <CardContent className="space-y-4">
                      {/* Saved Address Selector */}
                      {addressLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      ) : savedAddresses.length > 0 && (
                        <div className="space-y-2">
                          <Label>เลือกที่อยู่ที่บันทึกไว้</Label>
                          <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกที่อยู่..." />
                            </SelectTrigger>
                            <SelectContent>
                              {savedAddresses.map((addr) => (
                                <SelectItem key={addr.id} value={addr.id}>
                                  {addr.recipient_name} - {addr.address_line1.substring(0, 30)}...
                                  {addr.is_default && " ⭐"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            หรือแก้ไขข้อมูลด้านล่างสำหรับคำสั่งซื้อนี้
                          </p>
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                          <Input
                            id="name"
                            value={addressForm.name}
                            onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                            placeholder="กรอกชื่อ-นามสกุล"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                          <Input
                            id="phone"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            placeholder="เช่น 081-234-5678"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">ที่อยู่จัดส่ง *</Label>
                        <Input
                          id="address"
                          value={addressForm.address}
                          onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                          placeholder="บ้านเลขที่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">จังหวัด *</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            placeholder="เช่น เพชรบูรณ์"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">รหัสไปรษณีย์ *</Label>
                          <Input
                            id="postalCode"
                            value={addressForm.postalCode}
                            onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                            placeholder="เช่น 67000"
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => navigate("/cart")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        กลับไปตะกร้า
                      </Button>
                      <Button type="submit">
                        ดำเนินการชำระเงิน
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      ชำระเงินผ่าน QR / พร้อมเพย์
                    </CardTitle>
                    <CardDescription>สแกน QR Code ผ่านแอปธนาคาร</CardDescription>
                    
                    {/* Countdown Timer */}
                    <div className={`flex items-center gap-2 mt-4 p-3 rounded-lg ${isExpired ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">
                        {isExpired 
                          ? "เซสชันหมดอายุ" 
                          : `เวลาที่เหลือในการชำระเงิน: ${formatTime(timeRemaining)}`
                        }
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isExpired ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                        <h3 className="text-xl font-semibold mb-2">เซสชันการชำระเงินหมดอายุ</h3>
                        <p className="text-muted-foreground mb-4">
                          เซสชันการชำระเงินของคุณหมดอายุแล้ว กรุณารีเฟรชเพื่อดำเนินการต่อ
                        </p>
                        <Button onClick={handleRefreshOrder}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          รีเฟรชคำสั่งซื้อ
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* QR Code */}
                        <div className="text-center space-y-4">
                          <h3 className="font-semibold">สแกน QR Code เพื่อชำระเงิน</h3>
                          <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                            <QRCodeSVG 
                              value={promptPayPayload} 
                              size={200}
                              level="M"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">พร้อมเพย์: {PROMPTPAY_PHONE}</p>
                            <p className="text-lg font-bold text-primary">฿{grandTotal.toLocaleString()}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Bank Account Details */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Building2 className="h-4 w-4" />
                            หรือโอนเงินผ่านบัญชีธนาคาร
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ธนาคาร:</span>
                              <span className="font-medium">{BANK_DETAILS.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ชื่อบัญชี:</span>
                              <span className="font-medium">{BANK_DETAILS.accountName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">เลขบัญชี:</span>
                              <span className="font-medium font-mono">{BANK_DETAILS.accountNumber}</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Slip Upload */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">
                            แนบหลักฐานการโอนเงิน *
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            กรุณาแนบสลิปการโอนเงินเพื่อยืนยันการชำระเงิน
                          </p>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          
                          {slipPreview ? (
                            <div className="relative">
                              <img
                                src={slipPreview}
                                alt="ตัวอย่างสลิป"
                                className="max-h-64 mx-auto rounded-lg border shadow-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3 w-full"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                เปลี่ยนรูปภาพ
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
                            >
                              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                              <p className="font-medium">คลิกเพื่ออัปโหลดสลิป</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                รองรับ JPG, PNG (ไม่เกิน 5MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                  {!isExpired && (
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep("address")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        ย้อนกลับ
                      </Button>
                      <Button 
                        onClick={handleConfirmPayment}
                        disabled={isProcessing || !slipFile}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            กำลังดำเนินการ...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            ยืนยันการชำระเงิน
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>สรุปรายการสั่งซื้อ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product.image_url || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-2">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">จำนวน: {item.quantity}</p>
                        <p className="text-sm font-semibold">฿{(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ยอดรวม</span>
                      <span>฿{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ค่าจัดส่ง</span>
                      <span>฿{SHIPPING_FEE.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>ยอดรวมทั้งหมด</span>
                      <span className="text-primary">฿{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;
