# MenuQR - Digital Menu Micro-SaaS

A complete Digital Menu platform that allows restaurants to create QR code accessible menus with subscription-based tiers.

## Features

### Free Plan
- Up to 5 menu products
- QR Code generation
- Mobile-responsive public menu
- Basic restaurant configuration

### Premium Plan (R$ 24,90/month)
- Unlimited products
- Advanced customization
- Detailed analytics
- Priority support

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Wouter for routing
- TanStack Query for data fetching
- Shadcn/ui components
- React Hook Form with Zod validation

### Backend
- Node.js with Express
- Passport.js for authentication
- PostgreSQL with Neon hosting
- Drizzle ORM
- Stripe for payments
- Multer for file uploads
- QRCode generation

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Stripe account for payments

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL=your_neon_postgresql_url

# Session Secret
SESSION_SECRET=your-super-secret-session-key

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# Development
PORT=5000
NODE_ENV=development
# digimenu
