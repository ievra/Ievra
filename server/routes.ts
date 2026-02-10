import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { storage } from "./storage";
import { insertProjectSchema, insertClientSchema, insertInquirySchema, insertServiceSchema, insertArticleSchema, insertHomepageContentSchema, insertPartnerSchema, insertCategorySchema, insertInteractionSchema, insertDealSchema, insertTransactionSchema, insertSettingsSchema, insertFaqSchema, insertAdvantageSchema, insertJourneyStepSchema, insertAboutPageContentSchema, insertAboutShowcaseServiceSchema, insertAboutProcessStepSchema, insertAboutCoreValueSchema, insertAboutTeamMemberSchema, insertCrmPipelineStageSchema, insertCrmCustomerTierSchema, insertCrmStatusSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { createHash } from "crypto";

// Simple password hashing function
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Yêu cầu đăng nhập" });
}

// Permission checking middleware
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Yêu cầu đăng nhập" });
    }
    
    const user = req.user as any;
    
    // Super admin has all permissions
    if (user.role === 'superadmin') {
      return next();
    }
    
    // Check if user has the required permission
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({ message: "Không đủ quyền hạn" });
  };
}

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'attached_assets/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|webp|gif)$/i;
    const allowedMimeTypes = /^image\/(jpeg|jpg|png|webp|gif)$/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype) || file.mimetype.startsWith('image/');
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png, webp, gif)'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug endpoint to check paths on server
  app.get("/api/debug-paths", (req, res) => {
    const testFile = "logo.white.png";
    const possiblePaths = [
      path.join('/var/www/vhosts/moderno.com.vn/httpdocs/attached_assets', testFile),
      path.join(__dirname, '..', 'attached_assets', testFile),
      path.join(__dirname, '..', '..', 'attached_assets', testFile),
      path.join(process.cwd(), 'attached_assets', testFile),
    ];
    
    const results = possiblePaths.map(p => ({
      path: p,
      exists: fs.existsSync(p)
    }));
    
    res.json({
      __dirname,
      cwd: process.cwd(),
      paths: results
    });
  });

  // API route to serve images from attached_assets folder (supports subdirectories)
  app.get("/api/assets/*", (req, res) => {
    const relativePath = req.params[0];
    
    // Security: prevent directory traversal
    if (relativePath.includes('..')) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    // Try multiple possible locations for attached_assets folder
    const possiblePaths = [
      // Production server path (Plesk)
      path.join('/var/www/vhosts/moderno.com.vn/httpdocs/attached_assets', relativePath),
      // Development paths
      path.join(__dirname, '..', 'attached_assets', relativePath),
      path.join(__dirname, '..', '..', 'attached_assets', relativePath),
      path.join(process.cwd(), 'attached_assets', relativePath),
    ];
    
    // Find the first path that exists
    let filePath = possiblePaths[0];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Image not found. Tried paths:`, possiblePaths);
        res.status(404).json({ error: 'Image not found' });
      }
    });
  });

  // Sitemap.xml endpoint
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DEPLOYMENT_URL || 'https://example.com';
      
      // Static pages
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        { url: '/about', priority: '0.8', changefreq: 'monthly' },
        { url: '/projects', priority: '0.9', changefreq: 'weekly' },
        { url: '/blog', priority: '0.9', changefreq: 'weekly' },
        { url: '/contact', priority: '0.7', changefreq: 'monthly' },
      ];
      
      // Get dynamic content
      const projects = await storage.getProjects();
      const articles = await storage.getArticles();
      
      // Filter for English versions only (to avoid duplicate URLs)
      const englishProjects = projects.filter(p => p.language === 'en' && p.status === 'completed');
      const publishedArticles = articles.filter(a => a.status === 'published');
      
      const today = new Date().toISOString().split('T')[0];
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      
      // Add static pages
      for (const page of staticPages) {
        xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
      }
      
      // Add project pages
      for (const project of englishProjects) {
        xml += `  <url>
    <loc>${baseUrl}/projects/${project.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
      
      // Add article pages
      for (const article of publishedArticles) {
        const lastmod = article.publishedAt 
          ? new Date(article.publishedAt).toISOString().split('T')[0]
          : today;
        xml += `  <url>
    <loc>${baseUrl}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
      
      xml += `</urlset>`;
      
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Return API path (works in both dev and prod)
      const filePath = `/api/assets/${req.file.filename}`;
      res.json({ path: filePath });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", passport.authenticate('local'), (req, res) => {
    console.log('[Login Success]', {
      sessionID: req.sessionID,
      user: req.user,
      cookieHeader: res.getHeader('Set-Cookie')
    });
    // Force session save
    req.session.save((err) => {
      if (err) {
        console.log('[Session Save Error]', err);
      }
      res.json(req.user);
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    console.log('[Auth Check]', {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      hasPassport: !!(req.session as any)?.passport,
      isAuthenticated: req.isAuthenticated(),
      cookies: req.headers.cookie ? 'present' : 'missing'
    });
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Users management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't return passwords
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", requirePermission('users'), requirePermission('crm'), async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      const validatedData = insertUserSchema.parse({
        ...rest,
        password: hashPassword(password),
      });
      const user = await storage.createUser(validatedData);
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requirePermission('users'), requirePermission('crm'), async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      const updateData: any = { ...rest };
      
      // Only update password if provided
      if (password && password.trim() !== '') {
        updateData.password = hashPassword(password);
      }
      
      const user = await storage.updateUser(req.params.id, updateData);
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requirePermission('users'), requirePermission('crm'), async (req, res) => {
    try {
      // Prevent deleting the last superadmin
      const users = await storage.getUsers();
      const superadmins = users.filter(u => u.role === 'superadmin');
      const userToDelete = users.find(u => u.id === req.params.id);
      
      if (userToDelete?.role === 'superadmin' && superadmins.length === 1) {
        return res.status(400).json({ message: "Cannot delete the last superadmin" });
      }
      
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Change password endpoint
  app.post("/api/users/:id/change-password", requireAuth, requirePermission('crm'), async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      if (hashPassword(currentPassword) !== user.password) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      await storage.updateUserPassword(req.params.id, hashPassword(newPassword));
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const { category, featured, language } = req.query;
      const filters: any = {};
      
      if (category) filters.category = category as string;
      if (featured) filters.featured = featured === 'true';
      if (language) filters.language = language as string;
      
      const projects = await storage.getProjects(filters);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/slug/:slug", async (req, res) => {
    try {
      const { language } = req.query;
      const project = await storage.getProjectBySlug(req.params.slug, language as string);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requirePermission('projects'), requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", requirePermission('projects'), requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requirePermission('projects'), requirePermission('crm'), async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const { status } = req.query;
      const clients = await storage.getClients(status as string);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", requirePermission('clients'), requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", requirePermission('clients'), requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", requirePermission('clients'), requirePermission('crm'), async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const totalSpending = parseFloat(client.totalSpending || "0");
      if (totalSpending > 0) {
        return res.status(400).json({ 
          message: "Không thể xóa khách hàng đã phát sinh giao dịch. Tổng chi tiêu: " + totalSpending.toLocaleString('vi-VN') + " đ"
        });
      }

      const referrals = await storage.getClientReferrals(req.params.id);
      if (referrals && referrals.length > 0) {
        return res.status(400).json({ 
          message: "Không thể xóa khách hàng có người được giới thiệu (" + referrals.length + " referral)"
        });
      }

      await storage.deleteClient(req.params.id);
      res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Inquiries routes
  app.get("/api/inquiries", async (req, res) => {
    try {
      const { status } = req.query;
      const inquiries = await storage.getInquiries(status as string);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/inquiries/:id", async (req, res) => {
    try {
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiry" });
    }
  });

  app.post("/api/inquiries", requirePermission('inquiries'), requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      
      // Check if client already exists by email
      let clientId = null;
      const existingClient = await storage.getClientByEmail(validatedData.email);
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client from inquiry data
        const newClient = await storage.createClient({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone || null,
          status: "lead"
        });
        clientId = newClient.id;
      }

      const inquiry = await storage.createInquiry({
        ...validatedData,
        clientId
      });
      
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.put("/api/inquiries/:id", requirePermission('inquiries'), requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertInquirySchema.partial().parse(req.body);
      const inquiry = await storage.updateInquiry(req.params.id, validatedData);
      res.json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });

  app.delete("/api/inquiries/:id", requirePermission('inquiries'), async (req, res) => {
    try {
      await storage.deleteInquiry(req.params.id);
      res.status(200).json({ message: "Inquiry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inquiry" });
    }
  });

  // Services routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, validatedData);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", requirePermission('crm'), async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Articles/Blog routes
  app.get("/api/articles", async (req, res) => {
    try {
      const { category, featured, status, language, tags } = req.query;
      const filters: any = {};
      
      if (category) filters.category = category as string;
      if (featured) filters.featured = featured === 'true';
      if (status) filters.status = status as string;
      if (language) filters.language = language as string;
      if (tags) {
        // Parse tags if it's a comma-separated string
        filters.tags = typeof tags === 'string' ? tags.split(',') : tags;
      }
      
      const articles = await storage.getArticles(filters);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.get("/api/articles/slug/:slug", async (req, res) => {
    try {
      const { language } = req.query;
      const article = await storage.getArticleBySlug(req.params.slug, language as string);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Increment view count for published articles
      if (article.status === 'published') {
        await storage.incrementArticleViews(article.id);
        // Return updated article with incremented view count
        const updatedArticle = await storage.getArticle(article.id);
        res.json(updatedArticle);
      } else {
        res.json(article);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/articles", requirePermission('articles'), async (req, res) => {
    try {
      const validatedData = insertArticleSchema.parse(req.body);
      
      if (!validatedData.slug) {
        validatedData.slug = validatedData.title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd').replace(/Đ/g, 'd')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      
      // Set publishedAt if status is published and not already set
      if (validatedData.status === 'published' && !validatedData.publishedAt) {
        validatedData.publishedAt = new Date();
      }
      
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error('Failed to create article:', error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put("/api/articles/:id", requirePermission('articles'), async (req, res) => {
    try {
      const validatedData = insertArticleSchema.partial().parse(req.body);
      
      // Update publishedAt if status is being set to published
      if (validatedData.status === 'published') {
        const currentArticle = await storage.getArticle(req.params.id);
        if (currentArticle && currentArticle.status !== 'published') {
          validatedData.publishedAt = new Date();
        }
      }
      
      const article = await storage.updateArticle(req.params.id, validatedData);
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", requirePermission('articles'), async (req, res) => {
    try {
      await storage.deleteArticle(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Homepage Content routes
  app.get("/api/homepage-content", async (req, res) => {
    try {
      const { language = "en" } = req.query;
      const content = await storage.getHomepageContent(language as string);
      
      if (!content) {
        // Return default content if none exists
        const defaultContent = {
          language: language as string,
          heroTitle: "Moderno Interiors",
          heroStudio: "Design",
          heroTagline: "Transforming spaces into extraordinary experiences with sophisticated interior design",
          heroArchitectureLabel: "ARCHITECTURE",
          heroInteriorLabel: "INTERIOR",
          heroConsultationText: "FREE CONSULTATION",
          featuredBadge: "Featured Projects",
          featuredTitle: "Transforming Spaces",
          featuredDescription: "Discover our latest projects where innovation meets elegance.",
          statsProjectsLabel: "Projects",
          statsClientsLabel: "Clients",
          statsAwardsLabel: "Awards",
          statsExperienceLabel: "Years",
          ctaTitle: "Ready to Transform Your Space?",
          ctaDescription: "Let's collaborate to bring your vision to life.",
          ctaButtonText: "Start Your Project",
          ctaSecondaryButtonText: "View Our Portfolio"
        };
        return res.json(defaultContent);
      }
      
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch homepage content" });
    }
  });

  app.put("/api/homepage-content", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertHomepageContentSchema.parse(req.body);
      const content = await storage.upsertHomepageContent(validatedData);
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update homepage content" });
    }
  });

  // Partners routes
  app.get("/api/partners", async (req, res) => {
    try {
      const { active } = req.query;
      const partners = await storage.getPartners(active === 'true' ? true : active === 'false' ? false : undefined);
      res.json(partners);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.get("/api/partners/:id", async (req, res) => {
    try {
      const partner = await storage.getPartner(req.params.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch partner" });
    }
  });

  app.post("/api/partners", requirePermission('partners'), async (req, res) => {
    try {
      const validatedData = insertPartnerSchema.parse(req.body);
      const partner = await storage.createPartner(validatedData);
      res.status(201).json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  app.put("/api/partners/:id", requirePermission('partners'), async (req, res) => {
    try {
      const validatedData = insertPartnerSchema.partial().parse(req.body);
      const partner = await storage.updatePartner(req.params.id, validatedData);
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", requirePermission('partners'), async (req, res) => {
    try {
      await storage.deletePartner(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete partner" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const { type, active } = req.query;
      const categories = await storage.getCategories(
        type as string, 
        active === 'true' ? true : active === 'false' ? false : undefined
      );
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.patch("/api/categories/:id", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requirePermission('homepage'), async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // CRM: Interactions routes
  app.get("/api/interactions", async (req, res) => {
    try {
      const { clientId } = req.query;
      const interactions = await storage.getInteractions(clientId as string);
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });

  app.get("/api/interactions/:id", async (req, res) => {
    try {
      const interaction = await storage.getInteraction(req.params.id);
      if (!interaction) {
        return res.status(404).json({ message: "Interaction not found" });
      }
      res.json(interaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interaction" });
    }
  });

  app.post("/api/interactions", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });

  app.put("/api/interactions/:id", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.partial().parse(req.body);
      const interaction = await storage.updateInteraction(req.params.id, validatedData);
      res.json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update interaction" });
    }
  });

  app.delete("/api/interactions/:id", requirePermission('crm'), async (req, res) => {
    try {
      await storage.deleteInteraction(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete interaction" });
    }
  });

  // CRM: Deals routes
  app.get("/api/deals", async (req, res) => {
    try {
      const { clientId, stage } = req.query;
      const filters: any = {};
      if (clientId) filters.clientId = clientId as string;
      if (stage) filters.stage = stage as string;
      
      const deals = await storage.getDeals(filters);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post("/api/deals", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.put("/api/deals/:id", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(req.params.id, validatedData);
      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", requirePermission('crm'), async (req, res) => {
    try {
      await storage.deleteDeal(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // CRM: Transactions routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const { clientId } = req.query;
      const transactions = await storage.getTransactions(clientId as string | undefined);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.post("/api/transactions", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, validatedData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", requirePermission('crm'), async (req, res) => {
    try {
      await storage.deleteTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // CRM: Analytics routes
  app.get("/api/clients/:id/referrals", async (req, res) => {
    try {
      const referrals = await storage.getClientReferrals(req.params.id);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  app.post("/api/clients/:id/update-tier", requirePermission('crm'), async (req, res) => {
    try {
      await storage.updateClientTier(req.params.id);
      const updatedClient = await storage.getClient(req.params.id);
      res.json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client tier" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [allProjects, activeClients, allClients, newInquiries] = await Promise.all([
        storage.getProjects(),
        storage.getClients("active"),
        storage.getClients(),
        storage.getInquiries("new")
      ]);

      const totalRevenue = allClients.reduce((sum, client) => {
        return sum + parseFloat(client.totalSpending || "0");
      }, 0);

      const formattedRevenue = totalRevenue.toLocaleString('vi-VN') + " ₫";

      res.json({
        totalProjects: allProjects.length,
        activeClients: activeClients.length,
        newInquiries: newInquiries.length,
        revenue: formattedRevenue
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Settings/Branding routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.upsertSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // FAQs routes
  app.get("/api/faqs", async (req, res) => {
    try {
      const { page, language, active } = req.query;
      const filters: any = {};
      
      if (page) filters.page = page as string;
      if (language) filters.language = language as string;
      if (active !== undefined) filters.active = active === 'true';
      
      const faqs = await storage.getFaqs(filters);
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.get("/api/faqs/:id", async (req, res) => {
    try {
      const faq = await storage.getFaq(req.params.id);
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      res.json(faq);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQ" });
    }
  });

  app.post("/api/faqs", requirePermission('faqs'), async (req, res) => {
    try {
      const validatedData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(validatedData);
      res.status(201).json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create FAQ" });
    }
  });

  app.put("/api/faqs/:id", requirePermission('faqs'), async (req, res) => {
    try {
      const validatedData = insertFaqSchema.partial().parse(req.body);
      const faq = await storage.updateFaq(req.params.id, validatedData);
      res.json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update FAQ" });
    }
  });

  app.delete("/api/faqs/:id", requirePermission('faqs'), async (req, res) => {
    try {
      await storage.deleteFaq(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete FAQ" });
    }
  });

  // Advantages routes (Why Choose Us)
  app.get("/api/advantages", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      
      if (active !== undefined) filters.active = active === 'true';
      
      const advantages = await storage.getAdvantages(filters);
      res.json(advantages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advantages" });
    }
  });

  app.get("/api/advantages/:id", async (req, res) => {
    try {
      const advantage = await storage.getAdvantage(req.params.id);
      if (!advantage) {
        return res.status(404).json({ message: "Advantage not found" });
      }
      res.json(advantage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advantage" });
    }
  });

  app.post("/api/advantages", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertAdvantageSchema.parse(req.body);
      const advantage = await storage.createAdvantage(validatedData);
      res.status(201).json(advantage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create advantage" });
    }
  });

  app.put("/api/advantages/:id", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertAdvantageSchema.partial().parse(req.body);
      const advantage = await storage.updateAdvantage(req.params.id, validatedData);
      res.json(advantage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update advantage" });
    }
  });

  app.delete("/api/advantages/:id", requirePermission('homepage'), async (req, res) => {
    try {
      await storage.deleteAdvantage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete advantage" });
    }
  });

  // Journey Steps routes
  app.get("/api/journey-steps", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      
      if (active !== undefined) filters.active = active === 'true';
      
      const journeySteps = await storage.getJourneySteps(filters);
      res.json(journeySteps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journey steps" });
    }
  });

  app.get("/api/journey-steps/:id", async (req, res) => {
    try {
      const journeyStep = await storage.getJourneyStep(req.params.id);
      if (!journeyStep) {
        return res.status(404).json({ message: "Journey step not found" });
      }
      res.json(journeyStep);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journey step" });
    }
  });

  app.post("/api/journey-steps", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertJourneyStepSchema.parse(req.body);
      const journeyStep = await storage.createJourneyStep(validatedData);
      res.status(201).json(journeyStep);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create journey step" });
    }
  });

  app.patch("/api/journey-steps/:id", requirePermission('homepage'), async (req, res) => {
    try {
      const validatedData = insertJourneyStepSchema.partial().parse(req.body);
      const journeyStep = await storage.updateJourneyStep(req.params.id, validatedData);
      res.json(journeyStep);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update journey step" });
    }
  });

  app.delete("/api/journey-steps/:id", requirePermission('homepage'), async (req, res) => {
    try {
      await storage.deleteJourneyStep(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete journey step" });
    }
  });

  // About Page Content routes with caching
  let aboutContentCache: any = null;
  let aboutContentCacheTime: number = 0;
  const CACHE_DURATION = 60000; // 1 minute cache

  app.get("/api/about-content", async (req, res) => {
    try {
      const content = await storage.getAboutPageContent();
      res.json(content || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch about content" });
    }
  });

  app.put("/api/about-content", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertAboutPageContentSchema.parse(req.body);
      const content = await storage.upsertAboutPageContent(validatedData);
      
      // Clear cache when content is updated
      aboutContentCache = null;
      aboutContentCacheTime = 0;
      
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update about content" });
    }
  });

  app.get("/api/about-page-content", async (req, res) => {
    try {
      const now = Date.now();
      
      // Return cached data if still valid
      if (aboutContentCache && (now - aboutContentCacheTime) < CACHE_DURATION) {
        return res.json(aboutContentCache);
      }
      
      // Fetch fresh data
      const content = await storage.getAboutPageContent();
      
      // Update cache
      aboutContentCache = content;
      aboutContentCacheTime = now;
      
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch about page content" });
    }
  });

  // About Showcase Services routes
  app.get("/api/about-showcase-services", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === 'true';
      
      const services = await storage.getAboutShowcaseServices(filters);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch showcase services" });
    }
  });

  app.get("/api/about-showcase-services/:id", async (req, res) => {
    try {
      const service = await storage.getAboutShowcaseService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Showcase service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch showcase service" });
    }
  });

  app.post("/api/about-showcase-services", requirePermission('about'), async (req, res) => {
    try {
      const validatedData = insertAboutShowcaseServiceSchema.parse(req.body);
      const service = await storage.createAboutShowcaseService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create showcase service" });
    }
  });

  app.put("/api/about-showcase-services/:id", requirePermission('about'), async (req, res) => {
    try {
      const validatedData = insertAboutShowcaseServiceSchema.partial().parse(req.body);
      const service = await storage.updateAboutShowcaseService(req.params.id, validatedData);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update showcase service" });
    }
  });

  app.delete("/api/about-showcase-services/:id", requirePermission('about'), async (req, res) => {
    try {
      await storage.deleteAboutShowcaseService(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete showcase service" });
    }
  });

  // About Process Steps routes
  app.get("/api/about-process-steps", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === 'true';
      
      const steps = await storage.getAboutProcessSteps(filters);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch process steps" });
    }
  });

  app.get("/api/about-process-steps/:id", async (req, res) => {
    try {
      const step = await storage.getAboutProcessStep(req.params.id);
      if (!step) {
        return res.status(404).json({ message: "Process step not found" });
      }
      res.json(step);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch process step" });
    }
  });

  app.post("/api/about-process-steps", requirePermission('about'), async (req, res) => {
    try {
      const validatedData = insertAboutProcessStepSchema.parse(req.body);
      const step = await storage.createAboutProcessStep(validatedData);
      res.status(201).json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create process step" });
    }
  });

  app.put("/api/about-process-steps/:id", requirePermission('about'), async (req, res) => {
    try {
      const validatedData = insertAboutProcessStepSchema.partial().parse(req.body);
      const step = await storage.updateAboutProcessStep(req.params.id, validatedData);
      res.json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update process step" });
    }
  });

  app.delete("/api/about-process-steps/:id", requirePermission('about'), async (req, res) => {
    try {
      await storage.deleteAboutProcessStep(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete process step" });
    }
  });

  // About Team Members routes
  app.get("/api/about-team-members", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === 'true';
      
      const members = await storage.getAboutTeamMembers(filters);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/about-team-members/:id", async (req, res) => {
    try {
      const member = await storage.getAboutTeamMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.post("/api/about-team-members", requirePermission('about'), async (req, res) => {
    try {
      const validatedData = insertAboutTeamMemberSchema.parse(req.body);
      const member = await storage.createAboutTeamMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  app.put("/api/about-team-members/:id", requirePermission('about'), async (req, res) => {
    try {
      const validatedData = insertAboutTeamMemberSchema.partial().parse(req.body);
      const member = await storage.updateAboutTeamMember(req.params.id, validatedData);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete("/api/about-team-members/:id", requirePermission('about'), async (req, res) => {
    try {
      await storage.deleteAboutTeamMember(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // About Core Values routes
  app.get("/api/about-core-values", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === 'true';
      
      const values = await storage.getAboutCoreValues(filters);
      res.json(values);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch core values" });
    }
  });

  app.get("/api/about-core-values/:id", async (req, res) => {
    try {
      const value = await storage.getAboutCoreValue(req.params.id);
      if (!value) {
        return res.status(404).json({ message: "Core value not found" });
      }
      res.json(value);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch core value" });
    }
  });

  app.post("/api/about-core-values", requirePermission('about'), async (req, res) => {
    try {
      const validatedData = insertAboutCoreValueSchema.parse(req.body);
      const value = await storage.createAboutCoreValue(validatedData);
      res.status(201).json(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create core value" });
    }
  });

  app.put("/api/about-core-values/:id", requirePermission('about'), async (req, res) => {
    try {
      const validatedData = insertAboutCoreValueSchema.partial().parse(req.body);
      const value = await storage.updateAboutCoreValue(req.params.id, validatedData);
      res.json(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update core value" });
    }
  });

  app.delete("/api/about-core-values/:id", requirePermission('about'), async (req, res) => {
    try {
      await storage.deleteAboutCoreValue(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete core value" });
    }
  });

  // CRM Pipeline Stages routes
  app.get("/api/crm-pipeline-stages", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === 'true';
      
      const stages = await storage.getCrmPipelineStages(filters);
      res.json(stages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pipeline stages" });
    }
  });

  app.post("/api/crm-pipeline-stages", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertCrmPipelineStageSchema.parse(req.body);
      const stage = await storage.createCrmPipelineStage(validatedData);
      res.status(201).json(stage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create pipeline stage" });
    }
  });

  app.put("/api/crm-pipeline-stages/:id", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertCrmPipelineStageSchema.partial().parse(req.body);
      const stage = await storage.updateCrmPipelineStage(req.params.id, validatedData);
      res.json(stage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update pipeline stage" });
    }
  });

  app.delete("/api/crm-pipeline-stages/:id", requirePermission('crm'), async (req, res) => {
    try {
      await storage.deleteCrmPipelineStage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete pipeline stage" });
    }
  });

  // CRM Customer Tiers routes
  app.get("/api/crm-customer-tiers", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === 'true';
      
      const tiers = await storage.getCrmCustomerTiers(filters);
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer tiers" });
    }
  });

  app.post("/api/crm-customer-tiers", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertCrmCustomerTierSchema.parse(req.body);
      const tier = await storage.createCrmCustomerTier(validatedData);
      res.status(201).json(tier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer tier" });
    }
  });

  app.put("/api/crm-customer-tiers/:id", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertCrmCustomerTierSchema.partial().parse(req.body);
      const tier = await storage.updateCrmCustomerTier(req.params.id, validatedData);
      res.json(tier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer tier" });
    }
  });

  app.delete("/api/crm-customer-tiers/:id", requirePermission('crm'), async (req, res) => {
    try {
      await storage.deleteCrmCustomerTier(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer tier" });
    }
  });

  // CRM Statuses routes
  app.get("/api/crm-statuses", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === 'true';
      
      const statuses = await storage.getCrmStatuses(filters);
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statuses" });
    }
  });

  app.post("/api/crm-statuses", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertCrmStatusSchema.parse(req.body);
      const status = await storage.createCrmStatus(validatedData);
      res.status(201).json(status);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create status" });
    }
  });

  app.put("/api/crm-statuses/:id", requirePermission('crm'), async (req, res) => {
    try {
      const validatedData = insertCrmStatusSchema.partial().parse(req.body);
      const status = await storage.updateCrmStatus(req.params.id, validatedData);
      res.json(status);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.delete("/api/crm-statuses/:id", requirePermission('crm'), async (req, res) => {
    try {
      await storage.deleteCrmStatus(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
