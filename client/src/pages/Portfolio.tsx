import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { usePageMeta, CANONICAL_BASE_URL } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectCard from "@/components/ProjectCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { Project, Category } from "@shared/schema";

function cardHash(str: string, seed = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

const LG_SPAN_CLASS: Record<number, string> = {
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
};


function computeSpans(projects: { id: string }[]): number[] {
  let rowFill = 0;
  let prevRowFirstSpan = -1;
  const result: number[] = [];

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const isLast = i === projects.length - 1;
    const isRowStart = rowFill === 0;
    const remaining = isRowStart ? 6 : 6 - rowFill;

    let span: number;

    if (isLast && !isRowStart) {
      span = remaining;
    } else {
      let opts: number[];
      if (isRowStart) {
        const all = [2, 3, 4];
        const filtered = all.filter(s => s !== prevRowFirstSpan);
        opts = filtered.length > 0 ? filtered : all;
      } else {
        opts =
          remaining === 4 ? [2, 4] :
          remaining === 3 ? [3] :
          [2];
      }
      span = opts[cardHash(p.id) % opts.length];
    }

    if (isRowStart) prevRowFirstSpan = span;
    rowFill = (rowFill + span) % 6;
    result.push(span);
  }

  return result;
}

export default function Portfolio() {
  const { language } = useLanguage();
  const [location] = useLocation();
  usePageMeta({
    canonical: `${CANONICAL_BASE_URL}${location}`,
    hreflang: [
      { lang: "vi", href: `${CANONICAL_BASE_URL}/du-an` },
      { lang: "en", href: `${CANONICAL_BASE_URL}/portfolio` },
      { lang: "x-default", href: `${CANONICAL_BASE_URL}/du-an` },
    ],
  });

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
  const projectTypes = useMemo(() => {
    const types = dbCategories.filter(cat => cat.type === 'project_type' && cat.active);
    return [
      { value: 'all', label: 'All', labelVi: 'Tất Cả' },
      ...types.map(cat => ({
        value: cat.slug,
        label: cat.name,
        labelVi: cat.nameVi || cat.name
      }))
    ];
  }, [dbCategories]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchPlaceholder, setSearchPlaceholder] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    queryKey: ['/api/projects', language],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('language', language);
      const url = `/api/projects?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Get unique years from projects
  const availableYears = Array.from(
    new Set(
      allProjects
        .map(p => p.completionYear)
        .filter((year): year is string => !!year && year.trim() !== '')
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  // Filter projects by search term, year, project type and category
  const filteredProjects = allProjects.filter(project => {
    // Filter by project type
    if (selectedType !== 'all') {
      const pt = (project as any).projectType;
      if (selectedType === 'interior') {
        if (pt && pt !== 'interior') return false;
      } else if (pt !== selectedType) {
        return false;
      }
    }

    // Filter by year
    if (selectedYear !== 'all' && project.completionYear !== selectedYear) {
      return false;
    }

    // Filter by category
    if (selectedCategory !== 'all' && project.category !== selectedCategory) {
      return false;
    }

    // Filter by search term
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const matchesYear = project.completionYear?.includes(searchLower);
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.location?.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower) ||
      project.category?.toLowerCase().includes(searchLower) ||
      matchesYear
    );
  });

  // Sort: featured first, then architecture before interior, preserve relative order within each group
  const sortedFilteredProjects = useMemo(() =>
    filteredProjects.slice().sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const archA = a.category === 'architecture' ? 0 : 1;
      const archB = b.category === 'architecture' ? 0 : 1;
      return archA - archB;
    }),
    [filteredProjects]
  );

  const projects = sortedFilteredProjects;

  // Split into groups for display when no type filter is active
  const archProjects = projects.filter(p => (p as any).projectType === 'architecture');
  const interiorProjects = projects.filter(p => (p as any).projectType !== 'architecture');
  const showGrouped = selectedType === 'all' && (archProjects.length > 0 && interiorProjects.length > 0);

  const archTypeLabel = projectTypes.find(t => t.value === 'architecture');
  const interiorTypeLabel = projectTypes.find(t => t.value === 'interior');

  const renderGrid = (list: typeof projects) => {
    const spans = computeSpans(list);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 [grid-auto-rows:360px] md:[grid-auto-rows:480px] lg:[grid-auto-rows:600px] gap-[3px]">
        {list.map((project, index) => {
          const span = spans[index];
          const lgSpan = LG_SPAN_CLASS[span] || 'lg:col-span-2';
          const isLarge = span >= 3;
          return (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              className={lgSpan}
              isLarge={isLarge}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-[120vh] pt-32 pb-20">
      {/* Editorial header */}
      <div className="px-6 md:px-10 lg:px-16 mb-10">
        <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-[11px] uppercase tracking-widest font-light text-white/30">
              <Link href={language === 'vi' ? '/' : '/en'} className="hover:text-white/60 transition-colors duration-200">
                {language === 'vi' ? 'Trang Chủ' : 'Home'}
              </Link>
              <span>›</span>
              <span className="text-white/50">{language === 'vi' ? 'Dự Án' : 'Projects'}</span>
            </div>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-sans font-light tracking-tight leading-none"
              data-testid="heading-portfolio"
            >
              {language === 'vi' ? 'DỰ ÁN' : 'PROJECTS'}
            </h1>
          </div>
          {/* Search + Filter */}
          {(() => {
            const activeCount = [
              selectedYear !== 'all',
              selectedCategory !== 'all',
              selectedType !== 'all',
            ].filter(Boolean).length;
            return (
              <div className="flex items-center gap-4 pb-1 flex-shrink-0">
                {/* Search toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearchTerm(''); }}
                    className="text-white/50 hover:text-white transition-colors duration-200"
                    aria-label="Search"
                    data-testid="button-search-toggle"
                  >
                    {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ width: searchOpen ? '22rem' : '0', opacity: searchOpen ? 1 : 0 }}
                  >
                    <Input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus={searchOpen}
                      className="bg-transparent text-white placeholder-white/30 px-0 py-0 text-sm font-light rounded-none focus-visible:ring-0 border-0 w-full"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                {/* Filter toggle */}
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className="relative flex items-center gap-1.5 text-white/50 hover:text-white transition-colors duration-200"
                  aria-label="Filter"
                  data-testid="button-filter-toggle"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                {/* Clear all */}
                {activeCount > 0 && (
                  <button
                    onClick={() => { setSelectedYear('all'); setSelectedCategory('all'); setSelectedType('all'); setFilterOpen(false); }}
                    className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors duration-200"
                    data-testid="button-filter-clear"
                  >
                    {language === 'vi' ? 'Xoá' : 'Clear'}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
        {/* Description below divider */}
        <p className="text-sm text-white/40 font-light leading-relaxed mt-5 max-w-lg">
          {language === 'vi'
            ? 'Khám phá bộ sưu tập toàn diện các dự án thiết kế nội thất của chúng tôi qua nhiều danh mục khác nhau'
            : 'Explore our comprehensive collection of interior design projects across various categories'}
        </p>

        {/* Expandable filter panel */}
        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: filterOpen ? '600px' : '0', opacity: filterOpen ? 1 : 0 }}
        >
          <div className="flex items-start gap-0 pt-6 pb-4 border-t border-white/10 mt-5">
            {/* Project type */}
            {projectTypes.length > 1 && (
              <>
                <div className="flex-shrink-0 pr-10">
                  <p className="text-[10px] tracking-[0.15em] text-white/40 mb-4">
                    {language === 'vi' ? 'Loại' : 'Type'}
                  </p>
                  <div className="flex flex-col gap-3">
                    {projectTypes.map((pt) => (
                      <button
                        key={pt.value}
                        onClick={() => setSelectedType(pt.value)}
                        className={`text-left text-sm font-light transition-colors duration-200 ${
                          selectedType === pt.value ? 'text-white' : 'text-white/45 hover:text-white/80'
                        }`}
                        data-testid={`button-type-${pt.value}`}
                      >
                        {language === 'vi' ? pt.labelVi : pt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-px self-stretch bg-white/10 flex-shrink-0" />
              </>
            )}
            {/* Category */}
            {categories.length > 1 && (
              <>
                <div className="flex-1 px-10">
                  <p className="text-[10px] tracking-[0.15em] text-white/40 mb-4">
                    {language === 'vi' ? 'Danh mục' : 'Category'}
                  </p>
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`text-left text-sm font-light transition-colors duration-200 ${
                          selectedCategory === cat.value ? 'text-white' : 'text-white/45 hover:text-white/80'
                        }`}
                        data-testid={`button-cat-${cat.value}`}
                      >
                        {language === 'vi' ? cat.labelVi : cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-px self-stretch bg-white/10 flex-shrink-0" />
              </>
            )}
            {/* Year */}
            {availableYears.length > 0 && (
              <div className="flex-shrink-0 pl-10">
                <p className="text-[10px] tracking-[0.15em] text-white/40 mb-4">
                  {language === 'vi' ? 'Năm' : 'Year'}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setSelectedYear('all')}
                    className={`text-left text-sm font-light transition-colors duration-200 ${
                      selectedYear === 'all' ? 'text-white' : 'text-white/45 hover:text-white/80'
                    }`}
                  >
                    {language === 'vi' ? 'Tất cả' : 'All'}
                  </button>
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`text-left text-sm font-light transition-colors duration-200 ${
                        selectedYear === year ? 'text-white' : 'text-white/45 hover:text-white/80'
                      }`}
                      data-testid={`button-year-${year}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 lg:px-16">
        {/* Projects Grid */}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 [grid-auto-rows:360px] md:[grid-auto-rows:480px] lg:[grid-auto-rows:600px] gap-[3px]">
            {[{id:'a'},{id:'b'},{id:'c'},{id:'d'},{id:'e'},{id:'f'},{id:'g'}].map((p, i) => {
              const skeletonSpans = computeSpans([{id:'a'},{id:'b'},{id:'c'},{id:'d'},{id:'e'},{id:'f'},{id:'g'}]);
              const lgSpan = LG_SPAN_CLASS[skeletonSpans[i]] || 'lg:col-span-2';
              return (
                <div key={p.id} className={`animate-pulse bg-white/10 ${lgSpan}`} />
              );
            })}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-light mb-2">
              {language === 'vi' ? 'Không tìm thấy dự án' : 'No projects found'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'vi' ? 'Hiện tại chưa có dự án nào.' : 'No projects are available at the moment.'}
            </p>
          </div>
        ) : showGrouped ? (
          <>
            {archProjects.length > 0 && (
              <div className="mb-16">
                <p className="text-[11px] uppercase tracking-[0.2em] font-light text-white/30 mb-6 px-1">
                  {language === 'vi' ? (archTypeLabel?.labelVi || 'Kiến Trúc') : (archTypeLabel?.label || 'Architecture')}
                </p>
                {renderGrid(archProjects)}
              </div>
            )}
            {interiorProjects.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-light text-white/30 mb-6 px-1">
                  {language === 'vi' ? (interiorTypeLabel?.labelVi || 'Nội Thất') : (interiorTypeLabel?.label || 'Interior')}
                </p>
                {renderGrid(interiorProjects)}
              </div>
            )}
          </>
        ) : (
          renderGrid(projects)
        )}
      </div>
    </div>
  );
}
