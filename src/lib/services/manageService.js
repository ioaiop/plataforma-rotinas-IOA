import { getUser, getProfile } from "@/lib/auth";
import {
  createTask,
  updateTask,
  deleteTask,
  getTasksPaginated,
} from "@/lib/db/tasks";
import {
  createSector,
  getSectors,
  deleteSector,
  getSectorUsers,
  getSectorTasks,
} from "@/lib/db/sectors";
import { getProfiles } from "@/lib/db/profiles";
import { addHistory } from "@/lib/db/history";
import { addNotification } from "@/lib/db/notifications";

export async function checkAndRemoveSector(sectorId) {
  const [users, tasks] = await Promise.all([
    getSectorUsers(sectorId),
    getSectorTasks(sectorId),
  ]);

  const mensagens = [];
  if (users.length > 0)
    mensagens.push(
      `${users.length} funcionário(s) vinculado(s): ${users.map((u) => u.full_name).join(", ")}`,
    );
  if (tasks.length > 0)
    mensagens.push(`${tasks.length} tarefa(s) vinculada(s)`);

  if (mensagens.length > 0) {
    return {
      error: `Não é possível excluir este setor pois possui ${mensagens.join(" e ")}. Remova os vínculos antes de excluir.`,
    };
  }

  const { error } = await deleteSector(sectorId);
  return { error: error ? "Erro ao excluir setor." : null };
}

export async function loadManageData(currentPage, itemsPerPage) {
  const user = await getUser();
  const profile = await getProfile(user.id);
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;
  const { data: tasks, count } = await getTasksPaginated(
    profile.unit_id,
    profile.sector_id,
    profile.role,
    from,
    to,
  );
  const users = await getProfiles(profile.unit_id, "admin", null);
  const sectors = await getSectors(profile.unit_id);
  return { profile, tasks, count, users, sectors };
}

export async function removeSector(sectorId) {
  const { error } = await deleteSector(sectorId);
  return { error };
}

export async function saveTask(form, editingTask, currentProfile) {
  const user = await getUser();
  if (!user) return { error: "Usuário não autenticado." };

  if (editingTask) {
    const { error } = await updateTask(editingTask.id, {
      title: form.title,
      description: form.description,
      sector_id: form.sector_id || null,
      assigned_to: form.assigned_users?.[0] || null,
      assigned_users: form.assigned_users || [],
      date_start: form.date_start,
      date_end: form.date_end || form.date_start,
    });
    if (error) return { error: "Erro ao atualizar tarefa." };
    await addHistory(
      editingTask.id,
      user.id,
      "Tarefa editada",
      `Tarefa "${form.title}" foi editada.`,
    );
    return { error: null };
  }

  if (!form.date_start) return { error: "Selecione pelo menos uma data." };

  const { data, error } = await createTask({
    title: form.title,
    description: form.description,
    sector_id: form.sector_id || null,
    assigned_to: form.assigned_users?.[0] || null,
    assigned_users: form.assigned_users || [],
    date_start: form.date_start,
    date_end: form.date_end || form.date_start,
    created_by: user.id,
    status: "pending",
    unit_id: currentProfile.unit_id,
  });

  if (error) return { error: "Erro ao criar tarefa." };

  await addHistory(
    data.id,
    user.id,
    "Tarefa criada",
    `Tarefa "${form.title}" foi criada.`,
  );

  const profile = await getProfile(user.id);
  for (const userId of form.assigned_users || []) {
    await addNotification(
      userId,
      data.id,
      "comment",
      `${profile.full_name} atribuiu a tarefa "${form.title}" para você.`,
    );
  }

  return { error: null };
}

export async function removeTask(taskId) {
  const { error } = await deleteTask(taskId);
  return { error };
}

export async function addSector(name, unitId) {
  const { error } = await createSector(name, unitId);
  return { error };
}
