import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import type { Project, AboutPageContent, AboutShowcaseService, AboutProcessStep, AboutCoreValue, AboutTeamMember, AboutAward } from '@shared/schema';
import { useState, useEffect, useRef } from 'react';
import 'swiper/css';
import 'swiper/css/effect-fade';

export default function About() {
  const { language } = useLanguage();
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const awardsScrollRef = useRef<HTMLDivElement>(null);
  const [awardsCanScrollLeft, setAwardsCanScrollLeft] = useState(false);
  const [awardsCanScrollRight, setAwardsCanScrollRight] = useState(true);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: aboutContent, isLoading: aboutContentLoading } = useQuery<AboutPageContent>({
    queryKey: ["/api/about-page-content"],
  });

  const { data: showcaseServices = [] } = useQuery<AboutShowcaseService[]>({
    queryKey: ["/api/about-showcase-services"],
    select: (data) => data.filter(s => s.active).sort((a, b) => a.order - b.order),
  });

  const { data: processSteps = [] } = useQuery<AboutProcessStep[]>({
    queryKey: ["/api/about-process-steps"],
    select: (data) => data.filter(s => s.active).sort((a, b) => a.order - b.order),
  });

  const { data: coreValues = [] } = useQuery<AboutCoreValue[]>({
    queryKey: ["/api/about-core-values"],
    select: (data) => data.filter(v => v.active).sort((a, b) => a.order - b.order),
  });

  const { data: teamMembers = [] } = useQuery<AboutTeamMember[]>({
    queryKey: ["/api/about-team-members"],
    select: (data) => data.filter(m => m.active).sort((a, b) => a.order - b.order),
  });

  const { data: awards = [] } = useQuery<AboutAward[]>({
    queryKey: ["/api/about-awards"],
    select: (data) => data.filter(a => a.active).sort((a, b) => a.order - b.order),
  });

  useEffect(() => {
    const el = awardsScrollRef.current;
    if (!el) return;
    const check = () => setAwardsCanScrollRight(el.scrollWidth > el.clientWidth + 8);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [awards]);

  const showcaseSectionRef = useRef<HTMLDivElement>(null);
  const [showcaseAnimStarted, setShowcaseAnimStarted] = useState(false);

  const [heroAnimStarted, setHeroAnimStarted] = useState(false);

  useEffect(() => {
    if (aboutContent) {
      const t = setTimeout(() => setHeroAnimStarted(true), 100);
      return () => clearTimeout(t);
    }
  }, [aboutContent]);

  const coreValuesContainerRef = useRef<HTMLDivElement>(null);
  const coreValueDotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [coreValuesAnimStarted, setCoreValuesAnimStarted] = useState(false);
  const [coreValueDotYs, setCoreValueDotYs] = useState<number[]>([]);
  const [coreValueLineH, setCoreValueLineH] = useState(0);
  const CORE_VALUES_ANIM_DURATION = 1.5;

  useEffect(() => {
    const container = coreValuesContainerRef.current;
    if (!container || coreValues.length === 0) return;
    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const ys = coreValueDotRefs.current.map(dot => {
        if (!dot) return 0;
        return dot.getBoundingClientRect().top - containerRect.top + 6;
      });
      setCoreValueDotYs(ys);
      setCoreValueLineH(ys[ys.length - 1] ?? 0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [coreValues]);

  useEffect(() => {
    const container = coreValuesContainerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCoreValuesAnimStarted(true); },
      { threshold: 0.1 }
    );
    obs.observe(container);
    const onScroll = () => {
      if (window.scrollY < 50) setCoreValuesAnimStarted(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [coreValues]);

  const snakeRef = useRef<HTMLDivElement>(null);
  const [snakeW, setSnakeW] = useState(0);
  const [pathAnimated, setPathAnimated] = useState(false);

  useEffect(() => {
    const el = snakeRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width || el.offsetWidth;
      if (w > 0) setSnakeW(w);
    };
    measure();
    const rafId = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
  }, []);

  useEffect(() => {
    const el = snakeRef.current;
    if (!el) return;
    let obs: IntersectionObserver;
    const setup = () => {
      if (obs) obs.disconnect();
      obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setPathAnimated(true); obs.disconnect(); } },
        { threshold: 0.05 }
      );
      obs.observe(el);
    };
    setup();
    const onScroll = () => {
      if (window.scrollY < 50) { setPathAnimated(false); setup(); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { obs?.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [processSteps.length]);

  useEffect(() => {
    if (!aboutContent) return;
    const getEls = () => document.querySelectorAll<Element>('.slide-from-left, .slide-from-right, .slide-up, .typewriter-heading');
    let obs: IntersectionObserver;
    const setup = () => {
      if (obs) obs.disconnect();
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      getEls().forEach(el => obs.observe(el));
    };
    setup();
    const retryTimer = setTimeout(setup, 500);
    const onScroll = () => {
      if (window.scrollY < 50) {
        getEls().forEach(el => el.classList.remove('in-view'));
        setup();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { obs?.disconnect(); clearTimeout(retryTimer); window.removeEventListener('scroll', onScroll); };
  }, [aboutContent, coreValues.length, processSteps.length, teamMembers.length, awards.length]);

  useEffect(() => {
    if (!showcaseSectionRef.current || showcaseServices.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShowcaseAnimStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(showcaseSectionRef.current);

    const handleScroll = () => {
      if (window.scrollY < 50) {
        setShowcaseAnimStarted(false);
        observer.observe(showcaseSectionRef.current!);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showcaseSectionRef.current, showcaseServices.length]);


  const getFallbackImage = (category: string) => {
    switch (category) {
      case 'residential':
        return 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080';
      case 'commercial':
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080';
      case 'architecture':
        return 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080';
      default:
        return 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080';
    }
  };

  return (
    <main className="lg:ml-16 min-h-[120vh]">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] bg-black overflow-hidden lg:-ml-16">
        <div className="relative h-screen">
          {/* Background Images Slider */}
          {aboutContent?.heroImages && aboutContent.heroImages.length > 0 ? (
            <Swiper
              modules={[Autoplay, EffectFade]}
              effect="fade"
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              loop={true}
              speed={800}
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: 0 }}
            >
              {aboutContent.heroImages.map((imageUrl, index) => (
                <SwiperSlide key={index}>
                  <img 
                    src={imageUrl} 
                    alt={`About Hero ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1200';
                    }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="absolute inset-0 bg-black" style={{ zIndex: 0 }} />
          )}
          <div className="absolute inset-0 bg-black/40" style={{ zIndex: 1 }} />
          
          {/* Content */}
          {aboutContent && (
            <div className="relative h-full flex items-center" style={{ zIndex: 2 }}>
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex justify-center">
                  <h1 className="font-light text-white uppercase tracking-[0.06em] text-center whitespace-pre-line text-[42px]">
                    {(language === "vi" ? aboutContent.heroTitleVi : aboutContent.heroTitleEn).split('').map((char, i) => (
                      <span
                        key={i}
                        style={{
                          opacity: 0,
                          animation: heroAnimStarted ? `revealChar 0.01s ${i * 0.035}s forwards` : 'none',
                        }}
                      >{char}</span>
                    ))}
                  </h1>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Company History Section */}
      {aboutContent?.historyContentEn && aboutContent?.historyContentVi && (
        <section className="py-20 bg-black lg:-ml-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="slide-from-left space-y-8">
                <h3 className="md:text-4xl font-light text-white uppercase tracking-wide text-[24px]">
                  {language === "vi" ? aboutContent.historyTitleVi : aboutContent.historyTitleEn}
                </h3>
                <p className="text-white/70 font-light text-lg leading-relaxed whitespace-pre-line text-justify">
                  {language === "vi" ? aboutContent.historyContentVi : aboutContent.historyContentEn}
                </p>
              </div>
              {aboutContent.historyImage && (
                <div className="slide-from-right">
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                    <img 
                      src={aboutContent.historyImage} 
                      alt={language === "vi" ? "Lịch sử công ty" : "Company History"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      {/* Mission & Vision Section - 2 columns: Mission (small img) | Vision (large img) */}
      {(aboutContent?.missionContentEn || aboutContent?.visionContentEn) && (
        <section className="py-20 bg-black lg:-ml-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-20 items-start">
              {/* LEFT: Small image + Mission */}
              {aboutContent?.missionContentEn && aboutContent?.missionContentVi && (
                <div className="space-y-8">
                  {(aboutContent.missionImageData || aboutContent.missionImage) && (
                    <div className="slide-from-left">
                      <div className="relative overflow-hidden bg-white/5 aspect-[4/3]">
                        <img
                          src={aboutContent.missionImageData || aboutContent.missionImage || undefined}
                          alt={language === "vi" ? "Sứ mệnh" : "Mission"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="slide-from-left space-y-6">
                    <h3 className="text-2xl font-light text-white uppercase tracking-wide">
                      {language === "vi" ? aboutContent.missionTitleVi : aboutContent.missionTitleEn}
                    </h3>
                    <p className="text-lg text-white/70 font-light leading-relaxed whitespace-pre-line text-justify">
                      {language === "vi" ? aboutContent.missionContentVi : aboutContent.missionContentEn}
                    </p>
                  </div>
                </div>
              )}

              {/* RIGHT: Large image + Vision */}
              {aboutContent?.visionContentEn && aboutContent?.visionContentVi && (
                <div className="space-y-8">
                  {(aboutContent.missionVisionImageData || aboutContent.missionVisionImage) && (
                    <div className="slide-from-right">
                      <div className="relative overflow-hidden bg-white/5 aspect-[4/3]">
                        <img
                          src={aboutContent.missionVisionImageData || aboutContent.missionVisionImage || undefined}
                          alt={language === "vi" ? "Tầm nhìn" : "Vision"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1600';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="slide-from-right space-y-6">
                    <h3 className="text-2xl font-light text-white uppercase tracking-wide">
                      {language === "vi" ? aboutContent.visionTitleVi : aboutContent.visionTitleEn}
                    </h3>
                    <p className="text-lg text-white/70 font-light leading-relaxed whitespace-pre-line text-justify">
                      {language === "vi" ? aboutContent.visionContentVi : aboutContent.visionContentEn}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      {/* Design Philosophy / Principles Section */}
      {aboutContent && (aboutContent.principlesContentEn || aboutContent.principlesContentVi) && (
        <section className="py-20 bg-black lg:-ml-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1fr] gap-10 items-start">
              {/* Left image — large */}
              {(aboutContent.principlesImageLeftData || aboutContent.principlesImageLeft) ? (
                <div className="slide-from-left">
                  <div className="overflow-hidden aspect-[2/3] bg-white/5">
                    <img
                      src={aboutContent.principlesImageLeftData || aboutContent.principlesImageLeft}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : <div />}

              {/* Center: title + content */}
              <div className="slide-up space-y-6 self-center">
                <h3 className="text-2xl md:text-3xl font-light text-white uppercase tracking-wide leading-tight">
                  {language === "vi" ? aboutContent.principlesTitleVi : aboutContent.principlesTitleEn}
                </h3>
                <p className="text-lg text-white/70 font-light leading-relaxed whitespace-pre-line text-justify">
                  {language === "vi" ? aboutContent.principlesContentVi : aboutContent.principlesContentEn}
                </p>
              </div>

              {/* Right image — small */}
              {(aboutContent.principlesImageRightData || aboutContent.principlesImageRight) ? (
                <div className="slide-from-right">
                  <div className="overflow-hidden aspect-[2/3] bg-white/5">
                    <img
                      src={aboutContent.principlesImageRightData || aboutContent.principlesImageRight}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : <div />}
            </div>
          </div>
        </section>
      )}
      {/* Architecture Showcase + Stats Section */}
      {((aboutContent?.showcaseBannerImageData || aboutContent?.showcaseBannerImage) || showcaseServices.length > 0 || aboutContent) && (
        <section className="relative bg-black overflow-hidden lg:-ml-16 lg:h-screen">
          {(aboutContent?.showcaseBannerImageData || aboutContent?.showcaseBannerImage) && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${aboutContent.showcaseBannerImageData || aboutContent.showcaseBannerImage})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black from-0% via-black/80 via-[60%] to-black/40" />
            </div>
          )}

          <div className="relative flex flex-col lg:h-full lg:justify-end">
            {/* Showcase Services */}
            {showcaseServices.length > 0 && (
              <div ref={showcaseSectionRef} className="relative w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                {showcaseServices.map((service, index) => {
                  const stepHeights = ['lg:min-h-[700px]', 'lg:min-h-[520px]', 'lg:min-h-[360px]', 'lg:min-h-[230px]'];
                  const stepH = stepHeights[index % 4];
                  const fullTitle = language === "vi" ? service.titleVi : service.titleEn;
                  const fullDesc = language === "vi" ? service.descriptionVi : service.descriptionEn;
                  return (
                    <div
                      key={service.id}
                      className={`px-6 py-8 md:px-8 md:py-12 ${index > 0 ? 'border-t border-white/10 lg:border-t-0' : ''}`}
                      style={{
                        opacity: 0,
                        animation: showcaseAnimStarted
                          ? `slideUpFade 1.4s cubic-bezier(0.22,0.61,0.36,1) ${index * 0.25}s forwards`
                          : 'none',
                      }}
                    >
                      <div className={`${stepH} flex flex-col justify-start`}>
                        <div className="relative space-y-3">
                          {index > 0 && (
                            <div
                              className="hidden lg:block absolute -left-8 top-0 bottom-0"
                              style={{
                                width: '2px',
                                background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 10%, rgba(255,255,255,0.3) 90%, transparent 100%)'
                              }}
                            />
                          )}
                          <h4 className="text-xl font-light text-white uppercase tracking-wide">
                            {fullTitle}
                          </h4>
                          <p className="text-white/70 font-light text-lg leading-relaxed text-justify">
                            {fullDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </section>
      )}
      {/* Core Values Section */}
      {coreValues.length > 0 && aboutContent && (
        <section className="py-20 bg-black lg:-ml-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h3 className="slide-from-left md:text-4xl font-light text-white uppercase tracking-wide text-[24px]">
                {language === "vi" ? aboutContent.coreValuesTitleVi : aboutContent.coreValuesTitleEn}
              </h3>
            </div>

            <div className="relative" ref={coreValuesContainerRef}>
              {/* Animated SVG vertical center line */}
              {coreValueLineH > 0 && (
                <svg
                  className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none hidden lg:block"
                  style={{ width: '2px', height: `${coreValueLineH}px`, overflow: 'visible' }}
                >
                  <line x1="1" y1="0" x2="1" y2={coreValueLineH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <line
                    key={coreValuesAnimStarted ? 'on' : 'off'}
                    x1="1" y1="0" x2="1" y2={coreValueLineH}
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.5"
                    strokeDasharray={coreValueLineH}
                    strokeDashoffset={coreValueLineH}
                    style={{
                      animation: coreValuesAnimStarted
                        ? `drawCoreValuesLine ${CORE_VALUES_ANIM_DURATION}s linear forwards`
                        : 'none',
                    }}
                  />
                </svg>
              )}

              {coreValues.map((value, index) => {
                const isLeft = index % 2 === 0;
                const title = language === "vi" ? value.titleVi : value.titleEn;
                const desc = language === "vi" ? value.descriptionVi : value.descriptionEn;
                const dotY = coreValueDotYs[index] ?? 0;
                const itemDelay = coreValueLineH > 0 ? (dotY / coreValueLineH) * CORE_VALUES_ANIM_DURATION : 0;
                return (
                  <div key={value.id} className={`relative lg:grid lg:grid-cols-2 ${index < coreValues.length - 1 ? 'mb-12 lg:mb-44' : ''}`}>
                    {/* Desktop LEFT column */}
                    <div className="hidden lg:block lg:pr-20 lg:text-right">
                      {isLeft && (
                        <div
                          className="space-y-3 max-w-sm ml-auto"
                          style={{
                            opacity: 0,
                            animation: coreValuesAnimStarted
                              ? `snakeItemFadeIn 1.2s ease ${itemDelay + 0.1}s forwards`
                              : 'none',
                          }}
                        >
                          <h4 className="text-2xl text-white uppercase tracking-wide leading-tight font-light">{title}</h4>
                          <p className="text-white/60 font-light text-[18px]">{desc}</p>
                        </div>
                      )}
                    </div>
                    {/* Center dot + connector */}
                    <div
                      ref={el => { coreValueDotRefs.current[index] = el; }}
                      className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center"
                      style={{ top: '6px' }}
                    >
                      <div
                        className="w-3 h-3 rounded-full bg-white border-2 border-white flex-shrink-0"
                        style={{
                          opacity: 0,
                          animation: coreValuesAnimStarted
                            ? `snakeItemFadeIn 0.8s ease ${itemDelay}s forwards`
                            : 'none',
                        }}
                      />
                      <div
                        className={`h-px w-8 bg-white/40 absolute ${isLeft ? 'right-3' : 'left-3'}`}
                        style={{
                          opacity: 0,
                          animation: coreValuesAnimStarted
                            ? `snakeItemFadeIn 0.8s ease ${itemDelay}s forwards`
                            : 'none',
                        }}
                      />
                    </div>
                    {/* Desktop RIGHT column */}
                    <div className="hidden lg:block lg:pl-20">
                      {!isLeft && (
                        <div
                          className="space-y-3 max-w-sm"
                          style={{
                            opacity: 0,
                            animation: coreValuesAnimStarted
                              ? `snakeItemFadeIn 1.2s ease ${itemDelay + 0.1}s forwards`
                              : 'none',
                          }}
                        >
                          <h4 className="text-2xl text-white uppercase tracking-wide leading-tight font-light">{title}</h4>
                          <p className="text-white/60 font-light text-[18px]">{desc}</p>
                        </div>
                      )}
                    </div>
                    {/* Mobile: stacked with left border */}
                    <div className="lg:hidden space-y-3 pl-6 border-l border-white/20">
                      <h4 className="text-xl font-semibold text-white uppercase tracking-wide">{title}</h4>
                      <p className="text-white/60 font-light text-base leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {/* Process Section */}
      {processSteps.length > 0 && aboutContent && (
        <section className="py-20 bg-black lg:-ml-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h3 className="slide-from-left md:text-4xl font-light text-white uppercase tracking-wide text-[24px]">
                {language === "vi" ? aboutContent.processTitleVi : aboutContent.processTitleEn}
              </h3>
            </div>

            {/* Desktop snake layout — SVG single path; full viewport width */}
            <div
              className="hidden md:block"
              ref={snakeRef}
              style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
            >
              {(() => {
                const PER_ROW = 3;
                const R = 110;          // U-turn radius (px) — ROW_H must = 2*R for perfect semicircle
                const ROW_H = 220;      // = 2*R → perfect semicircle U-turns
                const LINE_Y = 28;      // y of line within each row block
                const PAD_L = 200;      // left endpoint distance from left edge (U-turn peak at PAD_L - R)
                const PAD_R = 220;      // right endpoint distance from right edge (U-turn peak at PAD_R - R)

                const rowSizes = [2, 3, 2]; // row 1: 2 items, row 2: 3 items, row 3: 2 items
                const rows: typeof processSteps[] = [];
                let sliceIdx = 0;
                for (const size of rowSizes) {
                  const chunk = processSteps.slice(sliceIdx, sliceIdx + size);
                  if (chunk.length > 0) rows.push(chunk);
                  sliceIdx += size;
                }
                const numRows = rows.length;
                const svgH = LINE_Y + (numRows - 1) * ROW_H + LINE_Y + 80; // extra bottom for text

                const ANIM_DURATION = 5; // seconds for full line draw

                // Build SVG background path — wrapper has -mx-* so x=0 and x=W are section edges
                const buildPath = (W: number) => {
                  if (W <= 0) return '';
                  const xL = PAD_L;
                  const xR = W - PAD_R;
                  let d = `M 0,${LINE_Y} L ${xL},${LINE_Y}`;
                  for (let r = 0; r < numRows; r++) {
                    const y = LINE_Y + r * ROW_H;
                    if (r === 0) {
                      d += ` L ${xR},${y}`;
                    } else if (r % 2 === 1) {
                      d += ` L ${xL},${y}`;
                    } else {
                      d += ` L ${xR},${y}`;
                    }
                    if (r < numRows - 1) {
                      const nextY = y + ROW_H;
                      if (r % 2 === 0) {
                        d += ` A ${R},${R} 0 0,1 ${xR},${nextY}`;
                      } else {
                        d += ` A ${R},${R} 0 0,0 ${xL},${nextY}`;
                      }
                    }
                  }
                  const lastY = LINE_Y + (numRows - 1) * ROW_H;
                  const lastIsReversed = (numRows - 1) % 2 === 1;
                  d += lastIsReversed ? ` L 0,${lastY}` : ` L ${W},${lastY}`;
                  return d;
                };

                // Do not render until snakeW is measured — avoids wrong fallback width
                if (!snakeW) return null;
                const W0 = snakeW;
                const xL0 = PAD_L;
                const xR0 = W0 - PAD_R;
                const rowLen0 = xR0 - xL0;
                const fullTurn0 = Math.PI * R;
                const halfTurn0 = fullTurn0 / 2;

                // Snake wrapper has -mx-* so W spans full section width (no bleed needed)
                // leftBleed0 = xL0 (from section left edge to item 01)
                // rightBleed0 = PAD_R (from item 07/last to section right edge)
                const leftBleed0 = xL0;
                const rightBleed0 = PAD_R;
                const totalAnimPathLen0 = leftBleed0 + numRows * rowLen0 + (numRows - 1) * fullTurn0 + rightBleed0;
                const stepPathPos: Record<string, number> = {
                  '01': leftBleed0,
                  '02': leftBleed0 + rowLen0 / 2,
                  '03': leftBleed0 + rowLen0 + halfTurn0,
                  '04': leftBleed0 + rowLen0 + fullTurn0 + rowLen0 / 2,
                  '05': leftBleed0 + 2 * rowLen0 + fullTurn0 + halfTurn0,
                  '06': leftBleed0 + 2 * rowLen0 + 2 * fullTurn0 + rowLen0 / 2,
                  '07': leftBleed0 + 3 * rowLen0 + 2 * fullTurn0,
                };
                const getItemDelay = (stepNum: string) =>
                  ((stepPathPos[stepNum] ?? 0) / totalAnimPathLen0) * ANIM_DURATION;

                // Animated path — from section left edge (x=0) to section right edge (x=W)
                const buildVisiblePath = (W: number) => {
                  if (W <= 0) return '';
                  const xL = PAD_L;
                  const xR = W - PAD_R;
                  let d = `M 0,${LINE_Y} L ${xL},${LINE_Y}`;
                  for (let r = 0; r < numRows; r++) {
                    const y = LINE_Y + r * ROW_H;
                    const endX = r % 2 === 0 ? xR : xL;
                    d += ` L ${endX},${y}`;
                    if (r < numRows - 1) {
                      const nextY = y + ROW_H;
                      if (r % 2 === 0) {
                        d += ` A ${R},${R} 0 0,1 ${xR},${nextY}`;
                      } else {
                        d += ` A ${R},${R} 0 0,0 ${xL},${nextY}`;
                      }
                    }
                  }
                  const lastY = LINE_Y + (numRows - 1) * ROW_H;
                  d += ` L ${W},${lastY}`;
                  return d;
                };

                return (
                  <div className="relative" style={{ height: `${svgH}px` }}>
                    {/* SVG snake path */}
                    <svg
                      className="absolute top-0 left-0 pointer-events-none"
                      width={W0}
                      height={svgH}
                      style={{ overflow: 'visible' }}
                    >
                      {/* Faint static background (with bleed) */}
                      <path
                        d={buildPath(W0)}
                        fill="none"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                      {/* Animated drawing line (visible path, no bleed) */}
                      <path
                        key={pathAnimated ? 'on' : 'off'}
                        d={buildVisiblePath(W0)}
                        fill="none"
                        stroke="rgba(255,255,255,0.75)"
                        strokeWidth="1.5"
                        pathLength="1"
                        vectorEffect="non-scaling-stroke"
                        style={{
                          strokeDasharray: 1,
                          strokeDashoffset: 1,
                          animation: pathAnimated
                            ? `drawSnakePath ${ANIM_DURATION}s linear forwards`
                            : 'none',
                        }}
                      />
                    </svg>
                    {/* Items — each absolutely positioned to match SVG path coordinates */}
                    {rows.flatMap((row, rowIdx) => {
                      const isReversed = rowIdx % 2 === 1;
                      const displayRow = isReversed ? [...row].reverse() : row;
                      const lineY = LINE_Y + rowIdx * ROW_H;
                      const W = snakeW;
                      const xL = PAD_L;
                      const xR = W - PAD_R;
                      const isSingleItem = row.length === 1;

                      return displayRow.map((step, ci) => {
                        const title = language === "vi" ? step.titleVi : step.titleEn;
                        const desc = language === "vi" ? step.descriptionVi : step.descriptionEn;
                        const itemDelay = getItemDelay(step.stepNumber);
                        const descDelay = itemDelay + 0.2;

                        // x position: evenly spaced from xL to xR based on actual row item count
                        const xMid = (xL + xR) / 2;
                        let xPos: number;
                        let markerY = lineY; // default: line center y for this row

                        // Special: item 03 at apex of right U-turn (between row1 & row2)
                        const isItem3AtApex = rowIdx === 1 && ci === displayRow.length - 1;
                        // Special: item 05 at apex of left U-turn (between row2 & row3)
                        const isItem5AtApex = rowIdx === 1 && ci === 0;

                        if (isItem3AtApex) {
                          // Apex of right U-turn: x = xR + R, y = midpoint between row1 and row2
                          xPos = xR + R;
                          markerY = LINE_Y + ROW_H / 2;
                        } else if (isItem5AtApex) {
                          // Apex of left U-turn: x = xL - R, y = midpoint between row2 and row3
                          xPos = xL - R;
                          markerY = LINE_Y + ROW_H + ROW_H / 2;
                        } else if (isSingleItem) {
                          xPos = isReversed ? xL : xR;
                        } else if (rowIdx === 0 && !isReversed) {
                          xPos = ci === 0 ? xL : xMid;
                        } else if (rowIdx === 2 && !isReversed) {
                          xPos = ci === 0 ? xMid : xR;
                        } else {
                          xPos = xL + ci * (xR - xL) / (row.length - 1);
                        }

                        return (
                          <div
                            key={step.id}
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `${xPos}px`,
                              transform: 'translateX(-50%)',
                              width: (isItem3AtApex || isItem5AtApex) ? '130px' : '155px',
                              top: 0,
                            }}
                          >
                            {/* Circle marker with number */}
                            <div
                              className="rounded-full bg-[#2d2d2d] border border-white/20 text-white flex items-center justify-center flex-shrink-0 font-light"
                              style={{
                                width: '50px',
                                height: '50px',
                                fontSize: '20px',
                                marginTop: `${markerY - 25}px`,
                                opacity: 0,
                                animation: pathAnimated
                                  ? `snakeItemFadeIn 0.5s ease ${itemDelay}s forwards`
                                  : 'none',
                              }}
                            >
                              {step.stepNumber}
                            </div>
                            <div className="mt-3 text-center px-1">
                              <h4
                                className="font-light text-white uppercase tracking-wide text-[16px]"
                                style={{
                                  opacity: 0,
                                  animation: pathAnimated
                                    ? `snakeItemFadeIn 0.5s ease ${itemDelay + 0.1}s forwards`
                                    : 'none',
                                }}
                              >
                                {title}
                              </h4>
                              {desc && (
                                <p
                                  className="text-white/50 text-xs font-light leading-relaxed mt-1"
                                  style={{
                                    opacity: 0,
                                    animation: pathAnimated
                                      ? `snakeItemFadeIn 0.6s ease ${descDelay}s forwards`
                                      : 'none',
                                  }}
                                >
                                  {desc}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Mobile vertical timeline */}
            <div className="md:hidden">
              {processSteps.map((step, idx) => {
                const title = language === "vi" ? step.titleVi : step.titleEn;
                const desc = language === "vi" ? step.descriptionVi : step.descriptionEn;
                const isLast = idx === processSteps.length - 1;
                return (
                  <div key={step.id} className="flex gap-5">
                    {/* Left: circle + connector line */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-10 h-10 rounded-full border border-white/40 text-white text-sm flex items-center justify-center font-light bg-black z-10">
                        {step.stepNumber}
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-white/15 my-2" style={{ minHeight: '40px' }} />
                      )}
                    </div>
                    {/* Right: content */}
                    <div className="pb-8">
                      <h4 className="text-base font-light text-white uppercase tracking-wide leading-tight pt-2">{title}</h4>
                      {desc && <p className="text-white/50 text-sm font-light leading-relaxed mt-2">{desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {/* Team Members Section */}
      {teamMembers.length > 0 && aboutContent && (
        <section className="py-20 bg-black lg:-ml-16 overflow-hidden border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h3 className="typewriter-heading text-3xl md:text-4xl font-light text-white uppercase tracking-wide mb-4">
                {language === "vi" ? aboutContent.teamTitleVi : aboutContent.teamTitleEn}
              </h3>
            </div>

            {/* Mobile layout: vertical cards */}
            <div className="flex flex-col gap-4 md:hidden">
              {teamMembers.map((member, index) => {
                const isExpanded = selectedMember === index;
                return (
                  <div key={member.id} className="border border-white/10 bg-white/5">
                    <button
                      onClick={() => setSelectedMember(isExpanded ? null : index)}
                      className="w-full flex items-center gap-4 p-4 text-left"
                    >
                      {(member.imageData || member.image) && (
                        <div className="flex-shrink-0 w-16 h-16 overflow-hidden">
                          <img
                            src={member.imageData || member.image}
                            alt={member.name}
                            className="w-full h-full object-cover grayscale brightness-75"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-light text-white uppercase tracking-wide truncate">
                          {member.name}
                        </h4>
                        <p className="text-xs text-white/50 uppercase tracking-wider mt-1">
                          {language === "vi" ? member.positionVi : member.positionEn}
                        </p>
                      </div>
                      <span className="text-white/50 text-2xl font-light flex-shrink-0">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </button>

                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="px-4 pb-6 space-y-4">
                        {(member.imageData || member.image) && (
                          <div className="w-full aspect-[3/4] overflow-hidden">
                            <img
                              src={member.imageData || member.image}
                              alt={member.name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                        )}
                        {member.bioEn && member.bioVi && (
                          <p className="text-base text-white/70 font-light leading-relaxed">
                            {language === "vi" ? member.bioVi : member.bioEn}
                          </p>
                        )}
                        {member.achievementsEn && member.achievementsVi && (
                          <div className="space-y-1">
                            <h5 className="text-xs font-light text-white/60 uppercase tracking-wider">
                              {language === "vi" ? "Thông điệp" : "Message"}
                            </h5>
                            <p className="text-base text-white/70 font-light leading-relaxed">
                              {language === "vi" ? member.achievementsVi : member.achievementsEn}
                            </p>
                          </div>
                        )}
                        {member.philosophyEn && member.philosophyVi && (
                          <div className="space-y-1">
                            <h5 className="text-xs font-light text-white/60 uppercase tracking-wider">
                              {language === "vi" ? "Triết lý" : "Philosophy"}
                            </h5>
                            <p className="text-base text-white/70 font-light leading-relaxed">
                              {language === "vi" ? member.philosophyVi : member.philosophyEn}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop layout: horizontal accordion */}
            <div className="hidden md:flex gap-0 items-stretch justify-center">
              {teamMembers.map((member, index) => {
                const isExpanded = selectedMember === index;
                const nameChars = member.name.toUpperCase().split('');
                
                return (
                  <div key={member.id} className="flex items-stretch self-stretch">
                    <button
                      onClick={() => setSelectedMember(index)}
                      className={`relative flex-shrink-0 h-full border-r border-white/10 transition-all duration-500 overflow-hidden group ${
                        isExpanded ? 'w-0 opacity-0' : 'w-24 opacity-100'
                      }`}
                      data-testid={`button-team-member-${member.id}`}
                    >
                      {(member.imageData || member.image) && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                          style={{
                            backgroundImage: `url(${member.imageData || member.image})`,
                            filter: 'grayscale(100%) brightness(0.3)',
                          }}
                        />
                      )}
                      <div className={`absolute inset-0 transition-all duration-300 ${
                        isExpanded ? 'bg-black/30' : 'bg-black/60'
                      } group-hover:bg-black/40`} />
                      <div className="relative h-full flex flex-col items-center pt-8">
                        <div className={`text-4xl font-light mb-8 transition-all duration-300 ${
                          isExpanded ? 'text-white' : 'text-white/60'
                        }`}>
                          +
                        </div>
                        <div className="flex flex-col items-center">
                          {nameChars.map((char, charIndex) => (
                            <span 
                              key={charIndex} 
                              className={`text-2xl font-light transition-all duration-300 ${
                                isExpanded ? 'text-white' : 'text-white/70'
                              }`}
                            >
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>

                    <div 
                      className={`h-full overflow-hidden transition-all duration-1000 ease-in-out border-r border-white/10 ${
                        isExpanded ? 'max-w-[800px] opacity-100' : 'max-w-0 opacity-0'
                      }`}
                    >
                      <div className="w-[800px] max-w-[calc(100vw-120px)] flex items-stretch h-full">
                        <div className="flex gap-5 items-stretch w-full h-full">
                          {(member.imageData || member.image) && (
                            <div className="flex-shrink-0 w-72 self-stretch flex flex-col overflow-hidden bg-white/10">
                              <img 
                                src={member.imageData || member.image} 
                                alt={member.name}
                                className="w-full flex-1 object-cover min-h-0 block"
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-5 py-5 pr-6">
                            <div>
                              <h4 className="text-2xl font-light text-white mb-2 uppercase tracking-wide">
                                {member.name}
                              </h4>
                              <p className="text-sm text-white/60 uppercase tracking-wider">
                                {language === "vi" ? member.positionVi : member.positionEn}
                              </p>
                            </div>
                            {member.bioEn && member.bioVi && (
                              <p className="text-xl text-white/70 font-light leading-relaxed text-justify">
                                {language === "vi" ? member.bioVi : member.bioEn}
                              </p>
                            )}
                            {member.achievementsEn && member.achievementsVi && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-light text-white/80 uppercase tracking-wider">
                                  {language === "vi" ? "Thông điệp" : "Message"}
                                </h5>
                                <p className="text-xl text-white/70 font-light leading-relaxed text-justify">
                                  {language === "vi" ? member.achievementsVi : member.achievementsEn}
                                </p>
                              </div>
                            )}
                            {member.philosophyEn && member.philosophyVi && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-light text-white/80 uppercase tracking-wider">
                                  {language === "vi" ? "Triết lý" : "Philosophy"}
                                </h5>
                                <p className="text-xl text-white/70 font-light leading-relaxed text-justify">
                                  {language === "vi" ? member.philosophyVi : member.philosophyEn}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {/* Awards Section */}
      {aboutContent && (awards.length > 0) && (
        <section className="py-20 bg-black lg:-ml-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h3 className="typewriter-heading md:text-4xl font-light text-white uppercase tracking-wide text-[24px]">
                {language === "vi" ? aboutContent.awardsSectionTitleVi : aboutContent.awardsSectionTitleEn}
              </h3>
            </div>
            <div className="relative">
              {/* Left arrow */}
              <button
                onClick={() => awardsScrollRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center transition-all duration-300 -translate-x-4 ${
                  awardsCanScrollLeft ? 'text-white/60 hover:text-white' : 'text-white/15 cursor-default'
                }`}
                aria-label="Previous"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* Right arrow */}
              <button
                onClick={() => awardsScrollRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center transition-all duration-300 translate-x-4 ${
                  awardsCanScrollRight ? 'text-white/60 hover:text-white' : 'text-white/15 cursor-default'
                }`}
                aria-label="Next"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            <div
              ref={awardsScrollRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                setAwardsCanScrollLeft(el.scrollLeft > 8);
                setAwardsCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
              }}
              className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              {awards.map((award) => (
                <div
                  key={award.id}
                  className="flex-shrink-0 w-[280px] md:w-[320px] flex flex-col transition-colors duration-300 group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {(award.imageData || award.image) && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={award.imageData || award.image}
                        alt={language === "vi" ? award.titleVi : award.titleEn}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col gap-2 flex-1">
                    <div className="text-xs text-white/40 uppercase tracking-widest">
                      {award.year}
                    </div>
                    <h4 className="text-white font-light text-lg uppercase tracking-wide leading-snug">
                      {language === "vi" ? award.titleVi : award.titleEn}
                    </h4>
                    {(award.organizationEn || award.organizationVi) && (
                      <p className="text-white/50 text-sm font-light">
                        {language === "vi" ? award.organizationVi : award.organizationEn}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
