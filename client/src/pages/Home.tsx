import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Send,
  Sparkles,
  Headset,
  Users,
  Store,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import HeroSlider from "@/components/HeroSlider";
import ScrollableContainer from "@/components/ScrollableContainer";
import { apiRequest } from "@/lib/queryClient";
import { FormattedText } from "@/lib/textUtils";
import type {
  Project,
  HomepageContent,
  Article,
  Partner,
  JourneyStep,
  Category,
} from "@shared/schema";

function TypewriterTitle({ text, className }: { text: string; isActive?: boolean; className?: string }) {
  const [displayed, setDisplayed] = useState('');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    let i = 0;
    setDisplayed('');
    const speed = Math.max(60, Math.round(2800 / text.length));
    let lastTime = 0;
    const tick = (time: number) => {
      if (time - lastTime >= speed) {
        lastTime = time;
        i++;
        setDisplayed(text.slice(0, i));
        if (i < text.length) rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [text]);

  return <h3 className={className}>{displayed || '\u00A0'}</h3>;
}

type TypewriterTextTag = 'p' | 'h2' | 'h3' | 'h4';
function TypewriterText({
  text,
  className,
  as: Tag = 'p',
  reverse = false,
}: {
  text: string;
  className?: string;
  as?: TypewriterTextTag;
  reverse?: boolean;
}) {
  const [displayed, setDisplayed] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const elRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted || !text) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    let i = 0;
    setDisplayed('');
    const charSpeed = Math.max(20, Math.round(3200 / text.length));
    let lastTime = 0;
    const tick = (time: number) => {
      if (time - lastTime >= charSpeed) {
        lastTime = time;
        i++;
        setDisplayed(reverse ? text.slice(text.length - i) : text.slice(0, i));
        if (i < text.length) rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [hasStarted, text, reverse]);

  return (
    <Tag ref={elRef as any} className={className}>
      {displayed || '\u00A0'}
    </Tag>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const projectsScrollRef = useRef<HTMLDivElement>(null);
  const [projectsContainerWidth, setProjectsContainerWidth] = useState(0);
  const [activeArticleIndex, setActiveArticleIndex] = useState(0);
  const articlesScrollRef = useRef<HTMLDivElement>(null);
  const [articlesContainerWidth, setArticlesContainerWidth] = useState(0);
  const [expandedStepNumber, setExpandedStepNumber] = useState<number | null>(null);
  const [contactFormExpanded, setContactFormExpanded] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [processSectionHoverTimer, setProcessSectionHoverTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [faqSectionHoverTimer, setFaqSectionHoverTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [faqAnswerTexts, setFaqAnswerTexts] = useState<Record<string, string>>(
    {},
  );
  const [stepDescriptionTexts, setStepDescriptionTexts] = useState<Record<string, string>>({});

  const measureContainers = useCallback(() => {
    if (projectsScrollRef.current) setProjectsContainerWidth(projectsScrollRef.current.offsetWidth);
    if (articlesScrollRef.current) setArticlesContainerWidth(articlesScrollRef.current.offsetWidth);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(measureContainers);
    const ro = new ResizeObserver(measureContainers);
    if (projectsScrollRef.current) ro.observe(projectsScrollRef.current);
    if (articlesScrollRef.current) ro.observe(articlesScrollRef.current);
    window.addEventListener('resize', measureContainers);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); window.removeEventListener('resize', measureContainers); };
  }, [measureContainers]);

  // Scroll animation with specific directions and stagger delays
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !entry.target.classList.contains("animated")
          ) {
            const element = entry.target;
            element.classList.add("animated");

            // All cards use simple fade-in from bottom
            if (
              element.classList.contains("project-card") ||
              element.classList.contains("article-card") ||
              element.classList.contains("advantage-card")
            ) {
              element.classList.add("animate-fade-in-up");
            }
            // Elements that should slide from right
            else if (
              element.classList.contains("view-more-btn") ||
              element.classList.contains("scroll-animate-right") ||
              element.tagName === "BUTTON"
            ) {
              element.classList.add("animate-slide-in-from-right");
            }
            // Titles and other elements from left
            else {
              element.classList.add("animate-slide-in-from-left");
            }
          }
        });
      },
      { threshold: 0.08, rootMargin: "50px 0px -50px 0px" },
    );

    const observeElements = () => {
      const elements = document.querySelectorAll(
        ".scroll-animate, .scroll-animate-right, .advantage-card, .process-step, .project-card, .article-card, .view-more-btn",
      );
      elements.forEach((el) => observer.observe(el));
    };

    observeElements();

    const timer = setTimeout(observeElements, 600);

    // Reset and re-trigger animation when back to top
    const handleScroll = () => {
      if (window.scrollY < 50) {
        document.querySelectorAll(".animated").forEach((el) => {
          el.classList.remove(
            "animated",
            "animate-fade-in-up",
            "animate-slide-in-from-left",
            "animate-slide-in-from-right",
          );
        });
        // Re-trigger animations after a brief delay
        setTimeout(() => {
          observeElements();
        }, 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  

  // Quick contact form state (matching Contact page)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    projectType: "",
    requirements: "",
  });

  // Typing animation for form placeholders
  const [placeholders, setPlaceholders] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    projectType: "",
    requirements: "",
  });

  useEffect(() => {
    // Only run typing animation when form is expanded
    if (!contactFormExpanded) {
      // Reset placeholders when form is closed
      setPlaceholders({
        name: "",
        email: "",
        phone: "",
        address: "",
        projectType: "",
        requirements: "",
      });
      return;
    }

    const texts = {
      name: language === "vi" ? "Họ và tên" : "Name",
      email: "E-mail",
      phone: language === "vi" ? "Điện thoại" : "Phone",
      address: language === "vi" ? "Địa chỉ" : "Address",
      projectType: language === "vi" ? "Loại hình (VD: Căn hộ, Nhà hàng, Quán CF...)" : "Project type (e.g. Apartment, Restaurant, Cafe...)",
      requirements:
        language === "vi"
          ? "Yêu cầu / Mô tả dự án"
          : "Requirements / Project Description",
    };

    const delays = {
      name: 0,
      email: 200,
      phone: 400,
      address: 600,
      projectType: 800,
      requirements: 1000,
    };

    const timeouts: NodeJS.Timeout[] = [];
    const intervals: NodeJS.Timeout[] = [];

    const typeText = (
      field: keyof typeof texts,
      text: string,
      delay: number,
    ) => {
      const timeout = setTimeout(() => {
        let index = 0;
        const interval = setInterval(() => {
          if (index <= text.length) {
            setPlaceholders((prev) => ({
              ...prev,
              [field]: text.slice(0, index),
            }));
            index++;
          } else {
            clearInterval(interval);
          }
        }, 50);
        intervals.push(interval);
      }, delay);
      timeouts.push(timeout);
    };

    typeText("name", texts.name, delays.name);
    typeText("email", texts.email, delays.email);
    typeText("phone", texts.phone, delays.phone);
    typeText("address", texts.address, delays.address);
    typeText("projectType", texts.projectType, delays.projectType);
    typeText("requirements", texts.requirements, delays.requirements);

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, [language, contactFormExpanded]);

  const { data: allProjects, isLoading: projectsLoading } = useQuery<Project[]>(
    {
      queryKey: ["/api/projects"],
    },
  );

  const { data: featuredProjects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", "featured", language],
    queryFn: async () => {
      const response = await fetch(`/api/projects?featured=true&language=${language}`);
      if (!response.ok) throw new Error("Failed fetch, not 2xx response");
      return response.json();
    },
  });

  const { data: stats } = useQuery<{
    totalProjects: number;
    activeClients: number;
    newInquiries: number;
    revenue: string;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: homepageContent } = useQuery<HomepageContent>({
    queryKey: ["/api/homepage-content", language],
    queryFn: async () => {
      const response = await fetch(
        `/api/homepage-content?language=${language}`,
      );
      if (!response.ok) throw new Error("Failed fetch, not 2xx response");
      return response.json();
    },
  });

  const { data: dbCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const getCategoryLabel = (categorySlug: string) => {
    const projectCategories = dbCategories.filter(cat => cat.type === 'project' && cat.active);
    const foundCategory = projectCategories.find(c => c.slug === categorySlug);
    if (foundCategory) {
      return language === 'vi' ? (foundCategory.nameVi || foundCategory.name) : foundCategory.name;
    }
    return categorySlug;
  };

  const {
    data: faqs = [],
    isLoading: faqsLoading,
    error: faqsError,
  } = useQuery<any[]>({
    queryKey: ["/api/faqs", language],
    queryFn: async () => {
      const response = await fetch(`/api/faqs?language=${language}`);
      if (!response.ok) throw new Error("Failed to fetch FAQs");
      return response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  // Reset FAQ expansion when language changes
  useEffect(() => {
    setExpandedFaqIndex(null);
    setFaqAnswerTexts({});
  }, [language]);

  // Typing animation for FAQ answers
  useEffect(() => {
    if (expandedFaqIndex === null || !faqs || faqs.length === 0) {
      return;
    }

    const currentFaq = faqs[expandedFaqIndex];
    if (!currentFaq) return;

    const text = currentFaq.answer || "";
    let index = 0;
    
    // Start with empty text
    setFaqAnswerTexts((prev) => ({ ...prev, [currentFaq.id]: "" }));
    
    const interval = setInterval(() => {
      if (index <= text.length) {
        setFaqAnswerTexts((prev) => ({
          ...prev,
          [currentFaq.id]: text.slice(0, index),
        }));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20); // Typing speed: 20ms per character

    return () => clearInterval(interval);
  }, [expandedFaqIndex]);

  useEffect(() => {
    const el = projectsScrollRef.current;
    if (!el) return;
    let accumulatedDeltaX = 0;
    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 5) {
        e.preventDefault();
        accumulatedDeltaX += e.deltaX;
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => { accumulatedDeltaX = 0; }, 200);
        if (Math.abs(accumulatedDeltaX) > 80) {
          const maxIndex = Math.min(10, featuredProjects?.length || 1) - 1;
          if (accumulatedDeltaX > 0) {
            setActiveProjectIndex(prev => Math.min(prev + 1, maxIndex));
          } else {
            setActiveProjectIndex(prev => Math.max(prev - 1, 0));
          }
          accumulatedDeltaX = 0;
        }
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [featuredProjects?.length]);

  const { data: featuredArticles, isLoading: articlesLoading } = useQuery<
    Article[]
  >({
    queryKey: ["/api/articles", "featured", language],
    queryFn: async () => {
      const response = await fetch(
        `/api/articles?featured=true&language=${language}`,
      );
      if (!response.ok) throw new Error("Failed fetch, not 2xx response");
      return response.json();
    },
  });

  useEffect(() => {
    requestAnimationFrame(measureContainers);
  }, [featuredProjects?.length, featuredArticles?.length, measureContainers]);

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    queryFn: async () => {
      const response = await fetch("/api/partners?active=true");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: advantages = [], isLoading: advantagesLoading } = useQuery<any[]>({
    queryKey: ["/api/advantages"],
    queryFn: async () => {
      const response = await fetch("/api/advantages?active=true");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: journeySteps, isLoading: journeyStepsLoading } = useQuery<JourneyStep[]>({
    queryKey: ["/api/journey-steps"],
    queryFn: async () => {
      const response = await fetch("/api/journey-steps?active=true");
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 0,
  });

  // Prefetch About page data for instant navigation
  useEffect(() => {
    const prefetchAboutData = async () => {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["/api/about-page-content"],
          queryFn: async () => {
            const response = await fetch("/api/about-page-content");
            if (!response.ok) throw new Error("Failed to fetch");
            return response.json();
          },
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["/api/about-core-values"],
          queryFn: async () => {
            const response = await fetch("/api/about-core-values");
            if (!response.ok) return [];
            return response.json();
          },
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["/api/about-showcase-services"],
          queryFn: async () => {
            const response = await fetch("/api/about-showcase-services");
            if (!response.ok) return [];
            return response.json();
          },
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["/api/about-process-steps"],
          queryFn: async () => {
            const response = await fetch("/api/about-process-steps");
            if (!response.ok) return [];
            return response.json();
          },
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["/api/about-team-members"],
          queryFn: async () => {
            const response = await fetch("/api/about-team-members");
            if (!response.ok) return [];
            return response.json();
          },
          staleTime: 5 * 60 * 1000,
        }),
      ]);
    };
    
    prefetchAboutData();
  }, [queryClient]);

  // Typing animation for journey step descriptions
  useEffect(() => {
    if (expandedStepNumber === null || !journeySteps || journeySteps.length === 0) {
      return;
    }

    const step = journeySteps.find(s => s.stepNumber === expandedStepNumber);
    if (!step) return;

    const text = language === "vi" ? step.descriptionVi : step.descriptionEn;
    let index = 0;
    
    setStepDescriptionTexts((prev) => ({ ...prev, [step.id]: "" }));
    
    const interval = setInterval(() => {
      if (index <= text.length) {
        setStepDescriptionTexts((prev) => ({
          ...prev,
          [step.id]: text.slice(0, index),
        }));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => {
      clearInterval(interval);
    };
  }, [expandedStepNumber, journeySteps, language]);

  // Quick contact form mutation (matching Contact page)
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/inquiries", data);
    },
    onSuccess: () => {
      toast({
        title:
          language === "vi"
            ? "Gửi yêu cầu thành công"
            : "Request Sent Successfully",
        description:
          language === "vi"
            ? "Chúng tôi sẽ liên hệ lại với bạn trong vòng 24 giờ."
            : "We'll get back to you within 24 hours.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        projectType: "",
        requirements: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description:
          language === "vi"
            ? "Không thể gửi yêu cầu. Vui lòng thử lại."
            : "Failed to send request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (processSectionHoverTimer) {
        clearTimeout(processSectionHoverTimer);
      }
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
      if (faqSectionHoverTimer) {
        clearTimeout(faqSectionHoverTimer);
      }
    };
  }, [processSectionHoverTimer, autoCloseTimer, faqSectionHoverTimer]);

  // Handle Process Section auto-close functionality
  const handleProcessSectionMouseLeave = () => {
    const timer = setTimeout(() => {
      // Close all expanded steps
      setExpandedStepNumber(null);
    }, 4000); // 4 seconds after mouse leaves entire section
    setProcessSectionHoverTimer(timer);
  };

  const handleProcessSectionMouseEnter = () => {
    if (processSectionHoverTimer) {
      clearTimeout(processSectionHoverTimer);
      setProcessSectionHoverTimer(null);
    }
  };

  // Auto-close handlers for Quick Contact section
  const handleContactMouseEnter = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
  };

  const handleContactMouseLeave = () => {
    if (contactFormExpanded) {
      const timer = setTimeout(() => {
        setContactFormExpanded(false);
      }, 4000); // 4 seconds - between 3-5s as requested
      setAutoCloseTimer(timer);
    }
  };

  // Auto-close handlers for FAQ section
  const handleFaqSectionMouseEnter = () => {
    if (faqSectionHoverTimer) {
      clearTimeout(faqSectionHoverTimer);
      setFaqSectionHoverTimer(null);
    }
  };

  const handleFaqSectionMouseLeave = () => {
    const timer = setTimeout(() => {
      // Close expanded FAQ
      setExpandedFaqIndex(null);
    }, 3000); // 3 seconds after mouse leaves FAQ section
    setFaqSectionHoverTimer(timer);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: language === "vi" ? "Trường bắt buộc" : "Required Fields",
        description:
          language === "vi"
            ? "Vui lòng điền họ tên, email và số điện thoại."
            : "Please fill in name, email, and phone fields.",
        variant: "destructive",
      });
      return;
    }

    const inquiryData = {
      firstName: formData.name.split(" ")[0] || formData.name,
      lastName: formData.name.split(" ").slice(1).join(" ") || "",
      email: formData.email,
      phone: formData.phone,
      projectType: "consultation" as const,
      message: `Address: ${formData.address}${formData.projectType ? `\n\nLoại hình: ${formData.projectType}` : ""}\n\nRequirements: ${formData.requirements}`,
    };

    mutation.mutate(inquiryData);
  };

  return (
    <div className="min-h-[120vh] bg-black">
      {/* Hero Slider Section - IIDA Style */}
      <HeroSlider projects={featuredProjects || []} />
      {/* Featured Projects Section */}
      <section id="featured-projects" className="min-h-screen bg-card py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="max-w-none">
                <TypewriterText
                  text={language === "vi"
                    ? (homepageContent?.featuredDescriptionVi || homepageContent?.featuredDescription || t("featured.projectsDesc"))
                    : (homepageContent?.featuredDescription || t("featured.projectsDesc"))
                  }
                  className="text-2xl md:text-3xl font-light text-foreground leading-relaxed"
                />
              </div>
              <div className="flex-shrink-0 -ml-4 sm:ml-8">
                <Button
                  variant="ghost"
                  size="default"
                  asChild
                  className="rounded-none hover:bg-transparent text-white/60 hover:text-white view-more-btn scroll-animate transition-colors duration-300"
                  data-testid="button-view-more-projects"
                >
                  <Link href="/portfolio">
                    {t("common.viewMoreProjects")}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4" style={{ width: "max-content" }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`group relative overflow-hidden cursor-pointer h-[32rem] flex-shrink-0 rounded-none ${i === 1 ? 'w-[55vw]' : 'w-80'}`}
                  >
                    <div className="animate-pulse bg-white/10 h-full w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div ref={projectsScrollRef} className="relative overflow-hidden"
                onPointerDown={(e) => {
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  const el = projectsScrollRef.current;
                  if (!el) return;
                  (el as any)._swipeStartX = e.clientX;
                  (el as any)._swipeSwiped = false;
                  if (e.pointerType !== 'mouse') el.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const el = projectsScrollRef.current;
                  if (!el || (el as any)._swipeStartX == null) return;
                  const diff = (el as any)._swipeStartX - e.clientX;
                  if (Math.abs(diff) > 50 && !(el as any)._swipeSwiped) {
                    (el as any)._swipeSwiped = true;
                    const maxIndex = Math.min(10, featuredProjects?.length || 1) - 1;
                    if (diff > 0 && activeProjectIndex < maxIndex) {
                      setActiveProjectIndex(activeProjectIndex + 1);
                    } else if (diff < 0 && activeProjectIndex > 0) {
                      setActiveProjectIndex(activeProjectIndex - 1);
                    }
                    (el as any)._swipeStartX = null;
                  }
                }}
                onPointerUp={() => {
                  const el = projectsScrollRef.current;
                  if (el) (el as any)._swipeStartX = null;
                }}
                onPointerCancel={() => {
                  const el = projectsScrollRef.current;
                  if (el) (el as any)._swipeStartX = null;
                }}
                style={{ touchAction: 'pan-y' }}
              >
                {activeProjectIndex > 0 && (
                  <button
                    onClick={() => setActiveProjectIndex(activeProjectIndex - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-100 transition-opacity duration-300"
                  >
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                )}
                {featuredProjects && activeProjectIndex < Math.min(10, featuredProjects.length) - 1 && (
                  <button
                    onClick={() => setActiveProjectIndex(Math.min((featuredProjects?.length || 1) - 1, activeProjectIndex + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-100 transition-opacity duration-300"
                  >
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}
                <div className="flex gap-4 pb-4" style={{
                  transform: (() => {
                    const isMobile = window.innerWidth < 640;
                    const totalCards = Math.min(10, featuredProjects?.length || 0);
                    if (isMobile) {
                      return `translateX(-${activeProjectIndex * 16}px)`;
                    }
                    const containerPx = projectsContainerWidth || window.innerWidth;
                    const activeWidthPx = Math.min(window.innerWidth * 0.55, 44 * 16);
                    const inactiveWidthPx = Math.max(120, (containerPx - activeWidthPx - 32) / 2);
                    const unitPx = inactiveWidthPx + 16;
                    const totalContentPx = activeWidthPx + (totalCards - 1) * unitPx;
                    const maxOffsetPx = Math.max(0, totalContentPx - containerPx);
                    const desiredOffsetPx = activeProjectIndex * unitPx;
                    return `translateX(-${Math.min(desiredOffsetPx, maxOffsetPx)}px)`;
                  })(),
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  {featuredProjects?.slice(0, 10).map((project, index) => {
                    const isMobile = window.innerWidth < 640;
                    const totalCards = Math.min(10, featuredProjects?.length || 0);
                    const isActive = index === activeProjectIndex;
                    const containerPx = projectsContainerWidth || window.innerWidth;
                    const activeWidthPx = Math.min(window.innerWidth * 0.55, 44 * 16);
                    const inactiveWidthPx = Math.max(120, (containerPx - activeWidthPx - 32) / 2);
                    let cardWidth: string;
                    if (isMobile) {
                      cardWidth = isActive ? `${projectsContainerWidth || window.innerWidth - 32}px` : '0px';
                    } else if (isActive) {
                      cardWidth = `${activeWidthPx}px`;
                    } else {
                      cardWidth = `${inactiveWidthPx}px`;
                    }
                    return (
                      <div
                        key={project.id}
                        data-project-card
                        className={`group relative overflow-hidden cursor-pointer h-[38rem] flex-shrink-0 rounded-none border border-white/10 hover:bg-white/[0.04] project-card`}
                        style={{
                          width: cardWidth,
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={() => {
                          if (isActive) {
                            navigate(project.slug ? `/portfolio/${project.slug}` : `/project/${project.id}`);
                          } else {
                            setActiveProjectIndex(index);
                          }
                        }}
                      >
                        {Array.isArray(project.images) && project.images[0] ? (
                          <img
                            src={project.images[0]}
                            alt={project.title}
                            className="w-full h-full object-cover"
                            data-testid={`img-project-${project.id}`}
                          />
                        ) : (
                          <div className="w-full h-full bg-transparent" data-testid={`img-project-${project.id}`} />
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />

                        <div className="absolute inset-0 p-6 pb-8 flex flex-col justify-between">
                          <div>
                            <p
                              className="text-white/80 text-sm uppercase tracking-wide mb-1"
                              data-testid={`text-category-${project.id}`}
                            >
                              {getCategoryLabel(project.category)}
                            </p>
                            {project.style && (
                              <p className="text-white/60 text-xs mb-1" data-testid={`text-style-${project.id}`}>
                                {project.style}
                              </p>
                            )}
                            {project.area && (
                              <p className="text-white/60 text-xs" data-testid={`text-area-${project.id}`}>
                                {project.area}
                              </p>
                            )}
                          </div>

                          <div>
                            {isActive && (
                              <TypewriterTitle
                                text={project.title}
                                className="text-white text-2xl font-light leading-snug mb-3"
                              />
                            )}
                            <div className="flex items-end justify-between">
                              {project.completionYear && (
                                <div className="text-white">
                                  <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                                    {language === "vi" ? "Năm" : "Year"}
                                  </p>
                                  <p className="text-sm font-light" data-testid={`text-year-${project.id}`}>
                                    {project.completionYear}
                                  </p>
                                </div>
                              )}
                              {(project as any).location && (
                                <div className="text-white text-right">
                                  <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                                    {language === "vi" ? "Khu vực" : "Location"}
                                  </p>
                                  <p className="text-sm font-light">
                                    {(project as any).location}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      {/* Quality Hero Section */}
      <section className="relative h-screen bg-black" style={{ clipPath: 'inset(0)' }}>
        <div
          className="fixed inset-0"
          style={{
            ...(homepageContent?.qualityBackgroundImage ? { backgroundImage: `url(${homepageContent.qualityBackgroundImage})` } : {}),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
        </div>
        <div className="relative h-full w-full px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 w-full items-center">
            <div className="text-white space-y-6">
              <TypewriterText
                text={homepageContent?.qualityLeftText || (language === "vi"
                  ? "Mỗi chi tiết được lựa chọn để nội thất phục vụ lâu dài và trông hoàn hảo."
                  : "Each detail is selected so that the interior will serve for a long time and look impeccable.")}
                className="md:text-5xl font-light text-[36px]"
              />
            </div>
            <div className="text-white space-y-6 text-right">
              <TypewriterText
                reverse
                text={homepageContent?.qualityRightText || (language === "vi"
                  ? "Chúng tôi chỉ sử dụng vật liệu và nội thất chất lượng cao từ các nhà sản xuất đáng tin cậy."
                  : "We use only high-quality materials and furniture from trusted manufacturers.")}
                className="text-xl md:text-2xl font-light leading-relaxed"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Featured News Section */}
      <section id="featured-news" className="min-h-screen bg-background py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="max-w-none">
                <TypewriterText
                  text={language === "vi"
                    ? (homepageContent?.featuredNewsSubtitleVi || homepageContent?.featuredNewsSubtitle || t("featured.newsDesc"))
                    : (homepageContent?.featuredNewsSubtitle || t("featured.newsDesc"))
                  }
                  className="text-2xl md:text-3xl font-light text-foreground leading-relaxed"
                />
              </div>
              <div className="flex-shrink-0 -ml-4 sm:ml-8">
                <Button
                  variant="ghost"
                  size="default"
                  asChild
                  className="rounded-none hover:bg-transparent text-white/60 hover:text-white view-more-btn scroll-animate transition-colors duration-300"
                  data-testid="button-view-more-news"
                >
                  <Link href="/blog">
                    {t("common.viewMoreNews")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {articlesLoading ? (
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4" style={{ width: "max-content" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card
                    key={i}
                    className="overflow-hidden h-[38rem] w-72 flex-shrink-0 rounded-none"
                  >
                    <div className="animate-pulse bg-white/10 h-48 w-full" />
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-5 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                        <div className="space-y-2">
                          <div className="h-3 bg-white/10 rounded" />
                          <div className="h-3 bg-white/10 rounded w-5/6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                ref={articlesScrollRef}
                className="relative overflow-hidden"
                onPointerDown={(e) => {
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  const el = articlesScrollRef.current;
                  if (!el) return;
                  (el as any)._swipeStartX = e.clientX;
                  (el as any)._swipeSwiped = false;
                  if (e.pointerType !== 'mouse') el.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const el = articlesScrollRef.current;
                  if (!el || (el as any)._swipeStartX == null) return;
                  const diff = (el as any)._swipeStartX - e.clientX;
                  if (Math.abs(diff) > 50 && !(el as any)._swipeSwiped) {
                    (el as any)._swipeSwiped = true;
                    const maxIndex = Math.min(10, featuredArticles?.length || 1) - 1;
                    if (diff > 0 && activeArticleIndex < maxIndex) {
                      setActiveArticleIndex(activeArticleIndex + 1);
                    } else if (diff < 0 && activeArticleIndex > 0) {
                      setActiveArticleIndex(activeArticleIndex - 1);
                    }
                    (el as any)._swipeStartX = null;
                  }
                }}
                onPointerUp={() => {
                  const el = articlesScrollRef.current;
                  if (el) (el as any)._swipeStartX = null;
                }}
                onPointerCancel={() => {
                  const el = articlesScrollRef.current;
                  if (el) (el as any)._swipeStartX = null;
                }}
                style={{ touchAction: 'pan-y' }}
              >
                {activeArticleIndex > 0 && (
                  <button
                    onClick={() => setActiveArticleIndex(activeArticleIndex - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-100 transition-opacity duration-300"
                  >
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                )}
                {featuredArticles && activeArticleIndex < Math.min(10, featuredArticles.length) - 1 && (
                  <button
                    onClick={() => setActiveArticleIndex(Math.min((featuredArticles?.length || 1) - 1, activeArticleIndex + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-100 transition-opacity duration-300"
                  >
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}
                <div className="flex gap-4 pb-4" style={{
                  transform: (() => {
                    const isMobile = window.innerWidth < 640;
                    const totalCards = Math.min(10, featuredArticles?.length || 0);
                    if (isMobile) {
                      return `translateX(-${activeArticleIndex * 16}px)`;
                    }
                    const containerPx = articlesContainerWidth || window.innerWidth;
                    const activeWidthPx = Math.min(window.innerWidth * 0.55, 44 * 16);
                    const inactiveWidthPx = Math.max(120, (containerPx - activeWidthPx - 32) / 2);
                    const unitPx = inactiveWidthPx + 16;
                    const totalContentPx = activeWidthPx + (totalCards - 1) * unitPx;
                    const maxOffsetPx = Math.max(0, totalContentPx - containerPx);
                    const desiredOffsetPx = activeArticleIndex * unitPx;
                    return `translateX(-${Math.min(desiredOffsetPx, maxOffsetPx)}px)`;
                  })(),
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  {featuredArticles?.slice(0, 10).map((article, index) => {
                    const isMobile = window.innerWidth < 640;
                    const totalCards = Math.min(10, featuredArticles?.length || 0);
                    const isActive = index === activeArticleIndex;
                    const containerPx = articlesContainerWidth || window.innerWidth;
                    const activeWidthPx = Math.min(window.innerWidth * 0.55, 44 * 16);
                    const inactiveWidthPx = Math.max(120, (containerPx - activeWidthPx - 32) / 2);
                    let cardWidth: string;
                    if (isMobile) {
                      cardWidth = isActive ? `${articlesContainerWidth || window.innerWidth - 32}px` : '0px';
                    } else if (isActive) {
                      cardWidth = `${activeWidthPx}px`;
                    } else {
                      cardWidth = `${inactiveWidthPx}px`;
                    }
                    return (
                      <div
                        key={article.id}
                        className="group overflow-hidden cursor-pointer flex-shrink-0 rounded-none border border-white/10 hover:bg-white/[0.04] transition-colors duration-300 article-card flex flex-col h-[38rem]"
                        style={{
                          width: cardWidth,
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={() => {
                          if (isActive) {
                            navigate(`/blog/${article.slug}`);
                          } else {
                            setActiveArticleIndex(index);
                          }
                        }}
                        data-testid={`article-card-${article.id}`}
                      >
                        {/* Fixed-height image - not full cover */}
                        <div className="relative overflow-hidden" style={{ flex: '3' }}>
                          {(article.featuredImage || article.featuredImageData) ? (
                            <img
                              src={article.featuredImage || article.featuredImageData || ''}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              data-testid={`img-article-${article.id}`}
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5" data-testid={`img-article-${article.id}`} />
                          )}
                          <div className="absolute inset-0 bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        {/* Content below image */}
                        <div className="p-4 flex flex-col" style={{ flex: '1' }}>
                          {isActive && (
                            <TypewriterTitle
                              text={article.title}
                              className="text-xl font-sans font-light mb-2"
                            />
                          )}
                          <p className="text-muted-foreground mb-3 text-sm">
                            {article.publishedAt &&
                              new Date(article.publishedAt).toLocaleDateString(
                                language === "vi" ? "vi-VN" : "en-US",
                                { year: "numeric", month: "long", day: "numeric" },
                              )}
                          </p>
                          {isActive && (
                            <p
                              className="text-foreground/80 text-sm line-clamp-3"
                              data-testid={`text-article-excerpt-${article.id}`}
                            >
                              {article.excerpt
                                ? <FormattedText text={article.excerpt} />
                                : "Discover insights and trends in interior design..."}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      {/* Quality Materials Hero Section */}
      <section className="relative h-screen bg-black" style={{ clipPath: 'inset(0)' }}>
        <div
          className="fixed inset-0 -z-0"
          style={{
            ...(homepageContent?.quality2BackgroundImage ? { backgroundImage: `url(${homepageContent.quality2BackgroundImage})` } : {}),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative h-full flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
              {/* Left side text */}
              <TypewriterText
                text={homepageContent?.quality2LeftText || (language === "vi"
                  ? "Mỗi chi tiết được lựa chọn để nội thất phục vụ lâu dài và luôn hoàn hảo."
                  : "Each detail is selected so that the interior will serve for a long time and look impeccable.")}
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-white"
              />

              {/* Right side content */}
              <TypewriterText
                reverse
                text={homepageContent?.quality2RightText || (language === "vi"
                  ? "Chúng tôi chỉ sử dụng vật liệu chất lượng cao và đồ nội thất từ các nhà sản xuất uy tín."
                  : "We use only high-quality materials and furniture from trusted manufacturers.")}
                className="text-xl md:text-2xl font-light leading-relaxed text-white text-right"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Process Section */}
      <section
        className="min-h-screen bg-black py-16"
        onMouseEnter={handleProcessSectionMouseEnter}
        onMouseLeave={handleProcessSectionMouseLeave}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="mb-16">
            <div className="max-w-none">
              <TypewriterText
                text={language === "vi"
                  ? (homepageContent?.journeyDescriptionVi || homepageContent?.journeyDescription || "TỪ Ý TƯỞNG ĐẾN HIỆN THỰC, CHÚNG TÔI ĐỒNG HÀNH CÙNG BẠN QUA MỘT QUY TRÌNH 5 BƯỚC TINH GỌN, HIỆU QUẢ VÀ ĐẦY CẢM HỨNG.")
                  : (homepageContent?.journeyDescription || "FROM CONCEPT TO REALITY, WE GUIDE YOU THROUGH A STREAMLINED, EFFICIENT, AND INSPIRING 5-STEP PROCESS.")
                }
                className="text-2xl md:text-3xl font-light text-white leading-relaxed"
              />
            </div>
          </div>

          {/* Process Steps */}
          <div className="space-y-8">
            {journeyStepsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="pb-8 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="w-12 h-6 bg-white/10 rounded" />
                      <div className="w-64 h-8 bg-white/10 rounded" />
                    </div>
                    <div className="w-5 h-5 bg-white/10 rounded" />
                  </div>
                </div>
              ))
            ) : journeySteps && journeySteps.length > 0 ? (
              journeySteps
                .sort((a, b) => a.stepNumber - b.stepNumber)
                .map((step, index) => {
                  const isExpanded = expandedStepNumber === step.stepNumber;
                  const stepNumberPadded = step.stepNumber.toString().padStart(2, '0');
                  const title = language === 'vi' ? step.titleVi : step.titleEn;
                  const description = stepDescriptionTexts[step.id] || '';

                  return (
                    <div 
                      key={step.id} 
                      className={`pb-8 group transition-colors cursor-pointer process-step scroll-animate animate-delay-${(index + 1) * 100}`}
                      data-testid={`journey-step-${step.stepNumber}`}
                    >
                      <div
                        className="flex items-center justify-between"
                        onClick={() =>
                          setExpandedStepNumber(
                            expandedStepNumber === step.stepNumber ? null : step.stepNumber
                          )
                        }
                      >
                        <div className="flex items-center gap-3 sm:gap-8">
                          <span className="text-white/40 font-light text-lg">[{stepNumberPadded}]</span>
                          <h3 className="text-xl md:text-2xl font-light text-white">
                            {title}
                          </h3>
                        </div>
                        <ArrowRight
                          className={`w-5 h-5 text-white/40 group-hover:text-white transition-all ${
                            isExpanded ? "rotate-90 text-white" : ""
                          }`}
                        />
                      </div>

                      {/* Expandable Content */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          isExpanded
                            ? "max-h-96 opacity-100 mt-8"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="border-l-2 border-white/20 pl-8">
                          <p className="text-white/70 font-light">{description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : null}
          </div>
        </div>
      </section>
      {/* Why Choose Us Section */}
      <section className="min-h-screen bg-black py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-16">
            <TypewriterText
              as="h3"
              text={language === "vi"
                ? (homepageContent?.advantagesSubtitleVi || homepageContent?.advantagesSubtitle || "Tại sao chọn IEVRA Design & Build")
                : (homepageContent?.advantagesSubtitle || "Why Choose IEVRA Design & Build")
              }
              className="text-3xl md:text-4xl font-light text-white"
            />
          </div>

          {/* Advantages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 items-stretch">
            {advantagesLoading ? (
              // Loading skeleton
              (Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="w-16 h-16 bg-white/10 rounded mb-6" />
                  <div className="h-6 bg-white/10 rounded mb-4" />
                  <div className="h-24 bg-white/10 rounded" />
                </div>
              )))
            ) : advantages.length > 0 ? (
              // Dynamic advantages from API
              (advantages
                .sort((a: any, b: any) => a.order - b.order)
                .map((advantage: any, index: number) => {
                  // Dynamic icon rendering
                  const IconComponent = advantage.icon === 'Sparkles' ? Sparkles :
                    advantage.icon === 'Headset' ? Headset :
                    advantage.icon === 'Users' ? Users :
                    advantage.icon === 'Store' ? Store :
                    Sparkles; // Default fallback

                  const title = language === "vi" ? advantage.titleVi : advantage.titleEn;
                  const description = language === "vi" ? advantage.descriptionVi : advantage.descriptionEn;

                  return (
                    <div 
                      key={advantage.id} 
                      className="group advantage-card scroll-animate transition-all duration-500 ease-out hover:-translate-y-3 hover:scale-95 hover:shadow-2xl hover:shadow-white/10 p-6 rounded-none h-full flex flex-col"
                      data-testid={`advantage-card-${index + 1}`}
                    >
                      <div className="mb-6 flex-shrink-0">
                        <div className="w-16 h-16 flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-white/40 group-hover:text-white transition-colors duration-300" />
                        </div>
                      </div>
                      <h4 className="text-lg font-light text-white/60 group-hover:text-white mb-4 uppercase tracking-wide transition-colors duration-300 flex-shrink-0 min-h-[3.5rem]">
                        {title}
                      </h4>
                      <p className="text-white/50 group-hover:text-white/90 font-light text-sm leading-relaxed transition-colors duration-300 flex-1">
                        {description}
                      </p>
                    </div>
                  );
                }))
            ) : null}
          </div>
        </div>
      </section>
      {/* Stats Section */}
      {homepageContent && [(homepageContent as any).statsProjectsValue, (homepageContent as any).statsClientsValue, (homepageContent as any).statsAwardsValue, (homepageContent as any).statsExperienceValue].some(Boolean) && (
        <section className="bg-black py-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
              {[
                { value: (homepageContent as any).statsProjectsValue, labelEn: (homepageContent as any).statsProjectsLabelEn, labelVi: (homepageContent as any).statsProjectsLabelVi },
                { value: (homepageContent as any).statsClientsValue, labelEn: (homepageContent as any).statsClientsLabelEn, labelVi: (homepageContent as any).statsClientsLabelVi },
                { value: (homepageContent as any).statsAwardsValue, labelEn: (homepageContent as any).statsAwardsLabelEn, labelVi: (homepageContent as any).statsAwardsLabelVi },
                { value: (homepageContent as any).statsExperienceValue, labelEn: (homepageContent as any).statsExperienceLabelEn, labelVi: (homepageContent as any).statsExperienceLabelVi },
              ].filter(s => s.value).map((stat, i) => (
                <div key={i} className="space-y-3">
                  <p className="text-6xl md:text-7xl lg:text-8xl font-light text-white tracking-tight">{stat.value}</p>
                  <p className="text-sm font-light text-white/50 uppercase tracking-widest">
                    {language === 'vi' ? (stat.labelVi || stat.labelEn) : (stat.labelEn || stat.labelVi)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Partners Section */}
      <section className="min-h-screen bg-black overflow-hidden py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex justify-end">
            <div className="max-w-none">
              <TypewriterText
                reverse
                text={language === "vi"
                  ? (homepageContent?.partnersSubtitleVi || homepageContent?.partnersSubtitle || "Chúng tôi tự hào hợp tác với những thương hiệu uy tín hàng đầu, mang đến những sản phẩm và dịch vụ chất lượng cao nhất cho khách hàng.")
                  : (homepageContent?.partnersSubtitle || "We are proud to work with leading prestigious brands, bringing the highest quality products and services to our clients.")}
                className="text-2xl md:text-3xl font-light text-foreground leading-relaxed text-right"
              />
            </div>
          </div>
        </div>

        {partners && partners.length > 0 && (() => {
          const row1 = partners.slice(0, 12);
          const row2 = partners.slice(12, 24);

          const renderRow = (logos: typeof partners, direction: 'right' | 'left', rowKey: string, duration: number) => {
            if (logos.length === 0) return null;
            const doubled = [...logos, ...logos];
            return (
              <div className="relative overflow-hidden w-full">
                <div
                  className={`flex w-max ${direction === 'right' ? 'animate-scroll-right-seamless' : 'animate-scroll-left-seamless'}`}
                  style={{ animationDuration: `${duration}s` }}
                >
                  {doubled.map((partner, i) => {
                    const shape = partner.shape || 'landscape';
                    const widthClass = shape === 'portrait' ? 'w-[100px]' : shape === 'square' ? 'w-[140px]' : 'w-[220px]';
                    return (
                    <div
                      key={`${rowKey}-${i}`}
                      className={`flex-shrink-0 ${widthClass} h-28 flex items-center justify-center px-3 overflow-hidden`}
                      data-testid={i < logos.length ? `partner-logo-${rowKey}-${partner.id}` : undefined}
                    >
                      <img
                        src={partner.logoData || partner.logo || ""}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
                        style={{
                          transform: `translate(${partner.logoOffsetX ?? 0}px, ${partner.logoOffsetY ?? 0}px) scale(${partner.logoZoom ?? 1})`,
                          transformOrigin: 'center',
                        }}
                      />
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          };

          const baseDuration = 60;
          const row2Duration = row1.length > 0 ? Math.round(baseDuration * row2.length / row1.length) : baseDuration;
          return (
            <div className="space-y-8">
              {renderRow(row1, 'right', 'row1', baseDuration)}
              {row2.length > 0 && renderRow(row2, 'left', 'row2', row2Duration)}
            </div>
          );
        })()}

        {partnersLoading && (
          <div className="space-y-8">
            {/* Loading skeleton for partners */}
            {[1, 2].map((row) => (
              <div key={row} className="flex justify-center">
                <div className="flex space-x-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="w-48 h-24 bg-white/10 rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* Quick Contact Section */}
      <section className="min-h-screen bg-black py-16">
        <div
          className="w-full px-4 sm:px-6 lg:px-8"
          onMouseEnter={handleContactMouseEnter}
          onMouseLeave={handleContactMouseLeave}
        >
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="max-w-none">
                <TypewriterText
                  text={language === "vi"
                    ? (homepageContent?.ctaSubtitleVi || homepageContent?.ctaSubtitle || "Để lại yêu cầu tư vấn miễn phí và chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.")
                    : (homepageContent?.ctaSubtitle || "Leave a request for a free consultation and we will contact you as soon as possible.")
                  }
                  className="text-2xl md:text-3xl font-light text-foreground leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setContactFormExpanded(!contactFormExpanded)}
            className="flex items-center gap-4 group transition-all duration-300 scroll-animate"
            data-testid="button-toggle-form"
          >
            <span className="text-xl font-light tracking-widest uppercase">
              {language === "vi" ? "GỬI YÊU CẦU" : "LEAVE A REQUEST"}
            </span>
            <div
              className={`transition-transform duration-300 ${contactFormExpanded ? "rotate-90" : "rotate-0"}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>

          {/* Expandable Form */}
          <div
            className={`overflow-hidden transition-all duration-1000 ease-in-out ${
              contactFormExpanded
                ? "max-h-[800px] opacity-100 mt-8"
                : "max-h-0 opacity-0"
            }`}
          >
            <form onSubmit={handleSubmit} className="max-w-3xl">
              <div className="space-y-4">
                {/* First row - Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder={placeholders.name}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder={placeholders.email}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                {/* Second row - Phone and Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="tel"
                      placeholder={placeholders.phone}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder={placeholders.address}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                      data-testid="input-address"
                    />
                  </div>
                </div>

                {/* Third row - Project Type */}
                <div>
                  <Input
                    type="text"
                    placeholder={placeholders.projectType}
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        projectType: e.target.value,
                      }))
                    }
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                    data-testid="input-project-type"
                  />
                </div>

                {/* Fourth row - Requirements */}
                <div>
                  <Textarea
                    placeholder={placeholders.requirements}
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        requirements: e.target.value,
                      }))
                    }
                    className="bg-transparent border border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0 min-h-[120px] resize-none"
                    data-testid="textarea-requirements"
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-start pt-6">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-transparent border border-white/30 text-white hover:border-white hover:bg-white/10 px-8 py-3 font-light tracking-widest uppercase transition-all duration-300 ease-in-out rounded-none"
                    data-testid="button-leave-request"
                  >
                    {mutation.isPending
                      ? language === "vi"
                        ? "ĐANG GỬI..."
                        : "SENDING..."
                      : language === "vi"
                        ? "GỬI YÊU CẦU"
                        : "LEAVE A REQUEST"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
      {/* FAQ Section */}
      <section
        className="min-h-screen bg-black py-16"
        onMouseEnter={handleFaqSectionMouseEnter}
        onMouseLeave={handleFaqSectionMouseLeave}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="mb-16">
            <div className="max-w-none">
              <TypewriterText
                reverse
                text={language === "vi"
                  ? (homepageContent?.faqSectionSubtitleVi || homepageContent?.faqSectionSubtitle || "TÌM HIỂU THÊM VỀ QUY TRÌNH THIẾT KẾ VÀ DỊCH VỤ CỦA CHÚNG TÔI.")
                  : (homepageContent?.faqSectionSubtitle || "LEARN MORE ABOUT OUR DESIGN PROCESS AND SERVICES.")}
                className="text-2xl md:text-3xl font-light text-white leading-relaxed text-right"
              />
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-8">
            {faqsLoading ? (
              <div className="text-white/50 text-center py-8">
                Loading FAQs...
              </div>
            ) : faqsError ? (
              <div className="text-red-500 text-center py-8">
                Error loading FAQs
              </div>
            ) : faqs.length === 0 ? null : (
              faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="pb-8 group transition-colors cursor-pointer scroll-animate"
                  data-testid={`faq-item-${index + 1}`}
                >
                  <div
                    className="flex items-center justify-between"
                    onClick={() =>
                      setExpandedFaqIndex(
                        expandedFaqIndex === index ? null : index,
                      )
                    }
                  >
                    <div className="flex items-center gap-3 sm:gap-8">
                      <span className="text-white/40 font-light text-lg">
                        [{String(index + 1).padStart(2, "0")}]
                      </span>
                      <h3 className="text-xl md:text-2xl font-light text-white">
                        {faq.question}
                      </h3>
                    </div>
                    <ArrowRight
                      className={`w-5 h-5 text-white/40 group-hover:text-white transition-all ${
                        expandedFaqIndex === index ? "rotate-90 text-white" : ""
                      }`}
                    />
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      expandedFaqIndex === index
                        ? "max-h-96 opacity-100 mt-8"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="border-l-2 border-white/20 pl-8">
                      <p className="text-white/70 font-light">
                        {faqAnswerTexts[faq.id] || ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
