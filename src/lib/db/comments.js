import { createClient } from "@/lib/supabase";

export async function getComments(taskId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("*, profiles(full_name, avatar_url)")
    .eq("task_id", taskId)
    .order("created_at");
  return data || [];
}

export async function addComment(taskId, userId, content) {
  const supabase = createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ task_id: taskId, user_id: userId, content });
  return { error };
}
