# Overview

Moderno Interiors is a sophisticated interior design studio website built as a full-stack application. It features a modern, dark-themed frontend showcasing design projects, services, and client management capabilities, with a comprehensive admin dashboard for content management. The application serves as both a marketing platform for the design studio and a business management tool for tracking projects, clients, and inquiries.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Single-page application using Wouter for client-side routing
- **UI Framework**: Extensive use of shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system featuring dark theme, golden accent colors, and sophisticated typography (Inter, Playfair Display fonts)
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing
- **Internationalization**: Comprehensive Vietnamese translation system with useLanguage hook
- **Build Tool**: Vite for development and production builds

## Backend Architecture
- **Express.js**: RESTful API server with structured routing and middleware
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL with connection pooling
- **API Design**: RESTful endpoints for projects, clients, inquiries, and services with proper error handling and validation
- **Development Integration**: Custom Vite middleware for seamless full-stack development

## Data Model
The application manages core entities:
- **Projects**: Portfolio items with categories (residential, commercial, architecture), images, location, and status tracking
- **Clients**: CRM functionality with contact information, company details, and relationship status
- **Business Partners (Đối Tác)**: Full CRM with contact info, company, categories, statuses, tiers, warranty tracking, and transaction management. Uses separate `business_partners`, `bp_transactions`, `bp_categories`, and `bp_statuses` tables. Has its own category system ("Hạng Mục") and status system separate from client pipeline stages ("Giai Đoạn") and client statuses.
  - **Automatic Warranty Management**: Warranty status is automatically calculated based on warranty expiry date
    - No expiry date set → Status: "None"
    - Expiry date in future → Status: "Active"
    - Expiry date passed → Status: "Expired"
    - Backend automatically updates expired warranties when fetching client data
- **Inquiries**: Contact form submissions with project type, budget, and message details
- **Services**: Configurable service offerings with descriptions, features, and ordering
- **Partners**: Simplified partner/brand logo management (managed in Homepage Content tab)
  - Only requires: Partner name and logo (PNG/JPG upload or URL)
  - Maximum limit: 24 partners total (12 per row)
  - No descriptions, websites, ordering, or status fields
  - Displays in two-row scrolling animation on homepage (seamless infinite loop with 20 copies, 5% translateX animation, mx-4 spacing)
  - Simple table view showing logo preview, name, and actions (edit/delete)
- **FAQs**: Frequently asked questions with multilingual support
  - Page-specific filtering (home, contact, etc.)
  - Language variants (EN/VI) with automatic language-aware display
  - Ordering and active/inactive status control
  - Fully integrated with admin dashboard for CRUD operations
  - Dynamic rendering on homepage with real-time updates
- **Users**: Admin authentication system with role-based access

## Component Architecture
- **Modular UI Components**: Reusable components in `/components/ui` following consistent patterns
- **Page Components**: Route-specific components handling data fetching and business logic
- **Layout System**: Responsive navigation with mobile-first design and glass morphism effects
- **Admin Dashboard**: Comprehensive management interface with tabbed navigation and CRUD operations

## Authentication & Authorization
- **Database-backed Authentication**: Passport.js with LocalStrategy checking against PostgreSQL database
- **Password Security**: SHA-256 hashed passwords stored in database
- **User Management System**: Full CRUD operations for admin users
  - Three role levels: Super Admin (full access), Admin (custom permissions), Editor (limited access)
  - Granular permissions for: projects, clients, inquiries, services, homepage, about, articles, partners, faqs, crm, users
  - Password change functionality with current password verification
  - User account management: username, display name, email, role, permissions
  - Super Admin protection: Cannot delete last Super Admin account
- **Session Management**: PostgreSQL-backed session storage for persistent login state

## Multilingual Support
- **Language Context**: React Context-based translation system supporting English and Vietnamese
- **Comprehensive Coverage**: All pages, forms, navigation, and admin interface fully translated
- **Dynamic Content**: Services and page content dynamically rendered based on language selection
- **Translation Keys**: Structured translation system with organized namespacing (nav, hero, about, services, contact, admin)
- **Language Switching**: Seamless language switching throughout the application

# External Dependencies

## Database
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL with WebSocket connections for serverless compatibility
- **Drizzle Kit**: Database migration and schema management tools

## UI & Design
- **Radix UI**: Headless component primitives for accessibility and customization
- **Lucide Icons**: Icon library for consistent visual elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Google Fonts**: Inter and Playfair Display for typography

## Development Tools
- **Replit Integration**: Custom Vite plugins for error overlay, cartographer, and dev banner
- **TypeScript**: Full-stack type safety with shared schema definitions
- **ESBuild**: Fast JavaScript bundler for production builds

## Form & Validation
- **Zod**: Schema validation library for type-safe form handling
- **React Hook Form**: Performance-optimized form library with validation integration

## Image Handling
- **File System Storage**: All images stored in `/attached_assets` directory via `/api/upload` endpoint
  - Partner logos, quality backgrounds, showcase banners, hero slider images
  - History images, mission/vision images, team member portraits
  - Article featured images and content images
  - Images stored as actual files with UUID filenames (e.g., `/attached_assets/abc123.jpg`)
  - Database stores short file paths, not base64 data
  - 10MB file size limit per image upload
- **Unsplash**: External image service for placeholder content
- **Custom Upload Component**: File upload interface with drag-and-drop support