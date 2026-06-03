# PujariGhar — Frontend

E-commerce storefront for puja essentials. Built with **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, and **Redux Toolkit Query**.

---

## Tech Stack

| Tool | Version |
|------|---------|
| Next.js | 14.2 |
| React | 18.3 |
| TypeScript | 5.7 |
| Tailwind CSS | 3.x |
| Redux Toolkit (RTK Query) | latest |
| next-intl | i18n (bn / en) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:8020`

### Install & Run

```bash
npm install
npm run dev
```

App starts at **http://localhost:3000**

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8020
NEXT_PUBLIC_DEFAULT_LOCALE=bn
```

---

## Project Structure

```
src/
├── app/
│   └── [locale]/
│       ├── page.tsx              # Home page
│       ├── products/             # Product listing & detail
│       ├── packages/             # Package listing & detail
│       ├── cart/                 # Shopping cart
│       ├── orders/               # Customer orders
│       ├── auth/                 # Login / Register
│       ├── profile/              # User profile
│       └── admin/                # Admin panel
│           ├── orders/           # POS + order management
│           ├── products/         # Product CRUD
│           ├── packages/         # Package CRUD
│           ├── categories/       # Category management
│           ├── inventory/        # Stock management
│           ├── users/            # User management
│           ├── banners/          # Offer banners
│           ├── slides/           # Hero slider
│           ├── accounting/       # Journal, Ledger, Reports
│           └── dashboard/        # Analytics
├── api/                          # RTK Query API slices
├── components/
│   ├── home/                     # Home page sections
│   ├── layout/                   # Navbar, Footer
│   ├── products/                 # ProductCard, PackageCard, OfferBanners
│   └── ui/                       # Reusable UI components
├── lib/                          # Types
├── store/                        # Redux store, auth, cart, toast
└── utils/                        # formatAmount, formatNumber
```

---

## Features

- **Bilingual** — Bengali (bn) and English (en) via next-intl
- **Admin POS** — Point-of-sale with products & packages tab
- **Hero Slider** — Dynamic image carousel managed from admin
- **Offer Banners** — Scrollable offer strips on products page
- **Infinite Scroll** — Products page loads more on scroll
- **Package System** — Bundle products with discounts
- **Accounting** — Journal entries, Ledger, Reports

---

## Build

```bash
npm run build
npm start
```

---

## Seed Users (dev)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pujarighar.com | admin123 |
| Customer | customer@pujarighar.com | customer123 |
