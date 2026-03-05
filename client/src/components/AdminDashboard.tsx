import { useState, useEffect, lazy, Suspense } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Eye, Plus, Lock, Search } from "lucide-react";
import type { Inquiry, HomepageContent, Partner, AboutPageContent, AboutCoreValue, AboutShowcaseService, AboutProcessStep, AboutTeamMember, AboutAward, InsertAboutPageContent, InsertAboutCoreValue, InsertAboutShowcaseService, InsertAboutProcessStep, InsertAboutTeamMember, InsertAboutAward, Settings as SettingsType } from "@shared/schema";
import { insertAboutPageContentSchema, insertAboutCoreValueSchema, insertAboutShowcaseServiceSchema, insertAboutProcessStepSchema, insertAboutTeamMemberSchema, insertAboutAwardSchema } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import AboutAdminTab from "@/components/AboutAdminTab";
import LookupAdminTab from "@/components/LookupAdminTab";

const AdminProjectsTab = lazy(() => import("@/components/admin/AdminProjectsTab"));
const AdminClientsTab = lazy(() => import("@/components/admin/AdminClientsTab"));
const AdminBusinessPartnersTab = lazy(() => import("@/components/admin/AdminBusinessPartnersTab"));
const AdminArticlesTab = lazy(() => import("@/components/admin/AdminArticlesTab"));
const AdminHomepageTab = lazy(() => import("@/components/admin/AdminHomepageTab"));
const AdminUsersTab = lazy(() => import("@/components/admin/AdminUsersTab"));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

const partnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional(),
});

