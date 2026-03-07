import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import OptimizedImage from "@/components/OptimizedImage";
import type { Article, Category } from "@shared/schema";
import { useState, useEffect, useMemo } from "react";
import { FormattedText } from "@/lib/textUtils";
import { getArticlePath } from "@/lib/routes";

export default function Blog() {
  const { language, t } = useLanguage();

  const { data: dbCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const categories = useMemo(() => {
    const articleCategories = dbCategories.filter(cat => cat.type === 'article' && cat.active);
    return [
      { value: 'all', label: 'All Articles', labelVi: 'Tất Cả Bài Viết' },
      ...articleCategories.map(cat => ({
        value: cat.slug,
        label: cat.name,
        labelVi: cat.nameVi || cat.name
      }))
    ];
  }, [dbCategories]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const articlesPerPage = 12;
  const [searchPlaceholder, setSearchPlaceholder] = useState('');

  // Animation - reset when back to top
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.08, rootMargin: '50px 0px -50px 0px' }
    );

    const observeElements = () => {
      const animateElements = document.querySelectorAll('.article-card');
      animateElements.forEach((el) => observer.observe(el));
    };

    observeElements();

    const timer = setTimeout(observeElements, 600);

    // Reset and re-trigger animation when back to top
    const handleScroll = () => {
      if (window.scrollY < 50) {
        document.querySelectorAll('.animated').forEach((el) => {
          el.classList.remove('animated', 'animate-fade-in-up');
        });
        // Re-trigger animations after a brief delay
        setTimeout(() => {
          observeElements();
        }, 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // SEO meta tags
  useEffect(() => {
    const title = language === 'vi' ? 'Tin tức & Blog | IEVRA Design & Build' : 'News & Blog | IEVRA Design & Build';
    const description = language === 'vi' 
      ? 'Khám phá những xu hướng thiết kế mới nhất, mẹo hay và những dự án truyền cảm hứng từ IEVRA Design & Build'
      : 'Discover the latest design trends, helpful tips, and inspiring projects from IEVRA Design & Build';
      
    document.title = title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
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
    
    updateOgTag('og:title', title);
    updateOgTag('og:description', description);
    updateOgTag('og:type', 'website');
    updateOgTag('og:url', window.location.href);
    
    return () => {
      // Reset title when leaving
      document.title = 'IEVRA Design & Build';
    };
  }, [language]);

  // Typing animation for search placeholder
  useEffect(() => {
    const text = language === 'vi' ? 'Chúng tôi có thể giúp bạn tìm gì?' : 'What can we help you find?';
    let index = 0;
    setSearchPlaceholder('');
    
    const interval = setInterval(() => {
      if (index <= text.length) {
        setSearchPlaceholder(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [language]);

  const { data: allArticles = [], isLoading } = useQuery<Article[]>({
    queryKey: ['/api/articles', language],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('language', language);
      const response = await fetch(`/api/articles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const articles = await response.json();
      
      // Sort articles by newest first
      articles.sort((a: Article, b: Article) => {
        const dateA = new Date(a.publishedAt || a.createdAt);
        const dateB = new Date(b.publishedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      return articles;
    },
  });

  // Extract unique years from articles
  const availableYears = useMemo(() => {
    const years = allArticles.map(article => {
      const date = new Date(article.publishedAt || article.createdAt);
      return date.getFullYear().toString();
    });
    return Array.from(new Set(years)).sort((a, b) => parseInt(b) - parseInt(a));
  }, [allArticles]);

  // Filter articles based on search, category, and year
  const filteredArticles = useMemo(() => {
    return allArticles.filter(article => {
      // Search filter - search in title, excerpt, and content
      const searchLower = searchTerm.toLowerCase();
      const articleYear = new Date(article.publishedAt || article.createdAt).getFullYear().toString();
      const matchesSearch = !searchTerm || 
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt?.toLowerCase().includes(searchLower) ||
        article.content?.toLowerCase().includes(searchLower) ||
        (categories.find(c => c.value === article.category)?.label || article.category).toLowerCase().includes(searchLower) ||
        (categories.find(c => c.value === article.category)?.labelVi || '').toLowerCase().includes(searchLower) ||
        articleYear.includes(searchLower);

      // Year filter
      const matchesYear = selectedYear === 'all' || articleYear === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [allArticles, searchTerm, selectedYear]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const articles = filteredArticles.slice(startIndex, endIndex);

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    // Smart pagination logic
    const getPageNumbers = () => {
      const delta = 2; // Number of pages to show around current page
      const range = [];
      const rangeWithDots = [];

      // Always show first page
      range.push(1);

      // Add pages around current page
      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      // Always show last page (if more than 1 page)
      if (totalPages > 1) {
        range.push(totalPages);
      }

      // Remove duplicates and sort
      const uniqueRange = Array.from(new Set(range)).sort((a, b) => a - b);

      // Add dots where there are gaps
      let l;
      for (let i of uniqueRange) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      }

      return rangeWithDots;
    };

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-16">
        {/* First page button */}
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 text-xs font-light tracking-widest transition-colors ${
            currentPage === 1 
              ? 'opacity-30 cursor-not-allowed text-white/50' 
              : 'text-white/70 hover:text-white'
          }`}
          data-testid="pagination-first"
        >
          <ChevronsLeft className="w-4 h-4" />
          {language === 'vi' ? 'ĐẦU' : 'FIRST'}
        </button>
        
        {/* Previous button */}
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 text-xs font-light tracking-widest transition-colors ${
            currentPage === 1 
              ? 'opacity-30 cursor-not-allowed text-white/50' 
              : 'text-white/70 hover:text-white'
          }`}
          data-testid="pagination-prev"
        >
          <ChevronLeft className="w-4 h-4" />
          {language === 'vi' ? 'TRƯỚC' : 'PREV'}
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-2">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`dots-${index}`} className="text-white/70 px-2">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page as number)}
                className={`text-xs font-light transition-all duration-300 min-w-[24px] h-6 flex items-center justify-center ${
                  currentPage === page 
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
                data-testid={`pagination-page-${page}`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 text-xs font-light tracking-widest transition-colors ${
            currentPage === totalPages 
              ? 'opacity-30 cursor-not-allowed text-white/50' 
              : 'text-white/70 hover:text-white'
          }`}
          data-testid="pagination-next"
        >
          {language === 'vi' ? 'TIẾP' : 'NEXT'}
          <ChevronRight className="w-4 h-4" />
        </button>
        
        {/* Last page button */}
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 text-xs font-light tracking-widest transition-colors ${
            currentPage === totalPages 
              ? 'opacity-30 cursor-not-allowed text-white/50' 
              : 'text-white/70 hover:text-white'
          }`}
          data-testid="pagination-last"
        >
          {language === 'vi' ? 'CUỐI' : 'LAST'}
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (categorySlug: string) => {
    const foundCategory = categories.find(c => c.value === categorySlug);
    if (foundCategory) {
      return language === 'vi' ? foundCategory.labelVi : foundCategory.label;
    }
    return categorySlug;
  };

  return (
    <div className="min-h-[120vh] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-sans font-light mb-6" data-testid="heading-blog">
            {language === 'vi' ? 'TIN TỨC' : 'NEWS'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {language === 'vi' 
              ? 'Khám phá những xu hướng thiết kế mới nhất, mẹo hay và những dự án truyền cảm hứng từ IEVRA Design & Build'
              : 'Discover the latest design trends, helpful tips, and inspiring projects from IEVRA Design & Build'
            }
          </p>
        </div>

        {/* Search Box with Year Filter */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-end gap-8 pb-4">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white placeholder-white/60 px-0 py-0 text-lg font-light rounded-none focus-visible:ring-0 border-0 flex-1"
              data-testid="input-search"
            />
            {availableYears.length > 0 && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger 
                  className="w-[140px] bg-transparent border-0 text-white/60 text-base font-light p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:text-white/60"
                  data-testid="select-year"
                >
                  <SelectValue placeholder={language === 'vi' ? 'Năm' : 'Year'} />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/30 text-white rounded-none">
                  <SelectItem value="all" className="focus:bg-white/10 focus:text-white">
                    {language === 'vi' ? 'Tất cả các năm' : 'All years'}
                  </SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem 
                      key={year} 
                      value={year}
                      className="focus:bg-white/10 focus:text-white"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse h-[28rem] flex flex-col rounded-none overflow-hidden">
                <div className="bg-white/10 h-48 w-full" />
                <div className="p-6 flex-1 space-y-3">
                  <div className="h-5 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-light mb-2">
              {language === 'vi' ? 'Không tìm thấy bài viết' : 'No articles found'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'vi' ? 'Hiện tại chưa có bài viết nào.' : 'No articles are available at the moment.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[3px]">
              {articles.map((article) => (
                <Link key={article.id} href={getArticlePath(language, article.slug)}>
                  <div
                    className="article-card group relative overflow-hidden cursor-pointer w-full h-[420px] transform-gpu backface-hidden"
                    data-testid={`card-article-${article.id}`}
                  >
                    {(article.featuredImage || article.featuredImageData) ? (
                      <img
                        src={article.featuredImage || article.featuredImageData || ''}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        data-testid={`img-article-${article.id}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900" data-testid={`img-article-${article.id}`} />
                    )}

                    <div className="absolute inset-0 bg-black/30 transition-opacity duration-500 group-hover:opacity-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                    {/* Top-left: Category */}
                    <div className="absolute top-0 left-0 p-5 md:p-6">
                      <p className="text-white text-sm uppercase tracking-[0.15em] font-light leading-snug" data-testid={`text-category-${article.id}`}>
                        {getCategoryLabel(article.category)}
                      </p>
                    </div>

                    {/* Bottom: Title + Date */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                      <h3
                        className="text-white uppercase tracking-wide text-sm md:text-base font-light mb-3 line-clamp-2"
                        data-testid={`text-title-${article.id}`}
                      >
                        {article.title}
                      </h3>
                      <div className="flex items-end justify-between">
                        <div className="text-white">
                          <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                            {language === 'vi' ? 'Ngày đăng' : 'Published'}
                          </p>
                          <p className="text-white/90 text-xs font-light">
                            {formatDate(String(article.publishedAt || article.createdAt))}
                          </p>
                        </div>
                        {(article as any).attribution && (
                          <p className="text-white/50 text-[10px] font-light text-right max-w-[50%] line-clamp-2">
                            {(article as any).attribution}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination />
          </>
        )}
      </div>
      
      {/* Show results info */}
      {!isLoading && filteredArticles.length > 0 && (
        <div className="text-center text-muted-foreground text-sm mt-8">
          {language === 'vi' 
            ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredArticles.length)} trong tổng số ${filteredArticles.length} bài viết`
            : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredArticles.length)} of ${filteredArticles.length} articles`
          }
        </div>
      )}
    </div>
  );
}