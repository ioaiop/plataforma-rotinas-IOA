import { createClient } from "@/lib/supabase";

export async function getTasksByPeriodAndUnit(dateStart, dateEnd, unitId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select(
      "status, date_start, date_end, sector_id, assigned_users, assigned_to",
    )
    .lte("date_start", dateEnd)
    .gte("date_end", dateStart)
    .eq("unit_id", unitId);
  return data || [];
}

export async function getTasksByPeriodAndSector(
  dateStart,
  dateEnd,
  unitId,
  sectorId,
) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select(
      "status, date_start, date_end, sector_id, assigned_users, assigned_to",
    )
    .lte("date_start", dateEnd)
    .gte("date_end", dateStart)
    .eq("unit_id", unitId)
    .eq("sector_id", sectorId);
  return data || [];
}

export async function getTasksByPeriodAndUser(
  dateStart,
  dateEnd,
  unitId,
  userId,
) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select("status, date_start, date_end, title, sectors(name)")
    .lte("date_start", dateEnd)
    .gte("date_end", dateStart)
    .eq("unit_id", unitId)
    .contains("assigned_users", [userId]);
  return data || [];
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
