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

function buildStaticPageSeoContent(
  path: string,
  lang: 'vi' | 'en',
  settings: any,
  projects: any[],
  articles: any[],
  baseUrl: string,
): string {
  const isVi = lang === 'vi';
  const home = isVi ? 'Trang Chủ' : 'Home';
  const portfolio = isVi ? 'Dự Án' : 'Portfolio';
  const blog = isVi ? 'Tin Tức' : 'Blog';
  const about = isVi ? 'Giới Thiệu' : 'About';
  const contact = isVi ? 'Liên Hệ' : 'Contact';
  const lookup = isVi ? 'Tra Cứu Dự Án' : 'Project Lookup';
  const portfolioPath = isVi ? '/du-an' : '/portfolio';
  const blogPath = isVi ? '/tin-tuc' : '/blog';
  const aboutPath = isVi ? '/gioi-thieu' : '/about';
  const contactPath = isVi ? '/lien-he' : '/contact';
  const lookupPath = isVi ? '/tra-cuu' : '/lookup';

  const resolveImg = (raw: string | null | undefined): string | undefined => {
    if (!raw) return undefined;
    if (raw.startsWith('data:')) return undefined;
    if (raw.startsWith('http')) return raw;
    return `${baseUrl}${raw}`;
  };
  const renderProjectCard = (p: any) => {
    const slug = p.slug || '';
    const href = `${baseUrl}${isVi ? '/du-an/' : '/portfolio/'}${slug}`;
    const img = resolveImg(p.heroImage || p.thumbnail || (p.galleryImages && p.galleryImages[0]) || '');
    return `<li><article><a href="${href}"><h3>${escapeHtml(p.title || '')}</h3>${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.title || '')}" loading="lazy" />` : ''}${p.description ? `<p>${escapeHtml(String(p.description).slice(0, 200))}</p>` : ''}${p.category ? `<span>${escapeHtml(p.category)}</span>` : ''}${(p as any).area ? `<span>${escapeHtml((p as any).area)}</span>` : ''}</a></article></li>`;
  };
  const renderArticleCard = (a: any) => {
    const slug = a.slug || '';
    const href = `${baseUrl}${isVi ? '/tin-tuc/' : '/blog/'}${slug}`;
    const img = resolveImg(a.coverImage || a.thumbnail || '');
    const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    return `<li><article><a href="${href}"><h3>${escapeHtml(a.title || '')}</h3>${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(a.title || '')}" loading="lazy" />` : ''}${date ? `<time datetime="${a.publishedAt ? new Date(a.publishedAt).toISOString() : ''}">${date}</time>` : ''}${a.excerpt ? `<p>${escapeHtml(String(a.excerpt).slice(0, 200))}</p>` : ''}</a></article></li>`;
  };

  const nav = `<nav aria-label="${isVi ? 'Điều hướng chính' : 'Main navigation'}"><ul><li><a href="${baseUrl}/">${home}</a></li><li><a href="${baseUrl}${aboutPath}">${about}</a></li><li><a href="${baseUrl}${portfolioPath}">${portfolio}</a></li><li><a href="${baseUrl}${blogPath}">${blog}</a></li><li><a href="${baseUrl}${contactPath}">${contact}</a></li><li><a href="${baseUrl}${lookupPath}">${lookup}</a></li></ul></nav>`;

  const phone = settings?.phone || '';
  const email = settings?.email || '';
  const addressVi = settings?.addressVi || settings?.address || '';
  const addressEn = settings?.addressEn || settings?.address || '';
  const address = isVi ? addressVi : addressEn;

  if (path === '/' || path === '') {
    const intro = isVi
      ? 'IEVRA Design & Build là studio thiết kế kiến trúc và nội thất cao cấp tại Việt Nam. Chúng tôi mang đến những giải pháp thiết kế tinh tế, kết hợp giữa thẩm mỹ hiện đại và công năng tối ưu cho không gian sống của bạn.'
      : 'IEVRA Design & Build is a premium interior and architecture studio in Vietnam. We deliver refined design solutions that combine modern aesthetics with optimized functionality for your living space.';
    const services = isVi
      ? ['Thiết Kế Nội Thất Căn Hộ', 'Thiết Kế Nội Thất Nhà Phố', 'Thiết Kế Biệt Thự', 'Thi Công Trọn Gói', 'Tư Vấn Kiến Trúc']
      : ['Apartment Interior Design', 'Townhouse Interior Design', 'Villa Design', 'Turnkey Construction', 'Architectural Consulting'];

    return `<header>${nav}<h1>IEVRA Design &amp; Build</h1><p>${intro}</p></header>
<main>
<section><h2>${isVi ? 'Dịch Vụ' : 'Our Services'}</h2><ul>${services.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></section>
<section><h2>${isVi ? 'Dự Án Tiêu Biểu' : 'Featured Projects'}</h2><ul>${projects.slice(0, 6).map(renderProjectCard).join('')}</ul><p><a href="${baseUrl}${portfolioPath}">${isVi ? 'Xem tất cả dự án' : 'View all projects'}</a></p></section>
<section><h2>${isVi ? 'Bài Viết Mới Nhất' : 'Latest Articles'}</h2><ul>${articles.slice(0, 3).map(renderArticleCard).join('')}</ul><p><a href="${baseUrl}${blogPath}">${isVi ? 'Xem tất cả bài viết' : 'View all articles'}</a></p></section>
<section><h2>${contact}</h2>${phone ? `<p>${isVi ? 'Điện thoại' : 'Phone'}: <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>` : ''}${email ? `<p>Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` : ''}${address ? `<p>${isVi ? 'Địa chỉ' : 'Address'}: ${escapeHtml(address)}</p>` : ''}</section>
</main>`;
  }

  if (path === '/about' || path === '/gioi-thieu') {
    const story = isVi
      ? 'IEVRA Design & Build được thành lập với sứ mệnh mang đến những không gian sống đẳng cấp, tinh tế và đậm chất cá nhân cho khách hàng Việt Nam. Đội ngũ kiến trúc sư và nhà thiết kế giàu kinh nghiệm của chúng tôi luôn theo đuổi sự hoàn hảo trong từng chi tiết.'
      : 'IEVRA Design & Build was founded with the mission of delivering refined, distinctive living spaces for Vietnamese clients. Our experienced team of architects and designers pursues perfection in every detail.';
    const philosophy = isVi
      ? 'Triết lý thiết kế của chúng tôi là sự kết hợp hài hòa giữa thẩm mỹ hiện đại, công năng thực tiễn và bản sắc văn hóa Á Đông. Mỗi dự án đều được tiếp cận với tinh thần cẩn trọng, tôn trọng nhu cầu và phong cách sống riêng của gia chủ.'
      : 'Our design philosophy harmonizes modern aesthetics, practical functionality and Asian cultural identity. Every project is approached with care, respecting the unique needs and lifestyle of each client.';
    const values = isVi
      ? ['Chất lượng vượt trội', 'Tôn trọng khách hàng', 'Sáng tạo bền vững', 'Trách nhiệm với từng dự án']
      : ['Outstanding quality', 'Client respect', 'Sustainable creativity', 'Responsibility in every project'];

    return `<header>${nav}<nav aria-label="breadcrumb"><ol><li><a href="${baseUrl}/">${home}</a></li><li>${about}</li></ol></nav><h1>${about}</h1></header>
<main>
<section><h2>${isVi ? 'Câu Chuyện Của Chúng Tôi' : 'Our Story'}</h2><p>${escapeHtml(story)}</p></section>
<section><h2>${isVi ? 'Triết Lý Thiết Kế' : 'Design Philosophy'}</h2><p>${escapeHtml(philosophy)}</p></section>
<section><h2>${isVi ? 'Giá Trị Cốt Lõi' : 'Core Values'}</h2><ul>${values.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul></section>
<section><h2>${isVi ? 'Dự Án Tiêu Biểu' : 'Featured Projects'}</h2><ul>${projects.slice(0, 3).map(renderProjectCard).join('')}</ul></section>
</main>`;
  }

  if (path === '/portfolio' || path === '/du-an') {
    const intro = isVi
      ? 'Khám phá bộ sưu tập dự án thiết kế nội thất và kiến trúc cao cấp của IEVRA Design & Build. Từ căn hộ hiện đại, nhà phố tinh tế đến biệt thự sang trọng — mỗi dự án là một câu chuyện thiết kế độc đáo.'
      : 'Explore the portfolio of premium interior design and architecture projects by IEVRA Design & Build. From modern apartments and refined townhouses to luxury villas — each project tells a unique design story.';

    return `<header>${nav}<nav aria-label="breadcrumb"><ol><li><a href="${baseUrl}/">${home}</a></li><li>${portfolio}</li></ol></nav><h1>${portfolio}</h1><p>${escapeHtml(intro)}</p></header>
<main><section><h2>${isVi ? 'Tất Cả Dự Án' : 'All Projects'}</h2><ul>${projects.map(renderProjectCard).join('')}</ul></section></main>`;
  }

  if (path === '/blog' || path === '/tin-tuc') {
    const intro = isVi
      ? 'Cập nhật xu hướng thiết kế nội thất, kiến thức chuyên môn và cảm hứng từ đội ngũ IEVRA Design & Build. Khám phá những bài viết chuyên sâu về phong cách thiết kế, vật liệu và giải pháp không gian sống đương đại.'
      : 'Stay updated with interior design trends, expert knowledge and inspiration from the IEVRA Design & Build team. Discover in-depth articles on design styles, materials and contemporary living space solutions.';
    const topics = isVi
      ? [
          ['Xu hướng thiết kế', 'Những xu hướng nội thất mới nhất từ Wabi-Sabi, tối giản hiện đại đến cổ điển hoài niệm.'],
          ['Phong cách thiết kế', 'Khám phá các phong cách thiết kế đặc trưng và cách áp dụng vào không gian sống.'],
          ['Vật liệu & hoàn thiện', 'Hướng dẫn lựa chọn vật liệu nội thất chất lượng, bền vững và phù hợp với phong cách.'],
          ['Giải pháp không gian', 'Tối ưu công năng cho căn hộ, nhà phố, biệt thự và không gian thương mại.'],
          ['Kinh nghiệm thực tế', 'Bài học và quy trình thi công từ các dự án thực tế của IEVRA.'],
        ]
      : [
          ['Design Trends', 'The latest interior trends from Wabi-Sabi, modern minimalism to nostalgic classic.'],
          ['Design Styles', 'Explore signature design styles and how to apply them to living spaces.'],
          ['Materials & Finishes', 'Guidance on selecting quality, sustainable interior materials that match your style.'],
          ['Space Solutions', 'Optimizing function for apartments, townhouses, villas and commercial spaces.'],
          ['Real-world Insights', 'Lessons and construction processes from IEVRA real projects.'],
        ];
    const why = isVi
      ? 'Đội ngũ IEVRA Design & Build chia sẻ kiến thức từ kinh nghiệm thực tế thực hiện hàng chục dự án thiết kế và thi công nội thất. Mỗi bài viết được biên soạn cẩn thận để mang lại giá trị thiết thực cho chủ nhà, kiến trúc sư và những ai quan tâm đến nghệ thuật kiến tạo không gian sống.'
      : 'The IEVRA Design & Build team shares insights from real-world experience executing dozens of interior design and construction projects. Each article is carefully crafted to deliver practical value for homeowners, architects and anyone passionate about the art of creating living spaces.';

    return `<header>${nav}<nav aria-label="breadcrumb"><ol><li><a href="${baseUrl}/">${home}</a></li><li>${blog}</li></ol></nav><h1>${blog}</h1><p>${escapeHtml(intro)}</p></header>
<main>
<section>
  <h2>${isVi ? 'Chủ Đề Chính' : 'Main Topics'}</h2>
  <ul>${topics.map(([t, d]) => `<li><strong>${escapeHtml(t)}</strong>: ${escapeHtml(d)}</li>`).join('')}</ul>
</section>
<section>
  <h2>${isVi ? 'Tại Sao Đọc Blog IEVRA?' : 'Why Read the IEVRA Blog?'}</h2>
  <p>${escapeHtml(why)}</p>
</section>
<section><h2>${isVi ? 'Tất Cả Bài Viết' : 'All Articles'}</h2><ul>${articles.map(renderArticleCard).join('')}</ul></section>
</main>`;
  }

  if (path === '/contact' || path === '/lien-he') {
    const intro = isVi
      ? 'Liên hệ IEVRA Design & Build để được tư vấn về dự án thiết kế nội thất và kiến trúc của bạn. Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn từ bước lên ý tưởng đến khi hoàn thiện không gian sống.'
      : 'Contact IEVRA Design & Build for expert consultation on your interior design and architecture project. Our experienced team is ready to guide you from concept to completion, creating spaces that reflect your unique vision.';
    const services = isVi
      ? ['Tư vấn thiết kế nội thất', 'Tư vấn kiến trúc', 'Thi công trọn gói', 'Thiết kế căn hộ, nhà phố, biệt thự', 'Thiết kế không gian thương mại', 'Tư vấn lựa chọn vật liệu']
      : ['Interior design consultation', 'Architectural consultation', 'Turnkey construction', 'Apartment, townhouse & villa design', 'Commercial space design', 'Material selection advisory'];
    const steps = isVi
      ? [
          ['Bước 1: Tư vấn ban đầu', 'IEVRA lắng nghe nhu cầu, phong cách và ngân sách của bạn để đề xuất hướng thiết kế phù hợp.'],
          ['Bước 2: Lập hồ sơ thiết kế', 'Đội ngũ thiết kế triển khai bản vẽ 2D, 3D và phối cảnh không gian chi tiết.'],
          ['Bước 3: Thi công & giám sát', 'IEVRA quản lý toàn bộ quá trình thi công đảm bảo chất lượng và đúng tiến độ.'],
          ['Bước 4: Bàn giao & hậu mãi', 'Bàn giao không gian hoàn chỉnh và hỗ trợ bảo hành theo cam kết.'],
        ]
      : [
          ['Step 1: Initial Consultation', 'IEVRA listens to your needs, style preferences and budget to propose the right design direction.'],
          ['Step 2: Design Development', 'Our team creates detailed 2D drawings, 3D visualizations and space renderings.'],
          ['Step 3: Construction & Supervision', 'IEVRA manages the entire construction process ensuring quality and on-time delivery.'],
          ['Step 4: Handover & After-sales', 'We deliver your completed space and provide warranty support as committed.'],
        ];

    return `<header>${nav}<nav aria-label="breadcrumb"><ol><li><a href="${baseUrl}/">${home}</a></li><li>${contact}</li></ol></nav><h1>${contact}</h1><p>${escapeHtml(intro)}</p></header>
<main>
<section itemscope itemtype="https://schema.org/Organization">
  <meta itemprop="name" content="IEVRA Design &amp; Build" />
  <h2>${isVi ? 'Thông Tin Liên Hệ' : 'Contact Information'}</h2>
  ${phone ? `<p>${isVi ? 'Điện thoại' : 'Phone'}: <a itemprop="telephone" href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>` : ''}
  ${email ? `<p>Email: <a itemprop="email" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` : ''}
  ${address ? `<p itemprop="address">${isVi ? 'Địa chỉ' : 'Address'}: ${escapeHtml(address)}</p>` : ''}
</section>
<section>
  <h2>${isVi ? 'Dịch Vụ Của Chúng Tôi' : 'Our Services'}</h2>
  <ul>${services.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
</section>
<section>
  <h2>${isVi ? 'Quy Trình Làm Việc' : 'Our Process'}</h2>
  <ol>${steps.map(([title, desc]) => `<li><strong>${escapeHtml(title)}</strong>: ${escapeHtml(desc)}</li>`).join('')}</ol>
</section>
<section>
  <h2>${isVi ? 'Tại Sao Chọn IEVRA?' : 'Why Choose IEVRA?'}</h2>
  <ul>
    ${isVi
      ? `<li>Đội ngũ kiến trúc sư và nhà thiết kế giàu kinh nghiệm trong nhiều phong cách thiết kế</li>
         <li>Cam kết chất lượng thi công với vật liệu được tuyển chọn kỹ lưỡng</li>
         <li>Tiến độ thi công minh bạch, cập nhật thường xuyên cho khách hàng</li>
         <li>Giải pháp thiết kế cá nhân hóa, phù hợp với từng không gian và ngân sách</li>`
      : `<li>Experienced architects and designers across multiple design styles</li>
         <li>Commitment to construction quality with carefully selected materials</li>
         <li>Transparent project progress with regular client updates</li>
         <li>Personalized design solutions tailored to each space and budget</li>`}
  </ul>
</section>
</main>`;
  }

  if (path === '/lookup' || path === '/tra-cuu') {
    const intro = isVi
      ? 'Tra cứu tiến độ và trạng thái dự án thiết kế và thi công của bạn với IEVRA Design & Build. Nhập mã dự án được cung cấp bởi đội ngũ IEVRA để xem thông tin chi tiết về các giai đoạn thực hiện.'
      : 'Look up the progress and status of your design and construction project with IEVRA Design & Build. Enter your project code provided by the IEVRA team to view detailed phase information.';
    const phases = isVi
      ? ['Ký kết hợp đồng', 'Thiết kế ý tưởng', 'Triển khai bản vẽ kỹ thuật', 'Thi công phần thô', 'Hoàn thiện nội thất', 'Bàn giao dự án', 'Bảo hành & hậu mãi']
      : ['Contract signing', 'Concept design', 'Technical drawings', 'Structural work', 'Interior finishing', 'Project handover', 'Warranty & after-sales'];

    return `<header>${nav}<nav aria-label="breadcrumb"><ol><li><a href="${baseUrl}/">${home}</a></li><li>${lookup}</li></ol></nav><h1>${lookup}</h1><p>${escapeHtml(intro)}</p></header>
<main>
<section>
  <h2>${isVi ? 'Hướng Dẫn Tra Cứu' : 'How to Look Up'}</h2>
  <p>${isVi ? 'Vui lòng nhập mã dự án được cung cấp bởi đội ngũ IEVRA để xem tiến độ chi tiết của từng giai đoạn. Hệ thống sẽ hiển thị thông tin cập nhật mới nhất về dự án của bạn.' : 'Please enter the project code provided by the IEVRA team to view detailed progress for each phase. The system will display the latest updates for your project.'}</p>
</section>
<section>
  <h2>${isVi ? 'Các Giai Đoạn Thực Hiện' : 'Project Phases'}</h2>
  <ol>${phases.map(phase => `<li>${escapeHtml(phase)}</li>`).join('')}</ol>
</section>
<section>
  <h2>${isVi ? 'Liên Hệ Hỗ Trợ' : 'Support Contact'}</h2>
  <p>${isVi ? 'Nếu bạn cần hỗ trợ hoặc có câu hỏi về dự án, vui lòng' : 'If you need support or have questions about your project, please'} <a href="${baseUrl}${contactPath}">${isVi ? 'liên hệ trực tiếp với đội ngũ IEVRA' : 'contact the IEVRA team directly'}</a>.</p>
  ${phone ? `<p>${isVi ? 'Điện thoại' : 'Phone'}: <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>` : ''}
</section>
</main>`;
  }

  return '';
}

