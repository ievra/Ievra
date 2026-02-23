import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation } from 'swiper/modules';
import type { Project, Category } from '@shared/schema';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';

interface HeroSliderProps {
  projects: Project[];
}

export default function HeroSlider({ projects }: HeroSliderProps) {
  const [progressKey, setProgressKey] = useState(0);
  const swiperRef = useRef<any>(null);
  const { language } = useLanguage();

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
    <div className="bg-black text-white h-screen">
      <Swiper
        ref={swiperRef}
        modules={[Autoplay, EffectFade, Navigation]}
        effect="fade"
        fadeEffect={{
          crossFade: false,
        }}
        spaceBetween={0}
        slidesPerView={1}
        speed={1000}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        loop={true}
        onSlideChange={handleSlideChange}
        onAutoplayTimeLeft={(s, time, progress) => {
          // Optional: could use this for more precise sync
        }}
        className="js-slider h-screen"
        data-slider-slug="hero"
        data-testid="hero-slider"
      >
        {projects.map((project) => {
          const backgroundImage = Array.isArray(project.coverImages) && project.coverImages[0] ||
                Array.isArray(project.contentImages) && project.contentImages[0] ||
                Array.isArray(project.galleryImages) && project.galleryImages[0] ||
                project.heroImage ||
                (Array.isArray(project.images) && project.images[0]) ||
                '';

          return (
            <SwiperSlide key={project.id} data-testid={`slide-${project.id}`}>
              <div className="wrapper relative h-screen px-6 md:px-10 lg:px-16">
                <div className="absolute inset-0">
                  {backgroundImage ? (
                    <>
                      <img 
                        src={backgroundImage} 
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        data-testid={`slide-bg-${project.id}`}
                        style={{ zIndex: 1 }}
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
                  <div className="flex-1 flex items-center">
                    <Link 
                      href={project.slug ? `/portfolio/${project.slug}` : `/project/${project.id}`} 
                      className="block"
                      data-testid={`slide-link-${project.id}`}
                    >
                      <div className="max-w-4xl">
                        <span className="js-slider-slide-type sr-only">Project</span>
                        <span className="js-slider-slide-author sr-only">{project.designer || 'MODERNO INTERIORS Design'}</span>
                        <time className="js-slider-slide-date sr-only">{project.completionYear || new Date().getFullYear()}</time>
                        <span className="js-slider-slide-published-in sr-only">{project.category}</span>
                      </div>
                    </Link>
                  </div>
                  
                  {/* Hero Footer */}
                  <div className="flex justify-between items-end pb-8">
                    <div className="flex items-center gap-10 text-white text-sm font-light">
                      <span>{language === 'vi' ? 'bởi' : 'by'}&nbsp;&nbsp;{project.designer || 'MODERNO INTERIORS Design'}</span>
                      <span>{project.completionYear || new Date().getFullYear()}</span>
                      <span className="capitalize">
                        {getCategoryName(project.category)}
                      </span>
                    </div>
                    
                    {/* Navigation Arrows */}
                    <div className="flex gap-4">
                      <button className="swiper-button-prev-custom w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        &lt;
                      </button>
                      
                      {/* Circular Progress Next Button */}
                      <div className="relative">
                        <button className="swiper-button-next-custom w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors relative z-10">
                          &gt;
                        </button>
                        
                        {/* Circular Progress Line */}
                        <svg 
                          className="absolute inset-0 w-10 h-10 -rotate-90"
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
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}