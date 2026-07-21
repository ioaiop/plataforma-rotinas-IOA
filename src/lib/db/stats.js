import { createClient } from "@/lib/supabase";

export async function getStatsCount(
  dateStart,
  dateEnd,
  unitId,
  sectorId = null,
) {
  const supabase = createClient();
  let query = supabase
    .from("tasks")
    .select("status", { count: "exact" })
    .lte("date_start", dateEnd)
    .gte("date_end", dateStart)
    .eq("unit_id", unitId);
  if (sectorId) query = query.eq("sector_id", sectorId);
  const { count } = await query;
  return count || 0;
}

export async function getStatsByStatus(
  dateStart,
  dateEnd,
  unitId,
  sectorId = null,
) {
  const supabase = createClient();
  const statuses = [
    "completed",
    "pending",
    "not_completed",
    "in_progress",
    "waiting_approval",
  ];
  const results = {};
  for (const status of statuses) {
    let query = supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .lte("date_start", dateEnd)
      .gte("date_end", dateStart)
      .eq("unit_id", unitId)
      .eq("status", status);
    if (sectorId) query = query.eq("sector_id", sectorId);
    const { count } = await query;
    results[status] = count || 0;
  }
  return results;
}

export async function getTasksByPeriodAndUnit(dateStart, dateEnd, unitId) {
  const supabase = createClient();
  let from = 0;
  let allData = [];
  while (true) {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "status, date_start, date_end, sector_id, assigned_users, assigned_to",
      )
      .lte("date_start", dateEnd)
      .gte("date_end", dateStart)
      .eq("unit_id", unitId)
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < 1000) break;
    from += 1000;
  }
  return allData;
}

export async function getTasksByPeriodAndSector(
  dateStart,
  dateEnd,
  unitId,
  sectorId,
) {
  const supabase = createClient();
  let from = 0;
  let allData = [];
  while (true) {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "status, date_start, date_end, sector_id, assigned_users, assigned_to",
      )
      .lte("date_start", dateEnd)
      .gte("date_end", dateStart)
      .eq("unit_id", unitId)
      .eq("sector_id", sectorId)
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < 1000) break;
    from += 1000;
  }
  return allData;
}

export async function getTasksByPeriodAndUser(
  dateStart,
  dateEnd,
  unitId,
  userId,
) {
  const supabase = createClient();
  let from = 0;
  let allData = [];
  while (true) {
    const { data, error } = await supabase
      .from("tasks")
      .select("status, date_start, date_end, title, sectors(name)")
      .lte("date_start", dateEnd)
      .gte("date_end", dateStart)
      .eq("unit_id", unitId)
      .contains("assigned_users", [userId])
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < 1000) break;
    from += 1000;
  }
  return allData;
}

export async function getProfilesForStats(unitId, sectorId, role) {
  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, sector_id")
    .eq("unit_id", unitId)
    .eq("role", "employee");
  if (role === "supervisor" && sectorId) {
    query = query.eq("sector_id", sectorId);
  }
  const { data } = await query;
  return data || [];
}

export async function getSectorsForStats(unitId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, name")
    .eq("unit_id", unitId)
    .order("name");
  return data || [];
}
