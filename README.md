# AIfy Interiors - AI-Powered Interior Design Platform

AI-powered interior design platform that helps users visualize and redesign their spaces using DALL-E 3.

## 🎯 Product Overview

**AIfy Interiors** is a comprehensive AI-powered interior design SaaS serving three tiers:
- **Tier 1 (Consumer)**: aifyinteriors.com - Room visualization, style library, shopping integration
- **Tier 2 (India Market)**: Interiorsai.in - Vastu-compliant designs, Indian furniture catalogs (future)
- **Tier 3 (Professional)**: interiorsai.pro.com - HD renders, client management, commercial licensing (future)

**Current Implementation**: MVP focused on Tier 1 Consumer features in a unified app

## ✨ Features (MVP)

### Core Features
- 🎨 **AI Room Visualization** - Upload room photos and generate AI-redesigned versions
- 🏠 **8 Room Types** - Living Room, Bedroom, Kitchen, Bathroom, Dining, Office, Kids Room, Patio
- 🎭 **10+ Design Styles** - Modern, Scandinavian, Industrial, Bohemian, Traditional, and more
- 🖼️ **Before/After Comparison** - Interactive slider to compare original vs AI-generated
- 🛍️ **Shopping Integration** - Product recommendations with affiliate links
- 💳 **Subscription Tiers** - Free (3 designs), Basic ($19/mo), India (₹999/mo), Pro ($99/mo)

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js 20
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI DALL-E 3 (HD quality)
- **Auth**: Firebase Authentication
- **Payments**: Stripe
- **Deployment**: Docker + Google Cloud Run

## 📁 Project Structure

```
msSaaS_aifyinteriors.com/
├── client/                      # Frontend React app
│   ├── src/
│   │   ├── components/         # React components
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   └── auth/              # Firebase auth setup
│   └── index.html
├── server/                      # Backend Express app
│   ├── routes/                # API route handlers
│   ├── services/              # Business logic
│   │   ├── dalle.service.ts   # DALL-E 3 integration
│   │   └── credits.service.ts # Credit management
│   ├── middleware/            # Express middleware
│   └── scripts/               # Utility scripts
├── shared/                      # Shared between client/server
│   └── schema.ts              # Database schema (Drizzle ORM)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── drizzle.config.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Firebase project
- Stripe account (for payments)

### Installation

1. **Clone the repository**
```bash
cd AxionApps/msSaaS/msSaaS_aifyinteriors.com
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your credentials:
# - DATABASE_URL (PostgreSQL)
# - OPENAI_API_KEY
# - Firebase config (6 variables)
# - Stripe keys
```

4. **Set up database**
```bash
npm run db:push
```

5. **Seed initial data** (design styles and room types)
```bash
npm run seed
```

6. **Start development server**
```bash
npm run dev
```

Visit http://localhost:5000

## 📊 Database Schema

### Core Tables

**users** - User accounts with Firebase auth
- Firebase UID, email, display name
- Subscription tier (free, basic, india, professional)
- Credits balance and usage tracking
- Stripe customer and subscription IDs

**designs** - User-generated interior designs
- Original and AI-generated images (base64)
- Style and room type references
- Generation metadata (prompt, AI model, timing)
- Watermark flag for free tier

**designStyles** - Available design styles
- Name, slug, description, category
- AI prompt modifiers
- Tier access control (free, basic, pro)

**roomTypes** - Room categories
- Name, slug, icon, description
- AI prompt context

**products** - Shopping catalog
- Product details, pricing, images
- Affiliate URLs and retailer info
- Style compatibility

**creditTransactions** - Credit usage history
**subscriptions** - Stripe subscription tracking
**favorites** - User saved designs/products

## 🎨 Design Styles

| Style | Tier | Description |
|-------|------|-------------|
| Modern Minimalist | Free | Clean lines, neutral colors |
| Scandinavian | Free | Light, airy, natural materials |
| Industrial | Free | Exposed brick, metal, reclaimed wood |
| Traditional | Free | Classic, elegant, rich colors |
| Bohemian | Basic | Eclectic colors and patterns |
| Mid-Century Modern | Basic | Retro 1950s-60s aesthetic |
| Coastal | Basic | Beach-inspired blues and whites |
| Farmhouse | Basic | Rustic charm with modern comfort |
| Contemporary Luxury | Pro | High-end finishes, sophisticated |
| Japanese Zen | Pro | Peaceful, minimal, natural |

## 💰 Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 designs/month, basic styles, watermarked |
| **Basic** | $19/mo | Unlimited designs, all styles, no watermark, 1080p |
| **India** | ₹999/mo | All Basic + Vastu, Indian catalogs *(coming soon)* |
| **Professional** | $99/mo | All Basic + HD 4K, client mgmt, commercial license *(coming soon)* |

## 🔧 Development

### Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Run production build
npm run check       # TypeScript type checking
npm run db:push     # Push schema changes to database
npm run db:studio   # Open Drizzle Studio (database GUI)
npm run seed        # Seed design styles and room types
```

### API Endpoints

**Design Generation**
- `POST /api/designs/generate` - Generate new design (requires auth + credits)
- `GET /api/designs/my-designs` - Get user's designs
- `GET /api/designs/:id` - Get single design
- `PATCH /api/designs/:id` - Update design
- `DELETE /api/designs/:id` - Delete design

**Styles & Room Types**
- `GET /api/styles` - List all design styles
- `GET /api/room-types` - List all room types

**User & Subscription**
- `GET /api/user` - Get current user
- `POST /api/subscribe` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## 🔐 Authentication

Firebase Authentication with:
- Email/Password sign-up and login
- Google Sign-In
- Password reset
- Session management

Backend verifies Firebase ID tokens and syncs users to PostgreSQL.

## 💳 Payment Integration

Stripe integration with:
- Subscription checkout sessions
- Webhook handling for subscription events
- Automatic tier upgrades/downgrades
- Credit system for free tier

## 🚢 Deployment

### Docker Build

```bash
docker build -t aifyinteriors:latest .
```

### Google Cloud Run

```bash
gcloud run deploy aifyinteriors \
  --image gcr.io/PROJECT_ID/aifyinteriors:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --set-env-vars DATABASE_URL=$DATABASE_URL
```

## 📈 Success Metrics

**Business KPIs**:
- User signups (free vs paid conversion)
- MRR target: $5K/month in 3 months
- Churn rate: < 5% monthly
- Avg designs per user: > 10/month
- Shopping CTR: > 15%

**Technical KPIs**:
- Design generation success rate: > 98%
- Avg generation time: < 30 seconds
- API uptime: 99.9%
- DALL-E API costs: < $0.10 per user/month

## 🗺️ Roadmap

### Phase 1: MVP (Current) ✅
- Core AI visualization
- Design styles and room types
- Authentication and credits
- Basic subscription tiers

### Phase 2: India Market 🚧
- Vastu compliance checker
- Indian furniture catalogs
- Hindi language support
- Razorpay payment integration

### Phase 3: Professional Tier 🔮
- HD 4K rendering
- Client and project management
- White-label options
- Commercial licensing
- API access

## 📝 License

Proprietary - Part of msSaaS Portfolio

## 🤝 Support

For issues or questions, contact the development team.

---

**Built with ❤️ using React, TypeScript, DALL-E 3, and Firebase**
