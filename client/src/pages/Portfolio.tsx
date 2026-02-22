import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectCard from "@/components/ProjectCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import type { Project, Category } from "@shared/schema";

export default function Portfolio() {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: dbCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const categories = useMemo(() => {
    const projectCategories = dbCategories.filter(cat => cat.type === 'project' && cat.active);
    return [
      { value: 'all', label: 'All Projects', labelVi: 'Tất Cả Dự Án' },
      ...projectCategories.map(cat => ({
        value: cat.slug,
        label: cat.name,
        labelVi: cat.nameVi || cat.name
      }))
    ];
  }, [dbCategories]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 12;
  const [searchPlaceholder, setSearchPlaceholder] = useState('');

  // Animation - reset when back to top, slower timing
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            entry.target.classList.add('animate-fade-in-up-slow');
          }
        });
      },
      { threshold: 0.06, rootMargin: '50px 0px -50px 0px' }
    );

    const observeElements = () => {
      const animateElements = document.querySelectorAll('.project-card');
      animateElements.forEach((el) => observer.observe(el));
    };

    observeElements();

    const timer = setTimeout(observeElements, 600);

    // Reset and re-trigger animation when back to top
    const handleScroll = () => {
      if (window.scrollY < 50) {
        document.querySelectorAll('.animated').forEach((el) => {
          el.classList.remove('animated', 'animate-fade-in-up-slow');
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

  const { data: allProjects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects', activeCategory, language],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') {
        params.append('category', activeCategory);
      }
      params.append('language', language);
      const url = `/api/projects?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Reset to page 1 when category, search, or year changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm, selectedYear]);

  // Get unique years from projects
  const availableYears = Array.from(
    new Set(
      allProjects
        .map(p => p.completionYear)
        .filter((year): year is string => !!year && year.trim() !== '')
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  // Filter projects by search term and year
  const filteredProjects = allProjects.filter(project => {
    // Filter by year
    if (selectedYear !== 'all' && project.completionYear !== selectedYear) {
      return false;
    }
    
    // Filter by search term
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Category keywords mapping
    const categoryKeywords: { [key: string]: string[] } = {
      'residential': ['residential', 'nhà ở', 'nha o', 'house', 'home', 'villa', 'apartment'],
      'commercial': ['commercial', 'thương mại', 'thuong mai', 'office', 'retail', 'shop', 'store'],
      'architecture': ['architecture', 'kiến trúc', 'kien truc', 'building', 'design']
    };
    
    // Check if search term matches any category keywords
    const matchesCategory = Object.entries(categoryKeywords).some(([category, keywords]) => {
      if (project.category === category) {
        return keywords.some(keyword => keyword.includes(searchLower) || searchLower.includes(keyword));
      }
      return false;
    });
    
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.location?.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower) ||
      project.category?.toLowerCase().includes(searchLower) ||
      matchesCategory
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const projects = filteredProjects.slice(startIndex, endIndex);

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

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-sans font-light mb-6" data-testid="heading-portfolio">
            {language === 'vi' ? 'DỰ ÁN' : 'PROJECT'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {language === 'vi' 
              ? 'Khám phá bộ sưu tập toàn diện các dự án thiết kế nội thất của chúng tôi qua nhiều danh mục khác nhau'
              : 'Explore our comprehensive collection of interior design projects across various categories'
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

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-12">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value)}
              className={`text-sm font-light tracking-widest uppercase transition-all duration-300 pb-1 border-b-2 ${
                activeCategory === category.value 
                  ? 'text-white border-white' 
                  : 'text-white/60 hover:text-white border-transparent hover:border-white/30'
              }`}
              data-testid={`filter-${category.value}`}
            >
              {(language === 'vi' ? category.labelVi : category.label).toUpperCase()}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/10 h-[28rem] rounded-none mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-light mb-2">
              {language === 'vi' ? 'Không tìm thấy dự án' : 'No projects found'}
            </h3>
            <p className="text-muted-foreground">
              {activeCategory === 'all' 
                ? (language === 'vi' ? 'Hiện tại chưa có dự án nào.' : 'No projects are available at the moment.')
                : (language === 'vi' 
                    ? `Không có dự án ${categories.find(c => c.value === activeCategory)?.labelVi?.toLowerCase() || activeCategory} nào.` 
                    : `No ${categories.find(c => c.value === activeCategory)?.label?.toLowerCase() || activeCategory} projects are available.`)
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
            <Pagination />
          </>
        )}
      </div>
      
      {/* Show results info */}
      {!isLoading && filteredProjects.length > 0 && (
        <div className="text-center text-muted-foreground text-sm mt-8">
          {language === 'vi' 
            ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredProjects.length)} trong tổng số ${filteredProjects.length} dự án`
            : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredProjects.length)} of ${filteredProjects.length} projects`
          }
        </div>
      )}
    </div>
  );
}
