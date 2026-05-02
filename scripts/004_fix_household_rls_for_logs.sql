-- Fix household income/expense RLS insert failures (42501)
-- Run this in Supabase SQL Editor after script 003.

-- 1) Backfill owner membership rows for existing households missing a member record.
INSERT INTO public.household_members (household_id, user_id, name, email, role)
SELECT
  h.id,
  h.created_by,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'Owner') AS name,
  u.email,
  'owner' AS role
FROM public.households h
LEFT JOIN public.household_members hm
  ON hm.household_id = h.id
  AND hm.user_id = h.created_by
LEFT JOIN auth.users u
  ON u.id = h.created_by
WHERE hm.id IS NULL;

-- 2) Recreate income log policies to allow either member OR household creator.
DROP POLICY IF EXISTS "household_income_logs_select" ON public.household_income_logs;
DROP POLICY IF EXISTS "household_income_logs_insert" ON public.household_income_logs;

CREATE POLICY "household_income_logs_select" ON public.household_income_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = household_income_logs.household_id
      AND hm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_income_logs.household_id
      AND h.created_by = auth.uid()
  )
);

CREATE POLICY "household_income_logs_insert" ON public.household_income_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = household_income_logs.household_id
      AND hm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_income_logs.household_id
      AND h.created_by = auth.uid()
  )
);

-- 3) Recreate expense log policies to allow either member OR household creator.
DROP POLICY IF EXISTS "household_expense_logs_select" ON public.household_expense_logs;
DROP POLICY IF EXISTS "household_expense_logs_insert" ON public.household_expense_logs;

CREATE POLICY "household_expense_logs_select" ON public.household_expense_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = household_expense_logs.household_id
      AND hm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_expense_logs.household_id
      AND h.created_by = auth.uid()
  )
);

CREATE POLICY "household_expense_logs_insert" ON public.household_expense_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = household_expense_logs.household_id
      AND hm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_expense_logs.household_id
      AND h.created_by = auth.uid()
  )
);
