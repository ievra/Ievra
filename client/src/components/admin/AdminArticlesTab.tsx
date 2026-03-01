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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Plus, Star, Settings, Lock, Search } from "lucide-react";
import type { Article, InsertArticle, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

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

type BilingualArticleFormData = z.infer<typeof bilingualArticleSchema>;
type ArticleFormData = InsertArticle;

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

interface AdminArticlesTabProps {
  user: any;
  hasPermission: (user: any, permission: string) => boolean;
}

export default function AdminArticlesTab({ user, hasPermission }: AdminArticlesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [togglingFeaturedSlug, setTogglingFeaturedSlug] = useState<string | null>(null);
  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);
  const [articleImagePreview, setArticleImagePreview] = useState<string>('');
  const [articleContentImages, setArticleContentImages] = useState<string[]>([]);
  const [isCategoryManagementDialogOpen, setIsCategoryManagementDialogOpen] = useState(false);
  const [deleteCategoryData, setDeleteCategoryData] = useState<{ id: string, name: string } | null>(null);
  const [isDeleteCategoryAlertOpen, setIsDeleteCategoryAlertOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameVi, setNewCategoryNameVi] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; nameVi: string | null } | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState<"project" | "article">("article");

  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('all');
  const [articleStatusFilter, setArticleStatusFilter] = useState('all');
  const [articlesPage, setArticlesPage] = useState(1);
  const articlesPerPage = 10;

  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ['/api/articles', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/articles?status=all');
      if (!res.ok) throw new Error('Failed to fetch articles');
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
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

  useEffect(() => {
    if (isArticleDialogOpen && !editingArticle) {
      articleForm.reset();
      setArticleImagePreview('');
      setArticleContentImages([]);
      setArticleImageFile(null);
    }
  }, [isArticleDialogOpen, editingArticle]);

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
  }).filter(slug => {
    const group = groupedArticlesMap[slug];
    const display = group[0];
    const searchLower = articleSearchQuery.toLowerCase();
    if (articleCategoryFilter !== 'all' && display.category !== articleCategoryFilter) return false;
    if (articleStatusFilter !== 'all' && display.status !== articleStatusFilter) return false;
    if (!searchLower) return true;
    const cat = categories.find(c => c.slug === display.category && c.type === 'article');
    const categoryName = cat ? `${cat.name} ${cat.nameVi || ''}`.toLowerCase() : (display.category || '').toLowerCase();
    return group.some(a =>
      (a.title || '').toLowerCase().includes(searchLower) ||
      categoryName.includes(searchLower)
    );
  });
  const articlesTotalPages = Math.ceil(uniqueArticleSlugs.length / articlesPerPage);
  const articlesStartIndex = (articlesPage - 1) * articlesPerPage;
  const articlesEndIndex = articlesStartIndex + articlesPerPage;
  const paginatedSlugs = uniqueArticleSlugs.slice(articlesStartIndex, articlesEndIndex);

  const createArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const response = await apiRequest('POST', '/api/articles', data);
      return response.json();
    },
    onSuccess: (newArticle) => {
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

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ArticleFormData> }) => {
      const response = await apiRequest('PUT', `/api/articles/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedArticle) => {
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

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
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
    const previewImage = enVersion?.featuredImage || enVersion?.featuredImageData || article.featuredImage || article.featuredImageData;
    if (previewImage) {
      setArticleImagePreview(previewImage);
    } else {
      setArticleImagePreview('');
    }
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

      articleForm.reset();
      setEditingArticle(null);
      setArticleImagePreview('');
      setArticleImageFile(null);
      setArticleContentImages([]);
      setIsArticleDialogOpen(false);
      toast({ title: "Article updated successfully" });
    } catch (error) {
      console.error('Article submit error:', error);
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
        setArticleImagePreview(data.path);
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

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!hasPermission(user, 'articles')) {
    return <PermissionDenied feature="Articles / Blog" />;
  }

  return (
    <div className="space-y-6 p-6">
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
      <AlertDialog open={isDeleteCategoryAlertOpen} onOpenChange={setIsDeleteCategoryAlertOpen}>
        <AlertDialogContent className="bg-black border border-white/20 rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light">{language === 'vi' ? 'Xác Nhận Xóa Danh Mục' : 'Confirm Category Deletion'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {language === 'vi' ? 'Bạn có chắc chắn muốn xóa danh mục' : 'Are you sure you want to delete the category'} <span className="font-medium text-white">"{deleteCategoryData?.name}"</span>?
              <br /><br />
              <span className="!text-red-400">{language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}</span> {language === 'vi' ? 'Vui lòng xác nhận để tiếp tục.' : 'Please confirm to proceed.'}
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
            <DialogTitle>{language === 'vi' ? 'Sửa Danh Mục Bài Viết' : 'Edit Article Category'}</DialogTitle>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Bài Viết' : 'Articles Management'}</h2>
        <div className="flex gap-2 flex-shrink-0">
          <Dialog open={isArticleDialogOpen} onOpenChange={(open) => {
            setIsArticleDialogOpen(open);
            if (!open) {
              setEditingArticle(null);
              setArticleImagePreview('');
              setArticleImageFile(null);
              setArticleContentImages([]);
              articleForm.reset();
            }
          }}>
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
                      <FormLabel>{language === 'vi' ? 'Danh Mục' : 'Category'}</FormLabel>
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
                      <FormLabel>{language === 'vi' ? 'Trạng Thái' : 'Status'}</FormLabel>
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

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">{language === 'vi' ? 'Cài Đặt SEO' : 'SEO Settings'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={articleSearchQuery}
            onChange={(e) => { setArticleSearchQuery(e.target.value); setArticlesPage(1); }}
            placeholder={language === 'vi' ? 'Chúng tôi có thể giúp bạn tìm gì?' : 'What can we help you find?'}
            className="pl-10 bg-transparent border-0 border-b border-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/60 placeholder:text-white/40"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-3 flex-shrink-0">
        <Select value={articleCategoryFilter} onValueChange={(v) => { setArticleCategoryFilter(v); setArticlesPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-0 border-b border-white/30 rounded-none focus:ring-0">
            <SelectValue placeholder={language === 'vi' ? 'Tất cả danh mục' : 'All categories'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'vi' ? 'Tất cả danh mục' : 'All categories'}</SelectItem>
            {categories.filter(c => c.type === 'article' && c.active).map(cat => (
              <SelectItem key={cat.id} value={cat.slug}>{language === 'vi' && cat.nameVi ? cat.nameVi : cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={articleStatusFilter} onValueChange={(v) => { setArticleStatusFilter(v); setArticlesPage(1); }}>
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
          {articlesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[700px] [&_td]:py-2 [&_th]:py-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] whitespace-nowrap text-center">{language === 'vi' ? 'STT' : 'NO'}</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap text-left">{language === 'vi' ? 'Danh Mục' : 'Category'}</TableHead>
                  <TableHead className="whitespace-nowrap text-left">{language === 'vi' ? 'Tiêu Đề' : 'Title'}</TableHead>
                  <TableHead className="w-[80px] whitespace-nowrap text-left">{language === 'vi' ? 'Ngôn Ngữ' : 'Lang'}</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap text-left">{language === 'vi' ? 'Ngày Đăng' : 'Published'}</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap text-left">{language === 'vi' ? 'Trạng Thái' : 'Status'}</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  return paginatedSlugs.map((slug, idx) => {
                    const articleGroup = groupedArticlesMap[slug];
                    const enVersion = articleGroup.find(a => a.language === 'en');
                    const viVersion = articleGroup.find(a => a.language === 'vi');
                    const displayArticle = enVersion || viVersion || articleGroup[0];

                    const hasEn = !!enVersion;
                    const hasVi = !!viVersion;

                    return (
                      <TableRow key={slug} data-testid={`row-article-${slug}`}>
                        <TableCell className="text-center">{(articlesPage - 1) * articlesPerPage + idx + 1}</TableCell>
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
                              {displayArticle.status === 'draft' && <SelectItem value="draft">{language === 'vi' ? 'Bản Nháp' : 'Draft'}</SelectItem>}
                              <SelectItem value="published">{language === 'vi' ? 'Đã Đăng' : 'Published'}</SelectItem>
                              <SelectItem value="archived">{language === 'vi' ? 'Lưu Trữ' : 'Archived'}</SelectItem>
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
                                  <AlertDialogDescription className="text-white/70">
                                    {language === 'vi'
                                      ? <>Thao tác này sẽ xóa vĩnh viễn <strong className="text-white">"{displayArticle.title}"</strong> (cả phiên bản EN và VI).<br /><span className="!text-red-400">Hành động này không thể hoàn tác.</span></>
                                      : <>This will permanently delete <strong className="text-white">"{displayArticle.title}"</strong> (both EN and VI versions).<br /><span className="!text-red-400">This action cannot be undone.</span></>
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="rounded-none"
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
            </div>
          )}
          {uniqueArticleSlugs.length > 0 && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setArticlesPage(1)}
                  disabled={articlesPage === 1}
                  className="text-xs"
                >
                  {language === 'vi' ? 'ĐẦU' : 'FIRST'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setArticlesPage(prev => Math.max(1, prev - 1))}
                  disabled={articlesPage === 1}
                  className="text-xs"
                >
                  {language === 'vi' ? 'TRƯỚC' : 'PREV'}
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
                  {language === 'vi' ? 'SAU' : 'NEXT'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setArticlesPage(articlesTotalPages)}
                  disabled={articlesPage === articlesTotalPages}
                  className="text-xs"
                >
                  {language === 'vi' ? 'CUỐI' : 'LAST'}
                </Button>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {language === 'vi' ? `Hiển thị ${articlesStartIndex + 1}-${Math.min(articlesEndIndex, uniqueArticleSlugs.length)} / ${uniqueArticleSlugs.length} bài viết` : `Showing ${articlesStartIndex + 1}-${Math.min(articlesEndIndex, uniqueArticleSlugs.length)} of ${uniqueArticleSlugs.length} articles`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
