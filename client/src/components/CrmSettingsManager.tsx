import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { CrmPipelineStage, CrmCustomerTier, CrmStatus, BpCategory, BpStatus, BpTier } from "@shared/schema";
import { insertCrmPipelineStageSchema, insertCrmCustomerTierSchema, insertCrmStatusSchema, insertBpCategorySchema, insertBpStatusSchema, insertBpTierSchema } from "@shared/schema";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CrmSettingsManager({ context = 'all' }: { context?: 'all' | 'client' | 'bp' }) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isBpCategoryDialogOpen, setIsBpCategoryDialogOpen] = useState(false);
  const [isBpStatusDialogOpen, setIsBpStatusDialogOpen] = useState(false);
  const [isBpTierDialogOpen, setIsBpTierDialogOpen] = useState(false);
  
  const [editingStage, setEditingStage] = useState<CrmPipelineStage | null>(null);
  const [editingTier, setEditingTier] = useState<CrmCustomerTier | null>(null);
  const [editingStatus, setEditingStatus] = useState<CrmStatus | null>(null);
  const [editingBpCategory, setEditingBpCategory] = useState<BpCategory | null>(null);
  const [editingBpStatus, setEditingBpStatus] = useState<BpStatus | null>(null);
  const [editingBpTier, setEditingBpTier] = useState<BpTier | null>(null);

  const { data: stages = [] } = useQuery<CrmPipelineStage[]>({ queryKey: ['/api/crm-pipeline-stages'] });
  const { data: tiers = [] } = useQuery<CrmCustomerTier[]>({ queryKey: ['/api/crm-customer-tiers'] });
  const { data: statuses = [] } = useQuery<CrmStatus[]>({ queryKey: ['/api/crm-statuses'] });
  const { data: bpCategories = [] } = useQuery<BpCategory[]>({ queryKey: ['/api/bp-categories'] });
  const { data: bpStatuses = [] } = useQuery<BpStatus[]>({ queryKey: ['/api/bp-statuses'] });
  const { data: bpTiers = [] } = useQuery<BpTier[]>({ queryKey: ['/api/bp-tiers'] });

  const stageForm = useForm<z.infer<typeof insertCrmPipelineStageSchema>>({
    resolver: zodResolver(insertCrmPipelineStageSchema),
    defaultValues: {
      value: "",
      labelEn: "",
      labelVi: "",
      order: 0,
      active: true,
    },
  });

  const tierForm = useForm<z.infer<typeof insertCrmCustomerTierSchema>>({
    resolver: zodResolver(insertCrmCustomerTierSchema),
    defaultValues: {
      value: "",
      labelEn: "",
      labelVi: "",
      order: 0,
      active: true,
    },
  });

  const statusForm = useForm<z.infer<typeof insertCrmStatusSchema>>({
    resolver: zodResolver(insertCrmStatusSchema),
    defaultValues: {
      value: "",
      labelEn: "",
      labelVi: "",
      order: 0,
      active: true,
    },
  });

  const createStageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCrmPipelineStageSchema>) => {
      return await apiRequest('POST', '/api/crm-pipeline-stages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-pipeline-stages'] });
      setIsStageDialogOpen(false);
      stageForm.reset();
      toast({ title: language === 'vi' ? 'Đã tạo giai đoạn thành công' : 'Pipeline stage created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: language === 'vi' ? 'Lỗi tạo giai đoạn' : 'Failed to create stage', description: error.message, variant: 'destructive' });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CrmPipelineStage> & { id: string }) => {
      return await apiRequest('PUT', `/api/crm-pipeline-stages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-pipeline-stages'] });
      setIsStageDialogOpen(false);
      setEditingStage(null);
      stageForm.reset();
      toast({ title: language === 'vi' ? 'Đã cập nhật giai đoạn thành công' : 'Pipeline stage updated successfully' });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/crm-pipeline-stages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-pipeline-stages'] });
      toast({ title: language === 'vi' ? 'Đã xóa giai đoạn thành công' : 'Pipeline stage deleted successfully' });
    },
  });

  const createTierMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCrmCustomerTierSchema>) => {
      return await apiRequest('POST', '/api/crm-customer-tiers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-customer-tiers'] });
      setIsTierDialogOpen(false);
      tierForm.reset();
      toast({ title: language === 'vi' ? 'Đã tạo hạng khách thành công' : 'Customer tier created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: language === 'vi' ? 'Lỗi tạo hạng khách' : 'Failed to create tier', description: error.message, variant: 'destructive' });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CrmCustomerTier> & { id: string }) => {
      return await apiRequest('PUT', `/api/crm-customer-tiers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-customer-tiers'] });
      setIsTierDialogOpen(false);
      setEditingTier(null);
      tierForm.reset();
      toast({ title: language === 'vi' ? 'Đã cập nhật hạng khách thành công' : 'Customer tier updated successfully' });
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/crm-customer-tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-customer-tiers'] });
      toast({ title: language === 'vi' ? 'Đã xóa hạng khách thành công' : 'Customer tier deleted successfully' });
    },
  });

  const createStatusMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCrmStatusSchema>) => {
      return await apiRequest('POST', '/api/crm-statuses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-statuses'] });
      setIsStatusDialogOpen(false);
      statusForm.reset();
      toast({ title: language === 'vi' ? 'Đã tạo trạng thái thành công' : 'Status created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: language === 'vi' ? 'Lỗi tạo trạng thái' : 'Failed to create status', description: error.message, variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CrmStatus> & { id: string }) => {
      return await apiRequest('PUT', `/api/crm-statuses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-statuses'] });
      setIsStatusDialogOpen(false);
      setEditingStatus(null);
      statusForm.reset();
      toast({ title: language === 'vi' ? 'Đã cập nhật trạng thái thành công' : 'Status updated successfully' });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/crm-statuses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-statuses'] });
      toast({ title: language === 'vi' ? 'Đã xóa trạng thái thành công' : 'Status deleted successfully' });
    },
  });

  const bpCategoryForm = useForm<z.infer<typeof insertBpCategorySchema>>({
    resolver: zodResolver(insertBpCategorySchema),
    defaultValues: {
      value: "",
      labelEn: "",
      labelVi: "",
      order: 0,
      active: true,
    },
  });

  const createBpCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertBpCategorySchema>) => {
      return await apiRequest('POST', '/api/bp-categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-categories'] });
      setIsBpCategoryDialogOpen(false);
      bpCategoryForm.reset();
      toast({ title: language === 'vi' ? 'Đã tạo hạng mục thành công' : 'Category created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: language === 'vi' ? 'Lỗi tạo hạng mục' : 'Failed to create category', description: error.message, variant: 'destructive' });
    },
  });

  const updateBpCategoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BpCategory> & { id: string }) => {
      return await apiRequest('PUT', `/api/bp-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-categories'] });
      setIsBpCategoryDialogOpen(false);
      setEditingBpCategory(null);
      bpCategoryForm.reset();
      toast({ title: language === 'vi' ? 'Đã cập nhật hạng mục thành công' : 'Category updated successfully' });
    },
  });

  const deleteBpCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/bp-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-categories'] });
      toast({ title: language === 'vi' ? 'Đã xóa hạng mục thành công' : 'Category deleted successfully' });
    },
  });

  const bpStatusForm = useForm<z.infer<typeof insertBpStatusSchema>>({
    resolver: zodResolver(insertBpStatusSchema),
    defaultValues: {
      value: "",
      labelEn: "",
      labelVi: "",
      order: 0,
      active: true,
    },
  });

  const createBpStatusMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertBpStatusSchema>) => {
      return await apiRequest('POST', '/api/bp-statuses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-statuses'] });
      setIsBpStatusDialogOpen(false);
      bpStatusForm.reset();
      toast({ title: language === 'vi' ? 'Đã tạo trạng thái ĐT thành công' : 'BP Status created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: language === 'vi' ? 'Lỗi tạo trạng thái' : 'Failed to create status', description: error.message, variant: 'destructive' });
    },
  });

  const updateBpStatusMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BpStatus> & { id: string }) => {
      return await apiRequest('PUT', `/api/bp-statuses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-statuses'] });
      setIsBpStatusDialogOpen(false);
      setEditingBpStatus(null);
      bpStatusForm.reset();
      toast({ title: language === 'vi' ? 'Đã cập nhật trạng thái ĐT thành công' : 'BP Status updated successfully' });
    },
  });

  const deleteBpStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/bp-statuses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-statuses'] });
      toast({ title: language === 'vi' ? 'Đã xóa trạng thái ĐT thành công' : 'BP Status deleted successfully' });
    },
  });

  const bpTierForm = useForm<z.infer<typeof insertBpTierSchema>>({
    resolver: zodResolver(insertBpTierSchema),
    defaultValues: {
      value: "",
      labelEn: "",
      labelVi: "",
      order: 0,
      active: true,
    },
  });

  const createBpTierMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertBpTierSchema>) => {
      return await apiRequest('POST', '/api/bp-tiers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-tiers'] });
      setIsBpTierDialogOpen(false);
      bpTierForm.reset();
      toast({ title: language === 'vi' ? 'Đã tạo hạng đối tác thành công' : 'BP Tier created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: language === 'vi' ? 'Lỗi tạo danh mục' : 'Failed to create tier', description: error.message, variant: 'destructive' });
    },
  });

  const updateBpTierMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BpTier> & { id: string }) => {
      return await apiRequest('PUT', `/api/bp-tiers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-tiers'] });
      setIsBpTierDialogOpen(false);
      setEditingBpTier(null);
      bpTierForm.reset();
      toast({ title: language === 'vi' ? 'Đã cập nhật hạng đối tác thành công' : 'BP Tier updated successfully' });
    },
  });

  const deleteBpTierMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/bp-tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bp-tiers'] });
      toast({ title: language === 'vi' ? 'Đã xóa hạng đối tác thành công' : 'BP Tier deleted successfully' });
    },
  });

  const toValue = (label: string) => {
    const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `${base}_${Date.now().toString(36)}`;
  };

  const handleStageSubmit = (data: z.infer<typeof insertCrmPipelineStageSchema>) => {
    const submitData = { ...data, value: editingStage ? data.value : toValue(data.labelEn) };
    if (editingStage) {
      updateStageMutation.mutate({ id: editingStage.id, ...submitData });
    } else {
      createStageMutation.mutate(submitData);
    }
  };

  const handleTierSubmit = (data: z.infer<typeof insertCrmCustomerTierSchema>) => {
    const submitData = { ...data, value: editingTier ? data.value : toValue(data.labelEn) };
    if (editingTier) {
      updateTierMutation.mutate({ id: editingTier.id, ...submitData });
    } else {
      createTierMutation.mutate(submitData);
    }
  };

  const handleStatusSubmit = (data: z.infer<typeof insertCrmStatusSchema>) => {
    const submitData = { ...data, value: editingStatus ? data.value : toValue(data.labelEn) };
    if (editingStatus) {
      updateStatusMutation.mutate({ id: editingStatus.id, ...submitData });
    } else {
      createStatusMutation.mutate(submitData);
    }
  };

  const handleBpCategorySubmit = (data: z.infer<typeof insertBpCategorySchema>) => {
    const submitData = { ...data, value: editingBpCategory ? data.value : toValue(data.labelEn) };
    if (editingBpCategory) {
      updateBpCategoryMutation.mutate({ id: editingBpCategory.id, ...submitData });
    } else {
      createBpCategoryMutation.mutate(submitData);
    }
  };

  const handleBpStatusSubmit = (data: z.infer<typeof insertBpStatusSchema>) => {
    const submitData = { ...data, value: editingBpStatus ? data.value : toValue(data.labelEn) };
    if (editingBpStatus) {
      updateBpStatusMutation.mutate({ id: editingBpStatus.id, ...submitData });
    } else {
      createBpStatusMutation.mutate(submitData);
    }
  };

  const handleBpTierSubmit = (data: z.infer<typeof insertBpTierSchema>) => {
    const submitData = { ...data, value: editingBpTier ? data.value : toValue(data.labelEn) };
    if (editingBpTier) {
      updateBpTierMutation.mutate({ id: editingBpTier.id, ...submitData });
    } else {
      createBpTierMutation.mutate(submitData);
    }
  };

  return (
    <div>
      <Tabs defaultValue={context === 'bp' ? 'bpTiers' : 'tiers'} className="w-full">
              <TabsList className={`grid w-full bg-black border border-white/10 ${context === 'all' ? 'grid-cols-6' : 'grid-cols-3'}`}>
                {context !== 'bp' && <TabsTrigger value="tiers">{language === 'vi' ? 'Hạng Khách' : 'Client Tiers'}</TabsTrigger>}
                {context !== 'client' && <TabsTrigger value="bpTiers">{language === 'vi' ? 'Danh Mục' : 'Tiers'}</TabsTrigger>}
                {context !== 'bp' && <TabsTrigger value="stages">{language === 'vi' ? 'Giai Đoạn' : 'Stages'}</TabsTrigger>}
                {context !== 'client' && <TabsTrigger value="bpCategories">{language === 'vi' ? 'Hạng Mục' : 'Categories'}</TabsTrigger>}
                {context !== 'bp' && <TabsTrigger value="statuses">{language === 'vi' ? 'Trạng Thái' : 'Statuses'}</TabsTrigger>}
                {context !== 'client' && <TabsTrigger value="bpStatuses">{language === 'vi' ? 'Trạng Thái' : 'Statuses'}</TabsTrigger>}
              </TabsList>

              {/* Pipeline Stages (Client) */}
              <TabsContent value="stages" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingStage(null);
                          stageForm.reset({
                            value: "",
                            labelEn: "",
                            labelVi: "",
                            order: stages.length,
                            active: true,
                          });
                        }}
                        data-testid="button-add-stage"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'vi' ? 'Thêm' : 'Add Stage'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingStage ? (language === 'vi' ? 'Sửa Giai Đoạn' : 'Edit Stage') : (language === 'vi' ? 'Thêm Giai Đoạn' : 'Add Stage')}</DialogTitle>
                      </DialogHeader>
                      <Form {...stageForm}>
                        <form onSubmit={stageForm.handleSubmit(handleStageSubmit)} className="space-y-4">
                          <FormField
                            control={stageForm.control}
                            name="labelEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Lead" data-testid="input-stage-label-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={stageForm.control}
                            name="labelVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Khách tiềm năng" data-testid="input-stage-label-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={stageForm.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Thứ tự' : 'Order'}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-stage-order"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsStageDialogOpen(false);
                                setEditingStage(null);
                                stageForm.reset();
                              }}
                            >
                              {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </Button>
                            <Button type="submit" data-testid="button-submit-stage">
                              {editingStage ? (language === 'vi' ? 'Cập Nhật' : 'Update') : (language === 'vi' ? 'Tạo' : 'Create')}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stages.sort((a, b) => a.order - b.order).map((stage) => (
                      <TableRow key={stage.id} data-testid={`row-stage-${stage.id}`}>
                        <TableCell>{stage.labelEn}</TableCell>
                        <TableCell>{stage.labelVi}</TableCell>
                        <TableCell>{stage.order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingStage(stage);
                                stageForm.reset(stage);
                                setIsStageDialogOpen(true);
                              }}
                              data-testid={`button-edit-stage-${stage.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-delete-stage-${stage.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Giai Đoạn' : 'Delete Stage'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? 'Bạn có chắc chắn muốn xóa giai đoạn này? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this stage? This action cannot be undone.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteStageMutation.mutate(stage.id)}
                                    data-testid={`button-confirm-delete-stage-${stage.id}`}
                                  >
                                    {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* BP Categories */}
              <TabsContent value="bpCategories" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Dialog open={isBpCategoryDialogOpen} onOpenChange={setIsBpCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingBpCategory(null);
                          bpCategoryForm.reset({
                            value: "",
                            labelEn: "",
                            labelVi: "",
                            order: bpCategories.length,
                            active: true,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'vi' ? 'Thêm' : 'Add Category'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingBpCategory ? (language === 'vi' ? 'Sửa Hạng Mục' : 'Edit Category') : (language === 'vi' ? 'Thêm Hạng Mục' : 'Add Category')}</DialogTitle>
                      </DialogHeader>
                      <Form {...bpCategoryForm}>
                        <form onSubmit={bpCategoryForm.handleSubmit(handleBpCategorySubmit)} className="space-y-4">
                          <FormField
                            control={bpCategoryForm.control}
                            name="labelEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Wood" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bpCategoryForm.control}
                            name="labelVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Gỗ" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bpCategoryForm.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Thứ tự' : 'Order'}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsBpCategoryDialogOpen(false);
                                setEditingBpCategory(null);
                                bpCategoryForm.reset();
                              }}
                            >
                              {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </Button>
                            <Button type="submit">
                              {editingBpCategory ? (language === 'vi' ? 'Cập Nhật' : 'Update') : (language === 'vi' ? 'Tạo' : 'Create')}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bpCategories.sort((a, b) => a.order - b.order).map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.labelEn}</TableCell>
                        <TableCell>{cat.labelVi}</TableCell>
                        <TableCell>{cat.order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingBpCategory(cat);
                                bpCategoryForm.reset(cat);
                                setIsBpCategoryDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Hạng Mục' : 'Delete Category'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? 'Bạn có chắc chắn muốn xóa hạng mục này? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this category? This action cannot be undone.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteBpCategoryMutation.mutate(cat.id)}>
                                    {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Customer Tiers */}
              <TabsContent value="tiers" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingTier(null);
                          tierForm.reset({
                            value: "",
                            labelEn: "",
                            labelVi: "",
                            order: tiers.length,
                            active: true,
                          });
                        }}
                        data-testid="button-add-tier"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'vi' ? 'Thêm' : 'Add Tier'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingTier ? (language === 'vi' ? 'Sửa Hạng Khách' : 'Edit Client Tier') : (language === 'vi' ? 'Thêm Hạng Khách' : 'Add Client Tier')}</DialogTitle>
                      </DialogHeader>
                      <Form {...tierForm}>
                        <form onSubmit={tierForm.handleSubmit(handleTierSubmit)} className="space-y-4">
                          <FormField
                            control={tierForm.control}
                            name="labelEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="VIP" data-testid="input-tier-label-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={tierForm.control}
                            name="labelVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="VIP" data-testid="input-tier-label-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={tierForm.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Thứ tự' : 'Order'}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-tier-order"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsTierDialogOpen(false);
                                setEditingTier(null);
                                tierForm.reset();
                              }}
                            >
                              {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </Button>
                            <Button type="submit" data-testid="button-submit-tier">
                              {editingTier ? (language === 'vi' ? 'Cập Nhật' : 'Update') : (language === 'vi' ? 'Tạo' : 'Create')}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.sort((a, b) => a.order - b.order).map((tier) => (
                      <TableRow key={tier.id} data-testid={`row-tier-${tier.id}`}>
                        <TableCell>{tier.labelEn}</TableCell>
                        <TableCell>{tier.labelVi}</TableCell>
                        <TableCell>{tier.order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTier(tier);
                                tierForm.reset(tier);
                                setIsTierDialogOpen(true);
                              }}
                              data-testid={`button-edit-tier-${tier.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-delete-tier-${tier.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Hạng Khách' : 'Delete Client Tier'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? 'Bạn có chắc chắn muốn xóa hạng khách này? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this client tier? This action cannot be undone.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTierMutation.mutate(tier.id)}
                                    data-testid={`button-confirm-delete-tier-${tier.id}`}
                                  >
                                    {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* BP Tiers */}
              <TabsContent value="bpTiers" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Dialog open={isBpTierDialogOpen} onOpenChange={setIsBpTierDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingBpTier(null);
                          bpTierForm.reset({
                            value: "",
                            labelEn: "",
                            labelVi: "",
                            order: bpTiers.length,
                            active: true,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'vi' ? 'Thêm' : 'Add Tier'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingBpTier ? (language === 'vi' ? 'Sửa Hạng Đối Tác' : 'Edit BP Tier') : (language === 'vi' ? 'Thêm Hạng Đối Tác' : 'Add BP Tier')}</DialogTitle>
                      </DialogHeader>
                      <Form {...bpTierForm}>
                        <form onSubmit={bpTierForm.handleSubmit(handleBpTierSubmit)} className="space-y-4">
                          <FormField
                            control={bpTierForm.control}
                            name="labelEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="VIP" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bpTierForm.control}
                            name="labelVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="VIP" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bpTierForm.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Thứ tự' : 'Order'}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsBpTierDialogOpen(false);
                                setEditingBpTier(null);
                                bpTierForm.reset();
                              }}
                            >
                              {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </Button>
                            <Button type="submit">
                              {editingBpTier ? (language === 'vi' ? 'Cập Nhật' : 'Update') : (language === 'vi' ? 'Tạo' : 'Create')}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bpTiers.sort((a, b) => a.order - b.order).map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell>{tier.labelEn}</TableCell>
                        <TableCell>{tier.labelVi}</TableCell>
                        <TableCell>{tier.order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingBpTier(tier);
                                bpTierForm.reset(tier);
                                setIsBpTierDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Hạng Đối Tác' : 'Delete BP Tier'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? 'Bạn có chắc chắn muốn xóa hạng đối tác này? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this BP tier? This action cannot be undone.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteBpTierMutation.mutate(tier.id)}>
                                    {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Statuses */}
              <TabsContent value="statuses" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingStatus(null);
                          statusForm.reset({
                            value: "",
                            labelEn: "",
                            labelVi: "",
                            order: statuses.length,
                            active: true,
                          });
                        }}
                        data-testid="button-add-status"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'vi' ? 'Thêm' : 'Add Status'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingStatus ? (language === 'vi' ? 'Sửa Trạng Thái' : 'Edit Status') : (language === 'vi' ? 'Thêm Trạng Thái' : 'Add Status')}</DialogTitle>
                      </DialogHeader>
                      <Form {...statusForm}>
                        <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)} className="space-y-4">
                          <FormField
                            control={statusForm.control}
                            name="labelEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Active" data-testid="input-status-label-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statusForm.control}
                            name="labelVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Hoạt động" data-testid="input-status-label-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statusForm.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Thứ tự' : 'Order'}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-status-order"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsStatusDialogOpen(false);
                                setEditingStatus(null);
                                statusForm.reset();
                              }}
                            >
                              {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </Button>
                            <Button type="submit" data-testid="button-submit-status">
                              {editingStatus ? (language === 'vi' ? 'Cập Nhật' : 'Update') : (language === 'vi' ? 'Tạo' : 'Create')}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statuses.sort((a, b) => a.order - b.order).map((status) => (
                      <TableRow key={status.id} data-testid={`row-status-${status.id}`}>
                        <TableCell>{status.labelEn}</TableCell>
                        <TableCell>{status.labelVi}</TableCell>
                        <TableCell>{status.order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingStatus(status);
                                statusForm.reset(status);
                                setIsStatusDialogOpen(true);
                              }}
                              data-testid={`button-edit-status-${status.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-delete-status-${status.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Trạng Thái' : 'Delete Status'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? 'Bạn có chắc chắn muốn xóa trạng thái này? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this status? This action cannot be undone.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteStatusMutation.mutate(status.id)}
                                    data-testid={`button-confirm-delete-status-${status.id}`}
                                  >
                                    {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* BP Statuses */}
              <TabsContent value="bpStatuses" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Dialog open={isBpStatusDialogOpen} onOpenChange={setIsBpStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingBpStatus(null);
                          bpStatusForm.reset({
                            value: "",
                            labelEn: "",
                            labelVi: "",
                            order: bpStatuses.length,
                            active: true,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'vi' ? 'Thêm' : 'Add Status'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingBpStatus ? (language === 'vi' ? 'Sửa Trạng Thái ĐT' : 'Edit BP Status') : (language === 'vi' ? 'Thêm Trạng Thái ĐT' : 'Add BP Status')}</DialogTitle>
                      </DialogHeader>
                      <Form {...bpStatusForm}>
                        <form onSubmit={bpStatusForm.handleSubmit(handleBpStatusSubmit)} className="space-y-4">
                          <FormField
                            control={bpStatusForm.control}
                            name="labelEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Active" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bpStatusForm.control}
                            name="labelVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Hoạt động" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bpStatusForm.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Thứ tự' : 'Order'}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsBpStatusDialogOpen(false);
                                setEditingBpStatus(null);
                                bpStatusForm.reset();
                              }}
                            >
                              {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </Button>
                            <Button type="submit">
                              {editingBpStatus ? (language === 'vi' ? 'Cập Nhật' : 'Update') : (language === 'vi' ? 'Tạo' : 'Create')}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bpStatuses.sort((a, b) => a.order - b.order).map((bpStatus) => (
                      <TableRow key={bpStatus.id}>
                        <TableCell>{bpStatus.labelEn}</TableCell>
                        <TableCell>{bpStatus.labelVi}</TableCell>
                        <TableCell>{bpStatus.order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingBpStatus(bpStatus);
                                bpStatusForm.reset(bpStatus);
                                setIsBpStatusDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Trạng Thái ĐT' : 'Delete BP Status'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? 'Bạn có chắc chắn muốn xóa trạng thái này? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this status? This action cannot be undone.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteBpStatusMutation.mutate(bpStatus.id)}>
                                    {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
    </div>
  );
}
