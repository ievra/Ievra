import { useState, useEffect, useMemo } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Eye, Plus, Settings, Lock, Search, X, Check, ChevronsUpDown } from "lucide-react";
import type { Client } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import CrmSettingsManager from "@/components/CrmSettingsManager";

const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
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
  designTimeline: z.number().optional(),
  constructionTimeline: z.number().optional(),
  tier: z.string().default("silver"),
  identityCard: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const interactionSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  type: z.enum(["visit", "meeting", "site_survey", "design", "acceptance", "call", "email"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  duration: z.number().optional(),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional(),
  attachments: z.array(z.string()).default([]),
  createdBy: z.string().optional(),
});

const dealSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  value: z.string().min(1, "Value is required"),
  stage: z.enum(["proposal", "negotiation", "contract", "delivery", "completed", "lost"]).default("proposal"),
  probability: z.number().min(0).max(100).default(50),
  expectedCloseDate: z.string().optional(),
  actualCloseDate: z.string().optional(),
  description: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  lostReason: z.string().optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
});

const transactionSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
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
  category: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;
type TransactionFormData = z.infer<typeof transactionSchema>;

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

interface AdminClientsTabProps {
  user: any;
  hasPermission: (user: any, permission: string) => boolean;
}

export default function AdminClientsTab({ user, hasPermission }: AdminClientsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isClientViewDialogOpen, setIsClientViewDialogOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [transactionCategory, setTransactionCategory] = useState<string>("design");
  const [isCrmSettingsDialogOpen, setIsCrmSettingsDialogOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientStageFilter, setClientStageFilter] = useState('all');
  const [clientStatusFilter, setClientStatusFilter] = useState('all');
  const [clientWarrantyFilter, setClientWarrantyFilter] = useState('all');
  const [clientTierFilter, setClientTierFilter] = useState('all');

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: crmStages = [] } = useQuery<any[]>({
    queryKey: ['/api/crm-pipeline-stages'],
  });

  const { data: crmTiers = [] } = useQuery<any[]>({
    queryKey: ['/api/crm-customer-tiers'],
  });

  const { data: crmStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/crm-statuses'],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions', editingClient?.id],
    queryFn: async () => {
      if (!editingClient?.id) return [];
      const response = await fetch(`/api/transactions?clientId=${editingClient.id}`);
      return response.json();
    },
    enabled: !!editingClient?.id,
  });

  const { data: viewTransactions = [], isLoading: viewTransactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions', viewingClient?.id],
    queryFn: async () => {
      if (!viewingClient?.id) return [];
      const response = await fetch(`/api/transactions?clientId=${viewingClient.id}`);
      return response.json();
    },
    enabled: !!viewingClient?.id,
  });

  const { data: allTransactions = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      return response.json();
    },
  });

  const filteredClients = clients.filter(client => {
    if (clientStageFilter !== 'all' && (client.stage || 'lead') !== clientStageFilter) return false;
    if (clientStatusFilter !== 'all' && (client.status || 'active') !== clientStatusFilter) return false;
    if (clientWarrantyFilter !== 'all' && (client.warrantyStatus || 'none') !== clientWarrantyFilter) return false;
    if (clientTierFilter !== 'all' && (client.tier || 'silver') !== clientTierFilter) return false;
    if (!clientSearchQuery) return true;
    const searchLower = clientSearchQuery.toLowerCase();
    return (
      (`${client.firstName} ${client.lastName}`).toLowerCase().includes(searchLower) ||
      (client.email || '').toLowerCase().includes(searchLower) ||
      (client.phone || '').toLowerCase().includes(searchLower) ||
      (client.company || '').toLowerCase().includes(searchLower) ||
      (client.address || '').toLowerCase().includes(searchLower)
    );
  });
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [clients.length, currentPage, totalPages]);

  const clientFinances = useMemo(() => {
    const finances: Record<string, { totalSpending: number; refundAmount: number; commission: number; pendingAmount: number }> = {};
    
    allTransactions.forEach((t: any) => {
      if (!t.clientId) return;
      
      if (!finances[t.clientId]) {
        finances[t.clientId] = { totalSpending: 0, refundAmount: 0, commission: 0, pendingAmount: 0 };
      }
      
      const amount = parseFloat(t.amount || "0");
      
      if (t.status === "completed") {
        if (t.type === "payment") {
          finances[t.clientId].totalSpending += amount;
        } else if (t.type === "refund") {
          finances[t.clientId].refundAmount += amount;
        } else if (t.type === "commission") {
          finances[t.clientId].commission += amount;
        }
      } else if (t.status === "pending" && t.type === "payment") {
        finances[t.clientId].pendingAmount += amount;
      }
    });
    
    return finances;
  }, [allTransactions]);

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      intakeDate: "",
      warrantyExpiry: "",
      designTimeline: 0,
      constructionTimeline: 0,
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
      identityCard: "",
      tags: [],
      notes: "",
    },
  });

  const transactionForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      clientId: "",
      amount: "",
      title: "",
      description: "",
      type: "payment",
      status: "completed",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await apiRequest('POST', '/api/clients', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({ title: "Đã tạo khách hàng thành công" });
      clientForm.reset();
      setIsClientDialogOpen(false);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, showToast, ...updates }: { id: string; showToast?: boolean; [key: string]: any }) => {
      const response = await apiRequest('PUT', `/api/clients/${id}`, updates);
      return response.json();
    },
    onMutate: async ({ id, showToast, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/clients'] });
      const previousClients = queryClient.getQueryData(['/api/clients']);
      
      queryClient.setQueryData(['/api/clients'], (old: any) => {
        if (!old) return old;
        return old.map((client: any) => 
          client.id === id ? { ...client, ...updates } : client
        );
      });
      
      return { previousClients };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['/api/clients'], context.previousClients);
      }
      toast({ 
        title: "Lỗi khi cập nhật khách hàng", 
        description: err.message,
        variant: "destructive" 
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      if (variables.showToast !== false) {
        toast({ title: "Đã cập nhật khách hàng thành công" });
      }
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: "Đã xóa khách hàng thành công" });
      setIsClientDialogOpen(false);
      setEditingClient(null);
      clientForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa khách hàng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: "Đã thêm giao dịch thành công" });
      transactionForm.reset();
      setIsTransactionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi thêm giao dịch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => {
      const response = await apiRequest('PUT', `/api/transactions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({ title: "Đã cập nhật giao dịch thành công" });
      setEditingTransaction(null);
      transactionForm.reset();
      setIsTransactionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật giao dịch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({ title: "Đã xóa giao dịch thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa giao dịch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    
    const formatDateForInput = (dateValue: any) => {
      if (!dateValue) return "";
      const date = new Date(dateValue);
      return date.toISOString().split('T')[0];
    };
    
    clientForm.reset({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone || "",
      company: client.company || "",
      address: client.address || "",
      intakeDate: formatDateForInput(client.intakeDate),
      stage: client.stage || "lead",
      status: client.status || "active",
      totalSpending: client.totalSpending || "0",
      refundAmount: client.refundAmount || "0",
      commission: client.commission || "0",
      orderCount: client.orderCount || 0,
      referredById: client.referredById || "",
      referralCount: client.referralCount || 0,
      referralRevenue: client.referralRevenue || "0",
      warrantyStatus: (client.warrantyStatus as "none" | "active" | "expired") || "none",
      warrantyExpiry: formatDateForInput(client.warrantyExpiry),
      designTimeline: client.designTimeline || 0,
      constructionTimeline: client.constructionTimeline || 0,
      tier: client.tier || "silver",
      identityCard: client.identityCard || "",
      tags: Array.isArray(client.tags) ? (client.tags as string[]) : [],
      notes: client.notes || "",
    });
    setIsClientDialogOpen(true);
  };

  const onClientSubmit = async (data: ClientFormData) => {
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

      if (editingClient) {
        await updateClientMutation.mutateAsync({ id: editingClient.id, ...cleanedData });
        setEditingClient(null);
        setIsClientDialogOpen(false);
        clientForm.reset();
      } else {
        await createClientMutation.mutateAsync(cleanedData);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi khi lưu khách hàng",
        description: error?.message || "Có lỗi xảy ra, vui lòng thử lại",
        variant: "destructive",
      });
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    transactionForm.reset({
      clientId: transaction.clientId,
      amount: transaction.amount,
      title: transaction.title,
      description: transaction.description || "",
      type: transaction.type || "",
      status: transaction.status || "",
      paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: transaction.notes || "",
      category: transaction.category || "design",
    });
    setIsTransactionDialogOpen(true);
  };

  const onTransactionSubmit = async (data: TransactionFormData) => {
    try {
      const cleanedData = {
        ...data,
        amount: String(Math.round(parseFloat(data.amount.replace(/[^0-9.]/g, '')))),
        type: data.type || "payment",
        status: data.status || "completed",
        category: data.category || transactionCategory,
      };
      if (editingTransaction) {
        await updateTransactionMutation.mutateAsync({ id: editingTransaction.id, data: cleanedData });
      } else {
        await createTransactionMutation.mutateAsync(cleanedData);
      }
    } catch (error) {
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!hasPermission(user, 'crm')) {
    return <PermissionDenied feature="CRM / Clients" />;
  }

  return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-2xl font-sans font-light">{t('crm.clientManagement')}</h2>
          <div className="flex gap-2 flex-shrink-0">
            <Dialog open={isClientDialogOpen} onOpenChange={(open) => {
            setIsClientDialogOpen(open);
            if (!open) {
              setEditingClient(null);
              clientForm.reset({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
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
                identityCard: "",
                tags: [],
                notes: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingClient(null);
                  clientForm.reset({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    company: "",
                    address: "",
                    stage: "lead",
                    status: "active",
                    tier: "silver",
                    identityCard: "",
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
                data-testid="button-add-client"
                className="h-10 px-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('crm.addClient')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black border border-white/20 rounded-none">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? t('crm.editClient') : t('crm.addClient')}
                </DialogTitle>
              </DialogHeader>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(onClientSubmit, (errors) => {
                  console.error("Form validation errors:", JSON.stringify(errors, null, 2));
                  const firstKey = Object.keys(errors)[0];
                  const firstErr = errors[firstKey as keyof typeof errors];
                  toast({ title: `Lỗi: trường "${firstKey}" - ${(firstErr as any)?.message || "không hợp lệ"}`, variant: "destructive" });
                })} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.firstName')} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nguyễn" data-testid="input-client-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.lastName')} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Văn A" data-testid="input-client-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.email')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="email@example.com" data-testid="input-client-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Hạng Khách' : 'Customer Tier'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-client-tier">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {crmTiers
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.phone')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="0901234567" data-testid="input-client-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.company')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ABC Company" data-testid="input-client-company" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={clientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('crm.address')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM" data-testid="input-client-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="identityCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'CCCD/CMND' : 'Identity Card'}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0123456789XX" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="intakeDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Khởi tạo (Ngày tiếp nhận)' : 'Intake Date'}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" maxLength={10} data-testid="input-client-intake-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="warrantyExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.warrantyExpiry')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" maxLength={10} data-testid="input-client-warranty-expiry" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel>{t('crm.warrantyStatus')}</FormLabel>
                      <div className="h-10 px-3 py-2 rounded-none border border-white/30 bg-white/5 flex items-center">
                        <span className="text-sm text-white/70">
                          {(() => {
                            const warrantyDate = clientForm.watch('warrantyExpiry');
                            if (!warrantyDate) return '';
                            const expiry = new Date(warrantyDate);
                            const now = new Date();
                            return expiry < now ? t('crm.warranty.expired') : t('crm.warranty.active');
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.pipelineStage')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-client-stage">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {crmStages
                                .filter((stage: any) => stage.active)
                                .sort((a: any, b: any) => a.order - b.order)
                                .map((stage: any) => (
                                  <SelectItem key={stage.id} value={stage.value}>
                                    {language === 'vi' ? stage.labelVi : stage.labelEn}
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
                      control={clientForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.status')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-client-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {crmStatuses
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


                  {editingClient && (
                    <>
                    <div className="pt-6 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{language === 'vi' ? 'Doanh Thu Thiết Kế' : 'Design Revenue'}</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingTransaction(null);
                            setTransactionCategory("design");
                            transactionForm.reset({
                              clientId: editingClient.id,
                              amount: "",
                              title: "",
                              description: "",
                              type: "payment",
                              status: "completed",
                              paymentDate: new Date().toISOString().split('T')[0],
                              notes: "",
                              category: "design",
                            });
                            setIsTransactionDialogOpen(true);
                          }}
                          className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none h-8 w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {transactionsLoading ? (
                        <div className="text-sm text-white/50">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
                      ) : (() => {
                        const filtered = Array.isArray(transactions) ? transactions.filter((t: any) => t.category === 'design' || !t.category) : [];
                        return filtered.length === 0 ? (
                          <div className="text-sm text-white/50">{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</div>
                        ) : (
                        <div className="border border-white/30 rounded-none max-h-48 overflow-y-auto bg-black">
                          {filtered.map((transaction: any) => (
                            <div key={transaction.id} className="flex items-center justify-between px-2 py-2 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">{transaction.title}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                    {transaction.type === "payment" ? (language === 'vi' ? "Thanh toán" : "Payment") : transaction.type === "refund" ? (language === 'vi' ? "Hoàn tiền" : "Refund") : "—"}
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
                                    setEditingTransaction(transaction);
                                    setTransactionCategory("design");
                                    transactionForm.reset({
                                      clientId: transaction.clientId,
                                      amount: transaction.amount,
                                      title: transaction.title,
                                      description: transaction.description || "",
                                      type: transaction.type || "payment",
                                      status: transaction.status || "completed",
                                      paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split('T')[0] : "",
                                      notes: transaction.notes || "",
                                      category: transaction.category || "design",
                                    });
                                    setIsTransactionDialogOpen(true);
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
                                      <AlertDialogCancel className="bg-black border-white/20 hover:border-white hover:bg-black rounded-none h-10 px-4 transition-colors">
                                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                                        className="rounded-none h-10 px-4 bg-black text-white border border-white/20 hover:border-white transition-colors"
                                        disabled={deleteTransactionMutation.isPending}
                                      >
                                        {deleteTransactionMutation.isPending ? (language === 'vi' ? "Đang xóa..." : "Deleting...") : (language === 'vi' ? "Xóa" : "Delete")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                        );
                      })()}
                    </div>

                    <div className="pt-6 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{language === 'vi' ? 'Doanh Thu Thi Công' : 'Construction Revenue'}</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingTransaction(null);
                            setTransactionCategory("construction");
                            transactionForm.reset({
                              clientId: editingClient.id,
                              amount: "",
                              title: "",
                              description: "",
                              type: "payment",
                              status: "completed",
                              paymentDate: new Date().toISOString().split('T')[0],
                              notes: "",
                              category: "construction",
                            });
                            setIsTransactionDialogOpen(true);
                          }}
                          className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none h-8 w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {transactionsLoading ? (
                        <div className="text-sm text-white/50">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
                      ) : (() => {
                        const filtered = Array.isArray(transactions) ? transactions.filter((t: any) => t.category === 'construction') : [];
                        return filtered.length === 0 ? (
                          <div className="text-sm text-white/50">{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</div>
                        ) : (
                        <div className="border border-white/30 rounded-none max-h-48 overflow-y-auto bg-black">
                          {filtered.map((transaction: any) => (
                            <div key={transaction.id} className="flex items-center justify-between px-2 py-2 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">{transaction.title}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                    {transaction.type === "payment" ? (language === 'vi' ? "Thanh toán" : "Payment") : transaction.type === "refund" ? (language === 'vi' ? "Hoàn tiền" : "Refund") : "—"}
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
                                    setEditingTransaction(transaction);
                                    setTransactionCategory("construction");
                                    transactionForm.reset({
                                      clientId: transaction.clientId,
                                      amount: transaction.amount,
                                      title: transaction.title,
                                      description: transaction.description || "",
                                      type: transaction.type || "payment",
                                      status: transaction.status || "completed",
                                      paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split('T')[0] : "",
                                      notes: transaction.notes || "",
                                      category: transaction.category || "construction",
                                    });
                                    setIsTransactionDialogOpen(true);
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
                                      <AlertDialogCancel className="bg-black border-white/20 hover:border-white hover:bg-black rounded-none h-10 px-4 transition-colors">
                                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                                        className="rounded-none h-10 px-4 bg-black text-white border border-white/20 hover:border-white transition-colors"
                                        disabled={deleteTransactionMutation.isPending}
                                      >
                                        {deleteTransactionMutation.isPending ? (language === 'vi' ? "Đang xóa..." : "Deleting...") : (language === 'vi' ? "Xóa" : "Delete")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                        );
                      })()}
                    </div>

                    <div className="pt-6 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{language === 'vi' ? 'Giao Dịch Khác' : 'Other Transactions'}</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingTransaction(null);
                            setTransactionCategory("other");
                            transactionForm.reset({
                              clientId: editingClient.id,
                              amount: "",
                              title: "",
                              description: "",
                              type: "payment",
                              status: "completed",
                              paymentDate: new Date().toISOString().split('T')[0],
                              notes: "",
                              category: "other",
                            });
                            setIsTransactionDialogOpen(true);
                          }}
                          className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none h-8 w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {transactionsLoading ? (
                        <div className="text-sm text-white/50">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
                      ) : (() => {
                        const filtered = Array.isArray(transactions) ? transactions.filter((t: any) => t.category === 'other') : [];
                        return filtered.length === 0 ? (
                          <div className="text-sm text-white/50">{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</div>
                        ) : (
                        <div className="border border-white/30 rounded-none max-h-48 overflow-y-auto bg-black">
                          {filtered.map((transaction: any) => (
                            <div key={transaction.id} className="flex items-center justify-between px-2 py-2 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">{transaction.title}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                    {transaction.type === "payment" ? (language === 'vi' ? "Thanh toán" : "Payment") : transaction.type === "refund" ? (language === 'vi' ? "Hoàn tiền" : "Refund") : "—"}
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
                                    setEditingTransaction(transaction);
                                    setTransactionCategory("other");
                                    transactionForm.reset({
                                      clientId: transaction.clientId,
                                      amount: transaction.amount,
                                      title: transaction.title,
                                      description: transaction.description || "",
                                      type: transaction.type || "payment",
                                      status: transaction.status || "completed",
                                      paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split('T')[0] : "",
                                      notes: transaction.notes || "",
                                      category: transaction.category || "other",
                                    });
                                    setIsTransactionDialogOpen(true);
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
                                      <AlertDialogCancel className="bg-black border-white/20 hover:border-white hover:bg-black rounded-none h-10 px-4 transition-colors">
                                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                                        className="rounded-none h-10 px-4 bg-black text-white border border-white/20 hover:border-white transition-colors"
                                        disabled={deleteTransactionMutation.isPending}
                                      >
                                        {deleteTransactionMutation.isPending ? (language === 'vi' ? "Đang xóa..." : "Deleting...") : (language === 'vi' ? "Xóa" : "Delete")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                        );
                      })()}
                    </div>
                    </>
                  )}

                  <FormField
                    control={clientForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('crm.notes')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Ghi chú về khách hàng..." data-testid="input-client-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    {editingClient && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="border-white/30 text-white hover:border-white hover:bg-white/10 rounded-none h-8 w-8"
                            data-testid="button-delete-client"
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-none">
                          {Array.isArray(transactions) && transactions.length > 0 ? (
                            <>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{language === 'vi' ? 'Không thể xóa khách hàng' : 'Cannot Delete Client'}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {language === 'vi'
                                    ? <>Khách hàng <strong>{editingClient.firstName} {editingClient.lastName}</strong> hiện có <strong>{transactions.length}</strong> giao dịch. Vui lòng xóa tất cả giao dịch trước khi xóa khách hàng.</>
                                    : <>Client <strong>{editingClient.firstName} {editingClient.lastName}</strong> currently has <strong>{transactions.length}</strong> transaction(s). Please delete all transactions before deleting this client.</>
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-black border-white/20 hover:border-white hover:bg-black rounded-none h-10 px-4 transition-colors">
                                  {language === 'vi' ? 'Đã hiểu' : 'Understood'}
                                </AlertDialogCancel>
                              </AlertDialogFooter>
                            </>
                          ) : (
                            <>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{language === 'vi' ? 'Xác nhận xóa khách hàng' : 'Confirm Delete Client'}</AlertDialogTitle>
                                <AlertDialogDescription className="text-white/70">
                                  {language === 'vi' 
                                    ? <>Bạn có chắc chắn muốn xóa khách hàng <strong className="text-white">{editingClient.firstName} {editingClient.lastName}</strong>?</>
                                    : <>Are you sure you want to delete client <strong className="text-white">{editingClient.firstName} {editingClient.lastName}</strong>?</>
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-black border-white/20 hover:border-white hover:bg-black rounded-none h-10 px-4 transition-colors">
                                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteClientMutation.mutate(editingClient.id)}
                                  className="rounded-none h-10 px-4 bg-black text-white border border-white/20 hover:border-white transition-colors"
                                  disabled={deleteClientMutation.isPending}
                                >
                                  {deleteClientMutation.isPending ? (language === 'vi' ? "Đang xóa..." : "Deleting...") : (language === 'vi' ? "Xóa" : "Delete")}
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
                          setIsClientDialogOpen(false);
                          setEditingClient(null);
                          clientForm.reset();
                        }}
                        className="h-10 px-4"
                      >
                        {t('crm.cancel')}
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createClientMutation.isPending || updateClientMutation.isPending}
                        data-testid="button-save-client"
                        className="h-10 px-4"
                      >
                        {editingClient ? t('crm.update') : t('crm.create')}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
            <Button
              variant="outline"
              onClick={() => setIsCrmSettingsDialogOpen(true)}
              data-testid="button-crm-settings"
              className="h-10 px-4"
            >
              <Settings className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Cài Đặt' : 'Settings'}
            </Button>
          </div>
        </div>
        <Dialog open={isCrmSettingsDialogOpen} onOpenChange={setIsCrmSettingsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light">{language === 'vi' ? 'Cài Đặt' : 'Settings'}</DialogTitle>
            </DialogHeader>
            <CrmSettingsManager context="client" />
          </DialogContent>
        </Dialog>
        <Dialog open={isClientViewDialogOpen} onOpenChange={setIsClientViewDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
              <DialogHeader>
              </DialogHeader>
              {viewingClient && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{t('crm.basicInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.name')}</label>
                        <p className="text-base mt-1">{viewingClient.firstName} {viewingClient.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.email')}</label>
                        <p className="text-base mt-1">{viewingClient.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.phone')}</label>
                        <p className="text-base mt-1">{viewingClient.phone || "—"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.company')}</label>
                        <p className="text-base mt-1">{viewingClient.company || "—"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.address')}</label>
                        <p className="text-base mt-1">{viewingClient.address || "—"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'CCCD/CMND' : 'Identity Card'}</label>
                        <p className="text-base mt-1">{viewingClient.identityCard || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{language === 'vi' ? 'Trạng Thái' : 'Status'}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.pipelineStage')}</label>
                        <p className="text-base mt-1 capitalize">
                          {(() => {
                            const stage = crmStages.find(s => s.value === viewingClient.stage);
                            return stage ? (language === 'vi' ? stage.labelVi : stage.labelEn) : viewingClient.stage;
                          })()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.status')}</label>
                        <p className="text-base mt-1 capitalize">
                          {(() => {
                            const status = crmStatuses.find(s => s.value === viewingClient.status);
                            return status ? (language === 'vi' ? status.labelVi : status.labelEn) : viewingClient.status;
                          })()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Khởi tạo' : 'Intake Date'}</label>
                        <p className="text-base mt-1">{viewingClient.intakeDate ? new Date(viewingClient.intakeDate).toLocaleDateString('vi-VN') : "—"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.created')}</label>
                        <p className="text-base mt-1">{formatDate(viewingClient.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{t('crm.financialInfo')}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Đã Thanh Toán' : 'Total Revenue'}</label>
                        <p className="text-base mt-1 font-semibold">
                          {Math.round(clientFinances[viewingClient.id]?.totalSpending || 0).toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Chưa Thanh Toán' : 'Pending Payment'}</label>
                        <p className="text-base mt-1 font-semibold">
                          {(() => {
                            const pending = Array.isArray(viewTransactions) ? viewTransactions.filter((t: any) => t.status === 'pending' && t.type === 'payment').reduce((sum: number, t: any) => sum + parseFloat(t.amount || "0"), 0) : 0;
                            return Math.round(pending).toLocaleString('vi-VN');
                          })()} đ
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Hoàn Trả' : 'Refund'}</label>
                        <p className="text-base mt-1 font-semibold">
                          {Math.round(clientFinances[viewingClient.id]?.refundAmount || 0).toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                    </div>
                  </div>

                  {!!viewingClient.tags && Array.isArray(viewingClient.tags) && (viewingClient.tags as string[]).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">{t('crm.tags')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {(viewingClient.tags as string[]).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingClient.notes && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">{t('crm.notes')}</h3>
                      <p className="text-base whitespace-pre-wrap">{viewingClient.notes}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{language === 'vi' ? 'Doanh Thu Thiết Kế' : 'Design Revenue'}</h3>
                    {viewTransactionsLoading ? (
                      <div className="text-sm text-white/50">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
                    ) : (() => {
                      const filtered = Array.isArray(viewTransactions) ? viewTransactions.filter((t: any) => t.category === 'design' || !t.category) : [];
                      return filtered.length === 0 ? (
                        <div className="text-sm text-white/50">{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</div>
                      ) : (
                      <div className="border border-white/30 rounded-none max-h-64 overflow-y-auto bg-black">
                        {filtered.map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between px-3 py-3 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{transaction.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                  {transaction.type === "payment" ? (language === 'vi' ? "Thanh toán" : "Payment") : transaction.type === "refund" ? (language === 'vi' ? "Hoàn tiền" : "Refund") : "—"}
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
                      );
                    })()}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{language === 'vi' ? 'Doanh Thu Thi Công' : 'Construction Revenue'}</h3>
                    {viewTransactionsLoading ? (
                      <div className="text-sm text-white/50">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
                    ) : (() => {
                      const filtered = Array.isArray(viewTransactions) ? viewTransactions.filter((t: any) => t.category === 'construction') : [];
                      return filtered.length === 0 ? (
                        <div className="text-sm text-white/50">{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</div>
                      ) : (
                      <div className="border border-white/30 rounded-none max-h-64 overflow-y-auto bg-black">
                        {filtered.map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between px-3 py-3 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{transaction.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                  {transaction.type === "payment" ? (language === 'vi' ? "Thanh toán" : "Payment") : transaction.type === "refund" ? (language === 'vi' ? "Hoàn tiền" : "Refund") : "—"}
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
                      );
                    })()}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{language === 'vi' ? 'Giao Dịch Khác' : 'Other Transactions'}</h3>
                    {viewTransactionsLoading ? (
                      <div className="text-sm text-white/50">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
                    ) : (() => {
                      const filtered = Array.isArray(viewTransactions) ? viewTransactions.filter((t: any) => t.category === 'other') : [];
                      return filtered.length === 0 ? (
                        <div className="text-sm text-white/50">{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</div>
                      ) : (
                      <div className="border border-white/30 rounded-none max-h-64 overflow-y-auto bg-black">
                        {filtered.map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between px-3 py-3 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{transaction.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                  {transaction.type === "payment" ? (language === 'vi' ? "Thanh toán" : "Payment") : transaction.type === "refund" ? (language === 'vi' ? "Hoàn tiền" : "Refund") : "—"}
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
                      );
                    })()}
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => {
                        setIsClientViewDialogOpen(false);
                        setViewingClient(null);
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
        <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
          <DialogContent className="max-w-md bg-black border border-white/20 rounded-none">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? (language === 'vi' ? "Chỉnh sửa giao dịch" : "Edit Transaction") : (language === 'vi' ? "Thêm giao dịch mới" : "Add New Transaction")}
              </DialogTitle>
            </DialogHeader>
            <Form {...transactionForm}>
              <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
                <FormField
                  control={transactionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'vi' ? 'Tiêu đề' : 'Title'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={language === 'vi' ? "VD: Thanh toán đợt 1" : "E.g.: Payment phase 1"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={transactionForm.control}
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
                    control={transactionForm.control}
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
                            <SelectItem value="payment">{language === 'vi' ? 'Thanh toán' : 'Payment'}</SelectItem>
                            <SelectItem value="refund">{language === 'vi' ? 'Hoàn tiền' : 'Refund'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={transactionForm.control}
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

                  {transactionForm.watch("status") === "completed" && (
                    <FormField
                      control={transactionForm.control}
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
                  control={transactionForm.control}
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
                      setIsTransactionDialogOpen(false);
                      setEditingTransaction(null);
                      transactionForm.reset();
                    }}
                    className="h-10 px-4"
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
                    className="h-10 px-4"
                  >
                    {editingTransaction ? (language === 'vi' ? "Cập nhật" : "Update") : (language === 'vi' ? "Thêm" : "Add")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng khách hàng' : 'Total Clients'}</p>
                <p className="text-2xl font-semibold mt-1">{clients.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Đang bảo hành' : 'Active Warranty'}</p>
                <p className="text-2xl font-semibold mt-1">
                  {clients.filter(c => c.warrantyStatus === 'active').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng doanh thu' : 'Total Revenue'}</p>
                <p className="text-2xl font-semibold mt-1">
                  {allTransactions.filter(t => t.category === 'design' || t.category === 'construction' || !t.category).reduce((sum, t) => {
                    if (t.status !== "completed") return sum;
                    const amount = parseFloat(t.amount || "0");
                    if (t.type === "payment") return sum + amount;
                    if (t.type === "refund") return sum - amount;
                    return sum;
                  }, 0).toLocaleString('vi-VN', {maximumFractionDigits: 0})} đ
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Doanh thu thi công' : 'Construction Revenue'}</p>
                <p className="text-2xl font-semibold mt-1">
                  {allTransactions.filter(t => t.category === 'construction').reduce((sum, t) => {
                    if (t.status !== "completed") return sum;
                    const amount = parseFloat(t.amount || "0");
                    if (t.type === "payment") return sum + amount;
                    if (t.type === "refund") return sum - amount;
                    return sum;
                  }, 0).toLocaleString('vi-VN', {maximumFractionDigits: 0})} đ
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Doanh thu thiết kế' : 'Design Revenue'}</p>
                <p className="text-2xl font-semibold mt-1">
                  {allTransactions.filter(t => t.category === 'design' || !t.category).reduce((sum, t) => {
                    if (t.status !== "completed") return sum;
                    const amount = parseFloat(t.amount || "0");
                    if (t.type === "payment") return sum + amount;
                    if (t.type === "refund") return sum - amount;
                    return sum;
                  }, 0).toLocaleString('vi-VN', {maximumFractionDigits: 0})} đ
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={clientSearchQuery}
              onChange={(e) => { setClientSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={language === 'vi' ? 'Chúng tôi có thể giúp bạn tìm gì?' : 'What can we help you find?'}
              className="pl-10 bg-transparent border-0 border-b border-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/60 placeholder:text-white/40"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex gap-3 flex-shrink-0">
            <Select value={clientTierFilter} onValueChange={(v) => { setClientTierFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
                <SelectValue placeholder={language === 'vi' ? 'Tất cả hạng' : 'All tiers'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả hạng' : 'All tiers'}</SelectItem>
                {crmTiers.filter((t: any) => t.active).sort((a: any, b: any) => a.order - b.order).map((tier: any) => (
                  <SelectItem key={tier.id} value={tier.value}>
                    {language === 'vi' ? tier.labelVi : tier.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clientWarrantyFilter} onValueChange={(v) => { setClientWarrantyFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
                <SelectValue placeholder={language === 'vi' ? 'Tất cả bảo hành' : 'All warranty'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả bảo hành' : 'All warranty'}</SelectItem>
                <SelectItem value="active">{language === 'vi' ? 'Còn bảo hành' : 'Active'}</SelectItem>
                <SelectItem value="expired">{language === 'vi' ? 'Hết bảo hành' : 'Expired'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientStageFilter} onValueChange={(v) => { setClientStageFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
                <SelectValue placeholder={language === 'vi' ? 'Tất cả giai đoạn' : 'All stages'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả giai đoạn' : 'All stages'}</SelectItem>
                {crmStages.filter(s => s.active).sort((a, b) => a.order - b.order).map(stage => (
                  <SelectItem key={stage.id} value={stage.value}>
                    {language === 'vi' ? stage.labelVi : stage.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clientStatusFilter} onValueChange={(v) => { setClientStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
                <SelectValue placeholder={language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'}</SelectItem>
                {crmStatuses.filter(s => s.active).sort((a, b) => a.order - b.order).map(status => (
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
            {clientsLoading ? (
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
            ) : clients.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-lg font-light mb-2">{language === 'vi' ? 'Chưa có khách hàng' : 'No clients found'}</h3>
                <p className="text-muted-foreground">{language === 'vi' ? 'Thêm khách hàng đầu tiên để bắt đầu.' : 'Add your first client to get started.'}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="w-full min-w-[900px] table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px] whitespace-nowrap text-center">{language === 'vi' ? 'STT' : 'NO'}</TableHead>
                        <TableHead className="w-[60px] whitespace-nowrap text-center">{language === 'vi' ? 'Hạng' : 'Rank'}</TableHead>
                        <TableHead className="w-[130px] whitespace-nowrap">
                          <div>{t('admin.clients')}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">{language === 'vi' ? 'Khởi tạo' : 'Intake'}</div>
                        </TableHead>
                        <TableHead className="w-[120px] whitespace-nowrap">
                          <div>{t('crm.phone')}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">{t('crm.email')}</div>
                        </TableHead>
                        <TableHead className="w-[120px] whitespace-nowrap">
                          <div>{t('crm.address')}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">{t('crm.company')}</div>
                        </TableHead>
                        <TableHead className="w-[110px] whitespace-nowrap">
                          <div>{language === 'vi' ? 'Thanh Toán' : 'Paid'}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">{language === 'vi' ? 'Chưa Thanh Toán' : 'Unpaid'}</div>
                        </TableHead>
                        <TableHead className="w-[100px] text-center whitespace-nowrap">{t('crm.warrantyStatus')}</TableHead>
                        <TableHead className="w-[100px] text-center whitespace-nowrap">{t('crm.pipelineStage')}</TableHead>
                        <TableHead className="w-[100px] text-center whitespace-nowrap">{t('crm.status')}</TableHead>
                        <TableHead className="w-[60px] text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedClients.map((client, idx) => {
                        const clientTier = crmTiers.find((t: any) => t.value === client.tier);
                        return (
                        <TableRow key={client.id} data-testid={`row-client-${client.id}`} className="relative h-16">
                          <TableCell className="align-middle text-center"><span className="text-sm">{startIndex + idx + 1}</span></TableCell>
                          <TableCell className="align-middle text-center">
                            <span className="text-sm font-medium text-white/70">
                              {clientTier ? (language === 'vi' ? clientTier.labelVi : clientTier.labelEn) : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle overflow-hidden">
                            <div className="font-light truncate" title={`${client.firstName} ${client.lastName}`}>
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {client.intakeDate ? new Date(client.intakeDate).toLocaleDateString('vi-VN') : "—"}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle overflow-hidden">
                            <div className="text-sm truncate" title={client.phone || ""}>{client.phone || "—"}</div>
                            <div className="text-xs text-muted-foreground truncate mt-1" title={client.email}>
                              {client.email}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle overflow-hidden">
                            <div className="text-sm truncate" title={client.address || ""}>
                              {client.address || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-1" title={client.company || ""}>
                              {client.company || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="text-sm whitespace-nowrap">
                              {Math.round(clientFinances[client.id]?.totalSpending || 0).toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                              {Math.round(clientFinances[client.id]?.pendingAmount || 0).toLocaleString('vi-VN')} đ
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <div className="text-sm capitalize" data-testid={`text-client-warranty-${client.id}`}>
                              {client.warrantyStatus && client.warrantyStatus !== 'none' ? t(`crm.warranty.${client.warrantyStatus}`) : (language === 'vi' ? 'Không Bảo Hành' : 'No Warranty')}
                            </div>
                            {client.warrantyExpiry && client.warrantyStatus && client.warrantyStatus !== 'none' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(client.warrantyExpiry).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <span className="text-sm" data-testid={`select-client-stage-${client.id}`}>
                              {(() => {
                                const stage = crmStages.find(s => s.value === client.stage);
                                return stage ? (language === 'vi' ? stage.labelVi : stage.labelEn) : 'N/A';
                              })()}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <span className="text-sm" data-testid={`select-client-status-${client.id}`}>
                              {(() => {
                                const status = crmStatuses.find(s => s.value === client.status);
                                return status ? (language === 'vi' ? status.labelVi : status.labelEn) : 'N/A';
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
                                    setViewingClient(client);
                                    setIsClientViewDialogOpen(true);
                                  }}
                                  data-testid={`button-view-client-${client.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditClient(client)}
                                  data-testid={`button-edit-client-${client.id}`}
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
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="text-xs min-w-[60px]"
                    >
                      {language === 'vi' ? 'ĐẦU' : 'FIRST'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="text-xs min-w-[60px]"
                    >
                      {language === 'vi' ? 'TRƯỚC' : 'PREV'}
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="text-xs min-w-[32px] border-0"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs min-w-[60px]"
                    >
                      {language === 'vi' ? 'SAU' : 'NEXT'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="text-xs min-w-[60px]"
                    >
                      {language === 'vi' ? 'CUỐI' : 'LAST'}
                    </Button>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {language === 'vi' ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, clients.length)} / ${clients.length} khách hàng` : `Showing ${startIndex + 1}-${Math.min(endIndex, clients.length)} of ${clients.length} clients`}
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
