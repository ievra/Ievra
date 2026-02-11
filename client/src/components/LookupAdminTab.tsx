import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Plus, Pencil, Trash2, Phone, Mail, User, Shield, Calendar, Clock, Briefcase, CreditCard, X } from "lucide-react";
import type { Client, Interaction, Deal, Transaction } from "@shared/schema";

const interactionFormSchema = z.object({
  type: z.enum(["visit", "meeting", "site_survey", "design", "acceptance", "call", "email"]),
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  description: z.string().optional(),
  date: z.string().min(1, "Ngày bắt buộc"),
  duration: z.string().optional(),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional(),
});

const dealFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  value: z.string().min(1, "Giá trị bắt buộc"),
  stage: z.enum(["proposal", "negotiation", "contract", "delivery", "completed", "lost"]).default("proposal"),
  description: z.string().optional(),
  expectedCloseDate: z.string().optional(),
});

type InteractionFormData = z.infer<typeof interactionFormSchema>;
type DealFormData = z.infer<typeof dealFormSchema>;

const interactionTypeLabels: Record<string, { vi: string; en: string }> = {
  visit: { vi: "Khảo sát", en: "Site Visit" },
  meeting: { vi: "Họp", en: "Meeting" },
  site_survey: { vi: "Khảo sát hiện trạng", en: "Site Survey" },
  design: { vi: "Thiết kế", en: "Design" },
  acceptance: { vi: "Nghiệm thu", en: "Acceptance" },
  call: { vi: "Gọi điện", en: "Phone Call" },
  email: { vi: "Email", en: "Email" },
};

const dealStageLabels: Record<string, { vi: string; en: string }> = {
  proposal: { vi: "Đề xuất", en: "Proposal" },
  negotiation: { vi: "Đàm phán", en: "Negotiation" },
  contract: { vi: "Hợp đồng", en: "Contract" },
  delivery: { vi: "Thi công", en: "Delivery" },
  completed: { vi: "Hoàn thành", en: "Completed" },
  lost: { vi: "Thất bại", en: "Lost" },
};

const stageLabels: Record<string, { vi: string; en: string }> = {
  lead: { vi: "Tiềm năng", en: "Lead" },
  prospect: { vi: "Quan tâm", en: "Prospect" },
  contract: { vi: "Hợp đồng", en: "Contract" },
  delivery: { vi: "Thi công", en: "Delivery" },
  aftercare: { vi: "Hậu mãi", en: "Aftercare" },
};

const tierLabels: Record<string, { vi: string; en: string }> = {
  silver: { vi: "Bạc", en: "Silver" },
  gold: { vi: "Vàng", en: "Gold" },
  platinum: { vi: "Bạch Kim", en: "Platinum" },
  vip: { vi: "VIP", en: "VIP" },
};

