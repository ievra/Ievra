import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, Upload, Edit, X } from "lucide-react";
import type { AboutPageContent, AboutCoreValue, AboutShowcaseService, AboutProcessStep, AboutTeamMember, InsertAboutPageContent, InsertAboutCoreValue, InsertAboutShowcaseService, InsertAboutProcessStep, InsertAboutTeamMember } from "@shared/schema";
import { insertAboutPageContentSchema, insertAboutCoreValueSchema, insertAboutShowcaseServiceSchema, insertAboutProcessStepSchema, insertAboutTeamMemberSchema } from "@shared/schema";
import ImageUpload from "@/components/ImageUpload";
import ImageCropDialog from "@/components/ImageCropDialog";

interface AboutAdminTabProps {
  aboutContent?: AboutPageContent;
  aboutPrinciples: AboutCoreValue[];
  aboutShowcaseServices: AboutShowcaseService[];
  aboutProcessSteps: AboutProcessStep[];
  aboutTeamMembers: AboutTeamMember[];
  aboutContentLoading: boolean;
  aboutPrinciplesLoading: boolean;
  aboutShowcaseServicesLoading: boolean;
  aboutProcessStepsLoading: boolean;
  aboutTeamMembersLoading: boolean;
  onAboutContentSubmit: (data: InsertAboutPageContent) => Promise<void>;
  onPrincipleSubmit: (data: InsertAboutCoreValue) => Promise<void>;
  onShowcaseServiceSubmit: (data: InsertAboutShowcaseService) => Promise<void>;
  onProcessStepSubmit: (data: InsertAboutProcessStep) => Promise<void>;
  onTeamMemberSubmit: (data: InsertAboutTeamMember) => Promise<void>;
  updatePrincipleMutation: any;
  deletePrincipleMutation: any;
  updateShowcaseServiceMutation: any;
  deleteShowcaseServiceMutation: any;
  updateProcessStepMutation: any;
  deleteProcessStepMutation: any;
  updateTeamMemberMutation: any;
  deleteTeamMemberMutation: any;
  updateAboutContentMutation: any;
  showcaseBannerFile: File | null;
  showcaseBannerPreview: string;
  handleShowcaseBannerFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  historyImageFile: File | null;
  historyImagePreview: string;
  handleHistoryImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  missionVisionImageFile: File | null;
  missionVisionImagePreview: string;
  handleMissionVisionImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  teamMemberImagePreview: string;
  setTeamMemberImagePreview: (preview: string) => void;
  handleTeamMemberImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isTeamMemberDialogOpen: boolean;
  setIsTeamMemberDialogOpen: (open: boolean) => void;
  editingTeamMember: AboutTeamMember | null;
  setEditingTeamMember: (member: AboutTeamMember | null) => void;
  teamMemberForm: any;
  hasPermission: (permission: string) => boolean;
}

