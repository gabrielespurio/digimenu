import { 
  users, 
  restaurants, 
  categories, 
  products, 
  menuViews,
  type User, 
  type InsertUser,
  type Restaurant,
  type InsertRestaurant,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type MenuView
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId: string): Promise<User>;
  
  // Restaurants
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantByUserId(userId: string): Promise<Restaurant | undefined>;
  getRestaurantBySlug(slug: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant & { userId: string }): Promise<Restaurant>;
  updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant>;
  
  // Categories
  getCategoriesByRestaurant(restaurantId: string): Promise<Category[]>;
  createCategory(category: InsertCategory & { restaurantId: string }): Promise<Category>;
  updateCategory(id: string, data: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByRestaurant(restaurantId: string): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  createProduct(product: InsertProduct & { restaurantId: string }): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getProductCount(restaurantId: string): Promise<number>;
  
  // Menu Views
  recordMenuView(restaurantId: string, userAgent?: string, ipAddress?: string): Promise<MenuView>;
  getMenuViewCount(restaurantId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId, 
        stripeSubscriptionId: subscriptionId,
        plan: 'premium',
        subscriptionStatus: 'active'
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Restaurants
  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant || undefined;
  }

  async getRestaurantByUserId(userId: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.userId, userId));
    return restaurant || undefined;
  }

  async getRestaurantBySlug(slug: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.slug, slug));
    return restaurant || undefined;
  }

  async createRestaurant(restaurant: InsertRestaurant & { userId: string }): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurant)
      .returning();
    return newRestaurant;
  }

  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
    return restaurant;
  }

  // Categories
  async getCategoriesByRestaurant(restaurantId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, restaurantId))
      .orderBy(categories.order);
  }

  async createCategory(category: InsertCategory & { restaurantId: string }): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByRestaurant(restaurantId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.restaurantId, restaurantId))
      .orderBy(products.order, desc(products.createdAt));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(products.order);
  }

  async createProduct(product: InsertProduct & { restaurantId: string }): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getProductCount(restaurantId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.restaurantId, restaurantId), eq(products.isActive, true)));
    return result.count;
  }

  // Menu Views
  async recordMenuView(restaurantId: string, userAgent?: string, ipAddress?: string): Promise<MenuView> {
    const [view] = await db
      .insert(menuViews)
      .values({
        restaurantId,
        userAgent,
        ipAddress,
      })
      .returning();
    return view;
  }

  async getMenuViewCount(restaurantId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(menuViews)
      .where(eq(menuViews.restaurantId, restaurantId));
    return result.count;
  }
}

export const storage = new DatabaseStorage();
