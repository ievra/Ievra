import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { storage } from "./storage";

const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|map|json|txt|xml|pdf|zip)$/i;

const VI_PATH_PREFIXES = [
  '/gioi-thieu', '/du-an', '/tin-tuc', '/tra-cuu', '/lien-he',
];
const EN_PATH_PREFIXES = [
  '/about', '/portfolio', '/blog', '/lookup', '/contact',
];

function detectLanguage(path: string): 'vi' | 'en' {
  if (path === '/' || path === '') return 'vi';
  for (const prefix of VI_PATH_PREFIXES) {
    if (path === prefix || path.startsWith(prefix + '/')) return 'vi';
  }
  for (const prefix of EN_PATH_PREFIXES) {
    if (path === prefix || path.startsWith(prefix + '/')) return 'en';
  }
  return 'vi';
}

const BOT_USER_AGENTS = /facebookexternalhit|facebookbot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|applebot|googlebot|bingbot|yandexbot|baiduspider|zalo|viber|line-|pinterest|tumblr|curl|wget/i;

function isBot(req: Request): boolean {
  const ua = req.headers["user-agent"] || "";
  return BOT_USER_AGENTS.test(ua);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectOgTags(
  html: string,
  tags: {
    title: string;
    description?: string;
    image?: string;
    imageType?: string;
    url?: string;
    type?: string;
    siteName?: string;
    locale?: string;
    jsonLd?: object | object[];
  }
): string {
  const { title, description, image, imageType = "image/jpeg", url, type = "website", siteName = "IEVRA Design & Build", locale = "vi_VN", jsonLd } = tags;
  const lang = locale.startsWith("en") ? "en" : "vi";

  const metaTags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="robots" content="index, follow" />`,
    url ? `<link rel="canonical" href="${escapeHtml(url)}" />` : "",
    `<meta property="og:locale" content="${escapeHtml(locale)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    description ? `<meta name="description" content="${escapeHtml(description)}" />` : "",
    description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
    image ? `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />` : "",
    image ? `<meta property="og:image:type" content="${escapeHtml(imageType)}" />` : "",
    image ? `<meta property="og:image:width" content="1200" />` : "",
    image ? `<meta property="og:image:height" content="630" />` : "",
    url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:site" content="@ievradesign" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    description ? `<meta name="twitter:description" content="${escapeHtml(description)}" />` : "",
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  // JSON-LD structured data
  const jsonLdScripts = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
        .map(schema => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
        .join("\n    ")
    : "";

  // Remove pre-existing tags before injecting fresh ones
  const cleaned = html
    .replace(/<title>[^<]*<\/title>/gi, "")
    .replace(/<meta\s+(?:name|property)="(?:og:|twitter:|description|robots)[^"]*"[^>]*\/?>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*\/?>/gi, "")
    .replace(/<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/gi, "")
    .replace(/(<html[^>]*)\slang="[^"]*"/i, "$1")
    .replace(/<html/, `<html lang="${lang}"`);

  const inject = [metaTags, jsonLdScripts].filter(Boolean).join("\n    ");
  return cleaned.replace(/<\/head>/, `    ${inject}\n  </head>`);
}

let settingsCache: { data: any; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function getCachedSettings() {
  const now = Date.now();
  if (settingsCache && settingsCache.expiresAt > now) {
    return settingsCache.data;
  }
  const s = await storage.getSettings();
  settingsCache = { data: s, expiresAt: now + CACHE_TTL_MS };
  return s;
}

export function ogMiddleware(indexHtmlPath: string, isDev: boolean) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api") || STATIC_EXTENSIONS.test(req.path)) {
      return next();
    }

    if (isDev && !isBot(req)) {
      return next();
    }

    try {
      const siteUrl = process.env.SITE_URL;
      const proto = req.headers["x-forwarded-proto"] || req.protocol;
      const host = (req.headers["x-forwarded-host"] || req.get("host") || '') as string;
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const effectiveProto = (!isLocalhost && proto === 'http') ? 'https' : proto;
      const baseUrl = siteUrl || `${effectiveProto}://${host}`;
      const currentUrl = `${baseUrl}${req.originalUrl}`;

      let html: string;
      try {
        html = await fs.promises.readFile(indexHtmlPath, "utf-8");
      } catch {
        return next();
      }

      let tags: Parameters<typeof injectOgTags>[1] | null = null;

      // Serve the image directly — no proxy/resize, preserving original quality.
      function resolveImageUrl(raw: string | null | undefined): string | undefined {
        if (!raw) return undefined;
        if (raw.startsWith("data:")) return undefined;
        if (raw.startsWith("http")) return raw;
        return `${baseUrl}${raw}`;
      }

      // For fallback images (hero/cover/gallery) use weserv to standardise OG dimensions.
      // High quality (q=92) to avoid visible blurring.
      function resolveImageUrlWithResize(raw: string | null | undefined): string | undefined {
        if (!raw) return undefined;
        if (raw.startsWith("data:")) return undefined;
        const fullUrl = raw.startsWith("http") ? raw : `${baseUrl}${raw}`;
        const urlWithoutProtocol = fullUrl.replace(/^https?:\/\//, '');
        return `https://images.weserv.nl/?url=${urlWithoutProtocol}&w=1200&h=630&fit=inside&output=jpg&q=92`;
      }

      const lang = detectLanguage(req.path);
      const locale = lang === 'en' ? 'en_US' : 'vi_VN';

      const projectMatch = req.path.match(/^\/(?:portfolio|du-an)\/([^/]+)$/);
      if (projectMatch) {
        const slug = projectMatch[1];
        try {
          const project = await storage.getProjectBySlug(slug);
          if (project) {
            const explicitOgImage = (project as any).ogImage as string | undefined;
            let imageUrl: string | undefined;
            if (explicitOgImage && !explicitOgImage.startsWith("data:")) {
              imageUrl = resolveImageUrl(explicitOgImage);
            } else {
              const coverImages = Array.isArray(project.coverImages) ? project.coverImages : [];
              const galleryImages = Array.isArray(project.galleryImages) ? project.galleryImages : [];
              const candidates = [project.heroImage, ...coverImages, ...galleryImages];
              const firstImage = candidates.find(img => img && !String(img).startsWith("data:"));
              imageUrl = resolveImageUrlWithResize(firstImage as string);
            }
            const desc = project.metaDescription || project.description || "Dự án thiết kế nội thất của IEVRA Design & Build";
            const breadcrumbListName = lang === 'en' ? 'Portfolio' : 'Dự Án';
            const breadcrumbListUrl = `${baseUrl}${lang === 'en' ? '/portfolio' : '/du-an'}`;
            const jsonLd: object[] = [
              {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": project.title,
                "description": desc,
                "image": imageUrl ? [imageUrl] : undefined,
                "url": currentUrl,
                "datePublished": project.createdAt ? new Date(project.createdAt).toISOString() : undefined,
                "dateModified": project.updatedAt ? new Date(project.updatedAt).toISOString() : undefined,
                "author": { "@type": "Organization", "name": "IEVRA Design & Build", "url": baseUrl },
                "publisher": {
                  "@type": "Organization",
                  "name": "IEVRA Design & Build",
                  "url": baseUrl,
                  "logo": { "@type": "ImageObject", "url": `${baseUrl}/api/assets/logo.white.png` }
                },
                "inLanguage": lang === 'en' ? "en-US" : "vi-VN",
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl + "/" },
                  { "@type": "ListItem", "position": 2, "name": breadcrumbListName, "item": breadcrumbListUrl },
                  { "@type": "ListItem", "position": 3, "name": project.title, "item": currentUrl },
                ]
              }
            ];
            tags = {
              title: `${project.title} | IEVRA Design & Build`,
              description: desc,
              image: imageUrl,
              url: currentUrl,
              type: "article",
              locale,
              jsonLd,
            };
          }
        } catch {}
      }

      const blogMatch = req.path.match(/^\/(?:blog|tin-tuc)\/([^/]+)$/);
      if (!tags && blogMatch) {
        const slug = blogMatch[1];
        try {
          const article = await storage.getArticleBySlug(slug);
          if (article) {
            const explicitOgImage = (article as any).ogImage as string | undefined;
            const imageUrl = (explicitOgImage && !explicitOgImage.startsWith("data:"))
              ? resolveImageUrl(explicitOgImage)
              : resolveImageUrlWithResize(article.featuredImage);
            const desc = article.metaDescription || article.excerpt || "Bài viết từ IEVRA Design & Build";
            const breadcrumbListName = lang === 'en' ? 'Blog' : 'Tin Tức';
            const breadcrumbListUrl = `${baseUrl}${lang === 'en' ? '/blog' : '/tin-tuc'}`;
            const jsonLd: object[] = [
              {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": article.title,
                "description": desc,
                "image": imageUrl ? [imageUrl] : undefined,
                "url": currentUrl,
                "datePublished": article.publishedAt ? new Date(article.publishedAt).toISOString() : (article.createdAt ? new Date(article.createdAt).toISOString() : undefined),
                "dateModified": article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
                "author": { "@type": "Organization", "name": "IEVRA Design & Build", "url": baseUrl },
                "publisher": {
                  "@type": "Organization",
                  "name": "IEVRA Design & Build",
                  "url": baseUrl,
                  "logo": { "@type": "ImageObject", "url": `${baseUrl}/api/assets/logo.white.png` }
                },
                "inLanguage": lang === 'en' ? "en-US" : "vi-VN",
                "articleSection": article.category || (lang === 'en' ? "Interior Design" : "Thiết Kế Nội Thất"),
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl + "/" },
                  { "@type": "ListItem", "position": 2, "name": breadcrumbListName, "item": breadcrumbListUrl },
                  { "@type": "ListItem", "position": 3, "name": article.title, "item": currentUrl },
                ]
              }
            ];
            tags = {
              title: `${article.title} | IEVRA Design & Build`,
              description: desc,
              image: imageUrl,
              url: currentUrl,
              type: "article",
              locale,
              jsonLd,
            };
          }
        } catch {}
      }

      if (!tags) {
        try {
          const s = await getCachedSettings();
          let ogImgUrl: string | undefined;
          let ogImgType: string | undefined;
          if (s?.ogImageData && s.ogImageData.startsWith("data:")) {
            // Detect actual MIME type from the base64 data URL
            const mimeMatch = s.ogImageData.match(/^data:(image\/[a-zA-Z+]+);base64,/);
            ogImgType = mimeMatch ? mimeMatch[1] : "image/jpeg";
            ogImgUrl = `${baseUrl}/api/og-image`;
          } else if (s?.ogImage) {
            ogImgUrl = resolveImageUrl(s.ogImage);
            // weserv.nl always returns jpg
            ogImgType = "image/jpeg";
          }
          const title = lang === 'vi'
            ? (s?.siteTitleVi || s?.siteTitle || "IEVRA Design & Build")
            : (s?.siteTitle || "IEVRA Design & Build");
          const description = lang === 'vi'
            ? (s?.metaDescriptionVi || s?.metaDescription || "Thiết kế nội thất cao cấp - IEVRA Design & Build")
            : (s?.metaDescription || "High-end interior design - IEVRA Design & Build");
          tags = {
            title,
            description,
            image: ogImgUrl,
            imageType: ogImgType,
            url: currentUrl,
            locale,
          };
        } catch {
          tags = {
            title: "IEVRA Design & Build",
            description: "Thiết kế nội thất cao cấp - IEVRA Design & Build",
            url: currentUrl,
            locale,
          };
        }
      }

      html = injectOgTags(html, tags);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      next(err);
    }
  };
}