export default function AboutAdminTab({
  aboutContent,
  aboutPrinciples,
  aboutShowcaseServices,
  aboutProcessSteps,
  aboutTeamMembers,
  aboutContentLoading,
  aboutPrinciplesLoading,
  aboutShowcaseServicesLoading,
  aboutProcessStepsLoading,
  aboutTeamMembersLoading,
  onAboutContentSubmit,
  onPrincipleSubmit,
  onShowcaseServiceSubmit,
  onProcessStepSubmit,
  onTeamMemberSubmit,
  updatePrincipleMutation,
  deletePrincipleMutation,
  updateShowcaseServiceMutation,
  deleteShowcaseServiceMutation,
  updateProcessStepMutation,
  deleteProcessStepMutation,
  updateTeamMemberMutation,
  deleteTeamMemberMutation,
  updateAboutContentMutation,
  showcaseBannerFile,
  showcaseBannerPreview,
  handleShowcaseBannerFileChange,
  historyImageFile,
  historyImagePreview,
  handleHistoryImageFileChange,
  missionVisionImageFile,
  missionVisionImagePreview,
  handleMissionVisionImageFileChange,
  teamMemberImagePreview,
  setTeamMemberImagePreview,
  handleTeamMemberImageChange,
  isTeamMemberDialogOpen,
  setIsTeamMemberDialogOpen,
  editingTeamMember,
  setEditingTeamMember,
  teamMemberForm,
  hasPermission,
}: AboutAdminTabProps) {
  const { language } = useLanguage();
  
  const [isPrincipleDialogOpen, setIsPrincipleDialogOpen] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<AboutCoreValue | null>(null);
  const [isShowcaseServiceDialogOpen, setIsShowcaseServiceDialogOpen] = useState(false);
  const [editingShowcaseService, setEditingShowcaseService] = useState<AboutShowcaseService | null>(null);
  const [isProcessStepDialogOpen, setIsProcessStepDialogOpen] = useState(false);
  const [editingProcessStep, setEditingProcessStep] = useState<AboutProcessStep | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'showcase' | 'history' | 'missionVision' | 'teamMember'>('showcase');

  const aboutContentForm = useForm<InsertAboutPageContent>({
    resolver: zodResolver(insertAboutPageContentSchema),
    defaultValues: aboutContent || {
      heroTitleEn: "",
      heroTitleVi: "",
      heroSubtitleEn: "",
      heroSubtitleVi: "",
      principlesSubtitleEn: "",
      principlesSubtitleVi: "",
      principlesTitleEn: "",
      principlesTitleVi: "",
      showcaseBannerImage: "",
      statsProjectsValue: "150+",
      statsProjectsLabelEn: "Projects Completed",
      statsProjectsLabelVi: "Dự án hoàn thành",
      statsAwardsValue: "25+",
      statsAwardsLabelEn: "Design Awards",
      statsAwardsLabelVi: "Giải thưởng thiết kế",
      statsClientsValue: "200+",
      statsClientsLabelEn: "Happy Clients",
      statsClientsLabelVi: "Khách hàng hài lòng",
      statsCountriesValue: "12+",
      statsCountriesLabelEn: "Countries",
      statsCountriesLabelVi: "Quốc gia",
      processSubtitleEn: "",
      processSubtitleVi: "",
      processTitleEn: "",
      processTitleVi: "",
      historySubtitleEn: "",
      historySubtitleVi: "",
      historyTitleEn: "",
      historyTitleVi: "",
      historyContentEn: "",
      historyContentVi: "",
      historyImage: "",
      missionTitleEn: "",
      missionTitleVi: "",
      missionContentEn: "",
      missionContentVi: "",
      visionTitleEn: "",
      visionTitleVi: "",
      visionContentEn: "",
      visionContentVi: "",
      coreValuesSubtitleEn: "",
      coreValuesSubtitleVi: "",
      coreValuesTitleEn: "",
      coreValuesTitleVi: "",
      teamSubtitleEn: "",
      teamSubtitleVi: "",
      teamTitleEn: "",
      teamTitleVi: "",
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

  // Reset form when aboutContent is loaded
  useEffect(() => {
    if (aboutContent) {
      aboutContentForm.reset(aboutContent);
    }
  }, [aboutContent]);

  // Wrapper functions to auto-close dialogs after successful submit
  const handlePrincipleSubmit = async (data: InsertAboutCoreValue) => {
    if (editingPrinciple) {
      await updatePrincipleMutation.mutateAsync({ id: editingPrinciple.id, data });
    } else {
      await onPrincipleSubmit(data);
    }
    setIsPrincipleDialogOpen(false);
    setEditingPrinciple(null);
  };

  const handleShowcaseServiceSubmit = async (data: InsertAboutShowcaseService) => {
    if (editingShowcaseService) {
      await updateShowcaseServiceMutation.mutateAsync({ id: editingShowcaseService.id, data });
    } else {
      await onShowcaseServiceSubmit(data);
    }
    setIsShowcaseServiceDialogOpen(false);
    setEditingShowcaseService(null);
  };

  const handleProcessStepSubmit = async (data: InsertAboutProcessStep) => {
    if (editingProcessStep) {
      await updateProcessStepMutation.mutateAsync({ id: editingProcessStep.id, data });
    } else {
      await onProcessStepSubmit(data);
    }
    setIsProcessStepDialogOpen(false);
    setEditingProcessStep(null);
  };

  const handleTeamMemberSubmit = async (data: InsertAboutTeamMember) => {
    await onTeamMemberSubmit(data);
    setIsTeamMemberDialogOpen(false);
    setEditingTeamMember(null);
  };

  const handleEditImage = (type: 'showcase' | 'history' | 'missionVision' | 'teamMember' = 'showcase') => {
    setCropType(type);
    // Use preview, base64 data, or URL
    const currentImage = type === 'showcase' 
      ? (showcaseBannerPreview || aboutContent?.showcaseBannerImageData || aboutContent?.showcaseBannerImage)
      : type === 'history'
      ? (historyImagePreview || aboutContent?.historyImage)
      : type === 'missionVision'
      ? (missionVisionImagePreview || aboutContent?.missionVisionImageData || aboutContent?.missionVisionImage)
      : (teamMemberImagePreview || editingTeamMember?.imageData || editingTeamMember?.image);
    if (currentImage) {
      setImageToCrop(currentImage);
      setIsCropDialogOpen(true);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setIsCropDialogOpen(false);
    
    const fileName = cropType === 'showcase' 
      ? `banner-${Date.now()}.jpg` 
      : cropType === 'history'
      ? `history-${Date.now()}.jpg`
      : cropType === 'missionVision'
      ? `mission-vision-${Date.now()}.jpg`
      : `team-member-${Date.now()}.jpg`;
    const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
    setCroppedImageFile(file);
    
    const syntheticEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    if (cropType === 'showcase') {
      handleShowcaseBannerFileChange(syntheticEvent);
    } else if (cropType === 'history') {
      handleHistoryImageFileChange(syntheticEvent);
    } else if (cropType === 'missionVision') {
      handleMissionVisionImageFileChange(syntheticEvent);
    } else {
      handleTeamMemberImageChange(syntheticEvent);
    }
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'showcase' | 'history' | 'missionVision' | 'teamMember' = 'showcase') => {
    setCropType(type);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-sans font-light">{language === 'vi' ? 'Quản Lý Nội Dung Trang Giới Thiệu' : 'About Page Content Management'}</h2>
      
      {/* Hero & General Content */}
      <Form {...aboutContentForm}>
        <form onSubmit={aboutContentForm.handleSubmit(onAboutContentSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'vi' ? 'Hero Section & Tiêu Đề Trang' : 'Hero Section & Page Titles'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Hero Section */}
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Phần Hero' : 'Hero Section'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Hero (English)' : 'Hero Title (English)'}</label>
                        <Input {...aboutContentForm.register("heroTitleEn")} placeholder="ARCHITECTURAL & INTERIOR DESIGN" data-testid="input-hero-title-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Phụ Đề Hero (English)' : 'Hero Subtitle (English)'}</label>
                        <Input {...aboutContentForm.register("heroSubtitleEn")} placeholder="INNOVATION IN EVERY PROJECT" data-testid="input-hero-subtitle-en" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Hero (Tiếng Việt)' : 'Hero Title (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("heroTitleVi")} placeholder="THIẾT KẾ KIẾN TRÚC VÀ NỘI THẤT" data-testid="input-hero-title-vi" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Phụ Đề Hero (Tiếng Việt)' : 'Hero Subtitle (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("heroSubtitleVi")} placeholder="ĐỔI MỚI TRONG MỌI DỰ ÁN" data-testid="input-hero-subtitle-vi" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Hero Images Upload (5 images for slider) */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-light">{language === 'vi' ? 'Ảnh Nền Hero (Slider)' : 'Hero Background Images (Slider)'}</label>
                      <span className="text-xs text-muted-foreground">
                        {(aboutContentForm.watch("heroImages") || []).length} / 5 {language === 'vi' ? 'ảnh' : 'images'}
                      </span>
                    </div>
                    
                    {/* Images Grid */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {(aboutContentForm.watch("heroImages") || []).map((imageUrl: string, index: number) => (
                        <div key={index} className="relative group aspect-video border rounded overflow-hidden bg-muted">
                          <img
                            src={imageUrl}
                            alt={`Hero image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const currentImages = aboutContentForm.getValues("heroImages") || [];
                              const newImages = currentImages.filter((_: string, i: number) => i !== index);
                              aboutContentForm.setValue("heroImages", newImages, { shouldDirty: true });
                            }}
                            data-testid={`button-remove-hero-image-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Image Slots */}
                      {Array.from({ length: Math.max(0, 5 - (aboutContentForm.watch("heroImages") || []).length) }).map((_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                          onClick={() => document.getElementById('hero-images-upload')?.click()}
                        >
                          <Plus className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === 'vi' ? 'Thêm tối đa 5 ảnh cho slider hero • PNG, JPG • Tối đa 10MB • Khuyến nghị: 1920x1080px (16:9) • Nhấp vào ô trống để thêm, di chuột lên ảnh để xóa.' : 'Add up to 5 images for the hero slider • PNG, JPG • Max 10MB • Recommended: 1920x1080px (16:9) • Click empty slots to add, hover over images to remove.'}
                    </p>
                    
                    {/* URL Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const url = input.value.trim();
                            if (url) {
                              const currentImages = aboutContentForm.getValues("heroImages") || [];
                              if (currentImages.length < 5) {
                                aboutContentForm.setValue("heroImages", [...currentImages, url], { shouldDirty: true });
                                input.value = '';
                              }
                            }
                          }
                        }}
                        data-testid="input-hero-image-url"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('hero-images-upload')?.click()}
                        disabled={(aboutContentForm.watch("heroImages") || []).length >= 5 || !hasPermission('about')}
                        data-testid="button-upload-hero-images"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {language === 'vi' ? 'Tải lên' : 'Upload'}
                      </Button>
                      <input
                        id="hero-images-upload"
                        type="file" 
                        disabled={!hasPermission('about')}
                        accept=".jpg,.jpeg,.png,.webp,.gif"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            const currentImages = aboutContentForm.getValues("heroImages") || [];
                            const availableSlots = 5 - currentImages.length;
                            
                            if (availableSlots > 0) {
                              const filesToUpload = Array.from(files).slice(0, availableSlots);
                              
                              const uploadResults = await Promise.allSettled(
                                filesToUpload.map(async (file) => {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  
                                  const response = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  });
                                  
                                  if (!response.ok) {
                                    const error = await response.json().catch(() => ({}));
                                    throw new Error(error.message || 'Upload failed');
                                  }
                                  return response.json();
                                })
                              );
                              
                              const successfulUploads = uploadResults
                                .filter((r): r is PromiseFulfilledResult<{path: string}> => r.status === 'fulfilled')
                                .map(r => r.value.path);
                              
                              if (successfulUploads.length > 0) {
                                aboutContentForm.setValue("heroImages", [...currentImages, ...successfulUploads], { shouldDirty: true });
                              }
                              
                              const failedCount = uploadResults.filter(r => r.status === 'rejected').length;
                              if (failedCount > 0) {
                                console.warn(`${failedCount} image(s) failed to upload`);
                              }
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Principles Section Title */}
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Phần Nguyên Tắc' : 'Principles Section'}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (English)' : 'Main Title H3 (English)'}</label>
                        <Input {...aboutContentForm.register("principlesTitleEn")} placeholder="THE FOUNDATION OF OUR WORK" data-testid="input-principles-title-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (Tiếng Việt)' : 'Main Title H3 (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("principlesTitleVi")} placeholder="NỀN TẢNG CỦA CÔNG VIỆC CHÚNG TÔI" data-testid="input-principles-title-vi" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Process Section Title */}
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Phần Quy Trình' : 'Process Section'}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (English)' : 'Main Title H3 (English)'}</label>
                        <Input {...aboutContentForm.register("processTitleEn")} placeholder="FROM CONCEPT TO REALITY" data-testid="input-process-title-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (Tiếng Việt)' : 'Main Title H3 (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("processTitleVi")} placeholder="TỪ Ý TƯỞNG ĐẾN HIỆN THỰC" data-testid="input-process-title-vi" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company History Section */}
                <div className="p-4 border-t">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Lịch Sử Công Ty (Lịch sử hình thành)' : 'Company History (Lịch sử hình thành)'}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (English)' : 'Main Title H3 (English)'}</label>
                        <Input {...aboutContentForm.register("historyTitleEn")} placeholder="OUR STORY" data-testid="input-history-title-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (Tiếng Việt)' : 'Main Title H3 (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("historyTitleVi")} placeholder="CÂU CHUYỆN CỦA CHÚNG TÔI" data-testid="input-history-title-vi" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nội Dung (English)' : 'Content (English)'}</label>
                        <Textarea {...aboutContentForm.register("historyContentEn")} rows={5} placeholder="Company history in English..." data-testid="textarea-history-content-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nội Dung (Tiếng Việt)' : 'Content (Tiếng Việt)'}</label>
                        <Textarea {...aboutContentForm.register("historyContentVi")} rows={5} placeholder="Lịch sử công ty..." data-testid="textarea-history-content-vi" />
                      </div>
                    </div>
                    
                    {/* History Image */}
                    <div className="mt-4">
                      <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Ảnh Minh Họa (Ảnh minh họa)' : 'Story Image (Ảnh minh họa)'}</label>
                      <div>
                        <div className="relative">
                          {(historyImagePreview || aboutContent?.historyImage) ? (
                            <div className="relative group">
                              <div className="border bg-muted overflow-hidden">
                                <img 
                                  src={historyImagePreview || aboutContent?.historyImage || ''} 
                                  alt="History Preview" 
                                  className="w-full aspect-[4/3] object-cover" 
                                />
                              </div>
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  type="button"
                                  onClick={() => handleEditImage('history')}
                                  className="bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                                  data-testid="button-edit-history-image"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span className="text-sm font-light">{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => document.getElementById('history-image-upload')?.click()}
                                  disabled={!hasPermission('about')}
                                  className="bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                                  data-testid="button-change-history-image"
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  <span className="text-sm font-light">{language === 'vi' ? 'Thay Đổi' : 'Change'}</span>
                                </Button>
                                <input
                                  id="history-image-upload"
                                  type="file"
                                  disabled={!hasPermission('about')}
                                  accept=".jpg,.jpeg,.png,.webp,.gif"
                                  onChange={(e) => handleNewImageUpload(e, 'history')}
                                  className="hidden"
                                  data-testid="input-history-image-file"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-muted-foreground/25 p-12 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <div>
                                  <p className="text-sm font-medium mb-1">{language === 'vi' ? 'Tải Ảnh Lịch Sử' : 'Upload History Image'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {language === 'vi' ? 'PNG, JPG • Tối đa 10MB • Khuyến nghị: 800x600px (4:3)' : 'PNG, JPG • Max 10MB • Recommended: 800x600px (4:3)'}
                                  </p>
                                </div>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="bg-white text-black hover:bg-white/90"
                                  onClick={() => document.getElementById('history-image-upload-initial')?.click()}
                                >
                                  {language === 'vi' ? 'Chọn Tệp' : 'Choose File'}
                                </Button>
                              </div>
                              <input
                                id="history-image-upload-initial"
                                type="file" disabled={!hasPermission('about')}
                                accept=".jpg,.jpeg,.png"
                                onChange={(e) => handleNewImageUpload(e, 'history')}
                                className="hidden"
                                data-testid="input-history-image-file-initial"
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {language === 'vi' ? 'Định dạng: PNG, JPG • Tối đa: 10MB • Khuyến nghị: 800x600px (4:3) • Tự động cắt' : 'Format: PNG, JPG • Max: 10MB • Recommended: 800x600px (4:3) • Auto-crop enabled'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission Section */}
                <div className="p-4 border-t">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Sứ Mệnh (Sứ mệnh)' : 'Mission (Sứ mệnh)'}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Phần (English)' : 'Section Title (English)'}</label>
                        <Input {...aboutContentForm.register("missionTitleEn")} placeholder="OUR MISSION" data-testid="input-mission-title-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Phần (Tiếng Việt)' : 'Section Title (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("missionTitleVi")} placeholder="SỨ MỆNH" data-testid="input-mission-title-vi" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nội Dung (English)' : 'Content (English)'}</label>
                        <Textarea {...aboutContentForm.register("missionContentEn")} rows={4} placeholder="Our mission in English..." data-testid="textarea-mission-content-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nội Dung (Tiếng Việt)' : 'Content (Tiếng Việt)'}</label>
                        <Textarea {...aboutContentForm.register("missionContentVi")} rows={4} placeholder="Sứ mệnh của chúng tôi..." data-testid="textarea-mission-content-vi" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vision Section */}
                <div className="p-4 border-t">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Tầm Nhìn (Tầm nhìn)' : 'Vision (Tầm nhìn)'}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Phần (English)' : 'Section Title (English)'}</label>
                        <Input {...aboutContentForm.register("visionTitleEn")} placeholder="OUR VISION" data-testid="input-vision-title-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Phần (Tiếng Việt)' : 'Section Title (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("visionTitleVi")} placeholder="TẦM NHÌN" data-testid="input-vision-title-vi" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nội Dung (English)' : 'Content (English)'}</label>
                        <Textarea {...aboutContentForm.register("visionContentEn")} rows={4} placeholder="Our vision in English..." data-testid="textarea-vision-content-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nội Dung (Tiếng Việt)' : 'Content (Tiếng Việt)'}</label>
                        <Textarea {...aboutContentForm.register("visionContentVi")} rows={4} placeholder="Tầm nhìn của chúng tôi..." data-testid="textarea-vision-content-vi" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission & Vision Image */}
                <div className="p-4 border-t">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Ảnh Sứ Mệnh & Tầm Nhìn' : 'Mission & Vision Image'}</h3>
                  <div>
                    <div className="relative">
                      {(missionVisionImagePreview || aboutContent?.missionVisionImageData || aboutContent?.missionVisionImage) ? (
                        <div className="relative group">
                          <div className="border bg-muted overflow-hidden">
                            <img 
                              src={missionVisionImagePreview || aboutContent?.missionVisionImageData || aboutContent?.missionVisionImage || ''} 
                              alt="Mission & Vision Preview" 
                              className="w-full aspect-[3/4] object-cover" 
                            />
                          </div>
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              onClick={() => handleEditImage('missionVision')}
                              className="bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                              data-testid="button-edit-mission-vision-image"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              <span className="text-sm font-light">{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                            </Button>
                            <Button
                              type="button"
                              onClick={() => document.getElementById('mission-vision-image-upload')?.click()}
                              disabled={!hasPermission('about')}
                              className="bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                              data-testid="button-change-mission-vision-image"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              <span className="text-sm font-light">{language === 'vi' ? 'Thay Đổi' : 'Change'}</span>
                            </Button>
                          </div>
                          <input
                            id="mission-vision-image-upload"
                            type="file"
                            disabled={!hasPermission('about')}
                            accept=".jpg,.jpeg,.png,.webp,.gif"
                            onChange={(e) => handleNewImageUpload(e, 'missionVision')}
                            className="hidden"
                            data-testid="input-mission-vision-image-file"
                          />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed p-8 text-center bg-muted/50">
                          <div className="flex flex-col items-center gap-4">
                            <Upload className="h-12 w-12 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium mb-1">{language === 'vi' ? 'Tải Ảnh Sứ Mệnh & Tầm Nhìn' : 'Upload Mission & Vision Image'}</p>
                              <p className="text-xs text-muted-foreground">
                                {language === 'vi' ? 'PNG, JPG • Tối đa 10MB • Khuyến nghị: 600x800px (3:4)' : 'PNG, JPG • Max 10MB • Recommended: 600x800px (3:4)'}
                              </p>
                            </div>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="bg-white text-black hover:bg-white/90"
                              onClick={() => document.getElementById('mission-vision-image-upload-initial')?.click()}
                            >
                              {language === 'vi' ? 'Chọn Tệp' : 'Choose File'}
                            </Button>
                          </div>
                          <input
                            id="mission-vision-image-upload-initial"
                            type="file" disabled={!hasPermission('about')}
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleNewImageUpload(e, 'missionVision')}
                            className="hidden"
                            data-testid="input-mission-vision-image-file-initial"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'vi' ? 'Định dạng: PNG, JPG • Tối đa: 10MB • Khuyến nghị: 600x800px (3:4) • Tự động cắt' : 'Format: PNG, JPG • Max: 10MB • Recommended: 600x800px (3:4) • Auto-crop enabled'}
                    </p>
                  </div>
                </div>

                {/* Core Values Section Title */}
                <div className="p-4 border-t">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Tiêu Đề Phần Giá Trị Cốt Lõi' : 'Core Values Section Title'}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (English)' : 'Main Title H3 (English)'}</label>
                        <Input {...aboutContentForm.register("coreValuesTitleEn")} placeholder="CORE VALUES" data-testid="input-core-values-title-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (Tiếng Việt)' : 'Main Title H3 (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("coreValuesTitleVi")} placeholder="GIÁ TRỊ CỐT LÕI" data-testid="input-core-values-title-vi" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Section Title */}
                <div className="p-4 border-t">
                  <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">{language === 'vi' ? 'Tiêu Đề Phần Đội Ngũ' : 'Team Section Title'}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (English)' : 'Main Title H3 (English)'}</label>
                        <Input {...aboutContentForm.register("teamTitleEn")} placeholder="OUR TEAM" data-testid="input-team-title-en" />
                      </div>
                      <div>
                        <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Tiêu Đề Chính H3 (Tiếng Việt)' : 'Main Title H3 (Tiếng Việt)'}</label>
                        <Input {...aboutContentForm.register("teamTitleVi")} placeholder="ĐỘI NGŨ" data-testid="input-team-title-vi" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'vi' ? 'Phần Thống Kê' : 'Statistics Section'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Projects Stat */}
                <div className="space-y-4 p-4">
                  <h4 className="text-sm font-medium uppercase tracking-wider">{language === 'vi' ? 'Dự Án' : 'Projects'}</h4>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Giá Trị' : 'Value'}</label>
                    <Input {...aboutContentForm.register("statsProjectsValue")} placeholder="150+" data-testid="input-stats-projects-value" />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nhãn (English)' : 'Label (English)'}</label>
                    <Input {...aboutContentForm.register("statsProjectsLabelEn")} placeholder="Projects Completed" data-testid="input-stats-projects-label-en" />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nhãn (Tiếng Việt)' : 'Label (Tiếng Việt)'}</label>
                    <Input {...aboutContentForm.register("statsProjectsLabelVi")} placeholder="Dự án hoàn thành" data-testid="input-stats-projects-label-vi" />
                  </div>
                </div>

                {/* Awards Stat */}
                <div className="space-y-4 p-4">
                  <h4 className="text-sm font-medium uppercase tracking-wider">{language === 'vi' ? 'Giải Thưởng' : 'Awards'}</h4>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Giá Trị' : 'Value'}</label>
                    <Input {...aboutContentForm.register("statsAwardsValue")} placeholder="25+" data-testid="input-stats-awards-value" />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nhãn (English)' : 'Label (English)'}</label>
                    <Input {...aboutContentForm.register("statsAwardsLabelEn")} placeholder="Design Awards" data-testid="input-stats-awards-label-en" />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nhãn (Tiếng Việt)' : 'Label (Tiếng Việt)'}</label>
                    <Input {...aboutContentForm.register("statsAwardsLabelVi")} placeholder="Giải thưởng thiết kế" data-testid="input-stats-awards-label-vi" />
                  </div>
                </div>

                {/* Clients Stat */}
                <div className="space-y-4 p-4">
                  <h4 className="text-sm font-medium uppercase tracking-wider">{language === 'vi' ? 'Khách Hàng' : 'Clients'}</h4>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Giá Trị' : 'Value'}</label>
                    <Input {...aboutContentForm.register("statsClientsValue")} placeholder="200+" data-testid="input-stats-clients-value" />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nhãn (English)' : 'Label (English)'}</label>
                    <Input {...aboutContentForm.register("statsClientsLabelEn")} placeholder="Happy Clients" data-testid="input-stats-clients-label-en" />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nhãn (Tiếng Việt)' : 'Label (Tiếng Việt)'}</label>
                    <Input {...aboutContentForm.register("statsClientsLabelVi")} placeholder="Khách hàng hài lòng" data-testid="input-stats-clients-label-vi" />
                  </div>
                </div>

                {/* Countries Stat */}
                <div className="space-y-4 p-4">
                  <h4 className="text-sm font-medium uppercase tracking-wider">{language === 'vi' ? 'Quốc Gia' : 'Countries'}</h4>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Giá Trị' : 'Value'}</label>
                    <Input {...aboutContentForm.register("statsCountriesValue")} placeholder="12+" data-testid="input-stats-countries-value" />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nhãn (English)' : 'Label (English)'}</label>
                    <Input {...aboutContentForm.register("statsCountriesLabelEn")} placeholder="Countries" data-testid="input-stats-countries-label-en" />
                  </div>
                  <div>
                    <label className="text-sm font-light mb-2 block">{language === 'vi' ? 'Nhãn (Tiếng Việt)' : 'Label (Tiếng Việt)'}</label>
                    <Input {...aboutContentForm.register("statsCountriesLabelVi")} placeholder="Quốc gia" data-testid="input-stats-countries-label-vi" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Showcase Banner Image */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'vi' ? 'Ảnh Banner Giới Thiệu' : 'Showcase Banner Image'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <div className="relative">
                  {(showcaseBannerPreview || aboutContent?.showcaseBannerImageData || aboutContent?.showcaseBannerImage) ? (
                    <div className="relative group">
                      <div className="border bg-muted overflow-hidden">
                        <img 
                          src={showcaseBannerPreview || aboutContent?.showcaseBannerImageData || aboutContent?.showcaseBannerImage || ''} 
                          alt="Showcase Banner Preview" 
                          className="w-full aspect-[16/7] object-cover" 
                        />
                      </div>
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          onClick={() => handleEditImage('showcase')}
                          className="bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                          data-testid="button-edit-showcase-banner"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          <span className="text-sm font-light">{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={() => document.getElementById('showcase-banner-upload')?.click()}
                          disabled={!hasPermission('about')}
                          className="bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                          data-testid="button-change-showcase-banner"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          <span className="text-sm font-light">{language === 'vi' ? 'Thay Đổi' : 'Change'}</span>
                        </Button>
                        <input
                          id="showcase-banner-upload"
                          type="file"
                          disabled={!hasPermission('about')}
                          accept=".jpg,.jpeg,.png,.webp,.gif"
                          onChange={(e) => handleNewImageUpload(e, 'showcase')}
                          className="hidden"
                          data-testid="input-showcase-banner-file"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">{language === 'vi' ? 'Tải Ảnh Banner' : 'Upload Banner Image'}</p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'vi' ? 'PNG, JPG • Tối đa 10MB • Khuyến nghị: 1920x800px' : 'PNG, JPG • Max 10MB • Recommended: 1920x800px'}
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="bg-white text-black hover:bg-white/90"
                          onClick={() => document.getElementById('showcase-banner-upload-initial')?.click()}
                        >
                          {language === 'vi' ? 'Chọn Tệp' : 'Choose File'}
                        </Button>
                      </div>
                      <input
                        id="showcase-banner-upload-initial"
                        type="file" disabled={!hasPermission('about')}
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleNewImageUpload(e, 'showcase')}
                        className="hidden"
                        data-testid="input-showcase-banner-file-initial"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {language === 'vi' ? 'Định dạng: PNG, JPG • Tối đa: 10MB • Khuyến nghị: 1920x800px • Tự động cắt' : 'Format: PNG, JPG • Max: 10MB • Recommended: 1920x800px • Auto-crop enabled'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              className={`px-8 transition-all ${!aboutContentForm.formState.isDirty && !showcaseBannerFile && !historyImageFile && !missionVisionImageFile ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90'}`}
              disabled={(!aboutContentForm.formState.isDirty && !showcaseBannerFile && !historyImageFile && !missionVisionImageFile) || updateAboutContentMutation.isPending}
              data-testid="button-save-about-content"
            >
              {updateAboutContentMutation.isPending ? (language === 'vi' ? "Đang lưu..." : "Saving...") : (language === 'vi' ? "Lưu Nội Dung" : "Save About Content")}
            </Button>
          </div>
        </form>
      </Form>

      {/* Principles Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{language === 'vi' ? 'Giá Trị Cốt Lõi' : 'Core Values'}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{aboutPrinciples.length} / 4 {language === 'vi' ? 'mục' : 'items'}</p>
            </div>
            <Button
              onClick={() => {
                if (aboutPrinciples.length >= 4) return;
                setEditingPrinciple(null);
                principleForm.reset({
                  icon: "",
                  titleEn: "",
                  titleVi: "",
                  descriptionEn: "",
                  descriptionVi: "",
                  order: aboutPrinciples.length + 1,
                });
                setIsPrincipleDialogOpen(true);
              }}
              disabled={aboutPrinciples.length >= 4}
              data-testid="button-add-principle"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Thêm Giá Trị' : 'Add Core Value'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={isPrincipleDialogOpen} onOpenChange={setIsPrincipleDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPrinciple ? (language === 'vi' ? "Sửa" : "Edit") : (language === 'vi' ? "Thêm" : "Add")} {language === 'vi' ? 'Giá Trị Cốt Lõi' : 'Core Value'}</DialogTitle>
              </DialogHeader>
                <Form {...principleForm}>
                  <form onSubmit={principleForm.handleSubmit(handlePrincipleSubmit)} className="space-y-4">
                    <FormField
                      control={principleForm.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tên Icon Lucide *' : 'Lucide Icon Name *'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Shield, Heart, Star, Target" data-testid="input-principle-icon" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={principleForm.control}
                        name="titleEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tiêu Đề (English)' : 'Title (English)'}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-principle-title-en" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={principleForm.control}
                        name="titleVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Tiêu Đề (Tiếng Việt)' : 'Title (Tiếng Việt)'}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-principle-title-vi" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={principleForm.control}
                        name="descriptionEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Mô Tả (English)' : 'Description (English)'}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} data-testid="textarea-principle-description-en" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={principleForm.control}
                        name="descriptionVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Mô Tả (Tiếng Việt)' : 'Description (Tiếng Việt)'}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} data-testid="textarea-principle-description-vi" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={principleForm.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Thứ Tự Hiển Thị' : 'Display Order'}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-principle-order" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" data-testid="button-submit-principle">
                      {editingPrinciple ? (language === 'vi' ? "Cập Nhật" : "Update") : (language === 'vi' ? "Tạo" : "Create")} {language === 'vi' ? 'Giá Trị Cốt Lõi' : 'Core Value'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          {aboutPrinciplesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'vi' ? 'Tiêu Đề (EN)' : 'Title (EN)'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Tiêu Đề (VI)' : 'Title (VI)'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Thứ Tự' : 'Order'}</TableHead>
                  <TableHead className="text-right">{language === 'vi' ? 'Hành Động' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aboutPrinciples.map((principle) => (
                  <TableRow key={principle.id}>
                    <TableCell>{principle.titleEn}</TableCell>
                    <TableCell>{principle.titleVi}</TableCell>
                    <TableCell>{principle.order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPrinciple(principle);
                            principleForm.reset(principle);
                            setIsPrincipleDialogOpen(true);
                          }}
                          data-testid={`button-edit-principle-${principle.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePrincipleMutation.mutate(principle.id)}
                          data-testid={`button-delete-principle-${principle.id}`}
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

      {/* Showcase Services Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{language === 'vi' ? 'Dịch Vụ Nổi Bật' : 'Showcase Services'}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{aboutShowcaseServices.length} / 4 {language === 'vi' ? 'mục' : 'items'}</p>
            </div>
            <Button
              onClick={() => {
                if (aboutShowcaseServices.length >= 4) return;
                setEditingShowcaseService(null);
                showcaseServiceForm.reset({
                  titleEn: "",
                  titleVi: "",
                  descriptionEn: "",
                  descriptionVi: "",
                  order: aboutShowcaseServices.length + 1,
                });
                setIsShowcaseServiceDialogOpen(true);
              }}
              disabled={aboutShowcaseServices.length >= 4}
              data-testid="button-add-showcase-service"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Thêm Dịch Vụ' : 'Add Service'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={isShowcaseServiceDialogOpen} onOpenChange={setIsShowcaseServiceDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingShowcaseService ? (language === 'vi' ? "Sửa" : "Edit") : (language === 'vi' ? "Thêm" : "Add")} {language === 'vi' ? 'Dịch Vụ Nổi Bật' : 'Showcase Service'}</DialogTitle>
              </DialogHeader>
              <Form {...showcaseServiceForm}>
                <form onSubmit={showcaseServiceForm.handleSubmit(handleShowcaseServiceSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={showcaseServiceForm.control}
                      name="titleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề (English)' : 'Title (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-showcase-title-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={showcaseServiceForm.control}
                      name="titleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề (Tiếng Việt)' : 'Title (Tiếng Việt)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-showcase-title-vi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={showcaseServiceForm.control}
                      name="descriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Mô Tả (English)' : 'Description (English)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-showcase-description-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={showcaseServiceForm.control}
                      name="descriptionVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Mô Tả (Tiếng Việt)' : 'Description (Tiếng Việt)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-showcase-description-vi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={showcaseServiceForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Thứ Tự Hiển Thị' : 'Display Order'}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-showcase-order" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" data-testid="button-submit-showcase">
                    {editingShowcaseService ? (language === 'vi' ? "Cập Nhật" : "Update") : (language === 'vi' ? "Tạo" : "Create")} {language === 'vi' ? 'Dịch Vụ Nổi Bật' : 'Showcase Service'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {aboutShowcaseServicesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'vi' ? 'Tiêu Đề (EN)' : 'Title (EN)'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Tiêu Đề (VI)' : 'Title (VI)'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Thứ Tự' : 'Order'}</TableHead>
                  <TableHead className="text-right">{language === 'vi' ? 'Hành Động' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aboutShowcaseServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.titleEn}</TableCell>
                    <TableCell>{service.titleVi}</TableCell>
                    <TableCell>{service.order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingShowcaseService(service);
                            showcaseServiceForm.reset(service);
                            setIsShowcaseServiceDialogOpen(true);
                          }}
                          data-testid={`button-edit-showcase-${service.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteShowcaseServiceMutation.mutate(service.id)}
                          data-testid={`button-delete-showcase-${service.id}`}
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

      {/* Process Steps Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{language === 'vi' ? 'Quy Trình' : 'Process Steps'}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{aboutProcessSteps.length} / 4 {language === 'vi' ? 'mục' : 'items'}</p>
            </div>
            <Button
              onClick={() => {
                if (aboutProcessSteps.length >= 4) return;
                setEditingProcessStep(null);
                processStepForm.reset({
                  stepNumber: String(aboutProcessSteps.length + 1).padStart(2, '0'),
                  titleEn: "",
                  titleVi: "",
                  descriptionEn: "",
                  descriptionVi: "",
                });
                setIsProcessStepDialogOpen(true);
              }}
              disabled={aboutProcessSteps.length >= 4}
              data-testid="button-add-process-step"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Thêm Bước' : 'Add Step'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={isProcessStepDialogOpen} onOpenChange={setIsProcessStepDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProcessStep ? (language === 'vi' ? "Sửa" : "Edit") : (language === 'vi' ? "Thêm" : "Add")} {language === 'vi' ? 'Bước Quy Trình' : 'Process Step'}</DialogTitle>
              </DialogHeader>
              <Form {...processStepForm}>
                <form onSubmit={processStepForm.handleSubmit(handleProcessStepSubmit)} className="space-y-4">
                  <FormField
                    control={processStepForm.control}
                    name="stepNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Số Bước' : 'Step Number'}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-step-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={processStepForm.control}
                      name="titleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề (English)' : 'Title (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-step-title-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={processStepForm.control}
                      name="titleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiêu Đề (Tiếng Việt)' : 'Title (Tiếng Việt)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-step-title-vi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={processStepForm.control}
                      name="descriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Mô Tả (English)' : 'Description (English)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-step-description-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={processStepForm.control}
                      name="descriptionVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Mô Tả (Tiếng Việt)' : 'Description (Tiếng Việt)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-step-description-vi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="button-submit-step">
                    {editingProcessStep ? (language === 'vi' ? "Cập Nhật" : "Update") : (language === 'vi' ? "Tạo" : "Create")} {language === 'vi' ? 'Bước Quy Trình' : 'Process Step'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {aboutProcessStepsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'vi' ? 'Bước' : 'Step'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Tiêu Đề (EN)' : 'Title (EN)'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Tiêu Đề (VI)' : 'Title (VI)'}</TableHead>
                  <TableHead className="text-right">{language === 'vi' ? 'Hành Động' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aboutProcessSteps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell>{step.stepNumber}</TableCell>
                    <TableCell>{step.titleEn}</TableCell>
                    <TableCell>{step.titleVi}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProcessStep(step);
                            processStepForm.reset(step);
                            setIsProcessStepDialogOpen(true);
                          }}
                          data-testid={`button-edit-step-${step.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteProcessStepMutation.mutate(step.id)}
                          data-testid={`button-delete-step-${step.id}`}
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

      {/* Team Members Management */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'vi' ? 'Thành Viên' : 'Team Members'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isTeamMemberDialogOpen} onOpenChange={setIsTeamMemberDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTeamMember ? (language === 'vi' ? 'Sửa' : 'Edit') : (language === 'vi' ? 'Thêm' : 'Add')} {language === 'vi' ? 'Thành Viên' : 'Team Member'}</DialogTitle>
              </DialogHeader>
              <Form {...teamMemberForm}>
                <form onSubmit={teamMemberForm.handleSubmit(handleTeamMemberSubmit)} className="space-y-4">
                  <FormField
                    control={teamMemberForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Tên' : 'Name'}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Sarah Chen" data-testid="input-team-member-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={teamMemberForm.control}
                      name="positionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Chức Vụ (English)' : 'Position (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Lead Designer" data-testid="input-team-member-position-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={teamMemberForm.control}
                      name="positionVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Chức Vụ (Tiếng Việt)' : 'Position (Tiếng Việt)'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Trưởng phòng thiết kế" data-testid="input-team-member-position-vi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={teamMemberForm.control}
                      name="bioEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiểu Sử (English)' : 'Bio (English)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Professional background..." data-testid="textarea-team-member-bio-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={teamMemberForm.control}
                      name="bioVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tiểu Sử (Tiếng Việt)' : 'Bio (Tiếng Việt)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Lý lịch chuyên môn..." data-testid="textarea-team-member-bio-vi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={teamMemberForm.control}
                      name="achievementsEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Thành Tựu (English)' : 'Achievements (English)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Awards and accomplishments..." data-testid="textarea-team-member-achievements-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={teamMemberForm.control}
                      name="achievementsVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Thành Tựu (Tiếng Việt)' : 'Achievements (Tiếng Việt)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Giải thưởng và thành tựu..." data-testid="textarea-team-member-achievements-vi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={teamMemberForm.control}
                      name="philosophyEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Triết Lý (English)' : 'Philosophy (English)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Design philosophy..." data-testid="textarea-team-member-philosophy-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={teamMemberForm.control}
                      name="philosophyVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Triết Lý (Tiếng Việt)' : 'Philosophy (Tiếng Việt)'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Triết lý thiết kế..." data-testid="textarea-team-member-philosophy-vi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{language === 'vi' ? 'Ảnh (Tối đa 10MB)' : 'Image (Max 10MB)'}</label>
                    {(teamMemberImagePreview || editingTeamMember?.imageData || editingTeamMember?.image) ? (
                      <div className="border bg-muted overflow-hidden mb-2 relative group">
                        <img 
                          src={teamMemberImagePreview || editingTeamMember?.imageData || editingTeamMember?.image || ''} 
                          alt="Team Member Preview" 
                          className="w-full max-w-md aspect-square object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                            onClick={() => handleEditImage('teamMember')}
                            data-testid="button-edit-team-member-image"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {language === 'vi' ? 'Sửa' : 'Edit'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                            onClick={() => document.getElementById('team-member-image-upload')?.click()}
                            disabled={!hasPermission('about')}
                            data-testid="button-change-team-member-image"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            {language === 'vi' ? 'Thay Đổi' : 'Change'}
                          </Button>
                        </div>
                        <input
                          id="team-member-image-upload"
                          type="file"
                          disabled={!hasPermission('about')}
                          accept=".jpg,.jpeg,.png,.webp,.gif"
                          onChange={(e) => handleNewImageUpload(e, 'teamMember')}
                          className="hidden"
                          data-testid="input-team-member-image"
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium mb-1">{language === 'vi' ? 'Tải Ảnh Thành Viên' : 'Upload Team Member Image'}</p>
                            <p className="text-xs text-muted-foreground">
                              {language === 'vi' ? 'PNG, JPG • Tối đa 10MB • Khuyến nghị: Vuông (1:1)' : 'PNG, JPG • Max 10MB • Recommended: Square (1:1)'}
                            </p>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => document.getElementById('team-member-image-upload-initial')?.click()}
                            disabled={!hasPermission('about')}
                          >
                            {language === 'vi' ? 'Chọn Tệp' : 'Choose File'}
                          </Button>
                        </div>
                        <input
                          id="team-member-image-upload-initial"
                          type="file"
                          disabled={!hasPermission('about')}
                          accept=".jpg,.jpeg,.png,.webp,.gif"
                          onChange={(e) => handleNewImageUpload(e, 'teamMember')}
                          className="hidden"
                          data-testid="input-team-member-image-initial"
                        />
                      </div>
                    )}
                  </div>
                  <FormField
                    control={teamMemberForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Thứ Tự Hiển Thị' : 'Display Order'}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-team-member-order" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" data-testid="button-submit-team-member">
                    {editingTeamMember ? (language === 'vi' ? 'Cập Nhật' : 'Update') : (language === 'vi' ? 'Thêm' : 'Add')} {language === 'vi' ? 'Thành Viên' : 'Team Member'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <div className="mb-4 flex items-center gap-4">
            <Button 
              onClick={() => {
                setEditingTeamMember(null);
                teamMemberForm.reset({
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
                });
                setIsTeamMemberDialogOpen(true);
              }}
              disabled={aboutTeamMembers.length >= 8}
              data-testid="button-add-team-member"
            >
              <Plus className="h-4 w-4 mr-2" />
              {language === 'vi' ? 'Thêm Thành Viên' : 'Add Team Member'}
            </Button>
            {aboutTeamMembers.length >= 8 && (
              <span className="text-sm text-muted-foreground">
                {language === 'vi' ? 'Đã đạt giới hạn tối đa (8 thành viên)' : 'Maximum limit reached (8 team members)'}
              </span>
            )}
          </div>

          {aboutTeamMembersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'vi' ? 'Tên' : 'Name'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Chức Vụ (EN)' : 'Position (EN)'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Chức Vụ (VI)' : 'Position (VI)'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Thứ Tự' : 'Order'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Ảnh' : 'Image'}</TableHead>
                  <TableHead className="text-right">{language === 'vi' ? 'Hành Động' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aboutTeamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.positionEn}</TableCell>
                    <TableCell>{member.positionVi}</TableCell>
                    <TableCell>{member.order}</TableCell>
                    <TableCell>
                      {(member.imageData || member.image) ? (
                        <img 
                          src={member.imageData || member.image} 
                          alt={member.name}
                          className="h-12 w-12 rounded object-cover"
                          data-testid={`img-team-member-${member.id}`}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          {language === 'vi' ? 'Không có ảnh' : 'No Image'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTeamMember(member);
                          teamMemberForm.reset(member);
                          // Set preview from existing image
                          if (member.imageData || member.image) {
                            setTeamMemberImagePreview(member.imageData || member.image || '');
                          }
                          setIsTeamMemberDialogOpen(true);
                        }}
                        data-testid={`button-edit-team-member-${member.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" data-testid={`button-delete-team-member-${member.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{language === 'vi' ? 'Xóa Thành Viên' : 'Delete Team Member'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'vi' ? `Bạn có chắc chắn muốn xóa ${member.name}? Hành động này không thể hoàn tác.` : `Are you sure you want to delete ${member.name}? This action cannot be undone.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTeamMemberMutation.mutate(member.id)}>
                              {language === 'vi' ? 'Xóa' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={isCropDialogOpen}
        onClose={() => setIsCropDialogOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio={
          cropType === 'showcase' ? 16 / 7 
          : cropType === 'history' ? 4 / 3 
          : cropType === 'missionVision' ? 3 / 4
          : 9 / 16
        }
      />
    </div>
  );
}
