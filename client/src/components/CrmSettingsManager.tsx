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
import type { CrmPipelineStage, CrmCustomerTier, CrmStatus } from "@shared/schema";
import { insertCrmPipelineStageSchema, insertCrmCustomerTierSchema, insertCrmStatusSchema } from "@shared/schema";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CrmSettingsManager() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  
  const [editingStage, setEditingStage] = useState<CrmPipelineStage | null>(null);
  const [editingTier, setEditingTier] = useState<CrmCustomerTier | null>(null);
  const [editingStatus, setEditingStatus] = useState<CrmStatus | null>(null);

  const { data: stages = [] } = useQuery<CrmPipelineStage[]>({ queryKey: ['/api/crm-pipeline-stages'] });
  const { data: tiers = [] } = useQuery<CrmCustomerTier[]>({ queryKey: ['/api/crm-customer-tiers'] });
  const { data: statuses = [] } = useQuery<CrmStatus[]>({ queryKey: ['/api/crm-statuses'] });

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

  const handleStageSubmit = (data: z.infer<typeof insertCrmPipelineStageSchema>) => {
    if (editingStage) {
      updateStageMutation.mutate({ id: editingStage.id, ...data });
    } else {
      createStageMutation.mutate(data);
    }
  };

  const handleTierSubmit = (data: z.infer<typeof insertCrmCustomerTierSchema>) => {
    if (editingTier) {
      updateTierMutation.mutate({ id: editingTier.id, ...data });
    } else {
      createTierMutation.mutate(data);
    }
  };

  const handleStatusSubmit = (data: z.infer<typeof insertCrmStatusSchema>) => {
    if (editingStatus) {
      updateStatusMutation.mutate({ id: editingStatus.id, ...data });
    } else {
      createStatusMutation.mutate(data);
    }
  };

  return (
    <div>
      <Tabs defaultValue="stages" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black border border-white/10">
                <TabsTrigger value="stages">{language === 'vi' ? 'Giai Đoạn' : 'Pipeline Stages'}</TabsTrigger>
                <TabsTrigger value="tiers">{language === 'vi' ? 'Hạng Khách' : 'Customer Tiers'}</TabsTrigger>
                <TabsTrigger value="statuses">{language === 'vi' ? 'Trạng Thái' : 'Statuses'}</TabsTrigger>
              </TabsList>

              {/* Pipeline Stages */}
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
                        <DialogTitle>{editingStage ? (language === 'vi' ? 'Sửa Giai Đoạn' : 'Edit Pipeline Stage') : (language === 'vi' ? 'Thêm Giai Đoạn' : 'Add Pipeline Stage')}</DialogTitle>
                      </DialogHeader>
                      <Form {...stageForm}>
                        <form onSubmit={stageForm.handleSubmit(handleStageSubmit)} className="space-y-4">
                          <FormField
                            control={stageForm.control}
                            name="value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Giá trị (ID nội bộ)' : 'Value (Internal ID)'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="lead" data-testid="input-stage-value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                      <TableHead>{language === 'vi' ? 'Giá trị' : 'Value'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Kích hoạt' : 'Active'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stages.sort((a, b) => a.order - b.order).map((stage) => (
                      <TableRow key={stage.id} data-testid={`row-stage-${stage.id}`}>
                        <TableCell>{stage.value}</TableCell>
                        <TableCell>{stage.labelEn}</TableCell>
                        <TableCell>{stage.labelVi}</TableCell>
                        <TableCell>{stage.order}</TableCell>
                        <TableCell>
                          <Badge variant={stage.active ? "default" : "secondary"}>
                            {stage.active ? (language === 'vi' ? 'Hoạt động' : 'Active') : (language === 'vi' ? 'Tắt' : 'Inactive')}
                          </Badge>
                        </TableCell>
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
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Giai Đoạn' : 'Delete Pipeline Stage'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? 'Bạn có chắc chắn muốn xóa giai đoạn này? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this pipeline stage? This action cannot be undone.'}
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
                        <DialogTitle>{editingTier ? (language === 'vi' ? 'Sửa Hạng Khách' : 'Edit Customer Tier') : (language === 'vi' ? 'Thêm Hạng Khách' : 'Add Customer Tier')}</DialogTitle>
                      </DialogHeader>
                      <Form {...tierForm}>
                        <form onSubmit={tierForm.handleSubmit(handleTierSubmit)} className="space-y-4">
                          <FormField
                            control={tierForm.control}
                            name="value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Giá trị (ID nội bộ)' : 'Value (Internal ID)'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="vip" data-testid="input-tier-value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                      <TableHead>{language === 'vi' ? 'Giá trị' : 'Value'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Kích hoạt' : 'Active'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.sort((a, b) => a.order - b.order).map((tier) => (
                      <TableRow key={tier.id} data-testid={`row-tier-${tier.id}`}>
                        <TableCell>{tier.value}</TableCell>
                        <TableCell>{tier.labelEn}</TableCell>
                        <TableCell>{tier.labelVi}</TableCell>
                        <TableCell>{tier.order}</TableCell>
                        <TableCell>
                          <Badge variant={tier.active ? "default" : "secondary"}>
                            {tier.active ? (language === 'vi' ? 'Hoạt động' : 'Active') : (language === 'vi' ? 'Tắt' : 'Inactive')}
                          </Badge>
                        </TableCell>
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
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Hạng Khách' : 'Delete Customer Tier'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? 'Bạn có chắc chắn muốn xóa hạng khách này? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this customer tier? This action cannot be undone.'}
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
                            name="value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'vi' ? 'Giá trị (ID nội bộ)' : 'Value (Internal ID)'}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="active" data-testid="input-status-value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                      <TableHead>{language === 'vi' ? 'Giá trị' : 'Value'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Anh' : 'English Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Nhãn Tiếng Việt' : 'Vietnamese Label'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Thứ tự' : 'Order'}</TableHead>
                      <TableHead>{language === 'vi' ? 'Kích hoạt' : 'Active'}</TableHead>
                      <TableHead className="text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statuses.sort((a, b) => a.order - b.order).map((status) => (
                      <TableRow key={status.id} data-testid={`row-status-${status.id}`}>
                        <TableCell>{status.value}</TableCell>
                        <TableCell>{status.labelEn}</TableCell>
                        <TableCell>{status.labelVi}</TableCell>
                        <TableCell>{status.order}</TableCell>
                        <TableCell>
                          <Badge variant={status.active ? "default" : "secondary"}>
                            {status.active ? (language === 'vi' ? 'Hoạt động' : 'Active') : (language === 'vi' ? 'Tắt' : 'Inactive')}
                          </Badge>
                        </TableCell>
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
            </Tabs>
    </div>
  );
}
