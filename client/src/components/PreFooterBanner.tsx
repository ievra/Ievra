import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AboutPageContent } from "@shared/schema";

export default function PreFooterBanner() {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const { data: aboutContent } = useQuery<AboutPageContent>({
    queryKey: ["/api/about-content"],
  });

  const bgImage = aboutContent?.ctaBannerImageData || aboutContent?.ctaBannerImage;
  const title = isVi
    ? (aboutContent?.ctaBannerTitleVi || "")
    : (aboutContent?.ctaBannerTitleEn || "");

  if (!bgImage && !title) return null;

  return (
    <section className="relative h-[80vh] bg-black" style={{ clipPath: "inset(0)" }}>
      <div
        className="fixed inset-0"
        style={{
          ...(bgImage ? { backgroundImage: `url(${bgImage})` } : {}),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/50" />
      </div>

      <div className="relative h-full w-full px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-12">
        {/* Title - top left */}
        <div className="max-w-4xl">
          <h2 className="text-3xl md:text-5xl lg:text-[52px] font-light text-white leading-loose tracking-wide uppercase">
            {title}
          </h2>
        </div>

        {/* Contact button - bottom right */}
        <div className="flex justify-end">
          <div className="flex flex-col items-end gap-4">
            <div className="w-24 h-px bg-white/30" />
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-[13px] font-light tracking-widest text-white border border-white/30 rounded-full px-6 py-2.5 hover:bg-white hover:text-black transition-all duration-300 uppercase"
            >
              {isVi ? "LIÊN HỆ" : "CONTACT"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
