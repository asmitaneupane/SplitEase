import { SupabaseClient, User } from "@supabase/supabase-js";

export async function claimPendingHouseholdMembership(
  supabase: SupabaseClient,
  user: User,
) {
  if (!user.email) return;

  await supabase
    .from("household_members")
    .update({ user_id: user.id })
    .eq("email", user.email)
    .is("user_id", null);
}
