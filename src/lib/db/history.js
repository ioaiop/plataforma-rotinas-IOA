import { createClient } from "@/lib/supabase";

export async function getHistory(unitId, role, userId, limit = 200) {
  const supabase = createClient();
  let query = supabase
    .from("history")
    .select("*, profiles(full_name, avatar_url), tasks!inner(title, unit_id)")
    .eq("tasks.unit_id", unitId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (role === "employee") query = query.eq("user_id", userId);

  const { data } = await query;
  return data || [];
}

export async function getRecentHistory(unitId, role, userId, sectorId) {
  const supabase = createClient();
  let query = supabase
    .from("history")
    .select("*, profiles(full_name), tasks!inner(title, sector_id, unit_id)")
    .eq("tasks.unit_id", unitId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (role === "employee") query = query.eq("user_id", userId);
  if (role === "supervisor") query = query.eq("tasks.sector_id", sectorId);

  const { data } = await query;
  return data || [];
}

export async function addHistory(taskId, userId, action, details) {
  const supabase = createClient();
  await supabase
    .from("history")
    .insert({ task_id: taskId, user_id: userId, action, details });
}
