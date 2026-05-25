import { useEffect } from "react";
import { CANONICAL_BASE_URL } from "@shared/constants";

export { CANONICAL_BASE_URL };

interface HreflangEntry {
  lang: string;
  href: string;
}

interface PageMetaOptions {
  canonical: string;
  hreflang?: HreflangEntry[];
}

export function usePageMeta({ canonical, hreflang }: PageMetaOptions) {
  useEffect(() => {
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.rel = "canonical";
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonical;

    if (hreflang !== undefined) {
      document
        .querySelectorAll('link[rel="alternate"][hreflang]')
        .forEach((el) => el.remove());

      hreflang.forEach(({ lang, href }) => {
        const link = document.createElement("link");
        link.rel = "alternate";
        link.setAttribute("hreflang", lang);
        link.href = href;
        document.head.appendChild(link);
      });
    }

    return () => {
      const tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (tag) tag.remove();
      if (hreflang !== undefined) {
        document
          .querySelectorAll('link[rel="alternate"][hreflang]')
          .forEach((el) => el.remove());
      }
    };
  }, [canonical, hreflang]);
}
