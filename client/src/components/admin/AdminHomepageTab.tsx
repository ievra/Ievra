import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Plus, Lock } from "lucide-react";
import type { HomepageContent, Partner, Faq, JourneyStep } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

const homepageContentSchema = z.object({
  language: z.string().default("en"),
  heroBackgroundImage: z.string().optional(),
  heroTitle: z.string().min(1, "Hero title is required"),
  heroStudio: z.string().min(1, "Studio text is required"),
  heroTagline: z.string().optional(),
  heroArchitectureLabel: z.string().optional(),
  heroInteriorLabel: z.string().optional(),
  heroConsultationText: z.string().optional(),
  featuredBadge: z.string().optional(),
  featuredBadgeVi: z.string().optional(),
  featuredTitle: z.string().optional(),
  featuredDescription: z.string().optional(),
  featuredDescriptionVi: z.string().optional(),
  statsProjectsLabel: z.string().optional(),
  statsClientsLabel: z.string().optional(),
  statsAwardsLabel: z.string().optional(),
  statsExperienceLabel: z.string().optional(),
  journeyTitle: z.string().optional(),
  journeyTitleVi: z.string().optional(),
  journeyDescription: z.string().optional(),
  journeyDescriptionVi: z.string().optional(),
  advantagesTitle: z.string().optional(),
  advantagesTitleVi: z.string().optional(),
  advantagesSubtitle: z.string().optional(),
  advantagesSubtitleVi: z.string().optional(),
  faqSectionTitle: z.string().optional(),
  faqSectionTitleVi: z.string().optional(),
  faqSectionSubtitle: z.string().optional(),
  faqSectionSubtitleVi: z.string().optional(),
  partnersTitle: z.string().optional(),
  partnersTitleVi: z.string().optional(),
  partnersSubtitle: z.string().optional(),
  partnersSubtitleVi: z.string().optional(),
  featuredNewsTitle: z.string().optional(),
  featuredNewsTitleVi: z.string().optional(),
  featuredNewsSubtitle: z.string().optional(),
  featuredNewsSubtitleVi: z.string().optional(),
  ctaSubtitle: z.string().optional(),
  ctaSubtitleVi: z.string().optional(),
  qualityBackgroundImage: z.string().optional(),
  qualityLeftText: z.string().optional(),
  qualityRightText: z.string().optional(),
  quality2BackgroundImage: z.string().optional(),
  quality2LeftText: z.string().optional(),
  quality2RightText: z.string().optional(),
  ctaTitle: z.string().optional(),
  ctaDescription: z.string().optional(),
  ctaButtonText: z.string().optional(),
  ctaSecondaryButtonText: z.string().optional(),
});

const partnerSchema = z.object({
  name: z.string().min(1, "Partner name is required"),
  logo: z.string().optional(),
});

const bilingualFaqSchema = z.object({
  questionEn: z.string().min(1, "English question is required"),
  questionVi: z.string().min(1, "Vietnamese question is required"),
  answerEn: z.string().min(1, "English answer is required"),
  answerVi: z.string().min(1, "Vietnamese answer is required"),
  page: z.string().min(1, "Page is required"),
});

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  page: z.string().min(1, "Page is required"),
  language: z.string().default("en"),
  order: z.number().default(0),
  active: z.boolean().default(true),
});

const advantageSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  titleEn: z.string().min(1, "English title is required"),
  titleVi: z.string().min(1, "Vietnamese title is required"),
  descriptionEn: z.string().min(1, "English description is required"),
  descriptionVi: z.string().min(1, "Vietnamese description is required"),
  active: z.boolean().default(true),
});

const journeyStepSchema = z.object({
  stepNumber: z.number().min(1, "Step number is required"),
  titleEn: z.string().min(1, "English title is required"),
  titleVi: z.string().min(1, "Vietnamese title is required"),
  descriptionEn: z.string().min(1, "English description is required"),
  descriptionVi: z.string().min(1, "Vietnamese description is required"),
  active: z.boolean().default(true),
});

type HomepageContentFormData = z.infer<typeof homepageContentSchema>;
type PartnerFormData = z.infer<typeof partnerSchema>;
type FaqFormData = z.infer<typeof faqSchema>;
type BilingualFaqFormData = z.infer<typeof bilingualFaqSchema>;
type AdvantageFormData = z.infer<typeof advantageSchema>;
type JourneyStepFormData = z.infer<typeof journeyStepSchema>;

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

interface AdminHomepageTabProps {
  user: any;
  hasPermission: (user: any, permission: string) => boolean;
}

