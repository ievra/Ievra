import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import type { Project, Category, Article } from '@shared/schema';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { getProjectPath, getArticlePath } from '@/lib/routes';


// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';

const heroArticleImg = (src: string) =>
  src?.startsWith('/api/assets/')
    ? `/api/img/${src.replace('/api/assets/', '')}?w=320`
    : src;

interface HeroSliderProps {
  projects: Project[];
  featuredArticle?: Article;
}

export default function HeroSlider({ projects, featuredArticle }: HeroSliderProps) {
  const [progressKey, setProgressKey] = useState(0);
  const swiperRef = useRef<any>(null);
  const { language } = useLanguage();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [heroContentVisible, setHeroContentVisible] = useState(isMobile);

  useEffect(() => {
    if (isMobile) return;
    const handleIntroComplete = () => {
      setHeroContentVisible(true);
    };
    window.addEventListener('heroIntroComplete', handleIntroComplete);
    return () => window.removeEventListener('heroIntroComplete', handleIntroComplete);
  }, []);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const getCategoryName = (categorySlug: string) => {
    const category = categories.find(cat => 
      cat.slug === categorySlug || cat.name.toLowerCase() === categorySlug.toLowerCase()
    );
    if (category) {
      return language === 'vi' && category.nameVi ? category.nameVi : category.name;
    }
    return categorySlug;
  };

  // Restart progress animation when slide changes
  const handleSlideChange = () => {
    setProgressKey(prev => prev + 1);
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="bg-background min-h-screen"></div>
    );
  }

  return (
    <div className="relative bg-black text-white h-screen">
      <Swiper
        ref={swiperRef}
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{
          crossFade: false,
        }}
        spaceBetween={0}
        slidesPerView={1}
        speed={1000}
        allowTouchMove={true}
        grabCursor={false}
        touchEventsTarget="container"
        simulateTouch={true}
        threshold={8}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        rewind={true}
        onSlideChange={handleSlideChange}
        onAutoplayTimeLeft={(s, time, progress) => {}}
        className="js-slider h-screen"
        data-slider-slug="hero"
        data-testid="hero-slider"
      >
        {projects.map((project, idx) => {
          const rawBg = Array.isArray(project.coverImages) && project.coverImages[0] ||
                Array.isArray(project.contentImages) && project.contentImages[0] ||
                Array.isArray(project.galleryImages) && project.galleryImages[0] ||
                project.heroImage ||
                (Array.isArray(project.images) && project.images[0]) ||
                '';

          const heroSrc = rawBg || '';

          return (
            <SwiperSlide key={project.id} data-testid={`slide-${project.id}`}>
              <div className="wrapper relative h-screen px-6 md:px-10 lg:px-16">
                <div className="absolute inset-0">
                  {heroSrc ? (
                    <>
                      <img 
                        src={heroSrc}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        data-testid={`slide-bg-${project.id}`}
                        style={{ zIndex: 1 }}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        decoding={idx === 0 ? 'sync' : 'async'}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40" style={{ zIndex: 2 }}></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-background" style={{ zIndex: 1 }}></div>
                  )}
                </div>
                
                <div className="relative h-full flex flex-col justify-between" style={{ zIndex: 10 }}>
                  <div className={`flex-1 flex items-end pb-4 transition-opacity duration-700 ${heroContentVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <Link 
                      href={getProjectPath(language, project.slug, project.id)} 
                      className="block group"
                      data-testid={`slide-link-${project.id}`}
                    >
                      <div className="max-w-4xl">
                        <span className="js-slider-slide-type sr-only">Project</span>
                        <span className="js-slider-slide-author sr-only">{project.designer || 'MODERNO INTERIORS Design'}</span>
                        <time className="js-slider-slide-date sr-only">{project.completionYear || new Date().getFullYear()}</time>
                        <span className="js-slider-slide-published-in sr-only">{project.category}</span>
                        <h2 className="text-white text-2xl md:text-3xl font-light tracking-wide leading-snug group-hover:text-white/80 transition-colors duration-300">
                          {project.title}
                        </h2>
                      </div>
                    </Link>
                  </div>
                  
                  {/* Hero Footer */}
                  <div className={`flex justify-between items-end pb-8 transition-opacity duration-700 ${heroContentVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center gap-10 text-white text-sm font-light">
                      <span>{project.completionYear || new Date().getFullYear()}</span>
                      <span className="capitalize">
                        {getCategoryName(project.category)}
                      </span>
                      {project.location && <span>{project.location}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Featured article quick-access card */}
      {featuredArticle && featuredArticle.slug && (
        <Link
          href={getArticlePath(language, featuredArticle.slug)}
          className={`hidden md:flex absolute top-24 right-6 md:right-10 lg:right-16 z-20 w-72 items-center gap-3 p-3 bg-black/40 backdrop-blur-md border border-white/15 hover:bg-black/60 transition-all duration-500 group ${heroContentVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          data-testid="hero-featured-article"
        >
          {(featuredArticle.featuredImage || featuredArticle.featuredImageData) && (
            <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden bg-white/5">
              <img
                src={heroArticleImg(featuredArticle.featuredImage || featuredArticle.featuredImageData || '')}
                alt={featuredArticle.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1 font-light">
              {language === 'vi' ? 'Bài viết nổi bật' : 'Featured article'}
            </p>
            <p
              className="text-white text-sm font-light leading-snug group-hover:text-white/80 transition-colors duration-300"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {featuredArticle.title}
            </p>
          </div>
        </Link>
      )}

      {/* Navigation Arrows (single instance, reliably bound) */}
      <div className={`hidden sm:flex gap-4 absolute bottom-8 right-6 md:right-10 lg:right-16 z-20 transition-opacity duration-700 ${heroContentVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <button
          type="button"
          onClick={() => swiperRef.current?.swiper?.slidePrev()}
          className="swiper-button-prev-custom w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          aria-label="Previous slide"
        >
          &lt;
        </button>

        {/* Circular Progress Next Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => swiperRef.current?.swiper?.slideNext()}
            className="swiper-button-next-custom w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors relative z-10"
            aria-label="Next slide"
          >
            &gt;
          </button>

          {/* Circular Progress Line */}
          <svg
            className="absolute inset-0 w-10 h-10 -rotate-90 pointer-events-none"
            viewBox="0 0 40 40"
          >
            <circle
              key={progressKey}
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="1"
              strokeDasharray="113.1"
              strokeDashoffset="113.1"
              className="animate-hero-progress"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
