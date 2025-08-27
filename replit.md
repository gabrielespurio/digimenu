# MenuQR - Digital Menu Micro-SaaS

## Overview

MenuQR is a subscription-based digital menu platform that allows restaurants to create QR code accessible menus with tiered pricing. The system offers a free plan with limited features (up to 5 menu products) and a premium plan (R$24.90/month) with unlimited products and advanced features. The platform generates QR codes that customers can scan to view mobile-responsive digital menus, providing restaurants with a modern alternative to traditional printed menus.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS with Shadcn/ui component library for consistent, professional UI
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod for validation and type safety
- **Responsive Design**: Mobile-first approach optimized for QR code scanning on mobile devices

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Authentication**: Passport.js with local strategy for email/password authentication
- **Session Management**: Express sessions with secure cookie-based storage
- **File Uploads**: Multer middleware for handling restaurant logos and product images
- **QR Code Generation**: QRCode library for generating scannable menu links

### Database Design
- **Database**: PostgreSQL hosted on Neon with connection pooling
- **ORM**: Drizzle ORM for type-safe database interactions
- **Schema Structure**:
  - Users table with plan types and Stripe integration fields
  - Restaurants table with customization options (colors, styles, contact info)
  - Categories table for organizing menu items with ordering
  - Products table with pricing, descriptions, and image URLs
  - Menu views table for tracking public menu access analytics

### Authentication & Authorization
- **User Authentication**: Email/password with bcrypt hashing
- **Session-based**: Server-side sessions with secure cookies
- **Plan Enforcement**: Middleware to restrict features based on user plan (free vs premium)
- **Route Protection**: Authentication middleware for protected admin routes

### Payment Integration
- **Payment Processor**: Stripe for subscription management
- **Subscription Model**: Monthly recurring billing at R$24.90
- **Plan Management**: Automatic feature restrictions when subscriptions expire
- **Customer Portal**: Stripe customer portal for subscription management

### File Management
- **Storage**: Local file system with organized upload directories
- **Image Processing**: Multer configuration for restaurant logos and product images
- **File Validation**: Type and size restrictions for uploaded images

### Public Menu System
- **SEO-Friendly URLs**: Slug-based restaurant identification for public menus
- **Mobile Optimization**: Responsive design optimized for mobile QR code scanning
- **Search & Filtering**: Client-side product search and category filtering
- **Analytics Tracking**: Menu view tracking for restaurant insights

## External Dependencies

### Core Infrastructure
- **Database Hosting**: Neon PostgreSQL for reliable cloud database hosting
- **Payment Processing**: Stripe for secure subscription billing and payment management
- **File Storage**: Local filesystem storage for uploaded images

### Development & Build Tools
- **Package Management**: npm for dependency management
- **Build System**: Vite for development server and production builds
- **TypeScript**: For type safety across frontend and backend
- **PostCSS**: For CSS processing and optimization

### UI & Styling
- **Component Library**: Radix UI primitives via Shadcn/ui for accessible components
- **Icon Library**: Lucide React for consistent iconography
- **Font Loading**: Google Fonts integration for typography

### Monitoring & Analytics
- **Development**: Replit integration for development environment
- **Error Handling**: Runtime error overlays for development debugging