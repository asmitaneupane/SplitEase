export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  currency: string
  created_by: string | null
  created_at: string
  updated_at: string
  slug?: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string | null
  name: string
  email: string | null
  is_temporary: boolean
  role: 'admin' | 'member'
  joined_at: string
}

export interface Expense {
  id: string
  group_id: string
  description: string
  amount: number
  currency: string
  category: string
  paid_by: string
  split_type: 'equal' | 'exact' | 'percentage'
  date: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  member_id: string
  amount: number
  percentage: number | null
  is_settled: boolean
  created_at: string
}

export interface Settlement {
  id: string
  group_id: string
  from_member: string
  to_member: string
  amount: number
  currency: string
  notes: string | null
  settled_at: string
  created_by: string | null
}

export interface Activity {
  id: string
  group_id: string | null
  household_id: string | null
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// Household Types
export interface Household {
  id: string
  name: string
  description: string | null
  currency: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string | null
  name: string
  email: string | null
  role: 'owner' | 'partner' | 'member'
  joined_at: string
}

export interface HouseholdIncomeLog {
  id: string
  household_id: string
  member_id: string
  amount: number
  currency: string
  source: string
  date: string
  notes: string | null
  created_by: string
  created_at: string
}

export interface HouseholdExpenseLog {
  id: string
  household_id: string
  member_id: string
  amount: number
  currency: string
  category: string
  description: string
  date: string
  notes: string | null
  created_by: string
  created_at: string
}

export interface HouseholdBalance {
  member_id: string
  member_name: string
  total_income: number
  total_expenses: number
  net_balance: number
}

export interface Invitation {
  id: string
  group_id: string
  email: string
  invited_by: string | null
  member_id: string | null
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  token: string
  expires_at: string
  created_at: string
}

// Extended types with relations
export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

export interface ExpenseWithDetails extends Expense {
  paid_by_member: GroupMember
  splits: (ExpenseSplit & { member: GroupMember })[]
}

export interface MemberBalance {
  member: GroupMember
  balance: number // positive = owed money, negative = owes money
  owes: { to: GroupMember; amount: number }[]
  owed: { from: GroupMember; amount: number }[]
}

// Form types
export interface CreateGroupInput {
  name: string
  description?: string
  currency?: string
}

export interface AddMemberInput {
  name: string
  email?: string
  is_temporary?: boolean
}

export interface CreateExpenseInput {
  description: string
  amount: number
  category?: string
  paid_by: string
  split_type: 'equal' | 'exact' | 'percentage'
  splits: { member_id: string; amount?: number; percentage?: number }[]
  date?: string
  notes?: string
}

export interface SettleDebtInput {
  from_member: string
  to_member: string
  amount: number
  notes?: string
}

// Categories
export const EXPENSE_CATEGORIES = [
  { value: 'general', label: 'General', icon: 'receipt' },
  { value: 'food', label: 'Food & Drinks', icon: 'utensils' },
  { value: 'transport', label: 'Transport', icon: 'car' },
  { value: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
  { value: 'entertainment', label: 'Entertainment', icon: 'film' },
  { value: 'utilities', label: 'Utilities', icon: 'zap' },
  { value: 'rent', label: 'Rent', icon: 'home' },
  { value: 'travel', label: 'Travel', icon: 'plane' },
  { value: 'health', label: 'Health', icon: 'heart' },
  { value: 'other', label: 'Other', icon: 'more-horizontal' },
] as const
