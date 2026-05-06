-- Fix RLS policies to allow Group Creators to delete groups with other users' expenses
-- Run this in your Supabase SQL Editor

-- 1. Expenses Table
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE 
  USING (
    created_by = auth.uid() OR 
    group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
  );

-- 2. Expense Splits Table
DROP POLICY IF EXISTS "expense_splits_delete" ON public.expense_splits;
CREATE POLICY "expense_splits_delete" ON public.expense_splits FOR DELETE 
  USING (
    expense_id IN (SELECT id FROM public.expenses WHERE created_by = auth.uid() OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid()))
  );

-- 3. Settlements Table
DROP POLICY IF EXISTS "settlements_delete" ON public.settlements;
CREATE POLICY "settlements_delete" ON public.settlements FOR DELETE 
  USING (
    created_by = auth.uid() OR 
    group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
  );

-- 4. Activities Table
DROP POLICY IF EXISTS "activities_delete" ON public.activities;
CREATE POLICY "activities_delete" ON public.activities FOR DELETE 
  USING (
    user_id = auth.uid() OR 
    group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
  );

-- 5. Household Income Logs Table
DROP POLICY IF EXISTS "household_income_logs_delete" ON public.household_income_logs;
CREATE POLICY "household_income_logs_delete" ON public.household_income_logs FOR DELETE 
  USING (
    created_by = auth.uid() OR 
    household_id IN (SELECT id FROM public.households WHERE created_by = auth.uid())
  );

-- 6. Household Expense Logs Table
DROP POLICY IF EXISTS "household_expense_logs_delete" ON public.household_expense_logs;
CREATE POLICY "household_expense_logs_delete" ON public.household_expense_logs FOR DELETE 
  USING (
    created_by = auth.uid() OR 
    household_id IN (SELECT id FROM public.households WHERE created_by = auth.uid())
  );
