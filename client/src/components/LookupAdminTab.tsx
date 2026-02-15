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
import { Search, Plus, Pencil, Trash2, Phone, Mail, User, Shield, Calendar, Clock, Briefcase, CreditCard, X, HardHat, PenTool, Eye, Settings, ChevronLeft, ChevronRight, Check } from "lucide-react";
import CrmSettingsManager from "@/components/CrmSettingsManager";
import type { Client, Interaction, Deal, Transaction, WarrantyLog, ConstructionPhase, DesignPhase } from "@shared/schema";

const interactionFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  description: z.string().optional(),
  date: z.string().min(1, "Ngày bắt buộc"),
  phase: z.string().optional(),
  assignedTo: z.string().optional(),
  nextAction: z.string().optional(),
});

const dealFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  value: z.string().min(1, "Giá trị bắt buộc"),
  stage: z.enum(["proposal", "negotiation", "contract", "delivery", "completed", "lost"]).default("proposal"),
  description: z.string().optional(),
  expectedCloseDate: z.string().optional(),
});

const warrantyLogFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  description: z.string().optional(),
  date: z.string().min(1, "Ngày bắt buộc"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
});

type InteractionFormData = z.infer<typeof interactionFormSchema>;
type DealFormData = z.infer<typeof dealFormSchema>;
type WarrantyLogFormData = z.infer<typeof warrantyLogFormSchema>;

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
  const [activeSubTab, setActiveSubTab] = useState<"interactions" | "construction_progress" | "design_progress" | "transactions" | "warranty">("design_progress");
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isWarrantyLogDialogOpen, setIsWarrantyLogDialogOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [viewingInteraction, setViewingInteraction] = useState<Interaction | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editingWarrantyLog, setEditingWarrantyLog] = useState<WarrantyLog | null>(null);
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [warrantyStatus, setWarrantyStatus] = useState("none");
  const [interactionAttachments, setInteractionAttachments] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isDesignInteractionDialogOpen, setIsDesignInteractionDialogOpen] = useState(false);
  const [editingDesignInteraction, setEditingDesignInteraction] = useState<Interaction | null>(null);
  const [viewingDesignInteraction, setViewingDesignInteraction] = useState<Interaction | null>(null);
  const [designInteractionAttachments, setDesignInteractionAttachments] = useState<string[]>([]);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: constructionPhases = [] } = useQuery<ConstructionPhase[]>({
    queryKey: ['/api/construction-phases', 'active'],
    queryFn: () => fetch('/api/construction-phases?active=true').then(r => r.json()),
  });

  const { data: designPhases = [] } = useQuery<DesignPhase[]>({
    queryKey: ['/api/design-phases', 'active'],
    queryFn: () => fetch('/api/design-phases?active=true').then(r => r.json()),
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

  const constructionInteractions = interactions.filter(i => i.type !== "design");
  const designInteractions = interactions.filter(i => i.type === "design");

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

  const { data: warrantyLogs = [], isLoading: warrantyLogsLoading } = useQuery<WarrantyLog[]>({
    queryKey: ['/api/warranty-logs', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const res = await fetch(`/api/warranty-logs?clientId=${selectedClient.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedClient?.id,
  });

  const interactionForm = useForm<InteractionFormData>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      phase: "",
      assignedTo: "",
      nextAction: "",
    },
  });

  const designInteractionForm = useForm<InteractionFormData>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      phase: "",
      assignedTo: "",
      nextAction: "",
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

  const warrantyLogForm = useForm<WarrantyLogFormData>({
    resolver: zodResolver(warrantyLogFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
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
      setActiveSubTab("design_progress");
    } else {
      toast({ title: isVi ? "Không tìm thấy" : "Not found", description: isVi ? "Không tìm thấy khách hàng với số điện thoại này" : "No client found with this phone number", variant: "destructive" });
      setSelectedClient(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 5 - interactionAttachments.length;
    if (remaining <= 0) {
      toast({ title: isVi ? "Giới hạn" : "Limit", description: isVi ? "Tối đa 5 hình ảnh" : "Maximum 5 images", variant: "destructive" });
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploadingImage(true);
    try {
      const newAttachments: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const formData = new FormData();
        formData.append('file', filesToUpload[i]);
        const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
        const data = await res.json();
        if (data.path) newAttachments.push(data.path);
        else if (data.url) newAttachments.push(data.url);
      }
      setInteractionAttachments(prev => [...prev, ...newAttachments]);
    } catch {
      toast({ title: isVi ? "Lỗi" : "Error", description: isVi ? "Lỗi tải hình" : "Upload failed", variant: "destructive" });
    }
    setUploadingImage(false);
  };

  const createInteractionMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const body = {
        clientId: selectedClient!.id,
        type: "meeting",
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        phase: data.phase || undefined,
        assignedTo: data.assignedTo || undefined,
        nextAction: data.nextAction || undefined,
        attachments: interactionAttachments.length > 0 ? interactionAttachments : undefined,
      };
      await apiRequest("POST", "/api/interactions", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactions', selectedClient?.id] });
      setIsInteractionDialogOpen(false);
      setInteractionAttachments([]);
      interactionForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã thêm nhật ký thi công" : "Log added" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateInteractionMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const body = {
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        phase: data.phase || undefined,
        assignedTo: data.assignedTo || undefined,
        nextAction: data.nextAction || undefined,
        attachments: interactionAttachments,
      };
      await apiRequest("PUT", `/api/interactions/${editingInteraction!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactions', selectedClient?.id] });
      setIsInteractionDialogOpen(false);
      setEditingInteraction(null);
      setInteractionAttachments([]);
      interactionForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã cập nhật nhật ký" : "Log updated" });
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

  const [editingTimeline, setEditingTimeline] = useState(false);
  const [timelineValue, setTimelineValue] = useState<string>("");

  const [editingDesignTimeline, setEditingDesignTimeline] = useState(false);
  const [designTimelineValue, setDesignTimelineValue] = useState<string>("");

  const updateTimelineMutation = useMutation({
    mutationFn: async (days: number) => {
      await apiRequest("PUT", `/api/clients/${selectedClient!.id}`, {
        constructionTimeline: days,
      });
    },
    onSuccess: (_data, days) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setSelectedClient({ ...selectedClient!, constructionTimeline: days } as Client);
      setEditingTimeline(false);
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã cập nhật mục tiêu thi công" : "Construction timeline updated" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateDesignTimelineMutation = useMutation({
    mutationFn: async (days: number) => {
      await apiRequest("PUT", `/api/clients/${selectedClient!.id}`, {
        designTimeline: days,
      });
    },
    onSuccess: (_data, days) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setSelectedClient({ ...selectedClient!, designTimeline: days } as Client);
      setEditingDesignTimeline(false);
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã cập nhật mục tiêu thiết kế" : "Design timeline updated" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
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

  const createWarrantyLogMutation = useMutation({
    mutationFn: async (data: WarrantyLogFormData) => {
      await apiRequest("POST", "/api/warranty-logs", {
        clientId: selectedClient!.id,
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warranty-logs', selectedClient?.id] });
      setIsWarrantyLogDialogOpen(false);
      warrantyLogForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã thêm nhật ký bảo hành" : "Warranty log added" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateWarrantyLogMutation = useMutation({
    mutationFn: async (data: WarrantyLogFormData) => {
      await apiRequest("PUT", `/api/warranty-logs/${editingWarrantyLog!.id}`, {
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warranty-logs', selectedClient?.id] });
      setIsWarrantyLogDialogOpen(false);
      setEditingWarrantyLog(null);
      warrantyLogForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã cập nhật nhật ký bảo hành" : "Warranty log updated" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteWarrantyLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/warranty-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warranty-logs', selectedClient?.id] });
      toast({ title: isVi ? "Đã xóa" : "Deleted", description: isVi ? "Đã xóa nhật ký bảo hành" : "Warranty log deleted" });
    },
  });

  const openWarrantyLogDialog = (log?: WarrantyLog) => {
    if (log) {
      setEditingWarrantyLog(log);
      warrantyLogForm.reset({
        title: log.title,
        description: log.description || "",
        date: log.date ? new Date(log.date).toISOString().split("T")[0] : "",
        status: (log.status as any) || "pending",
      });
    } else {
      setEditingWarrantyLog(null);
      warrantyLogForm.reset({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      });
    }
    setIsWarrantyLogDialogOpen(true);
  };

  const onWarrantyLogSubmit = (data: WarrantyLogFormData) => {
    if (editingWarrantyLog) {
      updateWarrantyLogMutation.mutate(data);
    } else {
      createWarrantyLogMutation.mutate(data);
    }
  };

  const openInteractionDialog = (interaction?: Interaction) => {
    if (interaction) {
      setEditingInteraction(interaction);
      interactionForm.reset({
        title: interaction.title,
        description: interaction.description || "",
        date: interaction.date ? new Date(interaction.date).toISOString().split("T")[0] : "",
        phase: (interaction as any).phase || "",
        assignedTo: interaction.assignedTo || "",
        nextAction: interaction.nextAction || "",
      });
      setInteractionAttachments(Array.isArray(interaction.attachments) ? (interaction.attachments as string[]) : []);
    } else {
      setEditingInteraction(null);
      interactionForm.reset({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        phase: "",
        assignedTo: "",
        nextAction: "",
      });
      setInteractionAttachments([]);
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

  const createDesignInteractionMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const body = {
        clientId: selectedClient!.id,
        type: "design",
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        phase: data.phase || undefined,
        assignedTo: data.assignedTo || undefined,
        nextAction: data.nextAction || undefined,
        attachments: designInteractionAttachments.length > 0 ? designInteractionAttachments : undefined,
      };
      await apiRequest("POST", "/api/interactions", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactions', selectedClient?.id] });
      setIsDesignInteractionDialogOpen(false);
      setDesignInteractionAttachments([]);
      designInteractionForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã thêm nhật ký thiết kế" : "Design log added" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateDesignInteractionMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const body = {
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        phase: data.phase || undefined,
        assignedTo: data.assignedTo || undefined,
        nextAction: data.nextAction || undefined,
        attachments: designInteractionAttachments,
      };
      await apiRequest("PUT", `/api/interactions/${editingDesignInteraction!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactions', selectedClient?.id] });
      setIsDesignInteractionDialogOpen(false);
      setEditingDesignInteraction(null);
      setDesignInteractionAttachments([]);
      designInteractionForm.reset();
      toast({ title: isVi ? "Thành công" : "Success", description: isVi ? "Đã cập nhật nhật ký" : "Log updated" });
    },
    onError: (err: Error) => {
      toast({ title: isVi ? "Lỗi" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteDesignInteractionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/interactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactions', selectedClient?.id] });
      toast({ title: isVi ? "Đã xóa" : "Deleted", description: isVi ? "Đã xóa nhật ký thiết kế" : "Design log deleted" });
    },
  });

  const onInteractionSubmit = (data: InteractionFormData) => {
    if (editingInteraction) {
      updateInteractionMutation.mutate(data);
    } else {
      createInteractionMutation.mutate(data);
    }
  };

  const openDesignInteractionDialog = (interaction?: Interaction) => {
    if (interaction) {
      setEditingDesignInteraction(interaction);
      designInteractionForm.reset({
        title: interaction.title,
        description: interaction.description || "",
        date: interaction.date ? new Date(interaction.date).toISOString().split("T")[0] : "",
        phase: (interaction as any).phase || "",
        assignedTo: interaction.assignedTo || "",
        nextAction: interaction.nextAction || "",
      });
      setDesignInteractionAttachments(Array.isArray(interaction.attachments) ? (interaction.attachments as string[]) : []);
    } else {
      setEditingDesignInteraction(null);
      designInteractionForm.reset({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        phase: "",
        assignedTo: "",
        nextAction: "",
      });
      setDesignInteractionAttachments([]);
    }
    setIsDesignInteractionDialogOpen(true);
  };

  const onDesignInteractionSubmit = (data: InteractionFormData) => {
    if (editingDesignInteraction) {
      updateDesignInteractionMutation.mutate(data);
    } else {
      createDesignInteractionMutation.mutate(data);
    }
  };

  const handleDesignImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 5 - designInteractionAttachments.length;
    if (remaining <= 0) {
      toast({ title: isVi ? "Giới hạn" : "Limit", description: isVi ? "Tối đa 5 hình ảnh" : "Maximum 5 images", variant: "destructive" });
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploadingImage(true);
    try {
      const newAttachments: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const formData = new FormData();
        formData.append('file', filesToUpload[i]);
        const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
        const data = await res.json();
        if (data.path) newAttachments.push(data.path);
        else if (data.url) newAttachments.push(data.url);
      }
      setDesignInteractionAttachments(prev => [...prev, ...newAttachments]);
    } catch {
      toast({ title: isVi ? "Lỗi" : "Error", description: isVi ? "Lỗi tải hình" : "Upload failed", variant: "destructive" });
    }
    setUploadingImage(false);
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
      <div className="flex items-end gap-4">
        <h2 className="text-xl font-light text-white whitespace-nowrap leading-none pb-[9px]">
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
        <Button
          variant="outline"
          onClick={() => setIsSettingsDialogOpen(true)}
          className="h-10 px-4 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4 mr-2" />
          {isVi ? "Cài Đặt" : "Settings"}
        </Button>
      </div>
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">{isVi ? "Cài Đặt" : "Settings"}</DialogTitle>
          </DialogHeader>
          <CrmSettingsManager context="lookup" />
        </DialogContent>
      </Dialog>
      {selectedClient && (
        <>
          <Card className="bg-black border border-white/20 rounded-none">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-light text-white">
                    {selectedClient.lastName} {selectedClient.firstName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 pl-0.5">
                    {selectedClient.phone && (
                      <span>{selectedClient.phone}</span>
                    )}
                    {selectedClient.phone && selectedClient.email && (
                      <span className="text-white/20">-</span>
                    )}
                    {selectedClient.email && (
                      <span>{selectedClient.email}</span>
                    )}
                  </div>
                  {(selectedClient.company || selectedClient.address) && (
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/40 pl-0.5">
                      {selectedClient.company && (
                        <span>{selectedClient.company}</span>
                      )}
                      {selectedClient.company && selectedClient.address && (
                        <span className="text-white/20">-</span>
                      )}
                      {selectedClient.address && (
                        <span>{selectedClient.address}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border border-white/20">
            <div className="flex border-b border-white/20 overflow-x-auto">
              {([
                { key: "design_progress" as const, vi: "Tiến độ thiết kế", en: "Design Progress" },
                { key: "construction_progress" as const, vi: "Tiến độ thi công", en: "Construction Progress" },
                { key: "warranty" as const, vi: "Nhật ký bảo hành", en: "Warranty Log" },
                { key: "transactions" as const, vi: "Giao dịch", en: "Transactions" },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-light tracking-wider whitespace-nowrap transition-colors ${activeSubTab === tab.key ? "text-white border-b-2 border-white -mb-[1px]" : "text-white/40 hover:text-white/70"}`}
                >
                  {isVi ? tab.vi : tab.en}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeSubTab === "construction_progress" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {editingTimeline ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTimelineValue(String(Math.max(1, parseInt(timelineValue || "0") - 1)))}
                            className="text-white/30 hover:text-white transition-colors p-0.5"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={timelineValue}
                            onChange={(e) => setTimelineValue(e.target.value)}
                            placeholder={isVi ? "Số ngày" : "Days"}
                            className="w-14 h-7 bg-transparent border-b border-white/20 text-white text-center text-sm focus:outline-none focus:border-white/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && timelineValue) {
                                updateTimelineMutation.mutate(parseInt(timelineValue));
                              } else if (e.key === "Escape") {
                                setEditingTimeline(false);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setTimelineValue(String(Math.min(365, parseInt(timelineValue || "0") + 1)))}
                            className="text-white/30 hover:text-white transition-colors p-0.5"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-white/40 ml-1">{isVi ? "ngày" : "days"}</span>
                          <button
                            type="button"
                            onClick={() => timelineValue && updateTimelineMutation.mutate(parseInt(timelineValue))}
                            disabled={!timelineValue || updateTimelineMutation.isPending}
                            className="text-white/40 hover:text-white transition-colors ml-1 disabled:opacity-30"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTimeline(false)}
                            className="text-white/30 hover:text-white/60 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : selectedClient.constructionTimeline ? (
                        <>
                          <div className="cursor-pointer group" onClick={() => { setTimelineValue(String(selectedClient.constructionTimeline || "")); setEditingTimeline(true); }}>
                            <span className="text-xs text-white/40">{isVi ? "Mục tiêu" : "Target"}</span>
                            <p className="text-sm text-white font-light group-hover:text-white/70">{selectedClient.constructionTimeline} {isVi ? "ngày" : "days"} <Pencil className="w-3 h-3 inline opacity-0 group-hover:opacity-50" /></p>
                          </div>
                          <div>
                            <span className="text-xs text-white/40">{isVi ? "Đã ghi" : "Logged"}</span>
                            <p className="text-sm text-white font-light">{constructionInteractions.length} / {selectedClient.constructionTimeline}</p>
                          </div>
                        </>
                      ) : (
                        <Button
                          onClick={() => { setTimelineValue(""); setEditingTimeline(true); }}
                          className="h-10 px-4 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {isVi ? "Đặt mục tiêu thi công" : "Set construction timeline"}
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={() => openInteractionDialog()}
                      disabled={!!selectedClient.constructionTimeline && constructionInteractions.length >= selectedClient.constructionTimeline}
                      className="h-10 px-4 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isVi ? "Thêm nhật ký" : "Add Log"}
                    </Button>
                  </div>
                  {interactionsLoading ? (
                    <div className="text-center py-8 text-white/40">{isVi ? "Đang tải..." : "Loading..."}</div>
                  ) : constructionInteractions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/30 font-light">{isVi ? "Chưa có nhật ký thi công" : "No construction logs yet"}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/60 w-[5%]">#</TableHead>
                          <TableHead className="text-white/60 w-[11%]">{isVi ? "Ngày" : "Date"}</TableHead>
                          <TableHead className="text-white/60 w-[12%]">{isVi ? "Giai đoạn" : "Phase"}</TableHead>
                          <TableHead className="text-white/60 w-[20%]">{isVi ? "Tiêu đề" : "Title"}</TableHead>
                          <TableHead className="text-white/60 w-[12%]">{isVi ? "Phụ trách" : "Assigned To"}</TableHead>
                          <TableHead className="text-white/60 w-[25%]">{isVi ? "Hình ảnh" : "Images"}</TableHead>
                          <TableHead className="text-white/60 w-[15%]">{isVi ? "Thao tác" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {constructionInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((interaction, index) => (
                          <TableRow key={interaction.id} className="border-white/10">
                            <TableCell className="text-white/40 text-sm">{index + 1}</TableCell>
                            <TableCell>
                              <p className="text-white/70">{formatDate(interaction.date)}</p>
                            </TableCell>
                            <TableCell className="text-white/60">
                              {(() => {
                                const phaseValue = (interaction as any).phase;
                                if (!phaseValue) return "—";
                                const found = constructionPhases.find(p => p.value === phaseValue);
                                return found ? (isVi ? found.labelVi : found.labelEn) : phaseValue;
                              })()}
                            </TableCell>
                            <TableCell className="text-white">{interaction.title}</TableCell>
                            <TableCell className="text-white/60">{interaction.assignedTo || "—"}</TableCell>
                            <TableCell>
                              {Array.isArray(interaction.attachments) && interaction.attachments.length > 0 ? (
                                <div className="flex gap-1">
                                  {(interaction.attachments as string[]).slice(0, 5).map((url, idx) => (
                                    <img key={idx} src={url} alt="" className="w-10 h-10 object-cover border border-white/10" />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setViewingInteraction(interaction)} className="h-8 w-8 text-white/40 hover:text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openInteractionDialog(interaction)} className="h-8 w-8 text-white/40 hover:text-white">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {activeSubTab === "design_progress" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {editingDesignTimeline ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDesignTimelineValue(String(Math.max(1, parseInt(designTimelineValue || "0") - 1)))}
                            className="text-white/30 hover:text-white transition-colors p-0.5"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={designTimelineValue}
                            onChange={(e) => setDesignTimelineValue(e.target.value)}
                            placeholder={isVi ? "Số ngày" : "Days"}
                            className="w-14 h-7 bg-transparent border-b border-white/20 text-white text-center text-sm focus:outline-none focus:border-white/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && designTimelineValue) {
                                updateDesignTimelineMutation.mutate(parseInt(designTimelineValue));
                              } else if (e.key === "Escape") {
                                setEditingDesignTimeline(false);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setDesignTimelineValue(String(Math.min(365, parseInt(designTimelineValue || "0") + 1)))}
                            className="text-white/30 hover:text-white transition-colors p-0.5"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-white/40 ml-1">{isVi ? "ngày" : "days"}</span>
                          <button
                            type="button"
                            onClick={() => designTimelineValue && updateDesignTimelineMutation.mutate(parseInt(designTimelineValue))}
                            disabled={!designTimelineValue || updateDesignTimelineMutation.isPending}
                            className="text-white/40 hover:text-white transition-colors ml-1 disabled:opacity-30"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDesignTimeline(false)}
                            className="text-white/30 hover:text-white/60 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : selectedClient.designTimeline ? (
                        <>
                          <div className="cursor-pointer group" onClick={() => { setDesignTimelineValue(String(selectedClient.designTimeline || "")); setEditingDesignTimeline(true); }}>
                            <span className="text-xs text-white/40">{isVi ? "Mục tiêu" : "Target"}</span>
                            <p className="text-sm text-white font-light group-hover:text-white/70">{selectedClient.designTimeline} {isVi ? "ngày" : "days"} <Pencil className="w-3 h-3 inline opacity-0 group-hover:opacity-50" /></p>
                          </div>
                          <div>
                            <span className="text-xs text-white/40">{isVi ? "Đã ghi" : "Logged"}</span>
                            <p className="text-sm text-white font-light">{designInteractions.length} / {selectedClient.designTimeline}</p>
                          </div>
                        </>
                      ) : (
                        <Button
                          onClick={() => { setDesignTimelineValue(""); setEditingDesignTimeline(true); }}
                          className="h-10 px-4 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {isVi ? "Đặt mục tiêu thiết kế" : "Set design timeline"}
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={() => openDesignInteractionDialog()}
                      disabled={!!selectedClient.designTimeline && designInteractions.length >= selectedClient.designTimeline}
                      className="h-10 px-4 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isVi ? "Thêm nhật ký" : "Add Log"}
                    </Button>
                  </div>
                  {interactionsLoading ? (
                    <div className="text-center py-8 text-white/40">{isVi ? "Đang tải..." : "Loading..."}</div>
                  ) : designInteractions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/30 font-light">{isVi ? "Chưa có nhật ký thiết kế" : "No design logs yet"}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/60 w-[5%]">#</TableHead>
                          <TableHead className="text-white/60 w-[11%]">{isVi ? "Ngày" : "Date"}</TableHead>
                          <TableHead className="text-white/60 w-[12%]">{isVi ? "Giai đoạn" : "Phase"}</TableHead>
                          <TableHead className="text-white/60 w-[20%]">{isVi ? "Tiêu đề" : "Title"}</TableHead>
                          <TableHead className="text-white/60 w-[12%]">{isVi ? "Phụ trách" : "Assigned To"}</TableHead>
                          <TableHead className="text-white/60 w-[25%]">{isVi ? "Hình ảnh" : "Images"}</TableHead>
                          <TableHead className="text-white/60 w-[15%]">{isVi ? "Thao tác" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {designInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((interaction, index) => (
                          <TableRow key={interaction.id} className="border-white/10">
                            <TableCell className="text-white/40 text-sm">{index + 1}</TableCell>
                            <TableCell>
                              <p className="text-white/70">{formatDate(interaction.date)}</p>
                            </TableCell>
                            <TableCell className="text-white/60">
                              {(() => {
                                const phaseValue = (interaction as any).phase;
                                if (!phaseValue) return "—";
                                const found = designPhases.find(p => p.value === phaseValue);
                                return found ? (isVi ? found.labelVi : found.labelEn) : phaseValue;
                              })()}
                            </TableCell>
                            <TableCell className="text-white">{interaction.title}</TableCell>
                            <TableCell className="text-white/60">{interaction.assignedTo || "—"}</TableCell>
                            <TableCell>
                              {Array.isArray(interaction.attachments) && interaction.attachments.length > 0 ? (
                                <div className="flex gap-1">
                                  {(interaction.attachments as string[]).slice(0, 5).map((url, idx) => (
                                    <img key={idx} src={url} alt="" className="w-10 h-10 object-cover border border-white/10" />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setViewingDesignInteraction(interaction)} className="h-8 w-8 text-white/40 hover:text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openDesignInteractionDialog(interaction)} className="h-8 w-8 text-white/40 hover:text-white">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
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
                      <p className="text-white/30 font-light">{isVi ? "Chưa có giao dịch nào" : "No transactions yet"}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/60 w-[25%]">
                            <div>
                              <span>{isVi ? "Ngày" : "Date"}</span>
                              <p className="text-xs font-normal text-white/30">{isVi ? "Tiêu đề" : "Title"}</p>
                            </div>
                          </TableHead>
                          <TableHead className="text-white/60 w-[20%]">{isVi ? "Số tiền" : "Amount"}</TableHead>
                          <TableHead className="text-white/60 w-[30%]">{isVi ? "Ghi chú" : "Notes"}</TableHead>
                          <TableHead className="text-white/60 w-[25%] text-right">
                            <div>
                              <span>{isVi ? "Loại" : "Type"}</span>
                              <p className="text-xs font-normal text-white/30">{isVi ? "Trạng thái" : "Status"}</p>
                            </div>
                          </TableHead>
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
                            <TableCell className={`font-light ${tx.type === "refund" ? "text-red-400" : "text-white"}`}>
                              {tx.type === "refund" ? "-" : "+"}{formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell className="text-white/60 truncate">{tx.notes || tx.description || "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="space-y-1 flex flex-col items-end">
                                <Badge variant="outline" className={`rounded-none ${tx.type === "refund" ? "border-red-500/40 text-red-400" : tx.type === "commission" ? "border-yellow-500/40 text-yellow-400" : "border-white/20 text-white/60"}`}>
                                  {tx.type === "refund" ? (isVi ? "Hoàn trả" : "Refund") : tx.type === "commission" ? (isVi ? "Hoa hồng" : "Commission") : (isVi ? "Thanh toán" : "Payment")}
                                </Badge>
                                <Badge variant="outline" className={`rounded-none ${tx.status === "completed" ? "border-white/20 text-white/60" : tx.status === "cancelled" ? "border-red-500/40 text-red-400" : "border-white/20 text-white/60"}`}>
                                  {tx.status === "completed" ? (isVi ? "Hoàn tất" : "Completed") : tx.status === "cancelled" ? (isVi ? "Đã hủy" : "Cancelled") : (isVi ? "Chờ xử lý" : "Pending")}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {activeSubTab === "warranty" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-xs text-white/40">{isVi ? "Trạng thái" : "Status"}</span>
                        <p className={`text-sm font-light ${selectedClient.warrantyStatus === "active" ? "text-white/60" : selectedClient.warrantyStatus === "expired" ? "text-red-400" : "text-white/40"}`}>
                          {selectedClient.warrantyStatus === "active" ? (isVi ? "Đang hiệu lực" : "Active") : selectedClient.warrantyStatus === "expired" ? (isVi ? "Hết hạn" : "Expired") : (isVi ? "Chưa có" : "None")}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-white/40">{isVi ? "Hết hạn" : "Expiry"}</span>
                        <p className="text-sm text-white font-light">
                          {selectedClient.warrantyExpiry ? formatDate(selectedClient.warrantyExpiry) : "—"}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => openWarrantyLogDialog()} className="h-10 px-4 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10">
                      <Plus className="w-4 h-4 mr-2" />
                      {isVi ? "Thêm nhật ký" : "Add Log"}
                    </Button>
                  </div>
                  {warrantyLogsLoading ? (
                    <div className="text-center py-8 text-white/40">{isVi ? "Đang tải..." : "Loading..."}</div>
                  ) : warrantyLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/30 font-light">{isVi ? "Chưa có nhật ký bảo hành" : "No warranty logs yet"}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/60 w-[25%]">{isVi ? "Ngày" : "Date"}</TableHead>
                          <TableHead className="text-white/60 w-[30%]">{isVi ? "Tiêu đề" : "Title"}</TableHead>
                          <TableHead className="text-white/60 w-[20%]">{isVi ? "Mô tả" : "Description"}</TableHead>
                          <TableHead className="text-white/60 w-[15%] text-right">{isVi ? "Trạng thái" : "Status"}</TableHead>
                          <TableHead className="text-white/60 w-[10%]">{isVi ? "Thao tác" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warrantyLogs.map((log) => (
                          <TableRow key={log.id} className="border-white/10">
                            <TableCell className="text-white/70">{formatDate(log.date)}</TableCell>
                            <TableCell className="text-white">{log.title}</TableCell>
                            <TableCell className="text-white/60 truncate max-w-[200px]">{log.description || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={`rounded-none ${log.status === "completed" ? "border-white/20 text-white/60" : log.status === "in_progress" ? "border-white/20 text-white/60" : "border-white/20 text-white/60"}`}>
                                {log.status === "completed" ? (isVi ? "Hoàn tất" : "Completed") : log.status === "in_progress" ? (isVi ? "Đang xử lý" : "In Progress") : (isVi ? "Chờ xử lý" : "Pending")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openWarrantyLogDialog(log)} className="h-8 w-8 text-white/40 hover:text-white">
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
                                      <AlertDialogAction onClick={() => deleteWarrantyLogMutation.mutate(log.id)} className="rounded-none bg-red-600 hover:bg-red-700">{isVi ? "Xóa" : "Delete"}</AlertDialogAction>
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
              <FormField control={interactionForm.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Ngày" : "Date"}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={interactionForm.control} name="phase" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Giai đoạn" : "Phase"}</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-transparent border-white/20 text-white rounded-none h-10">
                        <SelectValue placeholder={isVi ? "Chọn giai đoạn" : "Select phase"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-black border-white/20 rounded-none">
                      {constructionPhases.map((p) => (
                        <SelectItem key={p.id} value={p.value}>
                          {isVi ? p.labelVi : p.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
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
              <FormField control={interactionForm.control} name="assignedTo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Phụ trách" : "Assigned To"}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={interactionForm.control} name="nextAction" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Đề xuất" : "Proposal"}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-transparent border-white/20 text-white rounded-none min-h-[60px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div>
                <label className="text-sm text-white/60 mb-2 block">{isVi ? "Hình ảnh đính kèm" : "Attachments"}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {interactionAttachments.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="" className="w-20 h-20 object-cover border border-white/10" />
                      <button type="button" onClick={() => setInteractionAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                </div>
                <label className={`inline-flex items-center gap-2 h-10 px-4 border border-white/20 text-sm transition-colors ${interactionAttachments.length >= 5 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer text-white/60 hover:bg-white/10'}`}>
                  {uploadingImage ? (isVi ? "Đang tải..." : "Uploading...") : (isVi ? `Chọn hình (${interactionAttachments.length}/5)` : `Choose Image (${interactionAttachments.length}/5)`)}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImage || interactionAttachments.length >= 5} />
                </label>
              </div>
              <div className="flex justify-between pt-2">
                {editingInteraction ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-none text-white/40 hover:text-white">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-black border border-white/20 rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">{isVi ? "Xác nhận xóa" : "Confirm Delete"}</AlertDialogTitle>
                        <AlertDialogDescription>{isVi ? "Bạn có chắc muốn xóa nhật ký này?" : "Are you sure you want to delete this log?"}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">{isVi ? "Hủy" : "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteInteractionMutation.mutate(editingInteraction.id); setIsInteractionDialogOpen(false); }} className="rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10">{isVi ? "Xóa" : "Delete"}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : <div />}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsInteractionDialogOpen(false)} className="h-10 px-4 rounded-none border-white/20 text-white hover:bg-white/10">
                    {isVi ? "Hủy" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={createInteractionMutation.isPending || updateInteractionMutation.isPending} className="h-10 px-6 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10">
                    {(createInteractionMutation.isPending || updateInteractionMutation.isPending) ? (isVi ? "Đang lưu..." : "Saving...") : editingInteraction ? (isVi ? "Cập nhật" : "Update") : (isVi ? "Thêm" : "Add")}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={isWarrantyLogDialogOpen} onOpenChange={setIsWarrantyLogDialogOpen}>
        <DialogContent className="bg-black border border-white/20 rounded-none max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-light">
              {editingWarrantyLog ? (isVi ? "Sửa nhật ký bảo hành" : "Edit Warranty Log") : (isVi ? "Thêm nhật ký bảo hành" : "Add Warranty Log")}
            </DialogTitle>
          </DialogHeader>
          <Form {...warrantyLogForm}>
            <form onSubmit={warrantyLogForm.handleSubmit(onWarrantyLogSubmit)} className="space-y-4">
              <FormField control={warrantyLogForm.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Ngày" : "Date"}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={warrantyLogForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Tiêu đề" : "Title"}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={warrantyLogForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Mô tả" : "Description"}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-transparent border-white/20 text-white rounded-none min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={warrantyLogForm.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Trạng thái" : "Status"}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-transparent border-white/20 text-white rounded-none h-10">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-black border-white/20 rounded-none">
                      <SelectItem value="pending">{isVi ? "Chờ xử lý" : "Pending"}</SelectItem>
                      <SelectItem value="in_progress">{isVi ? "Đang xử lý" : "In Progress"}</SelectItem>
                      <SelectItem value="completed">{isVi ? "Hoàn tất" : "Completed"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsWarrantyLogDialogOpen(false)} className="h-10 px-4 rounded-none border-white/20 text-white hover:bg-white/10">
                  {isVi ? "Hủy" : "Cancel"}
                </Button>
                <Button type="submit" disabled={createWarrantyLogMutation.isPending || updateWarrantyLogMutation.isPending} className="h-10 px-6 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10">
                  {(createWarrantyLogMutation.isPending || updateWarrantyLogMutation.isPending) ? (isVi ? "Đang lưu..." : "Saving...") : editingWarrantyLog ? (isVi ? "Cập nhật" : "Update") : (isVi ? "Thêm" : "Add")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingInteraction} onOpenChange={(open) => { if (!open) setViewingInteraction(null); }}>
        <DialogContent className="bg-black border border-white/20 rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-light">{isVi ? "Chi tiết nhật ký" : "Log Details"}</DialogTitle>
          </DialogHeader>
          {viewingInteraction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-white/40">{isVi ? "Ngày" : "Date"}</span>
                  <p className="text-white font-light">{formatDate(viewingInteraction.date)}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40">{isVi ? "Phụ trách" : "Assigned To"}</span>
                  <p className="text-white font-light">{viewingInteraction.assignedTo || "—"}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-white/40">{isVi ? "Tiêu đề" : "Title"}</span>
                <p className="text-white font-light">{viewingInteraction.title}</p>
              </div>
              {viewingInteraction.description && (
                <div>
                  <span className="text-xs text-white/40">{isVi ? "Mô tả" : "Description"}</span>
                  <p className="text-white/70 font-light text-sm">{viewingInteraction.description}</p>
                </div>
              )}
              {viewingInteraction.nextAction && (
                <div>
                  <span className="text-xs text-white/40">{isVi ? "Đề xuất" : "Proposal"}</span>
                  <p className="text-white/70 font-light text-sm">{viewingInteraction.nextAction}</p>
                </div>
              )}
              {Array.isArray(viewingInteraction.attachments) && viewingInteraction.attachments.length > 0 && (
                <div>
                  <span className="text-xs text-white/40 block mb-2">{isVi ? "Hình ảnh đính kèm" : "Attachments"} ({(viewingInteraction.attachments as string[]).length}/5)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(viewingInteraction.attachments as string[]).map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="" className="w-full h-32 object-cover border border-white/10 hover:border-white/40 transition-colors cursor-pointer" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isDesignInteractionDialogOpen} onOpenChange={setIsDesignInteractionDialogOpen}>
        <DialogContent className="bg-black border border-white/20 rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-light">
              {editingDesignInteraction ? (isVi ? "Sửa nhật ký thiết kế" : "Edit Design Log") : (isVi ? "Thêm nhật ký thiết kế" : "Add Design Log")}
            </DialogTitle>
          </DialogHeader>
          <Form {...designInteractionForm}>
            <form onSubmit={designInteractionForm.handleSubmit(onDesignInteractionSubmit)} className="space-y-4">
              <FormField control={designInteractionForm.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Ngày" : "Date"}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={designInteractionForm.control} name="phase" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Giai đoạn" : "Phase"}</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-transparent border-white/20 text-white rounded-none h-10">
                        <SelectValue placeholder={isVi ? "Chọn giai đoạn" : "Select phase"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-black border-white/20 rounded-none">
                      {designPhases.map((p) => (
                        <SelectItem key={p.id} value={p.value}>
                          {isVi ? p.labelVi : p.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={designInteractionForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Tiêu đề" : "Title"}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={designInteractionForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Mô tả" : "Description"}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-transparent border-white/20 text-white rounded-none min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={designInteractionForm.control} name="assignedTo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Phụ trách" : "Assigned To"}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-transparent border-white/20 text-white rounded-none h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={designInteractionForm.control} name="nextAction" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/60">{isVi ? "Đề xuất" : "Proposal"}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-transparent border-white/20 text-white rounded-none min-h-[60px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div>
                <label className="text-sm text-white/60 mb-2 block">{isVi ? "Hình ảnh đính kèm" : "Attachments"}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {designInteractionAttachments.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="" className="w-20 h-20 object-cover border border-white/10" />
                      <button type="button" onClick={() => setDesignInteractionAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                </div>
                <label className={`inline-flex items-center gap-2 h-10 px-4 border border-white/20 text-sm transition-colors ${designInteractionAttachments.length >= 5 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer text-white/60 hover:bg-white/10'}`}>
                  {uploadingImage ? (isVi ? "Đang tải..." : "Uploading...") : (isVi ? `Chọn hình (${designInteractionAttachments.length}/5)` : `Choose Image (${designInteractionAttachments.length}/5)`)}
                  <input type="file" accept="image/*" multiple onChange={handleDesignImageUpload} className="hidden" disabled={uploadingImage || designInteractionAttachments.length >= 5} />
                </label>
              </div>
              <div className="flex justify-between pt-2">
                {editingDesignInteraction ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-none text-white/40 hover:text-white">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-black border border-white/20 rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">{isVi ? "Xác nhận xóa" : "Confirm Delete"}</AlertDialogTitle>
                        <AlertDialogDescription>{isVi ? "Bạn có chắc muốn xóa nhật ký này?" : "Are you sure you want to delete this log?"}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">{isVi ? "Hủy" : "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteDesignInteractionMutation.mutate(editingDesignInteraction.id); setIsDesignInteractionDialogOpen(false); }} className="rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10">{isVi ? "Xóa" : "Delete"}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : <div />}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDesignInteractionDialogOpen(false)} className="h-10 px-4 rounded-none border-white/20 text-white hover:bg-white/10">
                    {isVi ? "Hủy" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={createDesignInteractionMutation.isPending || updateDesignInteractionMutation.isPending} className="h-10 px-6 rounded-none bg-transparent border border-white/20 text-white hover:bg-white/10">
                    {(createDesignInteractionMutation.isPending || updateDesignInteractionMutation.isPending) ? (isVi ? "Đang lưu..." : "Saving...") : editingDesignInteraction ? (isVi ? "Cập nhật" : "Update") : (isVi ? "Thêm" : "Add")}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingDesignInteraction} onOpenChange={(open) => { if (!open) setViewingDesignInteraction(null); }}>
        <DialogContent className="bg-black border border-white/20 rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-light">{isVi ? "Chi tiết nhật ký" : "Log Details"}</DialogTitle>
          </DialogHeader>
          {viewingDesignInteraction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-white/40">{isVi ? "Ngày" : "Date"}</span>
                  <p className="text-white font-light">{formatDate(viewingDesignInteraction.date)}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40">{isVi ? "Phụ trách" : "Assigned To"}</span>
                  <p className="text-white font-light">{viewingDesignInteraction.assignedTo || "—"}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-white/40">{isVi ? "Tiêu đề" : "Title"}</span>
                <p className="text-white font-light">{viewingDesignInteraction.title}</p>
              </div>
              {viewingDesignInteraction.description && (
                <div>
                  <span className="text-xs text-white/40">{isVi ? "Mô tả" : "Description"}</span>
                  <p className="text-white/70 font-light text-sm">{viewingDesignInteraction.description}</p>
                </div>
              )}
              {viewingDesignInteraction.nextAction && (
                <div>
                  <span className="text-xs text-white/40">{isVi ? "Đề xuất" : "Proposal"}</span>
                  <p className="text-white/70 font-light text-sm">{viewingDesignInteraction.nextAction}</p>
                </div>
              )}
              {Array.isArray(viewingDesignInteraction.attachments) && viewingDesignInteraction.attachments.length > 0 && (
                <div>
                  <span className="text-xs text-white/40 block mb-2">{isVi ? "Hình ảnh đính kèm" : "Attachments"} ({(viewingDesignInteraction.attachments as string[]).length}/5)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(viewingDesignInteraction.attachments as string[]).map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="" className="w-full h-32 object-cover border border-white/10 hover:border-white/40 transition-colors cursor-pointer" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
