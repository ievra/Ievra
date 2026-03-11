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
    url?: string;
    type?: string;
    siteName?: string;
  }
): string {
  const { title, description, image, url, type = "website", siteName = "IEVRA Design & Build" } = tags;

  const metaTags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
    description ? `<meta name="description" content="${escapeHtml(description)}" />` : "",
    description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
    image ? `<meta property="og:image:width" content="1200" />` : "",
    image ? `<meta property="og:image:height" content="630" />` : "",
    url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    description ? `<meta name="twitter:description" content="${escapeHtml(description)}" />` : "",
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  return html.replace(/<\/head>/, `    ${metaTags}\n  </head>`);
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

      function resolveImageUrl(raw: string | null | undefined): string | undefined {
        if (!raw) return undefined;
        if (raw.startsWith("data:")) return undefined;

        let fullUrl: string;
        if (raw.startsWith("http")) {
          fullUrl = raw;
        } else {
          fullUrl = `${baseUrl}${raw}`;
        }

        // Use images.weserv.nl to resize & compress the image for OG (avoids 10MB+ files)
        const encoded = encodeURIComponent(fullUrl.replace(/^https?:\/\//, ''));
        return `https://images.weserv.nl/?url=${encoded}&w=1200&h=630&fit=cover&output=jpg&q=82`;
      }

      const projectMatch = req.path.match(/^\/(?:portfolio|du-an)\/([^/]+)$/);
      if (projectMatch) {
        const slug = projectMatch[1];
        try {
          const project = await storage.getProjectBySlug(slug);
          if (project) {
            const coverImages = Array.isArray(project.coverImages) ? project.coverImages : [];
            const galleryImages = Array.isArray(project.galleryImages) ? project.galleryImages : [];
            const candidates = [project.heroImage, ...coverImages, ...galleryImages];
            const firstImage = candidates.find(img => img && !String(img).startsWith("data:"));
            tags = {
              title: `${project.title} | IEVRA Design & Build`,
              description:
                project.metaDescription ||
                project.description ||
                "Dự án thiết kế nội thất của IEVRA Design & Build",
              image: resolveImageUrl(firstImage as string),
              url: currentUrl,
              type: "article",
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
            tags = {
              title: `${article.title} | IEVRA Design & Build`,
              description:
                article.metaDescription ||
                article.excerpt ||
                "Bài viết từ IEVRA Design & Build",
              image: resolveImageUrl(article.featuredImage),
              url: currentUrl,
              type: "article",
            };
          }
        } catch {}
      }

      if (!tags) {
        try {
          const s = await getCachedSettings();
          const lang = detectLanguage(req.path);
          let ogImgUrl: string | undefined;
          if (s?.ogImageData && s.ogImageData.startsWith("data:")) {
            ogImgUrl = resolveImageUrl(`${baseUrl}/api/og-image`);
          } else if (s?.ogImage) {
            ogImgUrl = resolveImageUrl(s.ogImage);
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
            url: currentUrl,
          };
        } catch {
          tags = {
            title: "IEVRA Design & Build",
            description: "Thiết kế nội thất cao cấp - IEVRA Design & Build",
            url: currentUrl,
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
