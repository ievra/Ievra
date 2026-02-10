import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
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

export default function Home() {
  const [, navigate] = useLocation();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(true);
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
    requirements: "",
  });

  // Typing animation for form placeholders
  const [placeholders, setPlaceholders] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
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
        requirements: "",
      });
      return;
    }

    const texts = {
      name: language === "vi" ? "Họ và tên" : "Name",
      email: "E-mail",
      phone: language === "vi" ? "Điện thoại" : "Phone",
      address: language === "vi" ? "Địa chỉ" : "Address",
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
      requirements: 800,
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
    queryKey: ["/api/projects", "featured"],
    queryFn: async () => {
      const response = await fetch(`/api/projects?featured=true`);
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

  // Controlled loading animation
  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds total loading time

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      setLoadingProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        // Wait a bit then hide loading screen
        setTimeout(() => {
          setShowLoading(false);
        }, 300);
      }
    }, 16); // 60fps for smoother animation

    return () => clearInterval(interval);
  }, []);

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
      message: `Address: ${formData.address}\n\nRequirements: ${formData.requirements}`,
    };

    mutation.mutate(inquiryData);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Full Screen Loading Overlay */}
      {showLoading && (
        <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[9999]">
          <div className="text-center">
            <div className="mb-8">
              <img
                src="/api/assets/logo.white.png"
                alt="IEVRA Design & Build"
                className="h-24 md:h-32 w-auto mx-auto"
              />
            </div>
            <div className="w-80 mx-auto">
              <Progress value={loadingProgress} className="h-1 bg-white/20" />
            </div>
          </div>
        </div>
      )}
      {/* Hero Slider Section - IIDA Style */}
      <HeroSlider projects={featuredProjects || []} />
      {/* Featured Projects Section */}
      <section id="featured-projects" className="py-16 bg-card">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-sm font-light tracking-widest text-muted-foreground uppercase scroll-animate">
                {language === "vi" 
                  ? (homepageContent?.featuredBadgeVi || homepageContent?.featuredBadge || t("featured.projectsTitle"))
                  : (homepageContent?.featuredBadge || t("featured.projectsTitle"))
                }
              </h2>
            </div>
            <div className="flex items-start justify-between">
              <div className="max-w-4xl">
                <p className="text-2xl md:text-3xl font-light text-foreground leading-relaxed scroll-animate">
                  {language === "vi"
                    ? (homepageContent?.featuredDescriptionVi || homepageContent?.featuredDescription || t("featured.projectsDesc"))
                    : (homepageContent?.featuredDescription || t("featured.projectsDesc"))
                  }
                </p>
              </div>
              <div className="flex-shrink-0 ml-8">
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden cursor-pointer h-[28rem] w-72 flex-shrink-0 rounded-none"
                  >
                    <div className="animate-pulse bg-white/10 h-full w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Projects Grid - 5 columns visible, scroll to see up to 10 */}
              <ScrollableContainer>
                <div
                  className="flex gap-4 pb-4"
                  style={{ width: "max-content" }}
                >
                  {featuredProjects?.slice(0, 10).map((project, index) => (
                    <div
                      key={project.id}
                      className="group relative overflow-hidden cursor-pointer h-[28rem] w-72 flex-shrink-0 rounded-none project-card"
                      onClick={() => navigate(project.slug ? `/portfolio/${project.slug}` : `/project/${project.id}`)}
                    >
                      <img
                        src={
                          (Array.isArray(project.images) &&
                            project.images[0]) ||
                          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                        }
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        data-testid={`img-project-${project.id}`}
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />

                      {/* Content Overlay */}
                      <div className="absolute inset-0 p-6 pb-12 flex flex-col justify-between">
                        {/* Top - Title and Area */}
                        <div>
                          <h3
                            className="text-white text-xl font-light mb-2"
                            data-testid={`text-title-${project.id}`}
                          >
                            {project.title}
                          </h3>
                          <p
                            className="text-white/80 text-sm uppercase tracking-wide mb-1"
                            data-testid={`text-category-${project.id}`}
                          >
                            {getCategoryLabel(project.category)}
                          </p>
                          {project.area && (
                            <p className="text-white/60 text-xs" data-testid={`text-area-${project.id}`}>
                              {project.area}
                            </p>
                          )}
                        </div>

                        {/* Bottom - Year and Duration */}
                        {(project.duration || project.completionYear) && (
                          <div className="grid grid-cols-2 gap-4 text-white">
                            {project.completionYear && (
                              <div>
                                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                                  {language === "vi" ? "Năm" : "Year"}
                                </p>
                                <p className="text-sm font-light" data-testid={`text-year-${project.id}`}>
                                  {project.completionYear}
                                </p>
                              </div>
                            )}
                            {project.duration && (
                              <div>
                                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                                  {language === "vi" ? "Thời gian" : "Duration"}
                                </p>
                                <p className="text-sm font-light" data-testid={`text-duration-${project.id}`}>
                                  {project.duration}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollableContainer>
            </>
          )}
        </div>
      </section>
      {/* Quality Hero Section */}
      <section className="relative h-[70vh] min-h-[600px] overflow-hidden scroll-animate">
        <img
          src={homepageContent?.qualityBackgroundImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"}
          alt="Quality Interior Design"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
        <div className="relative h-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 w-full items-center">
            <div className="text-white space-y-6 scroll-animate">
              <p className="md:text-5xl font-light text-[36px]">
                {homepageContent?.qualityLeftText || (language === "vi"
                  ? "Mỗi chi tiết được lựa chọn để nội thất phục vụ lâu dài và trông hoàn hảo."
                  : "Each detail is selected so that the interior will serve for a long time and look impeccable.")}
              </p>
            </div>
            <div className="text-white space-y-6 scroll-animate-right">
              <p className="text-xl md:text-2xl font-light leading-relaxed">
                {homepageContent?.qualityRightText || (language === "vi"
                  ? "Chúng tôi chỉ sử dụng vật liệu và nội thất chất lượng cao từ các nhà sản xuất đáng tin cậy."
                  : "We use only high-quality materials and furniture from trusted manufacturers.")}
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Featured News Section */}
      <section id="featured-news" className="py-16 bg-background">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-sm font-light tracking-widest text-muted-foreground uppercase scroll-animate">
                {language === "vi"
                  ? (homepageContent?.featuredNewsTitleVi || homepageContent?.featuredNewsTitle || t("featured.newsTitle"))
                  : (homepageContent?.featuredNewsTitle || t("featured.newsTitle"))
                }
              </h2>
            </div>
            <div className="flex items-start justify-between">
              <div className="max-w-4xl">
                <p className="text-2xl md:text-3xl font-light text-foreground leading-relaxed scroll-animate">
                  {language === "vi"
                    ? (homepageContent?.featuredNewsSubtitleVi || homepageContent?.featuredNewsSubtitle || t("featured.newsDesc"))
                    : (homepageContent?.featuredNewsSubtitle || t("featured.newsDesc"))
                  }
                </p>
              </div>
              <div className="flex-shrink-0 ml-8">
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
                    className="overflow-hidden h-[28rem] w-72 flex-shrink-0 rounded-none"
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
              {/* Scrollable Articles Grid - 5 columns visible, scroll to see up to 10 */}
              <ScrollableContainer>
                <div
                  className="flex gap-4 pb-4"
                  style={{ width: "max-content" }}
                >
                  {featuredArticles?.slice(0, 10).map((article, index) => (
                    <Card
                      key={article.id}
                      className="group overflow-hidden cursor-pointer h-[28rem] w-72 flex-shrink-0 rounded-none article-card"
                      onClick={() => navigate(`/blog/${article.slug}`)}
                    >
                      <div className="relative">
                        {(article.featuredImage || article.featuredImageData) ? (
                          <img
                            src={article.featuredImage || article.featuredImageData || ''}
                            alt={article.title}
                            className="w-full h-48 object-cover"
                            data-testid={`img-article-${article.id}`}
                          />
                        ) : (
                          <div className="w-full h-48 bg-black flex items-center justify-center">
                            <div className="text-6xl font-sans font-light text-primary/30">N</div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <CardContent className="p-6">
                        <h3
                          className="text-xl font-sans font-light mb-2 line-clamp-2"
                          data-testid={`text-article-title-${article.id}`}
                        >
                          {article.title}
                        </h3>
                        <p className="text-muted-foreground mb-3 text-sm">
                          {article.publishedAt &&
                            new Date(article.publishedAt).toLocaleDateString(
                              language === "vi" ? "vi-VN" : "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                        </p>
                        <p
                          className="text-foreground/80 text-sm line-clamp-3"
                          data-testid={`text-article-excerpt-${article.id}`}
                        >
                          {article.excerpt 
                            ? <FormattedText text={article.excerpt} />
                            : "Discover insights and trends in interior design..."}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollableContainer>
            </>
          )}
        </div>
      </section>
      {/* Quality Materials Hero Section */}
      <section className="relative h-[70vh] bg-black overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: homepageContent?.quality2BackgroundImage 
              ? `url(${homepageContent.quality2BackgroundImage})`
              : 'url("/api/assets/stock_images/contemporary_bedroom_e9bd2ed1.jpg")',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative h-full flex items-center">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
              {/* Left side text */}
              <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-white scroll-animate">
                {homepageContent?.quality2LeftText || (language === "vi"
                  ? "Mỗi chi tiết được lựa chọn để nội thất phục vụ lâu dài và luôn hoàn hảo."
                  : "Each detail is selected so that the interior will serve for a long time and look impeccable.")}
              </p>

              {/* Right side content */}
              <p className="text-xl md:text-2xl font-light leading-relaxed text-white scroll-animate-right">
                {homepageContent?.quality2RightText || (language === "vi"
                  ? "Chúng tôi chỉ sử dụng vật liệu chất lượng cao và đồ nội thất từ các nhà sản xuất uy tín."
                  : "We use only high-quality materials and furniture from trusted manufacturers.")}
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Process Section */}
      <section
        className="py-16 bg-black"
        onMouseEnter={handleProcessSectionMouseEnter}
        onMouseLeave={handleProcessSectionMouseLeave}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="mb-16">
            <h2 className="text-sm font-light tracking-widest text-white/60 mb-8 scroll-animate">
              {language === "vi"
                ? (homepageContent?.journeyTitleVi || homepageContent?.journeyTitle || "HÀNH TRÌNH KIẾN TẠO KHÔNG GIAN SỐNG CỦA BẠN")
                : (homepageContent?.journeyTitle || "THE JOURNEY TO YOUR DREAM SPACE")
              }
            </h2>
            <div className="max-w-4xl">
              <p className="text-2xl md:text-3xl font-light text-white leading-relaxed scroll-animate">
                {language === "vi"
                  ? (homepageContent?.journeyDescriptionVi || homepageContent?.journeyDescription || "TỪ Ý TƯỞNG ĐẾN HIỆN THỰC, CHÚNG TÔI ĐỒNG HÀNH CÙNG BẠN QUA MỘT QUY TRÌNH 5 BƯỚC TINH GỌN, HIỆU QUẢ VÀ ĐẦY CẢM HỨNG.")
                  : (homepageContent?.journeyDescription || "FROM CONCEPT TO REALITY, WE GUIDE YOU THROUGH A STREAMLINED, EFFICIENT, AND INSPIRING 5-STEP PROCESS.")
                }
              </p>
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
                        <div className="flex items-center gap-8">
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
      <section className="py-8 bg-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-16">
            <h2 className="text-sm font-light tracking-widest text-muted-foreground uppercase mb-4 scroll-animate">
              {language === "vi"
                ? (homepageContent?.advantagesTitleVi || homepageContent?.advantagesTitle || "LỢI THẾ CẠNH TRANH")
                : (homepageContent?.advantagesTitle || "ADVANTAGES")
              }
            </h2>
            <h3 className="text-3xl md:text-4xl font-light text-white scroll-animate">
              {language === "vi"
                ? (homepageContent?.advantagesSubtitleVi || homepageContent?.advantagesSubtitle || "Tại sao chọn IEVRA Design & Build")
                : (homepageContent?.advantagesSubtitle || "Why Choose IEVRA Design & Build")
              }
            </h3>
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
            ) : (
              // Fallback if no advantages available
              (<div className="col-span-full text-center text-white/50 py-8">No advantages available
                              </div>)
            )}
          </div>
        </div>
      </section>
      {/* Partners Section */}
      <section className="py-16 bg-black overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="mb-8">
            <h2 className="text-sm font-light tracking-widest text-muted-foreground uppercase scroll-animate">
              {language === "vi"
                ? (homepageContent?.partnersTitleVi || homepageContent?.partnersTitle || "ĐỐI TÁC CỦA CHÚNG TÔI")
                : (homepageContent?.partnersTitle || "OUR PARTNERS")
              }
            </h2>
          </div>
          <div className="flex items-start justify-between">
            <div className="max-w-4xl">
              <p
                className="text-2xl md:text-3xl font-light text-foreground leading-relaxed scroll-animate"
                data-testid="text-partners-description"
              >
                {language === "vi"
                  ? "Chúng tôi tự hào hợp tác với những thương hiệu uy tín hàng đầu, mang đến những sản phẩm và dịch vụ chất lượng cao nhất cho khách hàng."
                  : "We are proud to work with leading prestigious brands, bringing the highest quality products and services to our clients."}
              </p>
            </div>
          </div>
        </div>

        {partners && partners.length > 0 && (
          <div className="space-y-8">
            {/* First row - scrolling right */}
            <div className="relative overflow-hidden">
              <div className="inline-flex animate-scroll-right-seamless">
                {/* Create multiple copies for seamless infinite loop */}
                {Array.from({ length: 20 }).flatMap((_, setIndex) =>
                  partners
                    .slice(0, Math.ceil(partners.length / 2))
                    .map((partner) => (
                      <div
                        key={`row1-${setIndex}-${partner.id}`}
                        className="flex-shrink-0 w-48 h-24 mx-4 flex items-center justify-center"
                        data-testid={`partner-logo-row1-${partner.id}`}
                      >
                        <img
                          src={partner.logoData || partner.logo || ""}
                          alt={partner.name}
                          className="max-w-full max-h-full object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
                        />
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Second row - scrolling left */}
            <div className="relative overflow-hidden">
              <div className="inline-flex animate-scroll-left-seamless">
                {/* Create multiple copies for seamless infinite loop */}
                {Array.from({ length: 20 }).flatMap((_, setIndex) =>
                  partners
                    .slice(Math.ceil(partners.length / 2))
                    .map((partner) => (
                      <div
                        key={`row2-${setIndex}-${partner.id}`}
                        className="flex-shrink-0 w-48 h-24 mx-4 flex items-center justify-center"
                        data-testid={`partner-logo-row2-${partner.id}`}
                      >
                        <img
                          src={partner.logoData || partner.logo || ""}
                          alt={partner.name}
                          className="max-w-full max-h-full object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
                        />
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

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
      <section className="py-16 bg-black">
        <div
          className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8"
          onMouseEnter={handleContactMouseEnter}
          onMouseLeave={handleContactMouseLeave}
        >
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-sm font-light tracking-widest text-muted-foreground uppercase scroll-animate">
                {language === "vi"
                  ? (homepageContent?.faqSectionTitleVi || homepageContent?.faqSectionTitle || "CÓ THẮC MẮC GÌ KHÔNG?")
                  : (homepageContent?.faqSectionTitle || "HAVE ANY QUESTIONS?")
                }
              </h2>
            </div>
            <div className="flex items-start justify-between">
              <div className="max-w-4xl">
                <p
                  className="text-2xl md:text-3xl font-light text-foreground leading-relaxed scroll-animate"
                  data-testid="text-consultation"
                >
                  {language === "vi"
                    ? (homepageContent?.ctaSubtitleVi || homepageContent?.ctaSubtitle || "Để lại yêu cầu tư vấn miễn phí và chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.")
                    : (homepageContent?.ctaSubtitle || "Leave a request for a free consultation and we will contact you as soon as possible.")
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setContactFormExpanded(!contactFormExpanded)}
            className="flex items-center gap-4 group transition-all duration-300 view-more-btn scroll-animate"
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
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
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

                {/* Third row - Requirements */}
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
        className="py-16 bg-black"
        onMouseEnter={handleFaqSectionMouseEnter}
        onMouseLeave={handleFaqSectionMouseLeave}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="mb-16">
            <h2 className="text-sm font-light tracking-widest text-white/60 mb-8 scroll-animate">
              {language === "vi"
                ? (homepageContent?.faqSectionTitleVi || homepageContent?.faqSectionTitle || "CÂU HỎI THƯỜNG GẶP")
                : (homepageContent?.faqSectionTitle || "FREQUENTLY ASKED QUESTIONS")
              }
            </h2>
            <div className="max-w-4xl">
              <p className="text-2xl md:text-3xl font-light text-white leading-relaxed scroll-animate">
                {language === "vi"
                  ? "TÌM HIỂU THÊM VỀ QUY TRÌNH THIẾT KẾ VÀ DỊCH VỤ CỦA CHÚNG TÔI."
                  : "LEARN MORE ABOUT OUR DESIGN PROCESS AND SERVICES."}
              </p>
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
            ) : faqs.length === 0 ? (
              <div className="text-white/50 text-center py-8">
                No FAQs available
              </div>
            ) : (
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
                    <div className="flex items-center gap-8">
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
