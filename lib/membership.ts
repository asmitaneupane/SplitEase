import { SupabaseClient, User } from "@supabase/supabase-js";

export async function claimPendingMemberships(
  supabase: SupabaseClient,
  user: User,
) {
  if (!user.email) return;

  // Claim Household memberships
  await supabase
    .from("household_members")
    .update({ user_id: user.id })
    .eq("email", user.email)
    .is("user_id", null);

  // Claim Group memberships
  await supabase
    .from("group_members")
    .update({ user_id: user.id })
    .eq("email", user.email)
    .is("user_id", null);
}
