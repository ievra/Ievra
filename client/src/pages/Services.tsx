import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Building, Compass, Palette, Sofa, Lightbulb } from "lucide-react";
import type { Service } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

// Function to get default services with translations
function getDefaultServices(t: (key: string) => string) {
  return [
    {
      id: '1',
      title: t('services.residential'),
      description: t('services.residentialDesc'),
      icon: 'home',
      features: t('services.residentialFeatures').split(','),
      order: 1,
      active: true
    },
    {
      id: '2',
      title: t('services.commercial'),
      description: t('services.commercialDesc'),
      icon: 'building',
      features: t('services.commercialFeatures').split(','),
      order: 2,
      active: true
    },
    {
      id: '3',
      title: t('services.architectural'),
      description: t('services.architecturalDesc'),
      icon: 'compass',
      features: t('services.architecturalFeatures').split(','),
      order: 3,
      active: true
    },
    {
      id: '4',
      title: t('services.consultation'),
      description: t('services.consultationDesc'),
      icon: 'palette',
      features: t('services.consultationFeatures').split(','),
      order: 4,
      active: true
    },
    {
      id: '5',
      title: t('services.furnitureSelection'),
      description: t('services.furnitureDesc'),
      icon: 'sofa',
      features: t('services.furnitureFeatures').split(','),
      order: 5,
      active: true
    },
    {
      id: '6',
      title: t('services.lightingDesign'),
      description: t('services.lightingDesc'),
      icon: 'lightbulb',
      features: t('services.lightingFeatures').split(','),
      order: 6,
      active: true
    }
  ];
}

const iconMap = {
  home: Home,
  building: Building,
  compass: Compass,
  palette: Palette,
  sofa: Sofa,
  lightbulb: Lightbulb
};

export default function Services() {
  const { t } = useLanguage();
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  // Use API services if available, otherwise fall back to translated default
  const defaultServices = getDefaultServices(t);
  const displayServices = services.length > 0 ? services : defaultServices;

  // Animation - only run once per card
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const observeElements = () => {
      const animateElements = document.querySelectorAll('.service-card');
      animateElements.forEach((el) => observer.observe(el));
    };

    observeElements();

    const timers = [500, 1000].map(delay => 
      setTimeout(observeElements, delay)
    );

    return () => {
      observer.disconnect();
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <div className="min-h-[120vh] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-sans font-light mb-6" data-testid="heading-services">{t('services.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('services.subtitle')}
          </p>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-white/10 rounded-xl mb-6" />
                  <div className="space-y-4">
                    <div className="h-6 bg-white/10 rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded" />
                      <div className="h-4 bg-white/10 rounded w-5/6" />
                    </div>
                    <div className="space-y-2 pt-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-3 bg-white/10 rounded w-4/5" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayServices.map((service) => {
              const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Home;
              
              return (
                <Card key={service.id} className="service-card group border-0 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <IconComponent className="h-10 w-10 text-white/80 group-hover:text-white transition-all duration-300" />
                    </div>
                    <h3 className="text-xl font-sans font-light mb-4 text-white group-hover:text-white transition-all duration-300" data-testid={`text-title-${service.id}`}>
                      {service.title}
                    </h3>
                    <p className="text-white/70 group-hover:text-white/90 leading-relaxed mb-6 transition-all duration-300">
                      {service.description}
                    </p>
                    {Array.isArray(service.features) && service.features.length > 0 && (
                      <ul className="space-y-2 text-sm text-white/60 group-hover:text-white/80 transition-all duration-300">
                        {service.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full mr-3" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
