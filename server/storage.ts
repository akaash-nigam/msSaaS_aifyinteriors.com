import {
  users,
  designs,
  designStyles,
  roomTypes,
  products,
  creditTransactions,
  subscriptions,
  favorites,
  type User,
  type InsertUser,
  type Design,
  type InsertDesign,
  type DesignStyle,
  type InsertDesignStyle,
  type RoomType,
  type InsertRoomType,
  type Product,
  type InsertProduct,
  type CreditTransaction,
  type Subscription,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Storage interface definition
export interface IStorage {
  // Users
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Designs
  getDesign(id: number): Promise<Design | undefined>;
  getUserDesigns(userId: number, options?: { limit?: number; offset?: number }): Promise<Design[]>;
  createDesign(design: InsertDesign): Promise<Design>;
  updateDesign(id: number, updates: Partial<InsertDesign>): Promise<Design | undefined>;
  deleteDesign(id: number): Promise<boolean>;

  // Design Styles
  getDesignStyles(): Promise<DesignStyle[]>;
  getDesignStyle(id: number): Promise<DesignStyle | undefined>;
  getDesignStyleBySlug(slug: string): Promise<DesignStyle | undefined>;
  createDesignStyle(style: InsertDesignStyle): Promise<DesignStyle>;

  // Room Types
  getRoomTypes(): Promise<RoomType[]>;
  getRoomType(id: number): Promise<RoomType | undefined>;
  getRoomTypeBySlug(slug: string): Promise<RoomType | undefined>;
  createRoomType(roomType: InsertRoomType): Promise<RoomType>;

  // Products
  getProducts(options?: { limit?: number; styleId?: number }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByStyle(styleId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Credit Transactions
  createCreditTransaction(transaction: {
    userId: number;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    designId?: number;
    stripePaymentIntentId?: string;
  }): Promise<CreditTransaction>;
  updateCreditTransaction(id: number, updates: { designId?: number }): Promise<void>;
  getCreditTransactions(userId: number, limit?: number): Promise<CreditTransaction[]>;

  // Subscriptions
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;
}

// PostgreSQL storage implementation
export class PgStorage implements IStorage {
  // ==================== USER METHODS ====================

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // ==================== DESIGN METHODS ====================

  async getDesign(id: number): Promise<Design | undefined> {
    const result = await db.select().from(designs).where(eq(designs.id, id));
    return result[0];
  }

  async getUserDesigns(userId: number, options?: { limit?: number; offset?: number; styleId?: number; roomTypeId?: number; favoritesOnly?: boolean }): Promise<Design[]> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    let query = db
      .select()
      .from(designs)
      .where(eq(designs.userId, userId));

    if (options?.styleId) {
      query = query.where(eq(designs.styleId, options.styleId)) as any;
    }

    if (options?.roomTypeId) {
      query = query.where(eq(designs.roomTypeId, options.roomTypeId)) as any;
    }

    if (options?.favoritesOnly) {
      query = query.where(eq(designs.isFavorite, true)) as any;
    }

    return await query
      .orderBy(desc(designs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserDesignsCount(userId: number, options?: { styleId?: number; roomTypeId?: number; favoritesOnly?: boolean }): Promise<number> {
    let query = db
      .select({ count: sql<number>`count(*)` })
      .from(designs)
      .where(eq(designs.userId, userId));

    if (options?.styleId) {
      query = query.where(eq(designs.styleId, options.styleId)) as any;
    }

    if (options?.roomTypeId) {
      query = query.where(eq(designs.roomTypeId, options.roomTypeId)) as any;
    }

    if (options?.favoritesOnly) {
      query = query.where(eq(designs.isFavorite, true)) as any;
    }

    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async createDesign(design: InsertDesign): Promise<Design> {
    const result = await db.insert(designs).values(design).returning();
    return result[0];
  }

  async updateDesign(id: number, updates: Partial<InsertDesign>): Promise<Design | undefined> {
    const result = await db
      .update(designs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(designs.id, id))
      .returning();
    return result[0];
  }

  async deleteDesign(id: number): Promise<boolean> {
    const result = await db.delete(designs).where(eq(designs.id, id)).returning();
    return result.length > 0;
  }

  // ==================== DESIGN STYLE METHODS ====================

  async getDesignStyles(): Promise<DesignStyle[]> {
    return await db
      .select()
      .from(designStyles)
      .where(eq(designStyles.isActive, true))
      .orderBy(designStyles.sortOrder);
  }

  async getDesignStyle(id: number): Promise<DesignStyle | undefined> {
    const result = await db.select().from(designStyles).where(eq(designStyles.id, id));
    return result[0];
  }

  async getDesignStyleBySlug(slug: string): Promise<DesignStyle | undefined> {
    const result = await db.select().from(designStyles).where(eq(designStyles.slug, slug));
    return result[0];
  }

  async createDesignStyle(style: InsertDesignStyle): Promise<DesignStyle> {
    const result = await db.insert(designStyles).values(style).returning();
    return result[0];
  }

  // ==================== ROOM TYPE METHODS ====================

  async getRoomTypes(): Promise<RoomType[]> {
    return await db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.isActive, true))
      .orderBy(roomTypes.sortOrder);
  }

  async getRoomType(id: number): Promise<RoomType | undefined> {
    const result = await db.select().from(roomTypes).where(eq(roomTypes.id, id));
    return result[0];
  }

  async getRoomTypeBySlug(slug: string): Promise<RoomType | undefined> {
    const result = await db.select().from(roomTypes).where(eq(roomTypes.slug, slug));
    return result[0];
  }

  async createRoomType(roomType: InsertRoomType): Promise<RoomType> {
    const result = await db.insert(roomTypes).values(roomType).returning();
    return result[0];
  }

  // ==================== PRODUCT METHODS ====================

  async getProducts(options?: { limit?: number; styleId?: number }): Promise<Product[]> {
    const limit = options?.limit || 50;

    let query = db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(limit);

    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getProductsByStyle(styleId: number): Promise<Product[]> {
    // Products with styleIds array containing the given styleId
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.styleIds} @> ARRAY[${styleId}]::integer[]`
        )
      )
      .limit(10);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  // ==================== CREDIT TRANSACTION METHODS ====================

  async createCreditTransaction(transaction: {
    userId: number;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    designId?: number;
    stripePaymentIntentId?: string;
  }): Promise<CreditTransaction> {
    const result = await db.insert(creditTransactions).values(transaction).returning();
    return result[0];
  }

  async updateCreditTransaction(id: number, updates: { designId?: number }): Promise<void> {
    await db
      .update(creditTransactions)
      .set(updates)
      .where(eq(creditTransactions.id, id));
  }

  async getCreditTransactions(userId: number, limit: number = 50): Promise<CreditTransaction[]> {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);
  }

  // ==================== SUBSCRIPTION METHODS ====================

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return result[0];
  }

  async createSubscription(subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(subscription).returning();
    return result[0];
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }
}

// Create and export the storage instance
export const storage = new PgStorage();
