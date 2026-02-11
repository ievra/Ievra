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
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const navigation = getNavigation(t);

  const { data: settings } = useQuery<{ logoData?: string; logoUrl?: string }>({
    queryKey: ['/api/settings'],
  });

  const logoSrc = settings?.logoData || settings?.logoUrl || '/api/assets/logo.white.png';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
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
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction === "down" && scrollY > 100) {
        setIsScrolled(true);
      } else if (direction === "up" || scrollY < 50) {
        setIsScrolled(false);
      }
      setIsInHero(scrollY < window.innerHeight * 0.8);
      lastScrollY = scrollY > 0 ? scrollY : 0;
      setLangDropdownOpen(false);
      resetIdleTimer();
    };

    const handleActivity = () => {
      setIsScrolled(false);
      resetIdleTimer();
    };

    window.addEventListener("scroll", updateScrollDirection);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    resetIdleTimer();

    return () => {
      window.removeEventListener("scroll", updateScrollDirection);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen relative">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-700 ease-in-out ${
        isScrolled || isIdle ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className={`flex items-center justify-between py-2 px-6 md:py-3 md:px-10 lg:px-16 transition-colors duration-300 ${isInHero ? '' : 'bg-black/20'}`}>
          <nav className="hidden lg:flex items-center gap-8">
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
              src={logoSrc}
              alt="IEVRA Design & Build"
              className="h-10 md:h-16 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-4">
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
            className="lg:hidden text-white p-2 z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            data-testid="button-main-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black flex flex-col">
          <div className="flex items-center justify-between py-4 px-6">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img
                src={logoSrc}
                alt="IEVRA Design & Build"
                className="h-6 w-auto"
              />
            </Link>
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
