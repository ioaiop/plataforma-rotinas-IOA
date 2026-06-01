import { createClient } from "@/lib/supabase";

export async function getNotifications(userId) {
  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*, tasks(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

export async function markNotificationRead(notifId) {
  const supabase = createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", notifId);
}

export async function markAllNotificationsRead(userId) {
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId);
}

export async function addNotification(userId, taskId, type, message) {
  const supabase = createClient();
  await supabase
    .from("notifications")
    .insert({ user_id: userId, task_id: taskId, type, message });
}

export async function notifyUsers(userIds, taskId, type, message) {
  for (const userId of userIds) {
    await addNotification(userId, taskId, type, message);
  }
}
