import { getUser, getProfile } from "@/lib/auth";
import { updateTask, getTaskById } from "@/lib/db/tasks";
import { addHistory } from "@/lib/db/history";
import { notifyTaskParticipants } from "@/lib/services/notificationService";
import { addNotification } from "@/lib/db/notifications";
import { addComment, getComments } from "@/lib/db/comments";
import { uploadAttachment, getAttachments } from "@/lib/db/attachments";
import { getMentionedUsers } from "@/lib/db/mentions";
import { extractMentions } from "@/lib/utils/mentions";

export async function checkInTask(task) {
  const user = await getUser();
  const profile = await getProfile(user.id);
  const isAdminOrSupervisor =
    profile?.role === "admin" || profile?.role === "supervisor";
  const newStatus = isAdminOrSupervisor ? "completed" : "waiting_approval";

  await updateTask(task.id, { status: newStatus });
  await addHistory(
    task.id,
    user.id,
    isAdminOrSupervisor
      ? "Tarefa concluída pelo supervisor"
      : "Check-in realizado",
    isAdminOrSupervisor
      ? `Tarefa "${task.title}" concluída e aprovada.`
      : `Tarefa "${task.title}" marcada como concluída. Aguardando aprovação.`,
  );
  await notifyTaskParticipants({
    task_id: task.id,
    exclude_user_id: user.id,
    type: "completed",
    message: isAdminOrSupervisor
      ? `${profile.full_name} concluiu a tarefa "${task.title}"`
      : `${profile.full_name} marcou "${task.title}" como concluída. Aguardando aprovação.`,
  });
  return newStatus;
}

export async function startTask(task) {
  const user = await getUser();
  const profile = await getProfile(user.id);
  await updateTask(task.id, { status: "in_progress" });
  await addHistory(
    task.id,
    user.id,
    "Tarefa em andamento",
    `${profile.full_name} iniciou a tarefa "${task.title}".`,
  );
  await notifyTaskParticipants({
    task_id: task.id,
    exclude_user_id: user.id,
    type: "comment",
    message: `${profile.full_name} iniciou a tarefa "${task.title}".`,
  });
}

export async function notCompleteTask(task, justification) {
  const user = await getUser();
  const profile = await getProfile(user.id);
  await updateTask(task.id, { status: "not_completed", justification });
  await addHistory(
    task.id,
    user.id,
    "Tarefa não concluída",
    `Justificativa: ${justification}`,
  );
  await notifyTaskParticipants({
    task_id: task.id,
    exclude_user_id: user.id,
    type: "not_completed",
    message: `${profile.full_name} marcou "${task.title}" como não concluída.`,
  });
}

export async function approveTask(task) {
  const user = await getUser();
  const profile = await getProfile(user.id);
  await updateTask(task.id, { status: "completed" });
  await addHistory(
    task.id,
    user.id,
    "Tarefa aprovada",
    `Tarefa "${task.title}" aprovada.`,
  );
  await notifyTaskParticipants({
    task_id: task.id,
    exclude_user_id: user.id,
    type: "approved",
    message: `${profile.full_name} aprovou a tarefa "${task.title}"! 🎉`,
  });
}

export async function reopenTask(task) {
  const user = await getUser();
  await updateTask(task.id, { status: "pending", justification: null });
  await addHistory(
    task.id,
    user.id,
    "Tarefa reaberta",
    `Tarefa "${task.title}" reaberta pelo supervisor.`,
  );
}

export async function sendComment(task, content) {
  const user = await getUser();
  const profile = await getProfile(user.id);
  await addComment(task.id, user.id, content.trim());
  await addHistory(task.id, user.id, "Comentário adicionado", content.trim());
  await notifyTaskParticipants({
    task_id: task.id,
    exclude_user_id: user.id,
    type: "comment",
    message: `${profile.full_name} comentou em "${task.title}": ${content.trim().slice(0, 60)}${content.length > 60 ? "..." : ""}`,
  });

  const mentions = extractMentions(content);
  if (mentions.length > 0) {
    const mentionedUsers = await getMentionedUsers(
      mentions.map((m) => m.replace(/_/g, " ")),
    );
    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser.id !== user.id) {
        await addNotification(
          mentionedUser.id,
          task.id,
          "mention",
          `${profile.full_name} mencionou você em "${task.title}"`,
        );
      }
    }
  }

  return await getComments(task.id);
}

export async function addTaskAttachment(task, file) {
  const user = await getUser();
  const { error } = await uploadAttachment(task.id, user.id, file);
  if (error) throw new Error(error.message);
  return await getAttachments(task.id);
}

export async function loadTaskDetails(taskId) {
  const [task, comments, attachments] = await Promise.all([
    getTaskById(taskId),
    getComments(taskId),
    getAttachments(taskId),
  ]);
  return { task, comments, attachments };
}
