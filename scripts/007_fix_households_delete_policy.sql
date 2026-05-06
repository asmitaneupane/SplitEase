-- Fix households delete policy
DROP POLICY IF EXISTS "households_delete" ON public.households;
CREATE POLICY "households_delete" ON public.households FOR DELETE USING (created_by = auth.uid());
