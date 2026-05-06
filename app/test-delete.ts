import { createClient } from '@/lib/supabase/server'

export async function checkDelete(groupId: string, householdId: string) {
  const supabase = await createClient()
  
  // Try to delete a non-existent group to see the exact error if any
  const res1 = await supabase.from('groups').delete().eq('id', '00000000-0000-0000-0000-000000000000').select()
  console.log('Group delete test:', res1)
}
