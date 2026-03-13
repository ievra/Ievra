import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { getProjectPath } from "@/lib/routes";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, User, Eye, Share2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { Project, Category } from "@shared/schema";

function parseFormattedText(text: string): JSX.Element[] {
  if (!text) return [];
  
  const elements: JSX.Element[] = [];
  let keyIndex = 0;
  
  // Split by paragraphs first (double newline or single newline)
  const paragraphs = text.split(/\n+/);
  
  paragraphs.forEach((paragraph, pIndex) => {
    if (!paragraph.trim()) return;
    
    const parts: JSX.Element[] = [];
    let remaining = paragraph;
    let partIndex = 0;
    
    // Process formatting patterns: ***text***, **text**, *text*
    // Must process *** first, then **, then *
    const processPattern = (str: string): JSX.Element[] => {
      const result: JSX.Element[] = [];
      
      // Pattern for ***text*** (heading + bold)
      const tripleRegex = /\*\*\*([^*]+)\*\*\*/g;
      // Pattern for **text** (heading)
      const doubleRegex = /\*\*([^*]+)\*\*/g;
      // Pattern for *text* (bold)
      const singleRegex = /\*([^*]+)\*/g;
      
      let processed = str;
      const replacements: { start: number; end: number; element: JSX.Element }[] = [];
      
      // Find all *** matches
      let match;
      tripleRegex.lastIndex = 0;
      while ((match = tripleRegex.exec(str)) !== null) {
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          element: <strong key={`t-${keyIndex++}`} className="font-bold text-white text-lg block mt-4 mb-2">{match[1]}</strong>
        });
      }
      
      // Find all ** matches (not already covered by ***)
      doubleRegex.lastIndex = 0;
      while ((match = doubleRegex.exec(str)) !== null) {
        const overlaps = replacements.some(r => 
          (match!.index >= r.start && match!.index < r.end) ||
          (match!.index + match![0].length > r.start && match!.index + match![0].length <= r.end)
        );
        if (!overlaps) {
          replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            element: <span key={`d-${keyIndex++}`} className="font-semibold text-white text-lg block mt-4 mb-2">{match[1]}</span>
          });
        }
      }
      
      // Find all * matches (not already covered)
      singleRegex.lastIndex = 0;
      while ((match = singleRegex.exec(str)) !== null) {
        const overlaps = replacements.some(r => 
          (match!.index >= r.start && match!.index < r.end) ||
          (match!.index + match![0].length > r.start && match!.index + match![0].length <= r.end)
        );
        if (!overlaps) {
          replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            element: <strong key={`s-${keyIndex++}`} className="font-semibold text-white">{match[1]}</strong>
          });
        }
      }
      
      // Sort replacements by position
      replacements.sort((a, b) => a.start - b.start);
      
      // Build result
      let lastEnd = 0;
      replacements.forEach((r, i) => {
        if (r.start > lastEnd) {
          const textBefore = str.slice(lastEnd, r.start);
          if (textBefore) {
            result.push(<span key={`n-${keyIndex++}`}>{textBefore}</span>);
          }
        }
        result.push(r.element);
        lastEnd = r.end;
      });
      
      if (lastEnd < str.length) {
        const textAfter = str.slice(lastEnd);
        if (textAfter) {
          result.push(<span key={`n-${keyIndex++}`}>{textAfter}</span>);
        }
      }
      
      return result.length > 0 ? result : [<span key={`p-${keyIndex++}`}>{str}</span>];
    };
    
    elements.push(
      <p key={`para-${pIndex}`} className="mb-3 break-words">
        {processPattern(paragraph)}
      </p>
    );
  });
  
  return elements;
}

