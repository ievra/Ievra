import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { storage } from "./storage";
import { db } from "./db";
import { articles, projects } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeContentHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s(on\w+)="[^"]*"/gi, '')
    .replace(/\s(on\w+)='[^']*'/gi, '');
}

interface OgTags {
  title: string;
  description?: string;
  image?: string;
  imageType?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
  jsonLd?: object | object[];
  hreflang?: { lang: string; href: string }[];
  seoContent?: string;
}

function injectOgTags(html: string, tags: OgTags): string {
  const { title, description, image, imageType = "image/jpeg", url, type = "website", siteName = "IEVRA Design & Build", locale = "vi_VN", jsonLd, hreflang, seoContent } = tags;
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
    ...(hreflang || []).map(h => `<link rel="alternate" hreflang="${escapeHtml(h.lang)}" href="${escapeHtml(h.href)}" />`),
  ]
    .filter(Boolean)
    .join("\n    ");

  const jsonLdScripts = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
        .map(schema => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
        .join("\n    ")
    : "";

  let cleaned = html
    .replace(/<title>[^<]*<\/title>/gi, "")
    .replace(/<meta\s+(?:name|property)="(?:og:|twitter:|description|robots)[^"]*"[^>]*\/?>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*\/?>/gi, "")
    .replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*\/?>/gi, "")
    .replace(/<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/gi, "")
    .replace(/(<html[^>]*)\slang="[^"]*"/i, "$1")
    .replace(/<html/, `<html lang="${lang}"`);

  const inject = [metaTags, jsonLdScripts].filter(Boolean).join("\n    ");
  cleaned = cleaned.replace(/<\/head>/, `    ${inject}\n  </head>`);

  if (seoContent) {
    cleaned = cleaned.replace(
      '<div id="root"></div>',
      `<div id="root">${seoContent}</div>`
    );
  }

  return cleaned;
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

async function findLinkedArticle(article: any, baseUrl: string): Promise<{ lang: string; href: string }[]> {
  const hreflang: { lang: string; href: string }[] = [];
  try {
    const groupKey = article.linkedSlug || article.slug;
    if (!groupKey) return hreflang;

    const allVersions = await db.select().from(articles).where(
      eq(articles.linkedSlug, groupKey)
    );
    if (allVersions.length === 0) {
      const [bySlug] = await db.select().from(articles).where(
        and(eq(articles.slug, groupKey))
      );
      if (bySlug) allVersions.push(bySlug);
    }
    if (!allVersions.find(a => a.id === article.id)) {
      allVersions.push(article);
    }

    for (const v of allVersions) {
      if (!v.slug || v.status !== 'published') continue;
      const prefix = v.language === 'en' ? '/blog' : '/tin-tuc';
      const lang = v.language === 'en' ? 'en' : 'vi';
      hreflang.push({ lang, href: `${baseUrl}${prefix}/${v.slug}` });
    }

    const viVersion = hreflang.find(h => h.lang === 'vi');
    if (viVersion) {
      hreflang.push({ lang: 'x-default', href: viVersion.href });
    } else if (hreflang.length > 0) {
      hreflang.push({ lang: 'x-default', href: hreflang[0].href });
    }
  } catch {}
  return hreflang;
}

async function findLinkedProject(project: any, baseUrl: string): Promise<{ lang: string; href: string }[]> {
  const hreflang: { lang: string; href: string }[] = [];
  try {
    const groupKey = project.linkedSlug || project.slug;
    if (!groupKey) return hreflang;

    const allVersions = await db.select().from(projects).where(
      eq(projects.linkedSlug, groupKey)
    );
    if (allVersions.length === 0) {
      const [bySlug] = await db.select().from(projects).where(
        and(eq(projects.slug, groupKey))
      );
      if (bySlug) allVersions.push(bySlug);
    }
    if (!allVersions.find(p => p.id === project.id)) {
      allVersions.push(project);
    }

    for (const v of allVersions) {
      if (!v.slug || v.status !== 'published') continue;
      const prefix = v.language === 'en' ? '/portfolio' : '/du-an';
      const lang = v.language === 'en' ? 'en' : 'vi';
      hreflang.push({ lang, href: `${baseUrl}${prefix}/${v.slug}` });
    }

    const viVersion = hreflang.find(h => h.lang === 'vi');
    if (viVersion) {
      hreflang.push({ lang: 'x-default', href: viVersion.href });
    } else if (hreflang.length > 0) {
      hreflang.push({ lang: 'x-default', href: hreflang[0].href });
    }
  } catch {}
  return hreflang;
}

