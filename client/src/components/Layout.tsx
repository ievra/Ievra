import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ArrowRight } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

const getNavigation = (t: (key: string) => string) => {
  return [
    { name: t('nav.projects'), href: `/portfolio`, key: 'portfolio' },
    { name: t('nav.about'), href: `/about`, key: 'about' },
    { name: t('nav.news'), href: `/blog`, key: 'news' },
  ];
};

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
    let lastScrollY = window.scrollY;
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction === "down" && scrollY > 100) {
        setIsScrolled(true);
      } else if (direction === "up" || scrollY < 50) {
        setIsScrolled(false);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };
    window.addEventListener("scroll", updateScrollDirection);
    return () => window.removeEventListener("scroll", updateScrollDirection);
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
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isScrolled ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex items-center justify-between py-4 px-6 md:py-5 md:px-10 lg:px-16">
          <nav className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-[13px] font-light tracking-widest uppercase transition-colors ${
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
              className="h-6 md:h-8 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => handleLanguageChange(language === 'vi' ? 'en' : 'vi')}
              className="text-[13px] font-light tracking-wider text-white/70 hover:text-white transition-colors flex items-center gap-1"
              data-testid="lang-toggle"
            >
              {language === 'vi' ? 'Tiếng Việt' : 'English'}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-1">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

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
                  className={`text-sm font-light tracking-wider transition-colors ${language === 'en' ? 'text-white' : 'text-white/40'}`}
                  data-testid="lang-en"
                >
                  English
                </button>
                <span className="text-white/20">|</span>
                <button
                  onClick={() => { handleLanguageChange('vi'); }}
                  className={`text-sm font-light tracking-wider transition-colors ${language === 'vi' ? 'text-white' : 'text-white/40'}`}
                  data-testid="lang-vi"
                >
                  Tiếng Việt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pb-8 md:pb-6 mb-4">{children}</main>

      <footer className="bg-black text-white pt-10 pb-12 border-t border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-20 mb-8">
            <div>
              <h4 className="text-sm tracking-widest text-white mb-8 font-light uppercase">
                {language === 'vi' ? 'VĂN PHÒNG CHÍNH' : 'CORPORATE OFFICE'}
              </h4>
              <div className="space-y-2">
                {language === 'vi' ? (
                  <>
                    <p className="text-white/80 font-light text-sm">Lầu 1, Tòa nhà Sabay</p>
                    <p className="text-white/80 font-light text-sm">140B Nguyễn Văn Trỗi</p>
                    <p className="text-white/80 font-light text-sm">Quận Phú Nhuận</p>
                    <p className="text-white/80 font-light text-sm">TP. Hồ chí Minh, Việt Nam</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/80 font-light text-sm">1st Floor, Sabay Building</p>
                    <p className="text-white/80 font-light text-sm">140B Nguyen Van Troi Street</p>
                    <p className="text-white/80 font-light text-sm">Phu Nhuan District</p>
                    <p className="text-white/80 font-light text-sm">Ho Chi Minh City, Vietnam</p>
                  </>
                )}
                <p className="text-white/80 font-light text-sm mt-6">094 367 9879</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm tracking-widest text-white mb-8 font-light uppercase">
                {language === 'vi' ? 'ĐIỀU HƯỚNG' : 'NAVIGATION'}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/blog" 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm" 
                    data-testid="footer-news"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {language === 'vi' ? 'TIN TỨC' : 'NEWS'}
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/about" 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {language === 'vi' ? 'GIỚI THIỆU' : 'ABOUT'}
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/portfolio" 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {language === 'vi' ? 'DỰ ÁN' : 'PROJECTS'}
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {language === 'vi' ? 'LIÊN HỆ' : 'CONTACTS'}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm tracking-widest text-white mb-8 font-light uppercase">
                {language === 'vi' ? 'MẠNG XÃ HỘI' : 'SOCIAL MEDIA'}
              </h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://www.instagram.com/moderno.interiors/" 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    data-testid="footer-instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    INSTAGRAM
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.facebook.com/moderno.interiors.design" 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    data-testid="footer-facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    FACEBOOK
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.tiktok.com/@moderno.interiors" 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    data-testid="footer-tiktok"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    TIKTOK
                  </a>
                </li>
                <li>
                  <a 
                    href="https://zalo.me/moderno" 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    data-testid="footer-zalo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ZALO
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm tracking-widest text-white mb-8 font-light uppercase">
                {language === 'vi' ? 'ĐĂNG KÝ TIN TỨC' : 'JOIN OUR NEWS'}
              </h4>
              <p className="text-white/80 mb-6 font-light text-sm">
                {language === 'vi' ? 'Nhận thông báo về các ưu đãi mới' : 'Receive notifications about new offers'}
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder={language === 'vi' ? 'Email' : 'Email'}
                  className="bg-transparent border-0 border-b border-gray-600 text-white/80 placeholder-gray-400 focus:outline-none focus:border-white flex-grow px-0 py-3 font-light text-sm"
                  data-testid="newsletter-email"
                />
                <button className="ml-3 text-white/80 hover:text-white transition-colors font-light text-base">
                  →
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-5 pt-5 text-center border-t border-gray-800">
            <p className="text-white/60 text-base font-light">
              © 2025 IEVRA Design & Build
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