function buildProjectSeoContent(project: any, imageUrl: string | undefined, baseUrl: string): string {
  const isVi = project.language === 'vi';
  const breadcrumbLabel = isVi ? 'Dự Án' : 'Portfolio';
  const breadcrumbPath = isVi ? '/du-an' : '/portfolio';
  const projectUrl = `${baseUrl}${breadcrumbPath}/${project.slug}`;

  const p = project as any;
  const resolveImg = (raw: string | null | undefined): string | undefined => {
    if (!raw) return undefined;
    if (raw.startsWith('data:')) return undefined;
    if (raw.startsWith('http')) return raw;
    return `${baseUrl}${raw}`;
  };

  let html = `<article itemscope itemtype="https://schema.org/CreativeWork">`;
  html += `<nav aria-label="breadcrumb"><ol><li><a href="${baseUrl}/">${isVi ? 'Trang Chủ' : 'Home'}</a></li><li><a href="${baseUrl}${breadcrumbPath}">${breadcrumbLabel}</a></li><li>${escapeHtml(project.title)}</li></ol></nav>`;
  html += `<h1 itemprop="name">${escapeHtml(project.title)}</h1>`;

  // Meta info block
  const metas: string[] = [];
  if (project.category) metas.push(`<li>${isVi ? 'Danh mục' : 'Category'}: <strong>${escapeHtml(project.category)}</strong></li>`);
  if (p.style)          metas.push(`<li>${isVi ? 'Phong cách' : 'Style'}: <strong>${escapeHtml(p.style)}</strong></li>`);
  if (p.area)           metas.push(`<li>${isVi ? 'Diện tích' : 'Area'}: <strong>${escapeHtml(p.area)}</strong></li>`);
  if (p.location)       metas.push(`<li>${isVi ? 'Địa điểm' : 'Location'}: <strong>${escapeHtml(p.location)}</strong></li>`);
  if (p.duration)       metas.push(`<li>${isVi ? 'Thời gian thi công' : 'Duration'}: <strong>${escapeHtml(p.duration)}</strong></li>`);
  if (p.budget)         metas.push(`<li>${isVi ? 'Ngân sách' : 'Budget'}: <strong>${escapeHtml(p.budget)}</strong></li>`);
  if (p.completionYear) metas.push(`<li>${isVi ? 'Năm hoàn thành' : 'Completion year'}: <strong>${escapeHtml(String(p.completionYear))}</strong></li>`);
  if (p.designer)       metas.push(`<li>${isVi ? 'Nhà thiết kế' : 'Designer'}: <strong>${escapeHtml(p.designer)}</strong></li>`);
  if (metas.length > 0) html += `<ul>${metas.join('')}</ul>`;

  // Hero image
  if (imageUrl) html += `<img itemprop="image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(project.title)}" />`;

  // Description
  if (project.description) html += `<p itemprop="description">${escapeHtml(project.description)}</p>`;

  // Detailed description
  if (p.detailedDescription) {
    html += `<section><h2>${p.descriptionTitle ? escapeHtml(p.descriptionTitle) : (isVi ? 'Mô Tả Chi Tiết' : 'Project Details')}</h2>`;
    html += `<p>${escapeHtml(p.detailedDescription)}</p></section>`;
  }

  // Design philosophy
  if (p.designPhilosophy) {
    html += `<section><h2>${p.designPhilosophyTitle ? escapeHtml(p.designPhilosophyTitle) : (isVi ? 'Triết Lý Thiết Kế' : 'Design Philosophy')}</h2>`;
    html += `<p>${escapeHtml(p.designPhilosophy)}</p></section>`;
  }

  // Material selection
  if (p.materialSelection) {
    html += `<section><h2>${p.materialSelectionTitle ? escapeHtml(p.materialSelectionTitle) : (isVi ? 'Chọn Lựa Vật Liệu' : 'Material Selection')}</h2>`;
    html += `<p>${escapeHtml(p.materialSelection)}</p></section>`;
  }

  // Gallery images
  const galleryImages: string[] = Array.isArray(p.galleryImages)
    ? p.galleryImages
    : (p.galleryImages ? (() => { try { return JSON.parse(p.galleryImages); } catch { return []; } })() : []);
  if (galleryImages.length > 0) {
    html += `<section><h2>${isVi ? 'Hình Ảnh Dự Án' : 'Project Gallery'}</h2><ul>`;
    galleryImages.slice(0, 8).forEach((img: any, i: number) => {
      const imgSrc = resolveImg(typeof img === 'string' ? img : img?.url || img?.src);
      if (imgSrc) html += `<li><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(project.title)} - ${isVi ? 'ảnh' : 'photo'} ${i+1}" loading="lazy" /></li>`;
    });
    html += `</ul></section>`;
  }

  html += `<span itemprop="creator" itemscope itemtype="https://schema.org/Organization"><meta itemprop="name" content="IEVRA Design &amp; Build" /><meta itemprop="url" content="${baseUrl}/" /></span>`;
  html += `<link itemprop="url" href="${projectUrl}" />`;
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
        const staticPages: { [key: string]: { en: string; vi: string; titleEn: string; titleVi: string; descEn: string; descVi: string } } = {
          '/': {
            en: '/', vi: '/',
            titleEn: 'IEVRA Design & Build | Luxury Interior & Architecture',
            titleVi: 'IEVRA Design & Build | Thiết Kế Kiến Trúc & Nội Thất Cao Cấp',
            descEn: 'IEVRA Design & Build - Premium interior design and architecture studio in Vietnam.',
            descVi: 'IEVRA Design & Build - Studio thiết kế nội thất và kiến trúc cao cấp tại Việt Nam.',
          },
          '/about': {
            en: '/about', vi: '/gioi-thieu',
            titleEn: 'About Us | IEVRA Design & Build',
            titleVi: 'Giới Thiệu | IEVRA Design & Build',
            descEn: 'Learn about IEVRA Design & Build - our story, philosophy, and commitment to luxury interior design.',
            descVi: 'Tìm hiểu về IEVRA Design & Build - câu chuyện, triết lý và cam kết về thiết kế nội thất cao cấp.',
          },
          '/gioi-thieu': {
            en: '/about', vi: '/gioi-thieu',
            titleEn: 'About Us | IEVRA Design & Build',
            titleVi: 'Giới Thiệu | IEVRA Design & Build',
            descEn: 'Learn about IEVRA Design & Build - our story, philosophy, and commitment to luxury interior design.',
            descVi: 'Tìm hiểu về IEVRA Design & Build - câu chuyện, triết lý và cam kết về thiết kế nội thất cao cấp.',
          },
          '/portfolio': {
            en: '/portfolio', vi: '/du-an',
            titleEn: 'Portfolio | IEVRA Design & Build',
            titleVi: 'Dự Án | IEVRA Design & Build',
            descEn: 'Explore our portfolio of luxury interior design and architecture projects.',
            descVi: 'Khám phá bộ sưu tập dự án thiết kế nội thất và kiến trúc cao cấp.',
          },
          '/du-an': {
            en: '/portfolio', vi: '/du-an',
            titleEn: 'Portfolio | IEVRA Design & Build',
            titleVi: 'Dự Án | IEVRA Design & Build',
            descEn: 'Explore our portfolio of luxury interior design and architecture projects.',
            descVi: 'Khám phá bộ sưu tập dự án thiết kế nội thất và kiến trúc cao cấp.',
          },
          '/blog': {
            en: '/blog', vi: '/tin-tuc',
            titleEn: 'Blog | IEVRA Design & Build',
            titleVi: 'Tin Tức | IEVRA Design & Build',
            descEn: 'Interior design insights, trends, and inspiration from IEVRA Design & Build.',
            descVi: 'Kiến thức, xu hướng và cảm hứng thiết kế nội thất từ IEVRA Design & Build.',
          },
          '/tin-tuc': {
            en: '/blog', vi: '/tin-tuc',
            titleEn: 'Blog | IEVRA Design & Build',
            titleVi: 'Tin Tức | IEVRA Design & Build',
            descEn: 'Interior design insights, trends, and inspiration from IEVRA Design & Build.',
            descVi: 'Kiến thức, xu hướng và cảm hứng thiết kế nội thất từ IEVRA Design & Build.',
          },
          '/contact': {
            en: '/contact', vi: '/lien-he',
            titleEn: 'Contact Us | IEVRA Design & Build',
            titleVi: 'Liên Hệ | IEVRA Design & Build',
            descEn: 'Get in touch with IEVRA Design & Build for your interior design and architecture needs.',
            descVi: 'Liên hệ IEVRA Design & Build cho nhu cầu thiết kế nội thất và kiến trúc của bạn.',
          },
          '/lien-he': {
            en: '/contact', vi: '/lien-he',
            titleEn: 'Contact Us | IEVRA Design & Build',
            titleVi: 'Liên Hệ | IEVRA Design & Build',
            descEn: 'Get in touch with IEVRA Design & Build for your interior design and architecture needs.',
            descVi: 'Liên hệ IEVRA Design & Build cho nhu cầu thiết kế nội thất và kiến trúc của bạn.',
          },
          '/lookup': {
            en: '/lookup', vi: '/tra-cuu',
            titleEn: 'Project Lookup | IEVRA Design & Build',
            titleVi: 'Tra Cứu Dự Án | IEVRA Design & Build',
            descEn: 'Look up your project progress and status with IEVRA Design & Build.',
            descVi: 'Tra cứu tiến độ và trạng thái dự án với IEVRA Design & Build.',
          },
          '/tra-cuu': {
            en: '/lookup', vi: '/tra-cuu',
            titleEn: 'Project Lookup | IEVRA Design & Build',
            titleVi: 'Tra Cứu Dự Án | IEVRA Design & Build',
            descEn: 'Look up your project progress and status with IEVRA Design & Build.',
            descVi: 'Tra cứu tiến độ và trạng thái dự án với IEVRA Design & Build.',
          },
        };

        const staticMatch = staticPages[req.path];
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
          const pageTitle = staticMatch
            ? (lang === 'vi' ? staticMatch.titleVi : staticMatch.titleEn)
            : (lang === 'vi'
              ? (s?.siteTitleVi || s?.siteTitle || "IEVRA Design & Build")
              : (s?.siteTitle || "IEVRA Design & Build"));
          const pageDesc = staticMatch
            ? (lang === 'vi' ? staticMatch.descVi : staticMatch.descEn)
            : (lang === 'vi'
              ? (s?.metaDescriptionVi || s?.metaDescription || "Thiết kế nội thất cao cấp - IEVRA Design & Build")
              : (s?.metaDescription || "High-end interior design - IEVRA Design & Build"));

          let seoContent: string | undefined;
          if (staticMatch) {
            try {
              const [projectsForLang, articlesForLang] = await Promise.all([
                storage.getProjects({ language: lang }).catch(() => []),
                storage.getArticles({ language: lang, status: 'published' }).catch(() => []),
              ]);
              seoContent = buildStaticPageSeoContent(req.path, lang as 'vi' | 'en', s, projectsForLang || [], articlesForLang || [], baseUrl);
            } catch {}
          }

          const orgSchema: any = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`,
            name: "IEVRA Design & Build",
            url: baseUrl,
            ...(ogImgUrl ? { logo: ogImgUrl } : {}),
            ...(s?.companyPhone ? { telephone: s.companyPhone } : {}),
            ...(s?.companyEmail ? { email: s.companyEmail } : {}),
            ...(s?.companyAddress ? { address: { "@type": "PostalAddress", streetAddress: s.companyAddress } } : {}),
          };
          const websiteSchema: any = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${baseUrl}/#website`,
            url: baseUrl,
            name: "IEVRA Design & Build",
            inLanguage: lang === 'vi' ? 'vi-VN' : 'en-US',
            publisher: { "@id": `${baseUrl}/#organization` },
          };
          let pageTypeSchema: any = null;
          if (req.path === '/' || req.path === '') {
            pageTypeSchema = null;
          } else if (req.path === '/contact' || req.path === '/lien-he') {
            pageTypeSchema = { "@context": "https://schema.org", "@type": "ContactPage", url: currentUrl, name: pageTitle, description: pageDesc, inLanguage: lang === 'vi' ? 'vi-VN' : 'en-US', isPartOf: { "@id": `${baseUrl}/#website` } };
          } else if (req.path === '/about' || req.path === '/gioi-thieu') {
            pageTypeSchema = { "@context": "https://schema.org", "@type": "AboutPage", url: currentUrl, name: pageTitle, description: pageDesc, inLanguage: lang === 'vi' ? 'vi-VN' : 'en-US', isPartOf: { "@id": `${baseUrl}/#website` } };
          } else if (req.path === '/portfolio' || req.path === '/du-an' || req.path === '/blog' || req.path === '/tin-tuc') {
            pageTypeSchema = { "@context": "https://schema.org", "@type": "CollectionPage", url: currentUrl, name: pageTitle, description: pageDesc, inLanguage: lang === 'vi' ? 'vi-VN' : 'en-US', isPartOf: { "@id": `${baseUrl}/#website` } };
          } else {
            pageTypeSchema = { "@context": "https://schema.org", "@type": "WebPage", url: currentUrl, name: pageTitle, description: pageDesc, inLanguage: lang === 'vi' ? 'vi-VN' : 'en-US', isPartOf: { "@id": `${baseUrl}/#website` } };
          }
          const staticJsonLd = pageTypeSchema ? [orgSchema, websiteSchema, pageTypeSchema] : [orgSchema, websiteSchema];

          tags = {
            title: pageTitle,
            description: pageDesc,
            image: ogImgUrl,
            imageType: ogImgType,
            url: currentUrl,
            locale,
            hreflang,
            seoContent,
            jsonLd: staticJsonLd,
          };
        } catch {
          tags = {
            title: staticMatch ? (lang === 'vi' ? staticMatch.titleVi : staticMatch.titleEn) : "IEVRA Design & Build",
            description: staticMatch ? (lang === 'vi' ? staticMatch.descVi : staticMatch.descEn) : "Thiết kế nội thất cao cấp - IEVRA Design & Build",
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
