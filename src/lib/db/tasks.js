import { createClient } from "@/lib/supabase";

export async function getTasksByDate(
  selectedDate,
  unitId,
  role,
  userId,
  sectorId,
) {
  const supabase = createClient();
  let query = supabase
    .from("tasks")
    .select(
      "*, profiles!tasks_assigned_to_fkey(full_name, avatar_url), sectors(name)",
    )
    .lte("date_start", selectedDate)
    .gte("date_end", selectedDate)
    .eq("unit_id", unitId)
    .order("created_at");

  if (role === "employee") query = query.contains("assigned_users", [userId]);
  if (role === "supervisor") query = query.eq("sector_id", sectorId);

  const { data } = await query;
  return data || [];
}

export async function getTasksByPeriod(dateStart, dateEnd, unitId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*, profiles!tasks_assigned_to_fkey(full_name), sectors(name)")
    .lte("date_start", dateEnd)
    .gte("date_end", dateStart)
    .eq("unit_id", unitId)
    .order("date_start");
  return data || [];
}

export async function getTaskStats(todayStr, unitId, role, userId, sectorId) {
  const supabase = createClient();
  let query = supabase
    .from("tasks")
    .select("status")
    .lte("date_start", todayStr)
    .gte("date_end", todayStr)
    .eq("unit_id", unitId);

  if (role === "supervisor") query = query.eq("sector_id", sectorId);
  if (role === "employee") query = query.contains("assigned_users", [userId]);

  const { data } = await query;
  return data || [];
}

export async function getPerformanceTasks(todayStr, unitId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select("status, assigned_users, assigned_to, sector_id")
    .lte("date_start", todayStr)
    .gte("date_end", todayStr)
    .eq("unit_id", unitId);
  return data || [];
}

export async function getWeekTasks(weekStart, weekEnd, unitId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select("status, date_start, date_end, sector_id")
    .lte("date_start", weekEnd)
    .gte("date_end", weekStart)
    .eq("unit_id", unitId);
  return data || [];
}

export async function getTasksPaginated(
  unitId,
  sectorId,
  role,
  from,
  to,
  filterSectorId = null,
  filterUserId = null,
) {
  const supabase = createClient();
  let query = supabase
    .from("tasks")
    .select("*, profiles!tasks_assigned_to_fkey(full_name), sectors(name)", {
      count: "exact",
    })
    .eq("unit_id", unitId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (role === "supervisor") query = query.eq("sector_id", sectorId);
  if (filterSectorId) query = query.eq("sector_id", filterSectorId);
  if (filterUserId) query = query.contains("assigned_users", [filterUserId]);

  const { data, count } = await query;
  return { data: data || [], count: count || 0 };
}

export async function createTask(taskData) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(taskData)
    .select()
    .single();
  return { data, error };
}

export async function updateTask(taskId, taskData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ ...taskData, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  return { error };
}

export async function deleteTask(taskId) {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  return { error };
}

export async function getTaskById(taskId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select(
      "*, profiles!tasks_assigned_to_fkey(full_name, avatar_url), sectors(name)",
    )
    .eq("id", taskId)
    .single();
  return data;
}
