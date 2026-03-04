import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import type { Project, AboutPageContent, AboutShowcaseService, AboutProcessStep, AboutCoreValue, AboutTeamMember } from '@shared/schema';
import { useState, useEffect, useRef } from 'react';
import 'swiper/css';
import 'swiper/css/effect-fade';

export default function About() {
  const { language } = useLanguage();
  const [selectedMember, setSelectedMember] = useState<number | null>(0);

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

  const showcaseSectionRef = useRef<HTMLDivElement>(null);
  const [showcaseAnimStarted, setShowcaseAnimStarted] = useState(false);
  const [showcaseAnimDone, setShowcaseAnimDone] = useState(false);
  const [typedTexts, setTypedTexts] = useState<{ title: string; desc: string }[]>([]);

  const snakeRef = useRef<HTMLDivElement>(null);
  const [snakeW, setSnakeW] = useState(0);
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
        setShowcaseAnimDone(false);
        setTypedTexts([]);
        observer.observe(showcaseSectionRef.current!);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showcaseSectionRef.current, showcaseServices.length]);

  useEffect(() => {
    if (!showcaseAnimStarted || showcaseServices.length === 0) return;
    const CHAR_SPEED = 28;
    const timers: ReturnType<typeof setTimeout | typeof setInterval>[] = [];
    setTypedTexts(showcaseServices.map(() => ({ title: '', desc: '' })));

    let startAt = 0;
    showcaseServices.forEach((service, idx) => {
      const title = language === 'vi' ? service.titleVi : service.titleEn;
      const desc = language === 'vi' ? service.descriptionVi : service.descriptionEn;
      const cardDelay = startAt;
      startAt += (title.length + desc.length) * CHAR_SPEED;

      const t = setTimeout(() => {
        let ti = 0;
        const titleTimer = setInterval(() => {
          ti++;
          setTypedTexts(prev => {
            const next = [...prev];
            if (next[idx] !== undefined) next[idx] = { ...next[idx], title: title.slice(0, ti) };
            return next;
          });
          if (ti >= title.length) {
            clearInterval(titleTimer);
            let di = 0;
            const descTimer = setInterval(() => {
              di++;
              setTypedTexts(prev => {
                const next = [...prev];
                if (next[idx] !== undefined) next[idx] = { ...next[idx], desc: desc.slice(0, di) };
                return next;
              });
              if (di >= desc.length) {
                clearInterval(descTimer);
                if (idx === showcaseServices.length - 1) {
                  setShowcaseAnimDone(true);
                }
              }
              timers.push(descTimer);
            }, CHAR_SPEED);
            timers.push(titleTimer);
          }
        }, CHAR_SPEED);
        timers.push(titleTimer);
      }, cardDelay);
      timers.push(t);
    });

    return () => timers.forEach(id => { clearTimeout(id as any); clearInterval(id as any); });
  }, [showcaseAnimStarted, showcaseServices, language]);

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
    <main className="ml-16 min-h-[120vh]">
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
            <div className="absolute inset-0 bg-black" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Content */}
          {aboutContent && (
            <div className="relative h-full flex items-center z-10">
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h1 className="md:text-6xl lg:text-7xl font-light text-white uppercase tracking-wide text-[48px]">
                      {language === "vi" ? aboutContent.heroTitleVi : aboutContent.heroTitleEn}
                    </h1>
                  </div>

                  <div className="lg:text-right">
                    <h2 className="md:text-4xl lg:text-5xl font-light text-white uppercase tracking-wider text-[36px]">
                      {language === "vi" ? aboutContent.heroSubtitleVi : aboutContent.heroSubtitleEn}
                    </h2>
                  </div>
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
              <div className="space-y-8">
                <h3 className="md:text-4xl font-light text-white uppercase tracking-wide text-[24px]">
                  {language === "vi" ? aboutContent.historyTitleVi : aboutContent.historyTitleEn}
                </h3>
                <p className="text-white/70 font-light text-lg leading-relaxed whitespace-pre-line text-justify">
                  {language === "vi" ? aboutContent.historyContentVi : aboutContent.historyContentEn}
                </p>
              </div>
              {aboutContent.historyImage && (
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
              )}
            </div>
          </div>
        </section>
      )}
      {/* Mission & Vision Section - 2 columns: Mission (small img) | Vision (large img) */}
      {(aboutContent?.missionContentEn || aboutContent?.visionContentEn) && (
        <section className="py-20 bg-black lg:-ml-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-20 items-start">
              {/* LEFT: Small image + Mission */}
              {aboutContent?.missionContentEn && aboutContent?.missionContentVi && (
                <div className="space-y-8">
                  {(aboutContent.missionImageData || aboutContent.missionImage) && (
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
                  )}
                  <div className="space-y-6">
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
                  )}
                  <div className="space-y-6">
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
      {/* Architecture Showcase + Stats Section */}
      {((aboutContent?.showcaseBannerImageData || aboutContent?.showcaseBannerImage) || showcaseServices.length > 0 || aboutContent) && (
        <section className="relative bg-black overflow-hidden lg:-ml-16 h-[90vh] lg:h-screen min-h-[700px]">
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

          <div className="relative h-full flex flex-col justify-end">
            {/* Showcase Services */}
            {showcaseServices.length > 0 && (
              <div ref={showcaseSectionRef} className="relative w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                {showcaseServices.map((service, index) => {
                  const stepHeights = ['h-[560px]', 'h-[400px]', 'h-[260px]', 'h-[160px]'];
                  const stepH = stepHeights[index % 4];
                  const fullTitle = language === "vi" ? service.titleVi : service.titleEn;
                  const fullDesc = language === "vi" ? service.descriptionVi : service.descriptionEn;
                  const typed = typedTexts[index];
                  const displayTitle = showcaseAnimDone ? fullTitle : (typed ? typed.title : '');
                  const displayDesc = showcaseAnimDone ? fullDesc : (typed ? typed.desc : '');
                  const isTitleTyping = typed && typed.title.length > 0 && typed.title.length < fullTitle.length;
                  const isDescTyping = typed && typed.title.length >= fullTitle.length && typed.desc.length < fullDesc.length;
                  return (
                    <div key={service.id} className="px-6 py-8 md:px-8 md:py-12">
                      <div className={`${stepH} flex flex-col justify-start`}>
                        <div className="relative space-y-3">
                          {index > 0 && (
                            <div
                              className="absolute -left-6 md:-left-8 top-0 bottom-0"
                              style={{
                                width: '2px',
                                background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 10%, rgba(255,255,255,0.3) 90%, transparent 100%)'
                              }}
                            />
                          )}
                          <h4 className="text-xl font-light text-white uppercase tracking-wide">
                            {displayTitle}
                            <span className={`inline-block w-0.5 h-5 bg-white ml-0.5 align-middle animate-pulse ${isTitleTyping ? '' : 'invisible'}`} />
                          </h4>
                          <p className="text-white/70 font-light text-lg leading-relaxed text-justify">
                            {displayDesc}
                            <span className={`inline-block w-0.5 h-4 bg-white/70 ml-0.5 align-middle animate-pulse ${isDescTyping ? '' : 'invisible'}`} />
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats Row — inside banner at the bottom */}
            {aboutContent && (
              <div className="relative w-full">
                <div className="grid grid-cols-2 md:grid-cols-4">
                  <div className="text-center py-6 px-4">
                    <div className="text-2xl md:text-3xl font-light text-white mb-1" data-testid="stats-projects">
                      {aboutContent.statsProjectsValue}
                    </div>
                    <div className="text-xs text-white/50 uppercase tracking-wider">
                      {language === "vi" ? aboutContent.statsProjectsLabelVi : aboutContent.statsProjectsLabelEn}
                    </div>
                  </div>
                  <div className="text-center py-6 px-4">
                    <div className="text-2xl md:text-3xl font-light text-white mb-1" data-testid="stats-awards">
                      {aboutContent.statsAwardsValue}
                    </div>
                    <div className="text-xs text-white/50 uppercase tracking-wider">
                      {language === "vi" ? aboutContent.statsAwardsLabelVi : aboutContent.statsAwardsLabelEn}
                    </div>
                  </div>
                  <div className="text-center py-6 px-4">
                    <div className="text-2xl md:text-3xl font-light text-white mb-1" data-testid="stats-clients">
                      {aboutContent.statsClientsValue}
                    </div>
                    <div className="text-xs text-white/50 uppercase tracking-wider">
                      {language === "vi" ? aboutContent.statsClientsLabelVi : aboutContent.statsClientsLabelEn}
                    </div>
                  </div>
                  <div className="text-center py-6 px-4">
                    <div className="text-2xl md:text-3xl font-light text-white mb-1" data-testid="stats-countries">
                      {aboutContent.statsCountriesValue}
                    </div>
                    <div className="text-xs text-white/50 uppercase tracking-wider">
                      {language === "vi" ? aboutContent.statsCountriesLabelVi : aboutContent.statsCountriesLabelEn}
                    </div>
                  </div>
                </div>
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
              <h3 className="md:text-4xl font-light text-white uppercase tracking-wide text-[24px]">
                {language === "vi" ? aboutContent.coreValuesTitleVi : aboutContent.coreValuesTitleEn}
              </h3>
            </div>

            <div className="relative">
              {/* Vertical center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 -translate-x-1/2 hidden lg:block" />

              {coreValues.map((value, index) => {
                const isLeft = index % 2 === 0;
                const title = language === "vi" ? value.titleVi : value.titleEn;
                const desc = language === "vi" ? value.descriptionVi : value.descriptionEn;
                return (
                  <div key={value.id} className="relative lg:grid lg:grid-cols-2 mb-14 lg:mb-20">
                    {/* Desktop LEFT column */}
                    <div className="hidden lg:block lg:pr-20 lg:text-right">
                      {isLeft && (
                        <div className="space-y-3 max-w-sm ml-auto">
                          <h4 className="text-2xl text-white uppercase tracking-wide leading-tight font-light">
                            {title}
                          </h4>
                          <p className="text-white/60 font-light text-[18px]">
                            {desc}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Center dot + connector */}
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center" style={{ top: '6px' }}>
                      <div className="w-3 h-3 rounded-full bg-white border-2 border-white flex-shrink-0" />
                      <div className={`h-px w-8 bg-white/40 absolute ${isLeft ? 'right-3' : 'left-3'}`} />
                    </div>
                    {/* Desktop RIGHT column */}
                    <div className="hidden lg:block lg:pl-20">
                      {!isLeft && (
                        <div className="space-y-3 max-w-sm">
                          <h4 className="text-2xl text-white uppercase tracking-wide leading-tight font-light">
                            {title}
                          </h4>
                          <p className="text-white/60 font-light text-[18px]">
                            {desc}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Mobile: stacked with left border */}
                    <div className="lg:hidden space-y-3 pl-6 border-l border-white/20">
                      <h4 className="text-xl font-semibold text-white uppercase tracking-wide">
                        {title}
                      </h4>
                      <p className="text-white/60 font-light text-base leading-relaxed">
                        {desc}
                      </p>
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
              <h3 className="text-3xl md:text-4xl font-light text-white uppercase tracking-wide mb-4">
                {language === "vi" ? aboutContent.teamTitleVi : aboutContent.teamTitleEn}
              </h3>
            </div>

            <div className="flex gap-0 items-stretch justify-center">
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
                      {/* Background Image */}
                      {(member.imageData || member.image) && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                          style={{
                            backgroundImage: `url(${member.imageData || member.image})`,
                            filter: 'grayscale(100%) brightness(0.3)',
                          }}
                        />
                      )}
                      
                      {/* Overlay */}
                      <div className={`absolute inset-0 transition-all duration-300 ${
                        isExpanded ? 'bg-black/30' : 'bg-black/60'
                      } group-hover:bg-black/40`} />
                      
                      {/* Content */}
                      <div className="relative h-full flex flex-col items-center pt-8">
                        {/* Plus Icon */}
                        <div className={`text-4xl font-light mb-8 transition-all duration-300 ${
                          isExpanded ? 'text-white' : 'text-white/60'
                        }`}>
                          +
                        </div>
                        
                        {/* Name Vertical */}
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
                      <div className="w-[800px] max-w-[calc(100vw-120px)] pl-6 md:pl-12 pr-4 md:pr-8 py-8">
                        <div className="flex gap-4 md:gap-8 items-start">
                          {(member.imageData || member.image) && (
                            <div className="flex-shrink-0 w-40 md:w-64">
                              <div className="aspect-[9/16] overflow-hidden bg-white/10">
                                <img 
                                  src={member.imageData || member.image} 
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex-1 space-y-6">
                            <div>
                              <h4 className="text-2xl font-light text-white mb-2 uppercase tracking-wide">
                                {member.name}
                              </h4>
                              <p className="text-sm text-white/60 uppercase tracking-wider">
                                {language === "vi" ? member.positionVi : member.positionEn}
                              </p>
                            </div>
                            
                            {member.bioEn && member.bioVi && (
                              <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed text-justify">
                                {language === "vi" ? member.bioVi : member.bioEn}
                              </p>
                            )}

                            {member.achievementsEn && member.achievementsVi && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-light text-white/80 uppercase tracking-wider">
                                  {language === "vi" ? "Thành tựu" : "Achievements"}
                                </h5>
                                <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed text-justify">
                                  {language === "vi" ? member.achievementsVi : member.achievementsEn}
                                </p>
                              </div>
                            )}

                            {member.philosophyEn && member.philosophyVi && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-light text-white/80 uppercase tracking-wider">
                                  {language === "vi" ? "Triết lý" : "Philosophy"}
                                </h5>
                                <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed text-justify">
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
      {/* Process Section */}
      {processSteps.length > 0 && aboutContent && (
        <section className="py-20 bg-black lg:-ml-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h3 className="md:text-4xl font-light text-white uppercase tracking-wide text-[24px]">
                {language === "vi" ? aboutContent.processTitleVi : aboutContent.processTitleEn}
              </h3>
            </div>

            {/* Desktop snake layout — SVG single path */}
            <div className="hidden md:block" ref={snakeRef}>
              {(() => {
                const PER_ROW = 3;
                const R = 80;           // U-turn radius (px) — ROW_H must = 2*R for perfect semicircle
                const ROW_H = 160;      // = 2*R → perfect semicircle U-turns
                const LINE_Y = 28;      // y of line within each row block
                const PAD_L = 150;      // left endpoint distance from left edge (U-turn peak at PAD_L - R)
                const PAD_R = 170;      // right endpoint distance from right edge (U-turn peak at PAD_R - R)

                const rows: typeof processSteps[] = [];
                for (let i = 0; i < processSteps.length; i += PER_ROW) {
                  rows.push(processSteps.slice(i, i + PER_ROW));
                }
                const numRows = rows.length;
                const svgH = LINE_Y + (numRows - 1) * ROW_H + LINE_Y + 80; // extra bottom for text

                // Build SVG path — single connected snake
                const buildPath = (W: number) => {
                  if (W <= 0) return '';
                  const xL = PAD_L;       // left horizontal endpoint (150px from left edge)
                  const xR = W - PAD_R;   // right horizontal endpoint (170px from right edge)
                  let d = `M ${xL},${LINE_Y}`;
                  for (let r = 0; r < numRows; r++) {
                    const y = LINE_Y + r * ROW_H;
                    if (r === 0) {
                      d += ` L ${xR},${y}`;
                    } else if (r % 2 === 1) {
                      // came from right U-turn, now going left
                      d += ` L ${xL},${y}`;
                    } else {
                      // came from left U-turn, now going right
                      d += ` L ${xR},${y}`;
                    }
                    if (r < numRows - 1) {
                      const nextY = y + ROW_H;
                      if (r % 2 === 0) {
                        // right U-turn: from (xR, y) clockwise to (xR, nextY)
                        d += ` A ${R},${R} 0 0,1 ${xR},${nextY}`;
                      } else {
                        // left U-turn: from (xL, y) counter-clockwise to (xL, nextY)
                        d += ` A ${R},${R} 0 0,0 ${xL},${nextY}`;
                      }
                    }
                  }
                  return d;
                };

                return (
                  <div className="relative" style={{ height: `${svgH}px` }}>
                    {/* SVG snake path — always render, width measured or fallback */}
                    <svg
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{ width: '100%', height: svgH, overflow: 'visible' }}
                      viewBox={`0 0 ${snakeW || 900} ${svgH}`}
                      preserveAspectRatio="none"
                    >
                      <path
                        d={buildPath(snakeW || 900)}
                        fill="none"
                        stroke="rgba(255,255,255,0.28)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    {/* Items — each absolutely positioned to match SVG path coordinates */}
                    {rows.flatMap((row, rowIdx) => {
                      const isReversed = rowIdx % 2 === 1;
                      const displayRow = isReversed ? [...row].reverse() : row;
                      const lineY = LINE_Y + rowIdx * ROW_H;
                      const W = snakeW || 900;
                      const xL = PAD_L;
                      const xR = W - PAD_R;
                      const isSingleItem = row.length === 1;

                      return displayRow.map((step, ci) => {
                        const title = language === "vi" ? step.titleVi : step.titleEn;
                        const desc = language === "vi" ? step.descriptionVi : step.descriptionEn;

                        // x position: evenly spaced from xL to xR across PER_ROW columns
                        let xPos: number;
                        if (isSingleItem) {
                          // Last single item: end of path = xR (L→R row ends at right)
                          xPos = isReversed ? xL : xR;
                        } else {
                          const totalCols = PER_ROW;
                          xPos = xL + ci * (xR - xL) / (totalCols - 1);
                        }

                        return (
                          <div
                            key={step.id}
                            className="absolute flex flex-col items-center"
                            style={{ left: `${xPos}px`, transform: 'translateX(-50%)', width: '155px', top: 0 }}
                          >
                            {/* Diamond on the line */}
                            <div
                              className="bg-white/85 flex-shrink-0"
                              style={{
                                width: '10px',
                                height: '10px',
                                transform: 'rotate(45deg)',
                                marginTop: `${lineY - 5}px`,
                              }}
                            />
                            <div className="mt-4 text-center px-1">
                              <div className="text-white/35 text-[10px] font-light tracking-widest mb-1">
                                {step.stepNumber}
                              </div>
                              <h4 className="text-sm font-light text-white uppercase tracking-wide leading-tight">
                                {title}
                              </h4>
                              {desc && (
                                <p className="text-white/50 text-xs font-light leading-relaxed mt-1">
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

            {/* Mobile vertical list */}
            <div className="md:hidden space-y-8">
              {processSteps.map((step) => {
                const title = language === "vi" ? step.titleVi : step.titleEn;
                const desc = language === "vi" ? step.descriptionVi : step.descriptionEn;
                return (
                  <div key={step.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full border border-white/50 text-white text-xs flex items-center justify-center font-light flex-shrink-0 mt-0.5">
                      {step.stepNumber}
                    </div>
                    <div>
                      <h4 className="text-sm font-light text-white uppercase tracking-wide leading-tight">{title}</h4>
                      {desc && <p className="text-white/50 text-xs font-light leading-relaxed mt-1">{desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
