import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ArrowLeft, Share2, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import OptimizedImage from "@/components/OptimizedImage";
import type { Article } from "@shared/schema";
import { useEffect, useState } from "react";
import { FormattedText, parseBoldTextToHTML } from "@/lib/textUtils";
import { getArticlePath } from "@/lib/routes";

// Related Articles Component
function RelatedArticles({ currentArticleId, category, language }: { currentArticleId: string; category: string; language: string }) {
  const { data: relatedArticles = [] } = useQuery<Article[]>({
    queryKey: ['/api/articles', 'related', currentArticleId, category, language],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('language', language);
      params.append('category', category);
      const response = await fetch(`/api/articles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const articles = await response.json();
      return articles.filter((article: Article) => article.id !== currentArticleId).slice(0, 3);
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (cat: string) => {
    const categoryMap = {
      en: {
        news: 'News',
        tips: 'Design Tips',
        projects: 'Project Highlights',
        'design-trends': 'Design Trends',
        trend: 'Trend',
        general: 'General'
      },
      vi: {
        news: 'Tin tức',
        tips: 'Mẹo thiết kế',
        projects: 'Dự án nổi bật',
        'design-trends': 'Xu hướng thiết kế',
        trend: 'Xu hướng',
        general: 'Chung'
      }
    };
    return categoryMap[language as 'en' | 'vi'][cat as keyof typeof categoryMap.en] || cat;
  };

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 py-12">
      <h3 className="text-2xl font-sans font-light mb-8">
        {language === 'vi' 
          ? `Những bài viết khác trong ${getCategoryLabel(category)}` 
          : `Other ${getCategoryLabel(category)} Articles`}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {relatedArticles.map((article) => (
          <Card key={article.id} className="group overflow-hidden hover-scale project-hover" data-testid={`card-related-article-${article.id}`}>
            <Link href={getArticlePath(language, article.slug)}>
              <div className="relative">
                {(article.featuredImage || article.featuredImageData) ? (
                  <OptimizedImage
                    src={article.featuredImage || article.featuredImageData || ''}
                    alt={article.title}
                    width={600}
                    height={192}
                    wrapperClassName="w-full h-48"
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    data-testid={`img-related-article-${article.id}`}
                  />
                ) : (
                  <div className="w-full h-48 bg-black flex items-center justify-center">
                    <div className="text-6xl font-sans font-light text-primary/30">N</div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </Link>
            
            <CardContent className="p-6">
              <h3 className="text-xl font-sans font-light mb-2 line-clamp-1" data-testid={`text-title-${article.id}`}>
                {article.title}
              </h3>
              <p className="text-muted-foreground mb-3 text-sm" data-testid={`text-category-${article.id}`}>
                {getCategoryLabel(article.category)} • {formatDate(String(article.publishedAt || article.createdAt))}
              </p>
              {article.excerpt && (
                <p className="text-foreground/80 mb-4 text-sm line-clamp-2" data-testid={`text-excerpt-${article.id}`}>
                  <FormattedText text={article.excerpt} />
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['/api/articles/slug', slug, language],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('language', language);
      const response = await fetch(`/api/articles/slug/${slug}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Article not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Redirect to correct language URL when server returns sibling via linkedSlug fallback
  useEffect(() => {
    if (article?.slug && slug && article.slug !== slug) {
      setLocation(getArticlePath(language, article.slug), { replace: true } as any);
    }
  }, [article?.slug, slug, language, setLocation]);

  // Update document title and meta tags for SEO
  useEffect(() => {
    if (article) {
      document.title = article.metaTitle || `${article.title} | IEVRA Design & Build`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', article.metaDescription || article.excerpt || '');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = article.metaDescription || article.excerpt || '';
        document.head.appendChild(meta);
      }

      // Update meta keywords
      if (article.metaKeywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
          metaKeywords.setAttribute('content', article.metaKeywords);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'keywords';
          meta.content = article.metaKeywords;
          document.head.appendChild(meta);
        }
      }

      // Open Graph tags
      const updateOgTag = (property: string, content: string) => {
        let ogTag = document.querySelector(`meta[property="${property}"]`);
        if (ogTag) {
          ogTag.setAttribute('content', content);
        } else {
          const meta = document.createElement('meta');
          meta.setAttribute('property', property);
          meta.content = content;
          document.head.appendChild(meta);
        }
      };

      updateOgTag('og:title', article.title);
      updateOgTag('og:description', article.excerpt || '');
      updateOgTag('og:type', 'article');
      updateOgTag('og:url', window.location.href);
      if (article.featuredImage) {
        updateOgTag('og:image', article.featuredImage);
      }
    }

    return () => {
      // Reset title when leaving
      document.title = 'IEVRA Design & Build';
    };
  }, [article]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap = {
      en: {
        news: 'News',
        tips: 'Design Tips',
        projects: 'Project Highlights',
        'design-trends': 'Design Trends',
        trend: 'Trend',
        general: 'General'
      },
      vi: {
        news: 'Tin tức',
        tips: 'Mẹo thiết kế',
        projects: 'Dự án nổi bật',
        'design-trends': 'Xu hướng thiết kế',
        trend: 'Xu hướng',
        general: 'Chung'
      }
    };
    return categoryMap[language][category as keyof typeof categoryMap.en] || category;
  };


  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/4 mb-8" />
            <div className="h-12 bg-white/10 rounded w-3/4 mb-4" />
            <div className="h-6 bg-white/10 rounded w-1/2 mb-8" />
            <div className="h-64 bg-white/10 rounded mb-8" />
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded" />
              <div className="h-4 bg-white/10 rounded w-5/6" />
              <div className="h-4 bg-white/10 rounded w-4/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'vi' ? 'Không tìm thấy bài viết' : 'Article Not Found'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {language === 'vi' 
              ? 'Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.' 
              : 'The article you\'re looking for doesn\'t exist or has been removed.'
            }
          </p>
          <Button asChild>
            <Link href="/blog">
              {language === 'vi' ? 'Quay lại Tin tức' : 'Back to News'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[120vh] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          asChild 
          className="mb-8"
          data-testid="button-back-to-news"
        >
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'vi' ? 'Quay lại Tin tức' : 'Back to News'}
          </Link>
        </Button>

        {/* Featured Image Banner - Above Title */}
        {(article.featuredImage || article.featuredImageData) && (
          <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8">
            <OptimizedImage
              src={article.featuredImage || article.featuredImageData || ''} 
              alt={article.title}
              width={1200}
              height={600}
              wrapperClassName="w-full h-64 md:h-96"
              className="w-full h-full object-cover"
              sizes="100vw"
              priority={true}
              data-testid="article-featured-image"
            />
          </div>
        )}

        {/* Article Header */}
        <article className="max-w-none">
          {/* Article Meta Row */}
          <div className="flex items-center justify-between gap-4 mb-6 text-xs text-white/40 tracking-wide uppercase">
            <div className="flex items-center gap-3">
              {article.category && (
                <span>{getCategoryLabel(article.category)}</span>
              )}
              {(article as any).attribution && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="normal-case tracking-normal">{(article as any).attribution}</span>
                </>
              )}
            </div>
            {(article.publishedAt || (article as any).createdAt) && (
              <span className="normal-case tracking-normal shrink-0">
                {formatDate(String(article.publishedAt || (article as any).createdAt))}
              </span>
            )}
          </div>

          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-sans font-light mb-6 text-white break-words" style={{ lineHeight: 1.7 }} data-testid="article-title">
              {article.title}
            </h1>

            {article.excerpt && (
              <div
                className="text-xl text-white/60 leading-relaxed mb-8
                  [&_strong]:text-white/80 [&_strong]:font-semibold
                  [&_em]:italic [&_del]:line-through
                  [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono"
                data-testid="article-excerpt"
                dangerouslySetInnerHTML={{ __html: parseBoldTextToHTML(article.excerpt) }}
              />
            )}

            {article.tags && Array.isArray(article.tags) && article.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-8">
                {(article.tags as string[]).map((tag, index) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          {/* Article Content */}
          <div 
            className="mt-20 text-white/80 text-base leading-relaxed max-w-none break-words
              [&_h1]:text-white [&_h1]:text-3xl [&_h1]:font-light [&_h1]:mt-8 [&_h1]:mb-4
              [&_h2]:text-white [&_h2]:text-2xl [&_h2]:font-light [&_h2]:mt-6 [&_h2]:mb-3
              [&_h3]:text-white [&_h3]:text-xl [&_h3]:font-light [&_h3]:mt-5 [&_h3]:mb-2
              [&_strong]:text-white [&_strong]:font-semibold
              [&_em]:italic
              [&_del]:line-through [&_del]:opacity-60
              [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-white/90
              [&_blockquote]:border-l-4 [&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-white/60 [&_blockquote]:italic
              [&_hr]:border-white/20 [&_hr]:my-6
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:space-y-1
              [&_li]:text-white/80
              [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4 [&_img]:rounded-lg
              [&_figure]:my-4
              [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-white/50 [&_figcaption]:italic [&_figcaption]:mt-2
              [&_p]:mb-3 [&_p]:leading-relaxed"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            dangerouslySetInnerHTML={{ __html: parseBoldTextToHTML(String(article.content)) }}
            data-testid="article-content"
          />
        </article>

        {/* Share / Copy URL */}
        <div className="mt-10 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={handleCopyUrl}
            className={`flex items-center gap-2 text-sm transition-colors ${copied ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            {copied ? <Check size={15} className="text-white" /> : <Share2 size={15} />}
            <span>{copied ? (language === 'vi' ? 'Đã sao chép!' : 'Copied!') : (language === 'vi' ? 'Chia sẻ' : 'Share')}</span>
          </button>
        </div>

        {/* Related Articles Section */}
        <RelatedArticles currentArticleId={article.id} category={article.category} language={language} />
      </div>
    </div>
  );
}