import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, Search, Phone, MessageCircle, Package, Award, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type SellerApplication = {
  id: string;
  created_at: string;
  contact_name: string;
  shop_name: string;
  phone: string;
  line_id: string | null;
  product_name: string | null;
  category: string | null;
  price: number | null;
  description: string | null;
  product_images: string[];
  certifications: string[];
  other_certification: string | null;
  status: 'pending' | 'contacted' | 'approved' | 'rejected';
  admin_notes: string | null;
};

const statusConfig = {
  pending: { label: "รอตรวจสอบ", variant: "warning" as const, color: "bg-yellow-100 text-yellow-800" },
  contacted: { label: "ติดต่อแล้ว", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
  approved: { label: "อนุมัติ", variant: "success" as const, color: "bg-green-100 text-green-800" },
  rejected: { label: "ปฏิเสธ", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
};

const categoryLabels: Record<string, string> = {
  food: "อาหาร/เครื่องดื่ม",
  textile: "ผ้าทอ/เครื่องแต่งกาย",
  handicraft: "ของใช้/ของตกแต่ง",
  herbal: "สมุนไพร",
  agriculture: "สินค้าเกษตร",
  other: "อื่นๆ",
};

const certificationLabels: Record<string, string> = {
  otop: "OTOP (1-5 ดาว)",
  fda: "อย. (FDA)",
  community: "มผช.",
  halal: "ฮาลาล",
  other: "อื่นๆ",
};

const SellerRequests = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<SellerApplication | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion since we know the structure
      setApplications((data || []) as unknown as SellerApplication[]);
    } catch (error: any) {
      toast.error("โหลดข้อมูลไม่สำเร็จ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    // Real-time subscription
    const channel = supabase
      .channel('seller-applications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seller_applications' },
        () => fetchApplications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, newStatus: SellerApplication['status']) => {
    try {
      const { error } = await supabase
        .from('seller_applications')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString()
        } as any)
        .eq('id', id);

      if (error) throw error;
      toast.success("อัปเดตสถานะสำเร็จ");
      fetchApplications();
    } catch (error: any) {
      toast.error("อัปเดตไม่สำเร็จ: " + error.message);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">คำขอจำหน่ายสินค้า</h1>
          <p className="text-muted-foreground">จัดการคำขอลงทะเบียนจำหน่ายสินค้าจากผู้ค้า</p>
        </div>
        <Button onClick={fetchApplications} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อร้าน, ชื่อผู้ติดต่อ, เบอร์โทร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="กรองตามสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="pending">รอตรวจสอบ</SelectItem>
            <SelectItem value="contacted">ติดต่อแล้ว</SelectItem>
            <SelectItem value="approved">อนุมัติ</SelectItem>
            <SelectItem value="rejected">ปฏิเสธ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = applications.filter((a) => a.status === status).length;
          return (
            <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{config.label}</span>
                  <Badge className={config.color}>{count}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              ไม่พบคำขอลงทะเบียน
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ชื่อร้าน/กลุ่ม</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="text-sm">
                      {format(new Date(app.created_at), "d MMM yyyy", { locale: th })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{app.shop_name}</div>
                        <div className="text-sm text-muted-foreground">{app.contact_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {app.product_name || "-"}
                        {app.category && (
                          <div className="text-muted-foreground text-xs">
                            {categoryLabels[app.category] || app.category}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${app.phone}`} className="text-primary hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {app.phone}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[app.status].color}>
                        {statusConfig[app.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={app.status}
                          onValueChange={(value) => updateStatus(app.id, value as SellerApplication['status'])}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                            <SelectItem value="contacted">ติดต่อแล้ว</SelectItem>
                            <SelectItem value="approved">อนุมัติ</SelectItem>
                            <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedApp.shop_name}</DialogTitle>
                <DialogDescription>
                  ลงทะเบียนเมื่อ {format(new Date(selectedApp.created_at), "d MMMM yyyy เวลา HH:mm น.", { locale: th })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    ข้อมูลผู้ติดต่อ
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                    <div>
                      <span className="text-muted-foreground">ชื่อ:</span>
                      <p className="font-medium">{selectedApp.contact_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">เบอร์โทร:</span>
                      <p className="font-medium">
                        <a href={`tel:${selectedApp.phone}`} className="text-primary hover:underline">
                          {selectedApp.phone}
                        </a>
                      </p>
                    </div>
                    {selectedApp.line_id && (
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> Line ID:
                        </span>
                        <p className="font-medium">{selectedApp.line_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    ข้อมูลสินค้า
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3 text-sm">
                    {selectedApp.product_name && (
                      <div>
                        <span className="text-muted-foreground">ชื่อสินค้า:</span>
                        <p className="font-medium">{selectedApp.product_name}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedApp.category && (
                        <div>
                          <span className="text-muted-foreground">หมวดหมู่:</span>
                          <p className="font-medium">{categoryLabels[selectedApp.category] || selectedApp.category}</p>
                        </div>
                      )}
                      {selectedApp.price && (
                        <div>
                          <span className="text-muted-foreground">ราคาโดยประมาณ:</span>
                          <p className="font-medium">{selectedApp.price.toLocaleString()} บาท</p>
                        </div>
                      )}
                    </div>
                    {selectedApp.description && (
                      <div>
                        <span className="text-muted-foreground">รายละเอียด:</span>
                        <p className="font-medium whitespace-pre-wrap">{selectedApp.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Images */}
                {selectedApp.product_images && selectedApp.product_images.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">ภาพสินค้า</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedApp.product_images.map((url, index) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {selectedApp.certifications && selectedApp.certifications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      มาตรฐานที่ได้รับ
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.certifications.map((cert) => (
                        <Badge key={cert} variant="outline">
                          {certificationLabels[cert] || cert}
                        </Badge>
                      ))}
                      {selectedApp.other_certification && (
                        <Badge variant="outline">{selectedApp.other_certification}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-sm text-muted-foreground mr-2">สถานะ:</span>
                    <Badge className={statusConfig[selectedApp.status].color}>
                      {statusConfig[selectedApp.status].label}
                    </Badge>
                  </div>
                  <Select
                    value={selectedApp.status}
                    onValueChange={(value) => {
                      const newStatus = value as SellerApplication['status'];
                      updateStatus(selectedApp.id, newStatus);
                      setSelectedApp({ ...selectedApp, status: newStatus });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="เปลี่ยนสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                      <SelectItem value="contacted">ติดต่อแล้ว</SelectItem>
                      <SelectItem value="approved">อนุมัติ</SelectItem>
                      <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerRequests;
