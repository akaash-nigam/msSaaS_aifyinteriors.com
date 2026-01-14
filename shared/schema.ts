import { pgTable, text, serial, integer, timestamp, jsonb, varchar, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== USERS TABLE ====================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  // Firebase Auth
  firebaseUid: varchar("firebase_uid", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }),
  photoURL: text("photo_url"),

  // Subscription & Tier
  tier: varchar("tier", { length: 50 }).notNull().default("free"), // "free", "basic", "india", "professional"
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("inactive"), // "active", "inactive", "cancelled", "past_due"

  // Credits System (for free tier)
  creditsBalance: integer("credits_balance").notNull().default(3), // Free tier gets 3 designs
  creditsUsedThisMonth: integer("credits_used_this_month").notNull().default(0),
  monthlyResetDate: timestamp("monthly_reset_date").defaultNow(),

  // Stripe Integration
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  currentPeriodEnd: timestamp("current_period_end"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== DESIGN STYLES TABLE ====================
export const designStyles = pgTable("design_styles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "Modern", "Scandinavian", etc.
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "contemporary", "traditional", "eclectic"
  thumbnailUrl: text("thumbnail_url"),
  promptModifiers: jsonb("prompt_modifiers").$type<string[]>(), // AI prompt additions
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  tier: varchar("tier", { length: 50 }).default("free"), // "free", "basic", "professional"
});

// ==================== ROOM TYPES TABLE ====================
export const roomTypes = pgTable("room_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "Living Room", "Bedroom", etc.
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  iconName: varchar("icon_name", { length: 50 }), // lucide-react icon name
  promptContext: text("prompt_context"), // Additional AI context for this room type
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ==================== DESIGNS TABLE ====================
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),

  // Design Information
  title: varchar("title", { length: 255 }),
  roomTypeId: integer("room_type_id").references(() => roomTypes.id),
  styleId: integer("style_id").references(() => designStyles.id),

  // Images (stored as base64 in PostgreSQL - following visualtryon pattern)
  originalImage: text("original_image").notNull(), // User's uploaded room photo
  generatedImage: text("generated_image").notNull(), // AI-generated design
  alternativeViews: jsonb("alternative_views").$type<string[]>(), // Additional generated variations

  // Generation Settings
  prompt: text("prompt"), // User's custom prompt/description
  aiModel: varchar("ai_model", { length: 50 }).default("dall-e-3"),
  generationMetadata: jsonb("generation_metadata").$type<{
    generationTime?: number;
    dallePrompt?: string;
    settings?: Record<string, any>;
  }>(),

  // Status & Visibility
  status: varchar("status", { length: 50 }).notNull().default("completed"), // "generating", "completed", "failed"
  isPublic: boolean("is_public").notNull().default(false),
  isFavorite: boolean("is_favorite").notNull().default(false),

  // Credits
  creditCost: integer("credit_cost").notNull().default(1),

  // Watermark (for free tier)
  hasWatermark: boolean("has_watermark").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== PRODUCTS TABLE (Shopping Integration) ====================
export const products = pgTable("products", {
  id: serial("id").primaryKey(),

  // Product Info
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // "furniture", "decor", "lighting", "textiles"
  subcategory: varchar("subcategory", { length: 100 }), // "sofa", "chair", "lamp", etc.

  // Pricing
  price: doublePrecision("price").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),

  // Links
  affiliateUrl: text("affiliate_url"), // Affiliate link to retailer
  retailer: varchar("retailer", { length: 100 }), // "IKEA", "Wayfair", "Amazon", etc.

  // Images
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),

  // Metadata
  brand: varchar("brand", { length: 100 }),
  tags: jsonb("tags").$type<string[]>(),
  styleIds: jsonb("style_ids").$type<number[]>(), // Compatible design styles

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== DESIGN PRODUCTS (Many-to-Many) ====================
export const designProducts = pgTable("design_products", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").references(() => designs.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),

  // Position in design
  position: jsonb("position").$type<{ x: number; y: number }>(),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== CREDIT TRANSACTIONS ====================
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),

  // Transaction details
  type: varchar("type", { length: 50 }).notNull(), // "usage", "purchase", "monthly_reset", "refund", "bonus"
  amount: integer("amount").notNull(), // Positive for credit, negative for debit
  balanceAfter: integer("balance_after").notNull(),

  // Context
  description: text("description").notNull(),
  designId: integer("design_id").references(() => designs.id),

  // Payment reference (for purchases)
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

// ==================== SUBSCRIPTIONS ====================
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),

  // Stripe data
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull().unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),

  // Subscription details
  tier: varchar("tier", { length: 50 }).notNull(), // "basic", "india", "professional"
  status: varchar("status", { length: 50 }).notNull(), // "active", "cancelled", "past_due", "trialing"

  // Billing
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== FAVORITES ====================
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  designId: integer("design_id").references(() => designs.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== INSERT SCHEMAS ====================
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDesignSchema = createInsertSchema(designs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDesignStyleSchema = createInsertSchema(designStyles).omit({ id: true });
export const insertRoomTypeSchema = createInsertSchema(roomTypes).omit({ id: true });

// ==================== TYPES ====================
export type User = typeof users.$inferSelect;
export type Design = typeof designs.$inferSelect;
export type Product = typeof products.$inferSelect;
export type DesignStyle = typeof designStyles.$inferSelect;
export type RoomType = typeof roomTypes.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertDesignStyle = z.infer<typeof insertDesignStyleSchema>;
export type InsertRoomType = z.infer<typeof insertRoomTypeSchema>;

// ==================== API SCHEMAS ====================
export const designGenerationSchema = z.object({
  roomImageBase64: z.string().min(1, "Room image is required"),
  styleId: z.number().int().positive(),
  roomTypeId: z.number().int().positive(),
  customPrompt: z.string().max(500).optional(),
  generateAlternatives: z.boolean().default(false),
});

export const updateDesignSchema = z.object({
  title: z.string().max(255).optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export type DesignGenerationRequest = z.infer<typeof designGenerationSchema>;
export type UpdateDesignRequest = z.infer<typeof updateDesignSchema>;
