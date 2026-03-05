import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, unique, decimal, real, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"), // superadmin, admin, editor
  permissions: jsonb("permissions").default([]), // Array of permission strings
  displayName: text("display_name"),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug"),
  description: text("description"),
  detailedDescription: text("detailed_description"), // Rich detailed content for project page
  designPhilosophyTitle: text("design_philosophy_title"), // Customizable title for Design Philosophy section
  designPhilosophy: text("design_philosophy"), // Design Philosophy section content
  materialSelectionTitle: text("material_selection_title"), // Customizable title for Material Selection section
  materialSelection: text("material_selection"), // Material Selection section content
  descriptionTitle: text("description_title"),
  section2Image: text("section_2_image"),
  section3Image: text("section_3_image"),
  bannerTitle: text("banner_title"),
  bannerImage: text("banner_image"),
  category: varchar("category", { length: 50 }).notNull(), // residential, commercial, architecture
  language: varchar("language", { length: 5 }).default("en"), // en, vi
  location: text("location"),
  area: text("area"),
  duration: text("duration"),
  budget: text("budget"),
  style: text("style"),
  designer: text("designer"), // Interior Designer name
  completionYear: text("completion_year"), // Year completed
  // Image categories with specific constraints
  coverImages: jsonb("cover_images").default([]), // Max 2 images, 3:4 aspect ratio
  contentImages: jsonb("content_images").default([]), // 2 images, 16:9 or 1:1 aspect ratio  
  galleryImages: jsonb("gallery_images").default([]), // Max 10 images, 16:9 or 1:1 aspect ratio
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived
  featured: boolean("featured").notNull().default(false),
  // Legacy fields for backward compatibility
  heroImage: text("hero_image"), // Legacy: Main project hero image
  images: jsonb("images").default([]), // Legacy field, keeping for compatibility
  // Related projects
  relatedProjects: jsonb("related_projects").default([]), // Array of related project IDs
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"), // Ngày tháng năm sinh
  // CRM Pipeline Stage
  stage: varchar("stage", { length: 50 }).notNull().default("lead"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  // Customer Tier
  tier: varchar("tier", { length: 50 }).notNull().default("silver"),
  // Financial tracking
  totalSpending: decimal("total_spending", { precision: 12, scale: 2 }).notNull().default("0"),
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  commission: decimal("commission", { precision: 12, scale: 2 }).notNull().default("0"), // Total commission from transactions
  orderCount: integer("order_count").notNull().default(0),
  // Referral Program
  referredById: varchar("referred_by_id").references((): AnyPgColumn => clients.id),
  referralCount: integer("referral_count").notNull().default(0),
  referralRevenue: decimal("referral_revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  // Intake date (thời gian tiếp nhận khách hàng)
  intakeDate: timestamp("intake_date"),
  // Construction Timeline target (number of days)
  constructionTimeline: integer("construction_timeline"),
  // Design Timeline target (number of days)
  designTimeline: integer("design_timeline"),
  designPhaseTargets: jsonb("design_phase_targets").default({}),
  constructionPhaseTargets: jsonb("construction_phase_targets").default({}),
  identityCard: text("identity_card"),
  // Warranty & Additional Info
  warrantyStatus: varchar("warranty_status", { length: 30 }).default("none"), // none, active, expired
  warrantyExpiry: timestamp("warranty_expiry"), // Ngày hết hạn bảo hành
  notes: text("notes"),
  tags: jsonb("tags").default([]), // Array of tag strings for flexible categorization
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const businessPartners = pgTable("business_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  position: text("position"),
  company: text("company"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  stage: varchar("stage", { length: 50 }).notNull().default("lead"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  tier: varchar("tier", { length: 50 }).notNull().default("silver"),
  totalSpending: decimal("total_spending", { precision: 12, scale: 2 }).notNull().default("0"),
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  commission: decimal("commission", { precision: 12, scale: 2 }).notNull().default("0"),
  orderCount: integer("order_count").notNull().default(0),
  referredById: varchar("referred_by_id"),
  referralCount: integer("referral_count").notNull().default(0),
  referralRevenue: decimal("referral_revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  intakeDate: timestamp("intake_date"),
  warrantyStatus: varchar("warranty_status", { length: 30 }).default("none"),
  warrantyExpiry: timestamp("warranty_expiry"),
  notes: text("notes"),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bpTransactions = pgTable("bp_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessPartnerId: varchar("business_partner_id").notNull().references(() => businessPartners.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: varchar("type", { length: 30 }).notNull().default("payment"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  paymentDate: timestamp("payment_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  projectType: varchar("project_type", { length: 50 }),
  budget: varchar("budget", { length: 50 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, reviewed, contacted, converted
  clientId: varchar("client_id").references(() => clients.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  features: jsonb("features").default([]), // array of service features
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  featuredImageData: text("featured_image_data"),
  contentImages: jsonb("content_images").default([]), // array of base64 image data for content insertion
  category: varchar("category", { length: 50 }).notNull().default("general"), // news, tips, projects, design-trends
  tags: jsonb("tags").default([]), // array of tag strings
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived
  language: varchar("language", { length: 5 }).notNull().default("en"), // en, vi
  featured: boolean("featured").notNull().default(false),
  publishedAt: timestamp("published_at"),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  // Analytics
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueSlugLanguage: unique().on(table.slug, table.language),
}));

export const homepageContent = pgTable("homepage_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  language: varchar("language", { length: 5 }).notNull().default("en"), // en, vi
  // Hero Section
  heroBackgroundImage: text("hero_background_image"),
  heroTitle: text("hero_title").notNull().default("IEVRA Design & Build"),
  heroStudio: text("hero_studio").notNull().default("Design"),
  heroTagline: text("hero_tagline"),
  heroArchitectureLabel: text("hero_architecture_label"),
  heroInteriorLabel: text("hero_interior_label"),
  heroConsultationText: text("hero_consultation_text"),
  // Featured Section
  featuredBadge: text("featured_badge"),
  featuredBadgeVi: text("featured_badge_vi"),
  featuredTitle: text("featured_title"),
  featuredDescription: text("featured_description"),
  featuredDescriptionVi: text("featured_description_vi"),
  // Stats Section
  statsProjectsValue: text("stats_projects_value"),
  statsProjectsLabelEn: text("stats_projects_label_en"),
  statsProjectsLabelVi: text("stats_projects_label_vi"),
  statsProjectsDescEn: text("stats_projects_desc_en"),
  statsProjectsDescVi: text("stats_projects_desc_vi"),
  statsClientsValue: text("stats_clients_value"),
  statsClientsLabelEn: text("stats_clients_label_en"),
  statsClientsLabelVi: text("stats_clients_label_vi"),
  statsClientsDescEn: text("stats_clients_desc_en"),
  statsClientsDescVi: text("stats_clients_desc_vi"),
  statsAwardsValue: text("stats_awards_value"),
  statsAwardsLabelEn: text("stats_awards_label_en"),
  statsAwardsLabelVi: text("stats_awards_label_vi"),
  statsAwardsDescEn: text("stats_awards_desc_en"),
  statsAwardsDescVi: text("stats_awards_desc_vi"),
  statsExperienceValue: text("stats_experience_value"),
  statsExperienceLabelEn: text("stats_experience_label_en"),
  statsExperienceLabelVi: text("stats_experience_label_vi"),
  statsExperienceDescEn: text("stats_experience_desc_en"),
  statsExperienceDescVi: text("stats_experience_desc_vi"),
  // Process/Journey Section
  journeyTitle: text("journey_title"),
  journeyTitleVi: text("journey_title_vi"),
  journeyDescription: text("journey_description"),
  journeyDescriptionVi: text("journey_description_vi"),
  // Advantages Section
  advantagesTitle: text("advantages_title"),
  advantagesTitleVi: text("advantages_title_vi"),
  advantagesSubtitle: text("advantages_subtitle"),
  advantagesSubtitleVi: text("advantages_subtitle_vi"),
  // FAQ Section Header
  faqSectionTitle: text("faq_section_title"),
  faqSectionTitleVi: text("faq_section_title_vi"),
  faqSectionSubtitle: text("faq_section_subtitle"),
  faqSectionSubtitleVi: text("faq_section_subtitle_vi"),
  // Partners Section Header
  partnersTitle: text("partners_title"),
  partnersTitleVi: text("partners_title_vi"),
  partnersSubtitle: text("partners_subtitle"),
  partnersSubtitleVi: text("partners_subtitle_vi"),
  // Featured News Section
  featuredNewsTitle: text("featured_news_title"),
  featuredNewsTitleVi: text("featured_news_title_vi"),
  featuredNewsSubtitle: text("featured_news_subtitle"),
  featuredNewsSubtitleVi: text("featured_news_subtitle_vi"),
  // CTA/Questions Section
  ctaSubtitle: text("cta_subtitle"),
  ctaSubtitleVi: text("cta_subtitle_vi"),
  // Quality/Banner Section 1
  qualityBackgroundImage: text("quality_background_image"),
  qualityLeftText: text("quality_left_text"),
  qualityLeftTextVi: text("quality_left_text_vi"),
  qualityRightText: text("quality_right_text"),
  qualityRightTextVi: text("quality_right_text_vi"),
  // Quality/Banner Section 2
  quality2BackgroundImage: text("quality2_background_image"),
  quality2LeftText: text("quality2_left_text"),
  quality2LeftTextVi: text("quality2_left_text_vi"),
  quality2RightText: text("quality2_right_text"),
  quality2RightTextVi: text("quality2_right_text_vi"),
  // CTA Section
  ctaTitle: text("cta_title"),
  ctaDescription: text("cta_description"),
  ctaButtonText: text("cta_button_text"),
  ctaSecondaryButtonText: text("cta_secondary_button_text"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueLanguage: unique().on(table.language),
}));

export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logo: text("logo"), // URL to partner logo
  logoData: text("logo_data"), // Base64 encoded logo file
  website: text("website"), // Optional partner website URL
  description: text("description"), // Optional description
  shape: varchar("shape", { length: 20 }).default('landscape'), // 'landscape' | 'square' | 'portrait'
  logoZoom: real("logo_zoom").notNull().default(1),
  logoOffsetX: integer("logo_offset_x").notNull().default(0),
  logoOffsetY: integer("logo_offset_y").notNull().default(0),
  order: integer("order").notNull().default(0), // For display ordering
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameVi: text("name_vi"), // Vietnamese name for bilingual support
  slug: text("slug").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "project" or "article"
  description: text("description"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueSlugType: unique().on(table.slug, table.type),
}));

// CRM: Client Interactions/Activities
export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  type: varchar("type", { length: 30 }).notNull(), // visit, meeting, site_survey, design, acceptance, call, email
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  duration: integer("duration"), // Duration in minutes
  location: text("location"),
  assignedTo: text("assigned_to"), // Staff member name
  outcome: text("outcome"), // Result or notes from interaction
  nextAction: text("next_action"), // Follow-up action required
  nextActionDate: timestamp("next_action_date"),
  phase: text("phase"),
  attachments: jsonb("attachments").default([]), // Array of file URLs
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CRM: Deals/Contracts
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  title: text("title").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  stage: varchar("stage", { length: 20 }).notNull().default("proposal"), // proposal, negotiation, contract, delivery, completed, lost
  probability: integer("probability").notNull().default(50), // 0-100%
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  description: text("description"),
  terms: text("terms"), // Contract terms
  notes: text("notes"),
  lostReason: text("lost_reason"), // If deal is lost, why?
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CRM: Transactions/Orders - Track client payments and orders
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  title: text("title").notNull(), // e.g., "Sake Classic", "Thiết kế nội thất phòng khách"
  description: text("description"), // e.g., "Sake Nguyệt", "Thi công hoàn thiện"
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("payment"), // payment, refund, commission
  status: varchar("status", { length: 20 }).notNull().default("completed"), // pending, completed, cancelled
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  category: varchar("category", { length: 20 }).notNull().default("design"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const clientsRelations = relations(clients, ({ many, one }) => ({
  inquiries: many(inquiries),
  interactions: many(interactions),
  deals: many(deals),
  transactions: many(transactions),
  referredBy: one(clients, {
    fields: [clients.referredById],
    references: [clients.id],
    relationName: "referrals",
  }),
  referrals: many(clients, {
    relationName: "referrals",
  }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  client: one(clients, {
    fields: [inquiries.clientId],
    references: [clients.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  client: one(clients, {
    fields: [interactions.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [interactions.createdBy],
    references: [users.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  client: one(clients, {
    fields: [deals.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [deals.projectId],
    references: [projects.id],
  }),
  assignedTo: one(users, {
    fields: [deals.assignedTo],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [deals.createdBy],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  client: one(clients, {
    fields: [transactions.clientId],
    references: [clients.id],
  }),
}));

export const warrantyLogs = pgTable("warranty_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  date: timestamp("date").notNull().defaultNow(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: text("assigned_to"),
  attachments: text("attachments").array(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const warrantyLogsRelations = relations(warrantyLogs, ({ one }) => ({
  client: one(clients, {
    fields: [warrantyLogs.clientId],
    references: [clients.id],
  }),
}));

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.union([z.string(), z.date()]).optional().transform(val => val ? (typeof val === 'string' && val.trim() !== '' ? new Date(val) : typeof val === 'object' ? val : undefined) : undefined),
  intakeDate: z.union([z.string(), z.date()]).optional().transform(val => val ? (typeof val === 'string' && val.trim() !== '' ? new Date(val) : typeof val === 'object' ? val : undefined) : undefined),
  warrantyExpiry: z.union([z.string(), z.date()]).optional().transform(val => val ? (typeof val === 'string' && val.trim() !== '' ? new Date(val) : typeof val === 'object' ? val : undefined) : undefined),
  tags: z.array(z.string()).optional().default([]),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertHomepageContentSchema = createInsertSchema(homepageContent).omit({
  id: true,
  updatedAt: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  paymentDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ])
});

export const insertWarrantyLogSchema = createInsertSchema(warrantyLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ])
});

export const insertBusinessPartnerSchema = createInsertSchema(businessPartners).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  dateOfBirth: z.union([z.string(), z.date()]).optional().transform(val => val ? (typeof val === 'string' && val.trim() !== '' ? new Date(val) : typeof val === 'object' ? val : undefined) : undefined),
  intakeDate: z.union([z.string(), z.date()]).optional().transform(val => val ? (typeof val === 'string' && val.trim() !== '' ? new Date(val) : typeof val === 'object' ? val : undefined) : undefined),
  warrantyExpiry: z.union([z.string(), z.date()]).optional().transform(val => val ? (typeof val === 'string' && val.trim() !== '' ? new Date(val) : typeof val === 'object' ? val : undefined) : undefined),
  tags: z.array(z.string()).optional().default([]),
});

export const insertBpTransactionSchema = createInsertSchema(bpTransactions).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  paymentDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).optional()
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertBusinessPartner = z.infer<typeof insertBusinessPartnerSchema>;
export type BusinessPartner = typeof businessPartners.$inferSelect;

export type InsertBpTransaction = z.infer<typeof insertBpTransactionSchema>;
export type BpTransaction = typeof bpTransactions.$inferSelect;

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

export type InsertHomepageContent = z.infer<typeof insertHomepageContentSchema>;
export type HomepageContent = typeof homepageContent.$inferSelect;

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertWarrantyLog = z.infer<typeof insertWarrantyLogSchema>;
export type WarrantyLog = typeof warrantyLogs.$inferSelect;

// Settings/Branding table
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logoUrl: text("logo_url"),
  logoData: text("logo_data"), // Base64 encoded image data
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  linkedinUrl: text("linkedin_url"),
  zaloUrl: text("zalo_url"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  // SEO Settings (bilingual)
  siteTitle: text("site_title"),
  siteTitleVi: text("site_title_vi"),
  metaDescription: text("meta_description"),
  metaDescriptionVi: text("meta_description_vi"),
  metaKeywords: text("meta_keywords"),
  metaKeywordsVi: text("meta_keywords_vi"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// FAQs table
export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  page: varchar("page", { length: 20 }).notNull(), // "home", "contact"
  language: varchar("language", { length: 5 }).notNull().default("en"), // en, vi
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

// Advantages table (Why Choose Us section)
export const advantages = pgTable("advantages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icon: text("icon").notNull(), // Lucide icon name (e.g., "Sparkles", "Headset")
  titleEn: text("title_en").notNull(),
  titleVi: text("title_vi").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionVi: text("description_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdvantageSchema = createInsertSchema(advantages).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdvantage = z.infer<typeof insertAdvantageSchema>;
export type Advantage = typeof advantages.$inferSelect;

// Design Journey Steps table (5-step process section)
export const journeySteps = pgTable("journey_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stepNumber: integer("step_number").notNull().default(1), // Auto set to 1 by default
  titleEn: text("title_en").notNull(),
  titleVi: text("title_vi").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionVi: text("description_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJourneyStepSchema = createInsertSchema(journeySteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertJourneyStep = z.infer<typeof insertJourneyStepSchema>;
export type JourneyStep = typeof journeySteps.$inferSelect;

// About Page Content table
export const aboutPageContent = pgTable("about_page_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Hero Section
  heroTitleEn: text("hero_title_en").notNull().default("ARCHITECTURAL & INTERIOR DESIGN"),
  heroTitleVi: text("hero_title_vi").notNull().default("THIẾT KẾ KIẾN TRÚC VÀ NỘI THẤT"),
  heroSubtitleEn: text("hero_subtitle_en").notNull().default("INNOVATION IN EVERY PROJECT"),
  heroSubtitleVi: text("hero_subtitle_vi").notNull().default("ĐỔI MỚI TRONG MỌI DỰ ÁN"),
  heroImages: text("hero_images").array().notNull().default(sql`ARRAY[]::text[]`),
  // Principles Section
  principlesSubtitleEn: text("principles_subtitle_en").notNull().default("OUR PRINCIPLES"),
  principlesSubtitleVi: text("principles_subtitle_vi").notNull().default("NGUYÊN TẮC LÀM VIỆC"),
  principlesTitleEn: text("principles_title_en").notNull().default("THE FOUNDATION OF OUR WORK"),
  principlesTitleVi: text("principles_title_vi").notNull().default("NỀN TẢNG CỦA CÔNG VIỆC CHÚNG TÔI"),
  principlesContentEn: text("principles_content_en").notNull().default(""),
  principlesContentVi: text("principles_content_vi").notNull().default(""),
  principlesImageLeft: text("principles_image_left").notNull().default(""),
  principlesImageLeftData: text("principles_image_left_data"),
  principlesImageRight: text("principles_image_right").notNull().default(""),
  principlesImageRightData: text("principles_image_right_data"),
  // Architecture Showcase Section
  showcaseBannerImage: text("showcase_banner_image").notNull().default(""),
  showcaseBannerImageData: text("showcase_banner_image_data"),
  // Stats Section (4 stats)
  statsProjectsValue: text("stats_projects_value").notNull().default("150+"),
  statsProjectsLabelEn: text("stats_projects_label_en").notNull().default("Projects Completed"),
  statsProjectsLabelVi: text("stats_projects_label_vi").notNull().default("Dự án hoàn thành"),
  statsAwardsValue: text("stats_awards_value").notNull().default("25+"),
  statsAwardsLabelEn: text("stats_awards_label_en").notNull().default("Design Awards"),
  statsAwardsLabelVi: text("stats_awards_label_vi").notNull().default("Giải thưởng thiết kế"),
  statsClientsValue: text("stats_clients_value").notNull().default("200+"),
  statsClientsLabelEn: text("stats_clients_label_en").notNull().default("Happy Clients"),
  statsClientsLabelVi: text("stats_clients_label_vi").notNull().default("Khách hàng hài lòng"),
  statsCountriesValue: text("stats_countries_value").notNull().default("12+"),
  statsCountriesLabelEn: text("stats_countries_label_en").notNull().default("Countries"),
  statsCountriesLabelVi: text("stats_countries_label_vi").notNull().default("Quốc gia"),
  // Awards Section
  awardsSectionTitleEn: text("awards_section_title_en").notNull().default("AWARDS & RECOGNITION"),
  awardsSectionTitleVi: text("awards_section_title_vi").notNull().default("GIẢI THƯỞNG & CÔNG NHẬN"),
  // Process Section
  processSubtitleEn: text("process_subtitle_en").notNull().default("OUR PROCESS"),
  processSubtitleVi: text("process_subtitle_vi").notNull().default("QUY TRÌNH LÀM VIỆC"),
  processTitleEn: text("process_title_en").notNull().default("FROM CONCEPT TO REALITY"),
  processTitleVi: text("process_title_vi").notNull().default("TỪ Ý TƯỞNG ĐẾN HIỆN THỰC"),
  // Company History Section
  historySubtitleEn: text("history_subtitle_en").notNull().default("COMPANY HISTORY"),
  historySubtitleVi: text("history_subtitle_vi").notNull().default("LỊCH SỬ HÌNH THÀNH"),
  historyTitleEn: text("history_title_en").notNull().default("OUR STORY"),
  historyTitleVi: text("history_title_vi").notNull().default("CÂU CHUYỆN CỦA CHÚNG TÔI"),
  historyContentEn: text("history_content_en").notNull().default(""),
  historyContentVi: text("history_content_vi").notNull().default(""),
  historyImage: text("history_image"),
  // Mission Section
  missionTitleEn: text("mission_title_en").notNull().default("OUR MISSION"),
  missionTitleVi: text("mission_title_vi").notNull().default("SỨ MỆNH"),
  missionContentEn: text("mission_content_en").notNull().default(""),
  missionContentVi: text("mission_content_vi").notNull().default(""),
  // Vision Section
  visionTitleEn: text("vision_title_en").notNull().default("OUR VISION"),
  visionTitleVi: text("vision_title_vi").notNull().default("TẦM NHÌN"),
  visionContentEn: text("vision_content_en").notNull().default(""),
  visionContentVi: text("vision_content_vi").notNull().default(""),
  // Mission Image (small)
  missionImage: text("mission_image"),
  missionImageData: text("mission_image_data"),
  // Vision Image (large)
  missionVisionImage: text("mission_vision_image"),
  missionVisionImageData: text("mission_vision_image_data"),
  // Core Values Section Title
  coreValuesSubtitleEn: text("core_values_subtitle_en").notNull().default("CORE VALUES"),
  coreValuesSubtitleVi: text("core_values_subtitle_vi").notNull().default("GIÁ TRỊ CỐT LÕI"),
  coreValuesTitleEn: text("core_values_title_en").notNull().default("CORE VALUES"),
  coreValuesTitleVi: text("core_values_title_vi").notNull().default("GIÁ TRỊ CỐT LÕI"),
  // Team Section Title
  teamSubtitleEn: text("team_subtitle_en").notNull().default("OUR TEAM"),
  teamSubtitleVi: text("team_subtitle_vi").notNull().default("ĐỘI NGŨ"),
  teamTitleEn: text("team_title_en").notNull().default("OUR TEAM"),
  teamTitleVi: text("team_title_vi").notNull().default("ĐỘI NGŨ"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// About Page Showcase Services (Architecture Showcase Section)
export const aboutShowcaseServices = pgTable("about_showcase_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  titleEn: text("title_en").notNull(),
  titleVi: text("title_vi").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionVi: text("description_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// About Page Process Steps
export const aboutProcessSteps = pgTable("about_process_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stepNumber: text("step_number").notNull(), // "01", "02", "03", "04"
  titleEn: text("title_en").notNull(),
  titleVi: text("title_vi").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionVi: text("description_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// About Page Core Values
export const aboutCoreValues = pgTable("about_core_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icon: text("icon").notNull(), // Lucide icon name
  titleEn: text("title_en").notNull(),
  titleVi: text("title_vi").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionVi: text("description_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// About Page Team Members
export const aboutTeamMembers = pgTable("about_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  positionEn: text("position_en").notNull(),
  positionVi: text("position_vi").notNull(),
  bioEn: text("bio_en").notNull(),
  bioVi: text("bio_vi").notNull(),
  achievementsEn: text("achievements_en"),
  achievementsVi: text("achievements_vi"),
  philosophyEn: text("philosophy_en"),
  philosophyVi: text("philosophy_vi"),
  image: text("image").notNull().default(""),
  imageData: text("image_data"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertAboutPageContentSchema = createInsertSchema(aboutPageContent).omit({
  id: true,
  updatedAt: true,
});

export const insertAboutShowcaseServiceSchema = createInsertSchema(aboutShowcaseServices).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAboutProcessStepSchema = createInsertSchema(aboutProcessSteps).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAboutCoreValueSchema = createInsertSchema(aboutCoreValues).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAboutTeamMemberSchema = createInsertSchema(aboutTeamMembers).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertAboutPageContent = z.infer<typeof insertAboutPageContentSchema>;
export type AboutPageContent = typeof aboutPageContent.$inferSelect;

export type InsertAboutShowcaseService = z.infer<typeof insertAboutShowcaseServiceSchema>;
export type AboutShowcaseService = typeof aboutShowcaseServices.$inferSelect;

export type InsertAboutProcessStep = z.infer<typeof insertAboutProcessStepSchema>;
export type AboutProcessStep = typeof aboutProcessSteps.$inferSelect;

export type InsertAboutCoreValue = z.infer<typeof insertAboutCoreValueSchema>;
export type AboutCoreValue = typeof aboutCoreValues.$inferSelect;

export type InsertAboutTeamMember = z.infer<typeof insertAboutTeamMemberSchema>;
export type AboutTeamMember = typeof aboutTeamMembers.$inferSelect;

// About Page Awards
export const aboutAwards = pgTable("about_awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  titleEn: text("title_en").notNull(),
  titleVi: text("title_vi").notNull(),
  year: text("year").notNull().default(""),
  organizationEn: text("organization_en").notNull().default(""),
  organizationVi: text("organization_vi").notNull().default(""),
  image: text("image").notNull().default(""),
  imageData: text("image_data"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAboutAwardSchema = createInsertSchema(aboutAwards).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAboutAward = z.infer<typeof insertAboutAwardSchema>;
export type AboutAward = typeof aboutAwards.$inferSelect;

// CRM Dropdown Settings Tables
export const crmPipelineStages = pgTable("crm_pipeline_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(), // Internal value like "lead", "prospect"
  labelEn: text("label_en").notNull(), // English display label
  labelVi: text("label_vi").notNull(), // Vietnamese display label
  order: integer("order").notNull().default(0), // For sorting
  active: boolean("active").notNull().default(true), // Enable/disable option
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const crmCustomerTiers = pgTable("crm_customer_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(), // Internal value like "silver", "gold"
  labelEn: text("label_en").notNull(), // English display label
  labelVi: text("label_vi").notNull(), // Vietnamese display label
  order: integer("order").notNull().default(0), // For sorting
  active: boolean("active").notNull().default(true), // Enable/disable option
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const crmStatuses = pgTable("crm_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(), // Internal value like "active", "inactive"
  labelEn: text("label_en").notNull(), // English display label
  labelVi: text("label_vi").notNull(), // Vietnamese display label
  order: integer("order").notNull().default(0), // For sorting
  active: boolean("active").notNull().default(true), // Enable/disable option
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bpCategories = pgTable("bp_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(),
  labelEn: text("label_en").notNull(),
  labelVi: text("label_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bpStatuses = pgTable("bp_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(),
  labelEn: text("label_en").notNull(),
  labelVi: text("label_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bpTiers = pgTable("bp_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(),
  labelEn: text("label_en").notNull(),
  labelVi: text("label_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CRM Dropdown Settings Schemas
export const insertCrmPipelineStageSchema = createInsertSchema(crmPipelineStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrmCustomerTierSchema = createInsertSchema(crmCustomerTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrmStatusSchema = createInsertSchema(crmStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBpCategorySchema = createInsertSchema(bpCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBpStatusSchema = createInsertSchema(bpStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBpTierSchema = createInsertSchema(bpTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// CRM Dropdown Settings Types
export type InsertCrmPipelineStage = z.infer<typeof insertCrmPipelineStageSchema>;
export type CrmPipelineStage = typeof crmPipelineStages.$inferSelect;

export type InsertCrmCustomerTier = z.infer<typeof insertCrmCustomerTierSchema>;
export type CrmCustomerTier = typeof crmCustomerTiers.$inferSelect;

export type InsertCrmStatus = z.infer<typeof insertCrmStatusSchema>;
export type CrmStatus = typeof crmStatuses.$inferSelect;

export type InsertBpCategory = z.infer<typeof insertBpCategorySchema>;
export type BpCategory = typeof bpCategories.$inferSelect;

export type InsertBpStatus = z.infer<typeof insertBpStatusSchema>;
export type BpStatus = typeof bpStatuses.$inferSelect;

export type InsertBpTier = z.infer<typeof insertBpTierSchema>;
export type BpTier = typeof bpTiers.$inferSelect;

export const constructionPhases = pgTable("construction_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(),
  labelEn: text("label_en").notNull(),
  labelVi: text("label_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConstructionPhaseSchema = createInsertSchema(constructionPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConstructionPhase = z.infer<typeof insertConstructionPhaseSchema>;
export type ConstructionPhase = typeof constructionPhases.$inferSelect;

export const designPhases = pgTable("design_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(),
  labelEn: text("label_en").notNull(),
  labelVi: text("label_vi").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDesignPhaseSchema = createInsertSchema(designPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDesignPhase = z.infer<typeof insertDesignPhaseSchema>;
export type DesignPhase = typeof designPhases.$inferSelect;
