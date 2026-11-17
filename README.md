# 🎉 Celebrating YOU — Event Artisan Marketplace & Celebration Platform

A full-stack, enterprise-grade marketplace platform connecting event hosts with verified celebration artisans (caterers, candid photographers, decorators, sound engineers, mehendi artists, and performers).

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **SQLite/PostgreSQL**.

---

## ✨ Features

### 👑 1. Event Hosts (Customers)
* **Explore Artisans**: Browse verified celebration artisans with filtering by category, city, pricing, and availability.
* **Side-by-Side Artisan Comparison**: Select up to 3 artisans to compare packages, advance payment %, travel charges, and inclusions side-by-side.
* **Event Planning Workspace**: Create customized events (weddings, anniversaries, milestone birthdays) from templates, set overall budgets, track preparation milestones, and link multiple bookings.
* **Two-Phase Payment Workflow**:
  * **Advance Payment**: Locks date and unlocks direct artisan contact details. Automatically generates **Doc 1: Advance Voucher / Tax Invoice**.
  * **Final Payment**: Closes outstanding balance post-event. Automatically generates **Doc 2: Final Payment Receipt / Tax Invoice**.
* **Invoices Dashboard**: Dedicated `/customer/invoices` workspace with search, filter pills, and instant PDF download.
* **Verified Reviews**: Post ratings and reviews only after event completion.

### 🎨 2. Celebration Artisans (Vendors)
* **Catalog & Service Management**: Configure service offerings, package tiers, add-ons, pricing models, and terms.
* **Interactive Availability Calendar**: Visual calendar at `/vendor/calendar` supporting date blackouts and instant slot locking.
* **2-Hour SLA Response Engine**: Dedicated response window (`ACCEPTED_AWAITING_ADVANCE` / `REJECTED_BY_VENDOR`).
* **Rolling 7-Day Decline Policy**: Backend tracks vendor declines; warns and logs excessive declines if more than 3 occur within any rolling 7-day period.
* **Artisan Marketing Card**: Custom direct booking and marketing link (`/explore?search=...&ref=...`) with one-click clipboard copy and WhatsApp sharing.
* **Vendor Financials & Settlements**: Ledger tracking gross contract values, configurable platform commissions, and net payables.

### 🛡️ 3. Operations & Trust (Admin Portal)
* **Isolated Admin Workspace**: Dedicated `/admin-portal` with secure session cookies and role-based access control.
* **Artisan Verification**: Review submitted business identities, PAN, GSTIN, and portfolio credentials before granting service publishing rights.
* **Configurable Commission Engine**: Dynamic category commission settings and per-artisan commission rate overrides.
* **Dispute & Complaint Resolution**: Track customer-artisan complaints with investigation workflows and resolution notes.
* **Audit Trail**: Real-time logging of administrative actions, commission adjustments, and compliance flags.

### ⚖️ 4. Legal & Financial Compliance
* **Differential Indian GST Rates**:
  * SAC 9963: Outdoor catering / food services at 5% GST.
  * SAC 9983: Creative, photography, and technical services at 18% GST.
* **Unregistered Artisan Protection**: Artisans without a GSTIN receive compliant **"Payment Receipt & Booking Voucher"** documents with 0% tax and legal non-GST disclosure footnotes.
* **Privacy by Design**: Customer and vendor phone/email details remain masked until advance payment is confirmed.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Database & ORM**: [Prisma](https://www.prisma.io/) with SQLite (local development) and PostgreSQL migration scripts
* **Icons**: [Lucide React](https://lucide.dev/)
* **PDF Invoicing**: [jsPDF](https://github.com/parallax/jsPDF) & `jspdf-autotable`
* **Authentication**: Stateless HTTP-only JWT cookies with bcryptjs password hashing

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/aishn820-sudo/Celebrating_You.git
cd Celebrating_You
npm install
```

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secure-jwt-secret"
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your-cron-secret-token"
PAYMENT_GATEWAY_PROVIDER="SANDBOX"
```

### 3. Database Initialization
```bash
npx prisma generate
npx prisma db push
node scripts/seed.mjs
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

The repository includes comprehensive automated test suites:

```bash
# 1. TypeScript verification
npx tsc --noEmit

# 2. Core integration suite (31 tests)
node scripts/test-e2e.mjs

# 3. Critical edge-case & financial suite (39 tests)
node scripts/test-qa-scenarios.mjs

# 4. End-to-end HTTP API workflow suite (51 tests)
node scripts/test-api-e2e.mjs

# 5. Production build test (66 routes)
npm run build
```

---

## 📂 Project Structure

```
├── prisma/
│   └── schema.prisma             # Database schema (30 models)
├── public/                       # Static assets and uploads
├── scripts/
│   ├── seed.mjs                  # Test fixtures and initial data
│   ├── test-e2e.mjs              # Integration test suite
│   ├── test-qa-scenarios.mjs     # Edge case and legal tax tests
│   ├── test-api-e2e.mjs          # Live HTTP API test suite
│   └── migrate-to-postgres.mjs   # Production PostgreSQL migration
├── src/
│   ├── app/                      # Next.js App Router routes
│   │   ├── admin-portal/         # Isolated admin dashboard
│   │   ├── api/                  # REST API route handlers
│   │   ├── customer/             # Customer workspace & invoices
│   │   ├── vendor/               # Artisan workspace, calendar & catalog
│   │   ├── explore/              # Artisan discovery & comparison tray
│   │   └── services/             # Artisan service detail pages
│   ├── components/               # Reusable UI & business components
│   └── lib/                      # State machines, auth, invoicing & payments
└── package.json
```

---

## 📜 License
This project is proprietary and confidential. All rights reserved.
