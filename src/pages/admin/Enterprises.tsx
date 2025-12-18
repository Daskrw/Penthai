import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
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
import { Eye, Download, Search, Check, X, Clock, FileText, Users, Building, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type EnterpriseStatus = "pending" | "approved" | "rejected";

interface Enterprise {
  id: string;
  citizen_id: string;
  full_name: string;
  phone: string;
  enterprise_name: string;
  province: string;
  district: string | null;
  address: string | null;
  member_count: number;
  status: EnterpriseStatus;
  rejection_reason: string | null;
  documents: any;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

interface Settings {
  id: string;
  registration_open: boolean;
  notification_email: string | null;
  announcement: string | null;
}

const Enterprises = () => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('enterprise-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_enterprises'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setEnterprises(prev => [payload.new as Enterprise, ...prev]);
            toast.info("คำขอใหม่!", {
              description: `${(payload.new as Enterprise).enterprise_name} ยื่นคำขอจดทะเบียน`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setEnterprises(prev => 
              prev.map(e => e.id === payload.new.id ? payload.new as Enterprise : e)
            );
          } else if (payload.eventType === 'DELETE') {
            setEnterprises(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [enterprisesRes, settingsRes] = await Promise.all([
        supabase
          .from("community_enterprises")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("enterprise_settings").select("*").single(),
      ]);

      if (enterprisesRes.data) {
        setEnterprises(enterprisesRes.data as Enterprise[]);
      }
      if (settingsRes.data) {
        setSettings(settingsRes.data as Settings);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    toast.success("รีเฟรชข้อมูลเรียบร้อยแล้ว");
  };

  const handleApprove = async () => {
    if (!selectedEnterprise) return;

    try {
      const { error } = await supabase
        .from("community_enterprises")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", selectedEnterprise.id);

      if (error) throw error;

      toast.success("อนุมัติการจดทะเบียนเรียบร้อยแล้ว");
      setReviewDialogOpen(false);
      setSelectedEnterprise(null);
      loadData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const handleReject = async () => {
    if (!selectedEnterprise || !rejectionReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    try {
      const { error } = await supabase
        .from("community_enterprises")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedEnterprise.id);

      if (error) throw error;

      toast.success("ปฏิเสธการจดทะเบียนเรียบร้อยแล้ว");
      setReviewDialogOpen(false);
      setSelectedEnterprise(null);
      setRejectionReason("");
      loadData();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("เกิดข้อผิดพลาดในการปฏิเสธ");
    }
  };

  const handleSettingsUpdate = async (updates: Partial<Settings>) => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from("enterprise_settings")
        .update(updates)
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const getStatusBadge = (status: EnterpriseStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            รอตรวจสอบ
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <Check className="w-3 h-3 mr-1" />
            อนุมัติ
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <X className="w-3 h-3 mr-1" />
            ปฏิเสธ
          </Badge>
        );
    }
  };

  const pendingEnterprises = enterprises.filter((e) => e.status === "pending");

  const filteredEnterprises = enterprises.filter((e) => {
    const matchesSearch =
      e.enterprise_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.citizen_id.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesProvince = provinceFilter === "all" || e.province === provinceFilter;
    return matchesSearch && matchesStatus && matchesProvince;
  });

  const uniqueProvinces = [...new Set(enterprises.map((e) => e.province))];

  const stats = {
    total: enterprises.length,
    pending: enterprises.filter((e) => e.status === "pending").length,
    approved: enterprises.filter((e) => e.status === "approved").length,
    rejected: enterprises.filter((e) => e.status === "rejected").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ทะเบียนวิสาหกิจชุมชน</h1>
          <p className="text-muted-foreground mt-1">จัดการคำขอจดทะเบียนและข้อมูลวิสาหกิจชุมชน</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">ทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">รอตรวจสอบ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">อนุมัติ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">ปฏิเสธ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            คำขอรอตรวจสอบ
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="w-4 h-4" />
            ทะเบียนทั้งหมด
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Users className="w-4 h-4" />
            ตั้งค่าระบบ
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pending Requests */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>คำขอจดทะเบียนรอตรวจสอบ</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingEnterprises.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีคำขอที่รอตรวจสอบในขณะนี้</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>ชื่อวิสาหกิจ</TableHead>
                      <TableHead>ผู้แทน (เลขบัตร)</TableHead>
                      <TableHead>จังหวัด</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">ดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEnterprises.map((enterprise) => (
                      <TableRow key={enterprise.id}>
                        <TableCell>
                          {format(new Date(enterprise.created_at), "d MMM yyyy", { locale: th })}
                        </TableCell>
                        <TableCell className="font-medium">{enterprise.enterprise_name}</TableCell>
                        <TableCell>
                          <div>
                            <p>{enterprise.full_name}</p>
                            <p className="text-xs text-muted-foreground">{enterprise.citizen_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>{enterprise.province}</TableCell>
                        <TableCell>{getStatusBadge(enterprise.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEnterprise(enterprise);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            ตรวจสอบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: All Enterprises */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>ฐานข้อมูลวิสาหกิจชุมชน</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาชื่อวิสาหกิจ, ผู้แทน, เลขบัตร..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                    <SelectItem value="approved">อนุมัติ</SelectItem>
                    <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="จังหวัด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกจังหวัด</SelectItem>
                    {uniqueProvinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredEnterprises.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>ชื่อวิสาหกิจ</TableHead>
                      <TableHead>ผู้แทน</TableHead>
                      <TableHead>จังหวัด</TableHead>
                      <TableHead>สมาชิก</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">ดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnterprises.map((enterprise) => (
                      <TableRow key={enterprise.id}>
                        <TableCell>
                          {format(new Date(enterprise.created_at), "d MMM yyyy", { locale: th })}
                        </TableCell>
                        <TableCell className="font-medium">{enterprise.enterprise_name}</TableCell>
                        <TableCell>{enterprise.full_name}</TableCell>
                        <TableCell>{enterprise.province}</TableCell>
                        <TableCell>{enterprise.member_count} คน</TableCell>
                        <TableCell>{getStatusBadge(enterprise.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEnterprise(enterprise);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Settings */}
        <TabsContent value="settings">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>การตั้งค่าระบบลงทะเบียน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">เปิด/ปิดระบบลงทะเบียน</Label>
                    <p className="text-sm text-muted-foreground">
                      เมื่อปิดระบบ ผู้ใช้จะไม่สามารถลงทะเบียนใหม่ได้
                    </p>
                  </div>
                  <Switch
                    checked={settings?.registration_open ?? true}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({ registration_open: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>อีเมลรับการแจ้งเตือน</Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={settings?.notification_email ?? ""}
                    onChange={(e) =>
                      setSettings(
                        settings ? { ...settings, notification_email: e.target.value } : null
                      )
                    }
                    onBlur={() =>
                      handleSettingsUpdate({ notification_email: settings?.notification_email })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    ระบบจะส่งอีเมลแจ้งเตือนเมื่อมีคำขอลงทะเบียนใหม่
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>ประกาศ/แนวทาง</Label>
                  <Textarea
                    placeholder="ข้อความประกาศที่จะแสดงในหน้าลงทะเบียน..."
                    value={settings?.announcement ?? ""}
                    onChange={(e) =>
                      setSettings(settings ? { ...settings, announcement: e.target.value } : null)
                    }
                    onBlur={() => handleSettingsUpdate({ announcement: settings?.announcement })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    ข้อความนี้จะแสดงในหน้าลงทะเบียนวิสาหกิจชุมชน
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดคำขอจดทะเบียน</DialogTitle>
            <DialogDescription>
              ตรวจสอบข้อมูลและเอกสารก่อนอนุมัติหรือปฏิเสธ
            </DialogDescription>
          </DialogHeader>

          {selectedEnterprise && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">ชื่อวิสาหกิจชุมชน</Label>
                  <p className="font-medium">{selectedEnterprise.enterprise_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">สถานะปัจจุบัน</Label>
                  <div className="mt-1">{getStatusBadge(selectedEnterprise.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">ชื่อ-นามสกุลผู้แทน</Label>
                  <p className="font-medium">{selectedEnterprise.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">เลขบัตรประชาชน</Label>
                  <p className="font-medium">{selectedEnterprise.citizen_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">เบอร์โทรศัพท์</Label>
                  <p className="font-medium">{selectedEnterprise.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">จังหวัด</Label>
                  <p className="font-medium">{selectedEnterprise.province}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">จำนวนสมาชิก</Label>
                  <p className="font-medium">{selectedEnterprise.member_count} คน</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">วันที่ยื่นคำขอ</Label>
                  <p className="font-medium">
                    {format(new Date(selectedEnterprise.created_at), "d MMMM yyyy เวลา HH:mm น.", {
                      locale: th,
                    })}
                  </p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">เอกสารแนบ</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-center text-muted-foreground">สำเนาบัตรประชาชน</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-center text-muted-foreground">สำเนาทะเบียนบ้าน</p>
                  </div>
                </div>
              </div>

              {selectedEnterprise.status === "rejected" && selectedEnterprise.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <Label className="text-red-800 text-xs">เหตุผลที่ปฏิเสธ</Label>
                  <p className="text-red-700 mt-1">{selectedEnterprise.rejection_reason}</p>
                </div>
              )}

              {selectedEnterprise.status === "pending" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>เหตุผลในการปฏิเสธ (หากต้องการปฏิเสธ)</Label>
                    <Textarea
                      placeholder="ระบุเหตุผลที่ปฏิเสธคำขอนี้..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedEnterprise?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  <X className="w-4 h-4 mr-2" />
                  ปฏิเสธ
                </Button>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 mr-2" />
                  อนุมัติ
                </Button>
              </>
            )}
            {selectedEnterprise?.status !== "pending" && (
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                ปิด
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Enterprises;
