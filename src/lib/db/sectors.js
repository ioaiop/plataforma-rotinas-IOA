import { createClient } from "@/lib/supabase";

export async function getSectors(unitId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("sectors")
    .select("*")
    .eq("unit_id", unitId)
    .order("name");
  return data || [];
}

export async function createSector(name, unitId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("sectors")
    .insert({ name, unit_id: unitId });
  return { error };
}

export async function deleteSector(sectorId) {
  const supabase = createClient();
  const { error } = await supabase.from("sectors").delete().eq("id", sectorId);
  return { error };
}

export async function updateSector(sectorId, name) {
  const supabase = createClient();
  const { error } = await supabase
    .from("sectors")
    .update({ name })
    .eq("id", sectorId);
  return { error };
}
