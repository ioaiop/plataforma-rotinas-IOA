import { addNotification } from "@/lib/db/notifications";
import { createClient } from "@/lib/supabase";

export async function notifyTaskParticipants({
  task_id,
  exclude_user_id,
  type,
  message,
}) {
  const supabase = createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("assigned_users, assigned_to, created_by")
    .eq("id", task_id)
    .single();

  const { data: commenters } = await supabase
    .from("comments")
    .select("user_id")
    .eq("task_id", task_id);

  const userIds = new Set();
  if (task?.assigned_users?.length > 0) {
    task.assigned_users.forEach((id) => userIds.add(id));
  } else if (task?.assigned_to) {
    userIds.add(task.assigned_to);
  }
  if (task?.created_by) userIds.add(task.created_by);
  commenters?.forEach((c) => userIds.add(c.user_id));
  userIds.delete(exclude_user_id);

  for (const user_id of userIds) {
    await addNotification(user_id, task_id, type, message);
  }
}
