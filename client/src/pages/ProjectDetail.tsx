import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, User, Eye, Share2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

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
  const [, slugParams] = useRoute("/portfolio/:slug");
  const [, idParams] = useRoute("/project/:id");
  const [location, setLocation] = useLocation();
  
  const projectSlug = slugParams?.slug;
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
      setLocation(`/portfolio/${project.slug}`, { replace: true });
    }
  }, [project?.slug, isSlugRoute, setLocation]);

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
      metaDesc.setAttribute('content', description);
      
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
    queryKey: ['/api/projects', 'other', language, project?.category],
    queryFn: async () => {
      const response = await fetch(`/api/projects?language=${language}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    select: (data) => {
      if (!project || !project.category) return [];
      
      // Filter: only same category AND not current project
      const sameCategoryProjects = data.filter(p => 
        p.id !== project.id && 
        p.category === project.category
      );
      
      // Sort by most recent
      const sortedProjects = sameCategoryProjects.sort((a, b) => {
        const aDate = new Date((a as any).updatedAt || (a as any).createdAt || 0);
        const bDate = new Date((b as any).updatedAt || (b as any).createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      });
      
      // Return up to 4 projects
      return sortedProjects.slice(0, 4);
    },
    enabled: !!project,
  });

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
              <Link href="/portfolio">
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

  const firstImage = contentImages[0] || coverImages[0] || project.heroImage || galleryImages[0];
  const secondImage = contentImages[1] || coverImages[1] || galleryImages[1];
  const detailImage = contentImages[0] || galleryImages[0] || coverImages[0];
  const allClickableImages = [...new Set([firstImage, secondImage, detailImage, ...contentImages, ...galleryImages].filter(Boolean))] as string[];

  const openLightbox = (imageSrc: string) => {
    const idx = allClickableImages.indexOf(imageSrc);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };
  
  return (
    <div className="min-h-[120vh] pt-24 pb-20">
      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Back Button */}
        <Link href="/portfolio" className="inline-flex items-center mb-8 text-zinc-400 hover:text-white transition-colors" data-testid="button-back-to-portfolio">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === 'vi' ? 'Quay lại Danh mục' : 'Back to Portfolio'}
        </Link>

        {/* Project Title Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light tracking-wider mb-3 text-white uppercase" data-testid="text-project-title">
            {project.title}
          </h1>
        </div>

        {/* Two Large Images Side by Side - Using contentImages (16:9 or 1:1) */}
        {(() => {
          const hasSecondImage = Boolean(secondImage);
          
          return (
            <div className={`grid gap-6 mb-16 ${hasSecondImage ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {firstImage && (
                <div className="aspect-video cursor-pointer" onClick={() => openLightbox(firstImage)}>
                  <OptimizedImage
                    src={firstImage}
                    alt={project.title}
                    width={600}
                    height={337}
                    wrapperClassName="w-full h-full"
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    priority={true}
                    data-testid="img-main"
                  />
                </div>
              )}

              {hasSecondImage && (
                <div className="aspect-video cursor-pointer" onClick={() => openLightbox(secondImage!)}>
                  <OptimizedImage
                    src={secondImage!}
                    alt={`${project.title} - Secondary view`}
                    width={600}
                    height={337}
                    wrapperClassName="w-full h-full"
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    data-testid="img-secondary"
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Content Text Below Images */}
        <div className="mb-12">
          {/* Description */}
          <div className="text-zinc-300 leading-relaxed text-base overflow-hidden max-w-3xl" data-testid="text-description">
            <div className="break-words whitespace-pre-wrap">
              {parseFormattedText(project.description || 
                (language === 'vi' 
                  ? 'Một không gian nội thất nơi những sắc thái than chì nghiêm ngặt được kết hợp với sự ấm áp của đồ nội thất màu đất nung và các kết cấu mềm mại.'
                  : 'An interior where strict graphite shades are combined with the warmth of terracotta furniture and soft textures.'
                )
              )}
            </div>
          </div>
        </div>

        {/* Content Image */}
        {contentImages.length > 0 && (
          <div className="mb-12">
            <div className="max-w-2xl aspect-video cursor-pointer" onClick={() => openLightbox(contentImages[0])}>
              <OptimizedImage
                src={contentImages[0]}
                alt={`${project.title} - Content`}
                width={600}
                height={338}
                wrapperClassName="w-full h-full"
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                sizes="(max-width: 768px) 100vw, 50vw"
                data-testid="img-content-featured"
              />
            </div>
          </div>
        )}

        {/* Detailed Description + Design Philosophy + Material Selection */}
        {(project.detailedDescription || project.designPhilosophy || project.materialSelection) && (
          <div className="space-y-6 mb-12 max-w-3xl">
            {project.detailedDescription && (
              <div className="text-zinc-300 leading-relaxed text-base break-words whitespace-pre-wrap" data-testid="text-detailed-description">
                {parseFormattedText(project.detailedDescription)}
              </div>
            )}
            {project.designPhilosophy && (
              <div className="space-y-3">
                <h3 className="text-lg font-light tracking-wider text-white uppercase">
                  {project.designPhilosophyTitle || (language === 'vi' ? 'Triết lý thiết kế' : 'Design Philosophy')}
                </h3>
                <div className="text-zinc-300 leading-relaxed">
                  {parseFormattedText(project.designPhilosophy)}
                </div>
              </div>
            )}
            {project.materialSelection && (
              <div className="space-y-3">
                <h3 className="text-lg font-light tracking-wider text-white uppercase">
                  {project.materialSelectionTitle || (language === 'vi' ? 'Lựa chọn vật liệu' : 'Material Selection')}
                </h3>
                <div className="text-zinc-300 leading-relaxed">
                  {parseFormattedText(project.materialSelection)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gallery Images */}
        {galleryImages.length > 0 && (
          <div id="additional-gallery" className="mt-12 space-y-12" data-testid="section-additional" tabIndex={-1}>

            {/* All Gallery Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {galleryImages.map((image: string, index: number) => (
                <div key={index} className="aspect-video cursor-pointer" onClick={() => openLightbox(image)}>
                  <OptimizedImage
                    src={image}
                    alt={`${project.title} - Gallery ${index + 1}`}
                    width={400}
                    height={225}
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

        {/* Share Section */}
        <div className="flex items-center justify-between mt-16 mb-8 border-t border-gray-800 pt-6">
          <div className="text-sm text-muted-foreground">
            <p className="mb-1">
              {language === 'vi' ? 'Thiết kế bởi' : 'Designed by'} <span className="text-white">{project.designer || 'IEVRA Team'}</span>
            </p>
            <p>{project.completionYear}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="border border-white/20 rounded-none px-4 py-2 hover:bg-white/10 hover:text-white transition-all"
            data-testid="button-share"
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                {language === 'vi' ? 'Đã sao chép!' : 'Copied!'}
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5 mr-2" />
                {language === 'vi' ? 'Chia sẻ' : 'Share'}
              </>
            )}
          </Button>
        </div>

        {/* OTHER PROJECTS Section - Horizontal Scroll */}
        {allProjects && allProjects.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-zinc-500 uppercase tracking-wider mb-8">
              {language === 'vi' ? 'DỰ ÁN KHÁC' : 'OTHER PROJECTS'}
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                {allProjects.map((otherProject) => (
                  <Link key={otherProject.id} href={otherProject.slug ? `/portfolio/${otherProject.slug}` : `/project/${otherProject.id}`}>
                    <div className="group cursor-pointer w-72 aspect-square flex-shrink-0">
                      <OptimizedImage
                        src={(Array.isArray(otherProject.coverImages) ? otherProject.coverImages[0] : '') || (Array.isArray(otherProject.contentImages) ? otherProject.contentImages[0] : '') || otherProject.heroImage || (Array.isArray(otherProject.galleryImages) ? otherProject.galleryImages[0] : '') || (Array.isArray(otherProject.images) ? otherProject.images[0] : '') || '/placeholder-project.jpg'} 
                        alt={otherProject.title}
                        width={288}
                        height={288}
                        wrapperClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        sizes="288px"
                        data-testid={`img-other-project-${otherProject.id}`}
                      />
                      <div className="mt-4 space-y-2">
                        <h3 className="text-white font-light tracking-wider text-sm uppercase">
                          {otherProject.title}
                        </h3>
                        <p className="text-zinc-400 text-xs">
                          {otherProject.category}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
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