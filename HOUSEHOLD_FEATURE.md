# Household Finance Feature

## Overview

The **Household** feature is a completely separate and independent space for managing intimate, private shared finances between partners, spouses, or family members. Unlike the bill-splitting groups, households are designed for long-term financial partnership tracking.

## Key Differences: Household vs Groups

| Feature             | Household                | Group                            |
| ------------------- | ------------------------ | -------------------------------- |
| **Purpose**         | Intimate shared finances | Bill splitting & expense sharing |
| **Relationship**    | Partners/Family          | Friends/Roommates/Colleagues     |
| **Privacy**         | Highly private           | Shared with multiple people      |
| **Income Tracking** | ✅ Yes                   | ✅ Yes (with income logs)        |
| **Expense Logs**    | ✅ Per-person            | ✅ Shared expense splitting      |
| **Member Roles**    | Owner/Partner/Member     | Admin/Member                     |
| **Visibility**      | Only household members   | Only group members               |

## Features

### 1. **Household Management**

- Create a household with a name and description
- Invite household members
- Owner can manage household settings and members
- Multiple households supported

### 2. **Income Tracking**

- Log income for each household member
- Track income source (Salary, Bonus, Gift, etc.)
- Add descriptions and notes
- View all income history
- Automatic balance calculations

### 3. **Expense Logs**

- Log individual expenses for each member
- Categorize expenses (Food, Utilities, Healthcare, etc.)
- Track who spent what
- View all expenses organized by category
- Add notes and descriptions

### 4. **Net Balance Calculation**

- Automatic calculation of each member's net balance
- Income - Expenses = Net Balance
- Shows who is contributing more and who is spending more
- Real-time balance updates

### 5. **Member Profiles**

- Individual member dashboards
- See all income earned by each member
- See all expenses made by each member
- View complete financial history

## Database Schema

### Tables

**households** - Main household record

- id, name, description, currency
- created_by, created_at, updated_at

**household_members** - Household participants

- id, household_id, user_id, name, email, role
- Roles: owner, partner, member

**household_income_logs** - Income records

- id, household_id, member_id, amount, currency
- description, source, date, notes
- created_by, created_at, updated_at

**household_expense_logs** - Expense records

- id, household_id, member_id, amount, currency
- description, category, date, notes
- created_by, created_at, updated_at

**household_balances** (View) - Calculated balances

- Shows total_income, total_expenses, net_balance per member

## Pages & Routes

```
/household
├── page.tsx                           # All households
├── new/
│   └── page.tsx                      # Create household
├── [id]/
│   ├── page.tsx                      # Household dashboard
│   ├── settings/
│   │   └── page.tsx                  # Manage household (owner only)
│   ├── income/
│   │   ├── page.tsx                  # All income logs
│   │   └── new/
│   │       └── page.tsx              # Add income
│   ├── expense/
│   │   ├── page.tsx                  # All expenses
│   │   └── new/
│   │       └── page.tsx              # Add expense
│   └── member/
│       └── [memberId]/
│           └── page.tsx              # Member profile
```

## Usage Examples

### Creating a Household

1. Go to `/household`
2. Click "Create Household"
3. Enter household name, description, and currency
4. Owner is automatically added

### Adding Income

1. Navigate to household dashboard
2. Click "Add Income" or go to Income tab
3. Select the member who earned it
4. Enter amount, source, and date
5. Save

### Adding an Expense

1. Navigate to household dashboard
2. Click "Add Expense" or go to Expenses tab
3. Select who made the expense
4. Enter description, amount, category, and date
5. Save

### Viewing Member Balances

1. Household dashboard shows all members with balances
2. Click on any member to see detailed profile
3. View all their income and expenses
4. See their net balance (Income - Expenses)

## Security

- **Row Level Security (RLS)** - Only household members can see their household data
- **Owner Controls** - Only owners can add/remove members
- **User Isolation** - Users can only see households they're members of
- **Role-Based Access** - Different permissions for owner/partner/member roles

## Currency Support

Supports multiple currencies:

- NPR (Nepali Rupee) - Default
- USD, EUR, GBP, INR, AUD, CAD

## Integration

The Household feature is completely independent from the Groups feature:

- No shared tables
- Separate navigation tab
- Separate database schema
- Can be used alongside or instead of Groups

## Future Enhancements

Potential additions:

- Member invitations via email
- Transfer/settlement tracking between partners
- Budget goals and forecasting
- Joint account management
- Family tree structures
- Multi-currency support with conversion
- Export to PDF/CSV
- Monthly/yearly summaries
