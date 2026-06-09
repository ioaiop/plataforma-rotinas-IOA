import { getUser, getProfile } from "@/lib/auth";
import {
  getPopCategories,
  createPopCategory,
  updatePopCategory,
  deletePopCategory,
  getPopArticles,
  createPopArticle,
  updatePopArticle,
  deletePopArticle,
} from "@/lib/db/pop";
import { getProfiles } from "@/lib/db/profiles";

export async function loadPopData(targetUserId) {
  const user = await getUser();
  if (!user) return null;
  const profile = await getProfile(user.id);
  const isAdminOrSupervisor =
    profile?.role === "admin" || profile?.role === "supervisor";

  // Funcionário só vê os próprios POPs
  const userId = isAdminOrSupervisor ? targetUserId : user.id;

  const [categories, articles] = await Promise.all([
    getPopCategories(userId),
    getPopArticles(userId),
  ]);

  return { profile, categories, articles, isAdminOrSupervisor };
}

export async function loadPopUsers(unitId, sectorId, role) {
  const users = await getProfiles(unitId, role, sectorId);
  return users.filter((u) => u.role === "employee");
}

export async function savePopCategory(form, editingCategory, targetUserId) {
  const user = await getUser();
  if (!user) return { error: "Usuário não autenticado." };

  if (editingCategory) {
    const { error } = await updatePopCategory(
      editingCategory.id,
      form.name,
      form.icon,
    );
    return { error: error ? "Erro ao atualizar categoria." : null };
  } else {
    const { error } = await createPopCategory(
      form.name,
      form.icon,
      targetUserId,
      user.id,
    );
    return { error: error ? "Erro ao criar categoria." : null };
  }
}

export async function removePopCategory(id) {
  const { error } = await deletePopCategory(id);
  return { error };
}

export async function savePopArticle(
  form,
  editingArticle,
  selectedCategoryId,
  targetUserId,
) {
  const user = await getUser();
  if (!user) return { error: "Usuário não autenticado." };

  if (editingArticle) {
    const { error } = await updatePopArticle(
      editingArticle.id,
      form.title,
      form.content,
      form.category_id,
    );
    return { error: error ? "Erro ao atualizar artigo." : null };
  } else {
    const { error } = await createPopArticle(
      form.title,
      form.content,
      form.category_id || selectedCategoryId,
      targetUserId,
      user.id,
    );
    return { error: error ? "Erro ao criar artigo." : null };
  }
}

export async function removePopArticle(id) {
  const { error } = await deletePopArticle(id);
  return { error };
}
