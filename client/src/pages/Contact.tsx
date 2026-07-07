import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePageMeta, CANONICAL_BASE_URL } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertInquirySchema, type InsertInquiry } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight } from "lucide-react";

export default function Contact() {
  const { t, language } = useLanguage();
  const [location] = useLocation();
  usePageMeta({
    canonical: `${CANONICAL_BASE_URL}${location}`,
    hreflang: [
      { lang: "vi", href: `${CANONICAL_BASE_URL}/lien-he` },
      { lang: "en", href: `${CANONICAL_BASE_URL}/contact` },
      { lang: "x-default", href: `${CANONICAL_BASE_URL}/lien-he` },
    ],
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    budget: '',
    projectType: '',
    requirements: ''
  });
  const { toast } = useToast();
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  
  // Typing animation for placeholders
  const [placeholders, setPlaceholders] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    budget: '',
    projectType: '',
    requirements: ''
  });

  // Typing animation for FAQ answers
  const [faqAnswerTexts, setFaqAnswerTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const texts = {
      name: t('contact.form.name'),
      email: t('contact.form.email'),
      phone: t('contact.form.phone'),
      address: t('contact.form.address'),
      budget: language === 'vi' ? 'Ngân sách cải tạo (VNĐ)' : 'Renovation budget (VND)',
      projectType: language === 'vi' ? 'Loại hình (VD: Căn hộ, Nhà hàng, Quán CF...)' : 'Project type (e.g. Apartment, Restaurant, Cafe...)',
      requirements: t('contact.form.requirements')
    };

    const delays = {
      name: 0,
      email: 200,
      phone: 400,
      address: 600,
      budget: 800,
      projectType: 1000,
      requirements: 1200
    };

    const timeouts: NodeJS.Timeout[] = [];
    const intervals: NodeJS.Timeout[] = [];

    const typeText = (field: keyof typeof texts, text: string, delay: number) => {
      const timeout = setTimeout(() => {
        let index = 0;
        const interval = setInterval(() => {
          if (index <= text.length) {
            setPlaceholders(prev => ({ ...prev, [field]: text.slice(0, index) }));
            index++;
          } else {
            clearInterval(interval);
          }
        }, 50);
        intervals.push(interval);
      }, delay);
      timeouts.push(timeout);
    };

    typeText('name', texts.name, delays.name);
    typeText('email', texts.email, delays.email);
    typeText('phone', texts.phone, delays.phone);
    typeText('address', texts.address, delays.address);
    typeText('budget', texts.budget, delays.budget);
    typeText('projectType', texts.projectType, delays.projectType);
    typeText('requirements', texts.requirements, delays.requirements);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [t]);

  // Fetch FAQs from database
  const { data: homepageContent } = useQuery<any>({
    queryKey: ['/api/homepage-content'],
  });

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
    }, 20);

    return () => clearInterval(interval);
  }, [expandedFaqIndex]);

  const mutation = useMutation({
    mutationFn: async (data: InsertInquiry) => {
      return await apiRequest('POST', '/api/inquiries', data);
    },
    onSuccess: () => {
      toast({
        title: t('contact.form.success'),
        description: t('contact.form.successDesc')
      });
      setFormData({ name: '', email: '', phone: '', address: '', budget: '', projectType: '', requirements: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
    onError: () => {
      toast({
        title: t('contact.form.error'),
        description: t('contact.form.errorDesc'),
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: t('contact.form.error'),
        description: t('contact.form.required'),
        variant: "destructive"
      });
      return;
    }

    const inquiryData = {
      firstName: formData.name.split(' ')[0] || formData.name,
      lastName: formData.name.split(' ').slice(1).join(' ') || '',
      email: formData.email || undefined,
      phone: formData.phone,
      projectType: formData.projectType || undefined,
      budget: formData.budget || undefined,
      message: `${formData.address ? (language === 'vi' ? 'Địa chỉ' : 'Address') + ': ' + formData.address + '\n\n' : ''}${formData.requirements || ''}`
    };

    mutation.mutate(inquiryData);
  };

  const inputCls = "w-full bg-transparent border-0 border-b border-white/15 rounded-none px-0 py-4 text-sm font-light text-white placeholder-white/30 focus:border-white/60 focus-visible:ring-0 transition-colors duration-300 outline-none";

  return (
    <div className="bg-black text-white">

      {/* ── Hero + Form Section ── */}
      <section className="pt-36 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-[11px] uppercase tracking-widest font-light text-white/30">
            <Link href={language === 'vi' ? '/' : '/en'} className="hover:text-white/60 transition-colors duration-200">
              {language === 'vi' ? 'Trang Chủ' : 'Home'}
            </Link>
            <span>›</span>
            <span className="text-white/50">{language === 'vi' ? 'Liên Hệ' : 'Contact'}</span>
          </div>

          {/* Top label */}
          <p className="text-xs uppercase tracking-[0.22em] font-light text-white/35 mb-10" data-testid="heading-questions">
            {language === 'vi' ? 'Tư vấn & Liên hệ' : 'Consultation & Contact'}
          </p>

          {/* 2-col layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* Left — intro */}
            <div className="lg:sticky lg:top-32">
              <h1 className="text-4xl md:text-5xl font-light leading-[1.15] tracking-tight mb-10" data-testid="text-consultation">
                {t('contact.title')}
              </h1>

              {/* Quick contact links */}
              <div className="border-t border-white/10 pt-8 space-y-1.5">
                <a href="tel:0767554480" className="block text-sm font-light text-white/50 hover:text-white transition-colors">0767 5544 80</a>
                <a href="mailto:contact@ievra.com" className="block text-sm font-light text-white/50 hover:text-white transition-colors">contact@ievra.com</a>
              </div>
            </div>

            {/* Right — form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <div>
                    <Input
                      type="text"
                      placeholder={placeholders.name}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={inputCls}
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder={placeholders.phone}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={inputCls}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <div>
                    <Input
                      type="email"
                      placeholder={placeholders.email}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={inputCls}
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder={placeholders.address}
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className={inputCls}
                      data-testid="input-address"
                    />
                  </div>
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder={placeholders.projectType}
                    value={formData.projectType}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                    className={inputCls}
                    data-testid="input-project-type"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder={placeholders.requirements}
                    value={formData.requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    className={`${inputCls} border border-white/10 border-x-0 border-t-0 min-h-[140px] resize-none`}
                    data-testid="textarea-requirements"
                  />
                </div>
                <div className="pt-10 flex items-center justify-between">
                  <p className="text-xs font-light text-white/25 max-w-[220px] leading-relaxed">
                    {language === 'vi'
                      ? 'Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.'
                      : 'We will respond within 24 business hours.'}
                  </p>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-transparent border border-white/20 text-white hover:border-white/60 hover:bg-white/5 px-8 py-3 font-light text-xs tracking-[0.2em] uppercase transition-all duration-300 rounded-none shrink-0 ml-6"
                    data-testid="button-leave-request"
                  >
                    {mutation.isPending
                      ? (language === 'vi' ? 'Đang gửi...' : 'Sending...')
                      : (language === 'vi' ? 'Gửi yêu cầu' : 'Send Request')}
                  </Button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-20 lg:py-28 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.2em] font-light text-white/30 mb-6">FAQ</p>
            <p className="text-2xl md:text-3xl font-light text-white leading-relaxed max-w-2xl">
              {language === 'vi'
                ? (homepageContent?.faqSectionSubtitleVi || homepageContent?.faqSectionSubtitle || '')
                : (homepageContent?.faqSectionSubtitle || '')}
            </p>
          </div>

          <div className="border-t border-white/10">
            {faqsLoading ? (
              <div className="text-white/30 text-sm font-light py-12">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
            ) : faqsError ? (
              <div className="text-red-500/60 text-sm font-light py-12">Error loading FAQs</div>
            ) : faqs.length === 0 ? null : (
              faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="border-b border-white/10 group cursor-pointer"
                  data-testid={`faq-item-${index + 1}`}
                >
                  <div
                    className="flex items-center justify-between py-7 gap-6"
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === index ? null : index)}
                  >
                    <div className="flex items-start gap-6 sm:gap-10">
                      <span className="text-xs font-light text-white/25 tabular-nums shrink-0 mt-1">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-base sm:text-lg md:text-xl font-light text-white/85 group-hover:text-white transition-colors leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 text-white/25 group-hover:text-white/60 shrink-0 transition-all duration-300 ${expandedFaqIndex === index ? "rotate-90 text-white/60" : ""}`}
                    />
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedFaqIndex === index ? "max-h-96 opacity-100 pb-8" : "max-h-0 opacity-0"}`}
                  >
                    <p className="text-sm font-light text-white/55 leading-relaxed ml-0 sm:ml-[3.75rem] max-w-2xl">
                      {faqAnswerTexts[faq.id] || ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Footer info ── */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] font-light text-white/30 mb-4">
                {language === 'vi' ? 'Pháp nhân' : 'Legal Entity'}
              </p>
              <p className="text-sm font-light text-white/75 leading-relaxed mb-1">
                {language === 'vi'
                  ? 'CÔNG TY TNHH THIẾT KẾ VÀ THI CÔNG NỘI THẤT IEVRA'
                  : 'IEVRA INTERIOR DESIGN AND CONSTRUCTION CO., LTD'}
              </p>
              <p className="text-sm font-light text-white/40">MST: 0319384424</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] font-light text-white/30 mb-4">
                {language === 'vi' ? 'Liên hệ' : 'Contact'}
              </p>
              <div className="space-y-1">
                <p className="text-sm font-light text-white/60">contact@ievra.com</p>
                <p className="text-sm font-light text-white/60">0767 5544 80</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] font-light text-white/30 mb-4">
                {language === 'vi' ? 'Văn phòng' : 'Offices'}
              </p>
              <div className="space-y-2">
                <p className="text-sm font-light text-white/60 leading-relaxed">
                  {language === 'vi' ? '422 Đào Trí, P. Phú Thuận, Q. 7, TP.HCM' : '422 Dao Tri, Phu Thuan, Dist. 7, HCMC'}
                </p>
                <p className="text-sm font-light text-white/60 leading-relaxed">
                  {language === 'vi' ? '9 Nguyễn Khoái, P. 2, Q. 4, TP.HCM' : '9 Nguyen Khoai, Ward 2, Dist. 4, HCMC'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}