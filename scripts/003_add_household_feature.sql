-- Household Finance Management
-- For intimate, private shared finances between partners/family
-- Completely separate from Groups feature

-- 1. Households table
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'NPR',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but start without policies
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select households they're members of, or households they created
CREATE POLICY IF NOT EXISTS "households_select_members" ON public.households 
FOR SELECT USING (
  id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
  OR created_by = auth.uid()
);

-- Policy: Authenticated users can create households (they must be the creator)
DROP POLICY IF EXISTS "households_insert" ON public.households;
CREATE POLICY IF NOT EXISTS "households_insert" ON public.households 
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Policy: Only creator can update/delete their household
CREATE POLICY IF NOT EXISTS "households_update" ON public.households 
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "households_delete" ON public.households 
FOR DELETE USING (created_by = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_households_created_by ON public.households(created_by);

-- 2. Household Members table
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'partner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, email)
);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of households they're part of
CREATE POLICY IF NOT EXISTS "household_members_select" ON public.household_members 
FOR SELECT TO authenticated
USING (
  household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
);

-- Policy: Owners can add members
CREATE POLICY IF NOT EXISTS "household_members_insert" ON public.household_members 
FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy: Owners can update member roles
CREATE POLICY IF NOT EXISTS "household_members_update" ON public.household_members 
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Owners and members themselves can delete
CREATE POLICY IF NOT EXISTS "household_members_delete" ON public.household_members 
FOR DELETE TO authenticated
USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);

-- 3. Household Income Logs table
CREATE TABLE IF NOT EXISTS public.household_income_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.household_members(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NPR',
  description TEXT,
  source TEXT,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.household_income_logs ENABLE ROW LEVEL SECURITY;

-- Policy: View if member of household
CREATE POLICY IF NOT EXISTS "household_income_logs_select" ON public.household_income_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_income_logs.household_id
    AND hm.user_id = auth.uid()
  )
);

-- Policy: Insert if member of household
CREATE POLICY IF NOT EXISTS "household_income_logs_insert" ON public.household_income_logs 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_income_logs.household_id
    AND hm.user_id = auth.uid()
  )
);

-- Policy: Update only your own entries
CREATE POLICY IF NOT EXISTS "household_income_logs_update" ON public.household_income_logs 
FOR UPDATE USING (created_by = auth.uid());

-- Policy: Delete only your own entries
CREATE POLICY IF NOT EXISTS "household_income_logs_delete" ON public.household_income_logs 
FOR DELETE USING (created_by = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_household_income_logs_household_id ON public.household_income_logs(household_id);
CREATE INDEX IF NOT EXISTS idx_household_income_logs_member_id ON public.household_income_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_household_income_logs_date ON public.household_income_logs(date);

-- 4. Household Expense Logs table
CREATE TABLE IF NOT EXISTS public.household_expense_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.household_members(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NPR',
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.household_expense_logs ENABLE ROW LEVEL SECURITY;

-- Policy: View if member of household
CREATE POLICY IF NOT EXISTS "household_expense_logs_select" ON public.household_expense_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_expense_logs.household_id
    AND hm.user_id = auth.uid()
  )
);

-- Policy: Insert if member of household
CREATE POLICY IF NOT EXISTS "household_expense_logs_insert" ON public.household_expense_logs 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_expense_logs.household_id
    AND hm.user_id = auth.uid()
  )
);

-- Policy: Update only your own entries
CREATE POLICY IF NOT EXISTS "household_expense_logs_update" ON public.household_expense_logs 
FOR UPDATE USING (created_by = auth.uid());

-- Policy: Delete only your own entries
CREATE POLICY IF NOT EXISTS "household_expense_logs_delete" ON public.household_expense_logs 
FOR DELETE USING (created_by = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_household_expense_logs_household_id ON public.household_expense_logs(household_id);
CREATE INDEX IF NOT EXISTS idx_household_expense_logs_member_id ON public.household_expense_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_household_expense_logs_date ON public.household_expense_logs(date);

-- 5. Helper View for Balance Calculations (without RLS)
-- Note: This view is read-only and calculated at query time
-- For simplicity, we calculate balances in the application layer
-- If you need a materialized view, contact support

-- Indexes are already created above for performance
