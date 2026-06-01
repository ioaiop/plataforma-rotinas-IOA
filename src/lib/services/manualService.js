import { getUser, getProfile } from "@/lib/auth";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "@/lib/db/manual";

export async function loadManualData() {
  const user = await getUser();
  if (!user) return null;
  const profile = await getProfile(user.id);
  const categories = await getCategories();
  const articles = await getArticles();
  return { profile, categories, articles };
}

export async function saveCategory(form, editingCategory) {
  const user = await getUser();
  if (editingCategory) {
    const { error } = await updateCategory(
      editingCategory.id,
      form.name,
      form.icon,
    );
    return { error: error ? "Erro ao atualizar categoria." : null };
  } else {
    const { error } = await createCategory(form.name, form.icon, user.id);
    return { error: error ? "Erro ao criar categoria." : null };
  }
}

export async function removeCategory(id) {
  const { error } = await deleteCategory(id);
  return { error };
}

export async function saveArticle(form, editingArticle, selectedCategoryId) {
  const user = await getUser();
  if (editingArticle) {
    const { error } = await updateArticle(
      editingArticle.id,
      form.title,
      form.content,
      form.category_id,
    );
    return { error: error ? "Erro ao atualizar artigo." : null };
  } else {
    const { error } = await createArticle(
      form.title,
      form.content,
      form.category_id || selectedCategoryId,
      user.id,
    );
    return { error: error ? "Erro ao criar artigo." : null };
  }
}

export async function removeArticle(id) {
  const { error } = await deleteArticle(id);
  return { error };
}
