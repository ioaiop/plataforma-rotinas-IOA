import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function createAuthUser(email, password) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  return { data, error };
}

export async function deleteAuthUser(userId) {
  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  return { error };
}

export async function createUserProfile(
  id,
  full_name,
  email,
  role,
  position,
  sector_id,
  unit_id,
) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("profiles").insert({
    id,
    full_name,
    email,
    role,
    position,
    sector_id: sector_id || null,
    unit_id: unit_id || null,
  });
  return { error };
}

export async function deleteUserProfile(userId) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  return { error };
}
