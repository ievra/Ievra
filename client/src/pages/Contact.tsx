import { useState, useEffect } from "react";
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

  return (
    <div className="bg-black text-white">
      {/* Request Section */}
      <section className="pt-60 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-5xl font-light mb-3" data-testid="heading-questions">
                {t('contact.title')}
              </h1>
              <p className="text-lg text-white/70 font-light" data-testid="text-consultation">
                {t('contact.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder={placeholders.name}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder={placeholders.email}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="tel"
                      placeholder={placeholders.phone}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder={placeholders.address}
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
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
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                    data-testid="input-project-type"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder={placeholders.requirements}
                    value={formData.requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    className="bg-transparent border border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0 min-h-[120px] resize-none"
                    data-testid="textarea-requirements"
                  />
                </div>
                <div className="flex justify-center pt-6">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-transparent border border-white/30 text-white hover:border-white hover:bg-white/10 px-8 py-3 font-light tracking-widest uppercase transition-all duration-300 ease-in-out rounded-none"
                    data-testid="button-leave-request"
                  >
                    {mutation.isPending ? t('contact.form.sending') : (language === 'vi' ? 'GỬI YÊU CẦU' : 'LEAVE A REQUEST')}
                  </Button>
                </div>
              </div>
            </form>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="mb-16">
            <h2 className="text-sm font-light tracking-widest text-white/60">
              {language === 'vi' ? 'CÂU HỎI THƯỜNG GẶP' : 'FREQUENTLY ASKED QUESTIONS'}
            </h2>
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
                  className="pb-8 group transition-colors cursor-pointer"
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

      {/* Footer: Contact Info */}
      <section className="pb-8 bg-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-2">
                {language === 'vi' ? 'Thông Tin Liên Hệ' : 'Contact Information'}
              </p>
              <div className="space-y-1">
                <p className="text-white font-light text-base leading-relaxed">
                  {language === 'vi'
                    ? 'CÔNG TY TNHH THIẾT KẾ VÀ THI CÔNG NỘI THẤT IEVRA'
                    : 'IEVRA INTERIOR DESIGN AND CONSTRUCTION CO., LTD'}
                </p>
                <p className="text-white/60 font-light text-base">
                  {language === 'vi' ? 'Mã số thuế' : 'Tax code'}: 0319384424
                </p>
                <p className="text-white/60 font-light text-base">
                  Email: contact@ievra.com
                </p>
                <p className="text-white/60 font-light text-base">
                  {language === 'vi' ? 'Điện thoại' : 'Phone'}: 0767 5544 80 - 0969 8642 72
                </p>
              </div>
            </div>
            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-2">
                {language === 'vi' ? 'Địa Chỉ Văn Phòng' : 'Office Addresses'}
              </p>
              <div className="space-y-1">
                <p className="text-white/60 font-light text-base leading-relaxed">
                  {language === 'vi'
                    ? '422 Đào Trí, Phường Phú Thuận, Quận 7, Tp. Hồ Chí Minh.'
                    : '422 Dao Tri, Phu Thuan Ward, District 7, Ho Chi Minh City.'}
                </p>
                <p className="text-white/60 font-light text-base leading-relaxed">
                  {language === 'vi'
                    ? '64 Nguyễn Khoái, Phường 2, Quận 4, Tp. Hồ Chí Minh.'
                    : '64 Nguyen Khoai, Ward 2, District 4, Ho Chi Minh City.'}
                </p>
              </div>
            </div>
          </div>

        </div>

      </section>
    </div>
  );
}