import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

const getNavigation = (t: (key: string) => string) => {
  return [
    { name: t('nav.home'), href: `/`, key: 'home' },
    { name: t('nav.news'), href: `/blog`, key: 'news' },
    { name: t('nav.about'), href: `/about`, key: 'about' },
    { name: t('nav.projects'), href: `/portfolio`, key: 'portfolio' },
    { name: t('nav.contacts'), href: `/contact`, key: 'contact' }
  ];
};

export default function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [iconState, setIconState] = useState('normal'); // 'normal', 'opening', 'hidden', 'closing'
  const [isClicked, setIsClicked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Force reset icon to normal state on component mount and add debug
  useEffect(() => {
    console.log('🔧 Layout mounted - resetting icon state to normal');
    setIconState('normal');
    setMobileMenuOpen(false);
    setShowSidebar(false);
  }, []); // Run once on mount

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  // Reset icon rotation when sidebar closes
  useEffect(() => {
    if (!showSidebar && !mobileMenuOpen) {
      setIsClicked(false);
    }
  }, [showSidebar, mobileMenuOpen]);
  
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Lock scroll during menu for smooth performance
  useEffect(() => {
    document.body.style.overflow = showSidebar ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSidebar]);
  const { language, setLanguage, t } = useLanguage();
  const navigation = getNavigation(t);

  // Fetch logo settings
  const { data: settings } = useQuery<{ logoData?: string; logoUrl?: string }>({
    queryKey: ['/api/settings'],
  });

  const logoSrc = settings?.logoData || settings?.logoUrl || '/api/assets/logo.white.png';

  // Animation timing constants - Ultra-Smooth (Auto-scales to 240fps on supported displays)
  const OPENING_DURATION = 900; // 0.9s for bars 1→2→3 (sync with CSS --bar-dur)
  const CLOSING_DURATION = 900; // 0.9s for bars 3→2→1 (sync with CSS --bar-dur) 
  const SIDEBAR_DURATION = 900; // 0.9s sidebar transition (sync with CSS --sidebar-dur)

  // Performance monitoring - detect actual refresh rate
  useEffect(() => {
    let frameCount = 0;
    let startTime = performance.now();
    const measureFPS = () => {
      frameCount++;
      if (frameCount === 120) { // Sample 120 frames
        const endTime = performance.now();
        const fps = Math.round((frameCount * 1000) / (endTime - startTime));
        console.log(`🚀 Display refresh rate detected: ${fps}fps (optimized for 240fps)`);
        return;
      }
      requestAnimationFrame(measureFPS);
    };
    // Only measure once per session
    if (!sessionStorage.getItem('fps-measured')) {
      sessionStorage.setItem('fps-measured', 'true');
      requestAnimationFrame(measureFPS);
    }
  }, []);

  // OPENING: Show sidebar after hamburger 1→2→3 completes
  useEffect(() => {
    if (mobileMenuOpen) {
      setIconState('opening');
      const timer = setTimeout(() => {
        setIconState('hidden');
        setShowSidebar(true);
      }, OPENING_DURATION);
      return () => clearTimeout(timer);
    }
  }, [mobileMenuOpen]);

  // CLOSING: Animate bars 3→2→1 after sidebar closes
  useEffect(() => {
    if (!showSidebar && iconState === 'hidden') {
      const timer = setTimeout(() => {
        setIconState('closing');
        setTimeout(() => {
          setIconState('normal');
          setMobileMenuOpen(false);
        }, CLOSING_DURATION);
      }, SIDEBAR_DURATION);
      return () => clearTimeout(timer);
    }
  }, [showSidebar, iconState]);

  // Language switching without URL changes
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    // Chỉ thay đổi ngôn ngữ hiển thị, không thay đổi URL
  };

  // No URL-based language detection needed

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

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen relative">
      {/* Top Header with Navigation */}
      <header className={`fixed top-0 left-12 md:left-16 right-0 z-50 bg-black/50 backdrop-blur-sm transition-transform duration-300 ${
        isScrolled ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex items-center justify-between py-3 px-3 md:py-4 md:px-6">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-white text-lg font-light tracking-wider cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img 
              src={logoSrc} 
              alt="IEVRA Design & Build" 
              className="h-8 md:h-10 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>
          
          {/* Right Side: Language */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-1 text-sm">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`transition-colors px-2 py-1 ${
                language === 'en' ? 'text-primary' : 'text-zinc-400 hover:text-primary'
              }`}
              data-testid="lang-en"
            >
              ENG
            </button>
            <span className="text-white/60">|</span>
            <button
              onClick={() => handleLanguageChange('vi')}
              className={`transition-colors px-2 py-1 ${
                language === 'vi' ? 'text-primary' : 'text-zinc-400 hover:text-primary'
              }`}
              data-testid="lang-vi"
            >
              VIE
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* Custom Overlay with Backdrop Blur - Pre-mounted for 120fps performance */}
      <div 
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
        style={{
          opacity: showSidebar ? 1 : 0,
          pointerEvents: showSidebar ? 'auto' : 'none',
          transition: 'opacity 400ms var(--ease-smooth), backdrop-filter 400ms var(--ease-smooth)',
          willChange: 'opacity, backdrop-filter',
          backdropFilter: showSidebar ? 'blur(4px)' : 'blur(0px)'
        }}
        onClick={(e) => {
          e.preventDefault();
          if (isAnimating) {
            console.log('🚫 Overlay click blocked - animation in progress');
            return;
          }
          // Sidebar closes immediately (800ms), icon resets after sidebar closes + 200ms delay
          console.log('🔒 Starting close animation (overlay)');
          setIsAnimating(true);
          setShowSidebar(false);
          setTimeout(() => {
            setIsClicked(false);
            setIsAnimating(false);
            console.log('✅ Close animation completed (overlay)');
          }, 1000);
        }}
      />

      {/* Vertical Navigation Sidebar - IIDA Style */}
      <aside className="fixed top-0 left-0 h-screen w-12 md:w-16 z-40 bg-black flex flex-col items-center justify-center">
        {/* Hamburger Menu at Center */}
        <Sheet open={true} modal={false} onOpenChange={() => {
          // Keep always open to maintain DOM presence for smooth animations
        }}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="lg"
              className="group text-white hover:text-primary w-10 h-10 md:w-14 md:h-14 rounded-none hover:bg-transparent flex items-center justify-center transform-gpu will-change-transform will-change-opacity"
              aria-label="Open navigation menu"
              data-testid="button-main-menu"
              onClick={(e) => {
                // Prevent double-click and animation conflicts
                e.preventDefault();
                if (isAnimating) {
                  console.log('🚫 Click blocked - animation in progress');
                  return;
                }
                
                // Toggle sidebar logic
                if (showSidebar) {
                  // Close sidebar
                  console.log('🔒 Starting close animation');
                  setIsAnimating(true);
                  setShowSidebar(false);
                  setTimeout(() => {
                    setIsClicked(false);
                    setIsAnimating(false);
                    console.log('✅ Close animation completed');
                  }, 1000); // Increased to 1000ms for safety
                } else {
                  // Open sidebar
                  console.log('🔒 Starting open animation');
                  setIsAnimating(true);
                  setIsClicked(true);
                  setTimeout(() => {
                    setMobileMenuOpen(true);
                    setShowSidebar(true);
                    setTimeout(() => {
                      setIsAnimating(false);
                      console.log('✅ Open animation completed');
                    }, 800); // Additional delay after sidebar opens
                  }, 200);
                }
              }}
              style={{
                visibility: 'visible', // Always visible for now
                opacity: 1, // Always fully opaque for now
                transition: 'opacity 450ms var(--ease-smooth), transform 450ms var(--ease-smooth)',
                transform: 'scale(1) translate3d(0,0,0)', // Always normal scale
                willChange: 'transform, opacity'
              }}
            >
              {/* Classic hamburger icon - rotated 90 degrees with click animation */}
              <div 
                className={`flex flex-col justify-center items-center space-y-1.5 md:space-y-2 w-7 h-6 md:w-10 md:h-8 transition-all duration-[1000ms] ease-in-out group-hover:scale-110 transform-gpu will-change-transform ${
                  isClicked || showSidebar ? 'rotate-180' : 'rotate-90'
                } ${isAnimating ? 'pointer-events-none opacity-70' : ''}`}
                style={{
                  backfaceVisibility: 'hidden',
                  perspective: '1000px'
                }}
              >
                <div className="w-5 md:w-8 h-0.5 md:h-1 bg-white transition-all duration-300 ease-out group-hover:bg-primary transform-gpu"></div>
                <div className="w-5 md:w-8 h-0.5 md:h-1 bg-white transition-all duration-300 ease-out group-hover:bg-primary transform-gpu"></div>
                <div className="w-5 md:w-8 h-0.5 md:h-1 bg-white transition-all duration-300 ease-out group-hover:bg-primary transform-gpu"></div>
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[320px] sm:w-[400px] bg-black [&>button]:hidden transform-gpu will-change-transform will-change-contents backface-visibility-hidden border-0"
            style={{
              transition: 'transform var(--sidebar-dur) var(--ease-smooth)',
              transform: showSidebar ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)',
              willChange: 'transform',
              visibility: showSidebar ? 'visible' : 'visible',
              pointerEvents: showSidebar ? 'auto' : 'none',
              backfaceVisibility: 'hidden',
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              if (isAnimating) {
                console.log('🚫 ESC blocked - animation in progress');
                return;
              }
              // Sidebar closes immediately (800ms), icon resets after sidebar closes + 200ms delay
              console.log('🔒 Starting close animation (ESC)');
              setIsAnimating(true);
              setShowSidebar(false);
              setTimeout(() => {
                setIsClicked(false);
                setIsAnimating(false);
                console.log('✅ Close animation completed (ESC)');
              }, 1000);
            }}
          >
            <SheetHeader>
              <SheetTitle className="text-lg font-sans font-light text-primary">
                <Link 
                  href="/" 
                  onClick={() => {
                    if (isAnimating) {
                      console.log('🚫 Link click blocked - animation in progress');
                      return;
                    }
                    // Sidebar closes immediately (800ms), icon resets after sidebar closes + 200ms delay
                    console.log('🔒 Starting close animation (logo)');
                    setIsAnimating(true);
                    setShowSidebar(false);
                    setTimeout(() => {
                      setIsClicked(false);
                      setIsAnimating(false);
                      console.log('✅ Close animation completed (logo)');
                    }, 1000);
                  }}
                  className="cursor-pointer inline-block"
                >
                  <img 
                    src={logoSrc} 
                    alt="IEVRA Design & Build" 
                    className="h-12 w-auto hover:opacity-80 transition-opacity"
                  />
                </Link>
              </SheetTitle>
              <SheetDescription className="sr-only">Navigation menu</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col h-full">
                {/* Navigation Menu */}
                <div className="flex-1 py-8">
                  <div className="space-y-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => {
                          if (isAnimating) {
                            console.log('🚫 Nav link blocked - animation in progress');
                            return;
                          }
                          // Sidebar closes immediately (800ms), icon resets after sidebar closes + 200ms delay
                          console.log('🔒 Starting close animation (nav)');
                          setIsAnimating(true);
                          setShowSidebar(false);
                          setTimeout(() => {
                            setIsClicked(false);
                            setIsAnimating(false);
                            console.log('✅ Close animation completed (nav)');
                          }, 1000);
                        }}
                        className={`block text-lg font-light transition-colors nav-link-underline ${
                          isActive(item.href)
                            ? 'text-primary'
                            : 'text-foreground hover:text-white'
                        }`}
                        data-testid={`menu-nav-${item.key}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Menu Footer */}
                <div className="py-6 border-t border-border">
                </div>
              </div>
            </SheetContent>
        </Sheet>
      </aside>


      {/* Main Content - Adjusted for header and sidebar */}
      <main className="pl-12 md:pl-16 pb-8 md:pb-6 mb-4">{children}</main>

      {/* Footer - Updated with dark design matching the provided image */}
      <footer className="bg-black text-white pt-10 pb-12 border-t border-gray-800 ml-12 md:ml-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-20 mb-8">
            {/* Corporate Office */}
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
            
            {/* Navigation */}
            <div>
              <h4 className="text-sm tracking-widest text-white mb-8 font-light uppercase">
                {language === 'vi' ? 'ĐIỀU HƯỚNG' : 'NAVIGATION'}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href={`/blog`} 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm" 
                    data-testid="footer-news"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {language === 'vi' ? 'TIN TỨC' : 'NEWS'}
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/about`} 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {language === 'vi' ? 'GIỚI THIỆU' : 'ABOUT'}
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/portfolio`} 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {language === 'vi' ? 'DỰ ÁN' : 'PROJECTS'}
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/contact`} 
                    className="text-white/80 hover:text-white transition-colors font-light text-sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {language === 'vi' ? 'LIÊN HỆ' : 'CONTACTS'}
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Social Media */}
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
            
            {/* Join Our News */}
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