import { createClient } from "@/lib/supabase";

export async function getCategories() {
  const supabase = createClient();
  const { data } = await supabase
    .from("manual_categories")
    .select("*")
    .order("created_at", { ascending: true });
  return data || [];
}

export async function createCategory(name, icon, userId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manual_categories")
    .insert({ name, icon, created_by: userId });
  return { error };
}

export async function updateCategory(id, name, icon) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manual_categories")
    .update({ name, icon })
    .eq("id", id);
  return { error };
}

export async function deleteCategory(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manual_categories")
    .delete()
    .eq("id", id);
  return { error };
}

export async function getArticles() {
  const supabase = createClient();
  const { data } = await supabase
    .from("manual_articles")
    .select("*")
    .order("created_at", { ascending: true });
  return data || [];
}

export async function createArticle(title, content, categoryId, userId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manual_articles")
    .insert({ title, content, category_id: categoryId, created_by: userId });
  return { error };
}

export async function updateArticle(id, title, content, categoryId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manual_articles")
    .update({
      title,
      content,
      category_id: categoryId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  return { error };
}

export async function deleteArticle(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manual_articles")
    .delete()
    .eq("id", id);
  return { error };
}
