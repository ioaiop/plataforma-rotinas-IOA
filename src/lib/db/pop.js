import { createClient } from "@/lib/supabase";

export async function getPopCategories(userId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("pop_categories")
    .select("*")
    .contains("user_ids", [userId])
    .order("created_at", { ascending: true });
  return data || [];
}

export async function createPopCategory(name, icon, userIds, createdBy) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pop_categories")
    .insert({ name, icon, user_ids: userIds, created_by: createdBy });
  return { error };
}

export async function updatePopCategory(id, name, icon, userIds) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pop_categories")
    .update({ name, icon, user_ids: userIds })
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
  const { error } = await supabase.from("pop_articles").insert({
    title,
    content,
    category_id: categoryId,
    user_id: userId,
    created_by: createdBy,
  });
  return { error };
}

export async function updatePopArticle(
  id,
  title,
  content,
  categoryId,
  pdfUrl = undefined,
  pdfName = undefined,
) {
  const supabase = createClient();
  const updateData = {
    title,
    content,
    category_id: categoryId,
    updated_at: new Date().toISOString(),
  };
  if (pdfUrl !== undefined) updateData.pdf_url = pdfUrl;
  if (pdfName !== undefined) updateData.pdf_name = pdfName;

  const { error } = await supabase
    .from("pop_articles")
    .update(updateData)
    .eq("id", id);
  return { error };
}

export async function deletePopArticle(id) {
  const supabase = createClient();
  const { error } = await supabase.from("pop_articles").delete().eq("id", id);
  return { error };
}

export async function uploadPopPdf(articleId, file) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${articleId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(`pops/${fileName}`, file, { upsert: true });
  if (uploadError) return { error: uploadError, url: null, name: null };

  const { data: urlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(`pops/${fileName}`);
  return { error: null, url: urlData.publicUrl, name: file.name };
}

export async function removePopPdf(articleId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pop_articles")
    .update({ pdf_url: null, pdf_name: null })
    .eq("id", articleId);
  return { error };
}
