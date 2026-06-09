import { createClient } from "@/lib/supabase";

export async function getPopCategories(userId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("pop_categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function createPopCategory(name, icon, userId, createdBy) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pop_categories")
    .insert({ name, icon, user_id: userId, created_by: createdBy });
  return { error };
}

export async function updatePopCategory(id, name, icon) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pop_categories")
    .update({ name, icon })
    .eq("id", id);
  return { error };
}

export async function deletePopCategory(id) {
  const supabase = createClient();
  const { error } = await supabase.from("pop_categories").delete().eq("id", id);
  return { error };
}

export async function getPopArticles(userId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("pop_articles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function createPopArticle(
  title,
  content,
  categoryId,
  userId,
  createdBy,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pop_articles")
    .insert({
      title,
      content,
      category_id: categoryId,
      user_id: userId,
      created_by: createdBy,
    });
  return { error };
}

export async function updatePopArticle(id, title, content, categoryId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pop_articles")
    .update({
      title,
      content,
      category_id: categoryId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  return { error };
}

export async function deletePopArticle(id) {
  const supabase = createClient();
  const { error } = await supabase.from("pop_articles").delete().eq("id", id);
  return { error };
}
