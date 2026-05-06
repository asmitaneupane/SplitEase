# SplitEase

SplitEase is a premium, minimalist financial management platform designed for modern collaborators. Whether you're tracking shared household budgets or splitting expenses with your social circles, SplitEase brings pixel-perfect clarity to every transaction.

## ✧ Core Philosophy: Luxury Minimalism
We believe financial tracking shouldn't feel like a chore. SplitEase is built with a "Less is More" aesthetic:
- **High-Contrast Typography**: Bold headings and crisp descriptions for effortless readability.
- **Soft Sapphire & Slate Palette**: Curated, harmonious colors providing a premium, calming feel.
- **Tactile Surfaces**: Glassmorphism, high-radius (pill-shaped) components, and pure white cards with subtle, hover-reactive shadows.
- **Fluid Micro-animations**: Optimized transitions and responsive components that make the interface feel alive.

## ✦ Key Features

### 1. Circles (Groups)
Create private spaces for friends, travel groups, or roommates. 
- **Real-time Splitting**: Add expenses and let the system handle the math.
- **Smart Balances**: Instantly see who owes whom across the entire circle.
- **Settlement Logic**: Securely record payments to keep the balance sheet clean.
- **Custom Categories**: Create new expense categories on the fly if the default list doesn't fit your needs.

### 2. Personal Logs (Household)
A dedicated space for private or household financial tracking.
- **Income & Expense Tracking**: Categorize every cent of your budget, including custom category creation.
- **Dual Calendar Universe**: A fully integrated Bikram Sambat (BS) and Gregorian (AD) calendar system. Toggle your universe mode, pick dates in either calendar, and filter your transaction ledger by authentic Nepali months.
- **Premium Ledger**: A high-density, beautifully crafted transaction timeline.
- **Collaborative Logs**: Securely invite partners to co-manage household finances using unified, premium invitation workflows.

### 3. Unified Activity Universe
A centralized, scrollable activity feed that keeps you updated on:
- New expenses and settlements.
- Group creations and member additions.
- Budget adjustments across all your logs.

### 4. Real Email Invitations
Powered by **Resend**, SplitEase sends professional, high-contrast invitation emails to your collaborators, allowing them to join your circles with a single click.

## 🛠 Tech Stack
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Email Engine**: [Resend](https://resend.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Management**: [date-fns](https://date-fns.org/) & [nepali-date-converter](https://www.npmjs.com/package/nepali-date-converter)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A Supabase Project
- A Resend API Key

### Installation
```bash
# Clone the repository
git clone https://github.com/asmitaneupane/splitease.git

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ⚖ License
SplitEase is designed for the modern elite. Proprietary development.

---
*Built with precision and clarity.*
