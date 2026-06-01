import { getUser, getProfile } from "@/lib/auth";
import { getHistory } from "@/lib/db/history";
import { getProfiles } from "@/lib/db/profiles";

export async function loadHistoryData() {
  const user = await getUser();
  if (!user) return null;
  const profile = await getProfile(user.id);
  const history = await getHistory(profile.unit_id, profile.role, user.id);
  let users = [];
  if (profile.role !== "employee") {
    users = await getProfiles(profile.unit_id, "admin", null);
  }
  return { profile, history, users };
}
