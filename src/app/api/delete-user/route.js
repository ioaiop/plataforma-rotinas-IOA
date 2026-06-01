import { NextResponse } from "next/server";
import { deleteAuthUser, deleteUserProfile } from "@/lib/db/auth-admin";

export async function POST(request) {
  const { userId } = await request.json();

  const { error: profileError } = await deleteUserProfile(userId);
  if (profileError) {
    return NextResponse.json(
      { error: "Erro ao excluir perfil: " + profileError.message },
      { status: 400 },
    );
  }

  const { error: authError } = await deleteAuthUser(userId);
  if (authError) {
    return NextResponse.json(
      { error: "Erro ao excluir usuário: " + authError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
