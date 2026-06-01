import { createClient } from "@/lib/supabase";

export async function getAttachments(taskId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");
  return data || [];
}

export async function uploadAttachment(taskId, userId, file) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${taskId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(`tasks/${fileName}`, file);
  if (uploadError) return { error: uploadError };

  const { data: urlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(`tasks/${fileName}`);

  const { error: insertError } = await supabase
    .from("attachments")
    .insert({
      task_id: taskId,
      user_id: userId,
      file_url: urlData.publicUrl,
      file_name: file.name,
    });

  return { error: insertError, url: urlData.publicUrl };
}
