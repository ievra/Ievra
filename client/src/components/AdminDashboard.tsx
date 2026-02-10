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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";
import { Pencil, Trash2, Eye, Plus, Users, Briefcase, Mail, TrendingUp, Star, Check, ChevronsUpDown, X, Settings, Lock, Shield, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Project, Client, Inquiry, Service, HomepageContent, Article, InsertArticle, Partner, Category, Interaction, Deal, Faq, InsertFaq, JourneyStep, InsertJourneyStep, AboutPageContent, AboutCoreValue, AboutShowcaseService, AboutProcessStep, AboutTeamMember, InsertAboutPageContent, InsertAboutCoreValue, InsertAboutShowcaseService, InsertAboutProcessStep, InsertAboutTeamMember, User, Settings as SettingsType } from "@shared/schema";
import { insertArticleSchema, insertFaqSchema, insertJourneyStepSchema, insertAboutPageContentSchema, insertAboutCoreValueSchema, insertAboutShowcaseServiceSchema, insertAboutProcessStepSchema, insertAboutTeamMemberSchema } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import AboutAdminTab from "@/components/AboutAdminTab";
import CrmSettingsManager from "@/components/CrmSettingsManager";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  detailedDescription: z.string().optional(),
  designPhilosophy: z.string().optional(),
  materialSelection: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  location: z.string().optional(),
  area: z.string().optional(),
  duration: z.string().optional(),
  style: z.string().optional(),
  designer: z.string().optional(),
  completionYear: z.string().optional(),
  // New image categories with specific constraints
  coverImages: z.array(z.string()).max(2, "Maximum 2 cover images allowed").default([]),
  contentImages: z.array(z.string()).max(2, "Maximum 2 content images allowed").default([]),
  galleryImages: z.array(z.string()).max(10, "Maximum 10 gallery images allowed").default([]),
  featured: z.boolean().default(false),
  // Legacy fields for backward compatibility  
  heroImage: z.string().optional(),
  images: z.array(z.string()).default([]), // Legacy field
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
});

// Bilingual project schema for form
const bilingualProjectSchema = z.object({
  titleEn: z.string().optional(),
  titleVi: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionVi: z.string().optional(),
  detailedDescriptionEn: z.string().optional(),
  detailedDescriptionVi: z.string().optional(),
  designPhilosophyTitleEn: z.string().optional(),
  designPhilosophyTitleVi: z.string().optional(),
  designPhilosophyEn: z.string().optional(),
  designPhilosophyVi: z.string().optional(),
  materialSelectionTitleEn: z.string().optional(),
  materialSelectionTitleVi: z.string().optional(),
  materialSelectionEn: z.string().optional(),
  materialSelectionVi: z.string().optional(),
  slug: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  locationEn: z.string().optional(),
  locationVi: z.string().optional(),
  areaEn: z.string().optional(),
  areaVi: z.string().optional(),
  durationEn: z.string().optional(),
  durationVi: z.string().optional(),
  styleEn: z.string().optional(),
  styleVi: z.string().optional(),
  designerEn: z.string().optional(),
  designerVi: z.string().optional(),
  completionYearEn: z.string().optional(),
  completionYearVi: z.string().optional(),
  coverImages: z.array(z.string()).max(2, "Maximum 2 cover images allowed").default([]),
  contentImages: z.array(z.string()).max(2, "Maximum 2 content images allowed").default([]),
  galleryImages: z.array(z.string()).max(10, "Maximum 10 gallery images allowed").default([]),
  featured: z.boolean().default(false),
  heroImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  metaTitleEn: z.string().optional(),
  metaTitleVi: z.string().optional(),
  metaDescriptionEn: z.string().optional(),
  metaDescriptionVi: z.string().optional(),
  metaKeywordsEn: z.string().optional(),
  metaKeywordsVi: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasEn = data.titleEn && data.titleEn.trim();
  const hasVi = data.titleVi && data.titleVi.trim();
  if (!hasEn && !hasVi) {
    const msg = "Cần nhập ít nhất 1 ngôn ngữ (tiêu đề bắt buộc)";
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["titleEn"] });
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["titleVi"] });
  }
});

type BilingualProjectFormData = z.infer<typeof bilingualProjectSchema>;

const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  stage: z.enum(["lead", "prospect", "contract", "delivery", "aftercare"]).default("lead"),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  tier: z.enum(["vip", "silver", "gold", "platinum"]).default("silver"),
  totalSpending: z.string().optional(),
  refundAmount: z.string().optional(),
  commission: z.string().optional(),
  orderCount: z.number().optional(),
  referredById: z.string().optional(),
  referralCount: z.number().optional(),
  referralRevenue: z.string().optional(),
  warrantyStatus: z.enum(["none", "active", "expired"]).default("none"),
  warrantyExpiry: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const serviceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),
  features: z.array(z.string()).default([]),
  order: z.number().default(0),
  active: z.boolean().default(true),
});

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
  partnersTitle: z.string().optional(),
  partnersTitleVi: z.string().optional(),
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
  logo: z.string().optional(), // Optional because we can use logoData instead
});

// User management schema (flexible for both super admin and non-super admin)
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().optional(),
  displayName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(["superadmin", "admin", "editor"]).default("admin"),
  permissions: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

// Available permissions for dashboard sections
const AVAILABLE_PERMISSIONS = [
  { id: 'projects', label: 'Projects', labelVi: 'Dự Án' },
  { id: 'clients', label: 'Clients', labelVi: 'Khách Hàng' },
  { id: 'inquiries', label: 'Inquiries', labelVi: 'Yêu Cầu' },
  { id: 'articles', label: 'Articles', labelVi: 'Bài Viết' },
  { id: 'homepage', label: 'Homepage', labelVi: 'Trang Chủ' },
  { id: 'about', label: 'About', labelVi: 'Giới Thiệu' },
  { id: 'content', label: 'SEO', labelVi: 'SEO' },
];

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  page: z.string().min(1, "Page is required"), // "home" or "contact"
  language: z.string().default("en"),
  order: z.number().default(0),
  active: z.boolean().default(true),
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

const seoSettingsSchema = z.object({
  siteTitle: z.string().optional(),
  siteTitleVi: z.string().optional(),
  metaDescription: z.string().optional(),
  metaDescriptionVi: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaKeywordsVi: z.string().optional(),
});

const transactionSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  amount: z.string().min(1, "Amount is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  paymentDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

// Bilingual article schema for form
const bilingualArticleSchema = z.object({
  titleEn: z.string().optional(),
  titleVi: z.string().optional(),
  excerptEn: z.string().optional(),
  excerptVi: z.string().optional(),
  contentEn: z.string().optional(),
  contentVi: z.string().optional(),
  slug: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  featuredImage: z.string().optional(),
  metaTitleEn: z.string().optional(),
  metaTitleVi: z.string().optional(),
  metaDescriptionEn: z.string().optional(),
  metaDescriptionVi: z.string().optional(),
  metaKeywordsEn: z.string().optional(),
  metaKeywordsVi: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasEn = data.titleEn && data.titleEn.trim() && data.contentEn && data.contentEn.trim();
  const hasVi = data.titleVi && data.titleVi.trim() && data.contentVi && data.contentVi.trim();
  if (!hasEn && !hasVi) {
    const msg = "Cần nhập ít nhất 1 ngôn ngữ (tiêu đề + nội dung)";
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["titleEn"] });
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["titleVi"] });
  }
});

// Bilingual FAQ schema for form
const bilingualFaqSchema = z.object({
  questionEn: z.string().min(1, "English question is required"),
  questionVi: z.string().min(1, "Vietnamese question is required"),
  answerEn: z.string().min(1, "English answer is required"),
  answerVi: z.string().min(1, "Vietnamese answer is required"),
  page: z.string().min(1, "Page is required"),
});

// Advantage schema for form
const advantageSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  titleEn: z.string().min(1, "English title is required"),
  titleVi: z.string().min(1, "Vietnamese title is required"),
  descriptionEn: z.string().min(1, "English description is required"),
  descriptionVi: z.string().min(1, "Vietnamese description is required"),
  active: z.boolean().default(true),
});

