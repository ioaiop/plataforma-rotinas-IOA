import { getUser, getProfile } from "@/lib/auth";
import { updateProfile, uploadAvatar } from "@/lib/db/profiles";

export async function loadProfile() {
  const user = await getUser();
  if (!user) return null;
  return await getProfile(user.id);
}

export async function saveProfile(profileData, avatarFile) {
  const user = await getUser();
  if (!user) return { error: "Usuário não autenticado." };

  let avatar_url = profileData.avatar_url;

  if (avatarFile) {
    const { error, url } = await uploadAvatar(user.id, avatarFile);
    if (error) return { error: "Erro ao enviar foto." };
    avatar_url = url;
  }

  const { error } = await updateProfile(user.id, {
    full_name: profileData.full_name,
    position: profileData.position,
    avatar_url,
  });

  return { error: error ? "Erro ao salvar perfil." : null, avatar_url };
}
