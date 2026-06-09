import { getUser, getProfile } from "@/lib/auth";
import {
  getTasksByPeriodAndUnit,
  getTasksByPeriodAndSector,
  getTasksByPeriodAndUser,
  getProfilesForStats,
  getSectorsForStats,
} from "@/lib/db/stats";

export async function loadStatsData(dateStart, dateEnd, filterSectorId = null) {
  const user = await getUser();
  if (!user) return null;
  const profile = await getProfile(user.id);
  const isAdmin = profile?.role === "admin";
  const isSupervisor = profile?.role === "supervisor";
  const isEmployee = profile?.role === "employee";

  let tasks = [];
  let sectors = [];
  let employees = [];

  if (isEmployee) {
    tasks = await getTasksByPeriodAndUser(
      dateStart,
      dateEnd,
      profile.unit_id,
      user.id,
    );
    return {
      profile,
      tasks,
      sectors: [],
      employees: [],
      isAdmin,
      isSupervisor,
      isEmployee,
    };
  }

  sectors = await getSectorsForStats(profile.unit_id);

  const sectorId = isSupervisor ? profile.sector_id : filterSectorId;

  if (sectorId) {
    tasks = await getTasksByPeriodAndSector(
      dateStart,
      dateEnd,
      profile.unit_id,
      sectorId,
    );
  } else {
    tasks = await getTasksByPeriodAndUnit(dateStart, dateEnd, profile.unit_id);
  }

  employees = await getProfilesForStats(
    profile.unit_id,
    sectorId,
    profile.role,
  );

  return {
    profile,
    tasks,
    sectors,
    employees,
    isAdmin,
    isSupervisor,
    isEmployee,
  };
}