export default function LookupAdminTab() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isVi = language === "vi";

  const [phoneSearch, setPhoneSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"interactions" | "deals" | "transactions" | "warranty">("interactions");
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [warrantyStatus, setWarrantyStatus] = useState("none");

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: interactions = [], isLoading: interactionsLoading } = useQuery<Interaction[]>({
    queryKey: ['/api/interactions', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const res = await fetch(`/api/interactions?clientId=${selectedClient.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedClient?.id,
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const res = await fetch(`/api/deals?clientId=${selectedClient.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedClient?.id,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const res = await fetch(`/api/transactions?clientId=${selectedClient.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedClient?.id,
  });

  const interactionForm = useForm<InteractionFormData>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: {
      type: "meeting",
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      duration: "",
      location: "",
      assignedTo: "",
      outcome: "",
      nextAction: "",
      nextActionDate: "",
    },
  });

  const dealForm = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: "",
      value: "",
      stage: "proposal",
      description: "",
      expectedCloseDate: "",
    },
  });

  const handleSearch = () => {
    if (!phoneSearch.trim()) return;
    const normalized = phoneSearch.trim().replace(/[\s\-\.]/g, "");
    const found = clients.find((c) => {
      if (!c.phone) return false;
      const cp = c.phone.replace(/[\s\-\.]/g, "");
      return cp === normalized || cp.endsWith(normalized) || normalized.endsWith(cp);
    });
    if (found) {
      setSelectedClient(found);
      setWarrantyExpiry(found.warrantyExpiry ? new Date(found.warrantyExpiry).toISOString().split("T")[0] : "");
      setWarrantyStatus(found.warrantyStatus || "none");
      setActiveSubTab("interactions");
    } else {
      toast({ title: isVi ? "Không tìm thấy" : "Not found", description: isVi ? "Không tìm thấy khách hàng với số điện thoại này" : "No client found with this phone number", variant: "destructive" });
      setSelectedClient(null);
    }
  };

  const createInteractionMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const body = {
        clientId: selectedClient!.id,
        type: data.type,
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        duration: data.duration ? parseInt(data.duration) : undefined,
        location: data.location || undefined,
        assignedTo: data.assignedTo || undefined,
        outcome: data.outcome || undefined,
        nextAction: data.nextAction || undefined,
        nextActionDate: data.nextActionDate || undefined,
      };
      await apiRequest("POST", "/api/interactions", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactions', selectedClient?.id] });
      setIsInteractionDialogOpen(false);
      interactionForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã thêm nhật ký thi công" : "Interaction added" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateInteractionMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const body = {
        type: data.type,
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        duration: data.duration ? parseInt(data.duration) : undefined,
        location: data.location || undefined,
        assignedTo: data.assignedTo || undefined,
        outcome: data.outcome || undefined,
        nextAction: data.nextAction || undefined,
        nextActionDate: data.nextActionDate || undefined,
      };
      await apiRequest("PUT", `/api/interactions/${editingInteraction!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactions', selectedClient?.id] });
      setIsInteractionDialogOpen(false);
      setEditingInteraction(null);
      interactionForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã cập nhật nhật ký" : "Interaction updated" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteInteractionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/interactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactions', selectedClient?.id] });
      toast({ title: isVi ? "Đã xóa" : "Deleted", description: isVi ? "Đã xóa nhật ký thi công" : "Interaction deleted" });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      const body = {
        clientId: selectedClient!.id,
        title: data.title,
        value: String(Math.round(parseFloat(data.value.replace(/[^0-9.]/g, '')))),
        stage: data.stage,
        description: data.description || undefined,
        expectedCloseDate: data.expectedCloseDate || undefined,
      };
      await apiRequest("POST", "/api/deals", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', selectedClient?.id] });
      setIsDealDialogOpen(false);
      dealForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã thêm hợp đồng" : "Deal added" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      const body = {
        title: data.title,
        value: String(Math.round(parseFloat(data.value.replace(/[^0-9.]/g, '')))),
        stage: data.stage,
        description: data.description || undefined,
        expectedCloseDate: data.expectedCloseDate || undefined,
      };
      await apiRequest("PUT", `/api/deals/${editingDeal!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', selectedClient?.id] });
      setIsDealDialogOpen(false);
      setEditingDeal(null);
      dealForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã cập nhật hợp đồng" : "Deal updated" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/deals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', selectedClient?.id] });
      toast({ title: isVi ? "Đã xóa" : "Deleted", description: isVi ? "Đã xóa hợp đồng" : "Deal deleted" });
    },
  });

  const updateWarrantyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/clients/${selectedClient!.id}`, {
        warrantyStatus,
        warrantyExpiry: warrantyExpiry || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      const updated = { ...selectedClient!, warrantyStatus, warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null };
      setSelectedClient(updated as Client);
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã cập nhật bảo hành" : "Warranty updated" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const openInteractionDialog = (interaction?: Interaction) => {
    if (interaction) {
      setEditingInteraction(interaction);
      interactionForm.reset({
        type: interaction.type as any,
        title: interaction.title,
        description: interaction.description || "",
        date: interaction.date ? new Date(interaction.date).toISOString().split("T")[0] : "",
        duration: interaction.duration?.toString() || "",
        location: interaction.location || "",
        assignedTo: interaction.assignedTo || "",
        outcome: interaction.outcome || "",
        nextAction: interaction.nextAction || "",
        nextActionDate: interaction.nextActionDate ? new Date(interaction.nextActionDate).toISOString().split("T")[0] : "",
      });
    } else {
      setEditingInteraction(null);
      interactionForm.reset({
        type: "meeting",
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        duration: "",
        location: "",
        assignedTo: "",
        outcome: "",
        nextAction: "",
        nextActionDate: "",
      });
    }
    setIsInteractionDialogOpen(true);
  };

  const openDealDialog = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      dealForm.reset({
        title: deal.title,
        value: deal.value,
        stage: deal.stage as any,
        description: deal.description || "",
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split("T")[0] : "",
      });
    } else {
      setEditingDeal(null);
      dealForm.reset({
        title: "",
        value: "",
        stage: "proposal",
        description: "",
        expectedCloseDate: "",
      });
    }
    setIsDealDialogOpen(true);
  };

  const onInteractionSubmit = (data: InteractionFormData) => {
    if (editingInteraction) {
      updateInteractionMutation.mutate(data);
    } else {
      createInteractionMutation.mutate(data);
    }
  };

  const onDealSubmit = (data: DealFormData) => {
    if (editingDeal) {
      updateDealMutation.mutate(data);
    } else {
      createDealMutation.mutate(data);
    }
  };

  const formatDate = (d: string | Date | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(isVi ? "vi-VN" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCurrency = (amount: string) => {
    return Math.round(parseFloat(amount)).toLocaleString("vi-VN") + " đ";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-light text-white whitespace-nowrap">
          {isVi ? "Tra Cứu Khách Hàng" : "Client Lookup"}
        </h2>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="tel"
            placeholder={isVi ? "Nhập số điện thoại khách hàng..." : "Enter client phone number..."}
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-transparent border-white/20 text-white pl-10 rounded-none h-10"
          />
        </div>
        <Button onClick={handleSearch} className="h-10 px-6 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10">
          <Search className="w-4 h-4 mr-2" />
          {isVi ? "Tìm kiếm" : "Search"}
        </Button>
      </div>

      {selectedClient && (
        <>
          <Card className="bg-black border border-white/20 rounded-none">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-white/40" />
                    <h3 className="text-2xl font-light text-white">
                      {selectedClient.lastName} {selectedClient.firstName}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                    {selectedClient.phone && (
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{selectedClient.phone}</span>
                    )}
                    {selectedClient.email && (
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{selectedClient.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="rounded-none border-white/20 text-white/70">
                      {stageLabels[selectedClient.stage]?.[language] || selectedClient.stage}
                    </Badge>
                    <Badge variant="outline" className="rounded-none border-white/20 text-white/70">
                      {tierLabels[selectedClient.tier]?.[language] || selectedClient.tier}
                    </Badge>
                    <Badge variant="outline" className={`rounded-none ${selectedClient.warrantyStatus === "active" ? "border-green-500/40 text-green-400" : selectedClient.warrantyStatus === "expired" ? "border-red-500/40 text-red-400" : "border-white/20 text-white/40"}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {selectedClient.warrantyStatus === "active" ? (isVi ? "Bảo hành" : "Warranty") : selectedClient.warrantyStatus === "expired" ? (isVi ? "Hết hạn" : "Expired") : (isVi ? "Chưa có" : "None")}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="border border-white/20">
            <div className="flex border-b border-white/20 overflow-x-auto">
              {([
                { key: "interactions" as const, vi: "Nhật ký thi công", en: "Construction Log", icon: Clock },
                { key: "deals" as const, vi: "Hợp đồng", en: "Deals", icon: Briefcase },
                { key: "transactions" as const, vi: "Giao dịch", en: "Transactions", icon: CreditCard },
                { key: "warranty" as const, vi: "Bảo hành", en: "Warranty", icon: Shield },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-light tracking-wider whitespace-nowrap transition-colors ${activeSubTab === tab.key ? "text-white border-b-2 border-white -mb-[1px]" : "text-white/40 hover:text-white/70"}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {isVi ? tab.vi : tab.en}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeSubTab === "interactions" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => openInteractionDialog()} className="h-10 px-4 rounded-none bg-white text-black hover:bg-white/90">
                      <Plus className="w-4 h-4 mr-2" />
                      {isVi ? "Thêm nhật ký" : "Add Log"}
                    </Button>
                  </div>
                  {interactionsLoading ? (
                    <div className="text-center py-8 text-white/40">{isVi ? "Đang tải..." : "Loading..."}</div>
                  ) : interactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 font-light">{isVi ? "Chưa có nhật ký thi công" : "No construction logs yet"}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/60">
                            <div>
                              <span>{isVi ? "Ngày" : "Date"}</span>
                              <p className="text-xs font-normal text-white/30">{isVi ? "Loại" : "Type"}</p>
                            </div>
                          </TableHead>
                          <TableHead className="text-white/60">{isVi ? "Tiêu đề" : "Title"}</TableHead>
                          <TableHead className="text-white/60">{isVi ? "Kết quả" : "Outcome"}</TableHead>
                          <TableHead className="text-white/60">{isVi ? "Thao tác" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((interaction) => (
                          <TableRow key={interaction.id} className="border-white/10">
                            <TableCell>
                              <div>
                                <p className="text-white/70">{formatDate(interaction.date)}</p>
                                <Badge variant="outline" className="rounded-none border-white/20 text-white/60 mt-1">
                                  {interactionTypeLabels[interaction.type]?.[language] || interaction.type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-white">{interaction.title}</TableCell>
                            <TableCell className="text-white/60 max-w-[200px] truncate">{interaction.outcome || "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openInteractionDialog(interaction)} className="h-8 w-8 text-white/40 hover:text-white">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-black border border-white/20 rounded-none">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">{isVi ? "Xác nhận xóa" : "Confirm Delete"}</AlertDialogTitle>
                                      <AlertDialogDescription>{isVi ? "Bạn có chắc muốn xóa nhật ký này?" : "Are you sure you want to delete this log?"}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-none">{isVi ? "Hủy" : "Cancel"}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteInteractionMutation.mutate(interaction.id)} className="rounded-none bg-red-600 hover:bg-red-700">{isVi ? "Xóa" : "Delete"}</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {activeSubTab === "deals" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => openDealDialog()} className="h-10 px-4 rounded-none bg-white text-black hover:bg-white/90">
                      <Plus className="w-4 h-4 mr-2" />
                      {isVi ? "Thêm hợp đồng" : "Add Deal"}
                    </Button>
                  </div>
                  {dealsLoading ? (
                    <div className="text-center py-8 text-white/40">{isVi ? "Đang tải..." : "Loading..."}</div>
                  ) : deals.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 font-light">{isVi ? "Chưa có hợp đồng nào" : "No deals yet"}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/60">
                            <div>
                              <span>{isVi ? "Tiêu đề" : "Title"}</span>
                              <p className="text-xs font-normal text-white/30">{isVi ? "Giá trị" : "Value"}</p>
                            </div>
                          </TableHead>
                          <TableHead className="text-white/60">{isVi ? "Giai đoạn" : "Stage"}</TableHead>
                          <TableHead className="text-white/60">
                            <div>
                              <span>{isVi ? "Ngày dự kiến" : "Expected Date"}</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-white/60">{isVi ? "Thao tác" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deals.map((deal) => (
                          <TableRow key={deal.id} className="border-white/10">
                            <TableCell>
                              <div>
                                <p className="text-white">{deal.title}</p>
                                <p className="text-sm text-white/50">{formatCurrency(deal.value)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`rounded-none ${deal.stage === "completed" ? "border-green-500/40 text-green-400" : deal.stage === "lost" ? "border-red-500/40 text-red-400" : "border-white/20 text-white/60"}`}>
                                {dealStageLabels[deal.stage]?.[language] || deal.stage}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white/60">{formatDate(deal.expectedCloseDate)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openDealDialog(deal)} className="h-8 w-8 text-white/40 hover:text-white">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-black border border-white/20 rounded-none">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">{isVi ? "Xác nhận xóa" : "Confirm Delete"}</AlertDialogTitle>
                                      <AlertDialogDescription>{isVi ? "Bạn có chắc muốn xóa hợp đồng này?" : "Are you sure you want to delete this deal?"}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-none">{isVi ? "Hủy" : "Cancel"}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteDealMutation.mutate(deal.id)} className="rounded-none bg-red-600 hover:bg-red-700">{isVi ? "Xóa" : "Delete"}</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {activeSubTab === "transactions" && (
                <div>
                  {transactionsLoading ? (
                    <div className="text-center py-8 text-white/40">{isVi ? "Đang tải..." : "Loading..."}</div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 font-light">{isVi ? "Chưa có giao dịch nào" : "No transactions yet"}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/60">
                            <div>
                              <span>{isVi ? "Ngày" : "Date"}</span>
                              <p className="text-xs font-normal text-white/30">{isVi ? "Tiêu đề" : "Title"}</p>
                            </div>
                          </TableHead>
                          <TableHead className="text-white/60">{isVi ? "Mô tả" : "Description"}</TableHead>
                          <TableHead className="text-white/60">
                            <div>
                              <span>{isVi ? "Loại" : "Type"}</span>
                              <p className="text-xs font-normal text-white/30">{isVi ? "Trạng thái" : "Status"}</p>
                            </div>
                          </TableHead>
                          <TableHead className="text-white/60 text-right">{isVi ? "Số tiền" : "Amount"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id} className="border-white/10">
                            <TableCell>
                              <div>
                                <p className="text-white/70">{formatDate(tx.paymentDate)}</p>
                                <p className="text-sm text-white/50">{tx.title}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-white/60 max-w-[200px] truncate">{tx.description || "—"}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline" className={`rounded-none ${tx.type === "refund" ? "border-red-500/40 text-red-400" : tx.type === "commission" ? "border-yellow-500/40 text-yellow-400" : "border-white/20 text-white/60"}`}>
                                  {tx.type === "refund" ? (isVi ? "Hoàn trả" : "Refund") : tx.type === "commission" ? (isVi ? "Hoa hồng" : "Commission") : (isVi ? "Thanh toán" : "Payment")}
                                </Badge>
                                <Badge variant="outline" className={`rounded-none block w-fit ${tx.status === "completed" ? "border-green-500/40 text-green-400" : tx.status === "cancelled" ? "border-red-500/40 text-red-400" : "border-white/20 text-white/60"}`}>
                                  {tx.status === "completed" ? (isVi ? "Hoàn tất" : "Completed") : tx.status === "cancelled" ? (isVi ? "Đã hủy" : "Cancelled") : (isVi ? "Chờ xử lý" : "Pending")}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-light ${tx.type === "refund" ? "text-red-400" : "text-white"}`}>
                              {tx.type === "refund" ? "-" : "+"}{formatCurrency(tx.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {activeSubTab === "warranty" && (
                <div className="max-w-lg space-y-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">{isVi ? "Trạng thái bảo hành" : "Warranty Status"}</label>
                      <Select value={warrantyStatus} onValueChange={setWarrantyStatus}>
                        <SelectTrigger className="bg-transparent border-white/20 text-white rounded-none h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/20 rounded-none">
                          <SelectItem value="none">{isVi ? "Chưa có" : "None"}</SelectItem>
                          <SelectItem value="active">{isVi ? "Đang hiệu lực" : "Active"}</SelectItem>
                          <SelectItem value="expired">{isVi ? "Hết hạn" : "Expired"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">{isVi ? "Ngày hết hạn bảo hành" : "Warranty Expiry Date"}</label>
                      <Input
                        type="date"
                        value={warrantyExpiry}
                        onChange={(e) => setWarrantyExpiry(e.target.value)}
                        className="bg-transparent border-white/20 text-white rounded-none h-10"
                      />
                    </div>
                    <Button
                      onClick={() => updateWarrantyMutation.mutate()}
                      disabled={updateWarrantyMutation.isPending}
                      className="h-10 px-6 rounded-none bg-white text-black hover:bg-white/90"
                    >
                      {updateWarrantyMutation.isPending ? (isVi ? "Đang lưu..." : "Saving...") : (isVi ? "Cập nhật bảo hành" : "Update Warranty")}
                    </Button>
                  </div>
                  {selectedClient.warrantyExpiry && (
                    <div className="border border-white/10 p-4">
                      <p className="text-white/40 text-sm">{isVi ? "Hết hạn hiện tại:" : "Current expiry:"}</p>
                      <p className="text-white font-light">{formatDate(selectedClient.warrantyExpiry)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
        <DialogContent className="bg-black border border-white/20 rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-light">
              {editingInteraction ? (isVi ? "Sửa nhật ký thi công" : "Edit Construction Log") : (isVi ? "Thêm nhật ký thi công" : "Add Construction Log")}
            </DialogTitle>
          </DialogHeader>
          <Form {...interactionForm}>
            <form onSubmit={interactionForm.handleSubmit(onInteractionSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={interactionForm.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">{isVi ? "Loại" : "Type"}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-white/20 text-white rounded-none h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-black border-white/20 rounded-none">
                        {Object.entries(interactionTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{isVi ? label.vi : label.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={interactionForm.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">{isVi ? "Ngày" : "Date"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={interactionForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Tiêu đề" : "Title"}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={interactionForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Mô tả" : "Description"}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-transparent border-white/20 text-white rounded-none min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={interactionForm.control} name="duration" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">{isVi ? "Thời lượng (phút)" : "Duration (min)"}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={interactionForm.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">{isVi ? "Địa điểm" : "Location"}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={interactionForm.control} name="assignedTo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Người phụ trách" : "Assigned To"}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={interactionForm.control} name="outcome" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Kết quả" : "Outcome"}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-transparent border-white/20 text-white rounded-none min-h-[60px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={interactionForm.control} name="nextAction" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">{isVi ? "Bước tiếp theo" : "Next Action"}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={interactionForm.control} name="nextActionDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">{isVi ? "Ngày tiếp theo" : "Next Action Date"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsInteractionDialogOpen(false)} className="h-10 px-4 rounded-none border-white/20 text-white hover:bg-white/10">
                  {isVi ? "Hủy" : "Cancel"}
                </Button>
                <Button type="submit" disabled={createInteractionMutation.isPending || updateInteractionMutation.isPending} className="h-10 px-6 rounded-none bg-white text-black hover:bg-white/90">
                  {(createInteractionMutation.isPending || updateInteractionMutation.isPending) ? (isVi ? "Đang lưu..." : "Saving...") : editingInteraction ? (isVi ? "Cập nhật" : "Update") : (isVi ? "Thêm" : "Add")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
        <DialogContent className="bg-black border border-white/20 rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-light">
              {editingDeal ? (isVi ? "Sửa hợp đồng" : "Edit Deal") : (isVi ? "Thêm hợp đồng" : "Add Deal")}
            </DialogTitle>
          </DialogHeader>
          <Form {...dealForm}>
            <form onSubmit={dealForm.handleSubmit(onDealSubmit)} className="space-y-4">
              <FormField control={dealForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Tiêu đề" : "Title"}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={dealForm.control} name="value" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">{isVi ? "Giá trị (VNĐ)" : "Value (VND)"}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={dealForm.control} name="stage" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">{isVi ? "Giai đoạn" : "Stage"}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-white/20 text-white rounded-none h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-black border-white/20 rounded-none">
                        {Object.entries(dealStageLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{isVi ? label.vi : label.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={dealForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Mô tả" : "Description"}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-transparent border-white/20 text-white rounded-none min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={dealForm.control} name="expectedCloseDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Ngày dự kiến hoàn thành" : "Expected Close Date"}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDealDialogOpen(false)} className="h-10 px-4 rounded-none border-white/20 text-white hover:bg-white/10">
                  {isVi ? "Hủy" : "Cancel"}
                </Button>
                <Button type="submit" disabled={createDealMutation.isPending || updateDealMutation.isPending} className="h-10 px-6 rounded-none bg-white text-black hover:bg-white/90">
                  {(createDealMutation.isPending || updateDealMutation.isPending) ? (isVi ? "Đang lưu..." : "Saving...") : editingDeal ? (isVi ? "Cập nhật" : "Update") : (isVi ? "Thêm" : "Add")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