export default function AdminHomepageTab({ user, hasPermission }: AdminHomepageTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

  const [qualityBgFile, setQualityBgFile] = useState<File | null>(null);
  const [qualityBgPreview, setQualityBgPreview] = useState<string>('');
  const [quality2BgFile, setQuality2BgFile] = useState<File | null>(null);
  const [quality2BgPreview, setQuality2BgPreview] = useState<string>('');
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [isAdvantageDialogOpen, setIsAdvantageDialogOpen] = useState(false);
  const [editingAdvantage, setEditingAdvantage] = useState<any | null>(null);
  const [isJourneyStepDialogOpen, setIsJourneyStepDialogOpen] = useState(false);
  const [editingJourneyStep, setEditingJourneyStep] = useState<JourneyStep | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null);
  const [partnerLogoPreview, setPartnerLogoPreview] = useState<string>('');

  const { data: homepageContent, isLoading: homepageContentLoading } = useQuery<HomepageContent>({
    queryKey: ['/api/homepage-content', language],
    queryFn: async () => {
      const response = await fetch(`/api/homepage-content?language=${language}`);
      return response.json();
    },
  });

  const { data: partners = [], isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });

  const { data: faqs = [], isLoading: faqsLoading } = useQuery<Faq[]>({
    queryKey: ['/api/faqs'],
  });

  const { data: advantages = [], isLoading: advantagesLoading } = useQuery<any[]>({
    queryKey: ['/api/advantages'],
  });

  const { data: journeySteps = [], isLoading: journeyStepsLoading } = useQuery<JourneyStep[]>({
    queryKey: ['/api/journey-steps'],
  });

  const homepageContentForm = useForm<HomepageContentFormData>({
    resolver: zodResolver(homepageContentSchema),
    defaultValues: {
      language: language,
      heroTitle: "IEVRA Design & Build",
      heroStudio: "STUDIO",
      heroTagline: "",
      heroArchitectureLabel: "",
      heroInteriorLabel: "",
      heroConsultationText: "",
      featuredBadge: "",
      featuredBadgeVi: "",
      featuredTitle: "",
      featuredDescription: "",
      featuredDescriptionVi: "",
      featuredNewsTitle: "",
      featuredNewsTitleVi: "",
      featuredNewsSubtitle: "",
      featuredNewsSubtitleVi: "",
      journeyTitle: "",
      journeyTitleVi: "",
      journeyDescription: "",
      journeyDescriptionVi: "",
      advantagesTitle: "",
      advantagesTitleVi: "",
      advantagesSubtitle: "",
      advantagesSubtitleVi: "",
      faqSectionTitle: "",
      faqSectionTitleVi: "",
      faqSectionSubtitle: "",
      faqSectionSubtitleVi: "",
      partnersTitle: "",
      partnersTitleVi: "",
      partnersSubtitle: "",
      partnersSubtitleVi: "",
      ctaSubtitle: "",
      ctaSubtitleVi: "",
      statsProjectsLabel: "",
      statsClientsLabel: "",
      statsAwardsLabel: "",
      statsExperienceLabel: "",
      ctaTitle: "",
      ctaDescription: "",
      ctaButtonText: "",
      ctaSecondaryButtonText: "",
    },
  });

  const partnerForm = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      logo: "",
    },
  });

  const faqForm = useForm<BilingualFaqFormData>({
    resolver: zodResolver(bilingualFaqSchema),
    defaultValues: {
      questionEn: "",
      questionVi: "",
      answerEn: "",
      answerVi: "",
      page: "home",
    },
  });

  const advantageForm = useForm<AdvantageFormData>({
    resolver: zodResolver(advantageSchema),
    defaultValues: {
      icon: "",
      titleEn: "",
      titleVi: "",
      descriptionEn: "",
      descriptionVi: "",
      active: true,
    },
  });

  const journeyStepForm = useForm<JourneyStepFormData>({
    resolver: zodResolver(journeyStepSchema),
    defaultValues: {
      stepNumber: 1,
      titleEn: "",
      titleVi: "",
      descriptionEn: "",
      descriptionVi: "",
      active: true,
    },
  });

  useEffect(() => {
    if (homepageContent && !homepageContentForm.formState.isDirty) {
      const formData = {
        ...homepageContent,
        heroBackgroundImage: homepageContent.heroBackgroundImage || undefined,
        heroTagline: homepageContent.heroTagline || undefined,
        heroArchitectureLabel: homepageContent.heroArchitectureLabel || undefined,
        heroInteriorLabel: homepageContent.heroInteriorLabel || undefined,
        heroConsultationText: homepageContent.heroConsultationText || undefined,
        featuredBadge: homepageContent.featuredBadge || "FEATURED PROJECTS",
        featuredBadgeVi: homepageContent.featuredBadgeVi || "DỰ ÁN NỔI BẬT",
        featuredTitle: homepageContent.featuredTitle || undefined,
        featuredDescription: homepageContent.featuredDescription || "Discover our latest projects where innovation meets elegance.",
        featuredDescriptionVi: homepageContent.featuredDescriptionVi || "Khám phá các dự án mới nhất của chúng tôi nơi sự đổi mới gặp gỡ sự thanh lịch.",
        statsProjectsLabel: homepageContent.statsProjectsLabel || undefined,
        statsClientsLabel: homepageContent.statsClientsLabel || undefined,
        statsAwardsLabel: homepageContent.statsAwardsLabel || undefined,
        statsExperienceLabel: homepageContent.statsExperienceLabel || undefined,
        journeyTitle: homepageContent.journeyTitle || "THE JOURNEY TO YOUR DREAM SPACE",
        journeyTitleVi: homepageContent.journeyTitleVi || "HÀNH TRÌNH KIẾN TẠO KHÔNG GIAN SỐNG CỦA BẠN",
        journeyDescription: homepageContent.journeyDescription || "FROM CONCEPT TO REALITY, WE GUIDE YOU THROUGH A STREAMLINED, EFFICIENT, AND INSPIRING 5-STEP PROCESS.",
        journeyDescriptionVi: homepageContent.journeyDescriptionVi || "TỪ Ý TƯỞNG ĐẾN HIỆN THỰC, CHÚNG TÔI ĐỒNG HÀNH CÙNG BẠN QUA MỘT QUY TRÌNH 5 BƯỚC TINH GỌN, HIỆU QUẢ VÀ ĐẦY CẢM HỨNG.",
        advantagesTitle: homepageContent.advantagesTitle || "ADVANTAGES",
        advantagesTitleVi: homepageContent.advantagesTitleVi || "LỢI THẾ CẠNH TRANH",
        advantagesSubtitle: homepageContent.advantagesSubtitle || "Why Choose IEVRA Design & Build",
        advantagesSubtitleVi: homepageContent.advantagesSubtitleVi || "Tại sao chọn IEVRA Design & Build",
        faqSectionTitle: homepageContent.faqSectionTitle || "HAVE ANY QUESTIONS?",
        faqSectionTitleVi: homepageContent.faqSectionTitleVi || "CÓ THẮC MẮC GÌ KHÔNG?",
        faqSectionSubtitle: homepageContent.faqSectionSubtitle || "",
        faqSectionSubtitleVi: homepageContent.faqSectionSubtitleVi || "",
        partnersTitle: homepageContent.partnersTitle || "OUR PARTNERS",
        partnersTitleVi: homepageContent.partnersTitleVi || "ĐỐI TÁC CỦA CHÚNG TÔI",
        partnersSubtitle: homepageContent.partnersSubtitle || "",
        partnersSubtitleVi: homepageContent.partnersSubtitleVi || "",
        featuredNewsTitle: homepageContent.featuredNewsTitle || "FEATURED NEWS",
        featuredNewsTitleVi: homepageContent.featuredNewsTitleVi || "TIN TỨC NỔI BẬT",
        featuredNewsSubtitle: homepageContent.featuredNewsSubtitle || "Discover the latest design trends and expert insights from our professional team.",
        featuredNewsSubtitleVi: homepageContent.featuredNewsSubtitleVi || "Khám phá xu hướng thiết kế mới nhất và những hiểu biết chuyên sâu từ đội ngũ chuyên nghiệp của chúng tôi.",
        ctaSubtitle: homepageContent.ctaSubtitle || "Leave a request for a free consultation and we will contact you as soon as possible.",
        ctaSubtitleVi: homepageContent.ctaSubtitleVi || "Để lại yêu cầu tư vấn miễn phí và chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.",
        qualityBackgroundImage: homepageContent.qualityBackgroundImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
        qualityLeftText: homepageContent.qualityLeftText || "Each detail is selected so that the interior will serve for a long time and look impeccable.",
        qualityRightText: homepageContent.qualityRightText || "We use only high-quality materials and furniture from trusted manufacturers.",
        quality2BackgroundImage: homepageContent.quality2BackgroundImage || "/api/assets/stock_images/contemporary_bedroom_e9bd2ed1.jpg",
        quality2LeftText: homepageContent.quality2LeftText || "Each detail is selected so that the interior will serve for a long time and look impeccable.",
        quality2RightText: homepageContent.quality2RightText || "We use only high-quality materials and furniture from trusted manufacturers.",
        ctaTitle: homepageContent.ctaTitle || undefined,
        ctaDescription: homepageContent.ctaDescription || undefined,
        ctaButtonText: homepageContent.ctaButtonText || undefined,
        ctaSecondaryButtonText: homepageContent.ctaSecondaryButtonText || undefined,
      };
      homepageContentForm.reset(formData);
    }
  }, [homepageContent, homepageContentForm]);

  const updateHomepageContentMutation = useMutation({
    mutationFn: async (data: HomepageContentFormData) => {
      const response = await apiRequest('PUT', '/api/homepage-content', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/homepage-content', language] });
      homepageContentForm.reset(data);
      setQualityBgFile(null);
      setQualityBgPreview('');
      setQuality2BgFile(null);
      setQuality2BgPreview('');
      toast({ 
        title: "Đã lưu thành công",
        description: "Nội dung trang chủ đã được cập nhật"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật nội dung trang chủ",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Lỗi khi tạo đối tác",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Lỗi khi cập nhật đối tác",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Lỗi khi xóa đối tác",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createFaqMutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      const response = await apiRequest('POST', '/api/faqs', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/faqs' });
      toast({ 
        title: "Đã lưu thành công",
        description: "FAQ has been created"
      });
      faqForm.reset();
      setIsFaqDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo FAQ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FaqFormData> }) => {
      const response = await apiRequest('PUT', `/api/faqs/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/faqs' });
      faqForm.reset(data);
      toast({ 
        title: "Đã lưu thành công",
        description: "FAQ has been updated"
      });
      setEditingFaq(null);
      setIsFaqDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật FAQ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/faqs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/faqs' });
      toast({ title: "Đã xóa FAQ thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa FAQ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAdvantageMutation = useMutation({
    mutationFn: async (data: AdvantageFormData) => {
      const response = await apiRequest('POST', '/api/advantages', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advantages'] });
      toast({ 
        title: "Đã lưu thành công",
        description: "Advantage has been created"
      });
      advantageForm.reset();
      setIsAdvantageDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo ưu điểm",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAdvantageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdvantageFormData> }) => {
      const response = await apiRequest('PUT', `/api/advantages/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/advantages'] });
      advantageForm.reset(data);
      toast({ 
        title: "Đã lưu thành công",
        description: "Advantage has been updated"
      });
      setEditingAdvantage(null);
      setIsAdvantageDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật ưu điểm",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAdvantageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/advantages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advantages'] });
      toast({ title: "Đã xóa ưu điểm thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa ưu điểm",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createJourneyStepMutation = useMutation({
    mutationFn: async (data: JourneyStepFormData) => {
      const response = await apiRequest('POST', '/api/journey-steps', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey-steps'] });
      toast({ 
        title: "Đã lưu thành công",
        description: "Journey step has been created"
      });
      journeyStepForm.reset();
      setIsJourneyStepDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo bước hành trình",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateJourneyStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JourneyStepFormData> }) => {
      const response = await apiRequest('PATCH', `/api/journey-steps/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey-steps'] });
      journeyStepForm.reset(data);
      toast({ 
        title: "Đã lưu thành công",
        description: "Journey step has been updated"
      });
      setEditingJourneyStep(null);
      setIsJourneyStepDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật bước hành trình",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteJourneyStepMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/journey-steps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey-steps'] });
      toast({ title: "Đã xóa bước hành trình thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa bước hành trình",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onHomepageContentSubmit = async (data: HomepageContentFormData) => {
    const submitData = { ...data };
    
    try {
      if (qualityBgFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(qualityBgFile);
        });
        submitData.qualityBackgroundImage = base64;
      }
      
      if (quality2BgFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(quality2BgFile);
        });
        submitData.quality2BackgroundImage = base64;
      }
      
      await updateHomepageContentMutation.mutateAsync(submitData);
      setQualityBgFile(null);
      setQualityBgPreview('');
      setQuality2BgFile(null);
      setQuality2BgPreview('');
    } catch (error) {
    }
  };

  const handleQualityBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSizeBytes) {
        toast({
          title: "File quá lớn",
          description: `Kích thước file: ${fileSizeMB}MB. Giới hạn tối đa: ${maxSizeMB}MB. Vui lòng chọn file nhỏ hơn.`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setQualityBgFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        setQualityBgPreview(data.path);
        
        toast({
          title: "Upload thành công",
          description: "Ảnh background đã được upload"
        });
      } catch (error) {
        toast({
          title: "Lỗi upload",
          description: "Không thể upload ảnh",
          variant: "destructive"
        });
        e.target.value = '';
      }
    }
  };

  const handleQuality2BgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSizeBytes) {
        toast({
          title: "File quá lớn",
          description: `Kích thước file: ${fileSizeMB}MB. Giới hạn tối đa: ${maxSizeMB}MB. Vui lòng chọn file nhỏ hơn.`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setQuality2BgFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        setQuality2BgPreview(data.path);
        
        toast({
          title: "Upload thành công",
          description: "Ảnh background đã được upload"
        });
      } catch (error) {
        toast({
          title: "Lỗi upload",
          description: "Không thể upload ảnh",
          variant: "destructive"
        });
        e.target.value = '';
      }
    }
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    partnerForm.reset({
      name: partner.name,
      logo: partner.logo || "",
    });
    if (partner.logoData) {
      setPartnerLogoPreview(partner.logoData);
    } else {
      setPartnerLogoPreview('');
    }
    setIsPartnerDialogOpen(true);
  };

  const onPartnerSubmit = async (data: PartnerFormData) => {
    try {
      const partnerData: any = {
        name: data.name,
        order: 0,
        active: true,
      };
      
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
    } catch (error) {
    }
  };

  const handlePartnerLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSizeBytes) {
        toast({
          title: "File quá lớn",
          description: `Kích thước file: ${fileSizeMB}MB. Giới hạn tối đa: ${maxSizeMB}MB. Vui lòng chọn file nhỏ hơn.`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setPartnerLogoFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await response.json();
        setPartnerLogoPreview(data.path);
        
        toast({
          title: "Upload thành công",
          description: "Logo đã được upload"
        });
      } catch (error) {
        toast({
          title: "Lỗi upload",
          description: "Không thể upload logo",
          variant: "destructive"
        });
        e.target.value = '';
      }
    }
  };

  const handleEditFaq = (group: { en: Faq | null, vi: Faq | null, order: number }) => {
    setEditingFaq(group.en || group.vi);
    faqForm.reset({
      questionEn: group.en?.question || "",
      questionVi: group.vi?.question || "",
      answerEn: group.en?.answer || "",
      answerVi: group.vi?.answer || "",
      page: 'home',
    });
    setIsFaqDialogOpen(true);
  };

  const onFaqSubmit = async (data: BilingualFaqFormData) => {
    try {
      const order = editingFaq ? editingFaq.order : Math.max(0, ...faqs.map(f => f.order)) + 1;

      const enData = {
        question: data.questionEn,
        answer: data.answerEn,
        page: data.page,
        language: 'en' as const,
        order: order,
        active: true,
      };

      const viData = {
        question: data.questionVi,
        answer: data.answerVi,
        page: data.page,
        language: 'vi' as const,
        order: order,
        active: true,
      };

      if (editingFaq) {
        const enFaq = faqs.find(f => f.order === editingFaq.order && f.page === data.page && f.language === 'en');
        const viFaq = faqs.find(f => f.order === editingFaq.order && f.page === data.page && f.language === 'vi');

        const promises = [];
        if (enFaq) {
          promises.push(updateFaqMutation.mutateAsync({ id: enFaq.id, data: enData }));
        } else {
          promises.push(createFaqMutation.mutateAsync(enData));
        }

        if (viFaq) {
          promises.push(updateFaqMutation.mutateAsync({ id: viFaq.id, data: viData }));
        } else {
          promises.push(createFaqMutation.mutateAsync(viData));
        }

        await Promise.all(promises);
      } else {
        await Promise.all([
          createFaqMutation.mutateAsync(enData),
          createFaqMutation.mutateAsync(viData),
        ]);
      }
      
      setEditingFaq(null);
      setIsFaqDialogOpen(false);
    } catch (error) {
    }
  };

  const handleEditAdvantage = (advantage: any) => {
    setEditingAdvantage(advantage);
    advantageForm.reset({
      icon: advantage.icon || "",
      titleEn: advantage.titleEn || "",
      titleVi: advantage.titleVi || "",
      descriptionEn: advantage.descriptionEn || "",
      descriptionVi: advantage.descriptionVi || "",
      active: advantage.active !== undefined ? advantage.active : true,
    });
    setIsAdvantageDialogOpen(true);
  };

  const onAdvantageSubmit = async (data: AdvantageFormData) => {
    try {
      const order = editingAdvantage ? editingAdvantage.order : Math.max(0, ...advantages.map(a => a.order)) + 1;
      const advantageData = { ...data, order };

      if (editingAdvantage) {
        await updateAdvantageMutation.mutateAsync({ id: editingAdvantage.id, data: advantageData });
      } else {
        await createAdvantageMutation.mutateAsync(advantageData);
      }
      
      setEditingAdvantage(null);
      setIsAdvantageDialogOpen(false);
    } catch (error) {
    }
  };

  const handleEditJourneyStep = (journeyStep: JourneyStep) => {
    setEditingJourneyStep(journeyStep);
    journeyStepForm.reset({
      stepNumber: journeyStep.stepNumber || 1,
      titleEn: journeyStep.titleEn || "",
      titleVi: journeyStep.titleVi || "",
      descriptionEn: journeyStep.descriptionEn || "",
      descriptionVi: journeyStep.descriptionVi || "",
      active: journeyStep.active !== undefined ? journeyStep.active : true,
    });
    setIsJourneyStepDialogOpen(true);
  };

  const onJourneyStepSubmit = async (data: JourneyStepFormData) => {
    try {
      const order = editingJourneyStep ? editingJourneyStep.order : Math.max(0, ...journeySteps.map(j => j.order)) + 1;
      const journeyStepData = { ...data, order };

      if (editingJourneyStep) {
        await updateJourneyStepMutation.mutateAsync({ id: editingJourneyStep.id, data: journeyStepData });
      } else {
        await createJourneyStepMutation.mutateAsync(journeyStepData);
      }
      
      setEditingJourneyStep(null);
      setIsJourneyStepDialogOpen(false);
    } catch (error) {
    }
  };

  if (!hasPermission(user, 'homepage')) {
    return <PermissionDenied feature="Homepage Content" />;
  }

  return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Nội Dung Trang Chủ' : 'Homepage Content Management'}</h2>
        
        <Form {...homepageContentForm}>
          <form onSubmit={homepageContentForm.handleSubmit(onHomepageContentSubmit)} className="space-y-6">
            <Card>
          <CardHeader>
            <CardTitle>{language === 'vi' ? 'Quản Lý Tiêu Đề Mục' : 'Section Titles Management'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Featured Projects */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Dự Án Nổi Bật' : 'Featured Projects Section'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                    <Textarea 
                      {...homepageContentForm.register("featuredDescription")}
                      placeholder="e.g., Discover our latest projects where innovation meets elegance."
                      rows={2}
                      data-testid="textarea-featured-projects-subtitle-en"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (VI)</label>
                    <Textarea 
                      {...homepageContentForm.register("featuredDescriptionVi")}
                      placeholder="e.g., Khám phá các dự án mới nhất của chúng tôi nơi sự đổi mới gặp gỡ sự thanh lịch."
                      rows={2}
                      data-testid="textarea-featured-projects-subtitle-vi"
                    />
                  </div>
                </div>
              </div>

              {/* Featured News */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Tin Tức Nổi Bật' : 'Featured News Section'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                    <Textarea 
                      {...homepageContentForm.register("featuredNewsSubtitle")}
                      placeholder="e.g., Discover the latest design trends and expert insights from our professional team."
                      rows={2}
                      data-testid="textarea-featured-news-subtitle-en"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (VI)</label>
                    <Textarea 
                      {...homepageContentForm.register("featuredNewsSubtitleVi")}
                      placeholder="e.g., Khám phá xu hướng thiết kế mới nhất và những hiểu biết chuyên sâu từ đội ngũ chuyên nghiệp của chúng tôi."
                      rows={2}
                      data-testid="textarea-featured-news-subtitle-vi"
                    />
                  </div>
                </div>
              </div>

              {/* Journey Steps */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Các Bước Hành Trình' : 'Journey Steps Section'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light mb-2 block">Description (EN)</label>
                    <Textarea 
                      {...homepageContentForm.register("journeyDescription")}
                      rows={3}
                      placeholder="Description for the journey/process section"
                      data-testid="textarea-journey-description-en"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">Description (VI)</label>
                    <Textarea 
                      {...homepageContentForm.register("journeyDescriptionVi")}
                      rows={3}
                      placeholder="Mô tả cho phần hành trình/quy trình"
                      data-testid="textarea-journey-description-vi"
                    />
                  </div>
                </div>
              </div>

              {/* Advantages */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Ưu Điểm' : 'Advantages Section'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                    <Input 
                      {...homepageContentForm.register("advantagesSubtitle")}
                      placeholder="e.g., Why Choose IEVRA Design & Build"
                      data-testid="input-advantages-subtitle-en"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (VI)</label>
                    <Input 
                      {...homepageContentForm.register("advantagesSubtitleVi")}
                      placeholder="e.g., Tại Sao Chọn IEVRA Design & Build"
                      data-testid="input-advantages-subtitle-vi"
                    />
                  </div>
                </div>
              </div>

              {/* Partners */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Đối Tác' : 'Partners Section'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                    <Textarea 
                      {...homepageContentForm.register("partnersSubtitle")}
                      placeholder="e.g., We are proud to work with leading prestigious brands."
                      rows={2}
                      data-testid="textarea-partners-subtitle-en"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (VI)</label>
                    <Textarea 
                      {...homepageContentForm.register("partnersSubtitleVi")}
                      placeholder="e.g., Chúng tôi tự hào hợp tác với những thương hiệu uy tín hàng đầu."
                      rows={2}
                      data-testid="textarea-partners-subtitle-vi"
                    />
                  </div>
                </div>
              </div>

              {/* CTA/Questions */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục CTA/Câu Hỏi' : 'CTA/Questions Section'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                    <Textarea 
                      {...homepageContentForm.register("ctaSubtitle")}
                      placeholder="e.g., Leave a request for a free consultation and we will contact you as soon as possible."
                      rows={2}
                      data-testid="textarea-cta-subtitle-en"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (VI)</label>
                    <Textarea 
                      {...homepageContentForm.register("ctaSubtitleVi")}
                      placeholder="e.g., Để lại yêu cầu tư vấn miễn phí và chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất."
                      rows={2}
                      data-testid="textarea-cta-subtitle-vi"
                    />
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục FAQ' : 'FAQ Section'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                    <Textarea 
                      {...homepageContentForm.register("faqSectionSubtitle")}
                      placeholder="e.g., LEARN MORE ABOUT OUR DESIGN PROCESS AND SERVICES."
                      rows={2}
                      data-testid="textarea-faq-subtitle-en"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">Subtitle (VI)</label>
                    <Textarea 
                      {...homepageContentForm.register("faqSectionSubtitleVi")}
                      placeholder="e.g., TÌM HIỂU THÊM VỀ QUY TRÌNH THIẾT KẾ VÀ DỊCH VỤ CỦA CHÚNG TÔI."
                      rows={2}
                      data-testid="textarea-faq-subtitle-vi"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <Button 
                type="submit" 
                className={`w-full transition-all ${!homepageContentForm.formState.isDirty && !qualityBgFile && !quality2BgFile ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90'}`}
                disabled={(!homepageContentForm.formState.isDirty && !qualityBgFile && !quality2BgFile) || updateHomepageContentMutation.isPending}
                data-testid="button-save-section-titles"
              >
                {updateHomepageContentMutation.isPending ? (language === 'vi' ? "Đang lưu..." : "Saving...") : (language === 'vi' ? "Lưu Tiêu Đề Mục" : "Save Section Titles")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'vi' ? 'Mục Chất Lượng/Banner' : 'Quality/Banner Sections'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Section 1 */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Banner 1' : 'Banner Section 1'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Ảnh Nền' : 'Background Image'}</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleQualityBgFileChange}
                      disabled={!hasPermission(user, 'homepage')}
                      className="block w-full text-sm text-foreground
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-none file:border-0
                        file:text-sm file:font-medium
                        file:bg-white file:text-black
                        hover:file:bg-white/90 cursor-pointer
                        disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="input-quality-bg-file"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'vi' ? 'Định dạng: PNG, JPG • Tối đa: 10MB • Khuyến nghị: 1920x600px' : 'Format: PNG, JPG • Max: 10MB • Recommended: 1920x600px'}
                    </p>
                    {(qualityBgPreview || homepageContent?.qualityBackgroundImage) && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">{language === 'vi' ? 'Xem trước:' : 'Preview:'}</p>
                        <div className="border p-4 bg-muted">
                          <img 
                            src={qualityBgPreview || homepageContent?.qualityBackgroundImage || ''} 
                            alt="Quality BG Preview" 
                            className="w-full aspect-[16/6] object-cover" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Văn Bản Trái (Lớn)' : 'Left Text (Large)'}</label>
                    <Textarea 
                      {...homepageContentForm.register("qualityLeftText")}
                      placeholder="e.g., Each detail is selected so that the interior will serve for a long time and look impeccable."
                      rows={3}
                      data-testid="textarea-quality-left-text"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Văn Bản Phải (Nhỏ)' : 'Right Text (Small)'}</label>
                    <Textarea 
                      {...homepageContentForm.register("qualityRightText")}
                      placeholder="e.g., We use only high-quality materials and furniture from trusted manufacturers."
                      rows={3}
                      data-testid="textarea-quality-right-text"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Banner 2' : 'Banner Section 2'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Ảnh Nền' : 'Background Image'}</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleQuality2BgFileChange}
                      disabled={!hasPermission(user, 'homepage')}
                      className="block w-full text-sm text-foreground
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-none file:border-0
                        file:text-sm file:font-medium
                        file:bg-white file:text-black
                        hover:file:bg-white/90 cursor-pointer
                        disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="input-quality2-bg-file"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'vi' ? 'Định dạng: PNG, JPG • Tối đa: 10MB • Khuyến nghị: 1920x600px' : 'Format: PNG, JPG • Max: 10MB • Recommended: 1920x600px'}
                    </p>
                    {(quality2BgPreview || homepageContent?.quality2BackgroundImage) && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">{language === 'vi' ? 'Xem trước:' : 'Preview:'}</p>
                        <div className="border p-4 bg-muted">
                          <img 
                            src={quality2BgPreview || homepageContent?.quality2BackgroundImage || ''} 
                            alt="Quality 2 BG Preview" 
                            className="w-full aspect-[16/6] object-cover" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Văn Bản Trái (Lớn)' : 'Left Text (Large)'}</label>
                    <Textarea 
                      {...homepageContentForm.register("quality2LeftText")}
                      placeholder="e.g., Each detail is selected so that the interior will serve for a long time and look impeccable."
                      rows={3}
                      data-testid="textarea-quality2-left-text"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Văn Bản Phải (Nhỏ)' : 'Right Text (Small)'}</label>
                    <Textarea 
                      {...homepageContentForm.register("quality2RightText")}
                      placeholder="e.g., We use only high-quality materials and furniture from trusted manufacturers."
                      rows={3}
                      data-testid="textarea-quality2-right-text"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6 pt-4">
              <Button 
                type="submit"
                className={`w-full transition-all ${!homepageContentForm.formState.isDirty && !qualityBgFile && !quality2BgFile ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90'}`}
                disabled={(!homepageContentForm.formState.isDirty && !qualityBgFile && !quality2BgFile) || updateHomepageContentMutation.isPending}
                data-testid="button-save-banner-sections"
              >
                {updateHomepageContentMutation.isPending ? (language === 'vi' ? "Đang lưu..." : "Saving...") : (language === 'vi' ? "Lưu Mục Banner" : "Save Banner Sections")}
              </Button>
            </div>
          </CardContent>
        </Card>
          </form>
        </Form>

        {/* Partners Management Section */}
        <Card className="bg-black border-white/10">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-white">{language === 'vi' ? 'Quản Lý Đối Tác' : 'Partners Management'}</CardTitle>
                <p className="text-sm text-white/50 mt-1">
                  {partners.length} / 24 {language === 'vi' ? 'đối tác • Tối đa 24 đối tác' : 'partners • Maximum 24 partners allowed'}
                </p>
              </div>
              <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={(e) => {
                      if (partners.length >= 24) {
                        e.preventDefault();
                        toast({
                          title: language === 'vi' ? "Đã đạt tối đa đối tác" : "Maximum partners reached",
                          description: language === 'vi' ? "Bạn đã đạt giới hạn tối đa 24 đối tác. Vui lòng xóa một đối tác hiện có để thêm mới." : "You have reached the maximum limit of 24 partners. Please delete an existing partner to add a new one.",
                          variant: "destructive"
                        });
                        return;
                      }
                      setEditingPartner(null);
                      partnerForm.reset({
                        name: "",
                        logo: "",
                      });
                      setPartnerLogoPreview('');
                      setIsPartnerDialogOpen(true);
                    }} 
                    disabled={partners.length >= 24}
                    data-testid="button-add-partner"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {language === 'vi' ? 'Thêm Đối Tác' : 'Add Partner'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPartner ? (language === 'vi' ? 'Chỉnh Sửa Đối Tác' : 'Edit Partner') : (language === 'vi' ? 'Thêm Đối Tác Mới' : 'Add New Partner')}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...partnerForm}>
                    <form onSubmit={partnerForm.handleSubmit(onPartnerSubmit)} className="space-y-6">
                      <FormField
                        control={partnerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tên Đối Tác' : 'Partner Name'}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter partner name" data-testid="input-partner-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Tải Logo (chỉ PNG, JPG)' : 'Upload Logo (PNG, JPG only)'}</label>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={handlePartnerLogoFileChange}
                            disabled={!hasPermission(user, 'partners')}
                            className="block w-full text-sm text-foreground
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-none file:border file:border-white/30
                              file:text-sm file:font-medium
                              file:bg-transparent file:text-white
                              hover:file:bg-white/10 hover:file:border-white cursor-pointer
                              disabled:opacity-50 disabled:cursor-not-allowed"
                            data-testid="input-partner-logo-file"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Định dạng: PNG, JPG • Giới hạn: 10MB • Khuyến nghị: 500x200px
                          </p>
                          {(partnerLogoPreview || editingPartner?.logoData || editingPartner?.logo) && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Preview:</p>
                              <div className="border rounded p-4 bg-muted flex items-center justify-center">
                                <img 
                                  src={partnerLogoPreview || editingPartner?.logoData || editingPartner?.logo || ''} 
                                  alt="Partner Logo Preview" 
                                  className="h-24 object-contain" 
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">{language === 'vi' ? 'Hoặc dùng URL' : 'Or use URL'}</span>
                          </div>
                        </div>

                        <FormField
                          control={partnerForm.control}
                          name="logo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'vi' ? 'URL Logo' : 'Logo URL'}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://example.com/logo.png" data-testid="input-partner-logo" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={createPartnerMutation.isPending || updatePartnerMutation.isPending}
                        className="w-full"
                        data-testid="button-submit-partner"
                      >
                        {editingPartner ? (language === 'vi' ? 'Cập Nhật Đối Tác' : 'Update Partner') : (language === 'vi' ? 'Thêm Đối Tác' : 'Add Partner')}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {partnersLoading ? (
              <div className="text-white/70">{language === 'vi' ? 'Đang tải đối tác...' : 'Loading partners...'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/70 w-24">Logo</TableHead>
                    <TableHead className="text-white/70">{language === 'vi' ? 'Tên' : 'Name'}</TableHead>
                    <TableHead className="text-white/70 w-32">{language === 'vi' ? 'Thao Tác' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded p-2">
                          <img 
                            src={partner.logoData || partner.logo || ''} 
                            alt={partner.name}
                            className="max-w-full max-h-full object-contain"
                            data-testid={`img-partner-logo-${partner.id}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-light" data-testid={`text-partner-name-${partner.id}`}>
                        {partner.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPartner(partner)}
                            data-testid={`button-edit-partner-${partner.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                data-testid={`button-delete-partner-${partner.id}`}
                              >
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
                                <AlertDialogAction
                                  onClick={() => deletePartnerMutation.mutate(partner.id)}
                                  className="rounded-none"
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
            )}
          </CardContent>
        </Card>

        {/* FAQ Management Section */}
        <Card className="bg-black border-white/10">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-white">{language === 'vi' ? 'Quản Lý FAQ' : 'FAQ Management'}</CardTitle>
              <Button
                onClick={() => {
                  setEditingFaq(null);
                  faqForm.reset({
                    questionEn: "",
                    answerEn: "",
                    questionVi: "",
                    answerVi: "",
                  });
                  setIsFaqDialogOpen(true);
                }}
                data-testid="button-add-faq"
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === 'vi' ? 'Thêm FAQ' : 'Add FAQ'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingFaq ? (language === 'vi' ? 'Chỉnh Sửa FAQ' : 'Edit FAQ') : (language === 'vi' ? 'Thêm FAQ Mới' : 'Add New FAQ')}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...faqForm}>
                    <form onSubmit={faqForm.handleSubmit(onFaqSubmit)} className="space-y-4">
                      <div className="space-y-4">
                        <div className="border p-4 space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground">{language === 'vi' ? 'Phiên Bản Tiếng Anh' : 'English Version'}</h3>
                          <FormField
                            control={faqForm.control}
                            name="questionEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question (EN) *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-faq-question-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={faqForm.control}
                            name="answerEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Answer (EN) *</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={4} data-testid="textarea-faq-answer-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="border p-4 space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground">{language === 'vi' ? 'Phiên Bản Tiếng Việt' : 'Vietnamese Version'}</h3>
                          <FormField
                            control={faqForm.control}
                            name="questionVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question (VI) *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-faq-question-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={faqForm.control}
                            name="answerVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Answer (VI) *</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={4} data-testid="textarea-faq-answer-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className={`w-full transition-all ${!faqForm.formState.isDirty ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90'}`}
                        disabled={!faqForm.formState.isDirty || createFaqMutation.isPending || updateFaqMutation.isPending}
                        data-testid="button-submit-faq"
                      >
                        {createFaqMutation.isPending || updateFaqMutation.isPending ? (language === 'vi' ? "Đang lưu..." : "Saving...") : (language === 'vi' ? "Lưu" : "Save")}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

            {faqsLoading ? (
              <div className="text-white/70">{language === 'vi' ? 'Đang tải FAQ...' : 'Loading FAQs...'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/70 w-20">{language === 'vi' ? 'Thứ Tự' : 'Order'}</TableHead>
                    <TableHead className="text-white/70">{language === 'vi' ? 'Câu Hỏi (EN / VI)' : 'Question (EN / VI)'}</TableHead>
                    <TableHead className="text-white/70 w-32">{language === 'vi' ? 'Thao Tác' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const groupedFaqs = faqs.reduce((acc, faq) => {
                      const key = `${faq.order}`;
                      if (!acc[key]) {
                        acc[key] = { en: null, vi: null, order: faq.order };
                      }
                      if (faq.language === 'en') {
                        acc[key].en = faq;
                      } else {
                        acc[key].vi = faq;
                      }
                      return acc;
                    }, {} as Record<string, { en: Faq | null, vi: Faq | null, order: number }>);

                    return Object.values(groupedFaqs)
                      .sort((a, b) => a.order - b.order)
                      .map((group, index) => {
                        const enFaq = group.en;
                        const viFaq = group.vi;
                        const displayFaq = enFaq || viFaq;
                        
                        if (!displayFaq) return null;
                        
                        return (
                          <TableRow key={`group-${index}`}>
                            <TableCell className="text-white/70">{displayFaq.order}</TableCell>
                            <TableCell className="text-white max-w-md" data-testid={`text-faq-group-${index}`}>
                              <div className="space-y-2">
                                {enFaq && (
                                  <div className="truncate">
                                    <span className="text-white/50 text-xs uppercase">EN:</span> {enFaq.question}
                                  </div>
                                )}
                                {viFaq && (
                                  <div className="truncate">
                                    <span className="text-white/50 text-xs uppercase">VI:</span> {viFaq.question}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleEditFaq(group)}
                                  data-testid={`button-edit-faq-${index}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => {
                                    if (enFaq) deleteFaqMutation.mutate(enFaq.id);
                                    if (viFaq) deleteFaqMutation.mutate(viFaq.id);
                                  }}
                                  data-testid={`button-delete-faq-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      });
                  })()}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Advantages Management Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle>{language === 'vi' ? 'Quản Lý Ưu Điểm (Tại Sao Chọn Chúng Tôi)' : 'Advantages Management (Why Choose Us)'}</CardTitle>
              <Button
                onClick={() => {
                  setEditingAdvantage(null);
                  advantageForm.reset({
                    icon: "",
                    titleEn: "",
                    titleVi: "",
                    descriptionEn: "",
                    descriptionVi: "",
                    active: true,
                  });
                  setIsAdvantageDialogOpen(true);
                }}
                data-testid="button-add-advantage"
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === 'vi' ? 'Thêm Ưu Điểm' : 'Add Advantage'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Dialog open={isAdvantageDialogOpen} onOpenChange={(open) => {
              setIsAdvantageDialogOpen(open);
              if (!open) {
                setEditingAdvantage(null);
                advantageForm.reset();
              }
            }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingAdvantage ? (language === 'vi' ? 'Chỉnh Sửa Ưu Điểm' : 'Edit Advantage') : (language === 'vi' ? 'Thêm Ưu Điểm Mới' : 'Add New Advantage')}</DialogTitle>
                  </DialogHeader>
                  <Form {...advantageForm}>
                    <form onSubmit={advantageForm.handleSubmit(onAdvantageSubmit)} className="space-y-4">
                      <FormField
                        control={advantageForm.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lucide Icon Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Sparkles, Headset, Users, Store" data-testid="input-advantage-icon" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <FormField
                            control={advantageForm.control}
                            name="titleEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title (EN) *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-advantage-title-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={advantageForm.control}
                            name="descriptionEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (EN) *</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} data-testid="textarea-advantage-description-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <FormField
                            control={advantageForm.control}
                            name="titleVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title (VI) *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-advantage-title-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={advantageForm.control}
                            name="descriptionVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (VI) *</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} data-testid="textarea-advantage-description-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className={`w-full transition-all ${!advantageForm.formState.isDirty ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90'}`}
                        disabled={!advantageForm.formState.isDirty || createAdvantageMutation.isPending || updateAdvantageMutation.isPending}
                        data-testid="button-submit-advantage"
                      >
                        {createAdvantageMutation.isPending || updateAdvantageMutation.isPending ? (language === 'vi' ? "Đang lưu..." : "Saving...") : (language === 'vi' ? "Lưu" : "Save")}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

            {advantagesLoading ? (
              <div className="text-white/70">{language === 'vi' ? 'Đang tải ưu điểm...' : 'Loading advantages...'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/70 w-20">{language === 'vi' ? 'Thứ Tự' : 'Order'}</TableHead>
                    <TableHead className="text-white/70">{language === 'vi' ? 'Tiêu Đề (EN / VI)' : 'Title (EN / VI)'}</TableHead>
                    <TableHead className="text-white/70 w-32">{language === 'vi' ? 'Thao Tác' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {advantages
                      .sort((a, b) => a.order - b.order)
                      .map((advantage, index) => (
                        <TableRow key={advantage.id}>
                          <TableCell className="text-white/70">{advantage.order}</TableCell>
                          <TableCell className="text-white max-w-md" data-testid={`text-advantage-${index}`}>
                            <div className="space-y-1">
                              <div className="truncate">
                                <span className="text-white/50 text-xs uppercase">EN:</span> {advantage.titleEn}
                              </div>
                              <div className="truncate">
                                <span className="text-white/50 text-xs uppercase">VI:</span> {advantage.titleVi}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => handleEditAdvantage(advantage)}
                                data-testid={`button-edit-advantage-${index}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => deleteAdvantageMutation.mutate(advantage.id)}
                                data-testid={`button-delete-advantage-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
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

        {/* Journey Steps Management Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle>{language === 'vi' ? 'Quản Lý Các Bước Hành Trình (Quy Trình Thiết Kế)' : 'Journey Steps Management (Design Process)'}</CardTitle>
              <Button
                onClick={() => {
                  setEditingJourneyStep(null);
                  journeyStepForm.reset({
                    titleEn: "",
                    titleVi: "",
                    descriptionEn: "",
                    descriptionVi: "",
                    active: true,
                  });
                  setIsJourneyStepDialogOpen(true);
                }}
                data-testid="button-add-journey-step"
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === 'vi' ? 'Thêm Bước Hành Trình' : 'Add Journey Step'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Dialog open={isJourneyStepDialogOpen} onOpenChange={(open) => {
              setIsJourneyStepDialogOpen(open);
              if (!open) {
                setEditingJourneyStep(null);
                journeyStepForm.reset();
              }
            }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingJourneyStep ? (language === 'vi' ? 'Chỉnh Sửa Bước Hành Trình' : 'Edit Journey Step') : (language === 'vi' ? 'Thêm Bước Hành Trình Mới' : 'Add New Journey Step')}</DialogTitle>
                  </DialogHeader>
                  <Form {...journeyStepForm}>
                    <form onSubmit={journeyStepForm.handleSubmit(onJourneyStepSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <FormField
                            control={journeyStepForm.control}
                            name="titleEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title (EN) *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-journey-step-title-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={journeyStepForm.control}
                            name="descriptionEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (EN) *</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} data-testid="textarea-journey-step-description-en" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <FormField
                            control={journeyStepForm.control}
                            name="titleVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title (VI) *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-journey-step-title-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={journeyStepForm.control}
                            name="descriptionVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (VI) *</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} data-testid="textarea-journey-step-description-vi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className={`w-full transition-all ${!journeyStepForm.formState.isDirty ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90'}`}
                        disabled={!journeyStepForm.formState.isDirty || createJourneyStepMutation.isPending || updateJourneyStepMutation.isPending}
                        data-testid="button-submit-journey-step"
                      >
                        {createJourneyStepMutation.isPending || updateJourneyStepMutation.isPending ? (language === 'vi' ? "Đang lưu..." : "Saving...") : (language === 'vi' ? "Lưu" : "Save")}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

            {journeyStepsLoading ? (
              <div className="text-white/70">{language === 'vi' ? 'Đang tải các bước hành trình...' : 'Loading journey steps...'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/70 w-20">{language === 'vi' ? 'Thứ Tự' : 'Order'}</TableHead>
                    <TableHead className="text-white/70">{language === 'vi' ? 'Tiêu Đề (EN / VI)' : 'Title (EN / VI)'}</TableHead>
                    <TableHead className="text-white/70 w-32">{language === 'vi' ? 'Thao Tác' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journeySteps
                    .sort((a, b) => a.order - b.order)
                    .map((journeyStep, index) => (
                      <TableRow key={journeyStep.id}>
                        <TableCell className="text-white/70">{journeyStep.order}</TableCell>
                        <TableCell className="text-white max-w-md" data-testid={`text-journey-step-${index}`}>
                          <div className="space-y-1">
                            <div className="truncate">
                              <span className="text-white/50 text-xs uppercase">EN:</span> {journeyStep.titleEn}
                            </div>
                            <div className="truncate">
                              <span className="text-white/50 text-xs uppercase">VI:</span> {journeyStep.titleVi}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleEditJourneyStep(journeyStep)}
                              data-testid={`button-edit-journey-step-${index}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteJourneyStepMutation.mutate(journeyStep.id)}
                              data-testid={`button-delete-journey-step-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
      </div>
  );
}
