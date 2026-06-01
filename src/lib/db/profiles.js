import { createClient } from "@/lib/supabase";

export async function getProfiles(unitId, role, sectorId) {
  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("unit_id", unitId)
    .order("full_name");

  if (role === "supervisor" && sectorId) {
    query = query.eq("sector_id", sectorId).eq("role", "employee");
  }

  const { data } = await query;
  return data || [];
}

export async function getProfileById(userId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function getProfilesByIds(ids) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);
  return data || [];
}

export async function updateProfile(userId, profileData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update(profileData)
    .eq("id", userId);
  return { error };
}

export async function uploadAvatar(userId, file) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(`avatars/${fileName}`, file, { upsert: true });
  if (uploadError) return { error: uploadError, url: null };

  const { data: urlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(`avatars/${fileName}`);
  return { error: null, url: urlData.publicUrl };
}