function buildArticleSeoContent(article: any, imageUrl: string | undefined, baseUrl: string): string {
  const isVi = article.language === 'vi';
  const breadcrumbLabel = isVi ? 'Tin Tức' : 'Blog';
  const breadcrumbPath = isVi ? '/tin-tuc' : '/blog';
  const publishDate = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const contentText = article.content ? sanitizeContentHtml(article.content) : '';
  const excerptText = article.excerpt ? escapeHtml(article.excerpt) : '';

  let html = `<article itemscope itemtype="https://schema.org/Article">`;
  html += `<nav aria-label="breadcrumb"><ol><li><a href="${baseUrl}/">${isVi ? 'Trang Chủ' : 'Home'}</a></li><li><a href="${baseUrl}${breadcrumbPath}">${breadcrumbLabel}</a></li><li>${escapeHtml(article.title)}</li></ol></nav>`;
  html += `<h1 itemprop="headline">${escapeHtml(article.title)}</h1>`;
  if (publishDate) html += `<time itemprop="datePublished" datetime="${article.publishedAt ? new Date(article.publishedAt).toISOString() : ''}">${publishDate}</time>`;
  if (article.category) html += `<span itemprop="articleSection">${escapeHtml(article.category)}</span>`;
  if (imageUrl) html += `<img itemprop="image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(article.title)}" />`;
  if (excerptText) html += `<p itemprop="description">${excerptText}</p>`;
  if (contentText) html += `<div itemprop="articleBody">${contentText}</div>`;
  html += `<span itemprop="author" itemscope itemtype="https://schema.org/Organization"><meta itemprop="name" content="IEVRA Design &amp; Build" /></span>`;
  html += `</article>`;
  return html;
}

function buildProjectSeoContent(project: any, imageUrl: string | undefined, baseUrl: string): string {
  const isVi = project.language === 'vi';
  const breadcrumbLabel = isVi ? 'Dự Án' : 'Portfolio';
  const breadcrumbPath = isVi ? '/du-an' : '/portfolio';

  const descText = project.description ? escapeHtml(project.description) : '';
  const contentText = project.content ? sanitizeContentHtml(project.content) : '';

  let html = `<article itemscope itemtype="https://schema.org/Article">`;
  html += `<nav aria-label="breadcrumb"><ol><li><a href="${baseUrl}/">${isVi ? 'Trang Chủ' : 'Home'}</a></li><li><a href="${baseUrl}${breadcrumbPath}">${breadcrumbLabel}</a></li><li>${escapeHtml(project.title)}</li></ol></nav>`;
  html += `<h1 itemprop="headline">${escapeHtml(project.title)}</h1>`;
  if (project.category) html += `<span>${escapeHtml(project.category)}</span>`;
  if ((project as any).style) html += `<span>${escapeHtml((project as any).style)}</span>`;
  if ((project as any).area) html += `<span>${escapeHtml((project as any).area)}</span>`;
  if (imageUrl) html += `<img itemprop="image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(project.title)}" />`;
  if (descText) html += `<p itemprop="description">${descText}</p>`;
  if (contentText) html += `<div itemprop="articleBody">${contentText}</div>`;
  html += `<span itemprop="author" itemscope itemtype="https://schema.org/Organization"><meta itemprop="name" content="IEVRA Design &amp; Build" /></span>`;
  html += `</article>`;
  return html;
}

