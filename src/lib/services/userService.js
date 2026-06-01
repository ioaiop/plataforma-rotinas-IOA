import { getUser, getProfile } from "@/lib/auth";
import { getProfiles, updateProfile } from "@/lib/db/profiles";
import { getSectors } from "@/lib/db/sectors";

export async function loadUsersData() {
  const user = await getUser();
  if (!user) return null;
  const profile = await getProfile(user.id);
  const users = await getProfiles(
    profile.unit_id,
    profile.role,
    profile.sector_id,
  );
  const sectors = await getSectors(profile.unit_id);
  return { profile, users, sectors };
}

export async function saveUser(form, editingUser, currentProfile) {
  if (editingUser) {
    const updateData = {
      full_name: form.full_name,
      position: form.position,
      sector_id: form.sector_id || null,
    };
    if (currentProfile?.role === "admin") updateData.role = form.role;
    const { error } = await updateProfile(editingUser.id, updateData);
    return { error: error ? "Erro ao atualizar usuário." : null };
  } else {
    const payload = {
      ...form,
      role: currentProfile?.role === "supervisor" ? "employee" : form.role,
      sector_id:
        currentProfile?.role === "supervisor"
          ? currentProfile.sector_id
          : form.sector_id,
      unit_id: currentProfile.unit_id,
    };
    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    return { error: res.ok ? null : result.error || "Erro ao criar usuário." };
  }
}

export async function removeUser(userId) {
  const res = await fetch("/api/delete-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const result = await res.json();
  return { error: res.ok ? null : result.error || "Erro ao excluir usuário." };
}
