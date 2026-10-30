# 📘 AURA LABS Storefront Documentation

**Version:** 1.0.0
**Last Updated:** January 16, 2026
**Status:** Production-Ready

---

## 1. Executive Summary

AURA LABS Storefront is a high-performance, next-generation e-commerce platform built for the modern cognitive athlete. It leverages headless architecture, edge-ready rendering, and an integrated LLM-based intelligent consultant to deliver a premium, award-winning user experience.

### Key Pillars
- **Performance First**: Optimized Next.js App Router architecture.
- **Science-Backed Design**: Aesthetically aligned with clinical precision and luxury.
- **Intelligent Assistance**: Context-aware AI consultant ("Konsultantas") embedded in the shopping journey.
- **Seamless UX**: Frictionless navigation, "Quick Add" flows, and mobile-first responsive design.

---

## 2. Technical Architecture

### 2.1 Core Stack
| Component | Technology | Description |
|-----------|------------|-------------|
| **Framework** | Next.js 14 (App Router) | Server-side rendering, React Server Components (RSC). |
| **Language** | TypeScript | Strong typing for reliability and scale. |
| **Styling** | Tailwind CSS + Framer Motion | Utility-first styling with complex physics-based animations. |
| **State Mgmt** | Zustand | Lightweight client-side state (Cart, Chat, UI). |
| **Database** | Drizzle ORM | Type-safe SQL query builder connected to the platform DB. |
| **AI Engine** | Custom API (`/api/chat`) | RAG-based LLM integration with product catalog context. |

### 2.2 Directory Structure
```
apps/storefront/src/
├── app/                  # App Router pages and API routes
│   ├── api/chat/         # AI Consultant backend logic
│   ├── products/         # Product listing and filtering
│   ├── product/[id]/     # Dynamic product detail pages
│   └── ...
├── components/           # Reusable UI components
│   ├── chat-widget.tsx   # AI Assistant UI
│   ├── product-card.tsx  # Enhanced product card
│   └── ...
├── store/                # Zustand stores (cart.ts, chat.ts)
└── context/              # React Context (StoreContext)
```

---

## 3. Design System & UX

### 3.1 Visual Language ("Award-Winning Aesthetic")
The design philosophy merges **clinical science** with **luxury lifestyle**.
- **Typography**: `Outfit` (Headings) for modern boldness, `Sans-Serif` (Body) for readability, `Monospace` for technical data.
- **Color Palette**:
  - `Zinc-900` (Backgrounds) - Deep, premium dark mode feel.
  - `Emerald-500` to `Cyan-400` (Gradients) - Represents bio-availability and energy.
  - `Amber-500` (Accents) - Used for warnings or verification badges.
- **UI Physics**: Smooth spring animations using `Framer Motion` for interactions (Cart drawer, Hover effects).

### 3.2 Layout Components
- **Navbar**: Scroll-aware, transitions from transparent to solid. Includes "Quick Cart" and "Search".
- **Hero Sections**: Immersive 100vh displays with parallax scroll effects.
- **Footer**: Clean, information-dense layout with newsletter integration.

---

## 4. Key Functionality

### 4.1 Product Discovery
The `/products` page is engineered for discovery and speed.
- **Popular Products Carousel**: Horizontal snap-scroll section highlighting "Top Sales".
- **Interactive Category Tabs**: Quick filtering without page reloads (e.g., "Vitaminai", "Sportas").
- **Enhanced Product Cards**:
  - **Quick Add**: One-click add to cart from the grid.
  - **Live Status**: Real-time "In Stock" / "Sold Out" badges.
  - **Dynamic Badges**: "NAUJAS" (New), "TOP" (Bestseller).

### 4.2 Product Experience
- **Gallery**: Interactive thumbnail navigation with zoom capabilities.
- **Contextual Pricing**: Dynamic pricing based on selected variant.
- **Cross-Sell**: "Frequently bought together" recommendations (Roadmap).

### 4.3 Checkout Flow
- **Cart Drawer**:
  - Slide-out interaction.
  - **Free Shipping Progress**: Dynamic bar showing amount needed for free shipping.
  - **Live Updates**: Instant subtotal calculation.
- **Checkout**: Streamlined single-page checkout (Integration with Stripe/Payment Gateway).

---

## 5. Intelligent Consultant (AI Assistant)

### 5.1 Overview
"Konsultantas" is not just a chatbot; it's a context-aware product expert.
- **Name**: Konsultantas (formerly Assistant).
- **Status**: Always "Prisijungęs" (Online).

### 5.2 Capabilities
- **Product Knowledge**: Access to full real-time product catalog (Ingredients, Usage, Price).
- **Context Awareness**: Knows if the user is on a specific product page or browsing a category.
- **Markdown Rendering**: Renders clickable product links (`[Product Name](/products/id)`) and clear formatting.
- **Proactive Greeting**: Welcomes users with relevant context (e.g., "Can I help you choose a vitamin?").

### 5.3 Technical Flow
1. **User Input** → Client (`ChatWidget`)
2. **Context Injection** → Current Page + Active Product + Cart Contents attached to payload.
3. **API Processing** (`/api/chat`) → System prompt formulated with RAG data.
4. **LLM Response** → Streamed back to client.
5. **Actionable Output** → Links rendered as Next.js `<Link>` for fast navigation.

---

## 6. Deployment & Operations

### 6.1 Environment Variables
- `DATABASE_URL`: Connection string for PostgreSQL.
- `OPENAI_API_KEY` (or equivalent): For AI Consultant.
- `NEXT_PUBLIC_BASE_URL`: Canonical URL for SEO.

### 6.2 Performance Metrics (Target)
- **LCP (Largest Contentful Paint)**: < 1.2s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: 0

---

## 7. Future Roadmap
- **v1.1**: User Accounts & Loyalty Points.
- **v1.2**: Multi-language support (EN/LT toggle).
- **v2.0**: AR Product Visualization.
