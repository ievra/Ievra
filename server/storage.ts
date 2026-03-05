import { 
  users, clients, projects, inquiries, services, articles, homepageContent, partners, categories,
  interactions, deals, transactions, warrantyLogs, settings, faqs, advantages, journeySteps,
  aboutPageContent, aboutShowcaseServices, aboutProcessSteps, aboutCoreValues, aboutTeamMembers, aboutAwards,
  crmPipelineStages, crmCustomerTiers, crmStatuses,
  bpCategories, bpStatuses, bpTiers,
  businessPartners, bpTransactions,
  constructionPhases,
  designPhases,
  type User, type InsertUser,
  type Client, type InsertClient,
  type BusinessPartner, type InsertBusinessPartner,
  type BpTransaction, type InsertBpTransaction,
  type Project, type InsertProject,
  type Inquiry, type InsertInquiry,
  type Service, type InsertService,
  type Article, type InsertArticle,
  type HomepageContent, type InsertHomepageContent,
  type Partner, type InsertPartner,
  type Category, type InsertCategory,
  type Interaction, type InsertInteraction,
  type Deal, type InsertDeal,
  type Transaction, type InsertTransaction,
  type WarrantyLog, type InsertWarrantyLog,
  type Settings, type InsertSettings,
  type Faq, type InsertFaq,
  type Advantage, type InsertAdvantage,
  type JourneyStep, type InsertJourneyStep,
  type AboutPageContent, type InsertAboutPageContent,
  type AboutShowcaseService, type InsertAboutShowcaseService,
  type AboutProcessStep, type InsertAboutProcessStep,
  type AboutCoreValue, type InsertAboutCoreValue,
  type AboutTeamMember, type InsertAboutTeamMember,
  type AboutAward, type InsertAboutAward,
  type CrmPipelineStage, type InsertCrmPipelineStage,
  type CrmCustomerTier, type InsertCrmCustomerTier,
  type CrmStatus, type InsertCrmStatus,
  type BpCategory, type InsertBpCategory,
  type BpStatus, type InsertBpStatus,
  type BpTier, type InsertBpTier,
  type ConstructionPhase, type InsertConstructionPhase,
  type DesignPhase, type InsertDesignPhase
} from "@shared/schema";
import { db } from "./db";
import { eq, ne, desc, like, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;

  // Projects
  getProjects(filters?: { category?: string; featured?: boolean; language?: string }): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectBySlug(slug: string, language?: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Clients
  getClients(status?: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Business Partners
  getBusinessPartners(status?: string): Promise<BusinessPartner[]>;
  getBusinessPartner(id: string): Promise<BusinessPartner | undefined>;
  getBusinessPartnerByEmail(email: string): Promise<BusinessPartner | undefined>;
  createBusinessPartner(bp: InsertBusinessPartner): Promise<BusinessPartner>;
  updateBusinessPartner(id: string, bp: Partial<InsertBusinessPartner>): Promise<BusinessPartner>;
  deleteBusinessPartner(id: string): Promise<void>;

  // Business Partner Transactions
  getBpTransactions(businessPartnerId?: string): Promise<BpTransaction[]>;
  getBpTransaction(id: string): Promise<BpTransaction | undefined>;
  createBpTransaction(transaction: InsertBpTransaction): Promise<BpTransaction>;
  updateBpTransaction(id: string, transaction: Partial<InsertBpTransaction>): Promise<BpTransaction>;
  deleteBpTransaction(id: string): Promise<void>;

  // Inquiries
  getInquiries(status?: string): Promise<Inquiry[]>;
  getInquiry(id: string): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry>;
  deleteInquiry(id: string): Promise<void>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Articles/Blog
  getArticles(filters?: { 
    category?: string; 
    featured?: boolean; 
    status?: string; 
    language?: string;
    tags?: string[];
  }): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  getArticleBySlug(slug: string, language?: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  incrementArticleViews(id: string): Promise<void>;

  // Homepage Content
  getHomepageContent(language?: string): Promise<HomepageContent | undefined>;
  getAnyHomepageContent(): Promise<HomepageContent | undefined>;
  upsertHomepageContent(content: InsertHomepageContent): Promise<HomepageContent>;

  // Partners
  getPartners(active?: boolean): Promise<Partner[]>;
  getPartner(id: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, partner: Partial<InsertPartner>): Promise<Partner>;
  deletePartner(id: string): Promise<void>;

  // Categories
  getCategories(type?: string, active?: boolean): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // CRM: Interactions
  getInteractions(clientId?: string): Promise<Interaction[]>;
  getInteraction(id: string): Promise<Interaction | undefined>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  updateInteraction(id: string, interaction: Partial<InsertInteraction>): Promise<Interaction>;
  deleteInteraction(id: string): Promise<void>;

  // CRM: Deals
  getDeals(filters?: { clientId?: string; stage?: string }): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;

  // CRM: Transactions
  getTransactions(clientId?: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Warranty Logs
  getWarrantyLogs(clientId?: string): Promise<WarrantyLog[]>;
  getWarrantyLog(id: string): Promise<WarrantyLog | undefined>;
  createWarrantyLog(log: InsertWarrantyLog): Promise<WarrantyLog>;
  updateWarrantyLog(id: string, log: Partial<InsertWarrantyLog>): Promise<WarrantyLog>;
  deleteWarrantyLog(id: string): Promise<void>;

  // CRM: Analytics & Reporting
  getClientReferrals(clientId: string): Promise<Client[]>;
  updateClientTier(clientId: string): Promise<void>;

  // Settings/Branding
  getSettings(): Promise<Settings | undefined>;
  upsertSettings(settings: InsertSettings): Promise<Settings>;

  // FAQs
  getFaqs(filters?: { page?: string; language?: string; active?: boolean }): Promise<Faq[]>;
  getFaq(id: string): Promise<Faq | undefined>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq>;
  deleteFaq(id: string): Promise<void>;

  // Advantages (Why Choose Us)
  getAdvantages(filters?: { active?: boolean }): Promise<Advantage[]>;
  getAdvantage(id: string): Promise<Advantage | undefined>;
  createAdvantage(advantage: InsertAdvantage): Promise<Advantage>;
  updateAdvantage(id: string, advantage: Partial<InsertAdvantage>): Promise<Advantage>;
  deleteAdvantage(id: string): Promise<void>;

  // Journey Steps (Design Process)
  getJourneySteps(filters?: { active?: boolean }): Promise<JourneyStep[]>;
  getJourneyStep(id: string): Promise<JourneyStep | undefined>;
  createJourneyStep(journeyStep: InsertJourneyStep): Promise<JourneyStep>;
  updateJourneyStep(id: string, journeyStep: Partial<InsertJourneyStep>): Promise<JourneyStep>;
  deleteJourneyStep(id: string): Promise<void>;

  // About Page Content
  getAboutPageContent(): Promise<AboutPageContent | undefined>;
  upsertAboutPageContent(content: InsertAboutPageContent): Promise<AboutPageContent>;

  // About Page Showcase Services
  getAboutShowcaseServices(filters?: { active?: boolean }): Promise<AboutShowcaseService[]>;
  getAboutShowcaseService(id: string): Promise<AboutShowcaseService | undefined>;
  createAboutShowcaseService(service: InsertAboutShowcaseService): Promise<AboutShowcaseService>;
  updateAboutShowcaseService(id: string, service: Partial<InsertAboutShowcaseService>): Promise<AboutShowcaseService>;
  deleteAboutShowcaseService(id: string): Promise<void>;

  // About Page Process Steps
  getAboutProcessSteps(filters?: { active?: boolean }): Promise<AboutProcessStep[]>;
  getAboutProcessStep(id: string): Promise<AboutProcessStep | undefined>;
  createAboutProcessStep(step: InsertAboutProcessStep): Promise<AboutProcessStep>;
  updateAboutProcessStep(id: string, step: Partial<InsertAboutProcessStep>): Promise<AboutProcessStep>;
  deleteAboutProcessStep(id: string): Promise<void>;

  // About Page Core Values
  getAboutCoreValues(filters?: { active?: boolean }): Promise<AboutCoreValue[]>;
  getAboutCoreValue(id: string): Promise<AboutCoreValue | undefined>;
  createAboutCoreValue(value: InsertAboutCoreValue): Promise<AboutCoreValue>;
  updateAboutCoreValue(id: string, value: Partial<InsertAboutCoreValue>): Promise<AboutCoreValue>;
  deleteAboutCoreValue(id: string): Promise<void>;

  // About Page Team Members
  getAboutTeamMembers(filters?: { active?: boolean }): Promise<AboutTeamMember[]>;
  getAboutTeamMember(id: string): Promise<AboutTeamMember | undefined>;
  createAboutTeamMember(member: InsertAboutTeamMember): Promise<AboutTeamMember>;
  updateAboutTeamMember(id: string, member: Partial<InsertAboutTeamMember>): Promise<AboutTeamMember>;
  deleteAboutTeamMember(id: string): Promise<void>;

  // About Page Awards
  getAboutAwards(filters?: { active?: boolean }): Promise<AboutAward[]>;
  getAboutAward(id: string): Promise<AboutAward | undefined>;
  createAboutAward(award: InsertAboutAward): Promise<AboutAward>;
  updateAboutAward(id: string, award: Partial<InsertAboutAward>): Promise<AboutAward>;
  deleteAboutAward(id: string): Promise<void>;

  // CRM Pipeline Stages
  getCrmPipelineStages(filters?: { active?: boolean }): Promise<CrmPipelineStage[]>;
  getCrmPipelineStage(id: string): Promise<CrmPipelineStage | undefined>;
  createCrmPipelineStage(stage: InsertCrmPipelineStage): Promise<CrmPipelineStage>;
  updateCrmPipelineStage(id: string, stage: Partial<InsertCrmPipelineStage>): Promise<CrmPipelineStage>;
  deleteCrmPipelineStage(id: string): Promise<void>;

  // CRM Customer Tiers
  getCrmCustomerTiers(filters?: { active?: boolean }): Promise<CrmCustomerTier[]>;
  getCrmCustomerTier(id: string): Promise<CrmCustomerTier | undefined>;
  createCrmCustomerTier(tier: InsertCrmCustomerTier): Promise<CrmCustomerTier>;
  updateCrmCustomerTier(id: string, tier: Partial<InsertCrmCustomerTier>): Promise<CrmCustomerTier>;
  deleteCrmCustomerTier(id: string): Promise<void>;

  // CRM Statuses
  getCrmStatuses(filters?: { active?: boolean }): Promise<CrmStatus[]>;
  getCrmStatus(id: string): Promise<CrmStatus | undefined>;
  createCrmStatus(status: InsertCrmStatus): Promise<CrmStatus>;
  updateCrmStatus(id: string, status: Partial<InsertCrmStatus>): Promise<CrmStatus>;
  deleteCrmStatus(id: string): Promise<void>;

  // BP Categories
  getBpCategories(filters?: { active?: boolean }): Promise<BpCategory[]>;
  getBpCategory(id: string): Promise<BpCategory | undefined>;
  createBpCategory(category: InsertBpCategory): Promise<BpCategory>;
  updateBpCategory(id: string, category: Partial<InsertBpCategory>): Promise<BpCategory>;
  deleteBpCategory(id: string): Promise<void>;

  // BP Statuses
  getBpStatuses(filters?: { active?: boolean }): Promise<BpStatus[]>;
  getBpStatus(id: string): Promise<BpStatus | undefined>;
  createBpStatus(status: InsertBpStatus): Promise<BpStatus>;
  updateBpStatus(id: string, status: Partial<InsertBpStatus>): Promise<BpStatus>;
  deleteBpStatus(id: string): Promise<void>;

  // BP Tiers
  getBpTiers(filters?: { active?: boolean }): Promise<BpTier[]>;
  getBpTier(id: string): Promise<BpTier | undefined>;
  createBpTier(tier: InsertBpTier): Promise<BpTier>;
  updateBpTier(id: string, tier: Partial<InsertBpTier>): Promise<BpTier>;
  deleteBpTier(id: string): Promise<void>;

  // Construction Phases
  getConstructionPhases(filters?: { active?: boolean }): Promise<ConstructionPhase[]>;
  createConstructionPhase(phase: InsertConstructionPhase): Promise<ConstructionPhase>;
  updateConstructionPhase(id: string, phase: Partial<InsertConstructionPhase>): Promise<ConstructionPhase>;
  deleteConstructionPhase(id: string): Promise<void>;

  // Design Phases
  getDesignPhases(filters?: { active?: boolean }): Promise<DesignPhase[]>;
  createDesignPhase(phase: InsertDesignPhase): Promise<DesignPhase>;
  updateDesignPhase(id: string, phase: Partial<InsertDesignPhase>): Promise<DesignPhase>;
  deleteDesignPhase(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Projects
  async getProjects(filters?: { category?: string; featured?: boolean; language?: string; status?: string }): Promise<Project[]> {
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(projects.category, filters.category));
    }
    
    if (filters?.featured !== undefined) {
      conditions.push(eq(projects.featured, filters.featured));
    }
    
    if (filters?.language) {
      conditions.push(eq(projects.language, filters.language));
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(projects.status, filters.status));
    }
    
    const query = conditions.length > 0
      ? db.select().from(projects).where(and(...conditions))
      : db.select().from(projects);
    
    return await query.orderBy(desc(projects.createdAt)).limit(100);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectBySlug(slug: string, language?: string): Promise<Project | undefined> {
    const conditions = [eq(projects.slug, slug)];
    if (language) {
      conditions.push(eq(projects.language, language));
    }
    const [project] = await db.select().from(projects).where(and(...conditions));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Helper function to auto-update warranty status if expired
  private async checkAndUpdateWarrantyStatus(client: Client): Promise<Client> {
    if (client.warrantyStatus === 'active' && client.warrantyExpiry) {
      const now = new Date();
      const expiryDate = new Date(client.warrantyExpiry);
      
      // If warranty has expired, auto-update to 'expired'
      if (expiryDate < now) {
        const [updatedClient] = await db
          .update(clients)
          .set({ warrantyStatus: 'expired', updatedAt: new Date() })
          .where(eq(clients.id, client.id))
          .returning();
        return updatedClient;
      }
    }
    return client;
  }

  // Clients
  async getClients(status?: string): Promise<Client[]> {
    const query = status
      ? db.select().from(clients).where(eq(clients.status, status))
      : db.select().from(clients);
    
    const clientList = await query.orderBy(desc(clients.createdAt));
    
    // Check and update warranty status for all clients, and recalculate spending
    const updatedClients = await Promise.all(
      clientList.map(async (client: Client) => {
        // Update warranty status
        const warrantyUpdated = await this.checkAndUpdateWarrantyStatus(client);
        
        // Recalculate spending to ensure it's up to date
        await this.recalculateClientSpending(warrantyUpdated.id);
        
        // Fetch updated client with recalculated values
        const [refreshed] = await db.select().from(clients).where(eq(clients.id, warrantyUpdated.id));
        return refreshed as Client;
      })
    );
    
    return updatedClients;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) return undefined;
    
    // Check and update warranty status
    return await this.checkAndUpdateWarrantyStatus(client);
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.clientId, id));
    await db.delete(deals).where(eq(deals.clientId, id));
    await db.delete(interactions).where(eq(interactions.clientId, id));
    await db.update(inquiries).set({ clientId: null }).where(eq(inquiries.clientId, id));
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Inquiries
  async getInquiries(status?: string): Promise<Inquiry[]> {
    const query = status
      ? db.select().from(inquiries).where(eq(inquiries.status, status))
      : db.select().from(inquiries);
    
    return await query.orderBy(desc(inquiries.createdAt));
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry || undefined;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set(inquiry)
      .where(eq(inquiries.id, id))
      .returning();
    return updatedInquiry;
  }

  async deleteInquiry(id: string): Promise<void> {
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.order);
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Articles/Blog
  async getArticles(filters?: { 
    category?: string; 
    featured?: boolean; 
    status?: string; 
    language?: string;
    tags?: string[];
  }): Promise<Article[]> {
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(articles.category, filters.category));
    }
    
    if (filters?.featured !== undefined) {
      conditions.push(eq(articles.featured, filters.featured));
    }
    
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(articles.status, filters.status));
    } else if (!filters?.status) {
      conditions.push(eq(articles.status, 'published'));
    }
    
    if (filters?.language) {
      conditions.push(eq(articles.language, filters.language));
    }
    
    const query = conditions.length > 0
      ? db.select().from(articles).where(and(...conditions))
      : db.select().from(articles);
    
    return await query
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
      .limit(100);
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article || undefined;
  }

  async getArticleBySlug(slug: string, language?: string): Promise<Article | undefined> {
    const conditions = [eq(articles.slug, slug)];
    if (language) {
      conditions.push(eq(articles.language, language));
    }
    const [article] = await db.select().from(articles).where(and(...conditions));
    return article || undefined;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article> {
    const [updatedArticle] = await db
      .update(articles)
      .set({ ...article, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return updatedArticle;
  }

  async deleteArticle(id: string): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }

  async incrementArticleViews(id: string): Promise<void> {
    await db
      .update(articles)
      .set({ viewCount: sql`${articles.viewCount} + 1` })
      .where(eq(articles.id, id));
  }

  // Homepage Content
  async getHomepageContent(language: string = "en"): Promise<HomepageContent | undefined> {
    const [content] = await db
      .select()
      .from(homepageContent)
      .where(eq(homepageContent.language, language));
    return content || undefined;
  }

  async getAnyHomepageContent(): Promise<HomepageContent | undefined> {
    const [content] = await db.select().from(homepageContent).limit(1);
    return content || undefined;
  }

  async upsertHomepageContent(content: InsertHomepageContent): Promise<HomepageContent> {
    const existing = await this.getHomepageContent(content.language || "en");
    
    if (existing) {
      const [updatedContent] = await db
        .update(homepageContent)
        .set({ ...content, updatedAt: new Date() })
        .where(eq(homepageContent.language, content.language || "en"))
        .returning();
      return updatedContent;
    } else {
      const [newContent] = await db
        .insert(homepageContent)
        .values(content)
        .returning();
      return newContent;
    }
  }

  // Partners
  async getPartners(active?: boolean): Promise<Partner[]> {
    const query = active !== undefined
      ? db.select().from(partners).where(eq(partners.active, active))
      : db.select().from(partners);
    
    return await query.orderBy(partners.order);
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner || undefined;
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [newPartner] = await db.insert(partners).values(partner).returning();
    return newPartner;
  }

  async updatePartner(id: string, partner: Partial<InsertPartner>): Promise<Partner> {
    const [updatedPartner] = await db
      .update(partners)
      .set(partner)
      .where(eq(partners.id, id))
      .returning();
    return updatedPartner;
  }

  async deletePartner(id: string): Promise<void> {
    await db.delete(partners).where(eq(partners.id, id));
  }

  // Categories
  async getCategories(type?: string, active?: boolean): Promise<Category[]> {
    const conditions = [];
    
    if (type) {
      conditions.push(eq(categories.type, type));
    }
    
    if (active !== undefined) {
      conditions.push(eq(categories.active, active));
    }
    
    const query = conditions.length > 0
      ? db.select().from(categories).where(and(...conditions))
      : db.select().from(categories);
    
    return await query.orderBy(categories.order);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // CRM: Interactions
  async getInteractions(clientId?: string): Promise<Interaction[]> {
    const query = clientId
      ? db.select().from(interactions).where(eq(interactions.clientId, clientId))
      : db.select().from(interactions);
    
    return await query.orderBy(desc(interactions.date));
  }

  async getInteraction(id: string): Promise<Interaction | undefined> {
    const [interaction] = await db.select().from(interactions).where(eq(interactions.id, id));
    return interaction || undefined;
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const [newInteraction] = await db.insert(interactions).values(interaction).returning();
    return newInteraction;
  }

  async updateInteraction(id: string, interaction: Partial<InsertInteraction>): Promise<Interaction> {
    const [updatedInteraction] = await db
      .update(interactions)
      .set({ ...interaction, updatedAt: new Date() })
      .where(eq(interactions.id, id))
      .returning();
    return updatedInteraction;
  }

  async deleteInteraction(id: string): Promise<void> {
    await db.delete(interactions).where(eq(interactions.id, id));
  }

  // CRM: Deals
  async getDeals(filters?: { clientId?: string; stage?: string }): Promise<Deal[]> {
    const conditions = [];
    
    if (filters?.clientId) {
      conditions.push(eq(deals.clientId, filters.clientId));
    }
    
    if (filters?.stage) {
      conditions.push(eq(deals.stage, filters.stage));
    }
    
    const query = conditions.length > 0
      ? db.select().from(deals).where(and(...conditions))
      : db.select().from(deals);
    
    return await query.orderBy(desc(deals.createdAt));
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal || undefined;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal> {
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...deal, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  // CRM: Transactions
  async getTransactions(clientId?: string): Promise<Transaction[]> {
    const query = clientId
      ? db.select().from(transactions).where(eq(transactions.clientId, clientId))
      : db.select().from(transactions);
    
    return await query.orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    
    // Update client totalSpending and orderCount only if status is completed
    if (newTransaction.clientId && newTransaction.status === "completed") {
      await this.recalculateClientSpending(newTransaction.clientId);
    }
    
    return newTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const oldTransaction = await this.getTransaction(id);
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    
    // Recalculate client spending if transaction affects it
    if (updatedTransaction.clientId) {
      await this.recalculateClientSpending(updatedTransaction.clientId);
    }
    
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.getTransaction(id);
    const clientId = transaction?.clientId;
    
    await db.delete(transactions).where(eq(transactions.id, id));
    
    // Recalculate client spending after deletion
    if (clientId) {
      await this.recalculateClientSpending(clientId);
    }
  }

  // Helper function to recalculate client spending from completed transactions
  private async recalculateClientSpending(clientId: string): Promise<void> {
    const clientTransactions = await this.getTransactions(clientId);
    
    let totalSpending = 0;
    let refundAmount = 0;
    let totalCommission = 0;
    let commissionCount = 0;
    let orderCount = 0;
    
    for (const transaction of clientTransactions) {
      // Only count completed transactions
      if (transaction.status === "completed") {
        const amount = parseFloat(transaction.amount);
        
        if (transaction.type === "payment") {
          totalSpending += amount;
          orderCount++;
        } else if (transaction.type === "refund") {
          refundAmount += amount;
        } else if (transaction.type === "commission") {
          totalCommission += amount;
          commissionCount++;
        }
      }
    }
    
    await db
      .update(clients)
      .set({ 
        totalSpending: totalSpending.toString(),
        refundAmount: refundAmount.toString(),
        commission: totalCommission.toString(),
        orderCount: orderCount,
        referralRevenue: totalCommission.toString(),
        referralCount: commissionCount
      })
      .where(eq(clients.id, clientId));
    
  }

  // CRM: Analytics & Reporting
  async getClientReferrals(clientId: string): Promise<Client[]> {
    return await db.select()
      .from(clients)
      .where(eq(clients.referredById, clientId))
      .orderBy(desc(clients.createdAt));
  }

  async updateClientTier(clientId: string): Promise<void> {
    const client = await this.getClient(clientId);
    if (!client) return;

    let tier = "silver";
    const spending = parseFloat(client.totalSpending as string);
    
    // Tier logic: VIP (special), Platinum (>100k), Gold (>50k), Silver (default)
    if (spending >= 100000) {
      tier = "platinum";
    } else if (spending >= 50000) {
      tier = "gold";
    }
    
    // VIP status is manually assigned or based on referrals
    if (client.referralCount >= 5 || client.tier === "vip") {
      tier = "vip";
    }

    await db
      .update(clients)
      .set({ tier })
      .where(eq(clients.id, clientId));
  }

  // Settings/Branding
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).limit(1);
    return setting || undefined;
  }

  async upsertSettings(insertSettings: InsertSettings): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ ...insertSettings, updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values(insertSettings)
        .returning();
      return created;
    }
  }

  // FAQs
  async getFaqs(filters?: { page?: string; language?: string; active?: boolean }): Promise<Faq[]> {
    const conditions = [];
    if (filters?.page) conditions.push(eq(faqs.page, filters.page));
    if (filters?.language) conditions.push(eq(faqs.language, filters.language));
    if (filters?.active !== undefined) conditions.push(eq(faqs.active, filters.active));

    const query = conditions.length > 0 
      ? db.select().from(faqs).where(and(...conditions))
      : db.select().from(faqs);

    return await query.orderBy(faqs.order);
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    const [faq] = await db.select().from(faqs).where(eq(faqs.id, id));
    return faq || undefined;
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const [created] = await db.insert(faqs).values(faq).returning();
    return created;
  }

  async updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq> {
    const [updated] = await db
      .update(faqs)
      .set({ ...faq, updatedAt: new Date() })
      .where(eq(faqs.id, id))
      .returning();
    return updated;
  }

  async deleteFaq(id: string): Promise<void> {
    await db.delete(faqs).where(eq(faqs.id, id));
  }

  // Advantages (Why Choose Us)
  async getAdvantages(filters?: { active?: boolean }): Promise<Advantage[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(advantages.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(advantages).where(and(...conditions))
      : db.select().from(advantages);

    return await query.orderBy(advantages.order);
  }

  async getAdvantage(id: string): Promise<Advantage | undefined> {
    const [advantage] = await db.select().from(advantages).where(eq(advantages.id, id));
    return advantage || undefined;
  }

  async createAdvantage(advantage: InsertAdvantage): Promise<Advantage> {
    const [created] = await db.insert(advantages).values(advantage).returning();
    return created;
  }

  async updateAdvantage(id: string, advantage: Partial<InsertAdvantage>): Promise<Advantage> {
    const [updated] = await db
      .update(advantages)
      .set({ ...advantage, updatedAt: new Date() })
      .where(eq(advantages.id, id))
      .returning();
    return updated;
  }

  async deleteAdvantage(id: string): Promise<void> {
    await db.delete(advantages).where(eq(advantages.id, id));
  }

  // Journey Steps
  async getJourneySteps(filters?: { active?: boolean }): Promise<JourneyStep[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(journeySteps.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(journeySteps).where(and(...conditions))
      : db.select().from(journeySteps);

    return await query.orderBy(journeySteps.order);
  }

  async getJourneyStep(id: string): Promise<JourneyStep | undefined> {
    const [journeyStep] = await db.select().from(journeySteps).where(eq(journeySteps.id, id));
    return journeyStep || undefined;
  }

  async createJourneyStep(journeyStep: InsertJourneyStep): Promise<JourneyStep> {
    const [created] = await db.insert(journeySteps).values(journeyStep).returning();
    return created;
  }

  async updateJourneyStep(id: string, journeyStep: Partial<InsertJourneyStep>): Promise<JourneyStep> {
    const [updated] = await db
      .update(journeySteps)
      .set({ ...journeyStep, updatedAt: new Date() })
      .where(eq(journeySteps.id, id))
      .returning();
    return updated;
  }

  async deleteJourneyStep(id: string): Promise<void> {
    await db.delete(journeySteps).where(eq(journeySteps.id, id));
  }

  // About Page Content
  async getAboutPageContent(): Promise<AboutPageContent | undefined> {
    const [content] = await db.select().from(aboutPageContent).orderBy(desc(aboutPageContent.updatedAt)).limit(1);
    return content || undefined;
  }

  async upsertAboutPageContent(content: InsertAboutPageContent): Promise<AboutPageContent> {
    const existing = await this.getAboutPageContent();
    
    if (existing) {
      const [updated] = await db
        .update(aboutPageContent)
        .set({ ...content, updatedAt: new Date() })
        .where(eq(aboutPageContent.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(aboutPageContent).values(content).returning();
      return created;
    }
  }

  // About Page Showcase Services
  async getAboutShowcaseServices(filters?: { active?: boolean }): Promise<AboutShowcaseService[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(aboutShowcaseServices.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(aboutShowcaseServices).where(and(...conditions))
      : db.select().from(aboutShowcaseServices);

    return await query.orderBy(aboutShowcaseServices.order);
  }

  async getAboutShowcaseService(id: string): Promise<AboutShowcaseService | undefined> {
    const [service] = await db.select().from(aboutShowcaseServices).where(eq(aboutShowcaseServices.id, id));
    return service || undefined;
  }

  async createAboutShowcaseService(service: InsertAboutShowcaseService): Promise<AboutShowcaseService> {
    const [created] = await db.insert(aboutShowcaseServices).values(service).returning();
    return created;
  }

  async updateAboutShowcaseService(id: string, service: Partial<InsertAboutShowcaseService>): Promise<AboutShowcaseService> {
    const [updated] = await db
      .update(aboutShowcaseServices)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(aboutShowcaseServices.id, id))
      .returning();
    return updated;
  }

  async deleteAboutShowcaseService(id: string): Promise<void> {
    await db.delete(aboutShowcaseServices).where(eq(aboutShowcaseServices.id, id));
  }

  // About Page Process Steps
  async getAboutProcessSteps(filters?: { active?: boolean }): Promise<AboutProcessStep[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(aboutProcessSteps.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(aboutProcessSteps).where(and(...conditions))
      : db.select().from(aboutProcessSteps);

    return await query.orderBy(aboutProcessSteps.order);
  }

  async getAboutProcessStep(id: string): Promise<AboutProcessStep | undefined> {
    const [step] = await db.select().from(aboutProcessSteps).where(eq(aboutProcessSteps.id, id));
    return step || undefined;
  }

  async createAboutProcessStep(step: InsertAboutProcessStep): Promise<AboutProcessStep> {
    const [created] = await db.insert(aboutProcessSteps).values(step).returning();
    return created;
  }

  async updateAboutProcessStep(id: string, step: Partial<InsertAboutProcessStep>): Promise<AboutProcessStep> {
    const [updated] = await db
      .update(aboutProcessSteps)
      .set({ ...step, updatedAt: new Date() })
      .where(eq(aboutProcessSteps.id, id))
      .returning();
    return updated;
  }

  async deleteAboutProcessStep(id: string): Promise<void> {
    await db.delete(aboutProcessSteps).where(eq(aboutProcessSteps.id, id));
  }

  // About Page Core Values
  async getAboutCoreValues(filters?: { active?: boolean }): Promise<AboutCoreValue[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(aboutCoreValues.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(aboutCoreValues).where(and(...conditions))
      : db.select().from(aboutCoreValues);

    return await query.orderBy(aboutCoreValues.order);
  }

  async getAboutCoreValue(id: string): Promise<AboutCoreValue | undefined> {
    const [value] = await db.select().from(aboutCoreValues).where(eq(aboutCoreValues.id, id));
    return value || undefined;
  }

  async createAboutCoreValue(value: InsertAboutCoreValue): Promise<AboutCoreValue> {
    const [created] = await db.insert(aboutCoreValues).values(value).returning();
    return created;
  }

  async updateAboutCoreValue(id: string, value: Partial<InsertAboutCoreValue>): Promise<AboutCoreValue> {
    const [updated] = await db
      .update(aboutCoreValues)
      .set({ ...value, updatedAt: new Date() })
      .where(eq(aboutCoreValues.id, id))
      .returning();
    return updated;
  }

  async deleteAboutCoreValue(id: string): Promise<void> {
    await db.delete(aboutCoreValues).where(eq(aboutCoreValues.id, id));
  }

  // About Page Team Members
  async getAboutTeamMembers(filters?: { active?: boolean }): Promise<AboutTeamMember[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(aboutTeamMembers.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(aboutTeamMembers).where(and(...conditions))
      : db.select().from(aboutTeamMembers);

    return await query.orderBy(aboutTeamMembers.order);
  }

  async getAboutTeamMember(id: string): Promise<AboutTeamMember | undefined> {
    const [member] = await db.select().from(aboutTeamMembers).where(eq(aboutTeamMembers.id, id));
    return member || undefined;
  }

  async createAboutTeamMember(member: InsertAboutTeamMember): Promise<AboutTeamMember> {
    const [created] = await db.insert(aboutTeamMembers).values(member).returning();
    return created;
  }

  async updateAboutTeamMember(id: string, member: Partial<InsertAboutTeamMember>): Promise<AboutTeamMember> {
    const [updated] = await db
      .update(aboutTeamMembers)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(aboutTeamMembers.id, id))
      .returning();
    return updated;
  }

  async deleteAboutTeamMember(id: string): Promise<void> {
    await db.delete(aboutTeamMembers).where(eq(aboutTeamMembers.id, id));
  }

  // CRM Pipeline Stages
  async getCrmPipelineStages(filters?: { active?: boolean }): Promise<CrmPipelineStage[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(crmPipelineStages.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(crmPipelineStages).where(and(...conditions))
      : db.select().from(crmPipelineStages);

    return await query.orderBy(crmPipelineStages.order);
  }

  async getCrmPipelineStage(id: string): Promise<CrmPipelineStage | undefined> {
    const [stage] = await db.select().from(crmPipelineStages).where(eq(crmPipelineStages.id, id));
    return stage || undefined;
  }

  async createCrmPipelineStage(stage: InsertCrmPipelineStage): Promise<CrmPipelineStage> {
    const [created] = await db.insert(crmPipelineStages).values(stage).returning();
    return created;
  }

  async updateCrmPipelineStage(id: string, stage: Partial<InsertCrmPipelineStage>): Promise<CrmPipelineStage> {
    const [updated] = await db
      .update(crmPipelineStages)
      .set({ ...stage, updatedAt: new Date() })
      .where(eq(crmPipelineStages.id, id))
      .returning();
    return updated;
  }

  async deleteCrmPipelineStage(id: string): Promise<void> {
    await db.delete(crmPipelineStages).where(eq(crmPipelineStages.id, id));
  }

  // BP Categories
  async getBpCategories(filters?: { active?: boolean }): Promise<BpCategory[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(bpCategories.active, filters.active));
    const query = conditions.length > 0
      ? db.select().from(bpCategories).where(and(...conditions))
      : db.select().from(bpCategories);
    return await query.orderBy(bpCategories.order);
  }

  async getBpCategory(id: string): Promise<BpCategory | undefined> {
    const [cat] = await db.select().from(bpCategories).where(eq(bpCategories.id, id));
    return cat || undefined;
  }

  async createBpCategory(category: InsertBpCategory): Promise<BpCategory> {
    const [created] = await db.insert(bpCategories).values(category).returning();
    return created;
  }

  async updateBpCategory(id: string, category: Partial<InsertBpCategory>): Promise<BpCategory> {
    const [updated] = await db
      .update(bpCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(bpCategories.id, id))
      .returning();
    return updated;
  }

  async deleteBpCategory(id: string): Promise<void> {
    await db.delete(bpCategories).where(eq(bpCategories.id, id));
  }

  // BP Statuses
  async getBpStatuses(filters?: { active?: boolean }): Promise<BpStatus[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(bpStatuses.active, filters.active));
    const query = conditions.length > 0
      ? db.select().from(bpStatuses).where(and(...conditions))
      : db.select().from(bpStatuses);
    return await query.orderBy(bpStatuses.order);
  }

  async getBpStatus(id: string): Promise<BpStatus | undefined> {
    const [s] = await db.select().from(bpStatuses).where(eq(bpStatuses.id, id));
    return s || undefined;
  }

  async createBpStatus(status: InsertBpStatus): Promise<BpStatus> {
    const [created] = await db.insert(bpStatuses).values(status).returning();
    return created;
  }

  async updateBpStatus(id: string, status: Partial<InsertBpStatus>): Promise<BpStatus> {
    const [updated] = await db
      .update(bpStatuses)
      .set({ ...status, updatedAt: new Date() })
      .where(eq(bpStatuses.id, id))
      .returning();
    return updated;
  }

  async deleteBpStatus(id: string): Promise<void> {
    await db.delete(bpStatuses).where(eq(bpStatuses.id, id));
  }

  // BP Tiers
  async getBpTiers(filters?: { active?: boolean }): Promise<BpTier[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(bpTiers.active, filters.active));
    const query = conditions.length > 0
      ? db.select().from(bpTiers).where(and(...conditions))
      : db.select().from(bpTiers);
    return await query.orderBy(bpTiers.order);
  }

  async getBpTier(id: string): Promise<BpTier | undefined> {
    const [t] = await db.select().from(bpTiers).where(eq(bpTiers.id, id));
    return t || undefined;
  }

  async createBpTier(tier: InsertBpTier): Promise<BpTier> {
    const [created] = await db.insert(bpTiers).values(tier).returning();
    return created;
  }

  async updateBpTier(id: string, tier: Partial<InsertBpTier>): Promise<BpTier> {
    const [updated] = await db
      .update(bpTiers)
      .set({ ...tier, updatedAt: new Date() })
      .where(eq(bpTiers.id, id))
      .returning();
    return updated;
  }

  async deleteBpTier(id: string): Promise<void> {
    await db.delete(bpTiers).where(eq(bpTiers.id, id));
  }

  // CRM Customer Tiers
  async getCrmCustomerTiers(filters?: { active?: boolean }): Promise<CrmCustomerTier[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(crmCustomerTiers.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(crmCustomerTiers).where(and(...conditions))
      : db.select().from(crmCustomerTiers);

    return await query.orderBy(crmCustomerTiers.order);
  }

  async getCrmCustomerTier(id: string): Promise<CrmCustomerTier | undefined> {
    const [tier] = await db.select().from(crmCustomerTiers).where(eq(crmCustomerTiers.id, id));
    return tier || undefined;
  }

  async createCrmCustomerTier(tier: InsertCrmCustomerTier): Promise<CrmCustomerTier> {
    const [created] = await db.insert(crmCustomerTiers).values(tier).returning();
    return created;
  }

  async updateCrmCustomerTier(id: string, tier: Partial<InsertCrmCustomerTier>): Promise<CrmCustomerTier> {
    const [updated] = await db
      .update(crmCustomerTiers)
      .set({ ...tier, updatedAt: new Date() })
      .where(eq(crmCustomerTiers.id, id))
      .returning();
    return updated;
  }

  async deleteCrmCustomerTier(id: string): Promise<void> {
    await db.delete(crmCustomerTiers).where(eq(crmCustomerTiers.id, id));
  }

  // CRM Statuses
  async getCrmStatuses(filters?: { active?: boolean }): Promise<CrmStatus[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(crmStatuses.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(crmStatuses).where(and(...conditions))
      : db.select().from(crmStatuses);

    return await query.orderBy(crmStatuses.order);
  }

  async getCrmStatus(id: string): Promise<CrmStatus | undefined> {
    const [status] = await db.select().from(crmStatuses).where(eq(crmStatuses.id, id));
    return status || undefined;
  }

  async createCrmStatus(status: InsertCrmStatus): Promise<CrmStatus> {
    const [created] = await db.insert(crmStatuses).values(status).returning();
    return created;
  }

  async updateCrmStatus(id: string, status: Partial<InsertCrmStatus>): Promise<CrmStatus> {
    const [updated] = await db
      .update(crmStatuses)
      .set({ ...status, updatedAt: new Date() })
      .where(eq(crmStatuses.id, id))
      .returning();
    return updated;
  }

  async deleteCrmStatus(id: string): Promise<void> {
    await db.delete(crmStatuses).where(eq(crmStatuses.id, id));
  }

  // Warranty Logs
  async getWarrantyLogs(clientId?: string): Promise<WarrantyLog[]> {
    const query = clientId
      ? db.select().from(warrantyLogs).where(eq(warrantyLogs.clientId, clientId))
      : db.select().from(warrantyLogs);
    return await query.orderBy(desc(warrantyLogs.date));
  }

  async getWarrantyLog(id: string): Promise<WarrantyLog | undefined> {
    const [log] = await db.select().from(warrantyLogs).where(eq(warrantyLogs.id, id));
    return log || undefined;
  }

  async createWarrantyLog(log: InsertWarrantyLog): Promise<WarrantyLog> {
    const [created] = await db.insert(warrantyLogs).values(log).returning();
    return created;
  }

  async updateWarrantyLog(id: string, log: Partial<InsertWarrantyLog>): Promise<WarrantyLog> {
    const [updated] = await db
      .update(warrantyLogs)
      .set({ ...log, updatedAt: new Date() })
      .where(eq(warrantyLogs.id, id))
      .returning();
    return updated;
  }

  async deleteWarrantyLog(id: string): Promise<void> {
    await db.delete(warrantyLogs).where(eq(warrantyLogs.id, id));
  }

  // Business Partners
  private async checkAndUpdateBpWarrantyStatus(bp: BusinessPartner): Promise<BusinessPartner> {
    if (bp.warrantyStatus === 'active' && bp.warrantyExpiry) {
      const now = new Date();
      const expiryDate = new Date(bp.warrantyExpiry);
      
      if (expiryDate < now) {
        const [updated] = await db
          .update(businessPartners)
          .set({ warrantyStatus: 'expired', updatedAt: new Date() })
          .where(eq(businessPartners.id, bp.id))
          .returning();
        return updated;
      }
    }
    return bp;
  }

  async getBusinessPartners(status?: string): Promise<BusinessPartner[]> {
    const query = status
      ? db.select().from(businessPartners).where(eq(businessPartners.status, status))
      : db.select().from(businessPartners);
    
    const bpList = await query.orderBy(desc(businessPartners.createdAt));
    
    const updatedBps = await Promise.all(
      bpList.map(async (bp: BusinessPartner) => {
        return await this.checkAndUpdateBpWarrantyStatus(bp);
      })
    );
    
    return updatedBps;
  }

  async getBusinessPartner(id: string): Promise<BusinessPartner | undefined> {
    const [bp] = await db.select().from(businessPartners).where(eq(businessPartners.id, id));
    if (!bp) return undefined;
    return await this.checkAndUpdateBpWarrantyStatus(bp);
  }

  async getBusinessPartnerByEmail(email: string): Promise<BusinessPartner | undefined> {
    const [bp] = await db.select().from(businessPartners).where(eq(businessPartners.email, email));
    return bp || undefined;
  }

  async createBusinessPartner(bp: InsertBusinessPartner): Promise<BusinessPartner> {
    const [newBp] = await db.insert(businessPartners).values(bp).returning();
    return newBp;
  }

  async updateBusinessPartner(id: string, bp: Partial<InsertBusinessPartner>): Promise<BusinessPartner> {
    const [updated] = await db
      .update(businessPartners)
      .set({ ...bp, updatedAt: new Date() })
      .where(eq(businessPartners.id, id))
      .returning();
    return updated;
  }

  async deleteBusinessPartner(id: string): Promise<void> {
    await db.delete(bpTransactions).where(eq(bpTransactions.businessPartnerId, id));
    await db.delete(businessPartners).where(eq(businessPartners.id, id));
  }

  // Business Partner Transactions
  async getBpTransactions(businessPartnerId?: string): Promise<BpTransaction[]> {
    const query = businessPartnerId
      ? db.select().from(bpTransactions).where(eq(bpTransactions.businessPartnerId, businessPartnerId))
      : db.select().from(bpTransactions);
    
    return await query.orderBy(desc(bpTransactions.createdAt));
  }

  async getBpTransaction(id: string): Promise<BpTransaction | undefined> {
    const [transaction] = await db.select().from(bpTransactions).where(eq(bpTransactions.id, id));
    return transaction || undefined;
  }

  async createBpTransaction(transaction: InsertBpTransaction): Promise<BpTransaction> {
    const [newTransaction] = await db.insert(bpTransactions).values(transaction).returning();
    return newTransaction;
  }

  async updateBpTransaction(id: string, transaction: Partial<InsertBpTransaction>): Promise<BpTransaction> {
    const [updated] = await db
      .update(bpTransactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(bpTransactions.id, id))
      .returning();
    return updated;
  }

  async deleteBpTransaction(id: string): Promise<void> {
    await db.delete(bpTransactions).where(eq(bpTransactions.id, id));
  }

  // Construction Phases
  async getConstructionPhases(filters?: { active?: boolean }): Promise<ConstructionPhase[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(constructionPhases.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(constructionPhases).where(and(...conditions))
      : db.select().from(constructionPhases);

    return await query.orderBy(constructionPhases.order);
  }

  async createConstructionPhase(phase: InsertConstructionPhase): Promise<ConstructionPhase> {
    const [created] = await db.insert(constructionPhases).values(phase).returning();
    return created;
  }

  async updateConstructionPhase(id: string, phase: Partial<InsertConstructionPhase>): Promise<ConstructionPhase> {
    const [updated] = await db
      .update(constructionPhases)
      .set({ ...phase, updatedAt: new Date() })
      .where(eq(constructionPhases.id, id))
      .returning();
    return updated;
  }

  async deleteConstructionPhase(id: string): Promise<void> {
    await db.delete(constructionPhases).where(eq(constructionPhases.id, id));
  }

  // Design Phases
  async getDesignPhases(filters?: { active?: boolean }): Promise<DesignPhase[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(designPhases.active, filters.active));

    const query = conditions.length > 0
      ? db.select().from(designPhases).where(and(...conditions))
      : db.select().from(designPhases);

    return await query.orderBy(designPhases.order);
  }

  async createDesignPhase(phase: InsertDesignPhase): Promise<DesignPhase> {
    const [created] = await db.insert(designPhases).values(phase).returning();
    return created;
  }

  async updateDesignPhase(id: string, phase: Partial<InsertDesignPhase>): Promise<DesignPhase> {
    const [updated] = await db
      .update(designPhases)
      .set({ ...phase, updatedAt: new Date() })
      .where(eq(designPhases.id, id))
      .returning();
    return updated;
  }

  async deleteDesignPhase(id: string): Promise<void> {
    await db.delete(designPhases).where(eq(designPhases.id, id));
  }

  async getAboutAwards(filters?: { active?: boolean }): Promise<AboutAward[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(aboutAwards.active, filters.active));
    const query = conditions.length > 0
      ? db.select().from(aboutAwards).where(and(...conditions))
      : db.select().from(aboutAwards);
    return await query.orderBy(aboutAwards.order);
  }

  async getAboutAward(id: string): Promise<AboutAward | undefined> {
    const [award] = await db.select().from(aboutAwards).where(eq(aboutAwards.id, id));
    return award;
  }

  async createAboutAward(award: InsertAboutAward): Promise<AboutAward> {
    const [created] = await db.insert(aboutAwards).values(award).returning();
    return created;
  }

  async updateAboutAward(id: string, award: Partial<InsertAboutAward>): Promise<AboutAward> {
    const [updated] = await db
      .update(aboutAwards)
      .set({ ...award, updatedAt: new Date() })
      .where(eq(aboutAwards.id, id))
      .returning();
    return updated;
  }

  async deleteAboutAward(id: string): Promise<void> {
    await db.delete(aboutAwards).where(eq(aboutAwards.id, id));
  }
}

export const storage = new DatabaseStorage();