export function ogMiddleware(indexHtmlPath: string, isDev: boolean) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api") || STATIC_EXTENSIONS.test(req.path)) {
      return next();
    }

    if (req.path !== '/' && req.path.endsWith('/')) {
      const cleanPath = req.path.replace(/\/+$/, '') + (req.originalUrl.includes('?') ? req.originalUrl.substring(req.originalUrl.indexOf('?')) : '');
      return res.redirect(301, cleanPath);
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
      const currentUrl = `${baseUrl}${req.path}`;

      let html: string;
      try {
        html = await fs.promises.readFile(indexHtmlPath, "utf-8");
      } catch {
        return next();
      }

      let tags: OgTags | null = null;

      function resolveImageUrl(raw: string | null | undefined): string | undefined {
        if (!raw) return undefined;
        if (raw.startsWith("data:")) return undefined;
        if (raw.startsWith("http")) return raw;
        return `${baseUrl}${raw}`;
      }

      function resolveImageUrlWithResize(raw: string | null | undefined): string | undefined {
        if (!raw) return undefined;
        if (raw.startsWith("data:")) return undefined;
        const fullUrl = raw.startsWith("http") ? raw : `${baseUrl}${raw}`;
        const urlWithoutProtocol = fullUrl.replace(/^https?:\/\//, '');
        return `https://images.weserv.nl/?url=${urlWithoutProtocol}&w=1200&h=630&fit=inside&output=jpg&q=92`;
      }

      const lang = detectLanguage(req.path);
      const locale = lang === 'en' ? 'en_US' : 'vi_VN';
      let isContentPage = false;
      let contentFound = false;

      const projectMatch = req.path.match(/^\/(?:portfolio|du-an)\/([^/]+)$/);
      if (projectMatch) {
        isContentPage = true;
        const slug = projectMatch[1];
        try {
          const project = await storage.getProjectBySlug(slug);
          if (project) {
            contentFound = true;
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

            const hreflang = await findLinkedProject(project, baseUrl);

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
              hreflang,
              seoContent: buildProjectSeoContent(project, imageUrl, baseUrl),
            };
          }
        } catch {}
      }

      const blogMatch = req.path.match(/^\/(?:blog|tin-tuc)\/([^/]+)$/);
      if (!tags && blogMatch) {
        isContentPage = true;
        const slug = blogMatch[1];
        try {
          const article = await storage.getArticleBySlug(slug);
          if (article) {
            contentFound = true;
            const explicitOgImage = (article as any).ogImage as string | undefined;
            const imageUrl = (explicitOgImage && !explicitOgImage.startsWith("data:"))
              ? resolveImageUrl(explicitOgImage)
              : resolveImageUrlWithResize(article.featuredImage);
            const desc = article.metaDescription || article.excerpt || "Bài viết từ IEVRA Design & Build";
            const breadcrumbListName = lang === 'en' ? 'Blog' : 'Tin Tức';
            const breadcrumbListUrl = `${baseUrl}${lang === 'en' ? '/blog' : '/tin-tuc'}`;

            const hreflang = await findLinkedArticle(article, baseUrl);

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
              hreflang,
              seoContent: buildArticleSeoContent(article, imageUrl, baseUrl),
            };
          }
        } catch {}
      }

      if (!tags) {
        const staticHreflang: { [key: string]: { en: string; vi: string } } = {
          '/': { en: '/', vi: '/' },
          '/about': { en: '/about', vi: '/gioi-thieu' },
          '/gioi-thieu': { en: '/about', vi: '/gioi-thieu' },
          '/portfolio': { en: '/portfolio', vi: '/du-an' },
          '/du-an': { en: '/portfolio', vi: '/du-an' },
          '/blog': { en: '/blog', vi: '/tin-tuc' },
          '/tin-tuc': { en: '/blog', vi: '/tin-tuc' },
          '/contact': { en: '/contact', vi: '/lien-he' },
          '/lien-he': { en: '/contact', vi: '/lien-he' },
          '/lookup': { en: '/lookup', vi: '/tra-cuu' },
          '/tra-cuu': { en: '/lookup', vi: '/tra-cuu' },
        };

        const staticMatch = staticHreflang[req.path];
        const hreflang = staticMatch ? [
          { lang: 'vi', href: `${baseUrl}${staticMatch.vi}` },
          { lang: 'en', href: `${baseUrl}${staticMatch.en}` },
          { lang: 'x-default', href: `${baseUrl}${staticMatch.vi}` },
        ] : undefined;

        try {
          const s = await getCachedSettings();
          let ogImgUrl: string | undefined;
          let ogImgType: string | undefined;
          if (s?.ogImageData && s.ogImageData.startsWith("data:")) {
            const mimeMatch = s.ogImageData.match(/^data:(image\/[a-zA-Z+]+);base64,/);
            ogImgType = mimeMatch ? mimeMatch[1] : "image/jpeg";
            ogImgUrl = `${baseUrl}/api/og-image`;
          } else if (s?.ogImage) {
            ogImgUrl = resolveImageUrl(s.ogImage);
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
            hreflang,
          };
        } catch {
          tags = {
            title: "IEVRA Design & Build",
            description: "Thiết kế nội thất cao cấp - IEVRA Design & Build",
            url: currentUrl,
            locale,
            hreflang,
          };
        }
      }

      if (isContentPage && !contentFound) {
        const cleaned = html
          .replace(/<title>[^<]*<\/title>/gi, "")
          .replace(/<meta\s+(?:name|property)="(?:og:|twitter:|description|robots)[^"]*"[^>]*\/?>/gi, "")
          .replace(/<link\s+rel="canonical"[^>]*\/?>/gi, "")
          .replace(/<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/gi, "");
        const notFoundHtml = cleaned.replace(/<\/head>/, `    <title>404 - ${lang === 'vi' ? 'Không Tìm Thấy' : 'Not Found'} | IEVRA Design & Build</title>\n    <meta name="robots" content="noindex, nofollow" />\n  </head>`);
        return res.status(404).set({ "Content-Type": "text/html" }).end(notFoundHtml);
      }

      html = injectOgTags(html, tags);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      next(err);
    }
  };
}
