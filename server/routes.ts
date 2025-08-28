import express, { type Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertUserSchema, insertRestaurantSchema, insertProductSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

// Stripe setup - optional for development
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
} else {
  console.warn('STRIPE_SECRET_KEY not found - subscription features will be disabled');
}

// File upload setup
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB - para imagens de altíssima qualidade
    fieldSize: 50 * 1024 * 1024 // 50MB - limite do campo
  },
  fileFilter: (req, file, cb) => {
    // Aceita formatos de imagem de alta qualidade
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, PNG, WebP, TIFF)!'), false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'E-mail não encontrado' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: 'Senha incorreta' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Serve uploaded files with optimized headers
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
    res.header('Expires', new Date(Date.now() + 31536000000).toUTCString());
    next();
  }, express.static(uploadsDir, {
    maxAge: '1y', // Cache de 1 ano
    etag: true, // Enable ETags para cache eficiente
    lastModified: true // Enable Last-Modified headers
  }));

  // Helper function to generate slug
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const data = insertUserSchema.extend({
        restaurantName: z.string().min(1, "Nome do restaurante é obrigatório"),
      }).parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "E-mail já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        plan: "free",
      });

      // Create restaurant
      const slug = generateSlug(data.restaurantName);
      const restaurant = await storage.createRestaurant({
        userId: user.id,
        name: data.restaurantName,
        slug,
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro no login automático" });
        }
        res.json({ user, restaurant });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro no cadastro" });
    }
  });

  app.post("/api/login", passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro no logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    res.json({ user: req.user });
  });

  // Restaurant routes
  app.get("/api/restaurant", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }
      res.json(restaurant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/restaurant", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }

      const data = insertRestaurantSchema.partial().parse(req.body);
      if (data.name) {
        data.slug = generateSlug(data.name);
      }

      const updatedRestaurant = await storage.updateRestaurant(restaurant.id, data);
      res.json(updatedRestaurant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }

      const products = await storage.getProductsByRestaurant(restaurant.id);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }

      // Check product limit for free users
      const user = req.user as any;
      if (user.plan === 'free') {
        const productCount = await storage.getProductCount(restaurant.id);
        if (productCount >= 5) {
          return res.status(400).json({ 
            message: "Limite de 5 produtos atingido. Faça upgrade para o plano Premium." 
          });
        }
      }

      const data = insertProductSchema.parse(req.body);
      
      // Handle "none" categoryId as null
      if (data.categoryId === "none") {
        data.categoryId = null;
      }
      
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const product = await storage.createProduct({
        ...data,
        restaurantId: restaurant.id,
        imageUrl,
      });

      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant || product.restaurantId !== restaurant.id) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      const data = insertProductSchema.partial().parse(req.body);
      
      // Handle "none" categoryId as null
      if (data.categoryId === "none") {
        data.categoryId = null;
      }
      
      if (req.file) {
        data.imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedProduct = await storage.updateProduct(req.params.id, data);
      res.json(updatedProduct);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant || product.restaurantId !== restaurant.id) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: "Produto deletado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }

      const categories = await storage.getCategoriesByRestaurant(restaurant.id);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }

      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory({
        ...data,
        restaurantId: restaurant.id,
      });

      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }

      const productCount = await storage.getProductCount(restaurant.id);
      const viewCount = await storage.getMenuViewCount(restaurant.id);

      res.json({
        products: productCount,
        views: viewCount,
        scans: Math.floor(viewCount * 0.8), // Estimate QR scans as 80% of views
        plan: (req.user as any).plan,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // QR Code generation
  app.get("/api/qr-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      const restaurant = await storage.getRestaurantByUserId((req.user as any).id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }

      const menuUrl = `${req.protocol}://${req.get('host')}/menu/${restaurant.slug}`;
      const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({ qrCode: qrCodeDataUrl, menuUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public menu routes
  app.get("/api/menu/:slug", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurantBySlug(req.params.slug);
      if (!restaurant) {
        return res.status(404).json({ message: "Menu não encontrado" });
      }

      const products = await storage.getProductsByRestaurant(restaurant.id);
      const categories = await storage.getCategoriesByRestaurant(restaurant.id);

      // Record view
      await storage.recordMenuView(
        restaurant.id,
        req.get('User-Agent'),
        req.ip
      );

      res.json({
        restaurant,
        products: products.filter(p => p.isActive),
        categories,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    if (!stripe) {
      return res.status(503).json({ 
        error: { message: 'Subscription service is not available. Please configure Stripe.' }
      });
    }

    let user = req.user as any;

    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });

      return;
    }
    
    if (!user.email) {
      throw new Error('No user email on file');
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.email,
      });

      user = await storage.updateUser(user.id, { stripeCustomerId: customer.id });

      // Create product and price first
      const product = await stripe.products.create({
        name: 'MenuQR Premium',
        description: 'Plano Premium com produtos ilimitados',
      });

      const price = await stripe.prices.create({
        product: product.id,
        currency: 'brl',
        unit_amount: 2490, // R$ 24,90 in cents
        recurring: {
          interval: 'month',
        },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customer.id, subscription.id);
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // File upload routes
  app.post("/api/upload", upload.single('file'), (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    res.json({ url: `/uploads/${req.file.filename}` });
  });

  const httpServer = createServer(app);
  return httpServer;
}