// Journey Step schema for form
const journeyStepSchema = z.object({
  stepNumber: z.number().min(1, "Step number is required"),
  titleEn: z.string().min(1, "English title is required"),
  titleVi: z.string().min(1, "Vietnamese title is required"),
  descriptionEn: z.string().min(1, "English description is required"),
  descriptionVi: z.string().min(1, "Vietnamese description is required"),
  active: z.boolean().default(true),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type ClientFormData = z.infer<typeof clientSchema>;
type ServiceFormData = z.infer<typeof serviceSchema>;
type ArticleFormData = InsertArticle;
type BilingualArticleFormData = z.infer<typeof bilingualArticleSchema>;
type HomepageContentFormData = z.infer<typeof homepageContentSchema>;
type PartnerFormData = z.infer<typeof partnerSchema>;
type FaqFormData = z.infer<typeof faqSchema>;
type BilingualFaqFormData = z.infer<typeof bilingualFaqSchema>;
type AdvantageFormData = z.infer<typeof advantageSchema>;
type JourneyStepFormData = z.infer<typeof journeyStepSchema>;
type InteractionFormData = z.infer<typeof interactionSchema>;
type DealFormData = z.infer<typeof dealSchema>;
type TransactionFormData = z.infer<typeof transactionSchema>;

// Permission Denied Component
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
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isClientViewDialogOpen, setIsClientViewDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameVi, setNewCategoryNameVi] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; nameVi: string | null } | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState<"project" | "article">("article");
  const [referralOpen, setReferralOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  
  // User management states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [changePasswordUserId, setChangePasswordUserId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  
  // Partner Logo state
  const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null);
  const [partnerLogoPreview, setPartnerLogoPreview] = useState<string>('');

  // Quality Section Background Image state
  const [qualityBgFile, setQualityBgFile] = useState<File | null>(null);
  const [qualityBgPreview, setQualityBgPreview] = useState<string>('');

  // Quality Section 2 Background Image state
  const [quality2BgFile, setQuality2BgFile] = useState<File | null>(null);
  const [quality2BgPreview, setQuality2BgPreview] = useState<string>('');

  // FAQ state
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [isAdvantageDialogOpen, setIsAdvantageDialogOpen] = useState(false);
  const [editingAdvantage, setEditingAdvantage] = useState<any | null>(null);
  
  // Journey Step state
  const [isJourneyStepDialogOpen, setIsJourneyStepDialogOpen] = useState(false);
  const [editingJourneyStep, setEditingJourneyStep] = useState<JourneyStep | null>(null);

  // CRM Settings state
  const [isCrmSettingsDialogOpen, setIsCrmSettingsDialogOpen] = useState(false);
  
  // Category Management Dialog state
  const [isCategoryManagementDialogOpen, setIsCategoryManagementDialogOpen] = useState(false);
  const [deleteCategoryData, setDeleteCategoryData] = useState<{ id: number, name: string } | null>(null);
  const [isDeleteCategoryAlertOpen, setIsDeleteCategoryAlertOpen] = useState(false);

  // About Page states
  const [showcaseBannerFile, setShowcaseBannerFile] = useState<File | null>(null);
  const [showcaseBannerPreview, setShowcaseBannerPreview] = useState<string>('');
  const [historyImageFile, setHistoryImageFile] = useState<File | null>(null);
  const [historyImagePreview, setHistoryImagePreview] = useState<string>('');
  const [missionVisionImageFile, setMissionVisionImageFile] = useState<File | null>(null);
  const [missionVisionImagePreview, setMissionVisionImagePreview] = useState<string>('');
  const [teamMemberImageFile, setTeamMemberImageFile] = useState<File | null>(null);
  const [teamMemberImagePreview, setTeamMemberImagePreview] = useState<string>('');
  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);
  const [articleImagePreview, setArticleImagePreview] = useState<string>('');
  const [articleContentImages, setArticleContentImages] = useState<string[]>([]);
  const [isPrincipleDialogOpen, setIsPrincipleDialogOpen] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<AboutCoreValue | null>(null);
  const [isShowcaseServiceDialogOpen, setIsShowcaseServiceDialogOpen] = useState(false);
  const [editingShowcaseService, setEditingShowcaseService] = useState<AboutShowcaseService | null>(null);
  const [isProcessStepDialogOpen, setIsProcessStepDialogOpen] = useState(false);
  const [editingProcessStep, setEditingProcessStep] = useState<AboutProcessStep | null>(null);
  const [isTeamMemberDialogOpen, setIsTeamMemberDialogOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<AboutTeamMember | null>(null);
  const [togglingFeaturedSlug, setTogglingFeaturedSlug] = useState<string | null>(null);
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalProjects: number;
    activeClients: number;
    newInquiries: number;
    revenue: string;
  }>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries'],
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ['/api/articles', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/articles?status=all');
      if (!res.ok) throw new Error('Failed to fetch articles');
      return res.json();
    },
  });

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

  // Users query (without password)
  const { data: adminUsers = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
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

  // CRM Dropdown Settings Queries
  const { data: crmStages = [] } = useQuery<any[]>({
    queryKey: ['/api/crm-pipeline-stages'],
  });

  const { data: crmTiers = [] } = useQuery<any[]>({
    queryKey: ['/api/crm-customer-tiers'],
  });

  const { data: crmStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/crm-statuses'],
  });

  // About Page Content Queries
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

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions', editingClient?.id],
    queryFn: async () => {
      if (!editingClient?.id) return [];
      const response = await fetch(`/api/transactions?clientId=${editingClient.id}`);
      return response.json();
    },
    enabled: !!editingClient?.id,
  });

  // Query transactions for viewing client
  const { data: viewTransactions = [], isLoading: viewTransactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions', viewingClient?.id],
    queryFn: async () => {
      if (!viewingClient?.id) return [];
      const response = await fetch(`/api/transactions?clientId=${viewingClient.id}`);
      return response.json();
    },
    enabled: !!viewingClient?.id,
  });

  // Query for all transactions (for total revenue calculation)
  const { data: allTransactions = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      return response.json();
    },
  });

  // Settings/Logo query
  const { data: settings, isLoading: settingsLoading } = useQuery<SettingsType>({
    queryKey: ['/api/settings'],
  });

  // Pagination state for Clients
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Calculate pagination for Clients
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = clients.slice(startIndex, endIndex);

  // Reset to page 1 when clients change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [clients.length, currentPage, totalPages]);

  // Pagination state for Projects - group by slug, then paginate
  const [projectsPage, setProjectsPage] = useState(1);
  const projectsPerPage = 10;
  const groupedProjectsMap = projects.reduce((acc, project) => {
    const key = project.slug || project.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(project);
    return acc;
  }, {} as Record<string, Project[]>);
  const uniqueProjectSlugs = Object.keys(groupedProjectsMap).sort((a, b) => {
    const aDate = Math.max(...groupedProjectsMap[a].map(p => new Date(p.createdAt).getTime()));
    const bDate = Math.max(...groupedProjectsMap[b].map(p => new Date(p.createdAt).getTime()));
    return bDate - aDate;
  });
  const projectsTotalPages = Math.ceil(uniqueProjectSlugs.length / projectsPerPage);
  const projectsStartIndex = (projectsPage - 1) * projectsPerPage;
  const projectsEndIndex = projectsStartIndex + projectsPerPage;
  const paginatedProjectSlugs = uniqueProjectSlugs.slice(projectsStartIndex, projectsEndIndex);

  // Pagination state for Articles - group by slug first, then paginate
  const [articlesPage, setArticlesPage] = useState(1);
  const articlesPerPage = 10;
  
  // Group articles by slug to get unique articles (each article has EN + VI versions)
  const groupedArticlesMap = articles.reduce((acc, article) => {
    if (!acc[article.slug]) {
      acc[article.slug] = [];
    }
    acc[article.slug].push(article);
    return acc;
  }, {} as Record<string, Article[]>);
  
  const uniqueArticleSlugs = Object.keys(groupedArticlesMap).sort((a, b) => {
    const aFeatured = groupedArticlesMap[a].some(article => article.featured);
    const bFeatured = groupedArticlesMap[b].some(article => article.featured);
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return 0;
  });
  const articlesTotalPages = Math.ceil(uniqueArticleSlugs.length / articlesPerPage);
  const articlesStartIndex = (articlesPage - 1) * articlesPerPage;
  const articlesEndIndex = articlesStartIndex + articlesPerPage;
  const paginatedSlugs = uniqueArticleSlugs.slice(articlesStartIndex, articlesEndIndex);

  // Memoized client financial calculations (calculate once, reuse for all clients)
  const clientFinances = useMemo(() => {
    const finances: Record<string, { totalSpending: number; commission: number }> = {};
    
    // Group transactions by clientId for efficient calculation
    allTransactions.forEach((t: any) => {
      if (t.status !== "completed" || !t.clientId) return;
      
      if (!finances[t.clientId]) {
        finances[t.clientId] = { totalSpending: 0, commission: 0 };
      }
      
      const amount = parseFloat(t.amount || "0");
      
      if (t.type === "payment") {
        finances[t.clientId].totalSpending += amount;
      } else if (t.type === "refund") {
        finances[t.clientId].totalSpending -= amount;
      } else if (t.type === "commission") {
        finances[t.clientId].commission += amount;
      }
    });
    
    return finances;
  }, [allTransactions]);

  // Forms
  const projectForm = useForm<BilingualProjectFormData>({
    resolver: zodResolver(bilingualProjectSchema),
    defaultValues: {
      titleEn: "",
      titleVi: "",
      descriptionEn: "",
      descriptionVi: "",
      detailedDescriptionEn: "",
      detailedDescriptionVi: "",
      designPhilosophyTitleEn: "",
      designPhilosophyTitleVi: "",
      designPhilosophyEn: "",
      designPhilosophyVi: "",
      materialSelectionTitleEn: "",
      materialSelectionTitleVi: "",
      materialSelectionEn: "",
      materialSelectionVi: "",
      slug: "",
      category: "",
      status: "draft",
      locationEn: "",
      locationVi: "",
      areaEn: "",
      areaVi: "",
      durationEn: "",
      durationVi: "",
      styleEn: "",
      styleVi: "",
      designerEn: "",
      designerVi: "",
      completionYearEn: "",
      completionYearVi: "",
      // New image categories
      coverImages: [],
      contentImages: [],
      galleryImages: [],
      featured: false,
      // Legacy fields for backward compatibility
      heroImage: "",
      images: [],
      metaTitleEn: "",
      metaTitleVi: "",
      metaDescriptionEn: "",
      metaDescriptionVi: "",
      metaKeywordsEn: "",
      metaKeywordsVi: "",
    },
  });

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      dateOfBirth: "",
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

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "home",
      features: [],
      order: 0,
      active: true,
    },
  });

  const articleForm = useForm<BilingualArticleFormData>({
    resolver: zodResolver(bilingualArticleSchema),
    defaultValues: {
      titleEn: "",
      titleVi: "",
      excerptEn: "",
      excerptVi: "",
      contentEn: "",
      contentVi: "",
      slug: "",
      category: "news",
      status: "draft",
      featured: false,
      featuredImage: "",
      metaTitleEn: "",
      metaTitleVi: "",
      metaDescriptionEn: "",
      metaDescriptionVi: "",
      metaKeywordsEn: "",
      metaKeywordsVi: "",
    },
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
      partnersTitle: "",
      partnersTitleVi: "",
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

  // SEO Settings form
  type SeoSettingsFormData = z.infer<typeof seoSettingsSchema>;
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

  // Update SEO form when settings load
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

  // User form
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      email: "",
      role: "admin",
      permissions: [],
    },
  });

  const transactionForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      clientId: "",
      amount: "",
      title: "",
      description: "",
      type: "",
      status: "",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
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

  // About Page Forms
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

  // Update about content form when data loads
  useEffect(() => {
    if (aboutContent && !aboutContentForm.formState.isDirty) {
      aboutContentForm.reset(aboutContent);
    }
  }, [aboutContent, aboutContentForm]);

  // Update form when content loads
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
        partnersTitle: homepageContent.partnersTitle || "OUR PARTNERS",
        partnersTitleVi: homepageContent.partnersTitleVi || "ĐỐI TÁC CỦA CHÚNG TÔI",
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

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: "Đã tạo dự án thành công" });
      projectForm.reset();
      setIsProjectDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo dự án",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectFormData> }) => {
      const response = await apiRequest('PUT', `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Đã cập nhật dự án thành công" });
      setEditingProject(null);
      setIsProjectDialogOpen(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/projects/${id}`);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });
      const previousProjects = queryClient.getQueryData(['/api/projects']);
      queryClient.setQueryData(['/api/projects'], (old: any) => 
        old?.filter((p: any) => p.id !== id) || []
      );
      return { previousProjects };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['/api/projects'], context?.previousProjects);
      toast({ title: "Lỗi khi xóa dự án", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onSuccess: () => {
      toast({ title: "Đã xóa dự án thành công" });
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

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/inquiries/${id}`, { status });
      return response.json();
    },
    onMutate: async ({ id, status }) => {
      // Optimistic update for instant UI response
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
      toast({ 
        title: "Lỗi khi cập nhật yêu cầu",
        description: err.message, 
        variant: "destructive" 
      });
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
      toast({
        title: "Lỗi khi xóa yêu cầu",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHomepageContentMutation = useMutation({
    mutationFn: async (data: HomepageContentFormData) => {
      const response = await apiRequest('PUT', '/api/homepage-content', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/homepage-content', language] });
      homepageContentForm.reset(data);
      // Clear file upload states
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

  // Article Mutations
  const createArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const response = await apiRequest('POST', '/api/articles', data);
      return response.json();
    },
    onSuccess: (newArticle) => {
      // Optimistically add to cache instead of refetching
      queryClient.setQueryData(['/api/articles', 'all'], (old: any) => {
        if (!old) return [newArticle];
        return [newArticle, ...old];
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo bài viết",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Partner Mutations
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

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest('POST', '/api/users', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Đã tạo người dùng thành công" });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo người dùng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: UserFormData & { id: string }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Đã cập nhật người dùng thành công" });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật người dùng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Đã xóa người dùng thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa người dùng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, currentPassword, newPassword }: { id: string; currentPassword: string; newPassword: string }) => {
      const response = await apiRequest('POST', `/api/users/${id}/change-password`, { currentPassword, newPassword });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Đã đổi mật khẩu thành công" });
      setIsChangePasswordDialogOpen(false);
      setChangePasswordUserId(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi đổi mật khẩu",
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

  // About Page Content Mutations
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

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ArticleFormData> }) => {
      const response = await apiRequest('PUT', `/api/articles/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedArticle) => {
      // Optimistically update the cache instead of refetching
      queryClient.setQueryData(['/api/articles', 'all'], (old: any) => {
        if (!old) return old;
        return old.map((article: any) => 
          article.id === updatedArticle.id ? updatedArticle : article
        );
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật bài viết",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles', 'all'] });
      toast({ title: "Đã xóa bài viết thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa bài viết",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleArticleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const response = await apiRequest('PUT', `/api/articles/${id}`, { featured });
      return response.json();
    },
    onMutate: async ({ id, featured }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/articles', 'all'] });
      
      const previousArticles = queryClient.getQueryData(['/api/articles', 'all']);
      
      queryClient.setQueryData(['/api/articles', 'all'], (old: any) => {
        if (!old) return old;
        return old.map((article: any) => 
          article.id === id ? { ...article, featured } : article
        );
      });
      
      return { previousArticles };
    },
    onError: (error: any, variables, context: any) => {
      // Rollback on error
      if (context?.previousArticles) {
        queryClient.setQueryData(['/api/articles', 'all'], context.previousArticles);
      }
      toast({
        title: "Lỗi khi cập nhật bài viết",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles', 'all'] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; nameVi?: string; type: string; slug: string }) => {
      const response = await apiRequest('POST', '/api/categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Đã tạo danh mục thành công" });
      setNewCategoryName("");
      setNewCategoryNameVi("");
      setIsCategoryDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo danh mục",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Đã xóa danh mục thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa danh mục",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; nameVi?: string }) => {
      const response = await apiRequest('PATCH', `/api/categories/${data.id}`, { name: data.name, nameVi: data.nameVi });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Đã cập nhật danh mục thành công" });
      setEditingCategory(null);
      setIsEditCategoryDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật danh mục",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Transaction mutations
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

  // Settings mutation (Logo, SEO, etc.)
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', '/api/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({
        title: language === 'vi' ? "Lỗi" : "Error",
        description: language === 'vi' ? "Không thể cập nhật cài đặt" : "Failed to update settings",
        variant: "destructive"
      });
    }
  });

  // Handlers
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    
    // Find both language versions by slug
    const enVersion = projects.find(p => p.slug === project.slug && p.language === 'en');
    const viVersion = projects.find(p => p.slug === project.slug && p.language === 'vi');
    
    projectForm.reset({
      titleEn: enVersion?.title || "",
      titleVi: viVersion?.title || "",
      descriptionEn: enVersion?.description || "",
      descriptionVi: viVersion?.description || "",
      detailedDescriptionEn: enVersion?.detailedDescription || "",
      detailedDescriptionVi: viVersion?.detailedDescription || "",
      designPhilosophyTitleEn: enVersion?.designPhilosophyTitle || "",
      designPhilosophyTitleVi: viVersion?.designPhilosophyTitle || "",
      designPhilosophyEn: enVersion?.designPhilosophy || "",
      designPhilosophyVi: viVersion?.designPhilosophy || "",
      materialSelectionTitleEn: enVersion?.materialSelectionTitle || "",
      materialSelectionTitleVi: viVersion?.materialSelectionTitle || "",
      materialSelectionEn: enVersion?.materialSelection || "",
      materialSelectionVi: viVersion?.materialSelection || "",
      metaTitleEn: enVersion?.metaTitle || "",
      metaTitleVi: viVersion?.metaTitle || "",
      metaDescriptionEn: enVersion?.metaDescription || "",
      metaDescriptionVi: viVersion?.metaDescription || "",
      metaKeywordsEn: enVersion?.metaKeywords || "",
      metaKeywordsVi: viVersion?.metaKeywords || "",
      slug: project.slug || "",
      category: project.category,
      status: (project as any).status || "draft",
      locationEn: enVersion?.location || "",
      locationVi: viVersion?.location || "",
      areaEn: enVersion?.area || "",
      areaVi: viVersion?.area || "",
      durationEn: enVersion?.duration || "",
      durationVi: viVersion?.duration || "",
      styleEn: enVersion?.style || "",
      styleVi: viVersion?.style || "",
      designerEn: enVersion?.designer || "",
      designerVi: viVersion?.designer || "",
      completionYearEn: enVersion?.completionYear || "",
      completionYearVi: viVersion?.completionYear || "",
      // New image categories
      coverImages: Array.isArray(project.coverImages) ? project.coverImages : [],
      contentImages: Array.isArray(project.contentImages) ? project.contentImages : [],
      galleryImages: Array.isArray(project.galleryImages) ? project.galleryImages : [],
      featured: project.featured,
      // Legacy fields for backward compatibility
      heroImage: project.heroImage || "",
      images: Array.isArray(project.images) ? project.images : [],
    });
    setIsProjectDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    
    // Format dates for input[type="date"] which expects YYYY-MM-DD
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
      dateOfBirth: formatDateForInput(client.dateOfBirth),
      stage: client.stage as "lead" | "prospect" | "contract" | "delivery" | "aftercare",
      status: client.status as "active" | "inactive" | "archived",
      tier: client.tier as "silver" | "gold" | "platinum" | "vip",
      totalSpending: client.totalSpending || "0",
      refundAmount: client.refundAmount || "0",
      commission: client.commission || "0",
      orderCount: client.orderCount || 0,
      referredById: client.referredById || "",
      referralCount: client.referralCount || 0,
      referralRevenue: client.referralRevenue || "0",
      warrantyStatus: (client.warrantyStatus as "none" | "active" | "expired") || "none",
      warrantyExpiry: formatDateForInput(client.warrantyExpiry),
      tags: (client.tags as string[]) || [],
      notes: client.notes || "",
    });
    setIsClientDialogOpen(true);
  };

  const onProjectSubmit = async (data: BilingualProjectFormData) => {
    try {
      setIsProjectSubmitting(true);
      
      const hasEn = data.titleEn && data.titleEn.trim();
      const hasVi = data.titleVi && data.titleVi.trim();

      const toSlug = (str: string) => {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd').replace(/Đ/g, 'd')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };
      const slugSource = data.slug || (hasEn ? data.titleEn! : data.titleVi!);
      const slug = toSlug(slugSource);

      const mutations: Promise<any>[] = [];

      if (hasEn) {
        const enProject = {
          title: data.titleEn!,
          slug: slug,
          description: data.descriptionEn,
          detailedDescription: data.detailedDescriptionEn,
          designPhilosophyTitle: data.designPhilosophyTitleEn,
          designPhilosophy: data.designPhilosophyEn,
          materialSelectionTitle: data.materialSelectionTitleEn,
          materialSelection: data.materialSelectionEn,
          category: data.category,
          status: data.status,
          location: data.locationEn,
          area: data.areaEn,
          duration: data.durationEn,
          style: data.styleEn,
          designer: data.designerEn,
          completionYear: data.completionYearEn,
          coverImages: data.coverImages,
          contentImages: data.contentImages,
          galleryImages: data.galleryImages,
          featured: data.featured,
          heroImage: data.heroImage,
          images: data.images,
          metaTitle: data.metaTitleEn,
          metaDescription: data.metaDescriptionEn,
          metaKeywords: data.metaKeywordsEn,
          language: 'en' as const,
        };

        if (editingProject) {
          const enVersion = projects.find(p => p.slug === editingProject.slug && p.language === 'en');
          mutations.push(enVersion
            ? apiRequest('PUT', `/api/projects/${enVersion.id}`, enProject)
            : createProjectMutation.mutateAsync(enProject));
        } else {
          mutations.push(createProjectMutation.mutateAsync(enProject));
        }
      } else if (editingProject) {
        const enVersion = projects.find(p => p.slug === editingProject.slug && p.language === 'en');
        if (enVersion) {
          mutations.push(deleteProjectMutation.mutateAsync(enVersion.id));
        }
      }

      if (hasVi) {
        const viProject = {
          title: data.titleVi!,
          slug: slug,
          description: data.descriptionVi,
          detailedDescription: data.detailedDescriptionVi,
          designPhilosophyTitle: data.designPhilosophyTitleVi,
          designPhilosophy: data.designPhilosophyVi,
          materialSelectionTitle: data.materialSelectionTitleVi,
          materialSelection: data.materialSelectionVi,
          category: data.category,
          status: data.status,
          location: data.locationVi,
          area: data.areaVi,
          duration: data.durationVi,
          style: data.styleVi,
          designer: data.designerVi,
          completionYear: data.completionYearVi,
          coverImages: data.coverImages,
          contentImages: data.contentImages,
          galleryImages: data.galleryImages,
          featured: data.featured,
          heroImage: data.heroImage,
          images: data.images,
          metaTitle: data.metaTitleVi,
          metaDescription: data.metaDescriptionVi,
          metaKeywords: data.metaKeywordsVi,
          language: 'vi' as const,
        };

        if (editingProject) {
          const viVersion = projects.find(p => p.slug === editingProject.slug && p.language === 'vi');
          mutations.push(viVersion
            ? apiRequest('PUT', `/api/projects/${viVersion.id}`, viProject)
            : createProjectMutation.mutateAsync(viProject));
        } else {
          mutations.push(createProjectMutation.mutateAsync(viProject));
        }
      } else if (editingProject) {
        const viVersion = projects.find(p => p.slug === editingProject.slug && p.language === 'vi');
        if (viVersion) {
          mutations.push(deleteProjectMutation.mutateAsync(viVersion.id));
        }
      }

      await Promise.all(mutations);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      setIsProjectDialogOpen(false);
      setEditingProject(null);
      projectForm.reset();
      toast({ title: "Đã lưu dự án thành công" });
    } catch (error: any) {
      toast({
        title: "Lỗi khi lưu dự án",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setIsProjectSubmitting(false);
    }
  };

  const onClientSubmit = async (data: ClientFormData) => {
    try {
      // Auto-calculate warranty status based on expiry date
      let warrantyStatus: "none" | "active" | "expired" = "none";
      if (data.warrantyExpiry && data.warrantyExpiry.trim() !== "") {
        const expiryDate = new Date(data.warrantyExpiry);
        const now = new Date();
        warrantyStatus = expiryDate < now ? "expired" : "active";
      }

      // Clean up empty strings for optional date fields
      const cleanedData = {
        ...data,
        warrantyStatus, // Auto-set based on expiry date
        dateOfBirth: data.dateOfBirth && data.dateOfBirth.trim() !== "" ? data.dateOfBirth : undefined,
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
    } catch (error) {
      // Error is handled by mutation's onError handler
    }
  };

  const onHomepageContentSubmit = async (data: HomepageContentFormData) => {
    const submitData = { ...data };
    
    try {
      // Handle both quality background images if uploaded
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
      // Error is handled by mutation's onError handler
    }
  };

  // SEO Settings submit handler
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
      toast({
        title: language === 'vi' ? "Thành công" : "Success",
        description: language === 'vi' ? "Đã lưu cài đặt SEO" : "SEO settings saved successfully",
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    
    // Find both language versions by slug
    const enVersion = articles.find(a => a.slug === article.slug && a.language === 'en');
    const viVersion = articles.find(a => a.slug === article.slug && a.language === 'vi');
    
    articleForm.reset({
      titleEn: enVersion?.title || "",
      titleVi: viVersion?.title || "",
      excerptEn: enVersion?.excerpt || "",
      excerptVi: viVersion?.excerpt || "",
      contentEn: enVersion?.content || "",
      contentVi: viVersion?.content || "",
      slug: article.slug,
      category: article.category,
      status: article.status as "draft" | "published" | "archived",
      featured: article.featured,
      featuredImage: article.featuredImage || "",
      metaTitleEn: enVersion?.metaTitle || "",
      metaTitleVi: viVersion?.metaTitle || "",
      metaDescriptionEn: enVersion?.metaDescription || "",
      metaDescriptionVi: viVersion?.metaDescription || "",
      metaKeywordsEn: enVersion?.metaKeywords || "",
      metaKeywordsVi: viVersion?.metaKeywords || "",
    });
    
    // Set featured image preview if exists (check both new and old format)
    const previewImage = enVersion?.featuredImage || enVersion?.featuredImageData || article.featuredImage || article.featuredImageData;
    if (previewImage) {
      setArticleImagePreview(previewImage);
    } else {
      setArticleImagePreview('');
    }
    
    // Set content images if exists
    const contentImages = (enVersion?.contentImages || article.contentImages || []) as string[];
    setArticleContentImages(contentImages);
    
    setIsArticleDialogOpen(true);
  };

  const onArticleSubmit = async (data: BilingualArticleFormData) => {
    try {
      const hasEn = data.titleEn && data.titleEn.trim() && data.contentEn && data.contentEn.trim();
      const hasVi = data.titleVi && data.titleVi.trim() && data.contentVi && data.contentVi.trim();

      const toSlug = (str: string) => {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd').replace(/Đ/g, 'd')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };
      const slugSource = data.slug || (hasEn ? data.titleEn! : data.titleVi!);
      const slug = toSlug(slugSource);

      const featuredImg = articleImagePreview || data.featuredImage || undefined;

      const mutations: Promise<any>[] = [];

      if (hasEn) {
        const enArticle: InsertArticle = {
          title: data.titleEn!,
          slug: slug,
          excerpt: data.excerptEn,
          content: data.contentEn!,
          category: data.category,
          status: data.status,
          language: 'en',
          featured: data.featured,
          featuredImage: featuredImg,
          metaTitle: data.metaTitleEn,
          metaDescription: data.metaDescriptionEn,
          metaKeywords: data.metaKeywordsEn,
          tags: [],
          contentImages: articleContentImages.length > 0 ? articleContentImages as any : undefined,
        };

        if (editingArticle) {
          const enVersion = articles.find(a => a.slug === editingArticle.slug && a.language === 'en');
          mutations.push(enVersion 
            ? updateArticleMutation.mutateAsync({ id: enVersion.id, data: enArticle })
            : createArticleMutation.mutateAsync(enArticle));
        } else {
          mutations.push(createArticleMutation.mutateAsync(enArticle));
        }
      } else if (editingArticle) {
        const enVersion = articles.find(a => a.slug === editingArticle.slug && a.language === 'en');
        if (enVersion) {
          mutations.push(deleteArticleMutation.mutateAsync(enVersion.id));
        }
      }

      if (hasVi) {
        const viArticle: InsertArticle = {
          title: data.titleVi!,
          slug: slug,
          excerpt: data.excerptVi,
          content: data.contentVi!,
          category: data.category,
          status: data.status,
          language: 'vi',
          featured: data.featured,
          featuredImage: featuredImg,
          metaTitle: data.metaTitleVi,
          metaDescription: data.metaDescriptionVi,
          metaKeywords: data.metaKeywordsVi,
          tags: [],
          contentImages: articleContentImages.length > 0 ? articleContentImages as any : undefined,
        };

        if (editingArticle) {
          const viVersion = articles.find(a => a.slug === editingArticle.slug && a.language === 'vi');
          mutations.push(viVersion
            ? updateArticleMutation.mutateAsync({ id: viVersion.id, data: viArticle })
            : createArticleMutation.mutateAsync(viArticle));
        } else {
          mutations.push(createArticleMutation.mutateAsync(viArticle));
        }
      } else if (editingArticle) {
        const viVersion = articles.find(a => a.slug === editingArticle.slug && a.language === 'vi');
        if (viVersion) {
          mutations.push(deleteArticleMutation.mutateAsync(viVersion.id));
        }
      }

      await Promise.all(mutations);

      // Reset form and close dialog after all mutations complete
      articleForm.reset();
      setEditingArticle(null);
      setArticleImagePreview('');
      setArticleImageFile(null);
      setArticleContentImages([]);
      setIsArticleDialogOpen(false);
      
      // Show success toast after all updates complete
      toast({ title: "Article updated successfully" });
    } catch (error) {
      // Error handling is done in mutation's onError
      console.error('Article submit error:', error);
    }
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    partnerForm.reset({
      name: partner.name,
      logo: partner.logo || "",
    });
    // Set logo preview if partner has logoData
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
      
      // Add logo fields only if they have values
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
      
      // Reset file states
      setPartnerLogoFile(null);
      setPartnerLogoPreview('');
    } catch (error) {
      // Error is handled by mutation's onError handler
    }
  };

  const handleEditFaq = (group: { en: Faq | null, vi: Faq | null, order: number }) => {
    // Set the EN version as editingFaq to track which pair we're editing
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
      // When creating new FAQ, find the max order and add 1
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
        // Find both EN and VI versions to update
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
        // Create both versions
        await Promise.all([
          createFaqMutation.mutateAsync(enData),
          createFaqMutation.mutateAsync(viData),
        ]);
      }
      
      setEditingFaq(null);
      setIsFaqDialogOpen(false);
    } catch (error) {
      // Error is handled by mutation's onError handler
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
      // When creating new advantage, find the max order and add 1
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
      // Error is handled by mutation's onError handler
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
      // When creating new journey step, find the max order and add 1
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
      // Error is handled by mutation's onError handler
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
      
      // Upload to server
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

  const handleArticleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setArticleImageFile(file);
      
      // Upload to server
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
        setArticleImagePreview(data.path); // Store short path instead of base64
        
        toast({
          title: "Upload thành công",
          description: "Ảnh đã được upload"
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

  const handleContentImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSizeMB = 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const maxImages = 10;
    
    if (articleContentImages.length + files.length > maxImages) {
      toast({
        title: "Quá giới hạn",
        description: `Tối đa ${maxImages} ảnh. Hiện có ${articleContentImages.length} ảnh.`,
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    const validFiles: File[] = [];
    
    for (const file of files) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSizeBytes) {
        toast({
          title: "File quá lớn",
          description: `${file.name}: ${fileSizeMB}MB. Giới hạn: ${maxSizeMB}MB.`,
          variant: "destructive"
        });
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    // Upload files to server
    const uploadPromises = validFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }
      
      const data = await response.json();
      return data.path;
    });

    try {
      const uploadedPaths = await Promise.all(uploadPromises);
      setArticleContentImages(prev => [...prev, ...uploadedPaths]);
      toast({
        title: "Upload thành công",
        description: `Đã upload ${uploadedPaths.length} ảnh`
      });
      e.target.value = '';
    } catch (error) {
      toast({
        title: "Lỗi upload",
        description: error instanceof Error ? error.message : "Không thể upload ảnh",
        variant: "destructive"
      });
      e.target.value = '';
    }
  };

  const removeContentImage = (index: number) => {
    setArticleContentImages(prev => prev.filter((_, i) => i !== index));
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

  const handleShowcaseBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSizeBytes) {
        toast({
          title: "File too large",
          description: `File size: ${fileSizeMB}MB. Maximum: ${maxSizeMB}MB. Please select a smaller file.`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setShowcaseBannerFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        setShowcaseBannerPreview(data.path);
        
        toast({
          title: "Upload successful",
          description: "Banner image uploaded"
        });
      } catch (error) {
        toast({
          title: "Lỗi upload",
          description: "Failed to upload image",
          variant: "destructive"
        });
        e.target.value = '';
      }
    }
  };

  const handleHistoryImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSizeBytes) {
        toast({
          title: "File too large",
          description: `File size: ${fileSizeMB}MB. Maximum: ${maxSizeMB}MB. Please select a smaller file.`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setHistoryImageFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        setHistoryImagePreview(data.path);
        
        toast({
          title: "Upload successful",
          description: "History image uploaded"
        });
      } catch (error) {
        toast({
          title: "Lỗi upload",
          description: "Failed to upload image",
          variant: "destructive"
        });
        e.target.value = '';
      }
    }
  };

  const handleMissionVisionImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSizeBytes) {
        toast({
          title: "File too large",
          description: `File size: ${fileSizeMB}MB. Maximum: ${maxSizeMB}MB. Please select a smaller file.`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setMissionVisionImageFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        setMissionVisionImagePreview(data.path);
        
        toast({
          title: "Upload successful",
          description: "Mission vision image uploaded"
        });
      } catch (error) {
        toast({
          title: "Lỗi upload",
          description: "Failed to upload image",
          variant: "destructive"
        });
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
        submitData.historyImageData = null;
      }
      if (missionVisionImagePreview) {
        submitData.missionVisionImage = missionVisionImagePreview;
        submitData.missionVisionImageData = null;
      }
      await updateAboutContentMutation.mutateAsync(submitData);
    } catch (error) {
      // Error is handled by mutation's onError handler
    }
  };

  const onPrincipleSubmit = async (data: InsertAboutCoreValue) => {
    try {
      if (editingPrinciple) {
        await updatePrincipleMutation.mutateAsync({ id: editingPrinciple.id, data });
      } else {
        await createPrincipleMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is handled by mutation's onError handler
    }
  };

  const onShowcaseServiceSubmit = async (data: InsertAboutShowcaseService) => {
    try {
      if (editingShowcaseService) {
        await updateShowcaseServiceMutation.mutateAsync({ id: editingShowcaseService.id, data });
      } else {
        await createShowcaseServiceMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is handled by mutation's onError handler
    }
  };

  const onProcessStepSubmit = async (data: InsertAboutProcessStep) => {
    try {
      if (editingProcessStep) {
        await updateProcessStepMutation.mutateAsync({ id: editingProcessStep.id, data });
      } else {
        await createProcessStepMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is handled by mutation's onError handler
    }
  };

  const handleTeamMemberImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSizeBytes) {
        toast({
          title: "File too large",
          description: `File size: ${fileSizeMB}MB. Maximum: ${maxSizeMB}MB. Please select a smaller file.`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setTeamMemberImageFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        setTeamMemberImagePreview(data.path);
        
        toast({
          title: "Upload successful",
          description: "Team member image uploaded"
        });
      } catch (error) {
        toast({
          title: "Lỗi upload",
          description: "Failed to upload image",
          variant: "destructive"
        });
        e.target.value = '';
      }
    }
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
    } catch (error) {
      // Error is handled by mutation's onError handler
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
    });
    setIsTransactionDialogOpen(true);
  };

  const onTransactionSubmit = async (data: TransactionFormData) => {
    try {
      if (editingTransaction) {
        await updateTransactionMutation.mutateAsync({ id: editingTransaction.id, data });
      } else {
        await createTransactionMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is handled by mutation's onError handler
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

  if (activeTab === 'overview') {
    // Overview is accessible to everyone
    return (
      <div className="space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div className="flex items-center justify-between">
                <div className="min-w-[120px]">
                  <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Tổng Dự Án' : 'Total Projects'}</p>
                  <p className="text-2xl font-light" data-testid="stat-total-projects">
                    {statsLoading ? "..." : stats?.totalProjects || 0}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-white/70" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div className="flex items-center justify-between">
                <div className="min-w-[120px]">
                  <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Khách Hàng' : 'Active Clients'}</p>
                  <p className="text-2xl font-light" data-testid="stat-active-clients">
                    {statsLoading ? "..." : stats?.activeClients || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-white/70" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div className="flex items-center justify-between">
                <div className="min-w-[120px]">
                  <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Yêu Cầu Mới' : 'New Inquiries'}</p>
                  <p className="text-2xl font-light" data-testid="stat-new-inquiries">
                    {statsLoading ? "..." : stats?.newInquiries || 0}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-white/70" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 min-h-[90px]">
              <div className="flex items-center justify-between">
                <div className="min-w-[120px]">
                  <p className="text-sm font-light text-muted-foreground">{language === 'vi' ? 'Doanh Thu (Năm)' : 'Revenue (YTD)'}</p>
                  <p className="text-2xl font-light" data-testid="stat-revenue">
                    {statsLoading ? "..." : stats?.revenue || "0 ₫"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-white/70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
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
                {inquiries.slice(0, 5).map((inquiry) => (
                  <div key={inquiry.id} className="flex items-center justify-between py-3 border-b border-white/20">
                    <div>
                      <p className="font-light">
                        {language === 'vi' ? 'Yêu cầu mới từ' : 'New inquiry from'} {inquiry.firstName} {inquiry.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(inquiry.createdAt)} • {inquiry.projectType}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-sm px-3 py-1 text-white border-white/30">
                      {inquiry.status}
                    </Badge>
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
    if (!hasPermission(user, 'projects')) {
      return <PermissionDenied feature="Projects" />;
    }
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Dự Án' : 'Projects Management'}</h2>
          <div className="flex gap-2">
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-project" className="h-10 px-4 min-w-[140px] justify-center">
                  <Plus className="mr-2 h-4 w-4" />
                  {language === 'vi' ? 'Thêm Dự Án' : 'Add Project'}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? (language === 'vi' ? 'Chỉnh Sửa Dự Án' : 'Edit Project') : (language === 'vi' ? 'Thêm Dự Án Mới' : 'Add New Project')}
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 px-1">
              <Form {...projectForm}>
                <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6">

                  {/* Bilingual Title */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="titleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề (Tiếng Anh)' : 'Title (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={100} data-testid="input-project-title-en" placeholder={language === 'vi' ? 'Nhập tiêu đề tiếng Anh...' : 'Enter English title...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="titleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề (Tiếng Việt)' : 'Title (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={100} data-testid="input-project-title-vi" placeholder="Nhập tiêu đề tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="descriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Mô Tả (Tiếng Anh)' : 'Description (English)'} <span className="text-muted-foreground text-xs font-normal">- Max 200</span></FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} maxLength={200} data-testid="textarea-project-description-en" placeholder={language === 'vi' ? 'Nhập mô tả tiếng Anh...' : 'Enter English description...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="descriptionVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Mô Tả (Tiếng Việt)' : 'Description (Vietnamese)'} <span className="text-muted-foreground text-xs font-normal">- Tối đa 200</span></FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} maxLength={200} data-testid="textarea-project-description-vi" placeholder="Nhập mô tả tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Detailed Description */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Format: *text* = bold, **text** = heading, ***text*** = heading + bold</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={projectForm.control}
                        name="detailedDescriptionEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Mô Tả Chi Tiết (Tiếng Anh)' : 'Detailed Description (English)'} <span className="text-muted-foreground text-xs font-normal">- Max 1500</span></FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={5} maxLength={1500} data-testid="textarea-project-detailed-description-en" placeholder={language === 'vi' ? 'Nhập nội dung chi tiết tiếng Anh...' : 'Enter detailed English content...'} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="detailedDescriptionVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Mô Tả Chi Tiết (Tiếng Việt)' : 'Detailed Description (Vietnamese)'} <span className="text-muted-foreground text-xs font-normal">- Tối đa 1500</span></FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={5} maxLength={1500} data-testid="textarea-project-detailed-description-vi" placeholder="Nhập nội dung chi tiết tiếng Việt..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Bilingual Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="locationEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Vị Trí (Tiếng Anh)' : 'Location (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-location-en" placeholder={language === 'vi' ? 'Nhập vị trí tiếng Anh...' : 'Enter location...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="locationVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Vị Trí (Tiếng Việt)' : 'Location (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-location-vi" placeholder="Nhập vị trí tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="areaEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Diện Tích (Tiếng Anh)' : 'Area (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-area-en" placeholder={language === 'vi' ? 'Nhập diện tích...' : 'Enter area...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="areaVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Diện Tích (Tiếng Việt)' : 'Area (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-area-vi" placeholder="Nhập diện tích tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="durationEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Thời Gian (Tiếng Anh)' : 'Duration (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-duration-en" placeholder={language === 'vi' ? 'Nhập thời gian...' : 'Enter duration...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="durationVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Thời Gian (Tiếng Việt)' : 'Duration (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-duration-vi" placeholder="Nhập thời gian tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="styleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Phong Cách (Tiếng Anh)' : 'Style (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-style-en" placeholder={language === 'vi' ? 'Nhập phong cách...' : 'Enter style...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="styleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Phong Cách (Tiếng Việt)' : 'Style (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-style-vi" placeholder="Nhập phong cách tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Designer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="designerEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Nhà Thiết Kế (Tiếng Anh)' : 'Interior Designer (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-designer-en" placeholder={language === 'vi' ? 'Nhập tên nhà thiết kế...' : 'Enter designer name...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="designerVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Nhà Thiết Kế (Tiếng Việt)' : 'Interior Designer (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-designer-vi" placeholder="Nhập tên nhà thiết kế tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Completion Year */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="completionYearEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Năm Hoàn Thành (Tiếng Anh)' : 'Completion Year (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-year-en" placeholder={language === 'vi' ? 'Nhập năm hoàn thành...' : 'Enter completion year...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="completionYearVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Năm Hoàn Thành (Tiếng Việt)' : 'Completion Year (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-project-year-vi" placeholder="Nhập năm hoàn thành tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Design Philosophy */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-light">{language === 'vi' ? 'Triết Lý Thiết Kế' : 'Design Philosophy Section'}</h4>
                      <p className="text-xs text-muted-foreground">Format: **text** = heading, *text* = bold, ***text*** = heading + bold</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={projectForm.control}
                        name="designPhilosophyTitleEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tiêu Đề Mục (Tiếng Anh)' : 'Section Title (English)'}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Design Philosophy" data-testid="input-project-design-philosophy-title-en" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="designPhilosophyTitleVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tiêu Đề Mục (Tiếng Việt)' : 'Section Title (Vietnamese)'}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Triết lý thiết kế" data-testid="input-project-design-philosophy-title-vi" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={projectForm.control}
                        name="designPhilosophyEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Nội Dung (Tiếng Anh)' : 'Content (English)'} <span className="text-muted-foreground text-xs font-normal">- Max 800</span></FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} maxLength={800} placeholder="**Heading** Normal text *bold text*..." data-testid="textarea-project-design-philosophy-en" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="designPhilosophyVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Nội Dung (Tiếng Việt)' : 'Content (Vietnamese)'} <span className="text-muted-foreground text-xs font-normal">- Tối đa 800</span></FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} maxLength={800} placeholder="**Tiêu đề** Nội dung bình thường *in đậm*..." data-testid="textarea-project-design-philosophy-vi" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Bilingual Material Selection */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-light">{language === 'vi' ? 'Lựa Chọn Vật Liệu' : 'Material Selection Section'}</h4>
                      <p className="text-xs text-muted-foreground">Format: **text** = heading, *text* = bold, ***text*** = heading + bold</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={projectForm.control}
                        name="materialSelectionTitleEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tiêu Đề Mục (Tiếng Anh)' : 'Section Title (English)'}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Material Selection" data-testid="input-project-material-selection-title-en" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="materialSelectionTitleVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tiêu Đề Mục (Tiếng Việt)' : 'Section Title (Vietnamese)'}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Lựa chọn vật liệu" data-testid="input-project-material-selection-title-vi" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={projectForm.control}
                        name="materialSelectionEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Nội Dung (Tiếng Anh)' : 'Content (English)'} <span className="text-muted-foreground text-xs font-normal">- Max 800</span></FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} maxLength={800} placeholder="**Heading** Normal text *bold text*..." data-testid="textarea-project-material-selection-en" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="materialSelectionVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Nội Dung (Tiếng Việt)' : 'Content (Vietnamese)'} <span className="text-muted-foreground text-xs font-normal">- Tối đa 800</span></FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} maxLength={800} placeholder="**Tiêu đề** Nội dung bình thường *in đậm*..." data-testid="textarea-project-material-selection-vi" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Hình Ảnh */}
                  <FormField
                    control={projectForm.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hình Ảnh Card (Hiển thị trên Card dự án)</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            multiple={false}
                            maxImages={1}
                            disabled={!hasPermission(user, 'projects')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={projectForm.control}
                    name="coverImages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ảnh Bìa (Tối đa 2 ảnh, tỷ lệ 3:4)</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            multiple
                            maxImages={2}
                            disabled={!hasPermission(user, 'projects')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={projectForm.control}
                    name="contentImages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ảnh Nội Dung (2 ảnh, tỷ lệ 16:9 hoặc 1:1)</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            multiple
                            maxImages={2}
                            disabled={!hasPermission(user, 'projects')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={projectForm.control}
                    name="galleryImages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thư Viện Ảnh (Tối đa 10 ảnh, tỷ lệ 16:9 hoặc 1:1)</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            multiple
                            disabled={!hasPermission(user, 'projects')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* THÔNG TIN CHUNG */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4 uppercase tracking-wide">Thông Tin Chung</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={projectForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-project-slug" placeholder="tự động tạo" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Danh Mục *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-project-category">
                                  <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories
                                  .filter(cat => cat.type === 'project' && cat.active)
                                  .map((category) => (
                                    <SelectItem key={category.id} value={category.slug}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trạng Thái *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-project-status">
                                  <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Bản Nháp</SelectItem>
                                <SelectItem value="published">Đã Đăng</SelectItem>
                                <SelectItem value="archived">Lưu Trữ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* CÀI ĐẶT SEO */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4 uppercase tracking-wide">Cài Đặt SEO</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase">SEO Tiếng Anh</h4>
                        <FormField
                          control={projectForm.control}
                          name="metaTitleEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Title (EN) <span className="text-muted-foreground text-xs font-normal">- Tối đa 60</span></FormLabel>
                              <FormControl>
                                <Input {...field} maxLength={60} placeholder="Tiêu đề SEO tiếng Anh..." data-testid="input-project-meta-title-en" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="metaDescriptionEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Description (EN) <span className="text-muted-foreground text-xs font-normal">- Tối đa 160</span></FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={2} maxLength={160} placeholder="Mô tả SEO tiếng Anh..." data-testid="textarea-project-meta-description-en" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="metaKeywordsEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Keywords (EN) <span className="text-muted-foreground text-xs font-normal">- Tối đa 200</span></FormLabel>
                              <FormControl>
                                <Input {...field} maxLength={200} placeholder="từ khóa 1, từ khóa 2, từ khóa 3..." data-testid="input-project-meta-keywords-en" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase">SEO Tiếng Việt</h4>
                        <FormField
                          control={projectForm.control}
                          name="metaTitleVi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Title (VI) <span className="text-muted-foreground text-xs font-normal">- Tối đa 60</span></FormLabel>
                              <FormControl>
                                <Input {...field} maxLength={60} placeholder="Tiêu đề SEO tiếng Việt..." data-testid="input-project-meta-title-vi" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="metaDescriptionVi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Description (VI) <span className="text-muted-foreground text-xs font-normal">- Tối đa 160</span></FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={2} maxLength={160} placeholder="Mô tả SEO tiếng Việt..." data-testid="textarea-project-meta-description-vi" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="metaKeywordsVi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Keywords (VI) <span className="text-muted-foreground text-xs font-normal">- Tối đa 200</span></FormLabel>
                              <FormControl>
                                <Input {...field} maxLength={200} placeholder="từ khóa 1, từ khóa 2, từ khóa 3..." data-testid="input-project-meta-keywords-vi" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    * Cần nhập ít nhất 1 ngôn ngữ (tiêu đề bắt buộc)
                  </p>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsProjectDialogOpen(false);
                        setEditingProject(null);
                        projectForm.reset();
                      }}
                      className="h-10 px-4"
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isProjectSubmitting || createProjectMutation.isPending}
                      data-testid="button-save-project"
                      className="h-10 px-4"
                    >
                      {editingProject ? 'Cập Nhật' : 'Tạo Mới'}
                    </Button>
                  </div>
                </form>
              </Form>
              </div>
            </DialogContent>
          </Dialog>
            <Button
              variant="outline"
              onClick={() => setIsCategoryManagementDialogOpen(true)}
              data-testid="button-category-settings-projects"
              className="h-10 px-4 min-w-[160px] justify-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Cài Đặt' : 'Settings'}
            </Button>
          </div>
        </div>

        {/* Category Management Dialog for Projects */}
        <Dialog open={isCategoryManagementDialogOpen} onOpenChange={setIsCategoryManagementDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light">{language === 'vi' ? 'Quản Lý Danh Mục Dự Án' : 'Project Categories Management'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-category">
                      <Plus className="mr-2 h-4 w-4" />
                      {language === 'vi' ? 'Thêm Danh Mục' : 'Add Project Category'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === 'vi' ? 'Thêm Danh Mục Mới' : 'Add New Project Category'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">{language === 'vi' ? 'Tên Danh Mục (Tiếng Anh)' : 'Category Name (English)'}</label>
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder={language === 'vi' ? 'Nhập tên danh mục tiếng Anh' : 'Enter category name in English'}
                          data-testid="input-category-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{language === 'vi' ? 'Tên Danh Mục (Tiếng Việt)' : 'Category Name (Vietnamese)'}</label>
                        <Input
                          value={newCategoryNameVi}
                          onChange={(e) => setNewCategoryNameVi(e.target.value)}
                          placeholder="Nhập tên danh mục tiếng Việt"
                          data-testid="input-category-name-vi"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCategoryDialogOpen(false);
                            setNewCategoryName("");
                            setNewCategoryNameVi("");
                          }}
                        >
                          {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </Button>
                        <Button
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              const slug = newCategoryName
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '');
                              createCategoryMutation.mutate({
                                name: newCategoryName,
                                nameVi: newCategoryNameVi || newCategoryName,
                                type: 'project',
                                slug,
                              });
                            }
                          }}
                          disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                          data-testid="button-save-category"
                        >
                          {language === 'vi' ? 'Tạo Danh Mục' : 'Create Category'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 uppercase tracking-wide">{language === 'vi' ? 'Danh Mục Dự Án' : 'Project Categories'}</h3>
                <div className="space-y-2">
                  {categories.filter(cat => cat.type === 'project' && cat.active).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Chưa có danh mục' : 'No project categories'}</p>
                  ) : (
                    categories
                      .filter(cat => cat.type === 'project' && cat.active)
                      .map((category) => (
                        <div key={category.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-light">{category.name}</span>
                            {category.nameVi && (
                              <span className="text-xs text-muted-foreground">{category.nameVi}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCategory({ id: category.id, name: category.name, nameVi: category.nameVi || null });
                                setIsEditCategoryDialogOpen(true);
                              }}
                              data-testid={`button-edit-category-${category.slug}`}
                            >
                              <Pencil className="h-4 w-4 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteCategoryData({ id: category.id, name: category.name });
                                setIsDeleteCategoryAlertOpen(true);
                              }}
                              data-testid={`button-delete-category-${category.slug}`}
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation Alert */}
        <AlertDialog open={isDeleteCategoryAlertOpen} onOpenChange={setIsDeleteCategoryAlertOpen}>
          <AlertDialogContent className="bg-black border border-white/20 rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-light">{language === 'vi' ? 'Xác Nhận Xóa Danh Mục' : 'Confirm Category Deletion'}</AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                {language === 'vi' 
                  ? <>Bạn có chắc chắn muốn xóa danh mục <span className="font-medium text-white">"{deleteCategoryData?.name}"</span>?<br /><br /><span className="text-red-400">Hành động này không thể hoàn tác.</span></>
                  : <>Are you sure you want to delete the category <span className="font-medium text-white">"{deleteCategoryData?.name}"</span>?<br /><br /><span className="text-red-400">This action cannot be undone.</span> Please confirm to proceed.</>
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                className="bg-white/5 border-white/10 hover:bg-white/10 rounded-none"
                onClick={() => {
                  setDeleteCategoryData(null);
                  setIsDeleteCategoryAlertOpen(false);
                }}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white rounded-none"
                onClick={() => {
                  if (deleteCategoryData) {
                    deleteCategoryMutation.mutate(deleteCategoryData.id);
                    setDeleteCategoryData(null);
                  }
                  setIsDeleteCategoryAlertOpen(false);
                }}
                data-testid="button-confirm-delete-category"
              >
                {language === 'vi' ? 'Xóa Danh Mục' : 'Delete Category'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryDialogOpen} onOpenChange={(open) => {
          setIsEditCategoryDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}>
          <DialogContent className="bg-black border border-white/20 rounded-none">
            <DialogHeader>
              <DialogTitle>{language === 'vi' ? 'Sửa Danh Mục Dự Án' : 'Edit Project Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{language === 'vi' ? 'Tên Danh Mục (Tiếng Anh)' : 'Category Name (English)'}</label>
                <Input
                  value={editingCategory?.name || ""}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder={language === 'vi' ? 'Nhập tên danh mục tiếng Anh' : 'Enter category name in English'}
                  data-testid="input-edit-category-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{language === 'vi' ? 'Tên Danh Mục (Tiếng Việt)' : 'Category Name (Vietnamese)'}</label>
                <Input
                  value={editingCategory?.nameVi || ""}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, nameVi: e.target.value } : null)}
                  placeholder="Nhập tên danh mục tiếng Việt"
                  data-testid="input-edit-category-name-vi"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditCategoryDialogOpen(false);
                    setEditingCategory(null);
                  }}
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => {
                    if (editingCategory && editingCategory.name.trim()) {
                      updateCategoryMutation.mutate({
                        id: editingCategory.id,
                        name: editingCategory.name,
                        nameVi: editingCategory.nameVi || undefined,
                      });
                    }
                  }}
                  disabled={!editingCategory?.name.trim() || updateCategoryMutation.isPending}
                  data-testid="button-update-category"
                >
                  {language === 'vi' ? 'Cập Nhật' : 'Update Category'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-0">
            {projectsLoading ? (
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
            ) : projects.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-lg font-light mb-2">{language === 'vi' ? 'Không tìm thấy dự án nào' : 'No projects found'}</h3>
                <p className="text-muted-foreground">{language === 'vi' ? 'Tạo dự án đầu tiên để bắt đầu.' : 'Create your first project to get started.'}</p>
              </div>
            ) : (
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] whitespace-nowrap">{language === 'vi' ? 'Năm' : 'Year'}</TableHead>
                    <TableHead className="w-[110px] whitespace-nowrap">{language === 'vi' ? 'Danh Mục' : 'Category'}</TableHead>
                    <TableHead className="w-[110px] whitespace-nowrap">{language === 'vi' ? 'Phong Cách' : 'Style'}</TableHead>
                    <TableHead className="w-[90px] whitespace-nowrap">{language === 'vi' ? 'Diện Tích' : 'Area'}</TableHead>
                    <TableHead>{language === 'vi' ? 'Dự Án' : 'Project'}</TableHead>
                    <TableHead className="w-[100px] whitespace-nowrap">{language === 'vi' ? 'Ngôn Ngữ' : 'Language'}</TableHead>
                    <TableHead className="w-[110px] whitespace-nowrap">{language === 'vi' ? 'Ngày Đăng' : 'Published'}</TableHead>
                    <TableHead className="w-[120px] whitespace-nowrap">{language === 'vi' ? 'Trạng Thái' : 'Status'}</TableHead>
                    <TableHead className="w-[100px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjectSlugs.map((slug) => {
                    const group = groupedProjectsMap[slug];
                    const hasVi = group.some(p => p.language === 'vi');
                    const hasEn = group.some(p => p.language === 'en');
                    const primary = (language === 'vi' ? group.find(p => p.language === 'vi') : group.find(p => p.language === 'en')) || group[0];
                    return (
                    <TableRow key={primary.id} data-testid={`row-project-${primary.id}`}>
                      <TableCell>{primary.completionYear || "—"}</TableCell>
                      <TableCell>{(() => {
                        const cat = categories.find(c => c.slug === primary.category && c.type === 'project');
                        return cat ? (language === 'vi' && cat.nameVi ? cat.nameVi : cat.name) : primary.category;
                      })()}</TableCell>
                      <TableCell>{primary.style || "—"}</TableCell>
                      <TableCell>{primary.area || "—"}</TableCell>
                      <TableCell>
                        <p className="font-light">{primary.title}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {hasEn && <span className="text-[14px] text-white">EN</span>}
                          {hasVi && <span className="text-[14px] text-white">VI</span>}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(primary.createdAt)}</TableCell>
                      <TableCell>
                        <Select
                          value={(primary as any).status || 'draft'}
                          onValueChange={async (newStatus) => {
                            try {
                              for (const p of group) {
                                await updateProjectMutation.mutateAsync({
                                  id: p.id,
                                  data: { status: newStatus }
                                });
                              }
                            } catch (error) {
                            }
                          }}
                        >
                          <SelectTrigger className="h-auto py-1 px-3 text-sm bg-transparent border-none hover:bg-white/10 w-[110px] gap-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Bản Nháp</SelectItem>
                            <SelectItem value="published">Đã Đăng</SelectItem>
                            <SelectItem value="archived">Lưu Trữ</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-4">
                          <Pencil 
                            className="h-4 w-4 cursor-pointer text-white/50 hover:text-white"
                            onClick={() => handleEditProject(primary)}
                            data-testid={`button-edit-project-${primary.id}`}
                          />
                          <Star 
                            className={`h-4 w-4 ${(primary as any).status === 'published' ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'} ${primary.featured ? 'text-white fill-white' : 'text-white/50 hover:text-white'}`}
                            onClick={() => {
                              if ((primary as any).status !== 'published') return;
                              group.forEach(p => {
                                updateProjectMutation.mutate({
                                  id: p.id,
                                  data: { featured: !primary.featured }
                                });
                              });
                            }}
                            data-testid={`button-toggle-featured-${primary.id}`}
                            title={(primary as any).status !== 'published' ? (language === 'vi' ? 'Chỉ áp dụng cho trạng thái Đã Đăng' : 'Only available for published projects') : primary.featured ? "Remove from featured" : "Mark as featured"}
                          />
                          <Trash2 
                            className="h-4 w-4 cursor-pointer text-white/50 hover:text-red-400"
                            onClick={() => {
                              if (window.confirm(language === 'vi' ? `Bạn có chắc chắn muốn xóa dự án "${primary.title}"?` : `Are you sure you want to delete project "${primary.title}"?`)) {
                                group.forEach(p => {
                                  deleteProjectMutation.mutate(p.id);
                                });
                              }
                            }}
                            data-testid={`button-delete-project-${primary.id}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {uniqueProjectSlugs.length > 10 && (
              <div className="p-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjectsPage(1)}
                      disabled={projectsPage === 1}
                      className="text-xs"
                    >
                      {language === 'vi' ? 'ĐẦU' : 'FIRST'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjectsPage(prev => Math.max(1, prev - 1))}
                      disabled={projectsPage === 1}
                      className="text-xs"
                    >
                      {language === 'vi' ? 'TRƯỚC' : 'PREV'}
                    </Button>
                    {Array.from({ length: projectsTotalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={projectsPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setProjectsPage(page)}
                        className="text-xs min-w-[32px]"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjectsPage(prev => Math.min(projectsTotalPages, prev + 1))}
                      disabled={projectsPage === projectsTotalPages}
                      className="text-xs"
                    >
                      {language === 'vi' ? 'SAU' : 'NEXT'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjectsPage(projectsTotalPages)}
                      disabled={projectsPage === projectsTotalPages}
                      className="text-xs"
                    >
                      {language === 'vi' ? 'CUỐI' : 'LAST'}
                    </Button>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {language === 'vi' ? `Hiển thị ${projectsStartIndex + 1}-${Math.min(projectsEndIndex, uniqueProjectSlugs.length)} trên ${uniqueProjectSlugs.length} dự án` : `Showing ${projectsStartIndex + 1}-${Math.min(projectsEndIndex, uniqueProjectSlugs.length)} of ${uniqueProjectSlugs.length} projects`}
                    </span>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'clients') {
    if (!hasPermission(user, 'crm')) {
      return <PermissionDenied feature="CRM / Clients" />;
    }
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-sans font-light">{t('crm.clientManagement')}</h2>
          <div className="flex gap-2">
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
                dateOfBirth: "",
                tier: "silver",
                stage: "lead",
                status: "active",
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
                  setEditingClient(null);
                  clientForm.reset({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    company: "",
                    address: "",
                    dateOfBirth: "",
                    tier: "silver",
                    stage: "lead",
                    status: "active",
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
                <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
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

                  <FormField
                    control={clientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('crm.email')} *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="email@example.com" data-testid="input-client-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('crm.dateOfBirth')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" maxLength={10} data-testid="input-client-dob" />
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
                            if (!warrantyDate) return t('crm.warranty.none');
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      name="tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crm.customerTier')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                  <FormField
                    control={clientForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('crm.status')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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


                  {/* Transaction Management - Only show when editing */}
                  {editingClient && (
                    <div className="border-t border-white/30 pt-6 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Lịch sử giao dịch</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingTransaction(null);
                            transactionForm.reset({
                              clientId: editingClient.id,
                              amount: "",
                              title: "",
                              description: "",
                              type: "",
                              status: "",
                              paymentDate: new Date().toISOString().split('T')[0],
                              notes: "",
                            });
                            setIsTransactionDialogOpen(true);
                          }}
                          className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none h-8 w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {transactionsLoading ? (
                        <div className="text-sm text-white/50">Đang tải...</div>
                      ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                        <div className="text-sm text-white/50">Chưa có giao dịch nào</div>
                      ) : (
                        <div className="border border-white/30 rounded-none max-h-48 overflow-y-auto bg-black">
                          {transactions.map((transaction: any) => (
                            <div key={transaction.id} className="flex items-center justify-between px-2 py-2 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">{transaction.title}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                    {transaction.type === "payment" ? "Thanh toán" : transaction.type === "refund" ? "Hoàn tiền" : transaction.type === "commission" ? "Hoa hồng" : "—"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-white">{parseFloat(transaction.amount).toLocaleString('vi-VN')} đ</span>
                                  <span className="text-[10px] text-white/50">
                                    {new Date(transaction.paymentDate).toLocaleDateString('vi-VN')}
                                  </span>
                                  <span className="text-[10px] text-white/50">
                                    {transaction.status === "pending" ? "Đang chờ" : transaction.status === "completed" ? "Hoàn thành" : transaction.status === "cancelled" ? "Đã hủy" : "—"}
                                  </span>
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
                                    transactionForm.reset({
                                      clientId: transaction.clientId,
                                      amount: transaction.amount,
                                      title: transaction.title,
                                      description: transaction.description || "",
                                      type: transaction.type || "",
                                      status: transaction.status || "",
                                      paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split('T')[0] : "",
                                      notes: transaction.notes || "",
                                    });
                                    setIsTransactionDialogOpen(true);
                                  }}
                                  className="h-6 w-6 text-white hover:text-white hover:bg-white/20 rounded-none"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Xóa giao dịch "${transaction.title}"?`)) {
                                      deleteTransactionMutation.mutate(transaction.id);
                                    }
                                  }}
                                  className="h-6 w-6 text-white hover:text-white hover:bg-white/20 rounded-none"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <FormField
                    control={clientForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('crm.tags')}</FormLabel>
                        <FormControl>
                          <Input 
                            value={field.value?.join(', ') || ''} 
                            onChange={(e) => {
                              const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                              field.onChange(tagsArray);
                            }}
                            placeholder="VD: VIP, Ưu tiên, Khách hàng thân thiết..." 
                            data-testid="input-client-tags" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                  <div className="flex justify-between pt-4 border-t border-white/30">
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
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa khách hàng <strong>{editingClient.firstName} {editingClient.lastName}</strong>?
                              <br />
                              Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none h-10 px-4">
                              Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteClientMutation.mutate(editingClient.id)}
                              className="bg-white hover:bg-white/90 text-black rounded-none h-10 px-4"
                              disabled={deleteClientMutation.isPending}
                            >
                              {deleteClientMutation.isPending ? "Đang xóa..." : "Xóa"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
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
                        disabled={createClientMutation.isPending}
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

        {/* CRM Settings Dialog */}
        <Dialog open={isCrmSettingsDialogOpen} onOpenChange={setIsCrmSettingsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light">{language === 'vi' ? 'Cài Đặt' : 'Settings'}</DialogTitle>
            </DialogHeader>
            <CrmSettingsManager />
          </DialogContent>
        </Dialog>

        {/* Client View Dialog */}
        <Dialog open={isClientViewDialogOpen} onOpenChange={setIsClientViewDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
              <DialogHeader>
                <DialogTitle className="text-2xl font-light">
                  {t('crm.clientDetails')}
                </DialogTitle>
              </DialogHeader>
              {viewingClient && (
                <div className="space-y-6">
                  {/* Basic Information */}
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
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.dateOfBirth')}</label>
                        <p className="text-base mt-1">
                          {viewingClient.dateOfBirth ? new Date(viewingClient.dateOfBirth).toLocaleDateString('vi-VN') : "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.company')}</label>
                        <p className="text-base mt-1">{viewingClient.company || "—"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.address')}</label>
                        <p className="text-base mt-1">{viewingClient.address || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* CRM Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{t('crm.crmStatus')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.pipelineStage')}</label>
                        <p className="text-base mt-1 capitalize">{t(`crm.stage.${viewingClient.stage}`)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.customerTier')}</label>
                        <p className="text-base mt-1 capitalize">{t(`crm.tier.${viewingClient.tier}`)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.status')}</label>
                        <p className="text-base mt-1 capitalize">{t(`crm.status.${viewingClient.status}`)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.created')}</label>
                        <p className="text-base mt-1">{formatDate(viewingClient.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{t('crm.financialInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Total Revenue</label>
                        <p className="text-base mt-1 font-semibold">
                          {(clientFinances[viewingClient.id]?.totalSpending || 0).toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Hoa hồng</label>
                        <p className="text-base mt-1 font-semibold">
                          {(clientFinances[viewingClient.id]?.commission || 0).toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Order Count</label>
                        <p className="text-base mt-1">{viewingClient.orderCount || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Refund Amount</label>
                        <p className="text-base mt-1 font-semibold text-white">
                          {viewingClient.refundAmount ? `${parseFloat(String(viewingClient.refundAmount)).toLocaleString('vi-VN')} đ` : "0 đ"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Referral Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{t('crm.referralInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Được giới thiệu bởi</label>
                        <p className="text-base mt-1">
                          {(() => {
                            if (!viewingClient.referredById) return "—";
                            const referrer = clients.find(c => c.id === viewingClient.referredById);
                            return referrer ? `${referrer.firstName} ${referrer.lastName}` : "—";
                          })()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.referralCount')}</label>
                        <p className="text-base mt-1">{viewingClient.referralCount || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.referralRevenue')}</label>
                        <p className="text-base mt-1">
                          {viewingClient.referralRevenue ? `${parseFloat(viewingClient.referralRevenue).toLocaleString('vi-VN')} đ` : "0 đ"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warranty Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">{t('crm.warrantyInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.warrantyStatus')}</label>
                        <p className="text-base mt-1 capitalize">{t(`crm.warranty.${viewingClient.warrantyStatus || 'none'}`)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('crm.warrantyExpiry')}</label>
                        <p className="text-base mt-1">
                          {viewingClient.warrantyExpiry ? new Date(viewingClient.warrantyExpiry).toLocaleDateString('vi-VN') : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {viewingClient.tags && Array.isArray(viewingClient.tags) && viewingClient.tags.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">{t('crm.tags')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingClient.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {viewingClient.notes && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">{t('crm.notes')}</h3>
                      <p className="text-base whitespace-pre-wrap">{viewingClient.notes}</p>
                    </div>
                  )}

                  {/* Transaction History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Lịch sử giao dịch</h3>
                    {viewTransactionsLoading ? (
                      <div className="text-sm text-white/50">Đang tải...</div>
                    ) : !Array.isArray(viewTransactions) || viewTransactions.length === 0 ? (
                      <div className="text-sm text-white/50">Chưa có giao dịch nào</div>
                    ) : (
                      <div className="border border-white/30 rounded-none max-h-64 overflow-y-auto bg-black">
                        {viewTransactions.map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between px-3 py-3 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{transaction.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded-none">
                                  {transaction.type === "payment" ? "Thanh toán" : transaction.type === "refund" ? "Hoàn tiền" : transaction.type === "commission" ? "Hoa hồng" : "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-white">{parseFloat(transaction.amount).toLocaleString('vi-VN')} đ</span>
                                <span className="text-[10px] text-white/50">
                                  {new Date(transaction.paymentDate).toLocaleDateString('vi-VN')}
                                </span>
                                <span className="text-[10px] text-white/50">
                                  {transaction.status === "pending" ? "Đang chờ" : transaction.status === "completed" ? "Hoàn thành" : transaction.status === "cancelled" ? "Đã hủy" : "—"}
                                </span>
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

          {/* Transaction Dialog */}
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogContent className="max-w-md bg-black border border-white/20 rounded-none">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}
                </DialogTitle>
              </DialogHeader>
              <Form {...transactionForm}>
                <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
                  <FormField
                    control={transactionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="VD: Thanh toán đợt 1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={transactionForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả chi tiết</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="VD: Thanh toán thiết kế nội thất phòng khách" />
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
                          <FormLabel>Số tiền (đ) *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0" />
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
                          <FormLabel>Loại</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-t-0 border-l-0 border-r-0 border-b border-white/30 rounded-none">
                                <SelectValue placeholder="Chọn loại" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="payment">Thanh toán</SelectItem>
                              <SelectItem value="refund">Hoàn tiền</SelectItem>
                              <SelectItem value="commission">Hoa hồng</SelectItem>
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
                          <FormLabel>Trạng thái</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-t-0 border-l-0 border-r-0 border-b border-white/30 rounded-none">
                                <SelectValue placeholder="Chọn trạng thái" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Đang chờ</SelectItem>
                              <SelectItem value="completed">Hoàn thành</SelectItem>
                              <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transactionForm.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngày thanh toán *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={transactionForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ghi chú</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ghi chú thêm (optional)" />
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
                      Hủy
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
                      className="h-10 px-4"
                    >
                      {editingTransaction ? "Cập nhật" : "Thêm"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div className="flex items-center justify-between">
                <div className="min-w-[120px]">
                  <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng khách hàng' : 'Total Clients'}</p>
                  <p className="text-2xl font-semibold mt-1">{clients.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div className="flex items-center justify-between">
                <div className="min-w-[120px]">
                  <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng doanh thu' : 'Total Revenue'}</p>
                  <p className="text-2xl font-semibold mt-1">
                    {allTransactions.reduce((sum, t) => {
                      if (t.status !== "completed") return sum;
                      const amount = parseFloat(t.amount || "0");
                      if (t.type === "payment") return sum + amount;
                      if (t.type === "refund") return sum - amount;
                      return sum;
                    }, 0).toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div className="flex items-center justify-between">
                <div className="min-w-[120px]">
                  <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Còn bảo hành' : 'Active Warranty'}</p>
                  <p className="text-2xl font-semibold mt-1">
                    {clients.filter(c => c.warrantyStatus === 'active').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black border-white/10 rounded-none">
            <CardContent className="p-6 min-h-[90px]">
              <div className="flex items-center justify-between">
                <div className="min-w-[120px]">
                  <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Hết hạn bảo hành' : 'Expired Warranty'}</p>
                  <p className="text-2xl font-semibold mt-1">
                    {clients.filter(c => c.warrantyStatus === 'expired').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px]">
                          <div>{t('admin.clients')}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">{t('crm.email')}</div>
                        </TableHead>
                        <TableHead className="w-[120px]">
                          <div>{t('crm.phone')}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">{t('crm.dateOfBirth')}</div>
                        </TableHead>
                        <TableHead className="w-[130px]">
                          <div>{t('crm.address')}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">{t('crm.company')}</div>
                        </TableHead>
                        <TableHead className="w-[110px]">
                          <div>{t('crm.totalSpending')}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">Hoa hồng</div>
                        </TableHead>
                        <TableHead className="w-[110px] text-center">{t('crm.warrantyStatus')}</TableHead>
                        <TableHead className="w-[110px] text-center">{t('crm.pipelineStage')}</TableHead>
                        <TableHead className="w-[100px] text-center">{t('crm.customerTier')}</TableHead>
                        <TableHead className="w-[100px] text-center">{t('crm.status')}</TableHead>
                        <TableHead className="text-right w-[70px]">{t('crm.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedClients.map((client) => (
                        <TableRow key={client.id} data-testid={`row-client-${client.id}`} className="relative h-16">
                          <TableCell className="align-middle">
                            <div className="font-light whitespace-nowrap">
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[140px] mt-1" title={client.email}>
                              {client.email}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="text-sm">{client.phone || "—"}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('vi-VN') : "—"}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="text-sm truncate max-w-[110px]" title={client.address || ""}>
                              {client.address || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[110px] mt-1" title={client.company || ""}>
                              {client.company || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="text-sm whitespace-nowrap">
                              {(clientFinances[client.id]?.totalSpending || 0).toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                              {(clientFinances[client.id]?.commission || 0).toLocaleString('vi-VN')} đ
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <div className="text-sm capitalize" data-testid={`text-client-warranty-${client.id}`}>
                              {t(`crm.warranty.${client.warrantyStatus || 'none'}`)}
                            </div>
                            {client.warrantyExpiry && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(client.warrantyExpiry).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <div className="inline-block w-full">
                              <Select
                                value={client.stage || crmStages.find(s => s.active)?.value || "lead"}
                                onValueChange={(value) => updateClientMutation.mutate({ 
                                  id: client.id, 
                                  stage: value as any,
                                  showToast: false
                                })}
                              >
                                <SelectTrigger className="w-full" data-testid={`select-client-stage-${client.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {crmStages.filter(s => s.active).sort((a, b) => a.order - b.order).map(stage => (
                                    <SelectItem key={stage.id} value={stage.value}>
                                      {language === 'vi' ? stage.labelVi : stage.labelEn}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <div className="inline-block w-full">
                              <Select
                                value={client.tier || crmTiers.find(t => t.active)?.value || "silver"}
                                onValueChange={(value) => updateClientMutation.mutate({ 
                                  id: client.id, 
                                  tier: value as any,
                                  showToast: false
                                })}
                              >
                                <SelectTrigger className="w-full" data-testid={`select-client-tier-${client.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {crmTiers.filter(t => t.active).sort((a, b) => a.order - b.order).map(tier => (
                                    <SelectItem key={tier.id} value={tier.value}>
                                      {language === 'vi' ? tier.labelVi : tier.labelEn}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <div className="inline-block w-full">
                              <Select
                                value={client.status || crmStatuses.find(s => s.active)?.value || "active"}
                                onValueChange={(value) => updateClientMutation.mutate({ 
                                  id: client.id, 
                                  status: value as any,
                                  showToast: false
                                })}
                              >
                                <SelectTrigger className="w-full" data-testid={`select-client-status-${client.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {crmStatuses.filter(s => s.active).sort((a, b) => a.order - b.order).map(status => (
                                    <SelectItem key={status.id} value={status.value}>
                                      {language === 'vi' ? status.labelVi : status.labelEn}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
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
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClient(client)}
                                  data-testid={`button-edit-client-${client.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
                                {formatDate(client.updatedAt || client.createdAt)}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="text-xs min-w-[60px]"
                    >
                      FIRST
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="text-xs min-w-[60px]"
                    >
                      PREV
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="text-xs min-w-[32px]"
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
                      NEXT
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="text-xs min-w-[60px]"
                    >
                      LAST
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

  if (activeTab === 'inquiries') {
    if (!hasPermission(user, 'inquiries')) {
      return <PermissionDenied feature="Inquiries" />;
    }
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Yêu Cầu' : 'Inquiry Management'}</h2>

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
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] whitespace-nowrap">{language === 'vi' ? 'Liên Hệ' : 'Contact'}</TableHead>
                    <TableHead className="w-[140px] whitespace-nowrap">{language === 'vi' ? 'Loại Dự Án' : 'Project Type'}</TableHead>
                    <TableHead className="w-[120px] whitespace-nowrap">{language === 'vi' ? 'Ngân Sách' : 'Budget'}</TableHead>
                    <TableHead className="w-[120px] whitespace-nowrap">{language === 'vi' ? 'Trạng Thái' : 'Status'}</TableHead>
                    <TableHead className="w-[110px] whitespace-nowrap">{language === 'vi' ? 'Ngày' : 'Date'}</TableHead>
                    <TableHead className="w-[100px] text-right whitespace-nowrap"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.map((inquiry) => (
                    <TableRow key={inquiry.id} data-testid={`row-inquiry-${inquiry.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-light">
                            {inquiry.firstName} {inquiry.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{inquiry.projectType}</TableCell>
                      <TableCell>{inquiry.budget || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={inquiry.status}
                          onValueChange={(value) => updateInquiryMutation.mutate({ id: inquiry.id, status: value })}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-inquiry-status-${inquiry.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">{language === 'vi' ? 'Mới' : 'New'}</SelectItem>
                            <SelectItem value="reviewed">{language === 'vi' ? 'Đã Xem' : 'Reviewed'}</SelectItem>
                            <SelectItem value="contacted">{language === 'vi' ? 'Đã Liên Hệ' : 'Contacted'}</SelectItem>
                            <SelectItem value="converted">{language === 'vi' ? 'Đã Chuyển Đổi' : 'Converted'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
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
                                  <p>{language === 'vi' ? 'Loại:' : 'Type:'} {inquiry.projectType}</p>
                                  {inquiry.budget && <p>{language === 'vi' ? 'Ngân sách:' : 'Budget:'} {inquiry.budget}</p>}
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
                                <AlertDialogDescription>
                                  {language === 'vi' ? 'Bạn có chắc chắn muốn xóa yêu cầu từ' : 'Are you sure you want to delete this inquiry from'} <strong>{inquiry.firstName} {inquiry.lastName}</strong>?
                                  <br />
                                  {language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-black border-white/30 hover:border-white hover:bg-white/10 rounded-none">
                                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteInquiryMutation.mutate(inquiry.id)}
                                  className="bg-white hover:bg-white/90 text-black rounded-none"
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
                  ))}
                </TableBody>
              </Table>
            )}
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
                      <FormField
                        control={seoSettingsForm.control}
                        name="siteTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tiêu Đề Website (EN)' : 'Site Title (EN)'}</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="IEVRA Design & Build - Interior Design"
                                data-testid="input-site-title-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={seoSettingsForm.control}
                        name="siteTitleVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tiêu Đề Website (VI)' : 'Site Title (VI)'}</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="IEVRA Design & Build - Thiết Kế Nội Thất"
                                data-testid="input-site-title-vi"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={seoSettingsForm.control}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Mô Tả Meta (EN)' : 'Meta Description (EN)'}</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field}
                                rows={3}
                                placeholder="Premium interior design and architecture services..."
                                data-testid="textarea-meta-description-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={seoSettingsForm.control}
                        name="metaDescriptionVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Mô Tả Meta (VI)' : 'Meta Description (VI)'}</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field}
                                rows={3}
                                placeholder="Dịch vụ thiết kế nội thất và kiến trúc cao cấp..."
                                data-testid="textarea-meta-description-vi"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={seoSettingsForm.control}
                        name="metaKeywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Từ Khóa Meta (EN)' : 'Meta Keywords (EN)'}</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="interior design, architecture, modern home..."
                                data-testid="input-meta-keywords-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={seoSettingsForm.control}
                        name="metaKeywordsVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Từ Khóa Meta (VI)' : 'Meta Keywords (VI)'}</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="thiết kế nội thất, kiến trúc, nhà hiện đại..."
                                data-testid="input-meta-keywords-vi"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={updateSettingsMutation.isPending}
                      data-testid="button-save-seo"
                    >
                      {updateSettingsMutation.isPending 
                        ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') 
                        : (language === 'vi' ? 'Lưu Cài Đặt SEO' : 'Save SEO Settings')
                      }
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Title (EN)</label>
                      <Input 
                        {...homepageContentForm.register("featuredBadge")}
                        placeholder="e.g., FEATURED PROJECTS"
                        data-testid="input-featured-projects-title-en"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                      <Textarea 
                        {...homepageContentForm.register("featuredDescription")}
                        placeholder="e.g., Discover our latest projects where innovation meets elegance."
                        rows={2}
                        data-testid="textarea-featured-projects-subtitle-en"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Title (VI)</label>
                      <Input 
                        {...homepageContentForm.register("featuredBadgeVi")}
                        placeholder="e.g., DỰ ÁN NỔI BẬT"
                        data-testid="input-featured-projects-title-vi"
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
              </div>

              {/* Featured News */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Tin Tức Nổi Bật' : 'Featured News Section'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Title (EN)</label>
                      <Input 
                        {...homepageContentForm.register("featuredNewsTitle")}
                        placeholder="e.g., FEATURED NEWS"
                        data-testid="input-featured-news-title-en"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                      <Textarea 
                        {...homepageContentForm.register("featuredNewsSubtitle")}
                        placeholder="e.g., Discover the latest design trends and expert insights from our professional team."
                        rows={2}
                        data-testid="textarea-featured-news-subtitle-en"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Title (VI)</label>
                      <Input 
                        {...homepageContentForm.register("featuredNewsTitleVi")}
                        placeholder="e.g., TIN TỨC NỔI BẬT"
                        data-testid="input-featured-news-title-vi"
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
              </div>

              {/* CTA/Questions */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục CTA/Câu Hỏi' : 'CTA/Questions Section'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Title (EN)</label>
                      <Input 
                        {...homepageContentForm.register("faqSectionTitle")}
                        placeholder="e.g., GOT QUESTIONS?"
                        data-testid="input-cta-title-en"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-light mb-2 block">Subtitle (EN)</label>
                      <Textarea 
                        {...homepageContentForm.register("ctaSubtitle")}
                        placeholder="e.g., Leave a request for a free consultation and we will contact you as soon as possible."
                        rows={2}
                        data-testid="textarea-cta-subtitle-en"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Title (VI)</label>
                      <Input 
                        {...homepageContentForm.register("faqSectionTitleVi")}
                        placeholder="e.g., CÓ CÂU HỎI?"
                        data-testid="input-cta-title-vi"
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
              </div>

              {/* Journey Steps */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Các Bước Hành Trình' : 'Journey Steps Section'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Journey Title (EN)</label>
                      <Input 
                        {...homepageContentForm.register("journeyTitle")}
                        placeholder="e.g., THE JOURNEY TO YOUR DREAM SPACE"
                        data-testid="input-journey-title-en"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-light mb-2 block">Journey Description (EN)</label>
                      <Textarea 
                        {...homepageContentForm.register("journeyDescription")}
                        rows={3}
                        placeholder="Description for the journey/process section"
                        data-testid="textarea-journey-description-en"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Journey Title (VI)</label>
                      <Input 
                        {...homepageContentForm.register("journeyTitleVi")}
                        placeholder="e.g., HÀNH TRÌNH ĐẾN KHÔNG GIAN MONG ƯỚC"
                        data-testid="input-journey-title-vi"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-light mb-2 block">Journey Description (VI)</label>
                      <Textarea 
                        {...homepageContentForm.register("journeyDescriptionVi")}
                        rows={3}
                        placeholder="Mô tả cho phần hành trình/quy trình"
                        data-testid="textarea-journey-description-vi"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advantages */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Ưu Điểm' : 'Advantages Section'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Advantages Title (EN)</label>
                      <Input 
                        {...homepageContentForm.register("advantagesTitle")}
                        placeholder="e.g., ADVANTAGES"
                        data-testid="input-advantages-title-en"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-light mb-2 block">Advantages Subtitle (EN)</label>
                      <Input 
                        {...homepageContentForm.register("advantagesSubtitle")}
                        placeholder="e.g., Why Choose IEVRA Design & Build"
                        data-testid="input-advantages-subtitle-en"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-light mb-2 block">Advantages Title (VI)</label>
                      <Input 
                        {...homepageContentForm.register("advantagesTitleVi")}
                        placeholder="e.g., ƯU ĐIỂM"
                        data-testid="input-advantages-title-vi"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-light mb-2 block">Advantages Subtitle (VI)</label>
                      <Input 
                        {...homepageContentForm.register("advantagesSubtitleVi")}
                        placeholder="e.g., Tại Sao Chọn IEVRA Design & Build"
                        data-testid="input-advantages-subtitle-vi"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Partners */}
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Mục Đối Tác' : 'Partners Section'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light mb-2 block">Partners Title (EN)</label>
                    <Input 
                      {...homepageContentForm.register("partnersTitle")}
                      placeholder="e.g., OUR PARTNERS"
                      data-testid="input-partners-title-en"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">Partners Title (VI)</label>
                    <Input 
                      {...homepageContentForm.register("partnersTitleVi")}
                      placeholder="e.g., ĐỐI TÁC CỦA CHÚNG TÔI"
                      data-testid="input-partners-title-vi"
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
                  {/* Background Image Upload */}
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
                  {/* Background Image Upload */}
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
            
            {/* Save Button inside Card */}
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
            <div className="flex justify-between items-center">
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
                            <FormLabel>{language === 'vi' ? 'Tên Đối Tác *' : 'Partner Name *'}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter partner name" data-testid="input-partner-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Partner Logo Upload */}
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

                        {/* Or Use URL */}
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
                                <AlertDialogDescription>
                                  {language === 'vi' ? `Thao tác này sẽ xóa vĩnh viễn "${partner.name}". Không thể hoàn tác.` : `This will permanently delete "${partner.name}". This action cannot be undone.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePartnerMutation.mutate(partner.id)}
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
            <div className="flex justify-between items-center">
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
                    // Group FAQs by order only (not page)
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
            <div className="flex justify-between items-center">
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
            <div className="flex justify-between items-center">
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

  if (activeTab === 'articles') {
    if (!hasPermission(user, 'articles')) {
      return <PermissionDenied feature="Articles / Blog" />;
    }
    return (
      <div className="space-y-6 p-6">
        {/* Category Management Dialog for Articles */}
        <Dialog open={isCategoryManagementDialogOpen} onOpenChange={setIsCategoryManagementDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light">{language === 'vi' ? 'Quản Lý Danh Mục Bài Viết' : 'Article Categories Management'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-category">
                      <Plus className="mr-2 h-4 w-4" />
                      {language === 'vi' ? 'Thêm Danh Mục Bài Viết' : 'Add Article Category'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === 'vi' ? 'Thêm Danh Mục Bài Viết Mới' : 'Add New Article Category'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Category Name (English)</label>
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name in English"
                          data-testid="input-category-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category Name (Vietnamese)</label>
                        <Input
                          value={newCategoryNameVi}
                          onChange={(e) => setNewCategoryNameVi(e.target.value)}
                          placeholder="Nhập tên danh mục tiếng Việt"
                          data-testid="input-category-name-vi"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCategoryDialogOpen(false);
                            setNewCategoryName("");
                            setNewCategoryNameVi("");
                          }}
                        >
                          {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </Button>
                        <Button
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              const slug = newCategoryName
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '');
                              createCategoryMutation.mutate({
                                name: newCategoryName,
                                nameVi: newCategoryNameVi || newCategoryName,
                                type: 'article',
                                slug,
                              });
                            }
                          }}
                          disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                          data-testid="button-save-category"
                        >
                          {language === 'vi' ? 'Tạo Danh Mục' : 'Create Category'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 uppercase tracking-wide">{language === 'vi' ? 'Danh Mục Bài Viết' : 'Article Categories'}</h3>
                <div className="space-y-2">
                  {categories.filter(cat => cat.type === 'article' && cat.active).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Chưa có danh mục bài viết' : 'No article categories'}</p>
                  ) : (
                    categories
                      .filter(cat => cat.type === 'article' && cat.active)
                      .map((category) => (
                        <div key={category.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-light">{category.name}</span>
                            {category.nameVi && (
                              <span className="text-xs text-muted-foreground">{category.nameVi}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCategory({ id: category.id, name: category.name, nameVi: category.nameVi || null });
                                setIsEditCategoryDialogOpen(true);
                              }}
                              data-testid={`button-edit-category-${category.slug}`}
                            >
                              <Pencil className="h-4 w-4 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteCategoryData({ id: category.id, name: category.name });
                                setIsDeleteCategoryAlertOpen(true);
                              }}
                              data-testid={`button-delete-category-${category.slug}`}
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation Alert */}
        <AlertDialog open={isDeleteCategoryAlertOpen} onOpenChange={setIsDeleteCategoryAlertOpen}>
          <AlertDialogContent className="bg-black border border-white/20 rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-light">{language === 'vi' ? 'Xác Nhận Xóa Danh Mục' : 'Confirm Category Deletion'}</AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                {language === 'vi' ? 'Bạn có chắc chắn muốn xóa danh mục' : 'Are you sure you want to delete the category'} <span className="font-medium text-white">"{deleteCategoryData?.name}"</span>?
                <br /><br />
                <span className="text-red-400">{language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}</span> {language === 'vi' ? 'Vui lòng xác nhận để tiếp tục.' : 'Please confirm to proceed.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                className="bg-white/5 border-white/10 hover:bg-white/10 rounded-none"
                onClick={() => {
                  setDeleteCategoryData(null);
                  setIsDeleteCategoryAlertOpen(false);
                }}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white rounded-none"
                onClick={() => {
                  if (deleteCategoryData) {
                    deleteCategoryMutation.mutate(deleteCategoryData.id);
                    setDeleteCategoryData(null);
                  }
                  setIsDeleteCategoryAlertOpen(false);
                }}
                data-testid="button-confirm-delete-category"
              >
                {language === 'vi' ? 'Xóa Danh Mục' : 'Delete Category'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Bài Viết' : 'Articles Management'}</h2>
          <div className="flex gap-2">
            <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingArticle(null);
                    setArticleImagePreview('');
                    setArticleImageFile(null);
                    setArticleContentImages([]);
                    articleForm.reset({
                      titleEn: "",
                      titleVi: "",
                      excerptEn: "",
                      excerptVi: "",
                      contentEn: "",
                      contentVi: "",
                      slug: "",
                      category: "news",
                      status: "draft",
                      featured: false,
                      featuredImage: "",
                      metaTitleEn: "",
                      metaTitleVi: "",
                      metaDescriptionEn: "",
                      metaDescriptionVi: "",
                      metaKeywordsEn: "",
                      metaKeywordsVi: "",
                    });
                  }}
                  data-testid="button-add-article"
                  className="h-10 px-4 min-w-[140px] justify-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {language === 'vi' ? 'Thêm Bài Viết' : 'Add Article'}
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button
              variant="outline"
              onClick={() => setIsCategoryManagementDialogOpen(true)}
              data-testid="button-category-settings"
              className="h-10 px-4 min-w-[160px] justify-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Cài Đặt' : 'Settings'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingArticle ? (language === 'vi' ? 'Chỉnh Sửa Bài Viết' : 'Edit Article') : (language === 'vi' ? 'Thêm Bài Viết Mới' : 'Add New Article')}
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 px-1">
                <Form {...articleForm}>
                  <form onSubmit={articleForm.handleSubmit(onArticleSubmit)} className="space-y-6">
                  
                  {/* Bilingual Title */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={articleForm.control}
                      name="titleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề (Tiếng Anh)' : 'Title (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-article-title-en" placeholder={language === 'vi' ? 'Nhập tiêu đề tiếng Anh...' : 'Enter English title...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="titleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề (Tiếng Việt)' : 'Title (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-article-title-vi" placeholder="Nhập tiêu đề tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Excerpt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={articleForm.control}
                      name="excerptEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tóm Tắt (Tiếng Anh)' : 'Excerpt (English)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} rows={4} data-testid="textarea-article-excerpt-en" placeholder={language === 'vi' ? 'Mô tả ngắn bằng tiếng Anh...' : 'Brief description in English...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="excerptVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tóm Tắt (Tiếng Việt)' : 'Excerpt (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} rows={4} data-testid="textarea-article-excerpt-vi" placeholder="Mô tả ngắn bằng tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bilingual Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={articleForm.control}
                      name="contentEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Nội Dung (Tiếng Anh)' : 'Content (English)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={10} data-testid="textarea-article-content-en" placeholder={language === 'vi' ? 'Viết nội dung bằng tiếng Anh...' : 'Write your content in English...'} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="contentVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Nội Dung (Tiếng Việt)' : 'Content (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={10} data-testid="textarea-article-content-vi" placeholder="Viết nội dung bằng tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Featured Image */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">{language === 'vi' ? 'Ảnh Đại Diện' : 'Featured Image'}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Tải Ảnh Lên (PNG, JPG)' : 'Upload Image (PNG, JPG only)'}</label>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={handleArticleImageFileChange}
                          disabled={!hasPermission(user, 'articles')}
                          className="block w-full text-sm text-foreground
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-none file:border file:border-white/30
                            file:text-sm file:font-medium
                            file:bg-transparent file:text-white
                            hover:file:bg-white/10 hover:file:border-white cursor-pointer
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          data-testid="input-article-image-file"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Định dạng: PNG, JPG • Giới hạn: 10MB • Khuyến nghị: 1200x630px (16:9)
                        </p>
                        {articleImagePreview && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">{language === 'vi' ? 'Xem Trước:' : 'Preview:'}</p>
                            <div className="border rounded p-4 bg-muted">
                              <img 
                                src={articleImagePreview} 
                                alt="Article Image Preview" 
                                className="w-full max-h-64 object-cover rounded" 
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <FormField
                        control={articleForm.control}
                        name="featuredImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Đường Dẫn Ảnh' : 'Image URL'}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} data-testid="input-article-featured-image" placeholder="https://example.com/image.jpg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Content Images Upload */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-2">Ảnh Nội Dung (Upload từ máy tính để chèn vào bài viết)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ảnh đã upload ({articleContentImages.length}/10):
                    </p>
                    
                    {articleContentImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {articleContentImages.map((imagePath, index) => (
                          <div key={index} className="relative group border rounded-lg overflow-hidden bg-muted/50 hover:border-primary transition-colors">
                            <img 
                              src={imagePath} 
                              alt={`Content ${index + 1}`} 
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  navigator.clipboard.writeText(`(${imagePath})`);
                                  toast({
                                    title: "Đã copy",
                                    description: `Đã copy: (${imagePath})`
                                  });
                                }}
                                className="text-xs"
                              >
                                Copy Path
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="bg-transparent border-white/30 hover:bg-white/10 hover:border-white"
                                onClick={() => removeContentImage(index)}
                              >
                                <Trash2 className="h-4 w-4 text-white" />
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                              <p className="text-xs text-white truncate" title={`(${imagePath})`}>
                                ({imagePath})
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleContentImagesChange}
                        className="hidden"
                        id="content-images-upload"
                        disabled={articleContentImages.length >= 10 || !hasPermission(user, 'articles')}
                      />
                      <label 
                        htmlFor="content-images-upload" 
                        className={`cursor-pointer ${articleContentImages.length >= 10 || !hasPermission(user, 'articles') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="font-medium">
                            {articleContentImages.length >= 10 
                              ? "Đã đạt giới hạn 10 ảnh"
                              : "Kéo thả ảnh nội dung vào đây (có thể chọn nhiều ảnh cùng lúc)"
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Hỗ trợ: JPG, PNG, WebP (tối đa 10MB)
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Common Fields */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">{language === 'vi' ? 'Thông Tin Chung' : 'General Information'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={articleForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-article-slug" placeholder={language === 'vi' ? 'tự động tạo' : 'auto-generated'} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={articleForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Danh Mục *' : 'Category *'}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-article-category">
                                  <SelectValue placeholder={language === 'vi' ? 'Chọn danh mục' : 'Select a category'} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories
                                  .filter(cat => cat.type === 'article' && cat.active)
                                  .map((category) => (
                                    <SelectItem key={category.id} value={category.slug}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={articleForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Trạng Thái *' : 'Status *'}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-article-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">{language === 'vi' ? 'Bản Nháp' : 'Draft'}</SelectItem>
                                <SelectItem value="published">{language === 'vi' ? 'Đã Đăng' : 'Published'}</SelectItem>
                                <SelectItem value="archived">{language === 'vi' ? 'Lưu Trữ' : 'Archived'}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                  </div>

                  {/* SEO Settings Section - Bilingual */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">{language === 'vi' ? 'Cài Đặt SEO' : 'SEO Settings'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* English SEO */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'SEO Tiếng Anh' : 'English SEO'}</h4>
                        <FormField
                          control={articleForm.control}
                          name="metaTitleEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Title (EN)</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} data-testid="input-article-meta-title-en" placeholder="Custom SEO title in English..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={articleForm.control}
                          name="metaDescriptionEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Description (EN)</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ''} rows={3} data-testid="textarea-article-meta-description-en" placeholder="SEO description in English..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={articleForm.control}
                          name="metaKeywordsEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Keywords (EN)</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} data-testid="input-article-meta-keywords-en" placeholder="keyword1, keyword2, keyword3" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Vietnamese SEO */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'SEO Tiếng Việt' : 'Vietnamese SEO'}</h4>
                        <FormField
                          control={articleForm.control}
                          name="metaTitleVi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Title (VI)</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} data-testid="input-article-meta-title-vi" placeholder="Tiêu đề SEO bằng tiếng Việt..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={articleForm.control}
                          name="metaDescriptionVi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Description (VI)</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ''} rows={3} data-testid="textarea-article-meta-description-vi" placeholder="Mô tả SEO bằng tiếng Việt..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={articleForm.control}
                          name="metaKeywordsVi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Keywords (VI)</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} data-testid="input-article-meta-keywords-vi" placeholder="từ khóa 1, từ khóa 2, từ khóa 3" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsArticleDialogOpen(false);
                        setEditingArticle(null);
                        setArticleImagePreview('');
                        setArticleImageFile(null);
                        setArticleContentImages([]);
                        articleForm.reset();
                      }}
                      data-testid="button-cancel-article"
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
                      data-testid="button-save-article"
                    >
                      {editingArticle ? (language === 'vi' ? 'Cập Nhật Bài Viết' : 'Update Article') : (language === 'vi' ? 'Tạo Bài Viết' : 'Create Article')}
                    </Button>
                  </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
            </Dialog>
            {articlesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] whitespace-nowrap">{language === 'vi' ? 'Danh Mục' : 'Category'}</TableHead>
                    <TableHead>{language === 'vi' ? 'Tiêu Đề' : 'Title'}</TableHead>
                    <TableHead className="w-[100px] whitespace-nowrap">{language === 'vi' ? 'Ngôn Ngữ' : 'Languages'}</TableHead>
                    <TableHead className="w-[120px] whitespace-nowrap">{language === 'vi' ? 'Ngày Đăng' : 'Published'}</TableHead>
                    <TableHead className="w-[130px] whitespace-nowrap">{language === 'vi' ? 'Trạng Thái' : 'Status'}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    return paginatedSlugs.map((slug) => {
                      const articleGroup = groupedArticlesMap[slug];
                      const enVersion = articleGroup.find(a => a.language === 'en');
                      const viVersion = articleGroup.find(a => a.language === 'vi');
                      const displayArticle = enVersion || viVersion || articleGroup[0];
                      
                      const hasEn = !!enVersion;
                      const hasVi = !!viVersion;

                      return (
                        <TableRow key={slug} data-testid={`row-article-${slug}`}>
                          <TableCell>
                            <span className="text-sm" data-testid={`badge-category-${slug}`}>
                              {(() => {
                                const cat = categories.find(c => c.slug === displayArticle.category && c.type === 'article');
                                return cat ? (language === 'vi' && cat.nameVi ? cat.nameVi : cat.name) : displayArticle.category;
                              })()}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className="truncate">{displayArticle.title}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {hasEn && <span className="text-[14px] text-white">EN</span>}
                              {hasVi && <span className="text-[14px] text-white">VI</span>}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-published-${slug}`}>
                            {displayArticle.publishedAt ? formatDate(displayArticle.publishedAt) : '-'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={displayArticle.status}
                              onValueChange={async (newStatus) => {
                                try {
                                  for (const article of articleGroup) {
                                    await updateArticleMutation.mutateAsync({ 
                                      id: article.id, 
                                      data: { status: newStatus } 
                                    });
                                  }
                                } catch (error) {
                                }
                              }}
                              data-testid={`badge-status-${slug}`}
                            >
                              <SelectTrigger className="h-auto py-1 px-3 text-sm bg-transparent border-none hover:bg-white/10 w-[110px] gap-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Bản Nháp</SelectItem>
                                <SelectItem value="published">Đã Đăng</SelectItem>
                                <SelectItem value="archived">Lưu Trữ</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-3">
                              <Pencil 
                                className="h-4 w-4 cursor-pointer text-white/50 hover:text-white"
                                onClick={() => handleEditArticle(displayArticle)}
                                data-testid={`button-edit-article-${slug}`}
                              />
                              <Star 
                                className={`h-4 w-4 ${displayArticle.status === 'published' ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'} ${displayArticle.featured ? 'text-white fill-white' : 'text-white/50 hover:text-white'} ${togglingFeaturedSlug === slug ? "opacity-50" : ""}`}
                                onClick={async () => {
                                  if (displayArticle.status !== 'published') return;
                                  if (togglingFeaturedSlug === slug) return;
                                  const featuredCount = uniqueArticleSlugs.filter(s => 
                                    groupedArticlesMap[s].some(a => a.featured)
                                  ).length;
                                  if (!displayArticle.featured && featuredCount >= 10) {
                                    toast({
                                      title: language === 'vi' ? 'Đã đạt giới hạn' : 'Limit reached',
                                      description: language === 'vi' ? 'Tối đa 10 bài viết được ghim nổi bật.' : 'Maximum 10 articles can be pinned as featured.',
                                      variant: 'destructive',
                                    });
                                    return;
                                  }
                                  setTogglingFeaturedSlug(slug);
                                  try {
                                    for (const article of articleGroup) {
                                      await toggleArticleFeaturedMutation.mutateAsync({ 
                                        id: article.id, 
                                        featured: !displayArticle.featured 
                                      });
                                    }
                                  } catch (error) {
                                  } finally {
                                    setTogglingFeaturedSlug(null);
                                  }
                                }}
                                data-testid={`button-toggle-featured-${slug}`}
                                title={displayArticle.status !== 'published' ? (language === 'vi' ? 'Chỉ áp dụng cho trạng thái Đã Đăng' : 'Only available for published articles') : displayArticle.featured ? "Remove from featured" : "Mark as featured"}
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Trash2 
                                    className="h-4 w-4 cursor-pointer text-white/50 hover:text-white"
                                    data-testid={`button-delete-article-${slug}`}
                                  />
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{language === 'vi' ? 'Xóa Bài Viết?' : 'Delete Article?'}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {language === 'vi' ? `Thao tác này sẽ xóa vĩnh viễn "${displayArticle.title}" (cả phiên bản EN và VI). Hành động này không thể hoàn tác.` : `This will permanently delete "${displayArticle.title}" (both EN and VI versions). This action cannot be undone.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        try {
                                          for (const article of articleGroup) {
                                            await deleteArticleMutation.mutateAsync(article.id);
                                          }
                                        } catch (error) {
                                        }
                                      }}
                                    >
                                      {language === 'vi' ? 'Xóa' : 'Delete'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            )}
            {uniqueArticleSlugs.length > 10 && (
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArticlesPage(1)}
                    disabled={articlesPage === 1}
                    className="text-xs"
                  >
                    FIRST
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArticlesPage(prev => Math.max(1, prev - 1))}
                    disabled={articlesPage === 1}
                    className="text-xs"
                  >
                    PREV
                  </Button>
                  {Array.from({ length: articlesTotalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={articlesPage === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setArticlesPage(page)}
                      className="text-xs min-w-[32px]"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArticlesPage(prev => Math.min(articlesTotalPages, prev + 1))}
                    disabled={articlesPage === articlesTotalPages}
                    className="text-xs"
                  >
                    NEXT
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArticlesPage(articlesTotalPages)}
                    disabled={articlesPage === articlesTotalPages}
                    className="text-xs"
                  >
                    LAST
                  </Button>
                </div>
                <div className="text-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    Showing {articlesStartIndex + 1}-{Math.min(articlesEndIndex, uniqueArticleSlugs.length)} of {uniqueArticleSlugs.length} articles
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'partners') {
    if (!hasPermission(user, 'partners')) {
      return <PermissionDenied feature="Partners" />;
    }
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
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
                    toast({
                      title: "Maximum partners reached",
                      description: "You have reached the maximum limit of 24 partners. Please delete an existing partner to add a new one.",
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
                Add Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? "Edit Partner" : "Add New Partner"}
                </DialogTitle>
              </DialogHeader>
              <Form {...partnerForm}>
                <form onSubmit={partnerForm.handleSubmit(onPartnerSubmit)} className="space-y-6">
                  <FormField
                    control={partnerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partner Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter partner name" data-testid="input-partner-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Partner Logo Upload */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Upload Logo (PNG, JPG only)</label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handlePartnerLogoFileChange}
                        className="block w-full text-sm text-foreground
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-none file:border file:border-white/30
                          file:text-sm file:font-medium
                          file:bg-transparent file:text-white
                          hover:file:bg-white/10 hover:file:border-white cursor-pointer"
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

                    {/* Or Use URL */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or use URL</span>
                      </div>
                    </div>

                    <FormField
                      control={partnerForm.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
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
                    {editingPartner ? "Update Partner" : "Add Partner"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Partners</CardTitle>
          </CardHeader>
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
                          <img 
                            src={partner.logoData || partner.logo || ''} 
                            alt={partner.name}
                            className="max-w-full max-h-full object-contain"
                            data-testid={`img-partner-logo-${partner.id}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-light" data-testid={`text-partner-name-${partner.id}`}>
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
                                <AlertDialogDescription>
                                  {language === 'vi' ? `Thao tác này sẽ xóa vĩnh viễn "${partner.name}". Không thể hoàn tác.` : `This will permanently delete "${partner.name}". This action cannot be undone.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePartnerMutation.mutate(partner.id)}
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
      </div>
    );
  }

  // Users Management Section
  if (activeTab === 'users') {
    if (!hasPermission(user, 'users')) {
      return <PermissionDenied feature="User Management" />;
    }
    const onUserSubmit = (data: UserFormData) => {
      if (editingUser) {
        // If user is not super admin, preserve username, role, and permissions
        if (user.role !== 'superadmin') {
          updateUserMutation.mutate({ 
            id: editingUser.id, 
            username: editingUser.username,
            role: editingUser.role,
            permissions: editingUser.permissions,
            displayName: data.displayName,
            email: data.email,
          });
        } else {
          updateUserMutation.mutate({ id: editingUser.id, ...data });
        }
      } else {
        // Creating new user - ensure username is provided
        if (!data.username || data.username.length < 3) {
          toast({
            title: "Validation Error",
            description: "Username is required and must be at least 3 characters",
            variant: "destructive",
          });
          return;
        }
        if (!data.password || data.password.length < 6) {
          toast({
            title: "Validation Error",
            description: "Password is required and must be at least 6 characters",
            variant: "destructive",
          });
          return;
        }
        createUserMutation.mutate(data);
      }
    };

    const handleEditUser = (user: any) => {
      setEditingUser(user);
      userForm.reset({
        username: user.username,
        password: "",
        displayName: user.displayName || "",
        email: user.email || "",
        role: user.role || "admin",
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      });
      setIsUserDialogOpen(true);
    };

    const handleChangePassword = (userId: string) => {
      setChangePasswordUserId(userId);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangePasswordDialogOpen(true);
    };

    const submitPasswordChange = () => {
      if (!changePasswordUserId) return;
      if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords do not match",
          description: "New password and confirm password must be the same.",
          variant: "destructive",
        });
        return;
      }
      if (newPassword.length < 6) {
        toast({
          title: "Password too short",
          description: "Password must be at least 6 characters.",
          variant: "destructive",
        });
        return;
      }
      changePasswordMutation.mutate({
        id: changePasswordUserId,
        currentPassword,
        newPassword,
      });
    };

    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Người Dùng' : 'User Management'}</h2>
            <p className="text-sm text-white/50 mt-1">
              {language === 'vi' ? 'Quản lý tài khoản admin và quyền hạn' : 'Manage admin accounts and permissions'}
            </p>
          </div>
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  userForm.reset({
                    username: "",
                    password: "",
                    displayName: "",
                    email: "",
                    role: "admin",
                    permissions: [],
                  });
                }}
                data-testid="button-add-user"
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === 'vi' ? 'Thêm Người Dùng' : 'Add User'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? (language === 'vi' ? 'Chỉnh Sửa Người Dùng' : 'Edit User') : (language === 'vi' ? 'Thêm Người Dùng Mới' : 'Add New User')}
                </DialogTitle>
              </DialogHeader>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                  {/* Only super admin can see and edit username, password, role, and permissions */}
                  {user.role === 'superadmin' && (
                    <>
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tên Đăng Nhập *' : 'Username *'}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={language === 'vi' ? 'Nhập tên đăng nhập' : 'Enter username'} data-testid="input-user-username" disabled={!!editingUser} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!editingUser && (
                        <FormField
                          control={userForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'vi' ? 'Mật Khẩu *' : 'Password *'}</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'} data-testid="input-user-password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}

                  <FormField
                    control={userForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Tên Hiển Thị' : 'Display Name'}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={language === 'vi' ? 'Nhập tên hiển thị' : 'Enter display name'} data-testid="input-user-displayname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Only super admin can see and edit role */}
                  {user.role === 'superadmin' && (
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Vai Trò *' : 'Role *'}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-user-role">
                                <SelectValue placeholder={language === 'vi' ? 'Chọn vai trò' : 'Select role'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="superadmin">{language === 'vi' ? 'Super Admin (Toàn Quyền)' : 'Super Admin (Full Access)'}</SelectItem>
                              <SelectItem value="admin">{language === 'vi' ? 'Admin (Quyền Tùy Chỉnh)' : 'Admin (Custom Permissions)'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Permissions - only show for admin/editor roles AND only super admin can see/edit */}
                  {user.role === 'superadmin' && (userForm.watch('role') === 'admin' || userForm.watch('role') === 'editor') && (
                    <FormField
                      control={userForm.control}
                      name="permissions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Quyền Hạn' : 'Permissions'}</FormLabel>
                          <div className="border border-white/10 rounded-none p-4 space-y-3">
                            {AVAILABLE_PERMISSIONS.map((perm) => (
                              <div key={perm.id} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`perm-${perm.id}`}
                                  checked={field.value?.includes(perm.id)}
                                  onCheckedChange={(checked) => {
                                    const newPermissions = checked
                                      ? [...(field.value || []), perm.id]
                                      : (field.value || []).filter((p: string) => p !== perm.id);
                                    field.onChange(newPermissions);
                                  }}
                                  data-testid={`checkbox-permission-${perm.id}`}
                                />
                                <label
                                  htmlFor={`perm-${perm.id}`}
                                  className="text-sm font-light cursor-pointer"
                                >
                                  {language === 'vi' ? perm.labelVi : perm.label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsUserDialogOpen(false);
                        setEditingUser(null);
                        userForm.reset();
                      }}
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                      data-testid="button-save-user"
                    >
                      {editingUser ? (language === 'vi' ? 'Cập Nhật' : 'Update User') : (language === 'vi' ? 'Tạo Người Dùng' : 'Create User')}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Change Password Dialog */}
        <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                {language === 'vi' ? 'Đổi Mật Khẩu' : 'Change Password'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Mật Khẩu Hiện Tại' : 'Current Password'}</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={language === 'vi' ? 'Nhập mật khẩu hiện tại' : 'Enter current password'}
                  data-testid="input-current-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Mật Khẩu Mới' : 'New Password'}</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={language === 'vi' ? 'Nhập mật khẩu mới (tối thiểu 6 ký tự)' : 'Enter new password (min 6 characters)'}
                  data-testid="input-new-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Xác Nhận Mật Khẩu Mới' : 'Confirm New Password'}</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm new password'}
                  data-testid="input-confirm-password"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangePasswordDialogOpen(false);
                    setChangePasswordUserId(null);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button
                  onClick={submitPasswordChange}
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-submit-password"
                >
                  {language === 'vi' ? 'Đổi Mật Khẩu' : 'Change Password'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {usersLoading ? (
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
            ) : adminUsers.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-lg font-light mb-2">{language === 'vi' ? 'Không tìm thấy người dùng' : 'No users found'}</h3>
                <p className="text-muted-foreground">{language === 'vi' ? 'Tạo người dùng admin đầu tiên để bắt đầu.' : 'Create your first admin user to get started.'}</p>
              </div>
            ) : (
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] whitespace-nowrap">{language === 'vi' ? 'Tên Đăng Nhập' : 'Username'}</TableHead>
                    <TableHead className="w-[160px] whitespace-nowrap">{language === 'vi' ? 'Tên Hiển Thị' : 'Display Name'}</TableHead>
                    <TableHead className="w-[120px] whitespace-nowrap">{language === 'vi' ? 'Vai Trò' : 'Role'}</TableHead>
                    <TableHead>{language === 'vi' ? 'Quyền Hạn' : 'Permissions'}</TableHead>
                    <TableHead className="w-[100px] text-right whitespace-nowrap"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((tableUser: any) => (
                    <TableRow key={tableUser.id} data-testid={`row-user-${tableUser.id}`}>
                      <TableCell className="font-medium">{tableUser.username}</TableCell>
                      <TableCell>{tableUser.displayName || "—"}</TableCell>
                      <TableCell>
                        <span className="text-white text-[14px]">
                          {tableUser.role === 'superadmin' ? 'Super Admin' : tableUser.role === 'admin' ? 'Admin' : 'Editor'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {tableUser.role === 'superadmin' ? (
                          <span className="text-white text-sm">{language === 'vi' ? 'Toàn Quyền' : 'Full Access'}</span>
                        ) : Array.isArray(tableUser.permissions) && tableUser.permissions.length > 0 ? (
                          <span className="text-white text-sm">
                            {tableUser.permissions.length >= AVAILABLE_PERMISSIONS.length
                              ? (language === 'vi' ? 'Toàn Quyền' : 'Full Access')
                              : tableUser.permissions.map((p: string) => {
                                  const perm = AVAILABLE_PERMISSIONS.find(ap => ap.id === p);
                                  return perm ? (language === 'vi' ? perm.labelVi : perm.label) : p;
                                }).join(', ')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">{language === 'vi' ? 'Chưa có quyền' : 'No permissions'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(tableUser)}
                            data-testid={`button-edit-user-${tableUser.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePassword(tableUser.id)}
                            data-testid={`button-change-password-${tableUser.id}`}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                          {/* Only super admin (logged-in user) can delete users */}
                          {user.role === 'superadmin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent border-white/30 hover:bg-white/10 hover:border-white"
                                  disabled={tableUser.role === 'superadmin' && adminUsers.filter((u: any) => u.role === 'superadmin').length === 1}
                                  data-testid={`button-delete-user-${tableUser.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-white" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{language === 'vi' ? 'Xóa Người Dùng?' : 'Delete User?'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === 'vi' ? `Xóa vĩnh viễn người dùng "${tableUser.username}". Hành động này không thể hoàn tác.` : `This will permanently delete the user "${tableUser.username}". This action cannot be undone.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUserMutation.mutate(tableUser.id)}
                                  >
                                    {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-muted-foreground">{language === 'vi' ? 'Chọn tab để xem nội dung' : 'Select a tab to view content'}</p>
    </div>
  );
}
