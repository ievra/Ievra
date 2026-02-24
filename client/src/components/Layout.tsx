import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ArrowRight } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

const getNavigation = (t: (key: string) => string) => {
  return [
    { name: t('nav.about'), href: `/about`, key: 'about' },
    { name: t('nav.projects'), href: `/portfolio`, key: 'portfolio' },
    { name: t('nav.news'), href: `/blog`, key: 'news' },
    { name: t('nav.lookup'), href: `/lookup`, key: 'lookup' },
  ];
};

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isInHero, setIsInHero] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [noTransition, setNoTransition] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [introProgress, setIntroProgress] = useState(location === '/' ? 0 : 1);
  const [headerRevealed, setHeaderRevealed] = useState(location !== '/');
  const [logoSwapped, setLogoSwapped] = useState(location !== '/');
  const [logoFading, setLogoFading] = useState(false);
  const showIntroRef = useRef(location === '/');
  const isHomepageRef = useRef(location === '/');
  const introAnimatingRef = useRef(false);
  const introLogoRef = useRef<HTMLImageElement>(null);
  const headerLogoRef = useRef<HTMLImageElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const navigation = getNavigation(t);

  const { data: settings } = useQuery<{ logoData?: string; logoUrl?: string }>({
    queryKey: ['/api/settings'],
  });

  const logoSrc = settings?.logoData || settings?.logoUrl || '/api/assets/logo.white.png';

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const isHomepage = location === '/';
    isHomepageRef.current = isHomepage;
    if (isHomepage) {
      showIntroRef.current = true;
      setIntroProgress(0);
      setHeaderRevealed(false);
      setLogoSwapped(false);
      setIsScrolled(false);
      setNoTransition(false);
      hasScrolledRef.current = true;
    } else {
      showIntroRef.current = false;
      setIntroProgress(1);
      setHeaderRevealed(true);
      setLogoSwapped(true);
      setNoTransition(true);
      setIsScrolled(true);
      hasScrolledRef.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setNoTransition(false);
        });
      });
    }
  }, [location]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!showIntroRef.current) {
      document.body.style.overflow = '';
    }
    return () => {
      if (!showIntroRef.current) {
        document.body.style.overflow = '';
      }
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 5000);
    };

    let lastScrollY = window.scrollY;
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      if (!hasScrolledRef.current && scrollY > 10) {
        hasScrolledRef.current = true;
      }
      if (!hasScrolledRef.current) {
        lastScrollY = scrollY > 0 ? scrollY : 0;
        return;
      }
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction === "down" && scrollY > 100) {
        setIsScrolled(true);
      } else if (direction === "up") {
        setIsScrolled(false);
      }
      setIsInHero(scrollY < window.innerHeight * 0.8);
      lastScrollY = scrollY > 0 ? scrollY : 0;
      setLangDropdownOpen(false);
      resetIdleTimer();
    };

    const handleWheel = () => {
      const isPageScrollable = document.documentElement.scrollHeight > window.innerHeight + 10;
      if (!isPageScrollable) {
        setIsScrolled(false);
        setIsIdle(false);
        resetIdleTimer();
      }
    };

    const handleTouchMove = () => {
      const isPageScrollable = document.documentElement.scrollHeight > window.innerHeight + 10;
      if (!isPageScrollable) {
        setIsScrolled(false);
        setIsIdle(false);
        resetIdleTimer();
      }
    };

    window.addEventListener("scroll", updateScrollDirection);
    window.addEventListener("wheel", handleWheel);
    window.addEventListener("touchmove", handleTouchMove);

    resetIdleTimer();

    return () => {
      window.removeEventListener("scroll", updateScrollDirection);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (location !== '/') return;

    if (showIntroRef.current) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    }

    let touchStartY = 0;

    const triggerIntroAnimation = () => {
      if (introAnimatingRef.current) return;
      introAnimatingRef.current = true;

      const isMobile = window.innerWidth < 768;
      const duration = isMobile ? 1400 : 2200;
      const logoStartY = window.innerHeight / 2;
      const startScale = isMobile ? 2.2 : 2.8;

      setHeaderRevealed(true);

      let logoFinalScreenY = isMobile ? 32 : 52;
      let headerHeight = isMobile ? 56 : 92;

      if (headerRef.current) {
        headerRef.current.style.transition = 'none';
        headerRef.current.style.transform = 'translateY(0)';
        headerRef.current.offsetHeight;

        headerHeight = headerRef.current.getBoundingClientRect().height;

        if (headerLogoRef.current) {
          const logoRect = headerLogoRef.current.getBoundingClientRect();
          logoFinalScreenY = logoRect.top + logoRect.height / 2;
        }

        headerRef.current.style.transform = `translateY(-${headerHeight}px)`;
        headerRef.current.offsetHeight;
      }

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const rawProgress = Math.min(1, elapsed / duration);
        const eased = rawProgress < 0.5
          ? 4 * rawProgress * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

        if (headerRef.current) {
          const headerY = -headerHeight * (1 - eased);
          headerRef.current.style.transform = `translateY(${headerY}px)`;
        }

        const logoTop = logoStartY + (logoFinalScreenY - logoStartY) * eased;
        const scale = startScale - (startScale - 1) * eased;

        if (introLogoRef.current) {
          introLogoRef.current.style.transform = `translate(-50%, -50%) translateY(${logoTop}px) scale(${scale})`;
        }
        setIntroProgress(eased);

        if (rawProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          introAnimatingRef.current = false;
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.top = '';
          setIsScrolled(false);
          setIsIdle(false);
          setIntroProgress(1);
          if (headerRef.current) {
            headerRef.current.style.transition = '';
            headerRef.current.style.transform = '';
          }
          if (headerLogoRef.current) {
            headerLogoRef.current.style.opacity = '1';
          }
          if (introLogoRef.current) {
            introLogoRef.current.style.opacity = '0';
          }
          setTimeout(() => {
            showIntroRef.current = false;
            setLogoSwapped(true);
          }, 50);
        }
      };

      requestAnimationFrame(animate);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!showIntroRef.current) return;
      e.preventDefault();
      if (introAnimatingRef.current) return;
      if (e.deltaY > 0) triggerIntroAnimation();
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!showIntroRef.current) return;
      if (introAnimatingRef.current) {
        e.preventDefault();
        return;
      }
      const delta = touchStartY - e.touches[0].clientY;
      if (delta > 30) {
        e.preventDefault();
        triggerIntroAnimation();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [location]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  const introActive = location === '/' && introProgress < 1;
  const showIntroLogo = location === '/' && !logoSwapped;
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
  const introLogoStartY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
  const introLogoStartScale = isMobileDevice ? 2.2 : 2.8;

  return (
    <div className="min-h-screen relative">
      <header ref={headerRef} className={`fixed top-0 left-0 right-0 z-50 ${
        noTransition ? '' : `transition-transform ${logoSwapped ? 'duration-700 ease-in-out' : ''}`
      } ${
        location === '/' && !headerRevealed ? '-translate-y-full' : ((isScrolled || isIdle) && logoSwapped ? '-translate-y-full' : 'translate-y-0')
      }`}>
        <div className={`flex items-center justify-between py-2 px-6 md:py-3 md:px-10 lg:px-16 transition-colors duration-300 ${isInHero ? '' : 'bg-black/20'}`}>
          <nav className="hidden lg:flex items-center gap-8 transition-opacity duration-500" style={{ opacity: location === '/' && !logoSwapped ? (introProgress > 0 ? 1 : 0) : 1 }}>
            {navigation.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-[13px] font-light tracking-widest uppercase transition-colors nav-link-underline ${
                  isActive(item.href)
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
                data-testid={`nav-${item.key}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              ref={headerLogoRef}
              src={logoSrc}
              alt="IEVRA Design & Build"
              className="h-12 md:h-20 w-auto hover:opacity-80 transition-opacity duration-400"
              style={{ opacity: location === '/' && !logoSwapped ? 0 : undefined }}
            />
          </Link>

          <div className="hidden lg:flex items-center gap-4 transition-opacity duration-500" style={{ opacity: location === '/' && !logoSwapped ? (introProgress > 0 ? 1 : 0) : 1 }}>
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="text-[13px] font-light tracking-wider uppercase text-white/70 hover:text-white transition-colors flex items-center gap-1"
                data-testid="lang-toggle"
              >
                {language === 'vi' ? 'TIẾNG VIỆT' : 'ENGLISH'}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`ml-1 transition-transform duration-300 ${langDropdownOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div
                className={`absolute top-full right-0 mt-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden transition-all duration-700 ease-in-out origin-top ${
                  langDropdownOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-0 pointer-events-none'
                }`}
              >
                <button
                  onClick={() => { handleLanguageChange('en'); setLangDropdownOpen(false); }}
                  className={`block w-full text-left px-5 py-2.5 text-[13px] font-light tracking-wider uppercase transition-colors whitespace-nowrap ${
                    language === 'en' ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid="lang-en"
                >
                  ENGLISH
                </button>
                <button
                  onClick={() => { handleLanguageChange('vi'); setLangDropdownOpen(false); }}
                  className={`block w-full text-left px-5 py-2.5 text-[13px] font-light tracking-wider uppercase transition-colors whitespace-nowrap ${
                    language === 'vi' ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid="lang-vi"
                >
                  TIẾNG VIỆT
                </button>
              </div>
              {langDropdownOpen && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setLangDropdownOpen(false)} />
              )}
            </div>

            <Link
              href="/contact"
              className="text-[13px] font-light tracking-wider text-white border border-white/30 rounded-full px-6 py-2.5 hover:bg-white hover:text-black transition-all duration-300 flex items-center gap-2"
              data-testid="nav-contact-btn"
            >
              {language === 'vi' ? 'LIÊN HỆ' : 'CONTACT'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            className="lg:hidden text-white p-2 z-50 transition-opacity duration-500"
            style={{ opacity: location === '/' && !logoSwapped ? (introProgress > 0 ? 1 : 0) : 1 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            data-testid="button-main-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {showIntroLogo && (
        <img
          ref={introLogoRef}
          src={logoSrc}
          alt=""
          className="fixed pointer-events-none z-[55] h-12 md:h-20 w-auto"
          style={{
            left: '50%',
            top: 0,
            transform: `translate(-50%, -50%) translateY(${introLogoStartY}px) scale(${introLogoStartScale})`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            opacity: 1,
          }}
        />
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-end py-4 px-6">
            <button
              className="text-white p-2"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8">
            <nav className="space-y-8">
              {navigation.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-3xl font-light tracking-wider transition-colors ${
                    isActive(item.href) ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                  data-testid={`menu-nav-${item.key}`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-3xl font-light tracking-wider transition-colors ${
                  isActive('/contact') ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
                data-testid="menu-nav-contact"
              >
                {t('nav.contacts')}
              </Link>
            </nav>

            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex gap-4">
                <button
                  onClick={() => { handleLanguageChange('en'); }}
                  className={`text-sm font-light tracking-wider uppercase transition-colors ${language === 'en' ? 'text-white' : 'text-white/40'}`}
                  data-testid="lang-en"
                >
                  ENGLISH
                </button>
                <span className="text-white/20">|</span>
                <button
                  onClick={() => { handleLanguageChange('vi'); }}
                  className={`text-sm font-light tracking-wider uppercase transition-colors ${language === 'vi' ? 'text-white' : 'text-white/40'}`}
                  data-testid="lang-vi"
                >
                  TIẾNG VIỆT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
