import { createClient } from "@/lib/supabase";

export function subscribeToComments(taskId, onNewComment) {
  const supabase = createClient();

  const channel = supabase
    .channel(`comments:${taskId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `task_id=eq.${taskId}`,
      },
      async (payload) => {
        // Busca o perfil do autor do comentário
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", payload.new.user_id)
          .single();

        const comment = {
          ...payload.new,
          profiles: profile,
        };

        onNewComment(comment);
      },
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromComments(channel) {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
