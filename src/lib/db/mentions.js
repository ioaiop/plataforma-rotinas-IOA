import { createClient } from "@/lib/supabase";

export async function getMentionedUsers(names) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("full_name", names);
  return data || [];
}
