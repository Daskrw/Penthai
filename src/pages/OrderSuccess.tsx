import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Home, FileText } from "lucide-react";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderNumber = searchParams.get("order");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="text-center">
            <CardHeader className="pb-2">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Order Successful!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for your purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {orderNumber && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                  <p className="text-xl font-bold font-mono">{orderNumber}</p>
                </div>
              )}
              
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Order Confirmed</p>
                    <p className="text-sm text-muted-foreground">
                      We've received your order and will process it shortly.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Order Details</p>
                    <p className="text-sm text-muted-foreground">
                      You can view your order details in your account.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => navigate("/account")}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Orders
              </Button>
              <Button 
                className="w-full sm:w-auto"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderSuccess;
