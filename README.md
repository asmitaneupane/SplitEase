# SplitEase

**Track expenses, split bills, and manage debts with friends - all in one place.**

SplitEase is a modern web application that simplifies group expense management. Keep track of who owes whom, settle debts effortlessly, and maintain financial transparency within your groups.

## Features

- 📊 **Expense Tracking**: Log and categorize group expenses with detailed information
- 👥 **Group Management**: Create groups for different occasions, projects, or friend circles
- 💰 **Smart Balance Calculation**: Automatically calculate balances and settlements between group members
- 📈 **Activity Dashboard**: View recent transactions and group activity at a glance
- 🔐 **Secure Authentication**: User sign-up and login with Supabase
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 📱 **Mobile Friendly**: Fully responsive interface for all device sizes

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15+ with TypeScript
- **Styling**: Tailwind CSS with PostCSS
- **UI Components**: Radix UI with custom components
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Authentication)
- **Authentication**: Supabase Auth with OAuth support
- **Analytics**: Vercel Analytics
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── activity/      # Recent activity view
│   │   ├── dashboard/     # Main dashboard
│   │   ├── groups/        # Group management
│   │   └── settings/      # User settings
│   ├── auth/              # Authentication pages
│   └── layout.tsx         # Root layout with metadata
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── groups/           # Group-related components
├── lib/                   # Utility functions and types
│   ├── supabase/        # Supabase client and middleware
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Helper utilities
├── hooks/                # Custom React hooks
├── middleware.ts         # Next.js middleware for auth
└── public/              # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SplitEase
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Database Schema

The project includes a database schema setup script:

- `scripts/001_create_schema.sql` - Initial database schema creation

Run this script in your Supabase SQL editor to set up the required tables.

## Key Pages

- **Dashboard** (`/dashboard`) - Main overview with balance summary and recent activity
- **Groups** (`/dashboard/groups`) - Manage expense groups
- **Group Details** (`/dashboard/groups/[id]`) - View group members, balances, and expenses
- **Add Expense** (`/dashboard/groups/[id]/expenses/new`) - Create new group expense
- **Settings** (`/dashboard/settings`) - User preferences and account settings
- **Activity** (`/dashboard/activity`) - Timeline of all transactions

## Authentication Flow

1. Users sign up or log in via `/auth/login` or `/auth/sign-up`
2. Supabase Auth handles user verification
3. Middleware protects dashboard routes
4. Session managed via Supabase SSR

## Development Notes

- TypeScript is enforced for type safety
- ESLint ensures code quality
- Responsive design uses Tailwind CSS utilities
- All UI components are customizable and accessible
- API routes can be added in `app/api/` directory

## Contributing

Contributions are welcome! Please ensure:

- Code follows the existing style
- TypeScript types are properly defined
- Components are reusable and well-documented

## License

See [LICENSE](LICENSE) file for details.

## Support

For issues, feature requests, or questions, please open an issue in the repository.
