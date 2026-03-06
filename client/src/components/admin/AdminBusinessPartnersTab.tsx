import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Eye, Plus, Settings, Lock, Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import CrmSettingsManager from "@/components/CrmSettingsManager";

const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  stage: z.string().default("lead"),
  status: z.string().default("active"),
  totalSpending: z.string().optional(),
  refundAmount: z.string().optional(),
  commission: z.string().optional(),
  orderCount: z.number().optional(),
  referredById: z.string().optional(),
  referralCount: z.number().optional(),
  referralRevenue: z.string().optional(),
  intakeDate: z.string().optional(),
  warrantyStatus: z.enum(["none", "active", "expired"]).default("none"),
  warrantyExpiry: z.string().optional(),
  constructionTimeline: z.number().optional(),
  tier: z.string().default("silver"),
  identityCard: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const bpTransactionSchema = z.object({
  businessPartnerId: z.string().min(1, "Business partner is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num <= 100000000000;
  }, "Số tiền phải từ 1 đến 100.000.000.000 đ"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

function PermissionDenied({ feature }: { feature: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center h-96">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-light text-white mb-2">{t('admin.permissionDenied') || 'Quyền Hạn Không Đủ'}</h3>
            <p className="text-muted-foreground">
              {t('admin.permissionDeniedMessage') || `Bạn không có quyền truy cập tính năng ${feature}. Vui lòng liên hệ quản trị viên để được cấp quyền.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AdminBusinessPartnersTabProps {
  user: any;
  hasPermission: (user: any, permission: string) => boolean;
}

export default function AdminBusinessPartnersTab({ user, hasPermission }: AdminBusinessPartnersTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

  const [editingBusinessPartner, setEditingBusinessPartner] = useState<any | null>(null);
  const [viewingBusinessPartner, setViewingBusinessPartner] = useState<any | null>(null);
  const [isBusinessPartnerDialogOpen, setIsBusinessPartnerDialogOpen] = useState(false);
  const [isBusinessPartnerViewDialogOpen, setIsBusinessPartnerViewDialogOpen] = useState(false);
  const [isBpTransactionDialogOpen, setIsBpTransactionDialogOpen] = useState(false);
  const [editingBpTransaction, setEditingBpTransaction] = useState<any | null>(null);
  const [isBpCrmSettingsDialogOpen, setIsBpCrmSettingsDialogOpen] = useState(false);

  const [bpSearchQuery, setBpSearchQuery] = useState('');
  const [bpStageFilter, setBpStageFilter] = useState('all');
  const [bpStatusFilter, setBpStatusFilter] = useState('all');
  const [bpWarrantyFilter, setBpWarrantyFilter] = useState('all');
  const [bpTierFilter, setBpTierFilter] = useState('all');
  const [bpCurrentPage, setBpCurrentPage] = useState(1);
  const bpItemsPerPage = 10;

  const { data: bpCategories = [] } = useQuery<any[]>({
    queryKey: ['/api/bp-categories'],
  });

  const { data: bpStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/bp-statuses'],
  });

  const { data: bpTiersData = [] } = useQuery<any[]>({
    queryKey: ['/api/bp-tiers'],
  });

  const { data: businessPartners = [], isLoading: businessPartnersLoading } = useQuery<any[]>({
    queryKey: ['/api/business-partners'],
  });

  const { data: bpTransactions = [], isLoading: bpTransactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/bp-transactions', editingBusinessPartner?.id],
    queryFn: async () => {
      if (!editingBusinessPartner?.id) return [];
      const response = await fetch(`/api/bp-transactions?businessPartnerId=${editingBusinessPartner.id}`);
      return response.json();
    },
    enabled: !!editingBusinessPartner?.id,
  });

  const { data: viewBpTransactions = [], isLoading: viewBpTransactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/bp-transactions', viewingBusinessPartner?.id],
    queryFn: async () => {
      if (!viewingBusinessPartner?.id) return [];
      const response = await fetch(`/api/bp-transactions?businessPartnerId=${viewingBusinessPartner.id}`);
      return response.json();
    },
    enabled: !!viewingBusinessPartner?.id,
  });

  const { data: allBpTransactions = [] } = useQuery<any[]>({
    queryKey: ['/api/bp-transactions'],
    queryFn: async () => {
      const response = await fetch('/api/bp-transactions');
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const filteredBusinessPartners = businessPartners.filter((bp: any) => {
    if (bpStageFilter !== 'all' && (bp.stage || '') !== bpStageFilter) return false;
    if (bpStatusFilter !== 'all' && (bp.status || 'active') !== bpStatusFilter) return false;
    if (bpWarrantyFilter !== 'all' && (bp.warrantyStatus || 'none') !== bpWarrantyFilter) return false;
    if (bpTierFilter !== 'all' && (bp.tier || 'silver') !== bpTierFilter) return false;
    if (!bpSearchQuery) return true;
    const searchLower = bpSearchQuery.toLowerCase();
    return (
      (`${bp.firstName} ${bp.lastName}`).toLowerCase().includes(searchLower) ||
      (bp.email || '').toLowerCase().includes(searchLower) ||
      (bp.phone || '').toLowerCase().includes(searchLower) ||
      (bp.company || '').toLowerCase().includes(searchLower) ||
      (bp.address || '').toLowerCase().includes(searchLower)
    );
  });
  const bpTotalPages = Math.ceil(filteredBusinessPartners.length / bpItemsPerPage);
  const bpStartIndex = (bpCurrentPage - 1) * bpItemsPerPage;
  const bpEndIndex = bpStartIndex + bpItemsPerPage;
  const paginatedBusinessPartners = filteredBusinessPartners.slice(bpStartIndex, bpEndIndex);

  useEffect(() => {
    if (bpCurrentPage > bpTotalPages && bpTotalPages > 0) {
      setBpCurrentPage(1);
    }
  }, [businessPartners.length, bpCurrentPage, bpTotalPages]);

  const bpFinances = useMemo(() => {
    const finances: Record<string, { totalSpending: number; refundAmount: number }> = {};
    (Array.isArray(allBpTransactions) ? allBpTransactions : []).forEach((t: any) => {
      if (t.status !== "completed" || !t.businessPartnerId) return;
      if (!finances[t.businessPartnerId]) {
        finances[t.businessPartnerId] = { totalSpending: 0, refundAmount: 0 };
      }
      const amount = parseFloat(t.amount || "0");
      if (t.type === "payment") {
        finances[t.businessPartnerId].totalSpending += amount;
      } else if (t.type === "refund") {
        finances[t.businessPartnerId].refundAmount += amount;
      }
    });
    return finances;
  }, [allBpTransactions]);

  const businessPartnerForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      company: "",
      address: "",
      intakeDate: "",
      warrantyExpiry: "",
      stage: "lead",
      status: "active",
      tier: "silver",
      totalSpending: "0",
      refundAmount: "0",
      commission: "0",
      orderCount: 0,
      referredById: "",
      referralCount: 0,
      referralRevenue: "0",
      tags: [],
      notes: "",
    },
  });

  const bpTransactionForm = useForm<z.infer<typeof bpTransactionSchema>>({
    resolver: zodResolver(bpTransactionSchema),
    defaultValues: {
      businessPartnerId: "",
      amount: "",
      title: "",
      description: "",
      type: "payment",
      status: "completed",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const createBusinessPartnerMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await apiRequest('POST', '/api/business-partners', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-partners'] });
      toast({ title: language === 'vi' ? "Đã tạo đối tác thành công" : "Business partner created successfully" });
      businessPartnerForm.reset();
      setIsBusinessPartnerDialogOpen(false);
    },
  });

  const updateBusinessPartnerMutation = useMutation({
    mutationFn: async ({ id, showToast, ...updates }: { id: string; showToast?: boolean; [key: string]: any }) => {
      const response = await apiRequest('PUT', `/api/business-partners/${id}`, updates);
      return response.json();
    },
    onMutate: async ({ id, showToast, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/business-partners'] });
      const previousBPs = queryClient.getQueryData(['/api/business-partners']);
      queryClient.setQueryData(['/api/business-partners'], (old: any) => {
        if (!old) return old;
        return old.map((bp: any) => bp.id === id ? { ...bp, ...updates } : bp);
      });
      return { previousBPs };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousBPs) {
        queryClient.setQueryData(['/api/business-partners'], context.previousBPs);
      }
      toast({ title: language === 'vi' ? "Lỗi khi cập nhật đối tác" : "Error updating partner", description: err.message, variant: "destructive" });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-partners'] });
      if (variables.showToast !== false) {
        toast({ title: language === 'vi' ? "Đã cập nhật đối tác thành công" : "Business partner updated successfully" });
      }
    },
  });

  const deleteBusinessPartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/business-partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-partners'] });
      toast({ title: language === 'vi' ? "Đã xóa đối tác thành công" : "Business partner deleted successfully" });
      setIsBusinessPartnerDialogOpen(false);
      setEditingBusinessPartner(null);
      businessPartnerForm.reset();
    },
    onError: (error: any) => {
      toast({ title: language === 'vi' ? "Lỗi khi xóa đối tác" : "Error deleting partner", description: error.message, variant: "destructive" });
    },
  });

  const createBpTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/bp-transactions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-partners'] });
      toast({ title: language === 'vi' ? "Đã thêm giao dịch thành công" : "Transaction added successfully" });
      bpTransactionForm.reset();
      setIsBpTransactionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: language === 'vi' ? "Lỗi khi thêm giao dịch" : "Error adding transaction", description: error.message, variant: "destructive" });
    },
  });

  const updateBpTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/bp-transactions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-partners'] });
      toast({ title: language === 'vi' ? "Đã cập nhật giao dịch thành công" : "Transaction updated successfully" });
      setEditingBpTransaction(null);
      bpTransactionForm.reset();
      setIsBpTransactionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: language === 'vi' ? "Lỗi khi cập nhật giao dịch" : "Error updating transaction", description: error.message, variant: "destructive" });
    },
  });

  const deleteBpTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/bp-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-partners'] });
      toast({ title: language === 'vi' ? "Đã xóa giao dịch thành công" : "Transaction deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: language === 'vi' ? "Lỗi khi xóa giao dịch" : "Error deleting transaction", description: error.message, variant: "destructive" });
    },
  });

  const handleEditBusinessPartner = (bp: any) => {
    setEditingBusinessPartner(bp);
    const formatDateForInput = (dateValue: any) => {
      if (!dateValue) return "";
      const date = new Date(dateValue);
      return date.toISOString().split('T')[0];
    };
    businessPartnerForm.reset({
      firstName: bp.firstName,
      lastName: bp.lastName,
      email: bp.email,
      phone: bp.phone || "",
      position: bp.position || "",
      company: bp.company || "",
      address: bp.address || "",
      intakeDate: formatDateForInput(bp.intakeDate),
      stage: bp.stage || "lead",
      status: bp.status || "active",
      totalSpending: bp.totalSpending || "0",
      refundAmount: bp.refundAmount || "0",
      commission: bp.commission || "0",
      orderCount: bp.orderCount || 0,
      referredById: bp.referredById || "",
      referralCount: bp.referralCount || 0,
      referralRevenue: bp.referralRevenue || "0",
      warrantyStatus: (bp.warrantyStatus as "none" | "active" | "expired") || "none",
      warrantyExpiry: formatDateForInput(bp.warrantyExpiry),
      tier: bp.tier || "silver",
      tags: (bp.tags as string[]) || [],
      notes: bp.notes || "",
    });
    setIsBusinessPartnerDialogOpen(true);
  };

  const onBusinessPartnerSubmit = async (data: ClientFormData) => {
    try {
      let warrantyStatus: "none" | "active" | "expired" = "none";
      if (data.warrantyExpiry && data.warrantyExpiry.trim() !== "") {
        const expiryDate = new Date(data.warrantyExpiry);
        const now = new Date();
        warrantyStatus = expiryDate < now ? "expired" : "active";
      }
      const cleanedData = {
        ...data,
        warrantyStatus,
        intakeDate: data.intakeDate && data.intakeDate.trim() !== "" ? data.intakeDate : undefined,
        warrantyExpiry: data.warrantyExpiry && data.warrantyExpiry.trim() !== "" ? data.warrantyExpiry : undefined,
        phone: data.phone && data.phone.trim() !== "" ? data.phone : undefined,
        company: data.company && data.company.trim() !== "" ? data.company : undefined,
        address: data.address && data.address.trim() !== "" ? data.address : undefined,
        referredById: data.referredById && data.referredById.trim() !== "" ? data.referredById : undefined,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : undefined,
      };
      if (editingBusinessPartner) {
        await updateBusinessPartnerMutation.mutateAsync({ id: editingBusinessPartner.id, ...cleanedData });
        setEditingBusinessPartner(null);
        setIsBusinessPartnerDialogOpen(false);
        businessPartnerForm.reset();
      } else {
        await createBusinessPartnerMutation.mutateAsync(cleanedData);
      }
    } catch (error) {
      console.error("Error saving business partner:", error);
    }
  };

  const onBpTransactionSubmit = async (data: any) => {
    try {
      const cleanedData = {
        ...data,
        paymentDate: data.paymentDate && data.paymentDate.trim() !== "" ? data.paymentDate : undefined,
        description: data.description && data.description.trim() !== "" ? data.description : undefined,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : undefined,
      };
      if (editingBpTransaction) {
        await updateBpTransactionMutation.mutateAsync({ id: editingBpTransaction.id, data: cleanedData });
      } else {
        await createBpTransactionMutation.mutateAsync(cleanedData);
      }
    } catch (error) {
      console.error("Error saving BP transaction:", error);
    }
  };

  if (!hasPermission(user, 'crm')) {
    return <PermissionDenied feature="CRM / Business Partners" />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-sans font-light">{language === 'vi' ? 'Quản Lý Đối Tác' : 'Business Partner Management'}</h2>
        <div className="flex gap-2 flex-shrink-0">
          <Dialog open={isBusinessPartnerDialogOpen} onOpenChange={(open) => {
            setIsBusinessPartnerDialogOpen(open);
            if (!open) {
              setEditingBusinessPartner(null);
              businessPartnerForm.reset({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                position: "",
                company: "",
                address: "",
                stage: "lead",
                status: "active",
                tier: "silver",
                orderCount: 0,
                referredById: "",
                referralCount: 0,
                referralRevenue: "0",
                warrantyStatus: "none",
                warrantyExpiry: "",
                tags: [],
                notes: "",
              });
            }
          }}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingBusinessPartner(null);
                businessPartnerForm.reset({
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  position: "",
                  company: "",
                  address: "",
                  stage: "lead",
                  status: "active",
                  tier: "silver",
                  orderCount: 0,
                  referredById: "",
                  referralCount: 0,
                  referralRevenue: "0",
                  warrantyStatus: "none",
                  warrantyExpiry: "",
                  tags: [],
                  notes: "",
                });
              }}
              data-testid="button-add-bp"
              className="h-10 px-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Thêm Đối Tác' : 'Add Partner'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black border border-white/20 rounded-none">
            <DialogHeader>
              <DialogTitle>
                {editingBusinessPartner ? (language === 'vi' ? 'Chỉnh Sửa Đối Tác' : 'Edit Partner') : (language === 'vi' ? 'Thêm Đối Tác' : 'Add Partner')}
              </DialogTitle>
            </DialogHeader>
            <Form {...businessPartnerForm}>
              <form onSubmit={businessPartnerForm.handleSubmit(onBusinessPartnerSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={businessPartnerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Đại diện' : 'Representative'}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={language === 'vi' ? "Nguyễn Văn A" : "John Doe"} data-testid="input-bp-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessPartnerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Số điện thoại' : 'Phone'}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0901234567" data-testid="input-bp-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={businessPartnerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('crm.email')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="email@example.com" data-testid="input-bp-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessPartnerForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Chức vụ' : 'Position'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder={language === 'vi' ? "Giám đốc" : "Director"} data-testid="input-bp-position" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={businessPartnerForm.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Danh Mục' : 'Tier'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bp-tier">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bpTiersData
                              .filter((tier: any) => tier.active)
                              .sort((a: any, b: any) => a.order - b.order)
                              .map((tier: any) => (
                                <SelectItem key={tier.id} value={tier.value}>
                                  {language === 'vi' ? tier.labelVi : tier.labelEn}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={businessPartnerForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('crm.company')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC Company" data-testid="input-bp-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={businessPartnerForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('crm.address')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM" data-testid="input-bp-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={businessPartnerForm.control}
                  name="intakeDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'vi' ? 'Khởi tạo (Ngày tiếp nhận)' : 'Intake Date'}</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" maxLength={10} data-testid="input-bp-intake-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={businessPartnerForm.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Hạng Mục' : 'Category'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bp-stage">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bpCategories
                              .filter((cat: any) => cat.active)
                              .sort((a: any, b: any) => a.order - b.order)
                              .map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.value}>
                                  {language === 'vi' ? cat.labelVi : cat.labelEn}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessPartnerForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('crm.status')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bp-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bpStatuses
                              .filter((status: any) => status.active)
                              .sort((a: any, b: any) => a.order - b.order)
                              .map((status: any) => (
                                <SelectItem key={status.id} value={status.value}>
                                  {language === 'vi' ? status.labelVi : status.labelEn}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                {editingBusinessPartner && (
                  <div className="pt-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{language === 'vi' ? 'Lịch sử giao dịch' : 'Transaction History'}</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingBpTransaction(null);
                          bpTransactionForm.reset({
                            businessPartnerId: editingBusinessPartner.id,
                            amount: "",
                            title: "",
                            description: "",
                            type: "payment",
                            status: "completed",
                            paymentDate: new Date().toISOString().split('T')[0],
                            notes: "",
                          });
                          setIsBpTransactionDialogOpen(true);
                        }}
                        className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {bpTransactionsLoading ? (
                      <div className="text-sm text-white/50">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
                    ) : !Array.isArray(bpTransactions) || bpTransactions.length === 0 ? (
                      <div className="text-sm text-white/50">{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</div>
                    ) : (
                      <div className="border border-white/30 rounded-none max-h-48 overflow-y-auto bg-black">
                        {bpTransactions.map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between px-2 py-2 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{transaction.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                  {transaction.type === "payment" ? (language === 'vi' ? "Thu" : "Income") : transaction.type === "refund" ? (language === 'vi' ? "Chi" : "Expense") : "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white">{Math.round(parseFloat(transaction.amount)).toLocaleString('vi-VN')} đ</span>
                                <div className="flex items-center gap-2">
                                  {transaction.status === "completed" && transaction.paymentDate && (
                                    <span className="text-[10px] text-white/50">
                                      {new Date(transaction.paymentDate).toLocaleDateString('vi-VN')}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-white/50">
                                    {transaction.status === "pending" ? (language === 'vi' ? "Đang chờ" : "Pending") : transaction.status === "completed" ? (language === 'vi' ? "Hoàn thành" : "Completed") : transaction.status === "cancelled" ? (language === 'vi' ? "Đã hủy" : "Cancelled") : "—"}
                                  </span>
                                </div>
                              </div>
                              {transaction.description && (
                                <p className="text-[10px] text-white/50">{transaction.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 ml-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingBpTransaction(transaction);
                                  bpTransactionForm.reset({
                                    businessPartnerId: transaction.businessPartnerId,
                                    amount: transaction.amount,
                                    title: transaction.title,
                                    description: transaction.description || "",
                                    type: transaction.type || "payment",
                                    status: transaction.status || "completed",
                                    paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split('T')[0] : "",
                                    notes: transaction.notes || "",
                                  });
                                  setIsBpTransactionDialogOpen(true);
                                }}
                                className="h-6 w-6 text-white hover:text-white hover:bg-white/20 rounded-none"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-white hover:text-white hover:bg-white/20 rounded-none"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-none">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{language === 'vi' ? 'Xóa giao dịch' : 'Delete Transaction'}</AlertDialogTitle>
                                    <AlertDialogDescription className="text-white/70">
                                      {language === 'vi'
                                        ? <>Bạn có chắc chắn muốn xóa giao dịch <strong className="text-white">"{transaction.title}"</strong>?</>
                                        : <>Are you sure you want to delete transaction <strong className="text-white">"{transaction.title}"</strong>?</>
                                      }
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none h-10 px-4">
                                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteBpTransactionMutation.mutate(transaction.id)}
                                      className="rounded-none h-10 px-4"
                                      disabled={deleteBpTransactionMutation.isPending}
                                    >
                                      {deleteBpTransactionMutation.isPending ? (language === 'vi' ? "Đang xóa..." : "Deleting...") : (language === 'vi' ? "Xóa" : "Delete")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <FormField
                  control={businessPartnerForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('crm.notes')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder={language === 'vi' ? "Ghi chú về đối tác..." : "Notes about partner..."} data-testid="input-bp-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  {editingBusinessPartner && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="border-white/30 text-white hover:border-white hover:bg-white/10 rounded-none h-8 w-8"
                          data-testid="button-delete-bp"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-none">
                        {Array.isArray(bpTransactions) && bpTransactions.length > 0 ? (
                          <>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{language === 'vi' ? 'Không thể xóa đối tác' : 'Cannot Delete Partner'}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === 'vi'
                                  ? <>Đối tác <strong>{editingBusinessPartner.firstName} {editingBusinessPartner.lastName}</strong> hiện có <strong>{bpTransactions.length}</strong> giao dịch. Vui lòng xóa tất cả giao dịch trước khi xóa đối tác.</>
                                  : <>Partner <strong>{editingBusinessPartner.firstName} {editingBusinessPartner.lastName}</strong> currently has <strong>{bpTransactions.length}</strong> transaction(s). Please delete all transactions before deleting this partner.</>
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-none h-10 px-4">
                                {language === 'vi' ? 'Đã hiểu' : 'Understood'}
                              </AlertDialogCancel>
                            </AlertDialogFooter>
                          </>
                        ) : (
                          <>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{language === 'vi' ? 'Xác nhận xóa đối tác' : 'Confirm Delete Partner'}</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/70">
                                {language === 'vi' 
                                  ? <>Bạn có chắc chắn muốn xóa đối tác <strong className="text-white">{editingBusinessPartner.firstName} {editingBusinessPartner.lastName}</strong>?</>
                                  : <>Are you sure you want to delete partner <strong className="text-white">{editingBusinessPartner.firstName} {editingBusinessPartner.lastName}</strong>?</>
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none h-10 px-4">
                                {language === 'vi' ? 'Hủy' : 'Cancel'}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBusinessPartnerMutation.mutate(editingBusinessPartner.id)}
                                className="rounded-none h-10 px-4"
                                disabled={deleteBusinessPartnerMutation.isPending}
                              >
                                {deleteBusinessPartnerMutation.isPending ? (language === 'vi' ? "Đang xóa..." : "Deleting...") : (language === 'vi' ? "Xóa" : "Delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </>
                        )}
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <div className="flex space-x-2 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsBusinessPartnerDialogOpen(false);
                        setEditingBusinessPartner(null);
                        businessPartnerForm.reset();
                      }}
                      className="h-10 px-4"
                    >
                      {t('crm.cancel')}
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createBusinessPartnerMutation.isPending}
                      data-testid="button-save-bp"
                      className="h-10 px-4"
                    >
                      {editingBusinessPartner ? t('crm.update') : t('crm.create')}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          <Button
            variant="outline"
            onClick={() => setIsBpCrmSettingsDialogOpen(true)}
            data-testid="button-bp-crm-settings"
            className="h-10 px-4"
          >
            <Settings className="mr-2 h-4 w-4" />
            {language === 'vi' ? 'Cài Đặt' : 'Settings'}
          </Button>
        </div>
      </div>
      <Dialog open={isBpCrmSettingsDialogOpen} onOpenChange={setIsBpCrmSettingsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">{language === 'vi' ? 'Cài Đặt' : 'Settings'}</DialogTitle>
          </DialogHeader>
          <CrmSettingsManager context="bp" />
        </DialogContent>
      </Dialog>
      <Dialog open={isBusinessPartnerViewDialogOpen} onOpenChange={setIsBusinessPartnerViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
            <DialogHeader>
            </DialogHeader>
            {viewingBusinessPartner && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">{t('crm.basicInfo')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Đại diện' : 'Representative'}</label>
                      <p className="text-base mt-1">{viewingBusinessPartner.firstName} {viewingBusinessPartner.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Chức vụ' : 'Position'}</label>
                      <p className="text-base mt-1">{viewingBusinessPartner.position || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('crm.email')}</label>
                      <p className="text-base mt-1">{viewingBusinessPartner.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('crm.phone')}</label>
                      <p className="text-base mt-1">{viewingBusinessPartner.phone || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('crm.company')}</label>
                      <p className="text-base mt-1">{viewingBusinessPartner.company || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('crm.address')}</label>
                      <p className="text-base mt-1">{viewingBusinessPartner.address || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">{language === 'vi' ? 'Trạng Thái' : 'Status'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Hạng Mục' : 'Category'}</label>
                      <p className="text-base mt-1 capitalize">
                        {(() => {
                          const cat = bpCategories.find((s: any) => s.value === viewingBusinessPartner.stage);
                          return cat ? (language === 'vi' ? cat.labelVi : cat.labelEn) : viewingBusinessPartner.stage || "—";
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('crm.status')}</label>
                      <p className="text-base mt-1 capitalize">
                        {(() => {
                          const status = bpStatuses.find((s: any) => s.value === viewingBusinessPartner.status);
                          return status ? (language === 'vi' ? status.labelVi : status.labelEn) : viewingBusinessPartner.status;
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Khởi tạo' : 'Intake Date'}</label>
                      <p className="text-base mt-1">{viewingBusinessPartner.intakeDate ? new Date(viewingBusinessPartner.intakeDate).toLocaleDateString('vi-VN') : "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('crm.created')}</label>
                      <p className="text-base mt-1">{formatDate(viewingBusinessPartner.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">{language === 'vi' ? 'Tài Chính' : 'Financial'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Thu' : 'Income'}</label>
                      <p className="text-base mt-1 font-semibold">
                        {Math.round(bpFinances[viewingBusinessPartner.id]?.totalSpending || 0).toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Chi' : 'Expense'}</label>
                      <p className="text-base mt-1 font-semibold">
                        {Math.round(bpFinances[viewingBusinessPartner.id]?.refundAmount || 0).toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  </div>
                </div>

                {viewingBusinessPartner.tags && Array.isArray(viewingBusinessPartner.tags) && viewingBusinessPartner.tags.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{t('crm.tags')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingBusinessPartner.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {viewingBusinessPartner.notes && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{t('crm.notes')}</h3>
                    <p className="text-base whitespace-pre-wrap">{viewingBusinessPartner.notes}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">{language === 'vi' ? 'Lịch sử giao dịch' : 'Transaction History'}</h3>
                  {viewBpTransactionsLoading ? (
                    <div className="text-sm text-white/50">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
                  ) : !Array.isArray(viewBpTransactions) || viewBpTransactions.length === 0 ? (
                    <div className="text-sm text-white/50">{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</div>
                  ) : (
                    <div className="border border-white/30 rounded-none max-h-64 overflow-y-auto bg-black">
                      {viewBpTransactions.map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between px-3 py-3 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{transaction.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                {transaction.type === "payment" ? (language === 'vi' ? "Thu" : "Income") : transaction.type === "refund" ? (language === 'vi' ? "Chi" : "Expense") : "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-white">{Math.round(parseFloat(transaction.amount)).toLocaleString('vi-VN')} đ</span>
                              <div className="flex items-center gap-2">
                                {transaction.status === "completed" && transaction.paymentDate && (
                                  <span className="text-[10px] text-white/50">
                                    {new Date(transaction.paymentDate).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                                <span className="text-[10px] text-white/50">
                                  {transaction.status === "pending" ? (language === 'vi' ? "Đang chờ" : "Pending") : transaction.status === "completed" ? (language === 'vi' ? "Hoàn thành" : "Completed") : transaction.status === "cancelled" ? (language === 'vi' ? "Đã hủy" : "Cancelled") : "—"}
                                </span>
                              </div>
                            </div>
                            {transaction.description && (
                              <p className="text-[10px] text-white/50">{transaction.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => {
                      setIsBusinessPartnerViewDialogOpen(false);
                      setViewingBusinessPartner(null);
                    }}
                    className="h-10 px-4"
                  >
                    {t('crm.close')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      <Dialog open={isBpTransactionDialogOpen} onOpenChange={setIsBpTransactionDialogOpen}>
        <DialogContent className="max-w-md bg-black border border-white/20 rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editingBpTransaction ? (language === 'vi' ? "Chỉnh sửa giao dịch" : "Edit Transaction") : (language === 'vi' ? "Thêm giao dịch mới" : "Add New Transaction")}
            </DialogTitle>
          </DialogHeader>
          <Form {...bpTransactionForm}>
            <form onSubmit={bpTransactionForm.handleSubmit(onBpTransactionSubmit)} className="space-y-4">
              <FormField
                control={bpTransactionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'vi' ? 'Tiêu đề' : 'Title'}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={language === 'vi' ? "VD: Thu đợt 1" : "E.g.: Income phase 1"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bpTransactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'vi' ? 'Số tiền (đ)' : 'Amount (đ)'}</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="VD: 50000000" maxLength={12} onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) e.preventDefault(); }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={bpTransactionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'vi' ? 'Loại' : 'Type'}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-t-0 border-l-0 border-r-0 border-b border-white/30 rounded-none">
                            <SelectValue placeholder={language === 'vi' ? "Chọn loại" : "Select type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="payment">{language === 'vi' ? 'Thu' : 'Income'}</SelectItem>
                          <SelectItem value="refund">{language === 'vi' ? 'Chi' : 'Expense'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bpTransactionForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'vi' ? 'Trạng thái' : 'Status'}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-t-0 border-l-0 border-r-0 border-b border-white/30 rounded-none">
                            <SelectValue placeholder={language === 'vi' ? "Chọn trạng thái" : "Select status"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">{language === 'vi' ? 'Đang chờ' : 'Pending'}</SelectItem>
                          <SelectItem value="completed">{language === 'vi' ? 'Hoàn thành' : 'Completed'}</SelectItem>
                          <SelectItem value="cancelled">{language === 'vi' ? 'Đã hủy' : 'Cancelled'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {bpTransactionForm.watch("status") === "completed" && (
                  <FormField
                    control={bpTransactionForm.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Ngày thanh toán' : 'Payment Date'}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={bpTransactionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'vi' ? 'Ghi chú' : 'Notes'}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={language === 'vi' ? "Ghi chú thêm (tùy chọn)" : "Additional notes (optional)"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsBpTransactionDialogOpen(false);
                    setEditingBpTransaction(null);
                    bpTransactionForm.reset();
                  }}
                  className="h-10 px-4"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button 
                  type="submit"
                  disabled={createBpTransactionMutation.isPending || updateBpTransactionMutation.isPending}
                  className="h-10 px-4"
                >
                  {editingBpTransaction ? (language === 'vi' ? "Cập nhật" : "Update") : (language === 'vi' ? "Thêm" : "Add")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-black border-white/10 rounded-none">
          <CardContent className="p-6 min-h-[90px]">
            <div>
              <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng đối tác' : 'Total Partners'}</p>
              <p className="text-2xl font-semibold mt-1">{businessPartners.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-white/10 rounded-none">
          <CardContent className="p-6 min-h-[90px]">
            <div>
              <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng thu' : 'Total Income'}</p>
              <p className="text-2xl font-semibold mt-1">
                {(Array.isArray(allBpTransactions) ? allBpTransactions : []).reduce((sum: number, t: any) => {
                  if (t.status !== "completed" || t.type !== "payment") return sum;
                  return sum + parseFloat(t.amount || "0");
                }, 0).toLocaleString('vi-VN', {maximumFractionDigits: 0})} đ
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-white/10 rounded-none">
          <CardContent className="p-6 min-h-[90px]">
            <div>
              <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng chi' : 'Total Expense'}</p>
              <p className="text-2xl font-semibold mt-1">
                {(Array.isArray(allBpTransactions) ? allBpTransactions : []).reduce((sum: number, t: any) => {
                  if (t.status !== "completed" || t.type !== "refund") return sum;
                  return sum + parseFloat(t.amount || "0");
                }, 0).toLocaleString('vi-VN', {maximumFractionDigits: 0})} đ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={bpSearchQuery}
            onChange={(e) => { setBpSearchQuery(e.target.value); setBpCurrentPage(1); }}
            placeholder={language === 'vi' ? 'Chúng tôi có thể giúp bạn tìm gì?' : 'What can we help you find?'}
            className="pl-10 bg-transparent border-0 border-b border-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/60 placeholder:text-white/40"
          />
        </div>
        <div className="grid grid-cols-3 sm:flex gap-3 sm:gap-4">
          <Select value={bpTierFilter} onValueChange={(v) => { setBpTierFilter(v); setBpCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0 text-xs sm:text-sm">
              <SelectValue placeholder={language === 'vi' ? 'Tất cả danh mục' : 'All tiers'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'vi' ? 'Tất cả danh mục' : 'All tiers'}</SelectItem>
              {bpTiersData.filter((t: any) => t.active).sort((a: any, b: any) => a.order - b.order).map((tier: any) => (
                <SelectItem key={tier.id} value={tier.value}>
                  {language === 'vi' ? tier.labelVi : tier.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bpStageFilter} onValueChange={(v) => { setBpStageFilter(v); setBpCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0 text-xs sm:text-sm">
              <SelectValue placeholder={language === 'vi' ? 'Tất cả hạng mục' : 'All categories'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'vi' ? 'Tất cả hạng mục' : 'All categories'}</SelectItem>
              {bpCategories.filter((s: any) => s.active).sort((a: any, b: any) => a.order - b.order).map((cat: any) => (
                <SelectItem key={cat.id} value={cat.value}>
                  {language === 'vi' ? cat.labelVi : cat.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bpStatusFilter} onValueChange={(v) => { setBpStatusFilter(v); setBpCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0 text-xs sm:text-sm">
              <SelectValue placeholder={language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'}</SelectItem>
              {bpStatuses.filter((s: any) => s.active).sort((a: any, b: any) => a.order - b.order).map((status: any) => (
                <SelectItem key={status.id} value={status.value}>
                  {language === 'vi' ? status.labelVi : status.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {businessPartnersLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48" />
                      <div className="h-3 bg-muted rounded w-32" />
                    </div>
                    <div className="h-8 bg-muted rounded w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : businessPartners.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-light mb-2">{language === 'vi' ? 'Chưa có đối tác' : 'No partners found'}</h3>
              <p className="text-muted-foreground">{language === 'vi' ? 'Thêm đối tác đầu tiên để bắt đầu.' : 'Add your first partner to get started.'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="table-fixed min-w-[800px] w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[4%] whitespace-nowrap text-center">{language === 'vi' ? 'STT' : 'NO'}</TableHead>
                      <TableHead className="w-[10%] whitespace-nowrap text-center">
                        <div>{language === 'vi' ? 'Danh Mục' : 'Tier'}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">{language === 'vi' ? 'Hạng mục' : 'Category'}</div>
                      </TableHead>
                      <TableHead className="w-[12%] whitespace-nowrap">
                        <div>{language === 'vi' ? 'Đại Diện' : 'Representative'}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">{language === 'vi' ? 'Chức vụ' : 'Position'}</div>
                      </TableHead>
                      <TableHead className="w-[13%] whitespace-nowrap">
                        <div>{t('crm.phone')}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">{t('crm.email')}</div>
                      </TableHead>
                      <TableHead className="w-[13%] whitespace-nowrap">
                        <div>{t('crm.address')}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">{t('crm.company')}</div>
                      </TableHead>
                      <TableHead className="w-[12%] whitespace-nowrap">
                        <div>{language === 'vi' ? 'Thu' : 'Income'}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">{language === 'vi' ? 'Chi' : 'Expense'}</div>
                      </TableHead>
                      <TableHead className="w-[10%] text-center whitespace-nowrap">{t('crm.status')}</TableHead>
                      <TableHead className="w-[7%] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBusinessPartners.map((bp: any, idx: number) => {
                      const bpTier = bpTiersData.find((t: any) => t.value === bp.tier);
                      return (
                      <TableRow key={bp.id} data-testid={`row-bp-${bp.id}`} className="relative h-16">
                        <TableCell className="align-middle text-center"><span className="text-sm">{bpStartIndex + idx + 1}</span></TableCell>
                        <TableCell className="align-middle text-center">
                          <div className="text-sm whitespace-nowrap">
                            {bpTier ? (language === 'vi' ? bpTier.labelVi : bpTier.labelEn) : '—'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                            {(() => {
                              const cat = bpCategories.find((s: any) => s.value === bp.stage);
                              return cat ? (language === 'vi' ? cat.labelVi : cat.labelEn) : bp.stage || '—';
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="whitespace-nowrap">
                            {bp.firstName}
                          </div>
                          {bp.position && (
                            <div className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                              {bp.position}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="text-sm truncate">{bp.lastName || "—"}</div>
                          <div className="text-xs text-muted-foreground truncate mt-1" title={bp.email}>
                            {bp.email}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="text-sm truncate" title={bp.address || ""}>
                            {bp.address || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-1" title={bp.company || ""}>
                            {bp.company || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="text-sm whitespace-nowrap">
                            {Math.round(bpFinances[bp.id]?.totalSpending || 0).toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                            {Math.round(bpFinances[bp.id]?.refundAmount || 0).toLocaleString('vi-VN')} đ
                          </div>
                        </TableCell>
                        <TableCell className="align-middle text-center">
                          <span className="text-sm" data-testid={`select-bp-status-${bp.id}`}>
                            {(() => {
                              const status = bpStatuses.find((s: any) => s.value === bp.status);
                              return status ? (language === 'vi' ? status.labelVi : status.labelEn) : bp.status || '—';
                            })()}
                          </span>
                        </TableCell>
                        <TableCell className="align-middle text-right">
                          <div className="flex flex-col items-end">
                            <div className="flex gap-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setViewingBusinessPartner(bp);
                                  setIsBusinessPartnerViewDialogOpen(true);
                                }}
                                data-testid={`button-view-bp-${bp.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBusinessPartner(bp)}
                                data-testid={`button-edit-bp-${bp.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBpCurrentPage(1)}
                    disabled={bpCurrentPage === 1}
                    className="text-xs min-w-[40px] sm:min-w-[60px] px-1 sm:px-3"
                  >
                    {language === 'vi' ? 'ĐẦU' : 'FIRST'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBpCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={bpCurrentPage === 1}
                    className="text-xs min-w-[40px] sm:min-w-[60px] px-1 sm:px-3"
                  >
                    {language === 'vi' ? 'TRƯỚC' : 'PREV'}
                  </Button>
                  {Array.from({ length: bpTotalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={bpCurrentPage === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setBpCurrentPage(page)}
                      className="text-xs min-w-[32px] border-0"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBpCurrentPage(prev => Math.min(bpTotalPages, prev + 1))}
                    disabled={bpCurrentPage === bpTotalPages}
                    className="text-xs min-w-[40px] sm:min-w-[60px] px-1 sm:px-3"
                  >
                    {language === 'vi' ? 'SAU' : 'NEXT'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBpCurrentPage(bpTotalPages)}
                    disabled={bpCurrentPage === bpTotalPages}
                    className="text-xs min-w-[40px] sm:min-w-[60px] px-1 sm:px-3"
                  >
                    {language === 'vi' ? 'CUỐI' : 'LAST'}
                  </Button>
                </div>
                <div className="text-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {language === 'vi' ? `Hiển thị ${bpStartIndex + 1}-${Math.min(bpEndIndex, businessPartners.length)} / ${businessPartners.length} đối tác` : `Showing ${bpStartIndex + 1}-${Math.min(bpEndIndex, businessPartners.length)} of ${businessPartners.length} partners`}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
