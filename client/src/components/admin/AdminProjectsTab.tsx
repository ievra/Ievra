import { useState, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";
import { Pencil, Trash2, Plus, Star, Settings, Lock, Search } from "lucide-react";
import type { Project, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

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
  descriptionTitleEn: z.string().optional(),
  descriptionTitleVi: z.string().optional(),
  section2Image: z.string().optional(),
  section3Image: z.string().optional(),
  bannerTitleEn: z.string().optional(),
  bannerTitleVi: z.string().optional(),
  bannerImage: z.string().optional(),
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
  coverImages: z.array(z.string()).max(1, "Maximum 1 cover image allowed").default([]),
  contentImages: z.array(z.string()).max(1, "Maximum 1 content image allowed").default([]),
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

interface AdminProjectsTabProps {
  user: any;
  hasPermission: (user: any, permission: string) => boolean;
}

export default function AdminProjectsTab({ user, hasPermission }: AdminProjectsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectYearFilter, setProjectYearFilter] = useState('all');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [projectsPage, setProjectsPage] = useState(1);
  const projectsPerPage = 10;

  const [isCategoryManagementDialogOpen, setIsCategoryManagementDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameVi, setNewCategoryNameVi] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; nameVi: string | null } | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [deleteProjectData, setDeleteProjectData] = useState<{ title: string; group: Project[] } | null>(null);
  const [deleteCategoryData, setDeleteCategoryData] = useState<{ id: string, name: string } | null>(null);
  const [isDeleteCategoryAlertOpen, setIsDeleteCategoryAlertOpen] = useState(false);

  if (!hasPermission(user, 'projects')) {
    return <PermissionDenied feature="Projects" />;
  }

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/projects?status=all');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const projectForm = useForm<BilingualProjectFormData>({
    resolver: zodResolver(bilingualProjectSchema),
    shouldUnregister: true,
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
      descriptionTitleEn: "",
      descriptionTitleVi: "",
      section2Image: "",
      section3Image: "",
      bannerTitleEn: "",
      bannerTitleVi: "",
      bannerImage: "",
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
      coverImages: [],
      contentImages: [],
      galleryImages: [],
      featured: false,
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

  useEffect(() => {
    if (isProjectDialogOpen && !editingProject) {
      projectForm.reset();
    }
  }, [isProjectDialogOpen, editingProject]);

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: "Đã tạo dự án thành công" });
      setDialogKey(k => k + 1);
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
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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

  const handleEditProject = (project: Project) => {
    setIsNewProject(false);
    setEditingProject(project);
    setDialogKey(k => k + 1);

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
      descriptionTitleEn: enVersion?.descriptionTitle || "",
      descriptionTitleVi: viVersion?.descriptionTitle || "",
      section2Image: (enVersion?.section2Image || viVersion?.section2Image || "") as string,
      section3Image: (enVersion?.section3Image || viVersion?.section3Image || "") as string,
      bannerTitleEn: enVersion?.bannerTitle || "",
      bannerTitleVi: viVersion?.bannerTitle || "",
      bannerImage: (enVersion?.bannerImage || viVersion?.bannerImage || "") as string,
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
      coverImages: Array.isArray(project.coverImages) ? project.coverImages : [],
      contentImages: Array.isArray(project.contentImages) ? project.contentImages : [],
      galleryImages: Array.isArray(project.galleryImages) ? project.galleryImages : [],
      featured: project.featured,
      heroImage: project.heroImage || "",
      images: Array.isArray(project.images) ? project.images : [],
    });
    setIsProjectDialogOpen(true);
  };

  const handleCreateProjectDraft = async () => {
    const timestamp = Date.now();
    const draftSlug = `ban-nhap-${timestamp}`;
    const defaultCategory = (categories.find(c => c.type === 'project' && c.active) || categories.find(c => c.type === 'project'))?.slug || 'residential';
    try {
      const res = await apiRequest('POST', '/api/projects', {
        title: 'Dự Án Mới',
        slug: draftSlug,
        category: defaultCategory,
        language: 'vi',
        status: 'draft',
        featured: false,
        images: [],
      });
      const draft = await res.json();
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsNewProject(true);
      setEditingProject(draft);
      setDialogKey(k => k + 1);
      projectForm.reset({
        titleVi: '',
        titleEn: '',
        slug: draftSlug,
        category: defaultCategory,
        status: 'draft',
        featured: false,
        coverImages: [],
        contentImages: [],
        galleryImages: [],
        images: [],
      });
      setIsProjectDialogOpen(true);
    } catch {
      setIsNewProject(true);
      setEditingProject(null);
      setDialogKey(k => k + 1);
      projectForm.reset();
      setIsProjectDialogOpen(true);
    }
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

      const isDuplicateSlug = projects.some(p =>
        p.slug === slug && (!editingProject || p.slug !== editingProject.slug)
      );
      if (isDuplicateSlug) {
        projectForm.setError('slug', {
          type: 'manual',
          message: 'URL/Slug này đã tồn tại. Vui lòng chọn URL khác.'
        });
        toast({
          title: 'URL/Slug đã tồn tại',
          description: 'Một dự án khác đang dùng URL này. Vui lòng nhập URL khác.',
          variant: 'destructive',
        });
        setIsProjectSubmitting(false);
        return;
      }

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
          descriptionTitle: data.descriptionTitleEn,
          section2Image: data.section2Image,
          section3Image: data.section3Image,
          bannerTitle: data.bannerTitleEn,
          bannerImage: data.bannerImage,
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
          descriptionTitle: data.descriptionTitleVi,
          section2Image: data.section2Image,
          section3Image: data.section3Image,
          bannerTitle: data.bannerTitleVi,
          bannerImage: data.bannerImage,
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

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const groupedProjectsMap = projects.reduce((acc, project) => {
    const key = project.slug || project.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const featuredCount = Object.keys(groupedProjectsMap).filter(slug =>
    groupedProjectsMap[slug].some(p => p.featured)
  ).length;

  const projectYears = Array.from(new Set(projects.map(p => p.completionYear).filter(Boolean))).sort((a, b) => String(b).localeCompare(String(a)));

  const uniqueProjectSlugs = Object.keys(groupedProjectsMap).sort((a, b) => {
    const aDate = Math.max(...groupedProjectsMap[a].map(p => new Date(p.createdAt).getTime()));
    const bDate = Math.max(...groupedProjectsMap[b].map(p => new Date(p.createdAt).getTime()));
    return bDate - aDate;
  }).filter(slug => {
    const group = groupedProjectsMap[slug];
    const primary = group[0];
    const searchLower = projectSearchQuery.toLowerCase();
    if (projectYearFilter !== 'all' && primary.completionYear !== projectYearFilter) return false;
    if (projectCategoryFilter !== 'all' && primary.category !== projectCategoryFilter) return false;
    if (projectStatusFilter !== 'all' && primary.status !== projectStatusFilter) return false;
    if (!searchLower) return true;
    const cat = categories.find(c => c.slug === primary.category && c.type === 'project');
    const categoryName = cat ? `${cat.name} ${cat.nameVi || ''}`.toLowerCase() : (primary.category || '').toLowerCase();
    return group.some(p =>
      (p.title || '').toLowerCase().includes(searchLower) ||
      (p.style || '').toLowerCase().includes(searchLower) ||
      (p.completionYear || '').toLowerCase().includes(searchLower) ||
      categoryName.includes(searchLower)
    );
  });
  const projectsTotalPages = Math.ceil(uniqueProjectSlugs.length / projectsPerPage);
  const projectsStartIndex = (projectsPage - 1) * projectsPerPage;
  const projectsEndIndex = projectsStartIndex + projectsPerPage;
  const paginatedProjectSlugs = uniqueProjectSlugs.slice(projectsStartIndex, projectsEndIndex);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Dự Án' : 'Projects Management'}</h2>
        <div className="flex gap-2 flex-shrink-0">
          <Dialog open={isProjectDialogOpen} onOpenChange={(open) => {
            setIsProjectDialogOpen(open);
            if (!open) {
              setEditingProject(null);
              projectForm.reset();
            }
          }}>
            <Button data-testid="button-add-project" className="h-10 px-4 min-w-[140px] justify-center" onClick={handleCreateProjectDraft}>
              <Plus className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Thêm Dự Án' : 'Add Project'}
            </Button>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {isNewProject ? (language === 'vi' ? 'Dự Án Mới' : 'New Project') : (language === 'vi' ? 'Chỉnh Sửa Dự Án' : 'Edit Project')}
              </DialogTitle>
            </DialogHeader>
            <div key={dialogKey} className="overflow-y-auto flex-1 px-1">
            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6">

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={projectForm.control}
                    name="locationEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Khu Vực (Tiếng Anh)' : 'Location (English)'}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-project-location-en" placeholder={language === 'vi' ? 'Nhập khu vực tiếng Anh...' : 'Enter location...'} />
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
                        <FormLabel>{language === 'vi' ? 'Khu Vực (Tiếng Việt)' : 'Location (Vietnamese)'}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-project-location-vi" placeholder="Nhập khu vực tiếng Việt..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-light">{language === 'vi' ? 'Mục 1 — Mô Tả Dự Án' : 'Section 1 — Project Description'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="descriptionTitleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề Mục (Tiếng Anh)' : 'Section Title (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Full-Service Interior Design" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="descriptionTitleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề Mục (Tiếng Việt)' : 'Section Title (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Dịch Vụ Thiết Kế Nội Thất" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                </div>

                <FormField
                  control={projectForm.control}
                  name="contentImages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'vi' ? 'Ảnh Mục 1 - Mô Tả Dự Án (Tối đa 1 ảnh, tỷ lệ 1:1)' : 'Section 1 Image - Project Description (Max 1, ratio 1:1)'}</FormLabel>
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

                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-light">{language === 'vi' ? 'Mục 2 — Triết Lý Thiết Kế' : 'Section 2 — Design Philosophy'}</h4>
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

                <FormField
                  control={projectForm.control}
                  name="section2Image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ảnh Mục 2 - Triết Lý Thiết Kế (1 ảnh, tỷ lệ 1:1)</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value ? [field.value] : []}
                          onChange={(urls: string[]) => field.onChange(urls[0] || "")}
                          multiple={false}
                          maxImages={1}
                          disabled={!hasPermission(user, 'projects')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-light">{language === 'vi' ? 'Mục 3 — Lựa Chọn Vật Liệu' : 'Section 3 — Material Selection'}</h4>
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

                <FormField
                  control={projectForm.control}
                  name="section3Image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ảnh Mục 3 - Lựa Chọn Vật Liệu (1 ảnh, tỷ lệ 1:1)</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value ? [field.value] : []}
                          onChange={(urls: string[]) => field.onChange(urls[0] || "")}
                          multiple={false}
                          maxImages={1}
                          disabled={!hasPermission(user, 'projects')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-light">{language === 'vi' ? 'Nội Dung (Mô Tả Chi Tiết)' : 'Content (Detailed Description)'}</h4>
                    <p className="text-xs text-muted-foreground">Format: *text* = bold, **text** = heading, ***text*** = heading + bold</p>
                  </div>
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

                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-light">{language === 'vi' ? 'Mục Banner (Bản Vẽ Kỹ Thuật)' : 'Banner Section (Technical Drawing)'}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="bannerTitleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề Banner (Tiếng Anh)' : 'Banner Title (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Technical Drawing" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="bannerTitleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề Banner (Tiếng Việt)' : 'Banner Title (Vietnamese)'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Bản Vẽ Kĩ Thuật" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={projectForm.control}
                    name="bannerImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Ảnh Banner (Trải rộng toàn trang)' : 'Banner Image (Full width)'}</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value ? [field.value] : []}
                            onChange={(urls: string[]) => field.onChange(urls[0] || "")}
                            multiple={false}
                            maxImages={1}
                            disabled={!hasPermission(user, 'projects')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                      <FormLabel>{language === 'vi' ? 'Ảnh Bìa (Tối đa 1 ảnh, tỷ lệ 3:4)' : 'Cover Image (Max 1, ratio 3:4)'}</FormLabel>
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
                  name="galleryImages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thư Viện Ảnh (Tối đa 6 ảnh, tỷ lệ 16:9 hoặc 1:1)</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          multiple
                          maxImages={6}
                          disabled={!hasPermission(user, 'projects')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <FormLabel>Danh Mục</FormLabel>
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
                  </div>
                </div>

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
                              setDeleteCategoryData({ id: String(category.id), name: category.name });
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
      <AlertDialog open={isDeleteCategoryAlertOpen} onOpenChange={setIsDeleteCategoryAlertOpen}>
        <AlertDialogContent className="bg-black border border-white/20 rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light">{language === 'vi' ? 'Xác Nhận Xóa Danh Mục' : 'Confirm Category Deletion'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {language === 'vi'
                ? <>Bạn có chắc chắn muốn xóa danh mục <span className="font-medium text-white">"{deleteCategoryData?.name}"</span>?</>
                : <>Are you sure you want to delete the category <span className="font-medium text-white">"{deleteCategoryData?.name}"</span>?</>
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
              className="rounded-none"
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={projectSearchQuery}
            onChange={(e) => { setProjectSearchQuery(e.target.value); setProjectsPage(1); }}
            placeholder={language === 'vi' ? 'Chúng tôi có thể giúp bạn tìm gì?' : 'What can we help you find?'}
            className="pl-10 bg-transparent border-0 border-b border-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/60 placeholder:text-white/40"
          />
        </div>
        <div className="grid grid-cols-3 sm:flex gap-3 flex-shrink-0">
          <Select value={projectCategoryFilter} onValueChange={(v) => { setProjectCategoryFilter(v); setProjectsPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
              <SelectValue placeholder={language === 'vi' ? 'Tất cả danh mục' : 'All categories'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'vi' ? 'Tất cả danh mục' : 'All categories'}</SelectItem>
              {categories.filter(c => c.type === 'project' && c.active).map(cat => (
                <SelectItem key={cat.id} value={cat.slug}>{language === 'vi' && cat.nameVi ? cat.nameVi : cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectYearFilter} onValueChange={(v) => { setProjectYearFilter(v); setProjectsPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
              <SelectValue placeholder={language === 'vi' ? 'Tất cả các năm' : 'All years'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'vi' ? 'Tất cả các năm' : 'All years'}</SelectItem>
              {projectYears.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectStatusFilter} onValueChange={(v) => { setProjectStatusFilter(v); setProjectsPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
              <SelectValue placeholder={language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'}</SelectItem>
              <SelectItem value="draft">{language === 'vi' ? 'Bản Nháp' : 'Draft'}</SelectItem>
              <SelectItem value="published">{language === 'vi' ? 'Đã Đăng' : 'Published'}</SelectItem>
              <SelectItem value="archived">{language === 'vi' ? 'Lưu Trữ' : 'Archived'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
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
            <div className="overflow-x-auto">
            <Table className="min-w-[900px] [&_td]:py-2 [&_th]:py-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] whitespace-nowrap text-center">{language === 'vi' ? 'STT' : 'NO'}</TableHead>
                  <TableHead className="w-[60px] whitespace-nowrap text-left">{language === 'vi' ? 'Năm' : 'Year'}</TableHead>
                  <TableHead className="w-[110px] whitespace-nowrap text-left">{language === 'vi' ? 'Danh Mục' : 'Category'}</TableHead>
                  <TableHead className="w-[110px] whitespace-nowrap text-left">{language === 'vi' ? 'Phong Cách' : 'Style'}</TableHead>
                  <TableHead className="w-[90px] whitespace-nowrap text-left">{language === 'vi' ? 'Diện Tích' : 'Area'}</TableHead>
                  <TableHead className="whitespace-nowrap text-left">{language === 'vi' ? 'Dự Án' : 'Project'}</TableHead>
                  <TableHead className="w-[80px] whitespace-nowrap text-left">{language === 'vi' ? 'Ngôn Ngữ' : 'Lang'}</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap text-left">{language === 'vi' ? 'Ngày Đăng' : 'Published'}</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap text-left">{language === 'vi' ? 'Trạng Thái' : 'Status'}</TableHead>
                  <TableHead className="w-[100px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjectSlugs.map((slug, idx) => {
                  const group = groupedProjectsMap[slug];
                  const hasVi = group.some(p => p.language === 'vi');
                  const hasEn = group.some(p => p.language === 'en');
                  const primary = (language === 'vi' ? group.find(p => p.language === 'vi') : group.find(p => p.language === 'en')) || group[0];
                  return (
                  <TableRow key={primary.id} data-testid={`row-project-${primary.id}`}>
                    <TableCell className="text-center">{(projectsPage - 1) * projectsPerPage + idx + 1}</TableCell>
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
                          if (newStatus === 'published') {
                            const missingFields: string[] = [];
                            const hasTitle = group.some(p => p.title && p.title.trim() && p.title !== 'Dự Án Mới');
                            if (!hasTitle) missingFields.push('Tiêu đề');
                            if (!primary.category) missingFields.push('Danh mục');
                            if (!primary.slug) missingFields.push('URL/Slug');
                            const hasStyle = group.some(p => p.style && p.style.trim());
                            if (!hasStyle) missingFields.push('Phong cách');
                            const hasLocation = group.some(p => p.location && p.location.trim());
                            if (!hasLocation) missingFields.push('Khu vực');
                            const hasArea = group.some(p => p.area && p.area.trim());
                            if (!hasArea) missingFields.push('Diện tích');
                            const hasYear = group.some(p => p.completionYear && p.completionYear.trim());
                            if (!hasYear) missingFields.push('Năm hoàn thành');
                            const hasMetaTitle = group.some(p => p.metaTitle && p.metaTitle.trim());
                            if (!hasMetaTitle) missingFields.push('SEO: Tiêu đề');
                            const hasMetaDesc = group.some(p => p.metaDescription && p.metaDescription.trim());
                            if (!hasMetaDesc) missingFields.push('SEO: Mô tả');
                            if (missingFields.length > 0) {
                              toast({
                                title: language === 'vi' ? 'Không thể đăng dự án' : 'Cannot publish project',
                                description: (language === 'vi' ? 'Vui lòng điền đầy đủ: ' : 'Please fill in: ') + missingFields.join(', '),
                                variant: 'destructive',
                              });
                              return;
                            }
                          }
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
                          {(primary as any).status === 'draft' && <SelectItem value="draft">{language === 'vi' ? 'Bản Nháp' : 'Draft'}</SelectItem>}
                          <SelectItem value="published">{language === 'vi' ? 'Đã Đăng' : 'Published'}</SelectItem>
                          <SelectItem value="archived">{language === 'vi' ? 'Lưu Trữ' : 'Archived'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-3">
                        <Pencil
                          className="h-4 w-4 cursor-pointer text-white/50 hover:text-white"
                          onClick={() => handleEditProject(primary)}
                          data-testid={`button-edit-project-${primary.id}`}
                        />
                        <span
                          title={!primary.featured && featuredCount >= 10 ? (language === 'vi' ? 'Đã đạt tối đa 10 bài ghim' : 'Max 10 pinned projects reached') : undefined}
                          onClick={() => {
                            if ((primary as any).status !== 'published') return;
                            if (!primary.featured && featuredCount >= 10) return;
                            group.forEach(p => {
                              updateProjectMutation.mutate({
                                id: p.id,
                                data: { featured: !primary.featured }
                              });
                            });
                          }}
                          data-testid={`button-toggle-featured-${primary.id}`}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              (primary as any).status !== 'published' || (!primary.featured && featuredCount >= 10)
                                ? 'cursor-not-allowed opacity-30'
                                : 'cursor-pointer'
                            } ${primary.featured ? 'text-white fill-white' : 'text-white/50 hover:text-white'}`}
                          />
                        </span>
                        <Trash2
                          className="h-4 w-4 cursor-pointer text-white/50 hover:text-red-400"
                          onClick={() => setDeleteProjectData({ title: primary.title, group })}
                          data-testid={`button-delete-project-${primary.id}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
          {uniqueProjectSlugs.length > 0 && (
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

      <AlertDialog open={!!deleteProjectData} onOpenChange={(open) => { if (!open) setDeleteProjectData(null); }}>
        <AlertDialogContent className="bg-black border border-white/20 rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light">{language === 'vi' ? 'Xác Nhận Xóa Dự Án' : 'Confirm Project Deletion'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {language === 'vi'
                ? <>Bạn có chắc chắn muốn xóa dự án <span className="font-medium text-white">"{deleteProjectData?.title}"</span>? Hành động này không thể hoàn tác.</>
                : <>Are you sure you want to delete project <span className="font-medium text-white">"{deleteProjectData?.title}"</span>? This action cannot be undone.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-white/5 border-white/10 hover:bg-white/10 rounded-none"
              onClick={() => setDeleteProjectData(null)}
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                deleteProjectData?.group.forEach(p => {
                  deleteProjectMutation.mutate(p.id);
                });
                setDeleteProjectData(null);
              }}
            >
              {language === 'vi' ? 'Xóa' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}