export default function ProjectDetail() {
  const [, portfolioParams] = useRoute("/portfolio/:slug");
  const [, duAnParams] = useRoute("/du-an/:slug");
  const [, idParams] = useRoute("/project/:id");
  const [location, setLocation] = useLocation();
  
  const projectSlug = portfolioParams?.slug || duAnParams?.slug;
  const projectId = idParams?.id;
  const isSlugRoute = !!projectSlug;
  
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { language } = useLanguage();
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: language === 'vi' ? 'Đã sao chép liên kết' : 'Link copied',
        description: language === 'vi' ? 'Liên kết đã được sao chép vào clipboard' : 'Link has been copied to clipboard',
      });
    } catch (error) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Không thể sao chép liên kết' : 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: isSlugRoute 
      ? ['/api/projects/slug', projectSlug, language] 
      : ['/api/projects', projectId],
    queryFn: async () => {
      if (isSlugRoute) {
        const response = await fetch(`/api/projects/slug/${projectSlug}?language=${language}`);
        if (!response.ok) throw new Error("Failed to fetch project");
        return response.json();
      } else {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error("Failed to fetch project");
        return response.json();
      }
    },
    enabled: !!(projectSlug || projectId),
  });

  // Redirect to slug-based URL if accessing by ID and project has a slug
  useEffect(() => {
    if (project?.slug && !isSlugRoute) {
      setLocation(getProjectPath(language, project.slug), { replace: true });
    }
  }, [project?.slug, isSlugRoute, language, setLocation]);

  // Redirect to correct language URL when language changes or server returns sibling via linkedSlug fallback
  useEffect(() => {
    if (project?.slug && isSlugRoute && projectSlug && project.slug !== projectSlug) {
      setLocation(getProjectPath(language, project.slug), { replace: true });
    }
  }, [project?.slug, projectSlug, isSlugRoute, language, setLocation]);

  // Set SEO meta tags when project data is loaded
  useEffect(() => {
    if (project) {
      const title = project.metaTitle || `${project.title} | IEVRA Design & Build`;
      const description = project.metaDescription || project.detailedDescription || project.description || `Interior design project by IEVRA Design & Build`;
      
      document.title = title;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      if (description) {
        metaDesc.setAttribute('content', description.slice(0, 160));
      }
      
      // Add Open Graph meta tags
      const updateMetaTag = (property: string, content: string) => {
        let metaTag = document.querySelector(`meta[property="${property}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', property);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
      };
      
      updateMetaTag('og:title', title);
      updateMetaTag('og:description', description);
      updateMetaTag('og:type', 'article');
      const firstGalleryImage = Array.isArray(project.galleryImages) ? project.galleryImages[0] : undefined;
      if (project.heroImage || firstGalleryImage) {
        updateMetaTag('og:image', project.heroImage || firstGalleryImage || '');
      }
    }
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'IEVRA Design & Build';
    };
  }, [project]);

  const { data: relatedProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects', language],
    queryFn: async () => {
      const response = await fetch(`/api/projects?language=${language}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    select: (data) => {
      if (!project?.relatedProjects || !Array.isArray(project.relatedProjects)) return [];
      const relatedIds = project.relatedProjects as string[];
      return data.filter(p => relatedIds.includes(p.id) && p.id !== project.id).slice(0, 3);
    },
    enabled: !!project,
  });

  // Fetch projects for "OTHER PROJECTS" section - ONLY same category
  const { data: allProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects', 'other', language],
    queryFn: async () => {
      const response = await fetch(`/api/projects?language=${language}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    select: (data) => {
      if (!project) return [];

      const others = data.filter(p => p.id !== project.id);

      const score = (p: Project) => {
        const sameCategory = p.category === project.category;
        const pinned = (p as any).featured === true;
        if (sameCategory && pinned) return 0;
        if (sameCategory) return 1;
        if (pinned) return 2;
        return 3;
      };

      return others
        .sort((a, b) => {
          const diff = score(a) - score(b);
          if (diff !== 0) return diff;
          const aDate = new Date((a as any).updatedAt || (a as any).createdAt || 0);
          const bDate = new Date((b as any).updatedAt || (b as any).createdAt || 0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 5);
    },
    enabled: !!project,
  });

  const { data: dbCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const getCategoryLabel = (slug: string) => {
    const cat = dbCategories.find(c => c.slug === slug && c.type === 'project' && c.active);
    if (cat) return language === 'vi' ? (cat.nameVi || cat.name) : cat.name;
    return slug;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="animate-pulse space-y-12">
            <div className="h-8 bg-zinc-800 rounded w-1/4" />
            <div className="h-16 bg-zinc-800 rounded w-1/2" />
            <div className="h-[70vh] bg-zinc-800 rounded-lg" />
            <div className="space-y-4">
              <div className="h-4 bg-zinc-800 rounded" />
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-light mb-2 text-white">
              {language === 'vi' ? 'Không tìm thấy dự án' : 'Project Not Found'}
            </h2>
            <p className="text-zinc-400 mb-4">
              {language === 'vi' 
                ? 'Dự án bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.'
                : 'The project you\'re looking for doesn\'t exist or has been removed.'
              }
            </p>
            <Button asChild variant="outline" data-testid="button-back-portfolio">
              <Link href={getProjectPath(language)}>
                {language === 'vi' ? 'Quay lại Danh mục' : 'Back to Portfolio'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get images from new categorized fields with fallback to legacy fields
  const coverImages = Array.isArray(project.coverImages) ? project.coverImages : [];
  const contentImages = Array.isArray(project.contentImages) ? project.contentImages : [];
  const galleryImages = Array.isArray(project.galleryImages) ? project.galleryImages : 
                       Array.isArray(project.images) ? project.images : [];
  
  // Use cover images for main display, fallback to legacy fields if empty
  const mainImages = coverImages.length > 0 ? coverImages : 
                    contentImages.length > 0 ? contentImages :
                    [project.heroImage, ...galleryImages].filter(Boolean);

  const heroImage = coverImages[0] || project.heroImage || contentImages[0] || galleryImages[0];
  const section1Image = contentImages[0] || coverImages[0] || galleryImages[0];
  const allClickableImages = Array.from(new Set([heroImage, section1Image, ...contentImages, ...coverImages, ...galleryImages, project.section2Image, project.section3Image, project.bannerImage].filter(Boolean))) as string[];

  const openLightbox = (imageSrc: string) => {
    const idx = allClickableImages.indexOf(imageSrc);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };
  
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section - Full width image with title overlay */}
      <div className="relative w-full aspect-[4/3] md:aspect-video mb-0">
        {heroImage && (
          <div className="w-full h-full cursor-pointer" onClick={() => openLightbox(heroImage)}>
            <OptimizedImage
              src={heroImage}
              alt={project.title}
              width={1400}
              height={800}
              wrapperClassName="w-full h-full"
              className="w-full h-full object-cover"
              priority={true}
              data-testid="img-main"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div>
            <h1 className="font-light tracking-wider text-white uppercase" style={{ fontSize: 'clamp(24px, 5vw, 48px)', lineHeight: '1.2' }} data-testid="text-project-title">
              {project.title}
            </h1>
            <Link href={getProjectPath(language)} className="inline-flex items-center mt-4 text-zinc-300 hover:text-white transition-colors text-sm" data-testid="button-back-to-portfolio">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Quay lại Danh mục' : 'Back to Portfolio'}
            </Link>
          </div>
        </div>
      </div>
      {/* Section 1: Single image left + Description right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="order-1">
          {section1Image && (
            <div className="aspect-square cursor-pointer" onClick={() => openLightbox(section1Image)}>
              <OptimizedImage
                src={section1Image}
                alt={`${project.title} - Featured`}
                width={700}
                height={700}
                wrapperClassName="w-full h-full"
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                data-testid="img-content-featured"
              />
            </div>
          )}
        </div>
        <div className="order-2 md:aspect-square flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12 md:py-16 md:overflow-hidden">
          {(project.descriptionTitle || project.designPhilosophyTitle) && (
            <h2 className="text-[20px] font-light tracking-[0.15em] text-white uppercase mb-6">
              {project.descriptionTitle || project.designPhilosophyTitle}
            </h2>
          )}
          {project.description && (
            <div className="text-zinc-300 leading-relaxed text-lg md:text-xl break-words whitespace-pre-wrap" data-testid="text-description">
              {parseFormattedText(project.description)}
            </div>
          )}

          {/* Project Info Summary */}
          {(project.location || project.completionYear || project.area || project.category) && (
            <div className="mt-10">
              <p className="font-light tracking-[0.2em] text-white uppercase mb-6 text-[16px]">
                {language === 'vi' ? 'THÔNG TIN' : 'INFOR'}
              </p>
              <div className="space-y-0">
                {[
                  { label: language === 'vi' ? 'ĐỊA ĐIỂM' : 'LOCATION', value: project.location },
                  { label: language === 'vi' ? 'NĂM' : 'YEAR', value: project.completionYear },
                  { label: language === 'vi' ? 'DIỆN TÍCH' : 'CONSTRUCTION AREA', value: project.area },
                  { label: language === 'vi' ? 'LOẠI HÌNH' : 'CATEGORY', value: project.category ? getCategoryLabel(project.category) : undefined },
                ].filter(row => row.value).map((row, i) => (
                  <div key={i} className="border-t border-white/15 py-2 flex items-center justify-between gap-6">
                    <span className="text-sm font-light tracking-[0.15em] text-white/50 uppercase flex-shrink-0">{row.label}</span>
                    <span className="text-sm font-light tracking-[0.12em] text-white/80 uppercase text-right">{row.value}</span>
                  </div>
                ))}
                <div className="border-t border-white/15" />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Section 2: Text left + Image right (alternating) */}
      {(project.detailedDescription || project.designPhilosophy) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="md:aspect-square flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12 md:py-16 md:overflow-hidden order-2 md:order-1">
            {project.designPhilosophy && (
              <div className="space-y-4">
                <h2 className="text-[20px] font-light tracking-[0.15em] text-white uppercase">
                  {project.designPhilosophyTitle || (language === 'vi' ? 'Triết lý thiết kế' : 'Design Philosophy')}
                </h2>
                <div className="text-zinc-300 leading-relaxed text-lg md:text-xl break-words whitespace-pre-wrap">
                  {parseFormattedText(project.designPhilosophy)}
                </div>
              </div>
            )}
            {!project.designPhilosophy && project.detailedDescription && (
              <div className="text-zinc-300 leading-relaxed text-lg md:text-xl break-words whitespace-pre-wrap" data-testid="text-detailed-description">
                {parseFormattedText(project.detailedDescription)}
              </div>
            )}
          </div>
          <div className="order-1 md:order-2">
            {(project.section2Image || galleryImages[0]) && (
              <div className="aspect-square cursor-pointer" onClick={() => openLightbox(project.section2Image || galleryImages[0])}>
                <OptimizedImage
                  src={project.section2Image || galleryImages[0]}
                  alt={`${project.title} - Gallery 1`}
                  width={700}
                  height={700}
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  data-testid="img-gallery-1"
                />
              </div>
            )}
          </div>
        </div>
      )}
      {/* Section 3: Image left + Text right */}
      {(project.materialSelection || (project.detailedDescription && project.designPhilosophy)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="order-1">
            {(project.section3Image || galleryImages[1]) && (
              <div className="aspect-square cursor-pointer" onClick={() => openLightbox(project.section3Image || galleryImages[1])}>
                <OptimizedImage
                  src={project.section3Image || galleryImages[1]}
                  alt={`${project.title} - Gallery 2`}
                  width={700}
                  height={700}
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  data-testid="img-gallery-2"
                />
              </div>
            )}
          </div>
          <div className="order-2 md:aspect-square flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12 md:py-16 md:overflow-hidden">
            {project.materialSelection && (
              <div className="space-y-4">
                <h2 className="text-[20px] font-light tracking-[0.15em] text-white uppercase">
                  {project.materialSelectionTitle || (language === 'vi' ? 'Lựa chọn vật liệu' : 'Material Selection')}
                </h2>
                <div className="text-zinc-300 leading-relaxed text-lg md:text-xl break-words whitespace-pre-wrap">
                  {parseFormattedText(project.materialSelection)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Detailed Description - Full Width */}
      {project.detailedDescription && project.designPhilosophy && (
        <div className="w-full px-10 md:px-20 lg:px-32 py-12 md:py-16">
          <div className="text-zinc-300 leading-relaxed text-lg md:text-xl break-words whitespace-pre-wrap" data-testid="text-detailed-description">
            {parseFormattedText(project.detailedDescription)}
          </div>
        </div>
      )}
      {/* Banner Section - Full Width */}
      {project.bannerImage && (
        <div className="w-full mt-16">
          {project.bannerTitle && (
            <div className="px-10 md:px-20 lg:px-32 mb-6">
              <h2 className="text-[20px] font-light tracking-wider text-white uppercase">
                {project.bannerTitle}
              </h2>
            </div>
          )}
          <div className="w-full aspect-video cursor-pointer" onClick={() => openLightbox(project.bannerImage!)}>
            <OptimizedImage
              src={project.bannerImage}
              alt={project.bannerTitle || project.title}
              width={1920}
              height={1080}
              wrapperClassName="w-full h-full"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      {/* Gallery Grid */}
      {galleryImages.length > 0 && (
        <div className="w-full" id="additional-gallery" data-testid="section-additional" tabIndex={-1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {galleryImages.map((image: string, index: number) => (
              <div key={index} className="aspect-[4/3] cursor-pointer" onClick={() => openLightbox(image)}>
                <OptimizedImage
                  src={image}
                  alt={`${project.title} - Gallery ${index + 1}`}
                  width={400}
                  height={300}
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  data-testid={`img-gallery-${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Other Projects */}
      <div className="w-full px-4">
        {/* OTHER PROJECTS Section - Horizontal Scroll */}
        {allProjects && allProjects.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-light text-white uppercase tracking-wider mb-10">
              {language === 'vi' ? 'DỰ ÁN KHÁC' : 'OTHER PROJECTS'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {allProjects.map((otherProject) => (
                <Link key={otherProject.id} href={getProjectPath(language, otherProject.slug, otherProject.id)}>
                  <div className="group cursor-pointer">
                    <div className="aspect-square overflow-hidden relative">
                      <OptimizedImage
                        src={(Array.isArray(otherProject.coverImages) ? otherProject.coverImages[0] : '') || (Array.isArray(otherProject.contentImages) ? otherProject.contentImages[0] : '') || otherProject.heroImage || (Array.isArray(otherProject.galleryImages) ? otherProject.galleryImages[0] : '') || (Array.isArray(otherProject.images) ? otherProject.images[0] : '') || '/placeholder-project.jpg'} 
                        alt={otherProject.title}
                        width={300}
                        height={300}
                        wrapperClassName="w-full h-full"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        data-testid={`img-other-project-${otherProject.id}`}
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors duration-300" />
                    </div>
                    <div className="mt-3">
                      <h3 className="text-white font-light tracking-wider text-xs uppercase line-clamp-2" style={{ minHeight: '2.5rem' }}>
                        {otherProject.title}
                      </h3>
                      <p className="text-zinc-400 text-xs">
                        {getCategoryLabel(otherProject.category)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      {lightboxOpen && allClickableImages.length > 0 && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
          >
            <X className="w-8 h-8" />
          </button>

          {allClickableImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + allClickableImages.length) % allClickableImages.length); }}
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % allClickableImages.length); }}
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}

          <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={allClickableImages[lightboxIndex]}
              alt={`${project.title} - ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {allClickableImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIndex + 1} / {allClickableImages.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}