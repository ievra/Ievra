CREATE TABLE "about_awards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_en" text NOT NULL,
	"title_vi" text NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"organization_en" text DEFAULT '' NOT NULL,
	"organization_vi" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"image_data" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "about_core_values" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icon" text NOT NULL,
	"title_en" text NOT NULL,
	"title_vi" text NOT NULL,
	"description_en" text NOT NULL,
	"description_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "about_page_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hero_title_en" text DEFAULT 'ARCHITECTURAL & INTERIOR DESIGN' NOT NULL,
	"hero_title_vi" text DEFAULT 'THIẾT KẾ KIẾN TRÚC VÀ NỘI THẤT' NOT NULL,
	"hero_subtitle_en" text DEFAULT 'INNOVATION IN EVERY PROJECT' NOT NULL,
	"hero_subtitle_vi" text DEFAULT 'ĐỔI MỚI TRONG MỌI DỰ ÁN' NOT NULL,
	"hero_images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"principles_subtitle_en" text DEFAULT 'OUR PRINCIPLES' NOT NULL,
	"principles_subtitle_vi" text DEFAULT 'NGUYÊN TẮC LÀM VIỆC' NOT NULL,
	"principles_title_en" text DEFAULT 'THE FOUNDATION OF OUR WORK' NOT NULL,
	"principles_title_vi" text DEFAULT 'NỀN TẢNG CỦA CÔNG VIỆC CHÚNG TÔI' NOT NULL,
	"principles_content_en" text DEFAULT '' NOT NULL,
	"principles_content_vi" text DEFAULT '' NOT NULL,
	"principles_image_left" text DEFAULT '' NOT NULL,
	"principles_image_left_data" text,
	"principles_image_right" text DEFAULT '' NOT NULL,
	"principles_image_right_data" text,
	"showcase_banner_image" text DEFAULT '' NOT NULL,
	"showcase_banner_image_data" text,
	"stats_projects_value" text DEFAULT '150+' NOT NULL,
	"stats_projects_label_en" text DEFAULT 'Projects Completed' NOT NULL,
	"stats_projects_label_vi" text DEFAULT 'Dự án hoàn thành' NOT NULL,
	"stats_awards_value" text DEFAULT '25+' NOT NULL,
	"stats_awards_label_en" text DEFAULT 'Design Awards' NOT NULL,
	"stats_awards_label_vi" text DEFAULT 'Giải thưởng thiết kế' NOT NULL,
	"stats_clients_value" text DEFAULT '200+' NOT NULL,
	"stats_clients_label_en" text DEFAULT 'Happy Clients' NOT NULL,
	"stats_clients_label_vi" text DEFAULT 'Khách hàng hài lòng' NOT NULL,
	"stats_countries_value" text DEFAULT '12+' NOT NULL,
	"stats_countries_label_en" text DEFAULT 'Countries' NOT NULL,
	"stats_countries_label_vi" text DEFAULT 'Quốc gia' NOT NULL,
	"awards_section_title_en" text DEFAULT 'AWARDS & RECOGNITION' NOT NULL,
	"awards_section_title_vi" text DEFAULT 'GIẢI THƯỞNG & CÔNG NHẬN' NOT NULL,
	"process_subtitle_en" text DEFAULT 'OUR PROCESS' NOT NULL,
	"process_subtitle_vi" text DEFAULT 'QUY TRÌNH LÀM VIỆC' NOT NULL,
	"process_title_en" text DEFAULT 'FROM CONCEPT TO REALITY' NOT NULL,
	"process_title_vi" text DEFAULT 'TỪ Ý TƯỞNG ĐẾN HIỆN THỰC' NOT NULL,
	"history_subtitle_en" text DEFAULT 'COMPANY HISTORY' NOT NULL,
	"history_subtitle_vi" text DEFAULT 'LỊCH SỬ HÌNH THÀNH' NOT NULL,
	"history_title_en" text DEFAULT 'OUR STORY' NOT NULL,
	"history_title_vi" text DEFAULT 'CÂU CHUYỆN CỦA CHÚNG TÔI' NOT NULL,
	"history_content_en" text DEFAULT '' NOT NULL,
	"history_content_vi" text DEFAULT '' NOT NULL,
	"history_image" text,
	"mission_title_en" text DEFAULT 'OUR MISSION' NOT NULL,
	"mission_title_vi" text DEFAULT 'SỨ MỆNH' NOT NULL,
	"mission_content_en" text DEFAULT '' NOT NULL,
	"mission_content_vi" text DEFAULT '' NOT NULL,
	"vision_title_en" text DEFAULT 'OUR VISION' NOT NULL,
	"vision_title_vi" text DEFAULT 'TẦM NHÌN' NOT NULL,
	"vision_content_en" text DEFAULT '' NOT NULL,
	"vision_content_vi" text DEFAULT '' NOT NULL,
	"mission_image" text,
	"mission_image_data" text,
	"mission_vision_image" text,
	"mission_vision_image_data" text,
	"core_values_subtitle_en" text DEFAULT 'CORE VALUES' NOT NULL,
	"core_values_subtitle_vi" text DEFAULT 'GIÁ TRỊ CỐT LÕI' NOT NULL,
	"core_values_title_en" text DEFAULT 'CORE VALUES' NOT NULL,
	"core_values_title_vi" text DEFAULT 'GIÁ TRỊ CỐT LÕI' NOT NULL,
	"team_subtitle_en" text DEFAULT 'OUR TEAM' NOT NULL,
	"team_subtitle_vi" text DEFAULT 'ĐỘI NGŨ' NOT NULL,
	"team_title_en" text DEFAULT 'OUR TEAM' NOT NULL,
	"team_title_vi" text DEFAULT 'ĐỘI NGŨ' NOT NULL,
	"cta_banner_title_en" text DEFAULT '' NOT NULL,
	"cta_banner_title_vi" text DEFAULT '' NOT NULL,
	"cta_banner_image" text,
	"cta_banner_image_data" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "about_process_steps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step_number" text NOT NULL,
	"title_en" text NOT NULL,
	"title_vi" text NOT NULL,
	"description_en" text NOT NULL,
	"description_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "about_showcase_services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_en" text NOT NULL,
	"title_vi" text NOT NULL,
	"description_en" text NOT NULL,
	"description_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "about_team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position_en" text NOT NULL,
	"position_vi" text NOT NULL,
	"bio_en" text NOT NULL,
	"bio_vi" text NOT NULL,
	"achievements_en" text,
	"achievements_vi" text,
	"philosophy_en" text,
	"philosophy_vi" text,
	"image" text DEFAULT '' NOT NULL,
	"image_data" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advantages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icon" text NOT NULL,
	"title_en" text NOT NULL,
	"title_vi" text NOT NULL,
	"description_en" text NOT NULL,
	"description_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"featured_image" text,
	"featured_image_data" text,
	"content_images" jsonb DEFAULT '[]'::jsonb,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_language_unique" UNIQUE("slug","language")
);
--> statement-breakpoint
CREATE TABLE "bp_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bp_categories_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "bp_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bp_statuses_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "bp_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bp_tiers_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "bp_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_partner_id" varchar NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" varchar(30) DEFAULT 'payment' NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"payment_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_partners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"position" text,
	"company" text,
	"address" text,
	"date_of_birth" timestamp,
	"stage" varchar(50) DEFAULT 'lead' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"tier" varchar(50) DEFAULT 'silver' NOT NULL,
	"total_spending" numeric(12, 2) DEFAULT '0' NOT NULL,
	"refund_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"commission" numeric(12, 2) DEFAULT '0' NOT NULL,
	"order_count" integer DEFAULT 0 NOT NULL,
	"referred_by_id" varchar,
	"referral_count" integer DEFAULT 0 NOT NULL,
	"referral_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"intake_date" timestamp,
	"warranty_status" varchar(30) DEFAULT 'none',
	"warranty_expiry" timestamp,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_vi" text,
	"slug" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_type_unique" UNIQUE("slug","type")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"address" text,
	"date_of_birth" timestamp,
	"stage" varchar(50) DEFAULT 'lead' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"tier" varchar(50) DEFAULT 'silver' NOT NULL,
	"total_spending" numeric(12, 2) DEFAULT '0' NOT NULL,
	"refund_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"commission" numeric(12, 2) DEFAULT '0' NOT NULL,
	"order_count" integer DEFAULT 0 NOT NULL,
	"referred_by_id" varchar,
	"referral_count" integer DEFAULT 0 NOT NULL,
	"referral_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"intake_date" timestamp,
	"construction_timeline" integer,
	"design_timeline" integer,
	"design_phase_targets" jsonb DEFAULT '{}'::jsonb,
	"construction_phase_targets" jsonb DEFAULT '{}'::jsonb,
	"identity_card" text,
	"warranty_status" varchar(30) DEFAULT 'none',
	"warranty_expiry" timestamp,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "construction_phases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "construction_phases_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "crm_customer_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_customer_tiers_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "crm_pipeline_stages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_pipeline_stages_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "crm_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_statuses_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"project_id" varchar,
	"title" text NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"stage" varchar(20) DEFAULT 'proposal' NOT NULL,
	"probability" integer DEFAULT 50 NOT NULL,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"description" text,
	"terms" text,
	"notes" text,
	"lost_reason" text,
	"assigned_to" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_phases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "design_phases_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"page" varchar(20) NOT NULL,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homepage_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"hero_background_image" text,
	"hero_title" text DEFAULT 'IEVRA Design & Build' NOT NULL,
	"hero_studio" text DEFAULT 'Design' NOT NULL,
	"hero_tagline" text,
	"hero_architecture_label" text,
	"hero_interior_label" text,
	"hero_consultation_text" text,
	"featured_badge" text,
	"featured_badge_vi" text,
	"featured_title" text,
	"featured_description" text,
	"featured_description_vi" text,
	"stats_projects_value" text,
	"stats_projects_label_en" text,
	"stats_projects_label_vi" text,
	"stats_projects_desc_en" text,
	"stats_projects_desc_vi" text,
	"stats_clients_value" text,
	"stats_clients_label_en" text,
	"stats_clients_label_vi" text,
	"stats_clients_desc_en" text,
	"stats_clients_desc_vi" text,
	"stats_awards_value" text,
	"stats_awards_label_en" text,
	"stats_awards_label_vi" text,
	"stats_awards_desc_en" text,
	"stats_awards_desc_vi" text,
	"stats_experience_value" text,
	"stats_experience_label_en" text,
	"stats_experience_label_vi" text,
	"stats_experience_desc_en" text,
	"stats_experience_desc_vi" text,
	"journey_title" text,
	"journey_title_vi" text,
	"journey_description" text,
	"journey_description_vi" text,
	"advantages_title" text,
	"advantages_title_vi" text,
	"advantages_subtitle" text,
	"advantages_subtitle_vi" text,
	"faq_section_title" text,
	"faq_section_title_vi" text,
	"faq_section_subtitle" text,
	"faq_section_subtitle_vi" text,
	"partners_title" text,
	"partners_title_vi" text,
	"partners_subtitle" text,
	"partners_subtitle_vi" text,
	"featured_news_title" text,
	"featured_news_title_vi" text,
	"featured_news_subtitle" text,
	"featured_news_subtitle_vi" text,
	"cta_subtitle" text,
	"cta_subtitle_vi" text,
	"quality_background_image" text,
	"quality_left_text" text,
	"quality_left_text_vi" text,
	"quality_right_text" text,
	"quality_right_text_vi" text,
	"quality2_background_image" text,
	"quality2_left_text" text,
	"quality2_left_text_vi" text,
	"quality2_right_text" text,
	"quality2_right_text_vi" text,
	"cta_title" text,
	"cta_description" text,
	"cta_button_text" text,
	"cta_secondary_button_text" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "homepage_content_language_unique" UNIQUE("language")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"project_type" varchar(50),
	"budget" varchar(50),
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"client_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"type" varchar(30) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"duration" integer,
	"location" text,
	"assigned_to" text,
	"outcome" text,
	"next_action" text,
	"next_action_date" timestamp,
	"phase" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_steps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step_number" integer DEFAULT 1 NOT NULL,
	"title_en" text NOT NULL,
	"title_vi" text NOT NULL,
	"description_en" text NOT NULL,
	"description_vi" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"logo_data" text,
	"website" text,
	"description" text,
	"shape" varchar(20) DEFAULT 'landscape',
	"logo_zoom" real DEFAULT 1 NOT NULL,
	"logo_offset_x" integer DEFAULT 0 NOT NULL,
	"logo_offset_y" integer DEFAULT 0 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text,
	"description" text,
	"detailed_description" text,
	"design_philosophy_title" text,
	"design_philosophy" text,
	"material_selection_title" text,
	"material_selection" text,
	"description_title" text,
	"section_2_image" text,
	"section_3_image" text,
	"banner_title" text,
	"banner_image" text,
	"category" varchar(50) NOT NULL,
	"language" varchar(5) DEFAULT 'en',
	"location" text,
	"area" text,
	"duration" text,
	"budget" text,
	"style" text,
	"designer" text,
	"completion_year" text,
	"cover_images" jsonb DEFAULT '[]'::jsonb,
	"content_images" jsonb DEFAULT '[]'::jsonb,
	"gallery_images" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"hero_image" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"related_projects" jsonb DEFAULT '[]'::jsonb,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logo_url" text,
	"logo_data" text,
	"facebook_url" text,
	"instagram_url" text,
	"linkedin_url" text,
	"zalo_url" text,
	"email" text,
	"phone" text,
	"address" text,
	"site_title" text,
	"site_title_vi" text,
	"meta_description" text,
	"meta_description_vi" text,
	"meta_keywords" text,
	"meta_keywords_vi" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(20) DEFAULT 'payment' NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"category" varchar(20) DEFAULT 'design' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"display_name" text,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "warranty_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" text,
	"attachments" text[],
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bp_transactions" ADD CONSTRAINT "bp_transactions_business_partner_id_business_partners_id_fk" FOREIGN KEY ("business_partner_id") REFERENCES "public"."business_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_referred_by_id_clients_id_fk" FOREIGN KEY ("referred_by_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_logs" ADD CONSTRAINT "warranty_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;