const seoSettingsSchema = z.object({
  siteTitle: z.string().optional(),
  siteTitleVi: z.string().optional(),
  metaDescription: z.string().optional(),
  metaDescriptionVi: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaKeywordsVi: z.string().optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;
type SeoSettingsFormData = z.infer<typeof seoSettingsSchema>;

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

interface AdminDashboardProps {
  activeTab: string;
  user: any;
  hasPermission: (user: any, permission: string) => boolean;
}

export default function AdminDashboard({ activeTab, user, hasPermission }: AdminDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null);
  const [partnerLogoPreview, setPartnerLogoPreview] = useState<string>('');
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [inquiriesPage, setInquiriesPage] = useState(1);
  const inquiriesPerPage = 10;

  const [showcaseBannerFile, setShowcaseBannerFile] = useState<File | null>(null);
  const [showcaseBannerPreview, setShowcaseBannerPreview] = useState<string>('');
  const [historyImageFile, setHistoryImageFile] = useState<File | null>(null);
  const [historyImagePreview, setHistoryImagePreview] = useState<string>('');
  const [missionImageFile, setMissionImageFile] = useState<File | null>(null);
  const [missionImagePreview, setMissionImagePreview] = useState<string>('');
  const [missionVisionImageFile, setMissionVisionImageFile] = useState<File | null>(null);
  const [missionVisionImagePreview, setMissionVisionImagePreview] = useState<string>('');
  const [teamMemberImageFile, setTeamMemberImageFile] = useState<File | null>(null);
  const [teamMemberImagePreview, setTeamMemberImagePreview] = useState<string>('');
  const [isPrincipleDialogOpen, setIsPrincipleDialogOpen] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<AboutCoreValue | null>(null);
  const [isShowcaseServiceDialogOpen, setIsShowcaseServiceDialogOpen] = useState(false);
  const [editingShowcaseService, setEditingShowcaseService] = useState<AboutShowcaseService | null>(null);
  const [isProcessStepDialogOpen, setIsProcessStepDialogOpen] = useState(false);
  const [editingProcessStep, setEditingProcessStep] = useState<AboutProcessStep | null>(null);
  const [isTeamMemberDialogOpen, setIsTeamMemberDialogOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<AboutTeamMember | null>(null);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<AboutAward | null>(null);
  const [awardImagePreview, setAwardImagePreview] = useState<string>('');

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalProjects: number;
    activeClients: number;
    newInquiries: number;
    revenue: string;
  }>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries'],
  });

  const { data: partners = [], isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<SettingsType>({
    queryKey: ['/api/settings'],
  });

  const { data: aboutContent, isLoading: aboutContentLoading } = useQuery<AboutPageContent>({
    queryKey: ['/api/about-page-content'],
  });

  const { data: aboutPrinciples = [], isLoading: aboutPrinciplesLoading } = useQuery<AboutCoreValue[]>({
    queryKey: ['/api/about-core-values'],
  });

  const { data: aboutShowcaseServices = [], isLoading: aboutShowcaseServicesLoading } = useQuery<AboutShowcaseService[]>({
    queryKey: ['/api/about-showcase-services'],
  });

  const { data: aboutProcessSteps = [], isLoading: aboutProcessStepsLoading } = useQuery<AboutProcessStep[]>({
    queryKey: ['/api/about-process-steps'],
  });

  const { data: aboutTeamMembers = [], isLoading: aboutTeamMembersLoading } = useQuery<AboutTeamMember[]>({
    queryKey: ['/api/about-team-members'],
  });

  const { data: aboutAwards = [], isLoading: aboutAwardsLoading } = useQuery<AboutAward[]>({
    queryKey: ['/api/about-awards'],
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: businessPartners = [], isLoading: businessPartnersLoading } = useQuery<any[]>({
    queryKey: ['/api/business-partners'],
  });

  const partnerForm = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      logo: "",
    },
  });

  const seoSettingsForm = useForm<SeoSettingsFormData>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues: {
      siteTitle: "",
      siteTitleVi: "",
      metaDescription: "",
      metaDescriptionVi: "",
      metaKeywords: "",
      metaKeywordsVi: "",
    },
  });

  useEffect(() => {
    if (settings) {
      seoSettingsForm.reset({
        siteTitle: settings.siteTitle || "",
        siteTitleVi: settings.siteTitleVi || "",
        metaDescription: settings.metaDescription || "",
        metaDescriptionVi: settings.metaDescriptionVi || "",
        metaKeywords: settings.metaKeywords || "",
        metaKeywordsVi: settings.metaKeywordsVi || "",
      });
    }
  }, [settings, seoSettingsForm]);

  const aboutContentForm = useForm<InsertAboutPageContent>({
    resolver: zodResolver(insertAboutPageContentSchema),
    defaultValues: aboutContent || {
      heroTitleEn: "",
      heroTitleVi: "",
      heroSubtitleEn: "",
      heroSubtitleVi: "",
      principlesTitleEn: "",
      principlesTitleVi: "",
      showcaseBannerImage: "",
      statsProjectsValue: "",
      statsProjectsLabelEn: "",
      statsProjectsLabelVi: "",
      statsAwardsValue: "",
      statsAwardsLabelEn: "",
      statsAwardsLabelVi: "",
      statsClientsValue: "",
      statsClientsLabelEn: "",
      statsClientsLabelVi: "",
      statsCountriesValue: "",
      statsCountriesLabelEn: "",
      statsCountriesLabelVi: "",
      processTitleEn: "",
      processTitleVi: "",
      ctaBannerTitleEn: "",
      ctaBannerTitleVi: "",
    },
  });

  const principleForm = useForm<InsertAboutCoreValue>({
    resolver: zodResolver(insertAboutCoreValueSchema),
    defaultValues: {
      icon: "",
      titleEn: "",
      titleVi: "",
      descriptionEn: "",
      descriptionVi: "",
      order: 0,
    },
  });

  const showcaseServiceForm = useForm<InsertAboutShowcaseService>({
    resolver: zodResolver(insertAboutShowcaseServiceSchema),
    defaultValues: {
      titleEn: "",
      titleVi: "",
      descriptionEn: "",
      descriptionVi: "",
      order: 0,
    },
  });

  const processStepForm = useForm<InsertAboutProcessStep>({
    resolver: zodResolver(insertAboutProcessStepSchema),
    defaultValues: {
      stepNumber: "",
      titleEn: "",
      titleVi: "",
      descriptionEn: "",
      descriptionVi: "",
      order: 0,
    },
  });

  const teamMemberForm = useForm<InsertAboutTeamMember>({
    resolver: zodResolver(insertAboutTeamMemberSchema),
    defaultValues: {
      name: "",
      positionEn: "",
      positionVi: "",
      bioEn: "",
      bioVi: "",
      achievementsEn: "",
      achievementsVi: "",
      philosophyEn: "",
      philosophyVi: "",
      image: "",
      order: 0,
    },
  });

  const awardForm = useForm<InsertAboutAward>({
    resolver: zodResolver(insertAboutAwardSchema),
    defaultValues: {
      titleEn: "",
      titleVi: "",
      year: "",
      organizationEn: "",
      organizationVi: "",
      image: "",
      order: 0,
    },
  });

  useEffect(() => {
    if (aboutContent && !aboutContentForm.formState.isDirty) {
      aboutContentForm.reset(aboutContent);
    }
  }, [aboutContent, aboutContentForm]);

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/inquiries/${id}`, { status });
      return response.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/inquiries'] });
      const previousInquiries = queryClient.getQueryData(['/api/inquiries']);
      queryClient.setQueryData(['/api/inquiries'], (old: any[]) =>
        old.map((inquiry) =>
          inquiry.id === id ? { ...inquiry, status } : inquiry
        )
      );
      return { previousInquiries };
    },
    onError: (err: any, variables, context) => {
      queryClient.setQueryData(['/api/inquiries'], context?.previousInquiries);
      toast({ title: "Lỗi khi cập nhật yêu cầu", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: "Đã xóa yêu cầu thành công" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi xóa yêu cầu", description: error.message, variant: "destructive" });
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const response = await apiRequest('POST', '/api/partners', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      toast({ title: "Đã tạo đối tác thành công" });
      partnerForm.reset();
      setIsPartnerDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi tạo đối tác", description: error.message, variant: "destructive" });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PartnerFormData> }) => {
      const response = await apiRequest('PUT', `/api/partners/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      toast({ title: "Đã cập nhật đối tác thành công" });
      setEditingPartner(null);
      setIsPartnerDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi cập nhật đối tác", description: error.message, variant: "destructive" });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      toast({ title: "Đã xóa đối tác thành công" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi xóa đối tác", description: error.message, variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', '/api/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({ title: language === 'vi' ? "Lỗi" : "Error", description: language === 'vi' ? "Không thể cập nhật cài đặt" : "Failed to update settings", variant: "destructive" });
    }
  });

  const updateAboutContentMutation = useMutation({
    mutationFn: async (data: InsertAboutPageContent) => {
      const response = await apiRequest('PUT', '/api/about-content', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-page-content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/about-core-values'] });
      queryClient.invalidateQueries({ queryKey: ['/api/about-showcase-services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/about-process-steps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/about-team-members'] });
      aboutContentForm.reset(data);
      setShowcaseBannerFile(null);
      setShowcaseBannerPreview('');
      toast({ title: "Đã cập nhật nội dung giới thiệu thành công" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi cập nhật nội dung giới thiệu", description: error.message, variant: "destructive" });
    },
  });

  const createPrincipleMutation = useMutation({
    mutationFn: async (data: InsertAboutCoreValue) => {
      const response = await apiRequest('POST', '/api/about-core-values', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-core-values'] });
      toast({ title: "Đã tạo giá trị cốt lõi thành công" });
      setIsPrincipleDialogOpen(false);
      principleForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi tạo giá trị cốt lõi", description: error.message, variant: "destructive" });
    },
  });

  const updatePrincipleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAboutCoreValue> }) => {
      const response = await apiRequest('PUT', `/api/about-core-values/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-core-values'] });
      toast({ title: "Đã cập nhật giá trị cốt lõi thành công" });
      setIsPrincipleDialogOpen(false);
      setEditingPrinciple(null);
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi cập nhật giá trị cốt lõi", description: error.message, variant: "destructive" });
    },
  });

  const deletePrincipleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/about-core-values/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-core-values'] });
      toast({ title: "Đã xóa giá trị cốt lõi thành công" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi xóa giá trị cốt lõi", description: error.message, variant: "destructive" });
    },
  });

  const createShowcaseServiceMutation = useMutation({
    mutationFn: async (data: InsertAboutShowcaseService) => {
      const response = await apiRequest('POST', '/api/about-showcase-services', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-showcase-services'] });
      toast({ title: "Đã tạo dịch vụ thành công" });
      setIsShowcaseServiceDialogOpen(false);
      showcaseServiceForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi tạo dịch vụ", description: error.message, variant: "destructive" });
    },
  });

  const updateShowcaseServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAboutShowcaseService> }) => {
      const response = await apiRequest('PUT', `/api/about-showcase-services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-showcase-services'] });
      toast({ title: "Đã cập nhật dịch vụ thành công" });
      setIsShowcaseServiceDialogOpen(false);
      setEditingShowcaseService(null);
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi cập nhật dịch vụ", description: error.message, variant: "destructive" });
    },
  });

  const deleteShowcaseServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/about-showcase-services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-showcase-services'] });
      toast({ title: "Đã xóa dịch vụ thành công" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi xóa dịch vụ", description: error.message, variant: "destructive" });
    },
  });

  const createProcessStepMutation = useMutation({
    mutationFn: async (data: InsertAboutProcessStep) => {
      const response = await apiRequest('POST', '/api/about-process-steps', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-process-steps'] });
      toast({ title: "Đã tạo quy trình thành công" });
      setIsProcessStepDialogOpen(false);
      processStepForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi tạo quy trình", description: error.message, variant: "destructive" });
    },
  });

  const updateProcessStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAboutProcessStep> }) => {
      const response = await apiRequest('PUT', `/api/about-process-steps/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-process-steps'] });
      toast({ title: "Đã cập nhật quy trình thành công" });
      setIsProcessStepDialogOpen(false);
      setEditingProcessStep(null);
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi cập nhật quy trình", description: error.message, variant: "destructive" });
    },
  });

  const deleteProcessStepMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/about-process-steps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-process-steps'] });
      toast({ title: "Đã xóa quy trình thành công" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi xóa quy trình", description: error.message, variant: "destructive" });
    },
  });

  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: InsertAboutTeamMember) => {
      const response = await apiRequest('POST', '/api/about-team-members', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-team-members'] });
      toast({ title: "Đã tạo thành viên thành công" });
      setIsTeamMemberDialogOpen(false);
      teamMemberForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi tạo thành viên", description: error.message, variant: "destructive" });
    },
  });

  const updateTeamMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAboutTeamMember> }) => {
      const response = await apiRequest('PUT', `/api/about-team-members/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-team-members'] });
      toast({ title: "Đã cập nhật thành viên thành công" });
      setIsTeamMemberDialogOpen(false);
      setEditingTeamMember(null);
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi cập nhật thành viên", description: error.message, variant: "destructive" });
    },
  });

  const deleteTeamMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/about-team-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-team-members'] });
      toast({ title: "Đã xóa thành viên thành công" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi xóa thành viên", description: error.message, variant: "destructive" });
    },
  });

  const createAwardMutation = useMutation({
    mutationFn: async (data: InsertAboutAward) => {
      const response = await apiRequest('POST', '/api/about-awards', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-awards'] });
      toast({ title: "Đã tạo giải thưởng thành công" });
      setIsAwardDialogOpen(false);
      awardForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi tạo giải thưởng", description: error.message, variant: "destructive" });
    },
  });

  const updateAwardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAboutAward> }) => {
      const response = await apiRequest('PUT', `/api/about-awards/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-awards'] });
      toast({ title: "Đã cập nhật giải thưởng thành công" });
      setIsAwardDialogOpen(false);
      setEditingAward(null);
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi cập nhật giải thưởng", description: error.message, variant: "destructive" });
    },
  });

  const deleteAwardMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/about-awards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about-awards'] });
      toast({ title: "Đã xóa giải thưởng thành công" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi khi xóa giải thưởng", description: error.message, variant: "destructive" });
    },
  });

  const handlePartnerLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      if (file.size > maxSizeBytes) {
        toast({ title: "File too large", description: `File size: ${fileSizeMB}MB. Maximum: ${maxSizeMB}MB.`, variant: "destructive" });
        e.target.value = '';
        return;
      }
      setPartnerLogoFile(file);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        setPartnerLogoPreview(data.path);
        toast({ title: "Upload successful", description: "Logo uploaded" });
      } catch (error) {
        toast({ title: "Lỗi upload", description: "Failed to upload image", variant: "destructive" });
        e.target.value = '';
      }
    }
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    partnerForm.reset({ name: partner.name, logo: partner.logo || "" });
    if (partner.logoData) {
      setPartnerLogoPreview(partner.logoData);
    } else {
      setPartnerLogoPreview('');
    }
    setIsPartnerDialogOpen(true);
  };

  const onPartnerSubmit = async (data: PartnerFormData) => {
    try {
      const partnerData: any = { name: data.name, order: 0, active: true };
      if (partnerLogoPreview) {
        partnerData.logoData = partnerLogoPreview;
        partnerData.logo = "";
      } else if (data.logo) {
        partnerData.logo = data.logo;
      }
      if (editingPartner) {
        await updatePartnerMutation.mutateAsync({ id: editingPartner.id, data: partnerData });
      } else {
        await createPartnerMutation.mutateAsync(partnerData);
      }
      setPartnerLogoFile(null);
      setPartnerLogoPreview('');
    } catch (error) {}
  };

  const onSeoSettingsSubmit = async (data: SeoSettingsFormData) => {
    try {
      const existingSettings = settings || {};
      await updateSettingsMutation.mutateAsync({
        ...existingSettings,
        siteTitle: data.siteTitle,
        siteTitleVi: data.siteTitleVi,
        metaDescription: data.metaDescription,
        metaDescriptionVi: data.metaDescriptionVi,
        metaKeywords: data.metaKeywords,
        metaKeywordsVi: data.metaKeywordsVi,
      });
      toast({ title: language === 'vi' ? "Thành công" : "Success", description: language === 'vi' ? "Đã lưu cài đặt SEO" : "SEO settings saved successfully" });
    } catch (error) {}
  };

  const handleShowcaseBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast({ title: "File too large", description: `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 10MB.`, variant: "destructive" });
        e.target.value = '';
        return;
      }
      setShowcaseBannerFile(file);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        setShowcaseBannerPreview(data.path);
        toast({ title: "Upload successful", description: "Banner image uploaded" });
      } catch (error) {
        toast({ title: "Lỗi upload", description: "Failed to upload image", variant: "destructive" });
        e.target.value = '';
      }
    }
  };

  const handleHistoryImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast({ title: "File too large", description: `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 10MB.`, variant: "destructive" });
        e.target.value = '';
        return;
      }
      setHistoryImageFile(file);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        setHistoryImagePreview(data.path);
        toast({ title: "Upload successful", description: "History image uploaded" });
      } catch (error) {
        toast({ title: "Lỗi upload", description: "Failed to upload image", variant: "destructive" });
        e.target.value = '';
      }
    }
  };

  const handleMissionImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast({ title: "File too large", description: `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 10MB.`, variant: "destructive" });
        e.target.value = '';
        return;
      }
      setMissionImageFile(file);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        setMissionImagePreview(data.path);
        toast({ title: "Upload successful", description: "Mission image uploaded" });
      } catch (error) {
        toast({ title: "Lỗi upload", description: "Failed to upload image", variant: "destructive" });
        e.target.value = '';
      }
    }
  };

  const handleMissionVisionImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast({ title: "File too large", description: `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 10MB.`, variant: "destructive" });
        e.target.value = '';
        return;
      }
      setMissionVisionImageFile(file);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        setMissionVisionImagePreview(data.path);
        toast({ title: "Upload successful", description: "Mission vision image uploaded" });
      } catch (error) {
        toast({ title: "Lỗi upload", description: "Failed to upload image", variant: "destructive" });
        e.target.value = '';
      }
    }
  };

  const handleTeamMemberImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast({ title: "File too large", description: `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 10MB.`, variant: "destructive" });
        e.target.value = '';
        return;
      }
      setTeamMemberImageFile(file);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        setTeamMemberImagePreview(data.path);
        toast({ title: "Upload successful", description: "Team member image uploaded" });
      } catch (error) {
        toast({ title: "Lỗi upload", description: "Failed to upload image", variant: "destructive" });
        e.target.value = '';
      }
    }
  };

  const onAboutContentSubmit = async (data: InsertAboutPageContent) => {
    try {
      const submitData = { ...data };
      if (showcaseBannerPreview) {
        submitData.showcaseBannerImage = showcaseBannerPreview;
        submitData.showcaseBannerImageData = null;
      }
      if (historyImagePreview) {
        submitData.historyImage = historyImagePreview;
      }
      if (missionImagePreview) {
        submitData.missionImage = missionImagePreview;
        submitData.missionImageData = null;
      }
      if (missionVisionImagePreview) {
        submitData.missionVisionImage = missionVisionImagePreview;
        submitData.missionVisionImageData = null;
      }
      await updateAboutContentMutation.mutateAsync(submitData);
    } catch (error) {}
  };

  const onPrincipleSubmit = async (data: InsertAboutCoreValue) => {
    try {
      if (editingPrinciple) {
        await updatePrincipleMutation.mutateAsync({ id: editingPrinciple.id, data });
      } else {
        await createPrincipleMutation.mutateAsync(data);
      }
    } catch (error) {}
  };

  const onShowcaseServiceSubmit = async (data: InsertAboutShowcaseService) => {
    try {
      if (editingShowcaseService) {
        await updateShowcaseServiceMutation.mutateAsync({ id: editingShowcaseService.id, data });
      } else {
        await createShowcaseServiceMutation.mutateAsync(data);
      }
    } catch (error) {}
  };

  const onProcessStepSubmit = async (data: InsertAboutProcessStep) => {
    try {
      if (editingProcessStep) {
        await updateProcessStepMutation.mutateAsync({ id: editingProcessStep.id, data });
      } else {
        await createProcessStepMutation.mutateAsync(data);
      }
    } catch (error) {}
  };

  const onTeamMemberSubmit = async (data: InsertAboutTeamMember) => {
    try {
      const submitData = { ...data };
      if (teamMemberImagePreview) {
        submitData.image = teamMemberImagePreview;
        submitData.imageData = null;
      }
      if (editingTeamMember) {
        await updateTeamMemberMutation.mutateAsync({ id: editingTeamMember.id, data: submitData });
      } else {
        await createTeamMemberMutation.mutateAsync(submitData);
      }
      setTeamMemberImagePreview('');
      setTeamMemberImageFile(null);
    } catch (error) {}
  };

  const handleAwardImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast({ title: "File too large", description: `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 10MB.`, variant: "destructive" });
        e.target.value = '';
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        setAwardImagePreview(data.path);
        toast({ title: "Upload successful", description: "Award image uploaded" });
      } catch (error) {
        toast({ title: "Lỗi upload", description: "Failed to upload image", variant: "destructive" });
        e.target.value = '';
      }
    }
  };

  const onAwardSubmit = async (data: InsertAboutAward) => {
    try {
      const submitData = { ...data };
      if (awardImagePreview) {
        submitData.image = awardImagePreview;
        submitData.imageData = null;
      }
      if (editingAward) {
        await updateAwardMutation.mutateAsync({ id: editingAward.id, data: submitData });
      } else {
        await createAwardMutation.mutateAsync(submitData);
      }
      setAwardImagePreview('');
    } catch (error) {}
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (activeTab === 'overview') {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Tổng Dự Án' : 'Total Projects'}</p>
                <p className="text-2xl font-semibold" data-testid="stat-total-projects">
                  {statsLoading ? "..." : stats?.totalProjects || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Tổng Đối Tác' : 'Total Partners'}</p>
                <p className="text-2xl font-semibold" data-testid="stat-total-partners">
                  {businessPartnersLoading ? "..." : businessPartners.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Tổng Khách Hàng' : 'Total Clients'}</p>
                <p className="text-2xl font-semibold" data-testid="stat-active-clients">
                  {clientsLoading ? "..." : clients.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Yêu Cầu Mới' : 'New Inquiries'}</p>
                <p className="text-2xl font-semibold" data-testid="stat-new-inquiries">
                  {inquiriesLoading ? "..." : inquiries.filter(i => i.status === 'new').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div>
                <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Tổng Doanh Thu' : 'Total Revenue'}</p>
                <p className="text-2xl font-semibold" data-testid="stat-revenue">
                  {statsLoading ? "..." : stats?.revenue || "0 ₫"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{language === 'vi' ? 'Hoạt Động Gần Đây' : 'Recent Activity'}</CardTitle>
          </CardHeader>
          <CardContent>
            {inquiriesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/20 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-64" />
                      <div className="h-3 bg-muted rounded w-32" />
                    </div>
                    <div className="h-8 bg-muted rounded w-16" />
                  </div>
                ))}
              </div>
            ) : inquiries.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">{language === 'vi' ? 'Chưa có hoạt động nào' : 'No recent activity'}</p>
            ) : (
              <div className="space-y-4">
                {[...inquiries].filter(i => i.status === 'new').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((inquiry) => (
                  <div key={inquiry.id} className="flex items-center justify-between py-3 border-b border-white/20">
                    <div>
                      <p className="font-light">
                        {language === 'vi' ? 'Yêu cầu mới từ' : 'New inquiry from'} {inquiry.firstName} {inquiry.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(inquiry.createdAt)} {inquiry.projectType ? ` ${inquiry.projectType}` : ''}
                      </p>
                      {(inquiry.phone || inquiry.email) && (
                        <p className="text-sm text-muted-foreground">
                          {inquiry.phone}{inquiry.phone && inquiry.email ? ' - ' : ''}{inquiry.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'projects') {
    return <Suspense fallback={<TabLoader />}><AdminProjectsTab user={user} hasPermission={hasPermission} /></Suspense>;
  }

  if (activeTab === 'clients') {
    return <Suspense fallback={<TabLoader />}><AdminClientsTab user={user} hasPermission={hasPermission} /></Suspense>;
  }

  if (activeTab === 'business-partners') {
    return <Suspense fallback={<TabLoader />}><AdminBusinessPartnersTab user={user} hasPermission={hasPermission} /></Suspense>;
  }

  if (activeTab === 'inquiries') {
    if (!hasPermission(user, 'inquiries')) {
      return <PermissionDenied feature="Inquiries" />;
    }
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Yêu Cầu' : 'Inquiry Management'}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={inquirySearchQuery}
              onChange={(e) => { setInquirySearchQuery(e.target.value); setInquiriesPage(1); }}
              placeholder={language === 'vi' ? 'Chúng tôi có thể giúp bạn tìm gì?' : 'What can we help you find?'}
              className="pl-10 bg-transparent border-0 border-b border-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/60 placeholder:text-white/40"
            />
          </div>
          <Select value={inquiryStatusFilter} onValueChange={(val) => { setInquiryStatusFilter(val); setInquiriesPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] flex-shrink-0 bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
              <SelectValue placeholder={language === 'vi' ? 'Tất Cả' : 'All'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'vi' ? 'Tất Cả' : 'All'}</SelectItem>
              <SelectItem value="new">{language === 'vi' ? 'Mới' : 'New'}</SelectItem>
              <SelectItem value="contacted">{language === 'vi' ? 'Đã Liên Hệ' : 'Contacted'}</SelectItem>
              <SelectItem value="converted">{language === 'vi' ? 'Đã Chuyển Đổi' : 'Converted'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            {inquiriesLoading ? (
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
            ) : inquiries.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-lg font-light mb-2">{language === 'vi' ? 'Không có yêu cầu nào' : 'No inquiries found'}</h3>
                <p className="text-muted-foreground">{language === 'vi' ? 'Yêu cầu mới sẽ hiển thị ở đây khi được gửi.' : 'New inquiries will appear here when submitted.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table className="min-w-[750px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] whitespace-nowrap text-center">{language === 'vi' ? 'STT' : 'NO'}</TableHead>
                    <TableHead className="w-[200px] whitespace-nowrap">
                      <div>
                        <span>{language === 'vi' ? 'Họ Tên' : 'Full Name'}</span>
                        <p className="text-xs font-normal text-muted-foreground">{language === 'vi' ? 'Ngày Tiếp Nhận' : 'Received Date'}</p>
                      </div>
                    </TableHead>
                    <TableHead className="w-[180px] whitespace-nowrap">
                      <div>
                        <span>{language === 'vi' ? 'Số Điện Thoại' : 'Phone'}</span>
                        <p className="text-xs font-normal text-muted-foreground">Email</p>
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] whitespace-nowrap">{language === 'vi' ? 'Loại Dự Án' : 'Project Type'}</TableHead>
                    <TableHead className="w-[140px] text-right whitespace-nowrap">{language === 'vi' ? 'Trạng Thái' : 'Status'}</TableHead>
                    <TableHead className="w-[100px] text-right whitespace-nowrap"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filtered = inquiries.filter(inquiry => {
                      if (inquiryStatusFilter !== 'all' && inquiry.status !== inquiryStatusFilter) return false;
                      if (!inquirySearchQuery) return true;
                      const searchLower = inquirySearchQuery.toLowerCase();
                      return (
                        (`${inquiry.firstName} ${inquiry.lastName}`).toLowerCase().includes(searchLower) ||
                        (inquiry.email || '').toLowerCase().includes(searchLower) ||
                        (inquiry.projectType || '').toLowerCase().includes(searchLower) ||
                        (inquiry.budget || '').toLowerCase().includes(searchLower) ||
                        (inquiry.message || '').toLowerCase().includes(searchLower)
                      );
                    });
                    const inquiriesTotalPages = Math.ceil(filtered.length / inquiriesPerPage);
                    const inquiriesStartIdx = (inquiriesPage - 1) * inquiriesPerPage;
                    const inquiriesEndIdx = inquiriesStartIdx + inquiriesPerPage;
                    const paginated = filtered.slice(inquiriesStartIdx, inquiriesEndIdx);
                    return paginated.map((inquiry, idx) => (
                    <TableRow key={inquiry.id} data-testid={`row-inquiry-${inquiry.id}`}>
                      <TableCell className="text-center">{inquiriesStartIdx + idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-light">{inquiry.firstName} {inquiry.lastName}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(inquiry.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-light">{inquiry.phone || "—"}</p>
                          <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{inquiry.projectType || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={inquiry.status}
                          onValueChange={(value) => updateInquiryMutation.mutate({ id: inquiry.id, status: value })}
                        >
                          <SelectTrigger className="w-32 ml-auto" data-testid={`select-inquiry-status-${inquiry.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {inquiry.status === "new" && <SelectItem value="new">{language === 'vi' ? 'Mới' : 'New'}</SelectItem>}
                            <SelectItem value="contacted">{language === 'vi' ? 'Đã Liên Hệ' : 'Contacted'}</SelectItem>
                            <SelectItem value="converted">{language === 'vi' ? 'Đã Chuyển Đổi' : 'Converted'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" data-testid={`button-view-inquiry-${inquiry.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{language === 'vi' ? 'Chi Tiết Yêu Cầu' : 'Inquiry Details'}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-light mb-1">{language === 'vi' ? 'Thông Tin Liên Hệ' : 'Contact Information'}</h4>
                                  <p>{inquiry.firstName} {inquiry.lastName}</p>
                                  <p className="text-muted-foreground">{inquiry.email}</p>
                                  {inquiry.phone && <p className="text-muted-foreground">{inquiry.phone}</p>}
                                </div>
                                <div>
                                  <h4 className="font-light mb-1">{language === 'vi' ? 'Chi Tiết Dự Án' : 'Project Details'}</h4>
                                  <p>{language === 'vi' ? 'Loại:' : 'Type:'} {inquiry.projectType || "—"}</p>
                                </div>
                                <div>
                                  <h4 className="font-light mb-1">{language === 'vi' ? 'Tin Nhắn' : 'Message'}</h4>
                                  <p className="text-muted-foreground">{inquiry.message}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" data-testid={`button-delete-inquiry-${inquiry.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-none">
                              <AlertDialogHeader>
                                <AlertDialogTitle>{language === 'vi' ? 'Xóa Yêu Cầu' : 'Delete Inquiry'}</AlertDialogTitle>
                                <AlertDialogDescription className="text-white/70">
                                  {language === 'vi' ? 'Bạn có chắc chắn muốn xóa yêu cầu từ' : 'Are you sure you want to delete this inquiry from'} <strong className="text-white">{inquiry.firstName} {inquiry.lastName}</strong>?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none">
                                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteInquiryMutation.mutate(inquiry.id)}
                                  className="rounded-none"
                                  disabled={deleteInquiryMutation.isPending}
                                >
                                  {deleteInquiryMutation.isPending ? (language === 'vi' ? 'Đang xóa...' : 'Deleting...') : (language === 'vi' ? 'Xóa' : 'Delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ));
                  })()}
                </TableBody>
              </Table>
              </div>
            )}
            {(() => {
              const filtered = inquiries.filter(inquiry => {
                if (inquiryStatusFilter !== 'all' && inquiry.status !== inquiryStatusFilter) return false;
                if (!inquirySearchQuery) return true;
                const searchLower = inquirySearchQuery.toLowerCase();
                return (
                  (`${inquiry.firstName} ${inquiry.lastName}`).toLowerCase().includes(searchLower) ||
                  (inquiry.email || '').toLowerCase().includes(searchLower) ||
                  (inquiry.projectType || '').toLowerCase().includes(searchLower) ||
                  (inquiry.budget || '').toLowerCase().includes(searchLower) ||
                  (inquiry.message || '').toLowerCase().includes(searchLower)
                );
              });
              const inquiriesTotalPages = Math.ceil(filtered.length / inquiriesPerPage);
              const inquiriesStartIdx = (inquiriesPage - 1) * inquiriesPerPage;
              const inquiriesEndIdx = inquiriesStartIdx + inquiriesPerPage;
              if (filtered.length === 0) return null;
              return (
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setInquiriesPage(1)} disabled={inquiriesPage === 1} className="text-xs min-w-[60px]">
                      {language === 'vi' ? 'ĐẦU' : 'FIRST'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setInquiriesPage(prev => Math.max(1, prev - 1))} disabled={inquiriesPage === 1} className="text-xs min-w-[60px]">
                      {language === 'vi' ? 'TRƯỚC' : 'PREV'}
                    </Button>
                    {Array.from({ length: inquiriesTotalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={inquiriesPage === page ? "default" : "ghost"} size="sm" onClick={() => setInquiriesPage(page)} className="text-xs min-w-[32px] border-0">
                        {page}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setInquiriesPage(prev => Math.min(inquiriesTotalPages, prev + 1))} disabled={inquiriesPage === inquiriesTotalPages} className="text-xs min-w-[60px]">
                      {language === 'vi' ? 'SAU' : 'NEXT'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setInquiriesPage(inquiriesTotalPages)} disabled={inquiriesPage === inquiriesTotalPages} className="text-xs min-w-[60px]">
                      {language === 'vi' ? 'CUỐI' : 'LAST'}
                    </Button>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {language === 'vi' ? `Hiển thị ${inquiriesStartIdx + 1}-${Math.min(inquiriesEndIdx, filtered.length)} / ${filtered.length} yêu cầu` : `Showing ${inquiriesStartIdx + 1}-${Math.min(inquiriesEndIdx, filtered.length)} of ${filtered.length} inquiries`}
                    </span>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'about') {
    if (!hasPermission(user, 'about')) {
      return <PermissionDenied feature="About Page" />;
    }
    return (
      <div className="p-6">
        <AboutAdminTab
          aboutContent={aboutContent}
          aboutPrinciples={aboutPrinciples}
          aboutShowcaseServices={aboutShowcaseServices}
          aboutProcessSteps={aboutProcessSteps}
          aboutTeamMembers={aboutTeamMembers}
          aboutContentLoading={aboutContentLoading}
          aboutPrinciplesLoading={aboutPrinciplesLoading}
          aboutShowcaseServicesLoading={aboutShowcaseServicesLoading}
          aboutProcessStepsLoading={aboutProcessStepsLoading}
          aboutTeamMembersLoading={aboutTeamMembersLoading}
          onAboutContentSubmit={onAboutContentSubmit}
          onPrincipleSubmit={onPrincipleSubmit}
          onShowcaseServiceSubmit={onShowcaseServiceSubmit}
          onProcessStepSubmit={onProcessStepSubmit}
          onTeamMemberSubmit={onTeamMemberSubmit}
          updatePrincipleMutation={updatePrincipleMutation}
          deletePrincipleMutation={deletePrincipleMutation}
          updateShowcaseServiceMutation={updateShowcaseServiceMutation}
          deleteShowcaseServiceMutation={deleteShowcaseServiceMutation}
          updateProcessStepMutation={updateProcessStepMutation}
          deleteProcessStepMutation={deleteProcessStepMutation}
          updateTeamMemberMutation={updateTeamMemberMutation}
          deleteTeamMemberMutation={deleteTeamMemberMutation}
          updateAboutContentMutation={updateAboutContentMutation}
          showcaseBannerFile={showcaseBannerFile}
          showcaseBannerPreview={showcaseBannerPreview}
          handleShowcaseBannerFileChange={handleShowcaseBannerFileChange}
          historyImageFile={historyImageFile}
          historyImagePreview={historyImagePreview}
          handleHistoryImageFileChange={handleHistoryImageFileChange}
          missionImageFile={missionImageFile}
          missionImagePreview={missionImagePreview}
          handleMissionImageFileChange={handleMissionImageFileChange}
          missionVisionImageFile={missionVisionImageFile}
          missionVisionImagePreview={missionVisionImagePreview}
          handleMissionVisionImageFileChange={handleMissionVisionImageFileChange}
          teamMemberImagePreview={teamMemberImagePreview}
          setTeamMemberImagePreview={setTeamMemberImagePreview}
          handleTeamMemberImageChange={handleTeamMemberImageChange}
          isTeamMemberDialogOpen={isTeamMemberDialogOpen}
          setIsTeamMemberDialogOpen={setIsTeamMemberDialogOpen}
          editingTeamMember={editingTeamMember}
          setEditingTeamMember={setEditingTeamMember}
          teamMemberForm={teamMemberForm}
          aboutAwards={aboutAwards}
          aboutAwardsLoading={aboutAwardsLoading}
          onAwardSubmit={onAwardSubmit}
          updateAwardMutation={updateAwardMutation}
          deleteAwardMutation={deleteAwardMutation}
          awardImagePreview={awardImagePreview}
          setAwardImagePreview={setAwardImagePreview}
          handleAwardImageChange={handleAwardImageChange}
          isAwardDialogOpen={isAwardDialogOpen}
          setIsAwardDialogOpen={setIsAwardDialogOpen}
          editingAward={editingAward}
          setEditingAward={setEditingAward}
          awardForm={awardForm}
          hasPermission={(perm) => hasPermission(user, perm)}
        />
      </div>
    );
  }

  if (activeTab === 'content') {
    if (!hasPermission(user, 'content')) {
      return <PermissionDenied feature="Content / Services" />;
    }
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Nội Dung' : 'Content Management'}</h2>
        <Form {...seoSettingsForm}>
          <form onSubmit={seoSettingsForm.handleSubmit(onSeoSettingsSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'vi' ? 'Cài Đặt SEO' : 'SEO Settings'}</CardTitle>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={seoSettingsForm.control} name="siteTitle" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề Website (EN)' : 'Site Title (EN)'}</FormLabel>
                          <FormControl><Input {...field} placeholder="IEVRA Design & Build - Interior Design" data-testid="input-site-title-en" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={seoSettingsForm.control} name="siteTitleVi" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề Website (VI)' : 'Site Title (VI)'}</FormLabel>
                          <FormControl><Input {...field} placeholder="IEVRA Design & Build - Thiết Kế Nội Thất" data-testid="input-site-title-vi" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={seoSettingsForm.control} name="metaDescription" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Mô Tả Meta (EN)' : 'Meta Description (EN)'}</FormLabel>
                          <FormControl><Textarea {...field} rows={3} placeholder="Premium interior design and architecture services..." data-testid="textarea-meta-description-en" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={seoSettingsForm.control} name="metaDescriptionVi" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Mô Tả Meta (VI)' : 'Meta Description (VI)'}</FormLabel>
                          <FormControl><Textarea {...field} rows={3} placeholder="Dịch vụ thiết kế nội thất và kiến trúc cao cấp..." data-testid="textarea-meta-description-vi" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={seoSettingsForm.control} name="metaKeywords" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Từ Khóa Meta (EN)' : 'Meta Keywords (EN)'}</FormLabel>
                          <FormControl><Input {...field} placeholder="interior design, architecture, modern home..." data-testid="input-meta-keywords-en" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={seoSettingsForm.control} name="metaKeywordsVi" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Từ Khóa Meta (VI)' : 'Meta Keywords (VI)'}</FormLabel>
                          <FormControl><Input {...field} placeholder="thiết kế nội thất, kiến trúc, nhà hiện đại..." data-testid="input-meta-keywords-vi" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <Button type="submit" disabled={updateSettingsMutation.isPending} data-testid="button-save-seo">
                      {updateSettingsMutation.isPending ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu Cài Đặt SEO' : 'Save SEO Settings')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    );
  }

  if (activeTab === 'homepage') {
    return <Suspense fallback={<TabLoader />}><AdminHomepageTab user={user} hasPermission={hasPermission} /></Suspense>;
  }

  if (activeTab === 'articles') {
    return <Suspense fallback={<TabLoader />}><AdminArticlesTab user={user} hasPermission={hasPermission} /></Suspense>;
  }

  if (activeTab === 'partners') {
    if (!hasPermission(user, 'partners')) {
      return <PermissionDenied feature="Partners" />;
    }
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-sans font-light">Partners Management</h2>
            <p className="text-sm text-white/50 mt-1">
              {partners.length} / 24 partners • Maximum 24 partners allowed
            </p>
          </div>
          <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={(e) => {
                  if (partners.length >= 24) {
                    e.preventDefault();
                    toast({ title: "Maximum partners reached", description: "You have reached the maximum limit of 24 partners.", variant: "destructive" });
                    return;
                  }
                  setEditingPartner(null);
                  partnerForm.reset({ name: "", logo: "" });
                  setPartnerLogoPreview('');
                  setIsPartnerDialogOpen(true);
                }}
                disabled={partners.length >= 24}
                data-testid="button-add-partner"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPartner ? "Edit Partner" : "Add New Partner"}</DialogTitle>
              </DialogHeader>
              <Form {...partnerForm}>
                <form onSubmit={partnerForm.handleSubmit(onPartnerSubmit)} className="space-y-6">
                  <FormField control={partnerForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner Name *</FormLabel>
                      <FormControl><Input {...field} placeholder="Enter partner name" data-testid="input-partner-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Upload Logo (PNG, JPG only)</label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handlePartnerLogoFileChange}
                        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-white/30 file:text-sm file:font-medium file:bg-transparent file:text-white hover:file:bg-white/10 hover:file:border-white cursor-pointer"
                        data-testid="input-partner-logo-file"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Định dạng: PNG, JPG • Giới hạn: 10MB • Khuyến nghị: 500x200px</p>
                      {(partnerLogoPreview || editingPartner?.logoData || editingPartner?.logo) && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Preview:</p>
                          <div className="border rounded p-4 bg-muted flex items-center justify-center">
                            <img src={partnerLogoPreview || editingPartner?.logoData || editingPartner?.logo || ''} alt="Partner Logo Preview" className="h-24 object-contain" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or use URL</span></div>
                    </div>
                    <FormField control={partnerForm.control} name="logo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl><Input {...field} placeholder="https://example.com/logo.png" data-testid="input-partner-logo" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" disabled={createPartnerMutation.isPending || updatePartnerMutation.isPending} className="w-full" data-testid="button-submit-partner">
                    {editingPartner ? "Update Partner" : "Add Partner"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader><CardTitle>Partners</CardTitle></CardHeader>
          <CardContent>
            {partnersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-32" />
                      <div className="h-3 bg-muted rounded animate-pulse w-24" />
                    </div>
                    <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="w-16 h-16 flex items-center justify-center bg-muted rounded p-2">
                          <img src={partner.logoData || partner.logo || ''} alt={partner.name} className="max-w-full max-h-full object-contain" data-testid={`img-partner-logo-${partner.id}`} />
                        </div>
                      </TableCell>
                      <TableCell className="font-light" data-testid={`text-partner-name-${partner.id}`}>{partner.name}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPartner(partner)} data-testid={`button-edit-partner-${partner.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-partner-${partner.id}`}>
                                <Trash2 className="h-4 w-4 text-white" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{language === 'vi' ? 'Xóa Đối Tác?' : 'Delete Partner?'}</AlertDialogTitle>
                                <AlertDialogDescription className="text-white/70">
                                  {language === 'vi'
                                    ? <>Thao tác này sẽ xóa vĩnh viễn <strong className="text-white">"{partner.name}"</strong>.<br /><span className="!text-red-400">Không thể hoàn tác.</span></>
                                    : <>This will permanently delete <strong className="text-white">"{partner.name}"</strong>.<br /><span className="!text-red-400">This action cannot be undone.</span></>
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePartnerMutation.mutate(partner.id)} className="rounded-none">
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
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'users') {
    return <Suspense fallback={<TabLoader />}><AdminUsersTab user={user} hasPermission={hasPermission} /></Suspense>;
  }

  if (activeTab === 'lookup') {
    if (!hasPermission(user, 'lookup')) {
      return <PermissionDenied feature="Tra Cứu / Lookup" />;
    }
    return <LookupAdminTab />;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-muted-foreground">{language === 'vi' ? 'Chọn tab để xem nội dung' : 'Select a tab to view content'}</p>
    </div>
  );
}
