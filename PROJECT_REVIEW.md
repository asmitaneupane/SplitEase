# SplitEase ❙ Technical Project Review

This document provides a comprehensive review of the SplitEase codebase, detailing the architecture, components, and core logic that power this luxury financial management platform.

---

## 1. Architecture Overview
SplitEase is built as a modern, full-stack web application using the **Next.js App Router** architecture. It leverages a server-client hybrid model to optimize performance and security.

- **Frontend**: React 19 with Next.js 14+ (App Router).
- **Styling**: TailwindCSS 4.0 with a custom "Luxury Minimalist" design system.
- **Backend-as-a-Service**: Supabase (Auth, PostgreSQL, Real-time).
- **Communication**: Resend for transaction-grade email invitations.
- **Data Flow**: Server Components for data fetching, Client Components for interactive UI, and Server Actions for mutations.

---

## 2. Core Modules & Pages

### 2.1 Dashboard (`app/(dashboard)/dashboard/page.tsx`)
The nerve center of the application. It provides a unified view of the user's financial state.
- **Spending Insights**: Visualizes 7-day transaction trends using `recharts`.
- **Quick Actions**: Prominent triggers for adding expenses or members.
- **Recent Activity**: A height-matched sidebar feed showing real-time updates across all circles.
- **Logic**: Aggregates data from `groups`, `expenses`, `households`, and `activities` using a single server-side pass.

### 2.2 Circles / Groups (`app/(dashboard)/groups/`)
Managed collaborative spaces for social expense splitting.
- **Overview Page**: Lists active circles with high-contrast card designs.
- **Detail Page (`[id]/page.tsx`)**: Features a tabbed interface (Expenses, Balances, Members).
- **Group Creation (`new/page.tsx`)**: Multi-step initialization for new social circles.

### 2.3 Personal Logs / Household (`app/(dashboard)/household/`)
Private or household-centric financial tracking.
- **Monthly Log Book**: A specialized view for recurring household expenses.
- **Income Tracking**: Dedicated modules for logging and managing income sources.

### 2.4 Authentication (`app/auth/`)
- **Sign Up / Login**: High-end, glassmorphism-inspired authentication portals.
- **Claiming Logic**: Automatically links pending email invitations to new accounts upon sign-up.

---

## 3. Core Components Review

### 3.1 `RecentActivity` (`components/dashboard/recent-activity.tsx`)
- **Purpose**: Displays a unified feed of global events.
- **Design**: Uses a "Timeline" aesthetic with Lucide icons.
- **Innovation**: Implements an internal scroll system that respects the overall dashboard grid height, preventing layout shift.

### 3.2 `GroupMembers` (`components/groups/group-members.tsx`)
- **Functionality**: Handles member invitation, role management (Host/Member), and removal.
- **Email Integration**: Triggers the `sendInvitationEmail` server action.
- **Ghost Members**: Supports "Ghost" members who don't require a digital account for tracking.

### 3.3 `SpendingChart` (`components/dashboard/spending-chart.tsx`)
- **Visuals**: Uses a custom-styled `AreaChart` with gradients to represent cash flow trends.
- **Performance**: Lightweight wrapper around `recharts` optimized for responsive dashboard layouts.

### 3.4 `BalanceSummary` (`components/dashboard/balance-summary.tsx`)
- **Calculation**: Dynamically computes "Owes you" vs "You owe" by parsing group expense splits and settlements.
- **UI**: High-contrast summary cards with action-oriented badges.

---

## 4. Backend & Utilities (`lib/`)

### 4.1 `email-actions.ts`
- **Technology**: Resend SDK.
- **Function**: `sendInvitationEmail`. Sends a luxury-styled HTML email to new collaborators.
- **Design**: Minimalist HTML template with embedded action links.

### 4.2 `membership.ts`
- **Function**: `claimPendingMemberships`. A critical utility that scans both `group_members` and `household_members` for a matching email address when a new user signs up, instantly granting them access to their invited circles.

### 4.3 `currency.ts`
- **Functionality**: Standardizes currency formatting (NPR, USD, etc.) across the entire platform to ensure consistent financial representation.

### 4.4 `supabase/`
- **Client/Server separation**: Dedicated clients for client-side interactions (`client.ts`) and server-side operations (`server.ts`, `middleware.ts`).

---

## 5. Design System (`components/ui/`)
The project utilizes a robust component library based on **Radix UI**, customized for the SplitEase aesthetic:
- **`Card`**: Redefined with `rounded-[2rem]` and `border-black/5`.
- **`Button`**: Includes an `elegant` variant for primary actions.
- **`Empty`**: A custom placeholder component for a premium "empty state" experience.
- **Glassmorphism**: Subtle usage of `glass` and `glass-darker` classes for authentication and overlays.

---

## 6. Project Health & Standards
- **TypeScript**: Strict typing across all data structures (`lib/types.ts`).
- **SEO**: Automated best practices (Semantic HTML, Meta descriptions) implemented in every page.
- **Performance**: Minimalist approach to animations and heavy libraries.

---
*Review compiled by SplitEase Technical Audit.*
